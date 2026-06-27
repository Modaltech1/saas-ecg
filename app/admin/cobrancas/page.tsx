"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import {
  AlertCircle,
  CheckCircle,
  CheckSquare,
  Clock,
  Filter,
  Loader2,
  MessageCircle,
  Send,
  Users,
} from "lucide-react"
import { MobileHeader } from "@/components/layout/mobile-header"
import { FilterInput } from "@/components/shared/filters"
import { MetricCard } from "@/components/shared/metric-card"
import { PageHeader } from "@/components/shared/page-header"
import { TablePagination, useTablePagination } from "@/components/shared/table-pagination"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Modal } from "@/components/ui/modal"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatMonth(reference: string) {
  const [year, month] = reference.split("-")
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("pt-BR", {
    month: "short",
    year: "2-digit",
  })
}

function totalPendente(ap: any) {
  return ap.meses_pendentes?.reduce((sum: number, item: any) => sum + Number(item.valor), 0) ?? 0
}

function encodeWhatsApp(ap: any) {
  const meses = ap.meses_pendentes?.map((p: any) => formatMonth(p.mes_referencia)) ?? []
  const total = totalPendente(ap)
  const msg = encodeURIComponent(
    `Ola, ${ap.responsavel_nome}! Passando para informar que a mensalidade de ${ap.nome} (${ap.turma_nome}) esta em aberto. Meses: ${meses.join(", ")}. Total: ${formatCurrency(total)}. Pode realizar o pagamento pelo link ou chave PIX. Qualquer duvida, estou aqui!`,
  )
  const num = ap.responsavel_whatsapp?.replace(/\D/g, "")
  return `https://wa.me/55${num}?text=${msg}`
}

