import { NextRequest, NextResponse } from "next/server"
import { requireTenantContext, tenantErrorResponse, withTenant } from "@/lib/tenant"

export const runtime = "nodejs"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { db, tenantId } = await requireTenantContext()

    const { data: evento, error } = await db
      .from("eventos")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .single()

    if (error || !evento) return NextResponse.json({ error: "Evento nao encontrado" }, { status: 404 })

    const { data: inscricoes } = await db
      .from("inscricoes_evento")
      .select("id, nome_aluna, cpf_aluna, turma, inscrito_em, pago")
      .eq("tenant_id", tenantId)
      .eq("evento_id", id)
      .order("nome_aluna", { ascending: true })

    return NextResponse.json({ evento, inscricoes: inscricoes ?? [] })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { db, tenantId } = await requireTenantContext()

    const payload: Partial<{
      nome: string
      descricao: string | null
      data_evento: string
      local: string | null
      taxa_inscricao: number
      ativo: boolean
    }> = {}

    if ("nome" in body) payload.nome = body.nome
    if ("descricao" in body) payload.descricao = body.descricao
    if ("data_evento" in body) payload.data_evento = body.data_evento
    if ("local" in body) payload.local = body.local
    if ("taxa_inscricao" in body) payload.taxa_inscricao = body.taxa_inscricao

    if ("ativo" in body) {
      if (typeof body.ativo !== "boolean") {
        return NextResponse.json({ error: "Campo ativo deve ser booleano" }, { status: 400 })
      }

      payload.ativo = body.ativo
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "Nenhum campo valido para atualizar" }, { status: 400 })
    }

    const { data, error } = await db
      .from("eventos")
      .update(withTenant(payload, tenantId))
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ evento: data })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { db, tenantId } = await requireTenantContext()

    const { error } = await db
      .from("eventos")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
