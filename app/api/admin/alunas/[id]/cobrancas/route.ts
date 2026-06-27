import { NextRequest, NextResponse } from "next/server"
import { requireTenantContext, tenantErrorResponse, withTenant } from "@/lib/tenant"

export const runtime = "nodejs"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: alunaId } = await params
    const { db, tenantId } = await requireTenantContext()
    const body = await req.json()
    const { turma_id, mes_referencia } = body

    if (!mes_referencia) {
      return NextResponse.json({ error: "mes_referencia e obrigatorio" }, { status: 400 })
    }
    if ("valor" in body) {
      return NextResponse.json(
        { error: "valor nao pode ser informado manualmente; ele e calculado automaticamente." },
        { status: 400 },
      )
    }

    const { data: existente } = await db
      .from("pagamentos_mensalidade")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("aluna_id", alunaId)
      .eq("mes_referencia", mes_referencia)
      .maybeSingle()

    if (existente) {
      return NextResponse.json(
        { error: `Ja existe uma cobranca para ${mes_referencia} nesta aluna.` },
        { status: 409 },
      )
    }

    const turmaIdSelecionada = turma_id ?? null
    const { data: alunaComTurma, error: erroAluna } = await db
      .from("alunas")
      .select("id, turma_id, desconto_percentual")
      .eq("tenant_id", tenantId)
      .eq("id", alunaId)
      .single()

    if (erroAluna || !alunaComTurma) {
      return NextResponse.json({ error: "Aluna nao encontrada" }, { status: 404 })
    }

    const turmaAtivaId = turmaIdSelecionada ?? alunaComTurma.turma_id
    if (!turmaAtivaId) {
      return NextResponse.json({ error: "Aluna sem turma vinculada para calcular cobranca" }, { status: 400 })
    }

    const { data: turmaSelecionada } = await db
      .from("turmas")
      .select("mensalidade")
      .eq("tenant_id", tenantId)
      .eq("id", turmaAtivaId)
      .maybeSingle()

    if (!turmaSelecionada) {
      return NextResponse.json({ error: "Turma nao encontrada para calculo da cobranca" }, { status: 400 })
    }

    const mensalidade = Number(turmaSelecionada?.mensalidade ?? 0)
    const descontoRaw = Number(alunaComTurma.desconto_percentual ?? 0)
    const desconto = Number.isFinite(descontoRaw) ? Math.min(100, Math.max(0, descontoRaw)) : 0
    const valorBase = mensalidade * (1 - desconto / 100)
    const valorFinal = Number(valorBase.toFixed(2))

    if (valorFinal <= 0) {
      return NextResponse.json({ error: "valor da cobranca deve ser maior que zero" }, { status: 400 })
    }

    const { data, error } = await db
      .from("pagamentos_mensalidade")
      .insert(withTenant({
        aluna_id: alunaId,
        turma_id: turmaAtivaId,
        mes_referencia,
        valor: valorFinal,
        status: "Pendente",
      }, tenantId))
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ cobranca: data }, { status: 201 })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
