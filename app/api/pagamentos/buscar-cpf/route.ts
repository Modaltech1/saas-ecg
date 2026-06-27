import { NextRequest, NextResponse } from "next/server"
import { resolvePublicTenant, tenantErrorResponse } from "@/lib/tenant"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const cpf = req.nextUrl.searchParams.get("cpf")?.replace(/\D/g, "") ?? ""

    if (!cpf || cpf.length !== 11) {
      return NextResponse.json({ error: "CPF invalido" }, { status: 400 })
    }

    const { db: supabase, tenantId } = await resolvePublicTenant(req)
    const cpfFormatado = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")

    const { data: alunas, error: errAluna } = await supabase
      .from("alunas")
      .select(`
        id, nome, status, turma_id,
        turmas ( id, nome ),
        responsaveis ( nome )
      `)
      .eq("tenant_id", tenantId)
      .or(`cpf_aluna.eq.${cpf},cpf_aluna.eq.${cpfFormatado}`)
      .limit(1)

    const aluna = alunas?.[0] ?? null

    if (errAluna || !aluna) {
      return NextResponse.json(
        { error: "CPF nao encontrado. Verifique o CPF da aluna ou entre em contato com a escola." },
        { status: 404 },
      )
    }

    const turmaLabel = (aluna.turmas as any)?.nome ?? "Turma nao informada"
    const responsavelNome = (aluna.responsaveis as any)?.nome ?? ""

    const [{ data: mens }, { data: mat }] = await Promise.all([
      supabase
        .from("pagamentos_mensalidade")
        .select("id, mes_referencia, valor, status, data_pagamento, txid_cora, pix_status")
        .eq("tenant_id", tenantId)
        .eq("aluna_id", aluna.id)
        .order("mes_referencia", { ascending: false }),
      supabase
        .from("pagamentos_matricula")
        .select("id, valor, status, data_pagamento, txid_cora, pix_status")
        .eq("tenant_id", tenantId)
        .eq("aluna_id", aluna.id)
        .order("criado_em", { ascending: false }),
    ])

    const pagamentos = [
      ...(mat ?? []).map((m) => ({
        id: m.id,
        mes_referencia: "",
        valor: Number(m.valor),
        status: m.status as "Pago" | "Pendente" | "Expirado",
        data_pagamento: m.data_pagamento,
        tipo: "matricula" as const,
        txid_cora: m.txid_cora ?? null,
        pix_status: m.pix_status ?? null,
      })),
      ...(mens ?? []).map((m) => ({
        id: m.id,
        mes_referencia: m.mes_referencia,
        valor: Number(m.valor),
        status: m.status as "Pago" | "Pendente" | "Expirado",
        data_pagamento: m.data_pagamento,
        tipo: "mensalidade" as const,
        txid_cora: m.txid_cora ?? null,
        pix_status: m.pix_status ?? null,
      })),
    ]

    return NextResponse.json({
      alunas: [{
        id: aluna.id,
        nome: aluna.nome,
        turma: turmaLabel,
        responsavel: responsavelNome,
        pagamentos,
      }],
    })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
