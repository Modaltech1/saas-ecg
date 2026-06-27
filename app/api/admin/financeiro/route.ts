import { NextRequest, NextResponse } from "next/server"
import { requireTenantContext, tenantErrorResponse } from "@/lib/tenant"
import { one } from "@/lib/supabase/relations"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const mes = searchParams.get("mes") ?? new Date().toISOString().slice(0, 7)
    const polo = searchParams.get("polo") ?? ""
    const local = searchParams.get("local") ?? ""
    const turmaFilter = searchParams.get("turma") ?? ""
    const { db: supabase, tenantId } = await requireTenantContext()

    let turmasQuery = supabase
      .from("turmas")
      .select(`
        id, nome, polo_id, local_id, mensalidade, acrescimo, taxa_matricula,
        polos(nome), locais(nome),
        turmas_professoras(professora_id, tipo_pagamento, valor),
        custos_turma(id, descricao, categoria, tipo, valor)
      `)
      .eq("tenant_id", tenantId)

    if (polo) turmasQuery = turmasQuery.eq("polo_id", polo)
    if (local) turmasQuery = turmasQuery.eq("local_id", local)
    if (turmaFilter) turmasQuery = turmasQuery.eq("id", turmaFilter)

    const { data: turmas } = await turmasQuery
    const turmaIds = (turmas ?? []).map((t: any) => t.id)

    if (turmaIds.length === 0) {
      return NextResponse.json({
        total_esperado: 0,
        total_recebido: 0,
        total_matriculas: 0,
        total_custos: 0,
        total_salarios_previstos: 0,
        total_salarios_pagos: 0,
        pendencias_anteriores: [],
        mensalidades_por_turma: [],
        matriculas: [],
        custos_por_categoria: [],
        salarios: [],
      })
    }

    const { data: alunas } = await supabase
      .from("alunas")
      .select("id, nome, turma_id")
      .eq("tenant_id", tenantId)
      .in("turma_id", turmaIds)

    const alunaIds = (alunas ?? []).map((a: any) => a.id)
    const empty = { data: [] as any[] }

    const [{ data: mensalidadesMes }, { data: pagMatriculas }, { data: pendencias }] = alunaIds.length > 0
      ? await Promise.all([
          supabase
            .from("pagamentos_mensalidade")
            .select("id, valor, status, mes_referencia, aluna_id, pago_em, data_pagamento")
            .eq("tenant_id", tenantId)
            .in("aluna_id", alunaIds)
            .eq("mes_referencia", mes),
          supabase
            .from("pagamentos_matricula")
            .select("id, aluna_id, turma_id, valor, status, criado_em")
            .eq("tenant_id", tenantId)
            .in("aluna_id", alunaIds),
          supabase
            .from("pagamentos_mensalidade")
            .select("id, valor, mes_referencia, aluna_id, alunas(nome)")
            .eq("tenant_id", tenantId)
            .in("aluna_id", alunaIds)
            .lt("mes_referencia", mes)
            .eq("status", "Pendente"),
        ])
      : [empty, empty, empty]

    const pendenciasFormatadas = (pendencias ?? []).map((p: any) => ({
      id: p.id,
      valor: p.valor,
      mes_referencia: p.mes_referencia,
      aluna_nome: one<any>(p.alunas)?.nome ?? "-",
    }))

    const mensalidadesPorTurma = (turmas ?? []).map((t: any) => {
      const alunasDaTurma = (alunas ?? []).filter((a: any) => a.turma_id === t.id)
      const pags = (mensalidadesMes ?? []).filter((p: any) => alunasDaTurma.find((a: any) => a.id === p.aluna_id))
      const esperado = pags.reduce((s: number, p: any) => s + Number(p.valor), 0)
      const recebido = pags.filter((p: any) => p.status === "Pago").reduce((s: number, p: any) => s + Number(p.valor), 0)
      return {
        turma_id: t.id,
        turma_nome: t.nome,
        polo_nome: one<any>(t.polos)?.nome ?? "-",
        local_nome: one<any>(t.locais)?.nome ?? "-",
        n_alunas: alunasDaTurma.length,
        esperado,
        recebido,
        pendente: esperado - recebido,
      }
    })

    const matriculasMes = (pagMatriculas ?? []).filter((m: any) => {
      const dt = new Date(m.criado_em)
      const dtMes = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`
      return dtMes === mes
    }).map((m: any) => {
      const aluna = (alunas ?? []).find((a: any) => a.id === m.aluna_id)
      const turma = (turmas ?? []).find((t: any) => t.id === (m.turma_id ?? aluna?.turma_id))
      return {
        id: m.id,
        nome: aluna?.nome ?? "-",
        turma_nome: turma?.nome ?? "-",
        polo_nome: one<any>(turma?.polos)?.nome ?? "-",
        taxa_matricula: Number(m.valor),
        status: m.status,
      }
    })

    const diaCorte = 20
    const [anoMes, mesMes] = mes.split("-").map(Number)
    const dataCorteAtual = new Date(anoMes, mesMes - 1, diaCorte)
    const mesAnterior = mesMes === 1 ? `${anoMes - 1}-12` : `${anoMes}-${String(mesMes - 1).padStart(2, "0")}`

    const [{ data: pagProf }, { data: professoras }, { data: mensalidadesMesAnterior }] = await Promise.all([
      supabase
        .from("pagamentos_professora")
        .select("id, professora_id, turma_id, valor, status, mes_referencia, competencia_base")
        .eq("tenant_id", tenantId)
        .eq("mes_referencia", mes),
      supabase
        .from("perfis")
        .select("id, nome")
        .eq("tenant_id", tenantId)
        .eq("papel", "professora"),
      alunaIds.length > 0
        ? supabase
            .from("pagamentos_mensalidade")
            .select("id, valor, status, mes_referencia, aluna_id, pago_em, data_pagamento")
            .eq("tenant_id", tenantId)
            .in("aluna_id", alunaIds)
            .eq("mes_referencia", mesAnterior)
            .eq("status", "Pago")
        : Promise.resolve(empty),
    ])

    const salarios = (professoras ?? []).map((prof: any) => {
      const turmasDaProf = (turmas ?? []).filter((t: any) =>
        t.turmas_professoras?.find((p: any) => p.professora_id === prof.id),
      )

      const salarioPrevisto = turmasDaProf.reduce((s: number, t: any) => {
        const cfg = t.turmas_professoras?.find((p: any) => p.professora_id === prof.id)
        if (!cfg) return s

        if (cfg.tipo_pagamento === "fixo") {
          return s + Number(cfg.valor)
        }

        const alunasDaTurma = (alunas ?? []).filter((a: any) => a.turma_id === t.id)
        const receitaAteCorte = (mensalidadesMes ?? [])
          .filter((p: any) => {
            if (!alunasDaTurma.find((a: any) => a.id === p.aluna_id)) return false
            if (p.status !== "Pago") return false
            const pagoEm = p.pago_em ? new Date(p.pago_em) : (p.data_pagamento ? new Date(p.data_pagamento) : null)
            return !pagoEm || pagoEm <= dataCorteAtual
          })
          .reduce((ss: number, p: any) => ss + Number(p.valor), 0)

        const dataCorteAnterior = new Date(anoMes, mesMes - 2, diaCorte)
        const receitaAposCorteAnterior = (mensalidadesMesAnterior ?? [])
          .filter((p: any) => {
            if (!alunasDaTurma.find((a: any) => a.id === p.aluna_id)) return false
            const pagoEm = p.pago_em ? new Date(p.pago_em) : (p.data_pagamento ? new Date(p.data_pagamento) : null)
            return Boolean(pagoEm && pagoEm > dataCorteAnterior)
          })
          .reduce((ss: number, p: any) => ss + Number(p.valor), 0)

        const receitaBase = receitaAteCorte + receitaAposCorteAnterior
        return s + (receitaBase * Number(cfg.valor)) / 100
      }, 0)

      const pagamento = (pagProf ?? []).find((p: any) => p.professora_id === prof.id)
      return {
        id: prof.id,
        nome: prof.nome,
        n_turmas: turmasDaProf.length,
        salario_previsto: salarioPrevisto,
        salario_pago: pagamento?.status === "Pago" ? Number(pagamento.valor) : 0,
        pago: pagamento?.status === "Pago",
        pagamento_id: pagamento?.id ?? null,
      }
    })

    const categoriaMap = new Map<string, { categoria: string; total: number; itens: any[] }>()
    ;(turmas ?? []).forEach((t: any) => {
      const alunasDaTurma = (alunas ?? []).filter((a: any) => a.turma_id === t.id)
      const dataCorteAnterior = new Date(anoMes, mesMes - 2, diaCorte)

      const ateCorte = (mensalidadesMes ?? [])
        .filter((p: any) => {
          if (!alunasDaTurma.find((a: any) => a.id === p.aluna_id)) return false
          if (p.status !== "Pago") return false
          const pagoEm = p.pago_em ? new Date(p.pago_em) : (p.data_pagamento ? new Date(p.data_pagamento) : null)
          return !pagoEm || pagoEm <= dataCorteAtual
        })
        .reduce((ss: number, p: any) => ss + Number(p.valor), 0)

      const aposAnterior = (mensalidadesMesAnterior ?? [])
        .filter((p: any) => {
          if (!alunasDaTurma.find((a: any) => a.id === p.aluna_id)) return false
          const pagoEm = p.pago_em ? new Date(p.pago_em) : (p.data_pagamento ? new Date(p.data_pagamento) : null)
          return pagoEm && pagoEm > dataCorteAnterior
        })
        .reduce((ss: number, p: any) => ss + Number(p.valor), 0)

      const receitaBaseParaCusto = ateCorte + aposAnterior

      ;(t.custos_turma ?? []).forEach((c: any) => {
        const valorReal = c.tipo === "percentual"
          ? (receitaBaseParaCusto * Number(c.valor)) / 100
          : Number(c.valor)
        const cat = c.categoria ?? "Outro"
        if (!categoriaMap.has(cat)) categoriaMap.set(cat, { categoria: cat, total: 0, itens: [] })
        const entry = categoriaMap.get(cat)!
        entry.total += valorReal
        entry.itens.push({ turma: t.nome, descricao: c.descricao, tipo: c.tipo, valor: valorReal })
      })
    })

    const custosPorCategoria = Array.from(categoriaMap.values())
    const totalCustos = custosPorCategoria.reduce((s, c) => s + c.total, 0)
    const totalEsperado = mensalidadesPorTurma.reduce((s, t) => s + t.esperado, 0)
    const totalRecebido = mensalidadesPorTurma.reduce((s, t) => s + t.recebido, 0)
    const totalMatriculas = matriculasMes.filter((m: any) => m.status === "Pago").reduce((s: number, m: any) => s + Number(m.taxa_matricula), 0)
    const totalSalariosPrevistos = salarios.reduce((s, p) => s + p.salario_previsto, 0)
    const totalSalariosPagos = salarios.reduce((s, p) => s + p.salario_pago, 0)

    return NextResponse.json({
      total_esperado: totalEsperado,
      total_recebido: totalRecebido,
      total_matriculas: totalMatriculas,
      total_custos: totalCustos,
      total_salarios_previstos: totalSalariosPrevistos,
      total_salarios_pagos: totalSalariosPagos,
      pendencias_anteriores: pendenciasFormatadas,
      mensalidades_por_turma: mensalidadesPorTurma,
      matriculas: matriculasMes,
      custos_por_categoria: custosPorCategoria,
      salarios,
    })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
