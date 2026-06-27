"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { CalendarDays, Edit, Loader2, MapPin, Plus, Trash2, Trophy, Users } from "lucide-react"
import { MobileHeader } from "@/components/layout/mobile-header"
import { FilterInput } from "@/components/shared/filters"
import { MetricCard } from "@/components/shared/metric-card"
import { PageHeader } from "@/components/shared/page-header"
import { TableDetailsButton } from "@/components/shared/table-details-button"
import { TablePagination, useTablePagination } from "@/components/shared/table-pagination"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"

type Evento = {
  id: string
  nome: string
  descricao: string | null
  data_evento: string
  local: string | null
  taxa_inscricao: number
  ativo: boolean
  total_inscritos: number
}

type FormState = { nome: string; descricao: string; data_evento: string; local: string; taxa_inscricao: string }

const emptyForm: FormState = { nome: "", descricao: "", data_evento: "", local: "", taxa_inscricao: "0" }

function formatDate(date: string) {
  const [year, month, day] = date.split("-")
  return `${day}/${month}/${year}`
}

function isUpcoming(date: string) {
  return date >= new Date().toISOString().split("T")[0]
}

function FormFields({
  form,
  setF,
  erro,
}: {
  form: FormState
  setF: (key: keyof FormState, value: string) => void
  erro: string | null
}) {
  return (
    <>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Nome do evento</label>
        <input
          className={inputCls}
          value={form.nome}
          onChange={(e) => setF("nome", e.target.value)}
          placeholder="Ex: Campeonato Interno"
          required
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Data</label>
          <input
            type="date"
            className={inputCls}
            value={form.data_evento}
            onChange={(e) => setF("data_evento", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Taxa de inscricao</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className={inputCls}
            value={form.taxa_inscricao}
            onChange={(e) => setF("taxa_inscricao", e.target.value)}
            placeholder="0,00"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Local</label>
        <input
          className={inputCls}
          value={form.local}
          onChange={(e) => setF("local", e.target.value)}
          placeholder="Ex: Ginasio Central"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Descricao</label>
        <textarea
          className={inputCls}
          rows={3}
          value={form.descricao}
          onChange={(e) => setF("descricao", e.target.value)}
          placeholder="Detalhes sobre o evento"
        />
      </div>
      {erro ? <p className="text-sm font-medium text-destructive">{erro}</p> : null}
    </>
  )
}

export default function EventosAdminPage() {
  const { data, isLoading, mutate } = useSWR("/api/admin/eventos", fetcher)
  const eventos: Evento[] = data?.eventos ?? []

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<Evento | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const query = search.toLowerCase()
    return eventos.filter((evento) => {
      const matchesSearch =
        evento.nome.toLowerCase().includes(query) ||
        (evento.local ?? "").toLowerCase().includes(query)
      const upcoming = isUpcoming(evento.data_evento)
      const matchesStatus = !status || (status === "proximos" ? upcoming : !upcoming)
      return matchesSearch && matchesStatus
    })
  }, [eventos, search, status])

  const pagination = useTablePagination(filtered, `${search}:${status}`)
  const proximos = eventos.filter((evento) => isUpcoming(evento.data_evento)).length
  const passados = eventos.length - proximos
  const totalInscricoes = eventos.reduce((sum, evento) => sum + (evento.total_inscritos ?? 0), 0)

  function setF(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function openCreate() {
    setForm(emptyForm)
    setErro(null)
    setIsAddOpen(true)
  }

  function openEdit(evento: Evento) {
    setSelected(evento)
    setForm({
      nome: evento.nome,
      descricao: evento.descricao ?? "",
      data_evento: evento.data_evento,
      local: evento.local ?? "",
      taxa_inscricao: String(evento.taxa_inscricao),
    })
    setErro(null)
    setIsEditOpen(true)
  }

  async function handleAdd(ev: React.FormEvent) {
    ev.preventDefault()
    setErro(null)
    setSalvando(true)
    const res = await fetch("/api/admin/eventos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, taxa_inscricao: parseFloat(form.taxa_inscricao) || 0 }),
    })
    const json = await res.json()
    setSalvando(false)
    if (!res.ok) {
      setErro(json.error)
      return
    }
    await mutate()
    setIsAddOpen(false)
    setForm(emptyForm)
  }

  async function handleEdit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!selected) return
    setErro(null)
    setSalvando(true)
    const res = await fetch(`/api/admin/eventos/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, taxa_inscricao: parseFloat(form.taxa_inscricao) || 0 }),
    })
    const json = await res.json()
    setSalvando(false)
    if (!res.ok) {
      setErro(json.error)
      return
    }
    await mutate()
    setIsEditOpen(false)
  }

  async function handleDelete() {
    if (!selected) return
    setSalvando(true)
    await fetch(`/api/admin/eventos/${selected.id}`, { method: "DELETE" })
    await mutate()
    setSalvando(false)
    setIsDeleteOpen(false)
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeader title="Eventos" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
        <PageHeader title="Eventos" description="Calendario de atividades, inscricoes e taxas avulsas.">
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Criar evento
          </Button>
        </PageHeader>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Eventos cadastrados" value={eventos.length} icon={Trophy} tone="blue" />
          <MetricCard title="Proximos" value={proximos} icon={CalendarDays} />
          <MetricCard title="Passados" value={passados} icon={CalendarDays} tone="warning" />
          <MetricCard title="Inscricoes" value={totalInscricoes} icon={Users} />
        </div>

        <Card>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
              <FilterInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por evento ou local"
              />
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Todos</option>
                <option value="proximos">Proximos</option>
                <option value="passados">Passados</option>
              </select>
              <Button variant="outline" onClick={() => { setSearch(""); setStatus("") }} disabled={!search && !status}>
                Limpar filtros
              </Button>
            </div>

            {isLoading ? (
              <div className="flex min-h-64 items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="Nenhum evento encontrado"
                description="Ajuste os filtros ou crie um novo evento para abrir inscricoes."
                action={
                  <Button onClick={openCreate}>
                    <Plus className="size-4" />
                    Criar evento
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead className="text-right">Inscricoes</TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                      <TableHead className="w-[220px] text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagination.pageItems.map((evento) => (
                      <TableRow key={evento.id}>
                        <TableCell>
                          <div className="font-medium text-foreground">{evento.nome}</div>
                          <div className="text-xs text-muted-foreground">
                            {isUpcoming(evento.data_evento) ? "Proximo" : "Passado"}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(evento.data_evento)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="size-3.5" />
                            {evento.local || "Nao informado"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{evento.total_inscritos}</TableCell>
                        <TableCell className="text-right font-medium">
                          {evento.taxa_inscricao > 0 ? formatCurrency(evento.taxa_inscricao) : "Gratuito"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <TableDetailsButton href={`/admin/eventos/${evento.id}`} />
                            <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => openEdit(evento)}>
                              <Edit className="size-3.5" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-destructive hover:text-destructive"
                              onClick={() => {
                                setSelected(evento)
                                setIsDeleteOpen(true)
                              }}
                            >
                              <Trash2 className="size-3.5" />
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <TablePagination {...pagination} />
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Criar evento">
        <form className="space-y-4" onSubmit={handleAdd}>
          <FormFields form={form} setF={setF} erro={erro} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando} className="flex-1">
              {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
              Criar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar evento">
        <form className="space-y-4" onSubmit={handleEdit}>
          <FormFields form={form} setF={setF} erro={erro} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando} className="flex-1">
              {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Excluir evento" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir <strong className="text-foreground">{selected?.nome}</strong>?
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={salvando}>
              {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
