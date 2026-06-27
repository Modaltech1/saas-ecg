import { NextResponse } from "next/server"
import { requireTenantContext, tenantErrorResponse } from "@/lib/tenant"

export const runtime = "nodejs"

export async function GET() {
  try {
    const { db: supabase, tenantId } = await requireTenantContext()

    const { data: pendentes, error } = await supabase
      .from("pagamentos_mensalidade")
      .select(`
        id, valor, status, mes_referencia,
        alunas!inner (
          id, nome, turma_id,
          responsaveis ( nome, whatsapp ),
          turmas ( id, nome, polo_id, local_id, polos(id, nome), locais(id, nome) )
        )
      `)
      .eq("tenant_id", tenantId)
      .eq("status", "Pendente")
      .order("mes_referencia")

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const mapaAlunas = new Map<string, any>()
    for (const pag of (pendentes ?? [])) {
      const aluna = (pag as any).alunas
      if (!aluna) continue
      const id = aluna.id
      if (!mapaAlunas.has(id)) {
        const turma = aluna.turmas
        mapaAlunas.set(id, {
          id,
          nome: aluna.nome,
          turma_id: aluna.turma_id,
          turma_nome: turma?.nome ?? "-",
          polo_id: turma?.polo_id ?? null,
          polo_nome: turma?.polos?.nome ?? "-",
          local_id: turma?.local_id ?? null,
          responsavel_nome: aluna.responsaveis?.nome ?? "-",
          responsavel_whatsapp: aluna.responsaveis?.whatsapp ?? "",
          meses_pendentes: [],
        })
      }
      mapaAlunas.get(id).meses_pendentes.push({ id: pag.id, mes_referencia: pag.mes_referencia, valor: pag.valor })
    }

    return NextResponse.json({ alunas: Array.from(mapaAlunas.values()) })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
