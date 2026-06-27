import { NextRequest, NextResponse } from "next/server"
import { requireTenantContext, tenantErrorResponse, withTenant } from "@/lib/tenant"

export const runtime = "nodejs"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { db: supabase, tenantId } = await requireTenantContext()
    const body = await req.json()
    const { data, error } = await supabase
      .from("produtos")
      .update(withTenant(body, tenantId))
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (error) {
    return tenantErrorResponse(error)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { db: supabase, tenantId } = await requireTenantContext()
    const { error } = await supabase
      .from("produtos")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
