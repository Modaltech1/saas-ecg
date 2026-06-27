"use client"

import { MobileHeader } from "@/components/layout/mobile-header"
import { StatCard } from "@/components/ui/stat-card"
import { DollarSign, AlertCircle, Users } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

const fetcher = async () => {
  const supabase = createClient()

  // Usa getSession() — lê do cookie, zero network call
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return { turmas: [], alunasPendentes: [], totalPendente: 0, pendenciasPorTurma: [] }

  const { data: tp } = await supabase
    .from("turmas_professoras")
    .select("turma_id")
    .eq("professora_id", user.id)

  const turmaIds = (tp || []).map((t: any) => t.turma_id)
  if (turmaIds.length === 0)
    return { turmas: [], alunasPendentes: [], totalPendente: 0, pendenciasPorTurma: [] }

  const { data: turmas } = await supabase
    .from("turmas")
    .select("id, nome, nivel")
    .in("id", turmaIds)

  const { data: alunas } = await supabase
    .from("alunas")
    .select("id, nome, turma_id, responsaveis(nome, whatsapp)")
    .in("turma_id", turmaIds)

  const alunaIds = (alunas || []).map((a: any) => a.id)
  const { data: pendencias } = await supabase
    .from("pagamentos_mensalidade")
    .select("id, aluna_id, mes_referencia, valor, status")
    .in("aluna_id", alunaIds)
    .eq("status", "Pendente")

  const pendenciasPorAluna: Record<string, { total: number; count: number }> = {}
  for (const p of pendencias || []) {
    if (!pendenciasPorAluna[p.aluna_id]) pendenciasPorAluna[p.aluna_id] = { total: 0, count: 0 }
    pendenciasPorAluna[p.aluna_id].total += p.valor
    pendenciasPorAluna[p.aluna_id].count += 1
  }

  const alunasPendentes = (alunas || [])
    .filter((a: any) => pendenciasPorAluna[a.id])
    .map((a: any) => ({
      ...a,
      valorPendente: pendenciasPorAluna[a.id].total,
      qtdPendente: pendenciasPorAluna[a.id].count,
    }))

  const totalPendente = alunasPendentes.reduce((s: number, a: any) => s + a.valorPendente, 0)

  const pendenciasPorTurma = (turmas || []).map((turma: any) => {
    const alunasDaTurma = (alunas || []).filter((a: any) => a.turma_id === turma.id)
    const pendentesDaTurma = alunasDaTurma.filter((a: any) => pendenciasPorAluna[a.id])
    const valorPendenteTurma = pendentesDaTurma.reduce(
      (s: number, a: any) => s + (pendenciasPorAluna[a.id]?.total || 0),
      0,
    )
    return {
      turma,
      totalAlunas: alunasDaTurma.length,
      alunasPendentes: pendentesDaTurma.length,
      valorPendente: valorPendenteTurma,
    }
  })

  return { turmas: turmas || [], alunasPendentes, totalPendente, pendenciasPorTurma }
}

export default function ProfessoraFinanceiroPage() {
  const { data, isLoading } = useSWR("professora-financeiro", fetcher)

  const alunasPendentes = data?.alunasPendentes || []
  const totalPendente = data?.totalPendente || 0
  const pendenciasPorTurma = data?.pendenciasPorTurma || []

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeader title="Financeiro" />

      <main className="px-4 pb-6 space-y-6">
        {isLoading ? (
          <div className="pt-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Carregando...</p>
          </div>
        ) : (
          <>
            <section className="pt-4 space-y-3">
              <div className="grid gap-3">
                <StatCard
                  title="Alunas com Pendência"
                  value={alunasPendentes.length}
                  icon={<AlertCircle className="w-5 h-5 text-[color:var(--warning)]" />}
                  iconColor="text-[color:var(--warning)]"
                />
                <StatCard
                  title="Total Pendente"
                  value={formatCurrency(totalPendente)}
                  icon={<DollarSign className="w-5 h-5 text-destructive" />}
                  iconColor="text-destructive"
                />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">Pendências por Turma</h2>
              <div className="space-y-2">
                {pendenciasPorTurma.map(({ turma, totalAlunas, alunasPendentes: ap, valorPendente }: any) => (
                  <div key={turma.id} className="bg-card rounded-lg p-4 border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{turma.nome}</h3>
                        <p className="text-sm text-muted-foreground">{totalAlunas} alunas</p>
                      </div>
                      {ap > 0 && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                          {ap} pendência{ap > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {ap > 0 && (
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="text-sm text-amber-900 font-medium">
                          Total pendente: {formatCurrency(valorPendente)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">Alunas com Pendências</h2>
              {alunasPendentes.length === 0 ? (
                <div className="bg-card rounded-lg p-6 text-center border border-border">
                  <Users className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhuma pendência no momento</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alunasPendentes.map((aluna: any) => (
                    <Link
                      key={aluna.id}
                      href={`/professora/alunas/${aluna.id}`}
                      className="block bg-card rounded-lg p-4 border border-border hover:bg-muted/60 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{aluna.nome}</h3>
                          <p className="text-sm text-muted-foreground">{aluna.turmas?.nome}</p>
                        </div>
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                          {aluna.qtdPendente} mês{aluna.qtdPendente > 1 ? "es" : ""}
                        </span>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="text-sm text-amber-900 font-medium">
                          Pendente: {formatCurrency(aluna.valorPendente)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
