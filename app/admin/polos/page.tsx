"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Building2, Edit, Loader2, MapPin, Plus, Trash2, Users } from "lucide-react"
import { MobileHeader } from "@/components/layout/mobile-header"
import { MetricCard } from "@/components/shared/metric-card"
import { PageHeader } from "@/components/shared/page-header"
import { TableDetailsButton } from "@/components/shared/table-details-button"
import { TablePagination, useTablePagination } from "@/components/shared/table-pagination"
import { FilterInput } from "@/components/shared/filters"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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

type Polo = {
  id: string
  nome: string
  cidade: string
  observacoes?: string
  ativo: boolean
  locais?: { id: string }[]
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"

export default function PolosPage() {
  const { data, isLoading, mutate } = useSWR("/api/admin/polos", fetcher)
  const polos: Polo[] = data?.polos ?? []

  const [searchQuery, setSearchQuery] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedPolo, setSelectedPolo] = useState<Polo | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ nome: "", cidade: "", observacoes: "" })

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return polos.filter((polo) => polo.nome.toLowerCase().includes(query) || polo.cidade.toLowerCase().includes(query))
  }, [polos, searchQuery])

  const pagination = useTablePagination(filtered, searchQuery)
  const locaisTotal = polos.reduce((total, polo) => total + (polo.locais?.length ?? 0), 0)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    await fetch("/api/admin/polos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    await mutate()
    setSalvando(false)
    setIsAddModalOpen(false)
    setForm({ nome: "", cidade: "", observacoes: "" })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPolo) return
    setSalvando(true)
    await fetch(`/api/admin/polos/${selectedPolo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    await mutate()
    setSalvando(false)
    setIsEditModalOpen(false)
  }

  async function handleDelete() {
    if (!selectedPolo) return
    setSalvando(true)
    await fetch(`/api/admin/polos/${selectedPolo.id}`, { method: "DELETE" })
    await mutate()
    setSalvando(false)
    setIsDeleteModalOpen(false)
  }

  function openEdit(polo: Polo) {
    setSelectedPolo(polo)
    setForm({ nome: polo.nome, cidade: polo.cidade, observacoes: polo.observacoes ?? "" })
    setIsEditModalOpen(true)
  }

  function openCreate() {
    setForm({ nome: "", cidade: "", observacoes: "" })
    setIsAddModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeader title="Polos" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
        <PageHeader title="Polos" description="Estrutura macro de atendimento e distribuicao dos locais.">
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Adicionar polo
          </Button>
        </PageHeader>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Polos cadastrados" value={polos.length} icon={MapPin} tone="blue" />
          <MetricCard title="Locais vinculados" value={locaisTotal} icon={Building2} />
          <MetricCard title="Media de locais" value={polos.length ? (locaisTotal / polos.length).toFixed(1) : "0"} icon={Users} />
          <MetricCard title="Resultado filtrado" value={filtered.length} icon={MapPin} />
        </div>

        <Card>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <FilterInput
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar por polo ou cidade"
              />
              <Button variant="outline" onClick={() => setSearchQuery("")} disabled={!searchQuery}>
                Limpar filtros
              </Button>
            </div>

            {isLoading ? (
              <div className="flex min-h-64 items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="Nenhum polo encontrado"
                description="Ajuste a busca ou cadastre um novo polo para organizar os locais."
                action={
                  <Button onClick={openCreate}>
                    <Plus className="size-4" />
                    Adicionar polo
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Polo</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead className="text-right">Locais</TableHead>
                      <TableHead className="w-[220px] text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagination.pageItems.map((polo) => (
                      <TableRow key={polo.id}>
                        <TableCell>
                          <div className="font-medium text-foreground">{polo.nome}</div>
                          {polo.observacoes ? (
                            <div className="max-w-sm truncate text-xs text-muted-foreground">{polo.observacoes}</div>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{polo.cidade}</TableCell>
                        <TableCell className="text-right font-medium">{polo.locais?.length ?? 0}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <TableDetailsButton href={`/admin/polos/${polo.id}`} />
                            <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => openEdit(polo)}>
                              <Edit className="size-3.5" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-destructive hover:text-destructive"
                              onClick={() => {
                                setSelectedPolo(polo)
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

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adicionar polo">
        <form className="space-y-4" onSubmit={handleAdd}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Nome do polo</label>
            <input className={inputCls} value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Ex: Polo Sao Mateus" required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Cidade</label>
            <input className={inputCls} value={form.cidade} onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))} placeholder="Ex: Sao Mateus" required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Observacoes</label>
            <input className={inputCls} value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))} placeholder="Opcional" />
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

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar polo">
        <form className="space-y-4" onSubmit={handleEdit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Nome do polo</label>
            <input className={inputCls} value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Cidade</label>
            <input className={inputCls} value={form.cidade} onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Observacoes</label>
            <input className={inputCls} value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))} placeholder="Opcional" />
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

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Excluir polo" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir <strong className="text-foreground">{selectedPolo?.nome}</strong>?
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
