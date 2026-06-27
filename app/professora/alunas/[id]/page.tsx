"use client"

import { useState, use } from "react"
import { MobileHeader } from "@/components/layout/mobile-header"
import { BackButton } from "@/components/ui/back-button"
import { Users, Phone, Mail, Calendar, AlertCircle, CheckCircle } from "lucide-react"
import { formatCurrency, calculateAge, formatDate } from "@/lib/utils"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

const fetcher = async (alunaId: string) => {
  const supabase = createClient()

  const { data: aluna } = await supabase
    .from("alunas")
    .select(`
      id, nome, data_nascimento, status, turma_id,
      responsaveis(id, nome, telefone, whatsapp, email),
      turmas(id, nome, nivel, mensalidade, polos(nome), locais(nome))
    `)
    .eq("id", alunaId)
    .single()

  if (!aluna) return null

  const { data: pagamentos } = await supabase
    .from("pagamentos_mensalidade")
    .select("id, mes_referencia, valor, status, data_pagamento")
    .eq("aluna_id", alunaId)
    .order("mes_referencia", { ascending: false })

  return { aluna, pagamentos: pagamentos || [] }
}

export default function ProfessoraAlunaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, isLoading } = useSWR(`professora-aluna-${id}`, () => fetcher(id))
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!data?.aluna) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">Aluna não encontrada</p>
      </div>
    )
  }

  const { aluna, pagamentos } = data
  const turma = aluna.turmas as any
  const responsavel = aluna.responsaveis as any
  const idade = calculateAge(aluna.data_nascimento)
  const pendentes = pagamentos.filter((p: any) => p.status === "Pendente")
  const valorPendente = pendentes.reduce((sum: number, p: any) => sum + p.valor, 0)

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeader title={aluna.nome} />

      <main className="px-4 pb-6 space-y-6">
        <div className="pt-4">
          <BackButton />
        </div>

        {/* Info da aluna */}
        <section className="pt-4 bg-card rounded-lg p-4 border border-border">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-xl font-semibold">
              {aluna.nome.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-xl text-foreground mb-1">{aluna.nome}</h2>
              <p className="text-sm text-muted-foreground">{idade} anos</p>
              <span
                className={`inline-block mt-1.5 px-2 py-0.5 text-xs font-medium rounded-full ${
                  aluna.status === "Ativa" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                }`}
              >
                {aluna.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Nascimento:</span>
            <span className="font-medium text-foreground">{formatDate(aluna.data_nascimento)}</span>
          </div>
        </section>

        {/* Turma */}
        {turma && (
          <section className="bg-card rounded-lg p-4 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-3">Turma Atual</h3>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-foreground">{turma.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {turma.polos?.nome} • {turma.locais?.nome}
                </p>
                <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                  {turma.nivel}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Mensalidade</p>
                <p className="font-bold text-foreground">{formatCurrency(turma.mensalidade || 0)}</p>
              </div>
            </div>
          </section>
        )}

        {/* Responsável */}
        {responsavel && (
          <section className="bg-card rounded-lg p-4 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-3">Responsável</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-foreground">{responsavel.nome}</span>
              </div>
              {responsavel.whatsapp && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{responsavel.whatsapp}</span>
                </div>
              )}
              {responsavel.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{responsavel.email}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Histórico de pagamentos — somente leitura para professora */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-foreground">Histórico de Pagamentos</h3>

          {pendentes.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">
                    {pendentes.length} mês{pendentes.length > 1 ? "es" : ""} pendente{pendentes.length > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-amber-700 mt-1">Total: {formatCurrency(valorPendente)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {pagamentos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum pagamento registrado
              </p>
            ) : (
              pagamentos.map((pagamento: any) => {
                const [year, month] = pagamento.mes_referencia.split("-")
                const monthName = new Date(
                  Number.parseInt(year),
                  Number.parseInt(month) - 1
                ).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

                return (
                  <div key={pagamento.id} className="bg-card rounded-lg p-4 border border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground capitalize">{monthName}</p>
                        {pagamento.data_pagamento && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Pago em {formatDate(pagamento.data_pagamento)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-foreground">{formatCurrency(pagamento.valor)}</p>
                        {pagamento.status === "Pago" ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Pago
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Pendente
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
