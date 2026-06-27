import { NextRequest, NextResponse } from "next/server"
import { requireTenantContext, tenantErrorResponse, withTenant } from "@/lib/tenant"

export const runtime = "nodejs"

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]

export async function GET(req: NextRequest) {
  try {
    const { db, tenantId, userId } = await requireTenantContext(["professora"])
    const view = req.nextUrl.searchParams.get("view") ?? "hoje"

    const { data: vinculadas } = await db
      .from("turmas_professoras")
      .select("turma_id")
      .eq("tenant_id", tenantId)
      .eq("professora_id", userId)

    const turmaIds = (vinculadas ?? []).map((v: any) => v.turma_id)
    if (turmaIds.length === 0) {
      return NextResponse.json({ horarios: [], chamadas: [], turmas: [], historico: [] })
    }

    const { data: turmas } = await db
      .from("turmas")
      .select("id, nome, nivel, alunas ( id, nome, status )")
      .eq("tenant_id", tenantId)
      .in("id", turmaIds)
      .eq("ativo", true)

    const turmasComAlunas = (turmas ?? []).map((t: any) => ({
      ...t,
      alunas: (t.alunas ?? []).filter((a: any) => a.status === "Ativa"),
    }))

    if (view === "hoje") {
      const hoje = new Date().toISOString().split("T")[0]
      const diaHoje = DIAS_SEMANA[new Date().getDay()]

      const { data: horarios } = await db
        .from("horarios")
        .select("id, turma_id, dia_semana, hora_inicio, hora_fim, turmas ( nome, nivel )")
        .eq("tenant_id", tenantId)
        .in("turma_id", turmaIds)
        .eq("dia_semana", diaHoje)

      const horariosFormatados = (horarios ?? []).map((h: any) => {
        const turma = turmasComAlunas.find((t: any) => t.id === h.turma_id)
        return {
          id: h.id,
          turma_id: h.turma_id,
          turma_nome: h.turmas?.nome ?? "",
          turma_nivel: h.turmas?.nivel ?? "",
          dia_semana: h.dia_semana,
          hora_inicio: h.hora_inicio?.slice(0, 5) ?? "",
          hora_fim: h.hora_fim?.slice(0, 5) ?? "",
          n_alunas: turma?.alunas.length ?? 0,
        }
      })

      const { data: chamadasHoje } = await db
        .from("chamadas")
        .select("id, turma_id, horario_id, data, encerrada")
        .eq("tenant_id", tenantId)
        .in("turma_id", turmaIds)
        .eq("data", hoje)
        .eq("professora_id", userId)

      const chamadasFormatadas = await Promise.all(
        (chamadasHoje ?? []).map(async (c: any) => {
          const { data: pres } = await db
            .from("presencas")
            .select("status")
            .eq("tenant_id", tenantId)
            .eq("chamada_id", c.id)

          return {
            id: c.id,
            turma_id: c.turma_id,
            horario_id: c.horario_id,
            data: c.data,
            encerrada: c.encerrada,
            n_presentes: (pres ?? []).filter((p: any) => p.status === "presente").length,
            n_ausentes: (pres ?? []).filter((p: any) => p.status === "ausente").length,
            n_justificadas: (pres ?? []).filter((p: any) => p.status === "justificada").length,
          }
        }),
      )

      return NextResponse.json({
        horarios: horariosFormatados,
        chamadas: chamadasFormatadas,
        turmas: turmasComAlunas,
      })
    }

    const { data: historico } = await db
      .from("chamadas")
      .select("id, turma_id, horario_id, data, encerrada")
      .eq("tenant_id", tenantId)
      .in("turma_id", turmaIds)
      .eq("professora_id", userId)
      .eq("encerrada", true)
      .order("data", { ascending: false })
      .limit(100)

    const historicoFormatado = await Promise.all(
      (historico ?? []).map(async (c: any) => {
        const turma = turmasComAlunas.find((t: any) => t.id === c.turma_id)

        const { data: horario } = await db
          .from("horarios")
          .select("hora_inicio, hora_fim")
          .eq("tenant_id", tenantId)
          .eq("id", c.horario_id)
          .maybeSingle()

        const { data: pres } = await db
          .from("presencas")
          .select("aluna_id, status, observacao")
          .eq("tenant_id", tenantId)
          .eq("chamada_id", c.id)

        const presencasComNome = (pres ?? []).map((p: any) => {
          const aluna = turma?.alunas.find((a: any) => a.id === p.aluna_id)
          return {
            aluna_id: p.aluna_id,
            aluna_nome: aluna?.nome ?? "-",
            status: p.status,
            observacao: p.observacao ?? null,
          }
        })

        return {
          id: c.id,
          turma_id: c.turma_id,
          turma_nome: turma?.nome ?? "",
          horario_id: c.horario_id,
          hora_inicio: horario?.hora_inicio?.slice(0, 5) ?? null,
          hora_fim: horario?.hora_fim?.slice(0, 5) ?? null,
          data: c.data,
          n_presentes: presencasComNome.filter((p: any) => p.status === "presente").length,
          n_ausentes: presencasComNome.filter((p: any) => p.status === "ausente").length,
          n_justificadas: presencasComNome.filter((p: any) => p.status === "justificada").length,
          presencas: presencasComNome,
        }
      }),
    )

    return NextResponse.json({ historico: historicoFormatado, turmas: turmasComAlunas })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { db, tenantId, userId } = await requireTenantContext(["professora"])
    const body = await req.json()
    const { turma_id, horario_id, data: dataAula, presencas } = body

    const { data: vinculo } = await db
      .from("turmas_professoras")
      .select("turma_id")
      .eq("tenant_id", tenantId)
      .eq("turma_id", turma_id)
      .eq("professora_id", userId)
      .maybeSingle()

    if (!vinculo) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

    const { data: chamada, error: errChamada } = await db
      .from("chamadas")
      .upsert(
        withTenant({ turma_id, professora_id: userId, horario_id, data: dataAula, encerrada: true }, tenantId),
        { onConflict: "tenant_id,turma_id,data,horario_id" },
      )
      .select("id")
      .single()

    if (errChamada || !chamada) {
      return NextResponse.json({ error: errChamada?.message ?? "Erro ao criar chamada" }, { status: 400 })
    }

    if (Array.isArray(presencas) && presencas.length > 0) {
      const rows = presencas.map((p: any) => withTenant({
        chamada_id: chamada.id,
        aluna_id: p.aluna_id,
        status: p.status,
        observacao: p.observacao ?? null,
      }, tenantId))
      const { error } = await db.from("presencas").upsert(rows, { onConflict: "chamada_id,aluna_id" })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, id: chamada.id })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
