import { NextResponse } from "next/server"
import { requireTenantContext, tenantErrorResponse } from "@/lib/tenant"

export const runtime = "nodejs"

export async function GET() {
  try {
    const { db: supabase, tenantId } = await requireTenantContext()

    const [
      resAlunas,
      resProfessoras,
      resPolos,
      resLocais,
      resTurmas,
      resPolosData,
      resMensalidades,
    ] = await Promise.all([
      supabase.from("alunas").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "Ativa"),
      supabase.from("perfis").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("papel", "professora").eq("ativo", true),
      supabase.from("polos").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
      supabase.from("locais").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
      supabase.from("turmas").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
      supabase.from("polos").select("id, nome, cidade").eq("tenant_id", tenantId),
      supabase.from("pagamentos_mensalidade").select("id, valor, aluna_id").eq("tenant_id", tenantId).eq("status", "Pendente"),
    ])

    if (resAlunas.error) console.error("[stats] alunas:", resAlunas.error.message)
    if (resMensalidades.error) console.error("[stats] mensalidades:", resMensalidades.error.message)

    const mensalidadesPendentes = resMensalidades.data ?? []
    const totalPendente = mensalidadesPendentes.reduce((s, p) => s + Number(p.valor), 0)
    const alunasPendentes = new Set(mensalidadesPendentes.map((p) => p.aluna_id)).size

    return NextResponse.json({
      totalAlunas: resAlunas.count ?? 0,
      totalProfessoras: resProfessoras.count ?? 0,
      totalPolos: resPolos.count ?? 0,
      totalLocais: resLocais.count ?? 0,
      totalTurmas: resTurmas.count ?? 0,
      totalPendente,
      alunasPendentes,
      polos: resPolosData.data ?? [],
    })
  } catch (error) {
    return tenantErrorResponse(error)
  }
}
