"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { SearchInput } from "@/components/ui/search-input"
import { Modal } from "@/components/ui/modal"
import { Plus, GraduationCap, Edit, Trash2, ChevronRight, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { criarProfessora, atualizarProfessora, desativarProfessora } from "@/lib/supabase/actions"
import { MetricCard } from "@/components/shared/metric-card"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Professora {
  id: string
  nome: string
  email: string | null
  ativo: boolean
  criado_em: string
  turmas_professoras: Array<{
    turma_id: string
    tipo_pagamento: string
    valor: number
    turmas: {
      id: string
      nome: string
      nivel: string
      polo_id: string
      polos: { nome: string } | null
    } | null
  }>
}

export function ProfessorasClient({ professoras: initial }: { professoras: Professora[] }) {
  const router = useRouter()
  const [professoras, setProfessoras] = useState(initial)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedProfessora, setSelectedProfessora] = useState<Professora | null>(null)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtradas = professoras.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.email ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  )
  const ativas = professoras.filter((prof) => prof.ativo).length
  const vinculosTurmas = professoras.reduce((total, prof) => total + prof.turmas_professoras.length, 0)

  async function handleAdicionarProfessora(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const form = e.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      const resultado = await criarProfessora(formData)
      if (resultado?.erro) {
        setErro(resultado.erro)
        return
      }
      setIsAddModalOpen(false)
      form.reset()
      router.refresh()
    })
  }

  async function handleEditarProfessora(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedProfessora) return
    setErro(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set("id", selectedProfessora.id)

    startTransition(async () => {
      const resultado = await atualizarProfessora(formData)

      if (resultado?.erro) {
        setErro(resultado.erro)
        return
      }

      setIsEditModalOpen(false)
      router.refresh()
    })
  }

  async function handleExcluirProfessora() {
    if (!selectedProfessora) return

    setErro(null)

    startTransition(async () => {
      const resultado = await desativarProfessora(selectedProfessora.id)

      if (resultado?.erro) {
        setErro(resultado.erro)
        return
      }

      setIsDeleteModalOpen(false)
      router.refresh()
    })
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
      <PageHeader title="Professoras" description="Equipe docente, acessos e vinculos com turmas.">
        <Button onClick={() => { setErro(null); setMostrarSenha(false); setIsAddModalOpen(true) }}>
          <Plus className="size-4" />
          Adicionar professora
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Professoras" value={professoras.length} icon={GraduationCap} tone="blue" />
        <MetricCard title="Ativas" value={ativas} icon={Eye} />
        <MetricCard title="Inativas" value={professoras.length - ativas} icon={EyeOff} tone="warning" />
        <MetricCard title="Vinculos com turmas" value={vinculosTurmas} icon={GraduationCap} />
      </div>

      <Card>
        <CardContent className="space-y-4">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Buscar professora..." />

      <section className="space-y-3">
        {filtradas.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhuma professora encontrada</p>
          </div>
        ) : (
          filtradas.map((prof) => {
            const turmas = prof.turmas_professoras.map((tp) => tp.turmas).filter(Boolean)
            const polos = new Set(turmas.map((t) => t?.polos?.nome).filter(Boolean))

            return (
              <div key={prof.id} className="bg-card rounded-lg border border-border overflow-hidden">
                <Link
                  href={`/admin/professoras/${prof.id}`}
                  className="block p-4 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-0.5">{prof.nome}</h3>
                      {prof.email && (
                        <p className="text-sm text-muted-foreground">{prof.email}</p>
                      )}
                      {polos.size > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {Array.from(polos).join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${prof.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}
                      >
                        {prof.ativo ? "Ativa" : "Inativa"}
                      </span>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Turmas</p>
                        <p className="font-semibold text-foreground">{turmas.length}</p>
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="flex border-t border-border">
                  <button
                    onClick={() => {
                      setSelectedProfessora(prof)
                      setErro(null)
                      setIsEditModalOpen(true)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm font-medium">Editar</span>
                  </button>
                  <div className="w-px bg-border" />
                  <button
                    onClick={() => {
                      setSelectedProfessora(prof)
                      setIsDeleteModalOpen(true)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-destructive hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Excluir</span>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </section>
        </CardContent>
      </Card>

      {/* Modal Adicionar */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adicionar Professora">
        <form className="space-y-4" onSubmit={handleAdicionarProfessora}>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nome Completo</label>
            <input
              name="nome"
              type="text"
              placeholder="Ex: Mariana Silva"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">E-mail</label>
            <input
              name="email"
              type="email"
              placeholder="mariana@email.com"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Senha inicial</label>
            <div className="relative">
              <input
                name="senha"
                type={mostrarSenha ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                className="w-full px-4 py-2.5 pr-12 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {erro && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{erro}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Professora">
        <form className="space-y-4" onSubmit={handleEditarProfessora}>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nome Completo</label>
            <input
              name="nome"
              type="text"
              defaultValue={selectedProfessora?.nome}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {selectedProfessora?.email && (
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">E-mail (não editável)</p>
              <p className="text-sm text-foreground">{selectedProfessora.email}</p>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-700">
              Para redefinir a senha, contate o desenvolvedor.
            </p>
          </div>

          {erro && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{erro}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Excluir */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Desativar Professora"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Tem certeza que deseja desativar{" "}
            <strong>{selectedProfessora?.nome}</strong>? Ela não poderá mais fazer login.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleExcluirProfessora}
              disabled={isPending}
              className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-60"
            >
              {isPending ? "Desativando..." : "Desativar"}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  )
}
