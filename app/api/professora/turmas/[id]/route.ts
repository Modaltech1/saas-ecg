import { NextRequest, NextResponse } from "next/server"
import { requireTenantContext, tenantErrorResponse } from "@/lib/tenant"

export const runtime = "nodejs"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: turmaId } = await params
    const { db, tenantId, userId } = await requireTenantContext(["professora"])

    const { data: vinculo } = await db
      .from("turmas_professoras")
      .select("turma_id")
      .eq("tenant_id", tenantId)
      .eq("turma_id", turmaId)
      .eq("professora_id", userId)
      .maybeSingle()

    if (!vinculo) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

    const { data: turma } = await db
      .from("turmas")
      .select("id, nome, nivel, mensalidade, polo_id, local_id, polos(nome), locais(nome)")
      .eq("tenant_id", tenantId)
      .eq("id", turmaId)
      .single()

    if (!turma) return NextResponse.json({ error: "Turma nao encontrada" }, { status: 404 })

    const { data: horarios } = await db
      .from("horarios")
      .select("id, dia_semana, hora_inicio, hora_fim")
      .eq("tenant_id", tenantId)
      .eq("turma_id", turmaId)
      .order("dia_semana")

    const { data: alunas } = await db
      .from("alunas")
      .select("id, nome, data_nascimento, status, responsavel_id, responsaveis(nome, whatsapp)")
      .eq("tenant_id", tenantId)
      .eq("turma_id", turmaId)
      .order("nome")

    const alunaIds = (alunas || []).map((a: any) => a.id)
    let pendenciasPorAluna: Record<string, { total: number; count: number }> = {}

    if (alunaIds.length > 0) {
      const { data: pendencias } = await db
        .from("pagamentos_mensalidade")
        .select("aluna_id, valor")
        .eq("tenant_id", tenantId)
        .in("aluna_id", alunaIds)
        .eq("status", "Pendente")

      for (const p of pendencias || []) {
        if (!pendenciasPorAluna[p.aluna_id]) pendenciasPorAluna[p.aluna_id] = { total: 0, count: 0 }
        pendenciasPorAluna[p.aluna_id].total += p.valor
        pendenciasPorAluna[p.aluna_id].count += 1
      }
    }

    return NextResponse.json({
      turma,
      horarios: horarios || [],
      alunas: (alunas || []).map((a: any) => ({
        ...a,
        valorPendente: pendenciasPorAluna[a.id]?.total || 0,
        qtdPendente: pendenciasPorAluna[a.id]?.count || 0,
      })),
    })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
