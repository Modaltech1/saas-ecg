import { NextRequest, NextResponse } from "next/server"
import { criarCobrancaCora } from "@/lib/cora"
import { requireTenantCoraCredentials } from "@/lib/cora-config"
import { resolvePublicTenant, TenantAccessError, tenantErrorResponse, withTenant } from "@/lib/tenant"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const { db: supabase, tenantId } = await resolvePublicTenant(req)
    const body = await req.json()
    const { pagamentoIds, tipo, alunaId } = body as {
      pagamentoIds: string[]
      tipo: "mensalidade" | "matricula" | "total"
      alunaId: string
    }

    if (!pagamentoIds?.length || !alunaId) {
      return NextResponse.json({ error: "Parametros invalidos" }, { status: 400 })
    }

    const credentials = await requireTenantCoraCredentials(supabase, tenantId)

    const { data: aluna, error: errAluna } = await supabase
      .from("alunas")
      .select("id, nome, responsaveis(nome, cpf)")
      .eq("tenant_id", tenantId)
      .eq("id", alunaId)
      .maybeSingle()

    if (errAluna || !aluna) {
      return NextResponse.json({ error: "Aluna nao encontrada" }, { status: 404 })
    }

    const responsavel = Array.isArray(aluna.responsaveis)
      ? aluna.responsaveis[0]
      : aluna.responsaveis

    let totalCentavos = 0
    let descricao = ""
    let correlationId = ""
    const meses: string[] = []
    let idsMensalidade: string[] = []
    let idsMatricula: string[] = []

    if (tipo === "mensalidade" || tipo === "total") {
      const { data: mens } = await supabase
        .from("pagamentos_mensalidade")
        .select("id, valor, mes_referencia")
        .eq("tenant_id", tenantId)
        .eq("aluna_id", alunaId)
        .in("id", pagamentoIds)
        .eq("status", "Pendente")

      if (mens && mens.length > 0) {
        idsMensalidade = mens.map((m) => m.id)
        for (const m of mens) {
          totalCentavos += Math.round(Number(m.valor) * 100)
          meses.push(m.mes_referencia)
        }
      }
    }

    if (tipo === "matricula" || tipo === "total") {
      const { data: mat } = await supabase
        .from("pagamentos_matricula")
        .select("id, valor")
        .eq("tenant_id", tenantId)
        .eq("aluna_id", alunaId)
        .in("id", pagamentoIds)
        .eq("status", "Pendente")

      if (mat && mat.length > 0) {
        idsMatricula = mat.map((m) => m.id)
        for (const m of mat) {
          totalCentavos += Math.round(Number(m.valor) * 100)
        }
      }
    }

    if (totalCentavos === 0) {
      return NextResponse.json({ error: "Nenhum pagamento pendente encontrado" }, { status: 404 })
    }

    const ts = Date.now()
    if (idsMensalidade.length > 0 && idsMatricula.length > 0) {
      correlationId = `total-${alunaId}-${ts}`
      descricao = `Matricula + Mensalidade${meses.length > 1 ? "s" : ""} ${aluna.nome} - ${meses.join(", ")}`
    } else if (idsMensalidade.length > 0) {
      correlationId = `mens-${idsMensalidade[0]}-${ts}`
      descricao = `Mensalidade${meses.length > 1 ? "s" : ""} ${aluna.nome} - ${meses.join(", ")}`
    } else {
      correlationId = `mat-${idsMatricula[0]}-${ts}`
      descricao = `Taxa de matricula - ${aluna.nome}`
    }

    const vencimento = new Date()
    vencimento.setDate(vencimento.getDate() + 1)
    const dataVencimento = vencimento.toISOString().split("T")[0]

    const cobranca = await criarCobrancaCora({
      valorCentavos: totalCentavos,
      dataVencimento,
      nomeCliente: (responsavel as any)?.nome ?? aluna.nome,
      cpfCliente: ((responsavel as any)?.cpf ?? "00000000000").replace(/\D/g, ""),
      descricao,
      correlationId,
    }, credentials)

    const pixEmv = cobranca.pix?.emv ?? null
    const bankSlipUrl = cobranca.payment_options?.bank_slip?.url ?? null
    const updateData = withTenant({
      txid_cora: cobranca.id,
      link_pagamento: bankSlipUrl,
    }, tenantId)

    if (idsMensalidade.length > 0) {
      await supabase
        .from("pagamentos_mensalidade")
        .update(updateData)
        .eq("tenant_id", tenantId)
        .in("id", idsMensalidade)
    }

    if (idsMatricula.length > 0) {
      await supabase
        .from("pagamentos_matricula")
        .update(updateData)
        .eq("tenant_id", tenantId)
        .in("id", idsMatricula)
    }

    return NextResponse.json({
      ok: true,
      invoiceId: cobranca.id,
      pixCopyPaste: pixEmv,
      pixQrCode: pixEmv,
      paymentUrl: bankSlipUrl,
      valorReais: totalCentavos / 100,
      descricao,
    })
  } catch (err) {
    if (err instanceof TenantAccessError) return tenantErrorResponse(err)
    if (err instanceof Error) {
      console.error("[criar-pix]", err.message)
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
    return tenantErrorResponse(err)
  }
}
