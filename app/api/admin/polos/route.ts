import { NextRequest, NextResponse } from "next/server"
import { requireTenantContext, tenantErrorResponse, withTenant } from "@/lib/tenant"

export const runtime = "nodejs"

export async function GET() {
  try {
    const { db: supabase, tenantId } = await requireTenantContext()
    const { data, error } = await supabase
      .from("polos")
      .select("id, nome, cidade, observacoes, ativo, locais ( id )")
      .eq("tenant_id", tenantId)
      .order("nome")

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ polos: data ?? [] })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { db: supabase, tenantId } = await requireTenantContext()
    const body = await req.json()
    const { data, error } = await supabase
      .from("polos")
      .insert(withTenant(body, tenantId))
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
