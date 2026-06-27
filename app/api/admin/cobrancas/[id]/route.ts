import { NextRequest, NextResponse } from "next/server"
import { requireTenantContext, tenantErrorResponse, withTenant } from "@/lib/tenant"

export const runtime = "nodejs"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { db: supabase, tenantId } = await requireTenantContext()
    const body = await req.json()
    const { status, data_pagamento } = body

    if (!status) {
      return NextResponse.json({ error: "status e obrigatorio" }, { status: 400 })
    }

    const updatePayload: Record<string, any> = {
      status: status === "pago" ? "Pago" : status,
    }

    if (data_pagamento) {
      updatePayload.data_pagamento = data_pagamento
    }

    const { data, error } = await supabase
      .from("pagamentos_mensalidade")
      .update(withTenant(updatePayload, tenantId))
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ pagamento: data })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { db: supabase, tenantId } = await requireTenantContext()

    const { data: cobranca, error: erroBusca } = await supabase
      .from("pagamentos_mensalidade")
      .select("id, status")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .maybeSingle()

    if (erroBusca) return NextResponse.json({ error: erroBusca.message }, { status: 500 })
    if (!cobranca) return NextResponse.json({ error: "Cobranca nao encontrada" }, { status: 404 })

    const status = String(cobranca.status ?? "").toLowerCase()
    if (status !== "pendente") {
      return NextResponse.json(
        { error: "So e permitido excluir mensalidades pendentes." },
        { status: 400 },
      )
    }

    const { error } = await supabase
      .from("pagamentos_mensalidade")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
