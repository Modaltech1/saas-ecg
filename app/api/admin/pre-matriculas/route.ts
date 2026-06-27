import { NextRequest, NextResponse } from "next/server"
import { requireTenantContext, resolvePublicTenant, tenantErrorResponse, withTenant } from "@/lib/tenant"

export const runtime = "nodejs"

export async function GET() {
  try {
    const { db: supabase, tenantId } = await requireTenantContext()
    const { data, error } = await supabase
      .from("pre_matriculas")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("criado_em", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ preMatriculas: data ?? [] })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { db: supabase, tenantId } = await resolvePublicTenant(req)
    const body = await req.json()

    const {
      nome_aluna,
      cpf_aluna,
      data_nascimento,
      nome_responsavel,
      cpf_responsavel,
      telefone,
      whatsapp,
      email,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      cep,
      observacoes,
    } = body

    if (!nome_aluna || !data_nascimento || !nome_responsavel || !email) {
      return NextResponse.json({ error: "Campos obrigatorios faltando" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("pre_matriculas")
      .insert(withTenant({
        nome_aluna,
        cpf_aluna: cpf_aluna ?? null,
        data_nascimento,
        nome_responsavel,
        cpf_responsavel: cpf_responsavel ?? null,
        telefone: telefone ?? null,
        whatsapp: whatsapp ?? null,
        email,
        logradouro: logradouro ?? null,
        numero: numero ?? null,
        complemento: complemento ?? null,
        bairro: bairro ?? null,
        cidade: cidade ?? null,
        estado: estado ?? null,
        cep: cep ?? null,
        observacoes: observacoes ?? null,
        status: "pendente",
      }, tenantId))
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ preMatricula: data }, { status: 201 })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
