import { NextRequest, NextResponse } from "next/server"
import { resolvePublicTenant, tenantErrorResponse } from "@/lib/tenant"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const { db, tenantId } = await resolvePublicTenant(req)
    const hoje = new Date().toISOString().split("T")[0]

    const { data: eventos, error } = await db
      .from("eventos")
      .select(`
        id,
        nome,
        descricao,
        data_evento,
        local,
        taxa_inscricao,
        ativo,
        inscricoes_evento(count)
      `)
      .eq("tenant_id", tenantId)
      .gte("data_evento", hoje)
      .order("data_evento", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const eventosMapped = (eventos ?? []).map((e: any) => ({
      ...e,
      ativo: e.ativo ?? true,
      total_inscritos: e.inscricoes_evento?.[0]?.count ?? 0,
      inscricoes_evento: undefined,
    }))

    return NextResponse.json({ eventos: eventosMapped })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
