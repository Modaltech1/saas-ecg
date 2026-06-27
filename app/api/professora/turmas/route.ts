import { NextResponse } from "next/server"
import { requireTenantContext, tenantErrorResponse } from "@/lib/tenant"

export const runtime = "nodejs"

export async function GET() {
  try {
    const { db, tenantId, userId } = await requireTenantContext(["professora"])

    const { data: vinculadas } = await db
      .from("turmas_professoras")
      .select("turma_id")
      .eq("tenant_id", tenantId)
      .eq("professora_id", userId)

    const turmaIds = (vinculadas ?? []).map((v: any) => v.turma_id)
    if (turmaIds.length === 0) return NextResponse.json({ turmas: [], professoraId: userId })

    const mesAtual = new Date().toISOString().slice(0, 7)

    const { data: turmas, error } = await db
      .from("turmas")
      .select(`
        id, nome, nivel, mensalidade, polo_id, local_id,
        polos ( id, nome ),
        locais ( id, nome ),
        horarios ( id, dia_semana, hora_inicio, hora_fim ),
        alunas ( id, nome, status )
      `)
      .eq("tenant_id", tenantId)
      .in("id", turmaIds)
      .eq("ativo", true)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const todasAlunaIds = (turmas ?? []).flatMap((t: any) =>
      (t.alunas ?? []).filter((a: any) => a.status === "Ativa").map((a: any) => a.id),
    )

    const { data: pendentes } = todasAlunaIds.length > 0
      ? await db
          .from("pagamentos_mensalidade")
          .select("aluna_id")
          .eq("tenant_id", tenantId)
          .in("aluna_id", todasAlunaIds)
          .eq("mes_referencia", mesAtual)
          .eq("status", "Pendente")
      : { data: [] }

    const alunasPendentes = new Set((pendentes ?? []).map((p: any) => p.aluna_id))

    const result = (turmas ?? []).map((t: any) => ({
      id: t.id,
      nome: t.nome,
      nivel: t.nivel,
      mensalidade: t.mensalidade,
      polo_id: t.polo_id,
      polo_nome: t.polos?.nome ?? "",
      local_nome: t.locais?.nome ?? "",
      horarios: t.horarios ?? [],
      n_alunas: (t.alunas ?? []).filter((a: any) => a.status === "Ativa").length,
      n_pendentes: (t.alunas ?? []).filter((a: any) => alunasPendentes.has(a.id)).length,
      alunas: (t.alunas ?? []).filter((a: any) => a.status === "Ativa"),
    }))

    return NextResponse.json({ turmas: result, professoraId: userId })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
