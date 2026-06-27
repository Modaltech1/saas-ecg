import { NextRequest, NextResponse } from "next/server"
import { getTenantCoraConfig, toCoraPublicConfig, upsertTenantCoraConfig } from "@/lib/cora-config"
import { requireTenantContext, tenantErrorResponse, withTenant } from "@/lib/tenant"

export const runtime = "nodejs"

export async function GET() {
  try {
    const { db: supabase, tenantId } = await requireTenantContext()

    const [{ data: config, error }, coraConfig] = await Promise.all([
      supabase
        .from("configuracoes")
        .select("whatsapp_admin")
        .eq("tenant_id", tenantId)
        .eq("id", 1)
        .maybeSingle(),
      getTenantCoraConfig(supabase, tenantId),
    ])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      whatsapp_admin: config?.whatsapp_admin ?? "",
      ...toCoraPublicConfig(coraConfig),
    })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { db: supabase, tenantId } = await requireTenantContext()
    const body = await req.json()

    const updates: Record<string, unknown> = {
      atualizado_em: new Date().toISOString(),
    }

    if (body.whatsapp_admin !== undefined) updates.whatsapp_admin = body.whatsapp_admin

    const { error } = await supabase
      .from("configuracoes")
      .upsert(withTenant({ id: 1, ...updates }, tenantId), { onConflict: "tenant_id,id" })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await upsertTenantCoraConfig(supabase, tenantId, {
      cora_ambiente: body.cora_ambiente,
      cora_ativo: body.cora_ativo,
      cora_client_id: body.cora_client_id,
      cora_private_key: body.cora_private_key,
      cora_certificate: body.cora_certificate,
      cora_webhook_url: body.cora_webhook_url,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
