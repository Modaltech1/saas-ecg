import { NextRequest, NextResponse } from "next/server"
import { requireTenantContext, tenantErrorResponse, withTenant } from "@/lib/tenant"

export const runtime = "nodejs"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { db: supabase, tenantId } = await requireTenantContext()
    const { data, error } = await supabase
      .from("turmas")
      .select(`
        id, nome, nivel, mensalidade, acrescimo, taxa_matricula, idade_alvo, ativo,
        polo_id, local_id,
        polos ( id, nome ),
        locais ( id, nome ),
        horarios ( id, dia_semana, hora_inicio, hora_fim ),
        alunas ( id, nome, status ),
        turmas_professoras ( id, professora_id, tipo_pagamento, valor, perfis:professora_id ( nome ) ),
        custos_turma ( id, descricao, categoria, tipo, valor )
      `)
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json(data)
  } catch (error) {
    return tenantErrorResponse(error)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { db: supabase, tenantId } = await requireTenantContext()
    const { professoras = [], custos = [], horarios = [], ...turmaData } = await req.json()

    const { data, error } = await supabase
      .from("turmas")
      .update(withTenant(turmaData, tenantId))
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await supabase.from("turmas_professoras").delete().eq("tenant_id", tenantId).eq("turma_id", id)
    const profRows = professoras.filter((p: any) => p.professora_id)
    if (profRows.length > 0) {
      const { error: erroProf } = await supabase.from("turmas_professoras").insert(
        profRows.map((p: any) => withTenant({
          turma_id: id,
          professora_id: p.professora_id,
          tipo_pagamento: p.tipo_pagamento,
          valor: p.valor,
        }, tenantId)),
      )
      if (erroProf) return NextResponse.json({ error: erroProf.message }, { status: 400 })
    }

    await supabase.from("custos_turma").delete().eq("tenant_id", tenantId).eq("turma_id", id)
    const custosValidos = custos.filter((c: any) => c.descricao && c.valor != null)
    if (custosValidos.length > 0) {
      const { error: erroCustos } = await supabase.from("custos_turma").insert(
        custosValidos.map((c: any) => withTenant({
          turma_id: id,
          descricao: c.descricao,
          categoria: c.categoria ?? "Outro",
          tipo: c.tipo ?? "fixo",
          valor: Number(c.valor),
        }, tenantId)),
      )
      if (erroCustos) return NextResponse.json({ error: erroCustos.message }, { status: 400 })
    }

    await supabase.from("horarios").delete().eq("tenant_id", tenantId).eq("turma_id", id)
    const horariosValidos = horarios.filter((h: any) => h.dia_semana && h.hora_inicio && h.hora_fim)
    if (horariosValidos.length > 0) {
      const { error: erroHorarios } = await supabase.from("horarios").insert(
        horariosValidos.map((h: any) => withTenant({
          turma_id: id,
          dia_semana: h.dia_semana,
          hora_inicio: h.hora_inicio,
          hora_fim: h.hora_fim,
        }, tenantId)),
      )
      if (erroHorarios) return NextResponse.json({ error: erroHorarios.message }, { status: 400 })
    }

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
      .from("turmas")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
