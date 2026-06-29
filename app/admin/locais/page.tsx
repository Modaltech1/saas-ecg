"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Building2, Edit, GraduationCap, Loader2, MapPin, MapPinned, Plus, Trash2 } from "lucide-react"
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

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Polo = { id: string; nome: string; cidade: string }
type Local = {
  id: string
  nome: string
  endereco?: string
  polo_id: string
  ativo: boolean
  polos?: Polo
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"

export default function LocaisPage() {
  const { data: locaisData, isLoading: loadingLocais, mutate } = useSWR("/api/admin/locais", fetcher)
  const { data: polosData } = useSWR("/api/admin/polos", fetcher)

  const locais: Local[] = locaisData?.locais ?? []
  const polos: Polo[] = polosData?.polos ?? []

  const [searchQuery, setSearchQuery] = useState("")
  const [filteredPolo, setFilteredPolo] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedLocal, setSelectedLocal] = useState<Local | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ nome: "", endereco: "", polo_id: "" })

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return locais.filter((local) => {
      const matchSearch =
        local.nome.toLowerCase().includes(query) ||
        (local.endereco ?? "").toLowerCase().includes(query) ||
        (local.polos?.nome ?? "").toLowerCase().includes(query)
      const matchPolo = !filteredPolo || local.polo_id === filteredPolo
      return matchSearch && matchPolo
    })
  }, [locais, searchQuery, filteredPolo])

  const pagination = useTablePagination(filtered, `${searchQuery}:${filteredPolo}`)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    await fetch("/api/admin/locais", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    await mutate()
    setSalvando(false)
    setIsAddModalOpen(false)
    setForm({ nome: "", endereco: "", polo_id: "" })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedLocal) return
    setSalvando(true)
    await fetch(`/api/admin/locais/${selectedLocal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    await mutate()
    setSalvando(false)
    setIsEditModalOpen(false)
  }

  async function handleDelete() {
    if (!selectedLocal) return
    setSalvando(true)
    await fetch(`/api/admin/locais/${selectedLocal.id}`, { method: "DELETE" })
    await mutate()
    setSalvando(false)
    setIsDeleteModalOpen(false)
  }

  function openCreate() {
    setForm({ nome: "", endereco: "", polo_id: polos[0]?.id ?? "" })
    setIsAddModalOpen(true)
  }

  function openEdit(local: Local) {
    setSelectedLocal(local)
    setForm({ nome: local.nome, endereco: local.endereco ?? "", polo_id: local.polo_id })
    setIsEditModalOpen(true)
  }

  function clearFilters() {
    setSearchQuery("")
    setFilteredPolo("")
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeader title="Locais" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
        <PageHeader title="Locais" description="Espacos fisicos onde as turmas acontecem.">
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Adicionar local
          </Button>
        </PageHeader>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Locais cadastrados" value={locais.length} icon={Building2} tone="blue" />
          <MetricCard title="Polos com locais" value={new Set(locais.map((local) => local.polo_id)).size} icon={MapPinned} />
          <MetricCard title="Resultado filtrado" value={filtered.length} icon={GraduationCap} />
          <MetricCard title="Sem endereco" value={locais.filter((local) => !local.endereco).length} icon={Building2} tone="warning" />
        </div>

        <Card>
          <CardContent className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px_auto]">
              <FilterInput
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar por local, endereco ou polo"
              />
              <select value={filteredPolo} onChange={(e) => setFilteredPolo(e.target.value)} className={inputCls}>
                <option value="">Todos os polos</option>
                {polos.map((polo) => (
                  <option key={polo.id} value={polo.id}>
                    {polo.nome} - {polo.cidade}
                  </option>
                ))}
              </select>
              <Button variant="outline" onClick={clearFilters} disabled={!searchQuery && !filteredPolo}>
                Limpar filtros
              </Button>
            </div>

            {loadingLocais ? (
              <div className="flex min-h-64 items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="Nenhum local encontrado"
                description="Ajuste os filtros ou cadastre um novo local para vincular turmas."
                action={
                  <Button onClick={openCreate}>
                    <Plus className="size-4" />
                    Adicionar local
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Local</TableHead>
                      <TableHead>Polo</TableHead>
                      <TableHead>Endereco</TableHead>
                      <TableHead className="w-[220px] text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagination.pageItems.map((local) => (
                      <TableRow key={local.id}>
                        <TableCell className="font-medium text-foreground">{local.nome}</TableCell>
                        <TableCell>
                          <div className="text-foreground">{local.polos?.nome ?? "Sem polo"}</div>
                          <div className="text-xs text-muted-foreground">{local.polos?.cidade}</div>
                        </TableCell>
                        <TableCell className="max-w-md truncate text-muted-foreground">
                          {local.endereco || "Nao informado"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <TableDetailsButton href={`/admin/locais/${local.id}`} />
                            <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => openEdit(local)}>
                              <Edit className="size-3.5" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-destructive hover:text-destructive"
                              onClick={() => {
                                setSelectedLocal(local)
                                setIsDeleteModalOpen(true)
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

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adicionar local">
        <form className="space-y-4" onSubmit={handleAdd}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Polo</label>
            <select className={inputCls} value={form.polo_id} onChange={(e) => setForm((f) => ({ ...f, polo_id: e.target.value }))} required>
              <option value="">Selecione um polo</option>
              {polos.map((polo) => (
                <option key={polo.id} value={polo.id}>{polo.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Nome do local</label>
            <input className={inputCls} value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Ex: Escola Municipal" required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Endereco</label>
            <input className={inputCls} value={form.endereco} onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))} placeholder="Rua, numero, bairro" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando} className="flex-1">
              {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar local">
        <form className="space-y-4" onSubmit={handleEdit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Polo</label>
            <select className={inputCls} value={form.polo_id} onChange={(e) => setForm((f) => ({ ...f, polo_id: e.target.value }))} required>
              {polos.map((polo) => (
                <option key={polo.id} value={polo.id}>{polo.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Nome</label>
            <input className={inputCls} value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Endereco</label>
            <input className={inputCls} value={form.endereco} onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando} className="flex-1">
              {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Excluir local" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Deseja excluir <strong className="text-foreground">{selectedLocal?.nome}</strong>?
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>
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
