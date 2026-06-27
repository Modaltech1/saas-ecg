import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { withTenant } from "@/lib/tenant"

export const runtime = "nodejs"

function parseCorrelationId(correlationId: string) {
  const parts = correlationId.split("-")
  const lastPart = parts[parts.length - 1]
  const hasTimestamp = /^\d{13}$/.test(lastPart)
  return (hasTimestamp ? parts.slice(1, -1) : parts.slice(1)).join("-")
}

async function markMatriculasPaid(
  supabase: ReturnType<typeof createAdminClient>,
  rows: Array<{ id: string; aluna_id: string; tenant_id: string }>,
  paidAt: string,
  paidDate: string,
) {
  for (const row of rows) {
    await supabase
      .from("alunas")
      .update(withTenant({ taxa_matricula_paga: true }, row.tenant_id))
      .eq("tenant_id", row.tenant_id)
      .eq("id", row.aluna_id)
  }

  return rows.length > 0
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const invoiceId: string = body?.id ?? ""
    const correlationId: string = body?.code ?? ""
    const status: string = body?.status ?? ""
    const paidAt: string = body?.payment?.paid_at ?? new Date().toISOString()
    const paidDate: string = paidAt.slice(0, 10)

    if (status !== "PAID") {
      return NextResponse.json({ received: true, action: "ignored", status })
    }

    const supabase = createAdminClient()
    let atualizado = false

    if (invoiceId) {
      const { data: mens } = await supabase
        .from("pagamentos_mensalidade")
        .update({ status: "Pago", pago_em: paidAt, data_pagamento: paidDate })
        .eq("txid_cora", invoiceId)
        .eq("status", "Pendente")
        .select("id, tenant_id")

      atualizado = atualizado || Boolean(mens && mens.length > 0)

      const { data: mat } = await supabase
        .from("pagamentos_matricula")
        .update({ status: "Pago", pago_em: paidAt, data_pagamento: paidDate })
        .eq("txid_cora", invoiceId)
        .eq("status", "Pendente")
        .select("id, aluna_id, tenant_id")

      if (mat && mat.length > 0) {
        atualizado = await markMatriculasPaid(supabase, mat, paidAt, paidDate) || atualizado
      }
    }

    if (!atualizado && correlationId) {
      const parsedId = parseCorrelationId(correlationId)

      if (correlationId.startsWith("mens-")) {
        const { data: mens } = await supabase
          .from("pagamentos_mensalidade")
          .update({ status: "Pago", pago_em: paidAt, data_pagamento: paidDate })
          .eq("id", parsedId)
          .eq("status", "Pendente")
          .select("id, tenant_id")

        atualizado = atualizado || Boolean(mens && mens.length > 0)
      } else if (correlationId.startsWith("mat-")) {
        const { data: mat } = await supabase
          .from("pagamentos_matricula")
          .update({ status: "Pago", pago_em: paidAt, data_pagamento: paidDate })
          .eq("id", parsedId)
          .eq("status", "Pendente")
          .select("id, aluna_id, tenant_id")

        if (mat && mat.length > 0) {
          atualizado = await markMatriculasPaid(supabase, mat, paidAt, paidDate) || atualizado
        }
      } else if (correlationId.startsWith("total-")) {
        const { data: aluna } = await supabase
          .from("alunas")
          .select("id, tenant_id")
          .eq("id", parsedId)
          .maybeSingle()

        if (aluna?.tenant_id) {
          const tenantId = aluna.tenant_id
          const { data: mens } = await supabase
            .from("pagamentos_mensalidade")
            .update(withTenant({ status: "Pago", pago_em: paidAt, data_pagamento: paidDate }, tenantId))
            .eq("tenant_id", tenantId)
            .eq("aluna_id", parsedId)
            .eq("status", "Pendente")
            .select("id, tenant_id")

          atualizado = atualizado || Boolean(mens && mens.length > 0)

          const { data: mat } = await supabase
            .from("pagamentos_matricula")
            .update(withTenant({ status: "Pago", pago_em: paidAt, data_pagamento: paidDate }, tenantId))
            .eq("tenant_id", tenantId)
            .eq("aluna_id", parsedId)
            .eq("status", "Pendente")
            .select("id, aluna_id, tenant_id")

          if (mat && mat.length > 0) {
            atualizado = await markMatriculasPaid(supabase, mat, paidAt, paidDate) || atualizado
          }
        }
      }
    }

    return NextResponse.json({
      received: true,
      action: atualizado ? "updated" : "not_found",
      invoiceId,
      correlationId,
    })
  } catch (err) {
    console.error("[Cora Webhook]", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
