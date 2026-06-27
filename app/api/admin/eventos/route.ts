import { NextRequest, NextResponse } from "next/server"
import { requireTenantContext, tenantErrorResponse, withTenant } from "@/lib/tenant"

export const runtime = "nodejs"

export async function GET() {
  try {
    const { db, tenantId } = await requireTenantContext()
    const { data: eventos, error } = await db
      .from("eventos")
      .select(`
        id, nome, descricao, data_evento, local, taxa_inscricao, ativo, criado_em,
        inscricoes_evento(count)
      `)
      .eq("tenant_id", tenantId)
      .order("data_evento", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const eventosMapped = (eventos ?? []).map((e: any) => ({
      ...e,
      total_inscritos: e.inscricoes_evento?.[0]?.count ?? 0,
      inscricoes_evento: undefined,
    }))

    return NextResponse.json({ eventos: eventosMapped })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { db, tenantId } = await requireTenantContext()
    const body = await req.json()
    const { nome, descricao, data_evento, local, taxa_inscricao } = body

    if (!nome || !data_evento) {
      return NextResponse.json({ error: "Nome e data sao obrigatorios" }, { status: 400 })
    }

    const { data, error } = await db
      .from("eventos")
      .insert(withTenant({ nome, descricao, data_evento, local, taxa_inscricao: taxa_inscricao ?? 0 }, tenantId))
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ evento: data }, { status: 201 })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
