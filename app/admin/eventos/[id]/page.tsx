// app/admin/eventos/[id]/page.tsx
"use client"

import useSWR from "swr"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Trophy, CalendarDays, MapPin, DollarSign, Users, Clock, CheckCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { MobileHeader } from "@/components/layout/mobile-header"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatDate(d: string) {
  const [y, m, day] = d.split("-")
  return `${day}/${m}/${y}`
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function formatCpf(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

export default function EventoDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [toggling, setToggling] = useState<string | null>(null)
  const [togglingEvento, setTogglingEvento] = useState(false)

  const { data, isLoading, mutate } = useSWR(`/api/admin/eventos/${id}`, fetcher)

  const evento = data?.evento
  const inscricoes: any[] = data?.inscricoes ?? []

  async function togglePago(inscricaoId: string, pagoAtual: boolean) {
    setToggling(inscricaoId)
    await fetch(`/api/admin/eventos/inscricoes/${inscricaoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pago: !pagoAtual }),
    })
    await mutate()
    setToggling(null)
  }

  async function toggleInscricoesEvento() {
    if (!evento) return

    const novoStatus = !(evento.ativo ?? true)

    try {
      setTogglingEvento(true)

      const res = await fetch(`/api/admin/eventos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: novoStatus }),
      })

      if (!res.ok) {
        console.error("Erro ao alterar status das inscrições do evento")
        return
      }

      await mutate()
    } finally {
      setTogglingEvento(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-(--color-background) flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!evento) {
    return (
      <div className="min-h-screen bg-(--color-background) flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Evento não encontrado.</p>
        <button onClick={() => router.push("/admin/eventos")} className="text-primary font-semibold text-sm">
          Voltar para Eventos
        </button>
      </div>
    )
  }

  const hoje = new Date().toISOString().split("T")[0]
  const isUpcoming = evento.data_evento >= hoje
  const totalPago = inscricoes.filter((i) => i.pago).length
  const totalPendente = inscricoes.length - totalPago
  const valorArrecadado = totalPago * (evento.taxa_inscricao ?? 0)
  const inscricoesAbertas = evento.ativo ?? true

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeader title={evento.nome} />

      <main className="max-w-2xl mx-auto px-4 pt-20 pb-8 space-y-4">
        {/* Voltar */}
        <button
          onClick={() => router.push("/admin/eventos")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Eventos
        </button>

        {/* Info do evento */}
        <div className="bg-card rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-foreground truncate">{evento.nome}</h1>

                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isUpcoming ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {isUpcoming ? "Próximo" : "Realizado"}
                  </span>

                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${inscricoesAbertas ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {inscricoesAbertas ? "Inscrições abertas" : "Inscrições encerradas"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[11px] font-medium text-muted-foreground">
                Inscrições
              </span>

              <button
                type="button"
                role="switch"
                aria-checked={inscricoesAbertas}
                disabled={togglingEvento}
                onClick={toggleInscricoesEvento}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-60 ${inscricoesAbertas ? "bg-green-500" : "bg-gray-300"
                  }`}
                title={inscricoesAbertas ? "Desativar inscrições" : "Ativar inscrições"}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-card shadow-sm transition-transform ${inscricoesAbertas ? "translate-x-5" : "translate-x-1"
                    }`}
                />
              </button>
            </div>
          </div>

          {evento.descricao && (
            <p className="text-sm text-muted-foreground leading-relaxed">{evento.descricao}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="text-sm font-medium text-foreground">{formatDate(evento.data_evento)}</p>
              </div>
            </div>
            {evento.local && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Local</p>
                  <p className="text-sm font-medium text-foreground">{evento.local}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Taxa de inscrição</p>
                <p className="text-sm font-medium text-foreground">
                  {evento.taxa_inscricao > 0 ? formatCurrency(evento.taxa_inscricao) : "Gratuito"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Inscritas</p>
                <p className="text-sm font-medium text-foreground">{inscricoes.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo financeiro — só exibe se tem taxa */}
        {evento.taxa_inscricao > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-lg border border-border p-3 text-center">
              <p className="text-xl font-bold text-foreground">{inscricoes.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total</p>
            </div>
            <div className="bg-card rounded-lg border border-green-200 p-3 text-center">
              <p className="text-xl font-bold text-green-600">{totalPago}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Pagos</p>
            </div>
            <div className="bg-card rounded-lg border border-amber-200 p-3 text-center">
              <p className="text-xl font-bold text-amber-500">{totalPendente}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Pendentes</p>
            </div>
          </div>
        )}

        {evento.taxa_inscricao > 0 && inscricoes.length > 0 && (
          <div className="bg-primary/10 rounded-lg border border-primary/20 px-4 py-3 flex items-center justify-between">
            <p className="text-sm font-medium text-primary">Arrecadado (pagos)</p>
            <p className="text-base font-bold text-primary">{formatCurrency(valorArrecadado)}</p>
          </div>
        )}

        {/* Lista de inscrições */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground px-1">
            Alunas Inscritas ({inscricoes.length})
          </h2>

          {inscricoes.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-8 text-center">
              <Users className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">Nenhuma aluna inscrita ainda</p>
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border divide-y divide-(--color-border)">
              {inscricoes.map((ins: any, idx: number) => (
                <div key={ins.id} className="px-4 py-3 flex items-center gap-3">
                  {/* Número */}
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{idx + 1}</span>
                  </div>

                  {/* Dados */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ins.nome_aluna}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCpf(ins.cpf_aluna)}
                      {ins.turma ? ` · ${ins.turma}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(ins.inscrito_em)}
                    </p>
                  </div>

                  {/* Botão pago — só aparece se o evento tem taxa */}
                  {evento.taxa_inscricao > 0 && (
                    <button
                      onClick={() => togglePago(ins.id, ins.pago)}
                      disabled={toggling === ins.id}
                      className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60 ${ins.pago
                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        }`}
                    >
                      {toggling === ins.id ? (
                        <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      ) : ins.pago ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {ins.pago ? "Pago" : "Pendente"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
