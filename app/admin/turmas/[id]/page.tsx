"use client"


import useSWR from "swr"
import { use } from "react"
import { MobileHeader } from "@/components/layout/mobile-header"
import { BackButton } from "@/components/ui/back-button"
import { GraduationCap, Users, MapPin, Loader2, ChevronRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]

export default function TurmaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: turma, isLoading } = useSWR(`/api/admin/turmas/${id}`, fetcher)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!turma || turma.error) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">Turma não encontrada</p>
      </div>
    )
  }

  const alunas: any[] = turma.alunas ?? []
  const horarios: any[] = turma.horarios ?? []
  const professoras: any[] = turma.turmas_professoras ?? []

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeader title={turma.nome} />

      <main className="px-4 pb-6 space-y-5">
        <div className="pt-4">
          <BackButton />
        </div>

        {/* Info da turma */}
        <section className="bg-card rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-xl text-foreground">{turma.nome}</h2>
              <p className="text-sm text-muted-foreground">{turma.modalidade} • {turma.nivel}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="w-3 h-3" />
                <span>{turma.polos?.nome} — {turma.locais?.nome}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/30 rounded-lg p-3 col-span-2">
              <p className="text-xs text-muted-foreground mb-1.5">Horários</p>
              {horarios.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum horário cadastrado</p>
              ) : (
                <div className="space-y-1">
                  {horarios.map((h: any) => (
                    <p key={h.id} className="text-sm font-medium text-foreground">
                      {h.dia_semana} · {h.hora_inicio?.slice(0, 5)} — {h.hora_fim?.slice(0, 5)}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-0.5">Mensalidade</p>
              <p className="font-bold text-foreground">{formatCurrency(turma.mensalidade ?? 0)}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-0.5">Nível</p>
              <p className="font-semibold text-foreground text-sm">{turma.nivel ?? "—"}</p>
            </div>
          </div>

          {professoras.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Professoras</p>
              <div className="space-y-1.5">
                {professoras.map((tp: any) => (
                  <div key={tp.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                    <p className="text-sm font-medium text-foreground">{tp.perfis?.nome ?? tp.professora_id}</p>
                    <span className="text-xs text-muted-foreground">
                      {tp.tipo_pagamento === "fixo" ? `R$ ${Number(tp.valor).toFixed(2)}` : `${tp.valor}%`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${turma.ativa ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {turma.ativa ? "Ativa" : "Inativa"}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              {alunas.length} aluna{alunas.length !== 1 ? "s" : ""}
            </span>
          </div>
        </section>

        {/* Alunas da turma */}
        <section className="space-y-3">
          <h3 className="font-bold text-foreground">Alunas</h3>
          {alunas.length === 0 && (
            <div className="bg-card rounded-lg border border-border p-6 text-center">
              <Users className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">Nenhuma aluna nesta turma</p>
            </div>
          )}
          {alunas.map((aluna: any) => (
            <Link
              key={aluna.id}
              href={`/admin/alunas/${aluna.id}`}
              className="bg-card rounded-lg border border-border p-3 flex items-center justify-between hover:bg-muted/30 transition-colors block"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {aluna.nome?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{aluna.nome}</p>
                  <span className={`text-xs ${aluna.status === "ativa" || aluna.status === "Ativa" ? "text-green-600" : "text-gray-500"}`}>
                    {aluna.status}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          ))}
        </section>
      </main>
    </div>
  )
}
