import { NextRequest, NextResponse } from "next/server"
import { requireTenantContext, tenantErrorResponse, withTenant } from "@/lib/tenant"

export const runtime = "nodejs"

export async function GET() {
  try {
    const { db: supabase, tenantId } = await requireTenantContext()
    const { data, error } = await supabase
      .from("turmas")
      .select(`
        id, nome, nivel, mensalidade, acrescimo, taxa_matricula, idade_alvo, ativo,
        polo_id, local_id,
        polos ( id, nome ),
        locais ( id, nome ),
        horarios ( id, dia_semana, hora_inicio, hora_fim ),
        alunas ( id ),
        turmas_professoras ( id, professora_id, tipo_pagamento, valor ),
        custos_turma ( id, descricao, categoria, tipo, valor )
      `)
      .eq("tenant_id", tenantId)
      .order("nome")

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ turmas: data ?? [] })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { db: supabase, tenantId } = await requireTenantContext()
    const { professoras = [], custos = [], horarios = [], ...turmaData } = await req.json()

    const { data: turma, error } = await supabase
      .from("turmas")
      .insert(withTenant(turmaData, tenantId))
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const turma_id = turma.id

    const professorasValidas = professoras.filter((p: any) => p.professora_id)
    if (professorasValidas.length > 0) {
      const { error: erroProf } = await supabase
        .from("turmas_professoras")
        .insert(professorasValidas.map((p: any) => withTenant({
          turma_id,
          professora_id: p.professora_id,
          tipo_pagamento: p.tipo_pagamento,
          valor: p.valor,
        }, tenantId)))

      if (erroProf) return NextResponse.json({ error: erroProf.message }, { status: 400 })
    }

    const custosValidos = custos.filter((c: any) => c.descricao && c.valor != null)
    if (custosValidos.length > 0) {
      const { error: erroCustos } = await supabase
        .from("custos_turma")
        .insert(custosValidos.map((c: any) => withTenant({
          turma_id,
          descricao: c.descricao,
          categoria: c.categoria,
          tipo: c.tipo,
          valor: c.valor,
        }, tenantId)))

      if (erroCustos) return NextResponse.json({ error: erroCustos.message }, { status: 400 })
    }

    const horariosValidos = horarios.filter((h: any) => h.dia_semana && h.hora_inicio && h.hora_fim)
    if (horariosValidos.length > 0) {
      const { error: erroHorarios } = await supabase
        .from("horarios")
        .insert(horariosValidos.map((h: any) => withTenant({
          turma_id,
          dia_semana: h.dia_semana,
          hora_inicio: h.hora_inicio,
          hora_fim: h.hora_fim,
        }, tenantId)))

      if (erroHorarios) return NextResponse.json({ error: erroHorarios.message }, { status: 400 })
    }

    return NextResponse.json(turma, { status: 201 })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
