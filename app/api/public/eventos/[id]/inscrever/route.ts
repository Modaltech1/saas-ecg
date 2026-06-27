import { NextRequest, NextResponse } from "next/server"
import { resolvePublicTenant, tenantErrorResponse, withTenant } from "@/lib/tenant"

export const runtime = "nodejs"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: evento_id } = await params
    const { db, tenantId } = await resolvePublicTenant(req)
    const body = await req.json()
    const { cpf } = body

    if (!cpf) return NextResponse.json({ error: "CPF e obrigatorio" }, { status: 400 })

    const cpfLimpo = cpf.replace(/\D/g, "")
    if (cpfLimpo.length !== 11) {
      return NextResponse.json({ error: "CPF invalido" }, { status: 400 })
    }

    const { data: evento } = await db
      .from("eventos")
      .select("id, nome, ativo, data_evento")
      .eq("tenant_id", tenantId)
      .eq("id", evento_id)
      .single()

    if (!evento) return NextResponse.json({ error: "Evento nao encontrado" }, { status: 404 })
    if (!evento.ativo) return NextResponse.json({ error: "As inscricoes para este evento foram encerradas." }, { status: 403 })

    const hoje = new Date().toISOString().split("T")[0]
    if (evento.data_evento < hoje) {
      return NextResponse.json({ error: "Este evento ja ocorreu" }, { status: 400 })
    }

    const { data: aluna } = await db
      .from("alunas")
      .select(`
        id, nome, cpf_aluna,
        turmas(nome)
      `)
      .eq("tenant_id", tenantId)
      .eq("cpf_aluna", cpfLimpo)
      .maybeSingle()

    if (!aluna) {
      return NextResponse.json({ error: "Nenhuma aluna encontrada com este CPF. Verifique o CPF e tente novamente." }, { status: 404 })
    }

    const { data: jaInscrita } = await db
      .from("inscricoes_evento")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("evento_id", evento_id)
      .eq("cpf_aluna", cpfLimpo)
      .maybeSingle()

    if (jaInscrita) {
      return NextResponse.json({ error: `${aluna.nome} ja esta inscrita neste evento.` }, { status: 409 })
    }

    const turmaName = (aluna.turmas as any)?.nome ?? null
    const { data: inscricao, error } = await db
      .from("inscricoes_evento")
      .insert(withTenant({
        evento_id,
        aluna_id: aluna.id,
        nome_aluna: aluna.nome,
        cpf_aluna: cpfLimpo,
        turma: turmaName,
      }, tenantId))
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: `${aluna.nome} ja esta inscrita neste evento.` }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      inscricao: {
        ...inscricao,
        nome_aluna: aluna.nome,
        turma: turmaName,
      },
    }, { status: 201 })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
