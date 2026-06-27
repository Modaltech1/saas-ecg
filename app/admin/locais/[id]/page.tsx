"use client"

import useSWR from "swr"
import { use } from "react"
import { MobileHeader } from "@/components/layout/mobile-header"
import { BackButton } from "@/components/ui/back-button"
import { Building2, GraduationCap, Users, MapPin, Loader2 } from "lucide-react"
import Link from "next/link"
const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function LocalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: local, isLoading } = useSWR(`/api/admin/locais/${id}`, fetcher)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!local || local.error) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">Local não encontrado</p>
      </div>
    )
  }

  const turmas: any[] = local.turmas ?? []
  const totalAlunas = turmas.reduce((s: number, t: any) => s + (t.alunas?.length ?? 0), 0)

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeader title={local.nome} />

      <main className="px-4 pb-6 space-y-5">
        <div className="pt-4">
          <BackButton />
        </div>

        {/* Info */}
        <section className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-foreground">{local.nome}</h2>
              <p className="text-sm text-muted-foreground">
                {local.polos?.nome} — {local.polos?.cidade}
              </p>
              {local.endereco && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span>{local.endereco}</span>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <GraduationCap className="w-4 h-4 mx-auto mb-1 text-green-500" />
              <p className="text-xl font-bold text-foreground">{turmas.length}</p>
              <p className="text-xs text-muted-foreground">Turmas</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <Users className="w-4 h-4 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold text-foreground">{totalAlunas}</p>
              <p className="text-xs text-muted-foreground">Alunas</p>
            </div>
          </div>
        </section>

        {/* Turmas */}
        <section className="space-y-3">
          <h3 className="font-bold text-foreground">Turmas</h3>
          {turmas.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma turma cadastrada.</p>
          )}
          {turmas.map((turma: any) => (
            <Link
              key={turma.id}
              href={`/admin/turmas/${turma.id}`}
              className="bg-card rounded-lg border border-border p-4 flex items-center justify-between hover:bg-muted/30 transition-colors block"
            >
              <div>
                <p className="font-semibold text-foreground">{turma.nome}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {turma.modalidade} • {turma.alunas?.length ?? 0} alunas
                </p>
              </div>
              <GraduationCap className="w-5 h-5 text-muted-foreground" />
            </Link>
          ))}
        </section>
      </main>
    </div>
  )
}
