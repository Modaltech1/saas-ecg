"use client"

import { useState, useMemo } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { MobileHeader } from "@/components/layout/mobile-header"
import {
  ClipboardList, Play, CheckCircle, Clock, ChevronDown, ChevronUp,
  X, Check, AlertCircle, History, Loader2,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type StatusPresenca = "presente" | "ausente" | "justificada"

const STATUS_LABEL: Record<StatusPresenca, string> = { presente: "Presente", ausente: "Ausente", justificada: "Justificada" }
const STATUS_BG_SELECTED: Record<StatusPresenca, string> = {
  presente: "bg-green-500 text-white border-green-500",
  ausente: "bg-red-500 text-white border-red-500",
  justificada: "bg-amber-500 text-white border-amber-500",
}

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]

function formatarData(dateStr: string) {
  const [y, m, d] = dateStr.split("-")
  return `${d}/${m}/${y}`
}

export default function ChamadasPage() {
  const { data: hojeData } = useSWR("/api/professora/chamadas?view=hoje", fetcher)
  const { data: historicoData } = useSWR("/api/professora/chamadas?view=historico", fetcher)

  const horariosDeTodas = hojeData?.horarios ?? []
  const turmas = hojeData?.turmas ?? []
  const chamadasHoje = hojeData?.chamadas ?? []
  const historico = historicoData?.historico ?? []

  const [aba, setAba] = useState<"hoje" | "historico">("hoje")
  const [chamadaAtiva, setChamadaAtiva] = useState<any>(null)
  const [presencas, setPresencas] = useState<Record<string, StatusPresenca>>({})
  const [observacoes, setObservacoes] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [chamadaEncerradaId, setChamadaEncerradaId] = useState<string | null>(null)
  const [expandidoHistorico, setExpandidoHistorico] = useState<string | null>(null)
  const [turmaFiltro, setTurmaFiltro] = useState("todas")

  const hoje = new Date().toISOString().split("T")[0]
  const diaHoje = DIAS_SEMANA[new Date().getDay()]

  function chamadaJaFeita(turmaId: string, horarioId: string) {
    return chamadasHoje.find((c: any) => c.turma_id === turmaId && c.horario_id === horarioId)
  }

  function iniciarChamada(turma: any, horario: any) {
    const presenciasIniciais: Record<string, StatusPresenca> = {}
    ;(turma.alunas ?? []).forEach((a: any) => { presenciasIniciais[a.id] = "presente" })
    setPresencas(presenciasIniciais)
    setObservacoes({})
    setChamadaAtiva({ turma, horario })
  }

  function alternarStatus(alunaId: string) {
    setPresencas((prev) => {
      const atual = prev[alunaId]
      const proximo: StatusPresenca = atual === "presente" ? "ausente" : atual === "ausente" ? "justificada" : "presente"
      return { ...prev, [alunaId]: proximo }
    })
  }

  async function salvarChamada() {
    if (!chamadaAtiva) return
    setSaving(true)
    try {
      const presencasList = Object.entries(presencas).map(([aluna_id, status]) => ({
        aluna_id, status, observacao: observacoes[aluna_id] ?? null,
      }))
      const res = await fetch("/api/professora/chamadas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turma_id: chamadaAtiva.turma.id, horario_id: chamadaAtiva.horario.id, data: hoje, presencas: presencasList }),
      })
      if (res.ok) {
        const { id } = await res.json()
        globalMutate("/api/professora/chamadas?view=hoje")
        globalMutate("/api/professora/chamadas?view=historico")
        setChamadaEncerradaId(id)
        setChamadaAtiva(null)
        setTimeout(() => setChamadaEncerradaId(null), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  const historicoFiltrado = useMemo(() => {
    return (historico as any[])
      .filter((c: any) => turmaFiltro === "todas" || c.turma_id === turmaFiltro)
      .sort((a: any, b: any) => b.data.localeCompare(a.data))
  }, [historico, turmaFiltro])

  // Tela de chamada ativa
  if (chamadaAtiva) {
    const alunasDaTurma = chamadaAtiva.turma.alunas ?? []
    const totalPresentes = Object.values(presencas).filter((s) => s === "presente").length
    const totalAusentes = Object.values(presencas).filter((s) => s === "ausente").length
    const totalJustificadas = Object.values(presencas).filter((s) => s === "justificada").length

    return (
      <div className="min-h-screen bg-muted/30">
        <MobileHeader title="Chamada em Andamento" />
        <main className="px-4 pb-8 space-y-4">
          <div className="bg-primary rounded-lg p-4 text-primary-foreground">
            <p className="font-bold text-lg">{chamadaAtiva.turma.nome}</p>
            <p className="text-sm opacity-80">{chamadaAtiva.horario.dia_semana} • {chamadaAtiva.horario.hora_inicio}–{chamadaAtiva.horario.hora_fim}</p>
            <p className="text-sm opacity-80">{formatarData(hoje)}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{totalPresentes}</p>
              <p className="text-xs text-green-600 font-medium">Presentes</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-700">{totalAusentes}</p>
              <p className="text-xs text-red-600 font-medium">Ausentes</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{totalJustificadas}</p>
              <p className="text-xs text-amber-600 font-medium">Justificadas</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Toque para alternar: Presente → Ausente → Justificada
            </p>
            {alunasDaTurma.map((aluna: any) => {
              const status = presencas[aluna.id] ?? "presente"
              const obs = observacoes[aluna.id] ?? ""
              return (
                <div key={aluna.id} className="bg-card rounded-lg border border-border overflow-hidden">
                  <button onClick={() => alternarStatus(aluna.id)} className="w-full flex items-center gap-4 p-4 text-left active:opacity-70 transition-opacity">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${status === "presente" ? "bg-green-100 text-green-700" : status === "ausente" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {aluna.nome.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{aluna.nome}</p>
                      {obs && <p className="text-xs text-muted-foreground truncate">{obs}</p>}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${STATUS_BG_SELECTED[status]}`}>{STATUS_LABEL[status]}</span>
                  </button>
                  {(status === "ausente" || status === "justificada") && (
                    <div className="px-4 pb-3 pt-0 border-t border-border/40">
                      <input type="text" placeholder="Observação (opcional)" value={obs} onChange={(e) => setObservacoes((prev) => ({ ...prev, [aluna.id]: e.target.value }))} className="w-full text-sm px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-(--color-background)" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setChamadaAtiva(null)} className="flex-1 py-3 border-2 border-border rounded-lg font-semibold text-foreground flex items-center justify-center gap-2">
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button onClick={salvarChamada} disabled={saving} className="flex-1 py-3 bg-primary rounded-lg font-bold text-primary-foreground flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Encerrar Chamada
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeader title="Chamadas" />

      {chamadaEncerradaId && (
        <div className="fixed top-16 left-4 right-4 z-50">
          <div className="bg-green-600 text-white rounded-lg p-4 flex items-center gap-3 shadow-lg">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-semibold">Chamada encerrada e salva com sucesso!</p>
          </div>
        </div>
      )}

      <main className="pb-8">
        <div className="px-4 pt-2 flex gap-2 mb-4">
          <button onClick={() => setAba("hoje")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${aba === "hoje" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}>
            Chamadas de Hoje
          </button>
          <button onClick={() => setAba("historico")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${aba === "historico" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}>
            Histórico
          </button>
        </div>

        {aba === "hoje" && (
          <div className="px-4 space-y-3">
            <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <p className="text-sm text-foreground">
                <span className="font-semibold">{diaHoje}</span>,{" "}
                {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>

            {horariosDeTodas.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-foreground">Nenhuma aula hoje</p>
                <p className="text-sm text-muted-foreground mt-1">Não há horários cadastrados para {diaHoje}.</p>
              </div>
            ) : horariosDeTodas.map((item: any) => {
              const chamadaFeita = chamadaJaFeita(item.turma_id, item.id)
              return (
                <div key={`${item.turma_id}-${item.id}`} className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground text-base">{item.turma_nome}</h3>
                        <p className="text-sm text-muted-foreground">{item.turma_nivel}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{item.hora_inicio} – {item.hora_fim}</p>
                      </div>
                      {chamadaFeita ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-sm font-semibold rounded-full"><CheckCircle className="w-4 h-4" /> Concluída</span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full"><AlertCircle className="w-4 h-4" /> Pendente</span>
                      )}
                    </div>
                    {chamadaFeita ? (
                      <div className="flex gap-3 text-sm">
                        <span className="text-green-700 font-medium">{chamadaFeita.n_presentes} presentes</span>
                        <span className="text-red-600 font-medium">{chamadaFeita.n_ausentes} ausentes</span>
                        {chamadaFeita.n_justificadas > 0 && <span className="text-amber-600 font-medium">{chamadaFeita.n_justificadas} justificadas</span>}
                      </div>
                    ) : (
                      <button onClick={() => {
                        const turma = turmas.find((t: any) => t.id === item.turma_id)
                        if (turma) iniciarChamada(turma, item)
                      }} className="w-full mt-1 py-2.5 bg-primary rounded-lg font-bold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                        <Play className="w-4 h-4" /> Iniciar Chamada ({item.n_alunas} alunas)
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {aba === "historico" && (
          <div className="px-4 space-y-3">
            <select value={turmaFiltro} onChange={(e) => setTurmaFiltro(e.target.value)} className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="todas">Todas as turmas</option>
              {turmas.map((t: any) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>

            {historicoFiltrado.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <History className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-foreground">Nenhuma chamada registrada</p>
              </div>
            ) : historicoFiltrado.map((chamada: any) => {
              const isExpandido = expandidoHistorico === chamada.id
              return (
                <div key={chamada.id} className="bg-card border border-border rounded-lg overflow-hidden">
                  <button onClick={() => setExpandidoHistorico(isExpandido ? null : chamada.id)} className="w-full p-4 text-left">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{chamada.turma_nome}</p>
                        <p className="text-sm text-muted-foreground">{formatarData(chamada.data)}{chamada.hora_inicio ? ` • ${chamada.hora_inicio}–${chamada.hora_fim}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-2 text-sm">
                          <span className="text-green-700 font-semibold">{chamada.n_presentes}P</span>
                          <span className="text-red-600 font-semibold">{chamada.n_ausentes}A</span>
                          {chamada.n_justificadas > 0 && <span className="text-amber-600 font-semibold">{chamada.n_justificadas}J</span>}
                        </div>
                        {isExpandido ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </button>

                  {isExpandido && (
                    <div className="border-t border-border divide-y divide-(--color-border)">
                      {(chamada.presencas ?? []).map((p: any) => (
                        <div key={p.aluna_id} className="flex items-center justify-between px-4 py-2.5">
                          <div>
                            <p className="text-sm font-medium text-foreground">{p.aluna_nome}</p>
                            {p.observacao && <p className="text-xs text-muted-foreground">{p.observacao}</p>}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            p.status === "presente" ? "bg-green-100 text-green-700 border-green-200" :
                            p.status === "ausente" ? "bg-red-100 text-red-700 border-red-200" :
                            "bg-amber-100 text-amber-700 border-amber-200"
                          }`}>{STATUS_LABEL[p.status as StatusPresenca]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
