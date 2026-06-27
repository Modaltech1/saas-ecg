import { redirect } from "next/navigation"
import { MobileHeader } from "@/components/layout/mobile-header"
import { BackButton } from "@/components/ui/back-button"
import { GraduationCap, Users, DollarSign, Clock, AlertCircle, CheckCircle } from "lucide-react"
import { formatCurrency, calculateAge } from "@/lib/utils"
import { requireTenantContext } from "@/lib/tenant"

export default async function ProfessoraTurmaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let ctx
  try {
    ctx = await requireTenantContext(["professora"])
  } catch {
    redirect("/login")
  }

  const { db, tenantId, userId } = ctx

  const { data: vinculo } = await db
    .from("turmas_professoras")
    .select("turma_id")
    .eq("tenant_id", tenantId)
    .eq("turma_id", id)
    .eq("professora_id", userId)
    .maybeSingle()

  if (!vinculo) redirect("/professora/turmas")

  const { data: turma } = await db
    .from("turmas")
    .select("id, nome, nivel, mensalidade, polos(nome), locais(nome)")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single()

  if (!turma) redirect("/professora/turmas")

  const { data: horarios } = await db
    .from("horarios")
    .select("id, dia_semana, hora_inicio, hora_fim")
    .eq("tenant_id", tenantId)
    .eq("turma_id", id)
    .order("dia_semana")

  const { data: alunas } = await db
    .from("alunas")
    .select("id, nome, data_nascimento, status, responsaveis(nome, whatsapp)")
    .eq("tenant_id", tenantId)
    .eq("turma_id", id)
    .order("nome")

  const alunaIds = (alunas || []).map((a: any) => a.id)
  let pendenciasPorAluna: Record<string, { total: number; count: number }> = {}

  if (alunaIds.length > 0) {
    const { data: pendencias } = await db
      .from("pagamentos_mensalidade")
      .select("aluna_id, valor")
      .eq("tenant_id", tenantId)
      .in("aluna_id", alunaIds)
      .eq("status", "Pendente")

    for (const p of pendencias || []) {
      if (!pendenciasPorAluna[p.aluna_id]) pendenciasPorAluna[p.aluna_id] = { total: 0, count: 0 }
      pendenciasPorAluna[p.aluna_id].total += p.valor
      pendenciasPorAluna[p.aluna_id].count += 1
    }
  }

  const alunasList = (alunas || []).map((a: any) => ({
    ...a,
    valorPendente: pendenciasPorAluna[a.id]?.total || 0,
    qtdPendente: pendenciasPorAluna[a.id]?.count || 0,
  }))

  const polo = (turma as any).polos
  const local = (turma as any).locais

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeader title={turma.nome} />

      <main className="px-4 pb-6 space-y-6">
        <div className="pt-4">
          <BackButton />
        </div>

        {/* Info da turma */}
        <section className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-xl text-foreground mb-1">{turma.nome}</h2>
              <p className="text-sm text-muted-foreground">
                {polo?.nome} • {local?.nome}
              </p>
              <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                {turma.nivel}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Mensalidade</p>
              </div>
              <p className="text-lg font-bold text-foreground">{formatCurrency(turma.mensalidade)}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Alunas</p>
              </div>
              <p className="text-lg font-bold text-foreground">{alunasList.length}</p>
            </div>
          </div>
        </section>

        {/* Horários */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-foreground">Horários</h3>
          {(horarios || []).length === 0 ? (
            <div className="bg-card rounded-lg p-6 text-center border border-border">
              <Clock className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhum horário cadastrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {(horarios || []).map((horario: any) => (
                <div key={horario.id} className="bg-card rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <p className="font-semibold text-sm text-foreground">{horario.dia_semana}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {horario.hora_inicio} - {horario.hora_fim}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Alunas */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-foreground">Alunas da Turma</h3>
          {alunasList.length === 0 ? (
            <div className="bg-card rounded-lg p-6 text-center border border-border">
              <Users className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhuma aluna matriculada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alunasList.map((aluna: any) => {
                const idade = calculateAge(aluna.data_nascimento)
                const responsavel = aluna.responsaveis as any
                return (
                  <div key={aluna.id} className="bg-card rounded-lg p-4 border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{aluna.nome}</h4>
                        <p className="text-sm text-muted-foreground">{idade} anos</p>
                        {responsavel && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Responsável: {responsavel.nome}
                          </p>
                        )}
                      </div>
                      {aluna.qtdPendente > 0 ? (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {aluna.qtdPendente} mês{aluna.qtdPendente > 1 ? "es" : ""}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Em dia
                        </span>
                      )}
                    </div>
                    {aluna.qtdPendente > 0 && (
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="text-sm text-amber-900 font-medium">
                          Pendente: {formatCurrency(aluna.valorPendente)}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
