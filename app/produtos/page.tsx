"use client"

import { useState } from "react"
import useSWR from "swr"
import { ShoppingBag, MessageCircle, Filter, Tag, ChevronRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { PublicHeader } from "@/components/layout/public-header"

const fetcher = (url: string) => fetch(url).then((r) => r.json())
const categorias = ["Todos", "Uniforme", "Sapatilha", "Equipamento", "Roupa", "Acessório", "Outro"] as const

function encodeWhatsAppMsg(produto: any, whatsapp: string) {
  const msg = encodeURIComponent(
    `Olá! Tenho interesse no produto: *${produto.nome}* (${formatCurrency(produto.valor)}). Poderia me dar mais informações?`
  )
  const num = (whatsapp ?? "").replace(/\D/g, "")
  return `https://wa.me/55${num}?text=${msg}`
}

export default function ProdutosPublicPage() {
  const { data } = useSWR("/api/public/produtos", fetcher)
  const produtos = data?.produtos ?? []
  const whatsappAdmin = data?.whatsapp_admin ?? ""

  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("Todos")

  const produtosFiltrados = categoriaAtiva === "Todos"
    ? produtos
    : produtos.filter((p: any) => p.categoria === categoriaAtiva)

  const disponiveisFiltrados = produtosFiltrados.filter((p: any) => p.disponivel)
  const indisponiveisFiltrados = produtosFiltrados.filter((p: any) => !p.disponivel)

  return (
    <div className="min-h-screen bg-muted/30">
      <PublicHeader subtitle="Loja de Produtos" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShoppingBag className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Nossos Produtos</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Tudo que sua filha precisa para a ginastica ritmica. Clique no produto e fale conosco pelo WhatsApp para comprar!
              </p>
            </div>
          </div>
        </section>

        <div className="flex items-center gap-2 overflow-x-auto rounded-lg border border-border bg-card p-3">
          <Filter className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          {categorias.map((cat) => (
            <button key={cat} onClick={() => setCategoriaAtiva(cat)}
              className={`flex-shrink-0 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${categoriaAtiva === cat ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted"}`}>
              {cat}
            </button>
          ))}
        </div>

        {disponiveisFiltrados.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-bold text-foreground">Disponíveis ({disponiveisFiltrados.length})</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {disponiveisFiltrados.map((produto: any) => (
              <div key={produto.id} className="bg-card rounded-lg border border-border p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        <Tag className="w-3 h-3" />{produto.categoria}
                      </span>
                      <span className="size-2 rounded-full bg-[color:var(--success)]" />
                    </div>
                    <h3 className="font-bold text-foreground text-base leading-tight">{produto.nome}</h3>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className="text-xl font-bold">{formatCurrency(produto.valor)}</p>
                  </div>
                </div>
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{produto.descricao}</p>
                {produto.tamanhos?.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">Tamanhos disponíveis:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {produto.tamanhos.map((t: string) => (
                        <span key={t} className="rounded-md border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                {whatsappAdmin && (
                  <a href={encodeWhatsAppMsg(produto, whatsappAdmin)} target="_blank" rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--success)] px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--success)]/90">
                    <MessageCircle className="w-4 h-4" /> Tenho interesse — WhatsApp <ChevronRight className="w-4 h-4 ml-auto" />
                  </a>
                )}
              </div>
            ))}
            </div>
          </section>
        )}

        {indisponiveisFiltrados.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-muted-foreground">Temporariamente indisponíveis</h2>
            {indisponiveisFiltrados.map((produto: any) => (
              <div key={produto.id} className="bg-muted/30 rounded-lg border border-border p-4 opacity-60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="mb-0.5 flex items-center gap-2"><span className="size-2 rounded-full bg-muted-foreground" /><span className="text-xs text-muted-foreground">{produto.categoria}</span></div>
                    <h3 className="font-semibold text-muted-foreground">{produto.nome}</h3>
                  </div>
                  <p className="font-bold text-muted-foreground">{formatCurrency(produto.valor)}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Indisponível no momento</p>
              </div>
            ))}
          </section>
        )}

        {disponiveisFiltrados.length === 0 && indisponiveisFiltrados.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhum produto nesta categoria.</p>
          </div>
        )}

        <footer className="space-y-1 pb-4 text-center text-xs text-muted-foreground">
          <p>
            desenvolvido por{" "}
            <a href="https://www.prodexylabs.com/" target="_blank" rel="noopener noreferrer" className="font-semibold transition-colors hover:text-foreground">
              Prodexy
            </a>
          </p>
          {whatsappAdmin && (
            <a href={`https://wa.me/55${whatsappAdmin.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-[color:var(--success)] hover:underline">
              <MessageCircle className="w-3.5 h-3.5" /> Fale conosco no WhatsApp
            </a>
          )}
        </footer>
      </main>
    </div>
  )
}
