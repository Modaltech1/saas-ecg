import { NextRequest, NextResponse } from "next/server"
import { consultarCobrancaCora } from "@/lib/cora"
import { requireTenantCoraCredentials } from "@/lib/cora-config"
import { resolvePublicTenant, TenantAccessError, tenantErrorResponse } from "@/lib/tenant"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const invoiceId = req.nextUrl.searchParams.get("invoiceId")
    const alunaId = req.nextUrl.searchParams.get("alunaId")

    if (!invoiceId || !alunaId) {
      return NextResponse.json({ error: "invoiceId e alunaId sao obrigatorios" }, { status: 400 })
    }

    const { db, tenantId } = await resolvePublicTenant(req)
    const credentials = await requireTenantCoraCredentials(db, tenantId)

    const [mensResp, matResp] = await Promise.all([
      db
        .from("pagamentos_mensalidade")
        .select("id, valor")
        .eq("tenant_id", tenantId)
        .eq("aluna_id", alunaId)
        .eq("status", "Pendente")
        .eq("txid_cora", invoiceId),
      db
        .from("pagamentos_matricula")
        .select("id, valor")
        .eq("tenant_id", tenantId)
        .eq("aluna_id", alunaId)
        .eq("status", "Pendente")
        .eq("txid_cora", invoiceId),
    ])

    if (mensResp.error || matResp.error) {
      return NextResponse.json(
        { error: mensResp.error?.message ?? matResp.error?.message ?? "Erro ao buscar pagamentos" },
        { status: 500 },
      )
    }

    const vinculados = [...(mensResp.data ?? []), ...(matResp.data ?? [])]

    if (vinculados.length === 0) {
      return NextResponse.json({ error: "PIX nao encontrado ou ja nao esta pendente" }, { status: 404 })
    }

    const cobranca = await consultarCobrancaCora(invoiceId, credentials)
    const pixEmv = cobranca.pix?.emv ?? null
    const paymentUrl = cobranca.payment_options?.bank_slip?.url ?? null

    return NextResponse.json({
      invoiceId,
      pixCopyPaste: pixEmv,
      pixQrCode: pixEmv,
      paymentUrl,
      valorReais: vinculados.reduce((s, p) => s + Number(p.valor ?? 0), 0),
      descricao: "PIX pendente",
      pagamentoIds: vinculados.map((p) => p.id),
    })
  } catch (error) {
    if (error instanceof TenantAccessError) return tenantErrorResponse(error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return tenantErrorResponse(error)
  }
}
