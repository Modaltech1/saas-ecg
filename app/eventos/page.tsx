// app/eventos/page.tsx
"use client"

import useSWR from "swr"
import { useState } from "react"
import { PublicHeader } from "@/components/layout/public-header"
import { Modal } from "@/components/ui/modal"
import { Trophy, CalendarDays, MapPin, Users, DollarSign, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Evento = {
  id: string
  nome: string
  descricao: string | null
  data_evento: string
  local: string | null
  taxa_inscricao: number
  total_inscritos: number
  ativo: boolean
}

function formatDate(d: string) {
  const [y, m, day] = d.split("-")
  return new Date(Number(y), Number(m) - 1, Number(day)).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function maskCpf(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

export default function EventosPublicPage() {
  const { data, isLoading } = useSWR("/api/public/eventos", fetcher)
  const eventos: Evento[] = data?.eventos ?? []

  const [eventoSelecionado, setEventoSelecionado] = useState<Evento | null>(null)
  const [cpf, setCpf] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [resultado, setResultado] = useState<{ sucesso: boolean; mensagem: string; nome?: string } | null>(null)

  function abrirModal(ev: Evento) {
    if (!ev.ativo) return

    setEventoSelecionado(ev)
    setCpf("")
    setResultado(null)
  }

  function fecharModal() {
    setEventoSelecionado(null)
    setCpf("")
    setResultado(null)
  }

  async function handleInscrever(e: React.FormEvent) {
    e.preventDefault()
    if (!eventoSelecionado) return
    setSalvando(true)
    setResultado(null)

    const res = await fetch(`/api/public/eventos/${eventoSelecionado.id}/inscrever`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cpf }),
    })
    const json = await res.json()
    setSalvando(false)

    if (res.ok) {
      setResultado({ sucesso: true, mensagem: `Inscrição realizada com sucesso!`, nome: json.inscricao?.nome_aluna })
    } else {
      setResultado({ sucesso: false, mensagem: json.error ?? "Erro ao realizar inscrição" })
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <PublicHeader />

      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground text-balance">Eventos & Competições</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Inscreva sua filha nos próximos eventos da Equipe Carolina Garcia.
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && eventos.length === 0 && (
          <div className="text-center py-16">
            <Trophy className="w-14 h-14 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-1">Nenhum evento disponível</h2>
            <p className="text-sm text-muted-foreground">Novos eventos serão anunciados em breve.</p>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {eventos.map((ev) => (
            <div key={ev.id} className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
              {/* Header do card */}
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-foreground text-lg leading-tight">{ev.nome}</h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CalendarDays className="w-4 h-4 text-primary" />
                        <span className="capitalize">{formatDate(ev.data_evento)}</span>
                      </div>
                      {ev.local && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 text-primary" />
                          {ev.local}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {ev.descricao && (
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{ev.descricao}</p>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {ev.total_inscritos} inscritas
                    </div>
                    {ev.taxa_inscricao > 0 ? (
                      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <DollarSign className="w-4 h-4 text-primary" />
                        {formatCurrency(ev.taxa_inscricao)}
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-[color:var(--success)]">Gratuito</span>
                    )}
                  </div>
                  {ev.ativo ? (
                    <button
                      onClick={() => abrirModal(ev)}
                      className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
                    >
                      Inscrever
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-lg border border-border bg-muted px-5 py-2 text-sm font-semibold text-muted-foreground"
                    >
                      Inscrições encerradas
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Modal isOpen={!!eventoSelecionado} onClose={fecharModal} title={`Inscrever em: ${eventoSelecionado?.nome ?? ""}`}>
        {resultado?.sucesso ? (
          <div className="text-center py-4 space-y-3">
            <div className="mx-auto flex size-16 items-center justify-center rounded-lg bg-[color:var(--success)]/10">
              <CheckCircle className="size-8 text-[color:var(--success)]" />
            </div>
            <div>
              <p className="font-bold text-foreground text-lg">{resultado.nome}</p>
              <p className="text-muted-foreground text-sm mt-1">{resultado.mensagem}</p>
              {eventoSelecionado?.taxa_inscricao && eventoSelecionado.taxa_inscricao > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Taxa de inscrição: <strong>{formatCurrency(eventoSelecionado.taxa_inscricao)}</strong>.<br />
                  O pagamento deve ser realizado com a equipe.
                </p>
              )}
            </div>
            <button onClick={fecharModal} className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold mt-2">
              Fechar
            </button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleInscrever}>
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Digite o CPF da aluna para inscrevê-la no evento{" "}
                <strong>{eventoSelecionado?.nome}</strong>.
                {eventoSelecionado?.data_evento && (
                  <> Realizado em <strong className="capitalize">{formatDate(eventoSelecionado.data_evento)}</strong>.</>
                )}
              </p>
              <label className="block text-sm font-medium text-foreground mb-1.5">CPF da Aluna</label>
              <input
                type="text"
                inputMode="numeric"
                value={cpf}
                onChange={(e) => setCpf(maskCpf(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm text-center"
                required
              />
            </div>

            {resultado && !resultado.sucesso && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{resultado.mensagem}</p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={fecharModal} className="flex-1 px-4 py-2.5 border border-border rounded-lg font-semibold text-foreground">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando || cpf.replace(/\D/g, "").length !== 11}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
                {salvando ? "Inscrevendo..." : "Confirmar"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
