"use client"

import useSWR from "swr"
import { use } from "react"
import { MobileHeader } from "@/components/layout/mobile-header"
import { BackButton } from "@/components/ui/back-button"
import { Building2, Users, GraduationCap, MapPin, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function PoloDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: polo, isLoading } = useSWR(`/api/admin/polos/${id}`, fetcher)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!polo || polo.error) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">Polo não encontrado</p>
      </div>
    )
  }

  const locais: any[] = polo.locais ?? []
  const totalAlunas = locais.reduce((s: number, l: any) => {
    return s + (l.turmas ?? []).reduce((st: number, t: any) => st + (t.alunas?.length ?? 0), 0)
  }, 0)
  const totalTurmas = locais.reduce((s: number, l: any) => s + (l.turmas?.length ?? 0), 0)

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeader title={polo.nome} />

      <main className="px-4 pb-6 space-y-5">
        <div className="pt-4">
          <BackButton />
        </div>

        {/* Info do polo */}
        <section className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-foreground">{polo.nome}</h2>
              <p className="text-sm text-muted-foreground">{polo.cidade}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <Building2 className="w-4 h-4 mx-auto mb-1 text-purple-500" />
              <p className="text-xl font-bold text-foreground">{locais.length}</p>
              <p className="text-xs text-muted-foreground">Locais</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <GraduationCap className="w-4 h-4 mx-auto mb-1 text-blue-500" />
              <p className="text-xl font-bold text-foreground">{totalTurmas}</p>
              <p className="text-xs text-muted-foreground">Turmas</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <Users className="w-4 h-4 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold text-foreground">{totalAlunas}</p>
              <p className="text-xs text-muted-foreground">Alunas</p>
            </div>
          </div>
        </section>

        {/* Locais do polo */}
        <section className="space-y-3">
          <h3 className="font-bold text-foreground">Locais</h3>
          {locais.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum local cadastrado.</p>
          )}
          {locais.map((local: any) => {
            const alunasCnt = (local.turmas ?? []).reduce((s: number, t: any) => s + (t.alunas?.length ?? 0), 0)
            return (
              <Link
                key={local.id}
                href={`/admin/locais/${local.id}`}
                className="bg-card rounded-lg border border-border p-4 flex items-center justify-between hover:bg-muted/30 transition-colors block"
              >
                <div>
                  <p className="font-semibold text-foreground">{local.nome}</p>
                  {local.endereco && <p className="text-xs text-muted-foreground mt-0.5">{local.endereco}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {local.turmas?.length ?? 0} turmas • {alunasCnt} alunas
                  </p>
                </div>
                <Building2 className="w-5 h-5 text-muted-foreground" />
              </Link>
            )
          })}
        </section>
      </main>
    </div>
  )
}
