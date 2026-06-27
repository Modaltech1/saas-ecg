"use client"

import { useState } from "react"
import { MobileHeader } from "@/components/layout/mobile-header"
import { SearchInput } from "@/components/ui/search-input"
import { Users, AlertCircle, CheckCircle, ChevronRight } from "lucide-react"
import { calculateAge } from "@/lib/utils"
import Link from "next/link"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

const fetcher = async () => {
  const supabase = createClient()

  // Usa getSession() — lê do cookie, zero network call
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return { turmas: [], alunas: [] }

  // Turmas da professora
  const { data: tp } = await supabase
    .from("turmas_professoras")
    .select("turma_id")
    .eq("professora_id", user.id)

  const turmaIds = (tp || []).map((t: any) => t.turma_id)
  if (turmaIds.length === 0) return { turmas: [], alunas: [] }

  const { data: turmas } = await supabase
    .from("turmas")
    .select("id, nome, nivel, polos(nome), locais(nome)")
    .in("id", turmaIds)

  const { data: alunas } = await supabase
    .from("alunas")
    .select(`
      id, nome, data_nascimento, status, turma_id,
      responsaveis(nome, whatsapp),
      turmas(nome, nivel)
    `)
    .in("turma_id", turmaIds)
    .order("nome")

  // Pendências de mensalidade
  const alunaIds = (alunas || []).map((a: any) => a.id)
  const { data: pendencias } = await supabase
    .from("pagamentos_mensalidade")
    .select("aluna_id")
    .in("aluna_id", alunaIds)
    .eq("status", "Pendente")

  const pendenciasPorAluna: Record<string, number> = {}
  for (const p of pendencias || []) {
    pendenciasPorAluna[p.aluna_id] = (pendenciasPorAluna[p.aluna_id] || 0) + 1
  }

  return {
    turmas: turmas || [],
    alunas: (alunas || []).map((a: any) => ({
      ...a,
      pendencias: pendenciasPorAluna[a.id] || 0,
    })),
  }
}

export default function ProfessoraAlunasPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredTurma, setFilteredTurma] = useState("")
  const [filteredStatus, setFilteredStatus] = useState("")

  const { data, isLoading } = useSWR("professora-alunas", fetcher)

  const turmas = data?.turmas || []
  const alunas = data?.alunas || []

  const filteredAlunas = alunas.filter((aluna: any) => {
    const matchesSearch = aluna.nome.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTurma = !filteredTurma || aluna.turma_id === filteredTurma
    const matchesStatus =
      !filteredStatus ||
      (filteredStatus === "emdia" && aluna.pendencias === 0) ||
      (filteredStatus === "pendente" && aluna.pendencias > 0)
    return matchesSearch && matchesTurma && matchesStatus
  })

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeader title="Minhas Alunas" />

      <main className="px-4 pb-6 space-y-4">
        <div className="pt-4 space-y-3">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Buscar aluna..." />

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">
              Filtrar por Turma
            </label>
            <select
              value={filteredTurma}
              onChange={(e) => setFilteredTurma(e.target.value)}
              className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="">Todas as turmas</option>
              {turmas.map((turma: any) => (
                <option key={turma.id} value={turma.id}>
                  {turma.nome} - {turma.nivel}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">
              Status
            </label>
            <select
              value={filteredStatus}
              onChange={(e) => setFilteredStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="">Todas</option>
              <option value="emdia">Em dia</option>
              <option value="pendente">Com pendência</option>
            </select>
          </div>
        </div>

        <section className="space-y-2">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Carregando alunas...</p>
            </div>
          ) : filteredAlunas.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhuma aluna encontrada</p>
            </div>
          ) : (
            filteredAlunas.map((aluna: any) => {
              const idade = calculateAge(aluna.data_nascimento)
              return (
                <Link
                  key={aluna.id}
                  href={`/professora/alunas/${aluna.id}`}
                  className="flex items-center justify-between gap-3 bg-card rounded-lg border border-border p-3 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{aluna.nome}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {idade} anos • {aluna.turmas?.nome}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {aluna.pendencias > 0 ? (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {aluna.pendencias}m
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Link>
              )
            })
          )}
        </section>
      </main>
    </div>
  )
}
