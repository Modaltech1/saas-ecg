import { NextResponse } from "next/server"
import { requireTenantContext, tenantErrorResponse } from "@/lib/tenant"

export async function GET() {
  try {
    const { db: supabase, tenantId } = await requireTenantContext()

    const { data, error } = await supabase
      .from("perfis")
      .select("id, nome, email, ativo")
      .eq("tenant_id", tenantId)
      .eq("papel", "professora")
      .eq("ativo", true)
      .order("nome")

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ professoras: data ?? [] })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
