import { NextResponse } from "next/server"
import { getTenantCoraConfig, toCoraCredentials } from "@/lib/cora-config"
import { testarConexaoCora } from "@/lib/cora"
import { requireTenantContext, TenantAccessError, tenantErrorResponse } from "@/lib/tenant"

export const runtime = "nodejs"

export async function POST() {
  try {
    const { db, tenantId } = await requireTenantContext(["owner", "admin", "colaborador"])
    const config = await getTenantCoraConfig(db, tenantId)

    if (!config) {
      return NextResponse.json({ ok: false, erro: "Configuracao Cora nao encontrada para este tenant." }, { status: 400 })
    }

    const resultado = await testarConexaoCora(toCoraCredentials(config))
    return NextResponse.json(resultado)
  } catch (error) {
    if (error instanceof TenantAccessError) return tenantErrorResponse(error)
    if (error instanceof Error) {
      return NextResponse.json({ ok: false, erro: error.message }, { status: 500 })
    }
    return tenantErrorResponse(error)
  }
}