export default function CobrancasPage() {
  const { data: cobrancasData, isLoading } = useSWR("/api/admin/cobrancas", fetcher)
  const { data: polosData } = useSWR("/api/admin/polos", fetcher)
  const { data: locaisData } = useSWR("/api/admin/locais", fetcher)
  const { data: turmasData } = useSWR("/api/admin/turmas", fetcher)

  const alunasPendentes = cobrancasData?.alunas ?? []
  const polos: any[] = polosData?.polos ?? []
  const locais: any[] = locaisData?.locais ?? []
  const turmas: any[] = turmasData?.turmas ?? []

  const [filtroPolo, setFiltroPolo] = useState("")
  const [filtroLocal, setFiltroLocal] = useState("")
  const [filtroTurma, setFiltroTurma] = useState("")
  const [busca, setBusca] = useState("")
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const [isCobrarTodosModal, setIsCobrarTodosModal] = useState(false)
  const [cobradaIds, setCobradaIds] = useState<Set<string>>(new Set())

  const locaisFiltrados = filtroPolo ? locais.filter((local: any) => local.polo_id === filtroPolo) : locais
  const turmasFiltradas = useMemo(() => {
    let next = turmas
    if (filtroPolo) next = next.filter((turma: any) => turma.polo_id === filtroPolo)
    if (filtroLocal) next = next.filter((turma: any) => turma.local_id === filtroLocal)
    return next
  }, [turmas, filtroPolo, filtroLocal])

  const resultados = useMemo(() => {
    const query = busca.toLowerCase()
    return alunasPendentes.filter((ap: any) => {
      if (filtroPolo && ap.polo_id !== filtroPolo) return false
      if (filtroLocal && ap.local_id !== filtroLocal) return false
      if (filtroTurma && ap.turma_id !== filtroTurma) return false
      if (query && !ap.nome.toLowerCase().includes(query)) return false
      return true
    })
  }, [alunasPendentes, filtroPolo, filtroLocal, filtroTurma, busca])

  const pagination = useTablePagination(resultados, `${busca}:${filtroPolo}:${filtroLocal}:${filtroTurma}`)
  const totalPendenteGeral = alunasPendentes.reduce((sum: number, ap: any) => sum + totalPendente(ap), 0)
  const totalFiltrado = resultados.reduce((sum: number, ap: any) => sum + totalPendente(ap), 0)
  const selecionadasDaBusca = resultados.filter((ap: any) => selecionadas.has(ap.id))
  const totalSelecionado = selecionadasDaBusca.reduce((sum: number, ap: any) => sum + totalPendente(ap), 0)

  function toggleSelecionada(id: string) {
    setSelecionadas((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleTodas() {
    if (selecionadasDaBusca.length === resultados.length) {
      setSelecionadas(new Set())
      return
    }
    setSelecionadas(new Set(resultados.map((ap: any) => ap.id)))
  }

  function clearFilters() {
    setBusca("")
    setFiltroPolo("")
    setFiltroLocal("")
    setFiltroTurma("")
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeader title="Cobrancas" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
        <PageHeader title="Cobrancas" description="Acompanhamento financeiro das alunas com pendencias em aberto.">
          <Button
            onClick={() => setIsCobrarTodosModal(true)}
            disabled={selecionadas.size === 0}
          >
            <MessageCircle className="size-4" />
            Cobrar selecionadas
          </Button>
        </PageHeader>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Total pendente" value={formatCurrency(totalPendenteGeral)} icon={AlertCircle} tone="warning" />
          <MetricCard title="Alunas em atraso" value={alunasPendentes.length} icon={Users} />
          <MetricCard title="Resultado filtrado" value={resultados.length} icon={Filter} tone="blue" />
          <MetricCard title="Selecionado" value={formatCurrency(totalSelecionado)} icon={CheckSquare} />
        </div>

        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="size-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_220px_220px_220px_auto]">
              <FilterInput
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar aluna"
              />
              <select
                value={filtroPolo}
                onChange={(e) => {
                  setFiltroPolo(e.target.value)
                  setFiltroLocal("")
                  setFiltroTurma("")
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Todos os polos</option>
                {polos.map((polo: any) => (
                  <option key={polo.id} value={polo.id}>{polo.nome}</option>
                ))}
              </select>
              <select
                value={filtroLocal}
                onChange={(e) => {
                  setFiltroLocal(e.target.value)
                  setFiltroTurma("")
                }}
                disabled={!filtroPolo}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
              >
                <option value="">Todos os locais</option>
                {locaisFiltrados.map((local: any) => (
                  <option key={local.id} value={local.id}>{local.nome}</option>
                ))}
              </select>
              <select
                value={filtroTurma}
                onChange={(e) => setFiltroTurma(e.target.value)}
                disabled={!filtroPolo}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
              >
                <option value="">Todas as turmas</option>
                {turmasFiltradas.map((turma: any) => (
                  <option key={turma.id} value={turma.id}>{turma.nome}</option>
                ))}
              </select>
              <Button variant="outline" onClick={clearFilters} disabled={!busca && !filtroPolo && !filtroLocal && !filtroTurma}>
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Pendencias encontradas</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(totalFiltrado)} em aberto nesta visualizacao</p>
              </div>
              {resultados.length > 0 ? (
                <Button variant="outline" onClick={toggleTodas}>
                  <CheckSquare className="size-4" />
                  {selecionadasDaBusca.length === resultados.length ? "Desmarcar todas" : "Selecionar todas"}
                </Button>
              ) : null}
            </div>

            {isLoading ? (
              <div className="flex min-h-64 items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : resultados.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title="Nenhuma pendencia encontrada"
                description="Todos os filtros selecionados estao em dia ou nao ha mensalidades abertas."
              />
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12" />
                      <TableHead>Aluna</TableHead>
                      <TableHead>Turma</TableHead>
                      <TableHead>Pendencias</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[230px] text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagination.pageItems.map((ap: any) => {
                      const mesesPendentes = ap.meses_pendentes ?? []
                      const total = totalPendente(ap)
                      const isSelecionada = selecionadas.has(ap.id)
                      const isCobrada = cobradaIds.has(ap.id)

                      return (
                        <TableRow key={ap.id} data-state={isSelecionada ? "selected" : undefined}>
                          <TableCell>
                            <button
                              type="button"
                              onClick={() => toggleSelecionada(ap.id)}
                              className={`flex size-5 items-center justify-center rounded border transition-colors ${
                                isSelecionada ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background"
                              }`}
                              aria-label={isSelecionada ? "Remover da selecao" : "Selecionar para cobranca"}
                              title={isSelecionada ? "Remover da selecao" : "Selecionar para cobranca"}
                            >
                              {isSelecionada ? <CheckCircle className="size-3" /> : null}
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-foreground">{ap.nome}</div>
                            <div className="text-xs text-muted-foreground">{ap.responsavel_whatsapp}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-foreground">{ap.turma_nome}</div>
                            <div className="text-xs text-muted-foreground">{ap.polo_nome}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {mesesPendentes.map((item: any) => (
                                <span key={item.id} className="inline-flex items-center rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
                                  <Clock className="mr-1 size-3" />
                                  {formatMonth(item.mes_referencia)}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-[color:var(--warning)]">
                            {formatCurrency(total)}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button asChild variant="outline" size="sm" className="h-8 px-3">
                                <Link href={`/admin/alunas/${ap.id}`}>Ficha</Link>
                              </Button>
                              <Button
                                asChild
                                variant={isCobrada ? "outline" : "default"}
                                size="sm"
                                className="h-8 px-3"
                              >
                                <a
                                  href={encodeWhatsApp(ap)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setCobradaIds((prev) => new Set([...prev, ap.id]))}
                                >
                                  <MessageCircle className="size-3.5" />
                                  {isCobrada ? "Cobrado" : "Cobrar"}
                                </a>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                <TablePagination {...pagination} />
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Modal isOpen={isCobrarTodosModal} onClose={() => setIsCobrarTodosModal(false)} title="Cobrar selecionadas">
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="size-5 text-[color:var(--warning)]" />
              <div>
                <p className="font-semibold text-foreground">{selecionadasDaBusca.length} alunas selecionadas</p>
                <p className="text-sm text-muted-foreground">Total: {formatCurrency(totalSelecionado)}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Cada item abre uma conversa individual no WhatsApp com a mensagem pronta.
            </p>
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {selecionadasDaBusca.map((ap: any) => {
              const total = totalPendente(ap)
              const isCobrada = cobradaIds.has(ap.id)

              return (
                <a
                  key={ap.id}
                  href={encodeWhatsApp(ap)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setCobradaIds((prev) => new Set([...prev, ap.id]))}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors ${
                    isCobrada ? "border-[color:var(--success)]/30 bg-[color:var(--success)]/10 text-[color:var(--success)]" : "border-border bg-card hover:bg-muted/60"
                  }`}
                >
                  <div>
                    <p className="font-medium">{ap.nome}</p>
                    <p className="text-xs opacity-70">{ap.responsavel_whatsapp}</p>
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    {formatCurrency(total)}
                    {isCobrada ? <CheckCircle className="size-4" /> : <Send className="size-4" />}
                  </div>
                </a>
              )
            })}
          </div>

          <Button
            className="w-full"
            onClick={() => {
              setIsCobrarTodosModal(false)
              setSelecionadas(new Set())
            }}
          >
            Concluir
          </Button>
        </div>
      </Modal>
    </div>
  )
}
