import { NextRequest, NextResponse } from "next/server"
import { requireTenantContext, tenantErrorResponse, withTenant } from "@/lib/tenant"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const { db: supabase, tenantId } = await requireTenantContext()
    const { professora_id, mes_referencia, valor } = await req.json()

    if (!professora_id || !mes_referencia || valor == null) {
      return NextResponse.json({ error: "professora_id, mes_referencia e valor sao obrigatorios" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("pagamentos_professora")
      .upsert(
        withTenant({
          professora_id,
          mes_referencia,
          valor,
          status: "Pago",
          data_pagamento: new Date().toISOString().split("T")[0],
        }, tenantId),
        { onConflict: "tenant_id,professora_id,mes_referencia" },
      )
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ pagamento: data })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { db: supabase, tenantId } = await requireTenantContext()
    const { professora_id, mes_referencia } = await req.json()

    const { error } = await supabase
      .from("pagamentos_professora")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("professora_id", professora_id)
      .eq("mes_referencia", mes_referencia)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
