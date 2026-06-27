import { NextRequest, NextResponse } from "next/server"
import { requireTenantContext, tenantErrorResponse, withTenant } from "@/lib/tenant"

export const runtime = "nodejs"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { db: supabase, tenantId } = await requireTenantContext()

    const { data: aluna, error } = await supabase
      .from("alunas")
      .select(`
        id, nome, cpf_aluna, data_nascimento, status, taxa_matricula_paga, turma_id, desconto_percentual,
        logradouro, numero, complemento, bairro, cidade, estado, cep,
        turmas ( id, nome, mensalidade, polo_id, local_id, polos ( id, nome, cidade ), locais ( id, nome ) ),
        responsaveis ( id, nome, telefone, email, cpf, whatsapp )
      `)
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .single()

    if (error || !aluna) return NextResponse.json({ error: "Aluna nao encontrada" }, { status: 404 })

    const [{ data: mensalidades }, { data: matriculas }] = await Promise.all([
      supabase
        .from("pagamentos_mensalidade")
        .select("id, mes_referencia, valor, status, data_pagamento, txid_cora")
        .eq("tenant_id", tenantId)
        .eq("aluna_id", id)
        .order("mes_referencia", { ascending: false }),
      supabase
        .from("pagamentos_matricula")
        .select("id, valor, status, data_pagamento")
        .eq("tenant_id", tenantId)
        .eq("aluna_id", id),
    ])

    return NextResponse.json({ aluna, mensalidades: mensalidades ?? [], matriculas: matriculas ?? [] })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { db: supabase, tenantId } = await requireTenantContext()
    const body = await req.json()
    const { responsavel, ...alunaBody } = body

    const nullableAlunaFields = new Set([
      "cpf_aluna",
      "data_nascimento",
      "turma_id",
      "logradouro",
      "numero",
      "complemento",
      "bairro",
      "cidade",
      "estado",
      "cep",
    ])

    const updateData: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(alunaBody)) {
      if (value === undefined) continue
      if (value === null || value === "") {
        if (nullableAlunaFields.has(key)) updateData[key] = null
        continue
      }
      updateData[key] = value
    }

    if (typeof updateData.cpf_aluna === "string") {
      updateData.cpf_aluna = updateData.cpf_aluna.replace(/\D/g, "")
    }

    if (updateData.desconto_percentual !== undefined) {
      const desconto = Number(updateData.desconto_percentual)
      updateData.desconto_percentual = Number.isFinite(desconto)
        ? Math.min(100, Math.max(0, desconto))
        : 0
    }

    if (responsavel) {
      let responsavelId = responsavel.id as string | undefined

      if (!responsavelId) {
        const { data: alunaAtual } = await supabase
          .from("alunas")
          .select("responsavel_id")
          .eq("tenant_id", tenantId)
          .eq("id", id)
          .single()
        responsavelId = alunaAtual?.responsavel_id ?? undefined
      }

      if (responsavelId) {
        const updateResponsavel = Object.fromEntries(
          Object.entries({
            nome: responsavel.nome,
            cpf: typeof responsavel.cpf === "string" ? responsavel.cpf.replace(/\D/g, "") : responsavel.cpf,
            email: responsavel.email,
            telefone: responsavel.telefone,
            whatsapp: responsavel.whatsapp,
          }).filter(([, v]) => v !== undefined),
        )

        if ("cpf" in updateResponsavel && updateResponsavel.cpf === "") updateResponsavel.cpf = null
        if ("email" in updateResponsavel && updateResponsavel.email === "") updateResponsavel.email = null
        if ("telefone" in updateResponsavel && updateResponsavel.telefone === "") updateResponsavel.telefone = null
        if ("whatsapp" in updateResponsavel && updateResponsavel.whatsapp === "") updateResponsavel.whatsapp = null

        const { error: responsavelError } = await supabase
          .from("responsaveis")
          .update(withTenant(updateResponsavel, tenantId))
          .eq("tenant_id", tenantId)
          .eq("id", responsavelId)

        if (responsavelError) return NextResponse.json({ error: responsavelError.message }, { status: 400 })
      }
    }

    if (Object.keys(updateData).length === 0) {
      const { data, error } = await supabase
        .from("alunas")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json(data)
    }

    const { data, error } = await supabase
      .from("alunas")
      .update(withTenant(updateData, tenantId))
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
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
      .from("alunas")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
