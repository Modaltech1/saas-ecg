"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import {
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  ShoppingBag,
  Tag,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react"
import { MobileHeader } from "@/components/layout/mobile-header"
import { FilterInput } from "@/components/shared/filters"
import { MetricCard } from "@/components/shared/metric-card"
import { PageHeader } from "@/components/shared/page-header"
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
const CATEGORIAS = ["Roupa", "Sapatilha", "Equipamento", "Uniforme", "Acessorio", "Outro"]
const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"

export default function AdminProdutosPage() {
  const { data: produtosData, mutate } = useSWR("/api/admin/produtos", fetcher)
  const produtos: any[] = Array.isArray(produtosData)
    ? produtosData
    : Array.isArray(produtosData?.produtos)
      ? produtosData.produtos
      : []

  const [busca, setBusca] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState("")
  const [filtroDisponivel, setFiltroDisponivel] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModal, setIsDeleteModal] = useState(false)
  const [produtoAtual, setProdutoAtual] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({
    nome: "",
    descricao: "",
    valor: "",
    categoria: "Uniforme",
    disponivel: true,
    tamanhos: [],
  })
  const [tamanhoInput, setTamanhoInput] = useState("")

  const resultados = useMemo(() => {
    const query = busca.toLowerCase()
    return produtos.filter((produto: any) => {
      if (query && !produto.nome.toLowerCase().includes(query)) return false
      if (filtroCategoria && produto.categoria !== filtroCategoria) return false
      if (filtroDisponivel === "sim" && !produto.disponivel) return false
      if (filtroDisponivel === "nao" && produto.disponivel) return false
      return true
    })
  }, [produtos, busca, filtroCategoria, filtroDisponivel])

  const pagination = useTablePagination(resultados, `${busca}:${filtroCategoria}:${filtroDisponivel}`)
  const disponiveis = produtos.filter((produto: any) => produto.disponivel).length
  const indisponiveis = produtos.length - disponiveis

  function abrirAdicionar() {
    setProdutoAtual(null)
    setForm({ nome: "", descricao: "", valor: "", categoria: "Uniforme", disponivel: true, tamanhos: [] })
    setTamanhoInput("")
    setIsModalOpen(true)
  }

  function abrirEditar(produto: any) {
    setProdutoAtual(produto)
    setForm({ ...produto, tamanhos: produto.tamanhos ? [...produto.tamanhos] : [] })
    setTamanhoInput("")
    setIsModalOpen(true)
  }

  function adicionarTamanho() {
    const tamanho = tamanhoInput.trim()
    if (tamanho && !form.tamanhos?.includes(tamanho)) {
      setForm((current: any) => ({ ...current, tamanhos: [...(current.tamanhos || []), tamanho] }))
      setTamanhoInput("")
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const url = produtoAtual ? `/api/admin/produtos/${produtoAtual.id}` : "/api/admin/produtos"
      const method = produtoAtual ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        mutate()
        setIsModalOpen(false)
      }
    } finally {
      setSaving(false)
    }
  }

  async function excluir() {
    if (!produtoAtual) return
    setSaving(true)
    try {
      await fetch(`/api/admin/produtos/${produtoAtual.id}`, { method: "DELETE" })
      mutate()
      setIsDeleteModal(false)
    } finally {
      setSaving(false)
    }
  }

  async function toggleDisponivel(produto: any) {
    await fetch(`/api/admin/produtos/${produto.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...produto, disponivel: !produto.disponivel }),
    })
    mutate()
  }

  function clearFilters() {
    setBusca("")
    setFiltroCategoria("")
    setFiltroDisponivel("")
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeader title="Produtos" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
        <PageHeader title="Produtos" description="Catalogo administrativo de itens exibidos na vitrine publica.">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/produtos" target="_blank">
                <ExternalLink className="size-4" />
                Ver vitrine
              </Link>
            </Button>
            <Button onClick={abrirAdicionar}>
              <Plus className="size-4" />
              Adicionar produto
            </Button>
          </div>
        </PageHeader>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Produtos" value={produtos.length} icon={ShoppingBag} tone="blue" />
          <MetricCard title="Disponiveis" value={disponiveis} icon={Eye} />
          <MetricCard title="Indisponiveis" value={indisponiveis} icon={EyeOff} tone="warning" />
          <MetricCard title="Resultado filtrado" value={resultados.length} icon={Tag} />
        </div>

        <Card>
          <CardContent className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px_auto]">
              <FilterInput
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar produto"
              />
              <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Todas as categorias</option>
                {CATEGORIAS.map((categoria) => (
                  <option key={categoria}>{categoria}</option>
                ))}
              </select>
              <select value={filtroDisponivel} onChange={(e) => setFiltroDisponivel(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Todos</option>
                <option value="sim">Disponiveis</option>
                <option value="nao">Indisponiveis</option>
              </select>
              <Button variant="outline" onClick={clearFilters} disabled={!busca && !filtroCategoria && !filtroDisponivel}>
                Limpar
              </Button>
            </div>

            {resultados.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="Nenhum produto encontrado"
                description="Ajuste os filtros ou cadastre um novo item para a vitrine."
                action={
                  <Button onClick={abrirAdicionar}>
                    <Plus className="size-4" />
                    Adicionar produto
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Tamanhos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[260px] text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagination.pageItems.map((produto: any) => (
                      <TableRow key={produto.id} className={!produto.disponivel ? "opacity-70" : undefined}>
                        <TableCell>
                          <div className="font-medium text-foreground">{produto.nome}</div>
                          <div className="max-w-md truncate text-xs text-muted-foreground">{produto.descricao}</div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                            <Tag className="size-3" />
                            {produto.categoria}
                          </span>
                        </TableCell>
                        <TableCell>
                          {produto.tamanhos?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {produto.tamanhos.map((tamanho: string) => (
                                <span key={tamanho} className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                                  {tamanho}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
                            produto.disponivel
                              ? "bg-[color:var(--success)]/10 text-[color:var(--success)]"
                              : "bg-muted text-muted-foreground"
                          }`}
                          >
                            {produto.disponivel ? "Disponivel" : "Indisponivel"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(produto.valor)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => toggleDisponivel(produto)}>
                              {produto.disponivel ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                              {produto.disponivel ? "Desativar" : "Ativar"}
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => abrirEditar(produto)}>
                              <Pencil className="size-3.5" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-destructive hover:text-destructive"
                              onClick={() => {
                                setProdutoAtual(produto)
                                setIsDeleteModal(true)
                              }}
                            >
                              <Trash2 className="size-3.5" />
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={produtoAtual ? "Editar produto" : "Adicionar produto"}>
        <form onSubmit={salvar} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Nome do produto</label>
            <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Collant Oficial" required className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Descricao</label>
            <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} required placeholder="Descreva o produto" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Valor</label>
              <input type="number" step="0.01" min="0" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} required className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Categoria</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={inputCls}>
                {CATEGORIAS.map((categoria) => (
                  <option key={categoria}>{categoria}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Tamanhos</label>
            <div className="mb-2 flex gap-2">
              <input
                type="text"
                value={tamanhoInput}
                onChange={(e) => setTamanhoInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    adicionarTamanho()
                  }
                }}
                placeholder="Ex: P, M, G ou 34"
                className={inputCls}
              />
              <Button type="button" onClick={adicionarTamanho} className="px-3">
                <Plus className="size-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(form.tamanhos || []).map((tamanho: string) => (
                <button
                  key={tamanho}
                  type="button"
                  onClick={() => setForm((current: any) => ({ ...current, tamanhos: current.tamanhos.filter((item: string) => item !== tamanho) }))}
                  className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  {tamanho} x
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Disponivel na vitrine</p>
              <p className="text-xs text-muted-foreground">Controla se os pais conseguem ver este produto.</p>
            </div>
            <button type="button" onClick={() => setForm((current: any) => ({ ...current, disponivel: !current.disponivel }))}>
              {form.disponivel ? <ToggleRight className="size-8 text-primary" /> : <ToggleLeft className="size-8 text-muted-foreground" />}
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModal} onClose={() => setIsDeleteModal(false)} title="Excluir produto" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir <strong className="text-foreground">{produtoAtual?.nome}</strong>?
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" className="flex-1" onClick={excluir} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
