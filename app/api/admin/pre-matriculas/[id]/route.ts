import { NextRequest, NextResponse } from "next/server"
import { requireTenantContext, tenantErrorResponse, withTenant } from "@/lib/tenant"

export const runtime = "nodejs"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { db, tenantId } = await requireTenantContext()
    const body = await req.json()
    const { status, turma_id, cobrar_matricula = true } = body

    if (!status || !["pendente", "aprovada", "recusada"].includes(status)) {
      return NextResponse.json({ error: "Status invalido" }, { status: 400 })
    }

    if (status === "aprovada" && !turma_id) {
      return NextResponse.json({ error: "Selecione uma turma para aprovar a pre-matricula." }, { status: 400 })
    }

    const { data: pm, error: errPm } = await db
      .from("pre_matriculas")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .single()

    if (errPm || !pm) {
      return NextResponse.json({ error: "Pre-matricula nao encontrada" }, { status: 404 })
    }

    if (status === "aprovada") {
      const { data: turma, error: errTurma } = await db
        .from("turmas")
        .select("id, nome, taxa_matricula, mensalidade")
        .eq("tenant_id", tenantId)
        .eq("id", turma_id)
        .single()

      if (errTurma || !turma) {
        return NextResponse.json({ error: "Turma nao encontrada." }, { status: 404 })
      }

      let responsavelId: string | null = null

      if (pm.cpf_responsavel) {
        const { data: ex } = await db
          .from("responsaveis")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("cpf", pm.cpf_responsavel)
          .maybeSingle()
        if (ex) responsavelId = ex.id
      }
      if (!responsavelId && pm.email) {
        const { data: ex } = await db
          .from("responsaveis")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("email", pm.email)
          .maybeSingle()
        if (ex) responsavelId = ex.id
      }
      if (!responsavelId) {
        const { data: novoResp, error: errResp } = await db
          .from("responsaveis")
          .insert(withTenant({
            nome: pm.nome_responsavel,
            cpf: pm.cpf_responsavel ?? null,
            telefone: pm.telefone ?? null,
            whatsapp: pm.whatsapp ?? null,
            email: pm.email,
          }, tenantId))
          .select("id")
          .single()

        if (errResp || !novoResp) {
          return NextResponse.json({ error: `Erro ao criar responsavel: ${errResp?.message}` }, { status: 500 })
        }
        responsavelId = novoResp.id
      }

      const { data: novaAluna, error: errAluna } = await db
        .from("alunas")
        .insert(withTenant({
          nome: pm.nome_aluna,
          cpf_aluna: pm.cpf_aluna ?? null,
          data_nascimento: pm.data_nascimento,
          responsavel_id: responsavelId,
          turma_id,
          logradouro: pm.logradouro ?? null,
          numero: pm.numero ?? null,
          complemento: pm.complemento ?? null,
          bairro: pm.bairro ?? null,
          cidade: pm.cidade ?? null,
          estado: pm.estado ?? null,
          cep: pm.cep ?? null,
          status: "Ativa",
          taxa_matricula_paga: false,
        }, tenantId))
        .select("id")
        .single()

      if (errAluna || !novaAluna) {
        return NextResponse.json({ error: `Erro ao criar aluna: ${errAluna?.message}` }, { status: 500 })
      }

      if (cobrar_matricula && Number(turma.taxa_matricula) > 0) {
        const { error: errMat } = await db
          .from("pagamentos_matricula")
          .insert(withTenant({ aluna_id: novaAluna.id, turma_id, valor: turma.taxa_matricula, status: "Pendente" }, tenantId))
        if (errMat) console.error("[aprovacao] pagamentos_matricula:", errMat.message)
      }
    }

    if (status === "aprovada") {
      const { error: errDel } = await db
        .from("pre_matriculas")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", id)
      if (errDel) return NextResponse.json({ error: errDel.message }, { status: 500 })
    } else {
      const { error: errUpdate } = await db
        .from("pre_matriculas")
        .update(withTenant({ status }, tenantId))
        .eq("tenant_id", tenantId)
        .eq("id", id)
      if (errUpdate) return NextResponse.json({ error: errUpdate.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { db, tenantId } = await requireTenantContext()
    const { error } = await db
      .from("pre_matriculas")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
