"use client"

import { useState } from "react"
import useSWR from "swr"
import { MobileHeader } from "@/components/layout/mobile-header"
import { SearchInput } from "@/components/ui/search-input"
import { FilterChip } from "@/components/ui/filter-chip"
import { GraduationCap, Users, DollarSign, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ProfessoraTurmasPage() {
  const { data } = useSWR("/api/professora/turmas", fetcher)
  const turmas = data?.turmas ?? []
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredPolo, setFilteredPolo] = useState("")

  const polosUnicos = Array.from(new Set(turmas.map((t: any) => t.polo_id))) as string[]
  const poloOptions = [
    { value: "", label: "Todos" },
    ...polosUnicos.map((id: string) => {
      const t = turmas.find((x: any) => x.polo_id === id)
      return { value: id, label: t?.polo_nome ?? id }
    }),
  ]

  const filteredTurmas = turmas.filter((turma: any) => {
    const matchesSearch = turma.nome?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPolo = !filteredPolo || turma.polo_id === filteredPolo
    return matchesSearch && matchesPolo
  })

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeader title="Minhas Turmas" />

      <main className="px-4 pb-6 space-y-4">
        <div className="pt-4 space-y-3">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Buscar turma..." />
          <FilterChip label="Polo" value={filteredPolo} options={poloOptions} onChange={setFilteredPolo} />
        </div>

        <section className="space-y-3">
          {filteredTurmas.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhuma turma encontrada</p>
            </div>
          ) : filteredTurmas.map((turma: any) => (
            <Link
              key={turma.id}
              href={`/professora/turmas/${turma.id}`}
              className="block bg-card rounded-lg p-4 border border-border hover:bg-muted/60 transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{turma.nome}</h3>
                  <p className="text-sm text-muted-foreground">
                    {turma.polo_nome} • {turma.local_nome}
                  </p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                    {turma.nivel}
                  </span>
                </div>
                {turma.n_pendentes > 0 && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {turma.n_pendentes}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Alunas</p>
                  </div>
                  <p className="font-semibold text-sm text-foreground">{turma.n_alunas ?? 0}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Mensalidade</p>
                  </div>
                  <p className="font-semibold text-sm text-foreground">{formatCurrency(turma.mensalidade)}</p>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  )
}
