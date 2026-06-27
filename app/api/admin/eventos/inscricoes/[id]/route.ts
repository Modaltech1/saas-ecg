import { NextRequest, NextResponse } from "next/server"
import { requireTenantContext, tenantErrorResponse, withTenant } from "@/lib/tenant"

export const runtime = "nodejs"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const pago: boolean = Boolean(body.pago)
    const { db, tenantId } = await requireTenantContext()

    const { data, error } = await db
      .from("inscricoes_evento")
      .update(withTenant({ pago }, tenantId))
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select("id, pago")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ inscricao: data })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
