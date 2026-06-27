import { NextRequest, NextResponse } from "next/server"
import { resolvePublicTenant, tenantErrorResponse } from "@/lib/tenant"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const { db: supabase, tenantId } = await resolvePublicTenant(req)

    const [{ data: produtosData }, { data: config }] = await Promise.all([
      supabase
        .from("produtos")
        .select("id, nome, descricao, valor, categoria, tamanhos, disponivel")
        .eq("tenant_id", tenantId)
        .order("nome"),
      supabase
        .from("configuracoes")
        .select("whatsapp_admin")
        .eq("tenant_id", tenantId)
        .eq("id", 1)
        .maybeSingle(),
    ])

    return NextResponse.json({
      produtos: produtosData ?? [],
      whatsapp_admin: config?.whatsapp_admin ?? "",
    })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
