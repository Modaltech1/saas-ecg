import { NextRequest, NextResponse } from "next/server"
import { requireTenantContext, tenantErrorResponse, withTenant } from "@/lib/tenant"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const { db: supabase, tenantId } = await requireTenantContext()
    const search = req.nextUrl.searchParams.get("q") ?? ""
    const polo = req.nextUrl.searchParams.get("polo_id") ?? req.nextUrl.searchParams.get("polo") ?? ""
    const local = req.nextUrl.searchParams.get("local_id") ?? req.nextUrl.searchParams.get("local") ?? ""
    const turma = req.nextUrl.searchParams.get("turma_id") ?? req.nextUrl.searchParams.get("turma") ?? ""
    const statusFinanceiro = req.nextUrl.searchParams.get("status") ?? ""

    let query = supabase
      .from("alunas")
      .select(`
        id, nome, cpf_aluna, turma_id, data_nascimento, status, taxa_matricula_paga, desconto_percentual,
        logradouro, numero, complemento, bairro, cidade, estado, cep,
        turmas ( id, nome, polo_id, local_id, polos ( id, nome ) ),
        responsaveis ( id, nome, telefone, email, cpf, whatsapp )
      `)
      .eq("tenant_id", tenantId)
      .order("nome")

    if (turma) query = query.eq("turma_id", turma)

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    let resultado: any[] = data ?? []

    if (polo) {
      resultado = resultado.filter((a) => (a.turmas as any)?.polos?.id === polo)
    }
    if (local) {
      resultado = resultado.filter((a) => (a.turmas as any)?.local_id === local)
    }

    if (search) {
      const q = search.trim().toLowerCase()
      resultado = resultado.filter((a: any) => {
        const responsavel = Array.isArray(a.responsaveis) ? a.responsaveis[0] : a.responsaveis
        return (
          a.nome?.toLowerCase().includes(q) ||
          responsavel?.nome?.toLowerCase().includes(q) ||
          responsavel?.email?.toLowerCase().includes(q)
        )
      })
    }

    const alunaIds = resultado.map((a) => a.id).filter(Boolean)
    let pendenciasMap = new Map<string, number>()
    if (alunaIds.length > 0) {
      const { data: pendencias } = await supabase
        .from("pagamentos_mensalidade")
        .select("aluna_id, status")
        .eq("tenant_id", tenantId)
        .in("aluna_id", alunaIds)
        .in("status", ["Pendente", "pendente", "Atrasado", "atrasado"])

      pendenciasMap = (pendencias ?? []).reduce((acc, p: any) => {
        acc.set(p.aluna_id, (acc.get(p.aluna_id) ?? 0) + 1)
        return acc
      }, new Map<string, number>())
    }

    resultado = resultado.map((a) => ({ ...a, pendencias: pendenciasMap.get(a.id) ?? 0 }))

    if (statusFinanceiro === "emdia") {
      resultado = resultado.filter((a) => (a.pendencias ?? 0) === 0)
    } else if (statusFinanceiro === "pendente") {
      resultado = resultado.filter((a) => (a.pendencias ?? 0) > 0)
    } else if (statusFinanceiro === "vencidos") {
      resultado = resultado.filter((a) => (a.pendencias ?? 0) > 1)
    }

    return NextResponse.json({ alunas: resultado })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { db: supabase, tenantId } = await requireTenantContext()
    const {
      responsavel,
      cobrar_matricula = true,
      logradouro, numero, complemento, bairro, cidade, estado, cep,
      cpf_aluna,
      ...alunaData
    } = await req.json()

    const descontoRaw = Number(alunaData.desconto_percentual ?? 0)
    const descontoPercentual = Number.isFinite(descontoRaw)
      ? Math.min(100, Math.max(0, descontoRaw))
      : 0
    const cpfAlunaDigits = typeof cpf_aluna === "string" ? cpf_aluna.replace(/\D/g, "") : cpf_aluna
    const cpfResponsavelDigits = typeof responsavel?.cpf === "string" ? responsavel.cpf.replace(/\D/g, "") : responsavel?.cpf

    let responsavel_id: string | null = null
    if (responsavel) {
      let existente = null
      if (cpfResponsavelDigits) {
        const { data } = await supabase
          .from("responsaveis")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("cpf", cpfResponsavelDigits)
          .maybeSingle()
        existente = data
      }
      if (!existente && responsavel.email) {
        const { data } = await supabase
          .from("responsaveis")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("email", responsavel.email)
          .maybeSingle()
        existente = data
      }
      if (existente) {
        await supabase.from("responsaveis").update(withTenant({
          nome: responsavel.nome,
          telefone: responsavel.telefone,
          whatsapp: responsavel.whatsapp,
          email: responsavel.email,
        }, tenantId)).eq("tenant_id", tenantId).eq("id", existente.id)
        responsavel_id = existente.id
      } else {
        const { data: novo, error: erroResp } = await supabase
          .from("responsaveis")
          .insert(withTenant({
            nome: responsavel.nome,
            cpf: cpfResponsavelDigits ?? null,
            email: responsavel.email,
            telefone: responsavel.telefone ?? null,
            whatsapp: responsavel.whatsapp ?? null,
          }, tenantId))
          .select("id")
          .single()
        if (erroResp) return NextResponse.json({ error: erroResp.message }, { status: 400 })
        responsavel_id = novo.id
      }
    }

    const { data: novaAluna, error } = await supabase
      .from("alunas")
      .insert(withTenant({
        ...alunaData,
        desconto_percentual: descontoPercentual,
        cpf_aluna: cpfAlunaDigits ?? null,
        responsavel_id,
        logradouro: logradouro ?? null,
        numero: numero ?? null,
        complemento: complemento ?? null,
        bairro: bairro ?? null,
        cidade: cidade ?? null,
        estado: estado ?? null,
        cep: cep ?? null,
        status: "Ativa",
        taxa_matricula_paga: false,
      }, tenantId))
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    if (cobrar_matricula && alunaData.turma_id) {
      const { data: turma } = await supabase
        .from("turmas")
        .select("taxa_matricula")
        .eq("tenant_id", tenantId)
        .eq("id", alunaData.turma_id)
        .single()

      if (turma && Number(turma.taxa_matricula) > 0) {
        await supabase.from("pagamentos_matricula").insert(withTenant({
          aluna_id: novaAluna.id,
          turma_id: alunaData.turma_id,
          valor: turma.taxa_matricula,
          status: "Pendente",
        }, tenantId))
      }
    }

    return NextResponse.json(novaAluna, { status: 201 })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
