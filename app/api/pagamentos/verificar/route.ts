import { NextRequest, NextResponse } from "next/server"
import { consultarCobrancaCora, type CoraCredentials } from "@/lib/cora"
import { getTenantCoraConfig, toCoraCredentials, type TenantCoraConfig } from "@/lib/cora-config"
import { createAdminClient } from "@/lib/supabase/server"
import { resolvePublicTenant, TenantAccessError, tenantErrorResponse, withTenant } from "@/lib/tenant"

export const runtime = "nodejs"

async function verificarTenant(
  db: ReturnType<typeof createAdminClient>,
  tenantId: string,
  credentials: CoraCredentials,
  alunaId?: string | null,
) {
  const mensalidadeQuery = db
    .from("pagamentos_mensalidade")
    .select("id, aluna_id, valor, txid_cora, status, pix_status")
    .eq("tenant_id", tenantId)
    .eq("status", "Pendente")
    .not("txid_cora", "is", null)

  const matriculaQuery = db
    .from("pagamentos_matricula")
    .select("id, aluna_id, valor, txid_cora, status, pix_status")
    .eq("tenant_id", tenantId)
    .eq("status", "Pendente")
    .not("txid_cora", "is", null)

  if (alunaId) {
    mensalidadeQuery.eq("aluna_id", alunaId)
    matriculaQuery.eq("aluna_id", alunaId)
  }

  const [{ data: mens }, { data: mat }] = await Promise.all([
    mensalidadeQuery,
    matriculaQuery,
  ])

  const pendentes = [
    ...(mens ?? []).map((m) => ({ ...m, tabela: "pagamentos_mensalidade" as const })),
    ...(mat ?? []).map((m) => ({ ...m, tabela: "pagamentos_matricula" as const })),
  ]

  const resultados: { id: string; tabela: string; acao: string; coraStatus: string; tenantId: string }[] = []

  for (const pag of pendentes) {
    try {
      const cobranca = await consultarCobrancaCora(pag.txid_cora!, credentials)
      const coraStatus = cobranca.status ?? "UNKNOWN"

      if (coraStatus === "PAID") {
        const paidAt = (cobranca as any).payment?.paid_at ?? new Date().toISOString()
        await db
          .from(pag.tabela)
          .update(withTenant({
            status: "Pago",
            pix_status: "PAID",
            data_pagamento: paidAt,
            pago_em: paidAt,
          }, tenantId))
          .eq("tenant_id", tenantId)
          .eq("id", pag.id)

        if (pag.tabela === "pagamentos_matricula") {
          await db
            .from("alunas")
            .update(withTenant({ taxa_matricula_paga: true }, tenantId))
            .eq("tenant_id", tenantId)
            .eq("id", pag.aluna_id)
        }
        resultados.push({ id: pag.id, tabela: pag.tabela, acao: "pago", coraStatus, tenantId })
      } else if (coraStatus === "CANCELLED" || coraStatus === "EXPIRED" || coraStatus === "OVERDUE") {
        await db
          .from(pag.tabela)
          .update(withTenant({
            status: "Pendente",
            pix_status: coraStatus,
            txid_cora: null,
            link_pagamento: null,
          }, tenantId))
          .eq("tenant_id", tenantId)
          .eq("id", pag.id)

        resultados.push({ id: pag.id, tabela: pag.tabela, acao: "expirado", coraStatus, tenantId })
      } else {
        await db
          .from(pag.tabela)
          .update(withTenant({ pix_status: coraStatus }, tenantId))
          .eq("tenant_id", tenantId)
          .eq("id", pag.id)

        resultados.push({ id: pag.id, tabela: pag.tabela, acao: "sem_mudanca", coraStatus, tenantId })
      }
    } catch (err) {
      console.error(`[verificar-pagamentos] tenant=${tenantId} id=${pag.id}:`, err)
      resultados.push({ id: pag.id, tabela: pag.tabela, acao: "erro", coraStatus: "ERROR", tenantId })
    }
  }

  return resultados
}

export async function POST(req: NextRequest) {
  try {
    let alunaId: string | null = null
    try {
      const body = await req.json()
      alunaId = body?.alunaId ?? null
    } catch {
      // sem body = varredura global de cron
    }

    if (alunaId) {
      const { db, tenantId } = await resolvePublicTenant(req)
      const config = await getTenantCoraConfig(db, tenantId)
      if (!config || !config.ativo) {
        return NextResponse.json({ verificados: 0, resultados: [] })
      }

      const resultados = await verificarTenant(db, tenantId, toCoraCredentials(config), alunaId)
      return NextResponse.json({ verificados: resultados.length, resultados })
    }

    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const db = createAdminClient()
    const { data: configs, error } = await db
      .from("tenant_cora_configuracoes")
      .select("tenant_id, ambiente, ativo, client_id, private_key_pem, certificate_pem, webhook_url, webhook_secret")
      .eq("ativo", true)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const resultados = []
    for (const config of (configs ?? []) as TenantCoraConfig[]) {
      resultados.push(...await verificarTenant(db, config.tenant_id, toCoraCredentials(config), null))
    }

    return NextResponse.json({
      verificados: resultados.length,
      resultados,
    })
  } catch (error) {
    if (error instanceof TenantAccessError) return tenantErrorResponse(error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return tenantErrorResponse(error)
  }
}
