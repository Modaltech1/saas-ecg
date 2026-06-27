"use client"

import { useState, use } from "react"
import useSWR, { mutate } from "swr"
import { MobileHeader } from "@/components/layout/mobile-header"
import { Fragment } from "react"
import { Modal } from "@/components/ui/modal"
import { BackButton } from "@/components/ui/back-button"
import {
  Users, Phone, Mail, Calendar, AlertCircle, CheckCircle,
  MessageCircle, GraduationCap, MapPin, Loader2, Plus, Trash2,
} from "lucide-react"
import { formatCurrency, formatDate, calculateAge } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AlunaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, isLoading } = useSWR(`/api/admin/alunas/${id}`, fetcher)
  const { data: turmasData } = useSWR("/api/admin/turmas", fetcher)
  const turmas: any[] = turmasData?.turmas ?? []

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isCobrarModalOpen, setIsCobrarModalOpen] = useState(false)
  const [transferTurmaId, setTransferTurmaId] = useState("")
  const [mesPagamento, setMesPagamento] = useState("")
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split("T")[0])
  const [isNovaCobrancaOpen, setIsNovaCobrancaOpen] = useState(false)
  const [mesCobranca, setMesCobranca] = useState("")
  const [saving, setSaving] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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

  const { aluna, mensalidades = [], matriculas = [] } = data
  const turma = aluna.turmas
  const polo = turma?.polos
  const local = turma?.locais
  const responsavel = aluna.responsaveis?.[0]
  const idade = calculateAge(aluna.data_nascimento)

  const pendentes = mensalidades.filter((p: any) => p.status === "pendente" || p.status === "Pendente")
  const valorPendente = pendentes.reduce((s: number, p: any) => s + (p.valor ?? 0), 0)

  const handleTransferir = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/admin/alunas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turma_id: transferTurmaId }),
    })
    await mutate(`/api/admin/alunas/${id}`)
    setSaving(false)
    setIsTransferModalOpen(false)
  }

  const handleRegistrarPagamento = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const pag = pendentes.find((p: any) => p.mes_referencia === mesPagamento)
    if (pag) {
      await fetch(`/api/admin/cobrancas/${pag.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pago", data_pagamento: dataPagamento }),
      })
      await mutate(`/api/admin/alunas/${id}`)
    }
    setSaving(false)
    setIsPaymentModalOpen(false)
  }

  const handleCriarCobranca = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/admin/alunas/${id}/cobrancas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aluna_id: id,
        turma_id: aluna.turma_id,
        mes_referencia: mesCobranca,
      }),
    })
    await mutate(`/api/admin/alunas/${id}`)
    setSaving(false)
    setIsNovaCobrancaOpen(false)
    setMesCobranca("")
  }

  const handleExcluirCobranca = async (pagamentoId: string, mesRef: string) => {
    const confirmado = window.confirm(
      `Deseja excluir a mensalidade pendente de ${formatMes(mesRef)}? Esta ação não pode ser desfeita.`
    )
    if (!confirmado) return

    setSaving(true)
    const res = await fetch(`/api/admin/cobrancas/${pagamentoId}`, { method: "DELETE" })
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}))
      alert(payload?.error ?? "Não foi possível excluir a mensalidade.")
      setSaving(false)
      return
    }
    await mutate(`/api/admin/alunas/${id}`)
    setSaving(false)
  }

  const formatMes = (mesRef: string) => {
    const [year, month] = mesRef.split("-")
    return new Date(Number(year), Number(month) - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  }

  const whatsappCobrar = () => {
    if (!responsavel?.whatsapp) return "#"
    const num = responsavel.whatsapp.replace(/\D/g, "")
    const mesesStr = pendentes.map((p: any) => formatMes(p.mes_referencia)).join(", ")
    const msg = encodeURIComponent(
      `Olá ${responsavel.nome}! Identificamos mensalidades pendentes para ${aluna.nome}: ${mesesStr}. Total: ${formatCurrency(valorPendente)}. Por favor, acesse o portal para regularizar.`
    )
    return `https://wa.me/55${num}?text=${msg}`
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeader title={aluna.nome} />

      <main className="px-4 pb-6 space-y-5">
        <div className="pt-4">
          <BackButton />
        </div>

        {/* Info da aluna */}
        <section className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
              {aluna.nome.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-xl text-foreground">{aluna.nome}</h2>
              <p className="text-sm text-muted-foreground">{idade} anos</p>
              <span className={`inline-block mt-1.5 px-2 py-0.5 text-xs font-medium rounded-full ${
                aluna.status === "ativa" || aluna.status === "Ativa"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}>
                {aluna.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Nascimento: <strong className="text-foreground">{formatDate(aluna.data_nascimento)}</strong></span>
          </div>
        </section>

        {/* Turma */}
        {turma && (
          <section className="bg-card rounded-lg border border-border p-4 space-y-3">
            <h3 className="font-bold text-foreground">Turma Atual</h3>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-foreground">{turma.nome}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span>{polo?.nome} — {local?.nome}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground">{formatCurrency(turma.mensalidade ?? 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Desconto: {Number(aluna.desconto_percentual ?? 0).toFixed(2)}%
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="w-full px-4 py-2 border border-primary text-primary rounded-lg text-sm font-semibold hover:bg-primary/10 transition-colors"
            >
              Transferir de Turma
            </button>
          </section>
        )}

        {/* Responsável */}
        {responsavel && (
          <section className="bg-card rounded-lg border border-border p-4 space-y-2">
            <h3 className="font-bold text-foreground mb-2">Responsável</h3>
            <div className="flex items-center gap-3 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{responsavel.nome}</span>
            </div>
            {responsavel.whatsapp && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{responsavel.whatsapp}</span>
              </div>
            )}
            {responsavel.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{responsavel.email}</span>
              </div>
            )}
          </section>
        )}

        {/* Status financeiro */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground">Histórico de Pagamentos</h3>
            <button
              onClick={() => setIsNovaCobrancaOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Cobrança
            </button>
          </div>

          {pendentes.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">
                    {pendentes.length} mês{pendentes.length > 1 ? "es" : ""} pendente{pendentes.length > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-amber-700 mt-0.5">Total: {formatCurrency(valorPendente)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Registrar Pagamento
                </button>
                <a
                  href={whatsappCobrar()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  Cobrar
                </a>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {mensalidades.map((pag: any) => {
              const isPago = pag.status === "pago" || pag.status === "Pago"
              return (
                <div key={pag.id} className="bg-card rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground capitalize">{formatMes(pag.mes_referencia)}</p>
                      {pag.data_pagamento && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Pago em {formatDate(pag.data_pagamento)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-foreground">{formatCurrency(pag.valor)}</p>
                      {isPago ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Pago
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Pendente
                        </span>
                      )}
                      {!isPago && (
                        <button
                          type="button"
                          onClick={() => handleExcluirCobranca(pag.id, pag.mes_referencia)}
                          disabled={saving}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {mensalidades.length === 0 && (
              <p className="text-sm text-center text-muted-foreground py-6">Nenhum pagamento registrado</p>
            )}
          </div>
        </section>
      </main>

      {/* Modal Transferir */}
      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Transferir Aluna">
        <form className="space-y-4" onSubmit={handleTransferir}>
          <p className="text-sm text-muted-foreground">
            Transferir <strong>{aluna.nome}</strong> para outra turma.
          </p>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nova Turma</label>
            <select
              value={transferTurmaId}
              onChange={(e) => setTransferTurmaId(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-card"
              required
            >
              <option value="">Selecione a turma...</option>
              {turmas
                .filter((t: any) => t.id !== aluna.turma_id)
                .map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}{t.polos?.nome ? ` — ${t.polos.nome}` : ""}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsTransferModalOpen(false)} className="flex-1 px-4 py-2.5 border border-border rounded-lg font-semibold text-foreground">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold disabled:opacity-60">
              {saving ? "Salvando..." : "Transferir"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Nova Cobrança */}
      <Modal isOpen={isNovaCobrancaOpen} onClose={() => setIsNovaCobrancaOpen(false)} title="Criar Cobrança de Mensalidade">
        <form className="space-y-4" onSubmit={handleCriarCobranca}>
          <p className="text-sm text-muted-foreground">
            Cria uma ordem de mensalidade no histórico de <strong>{aluna.nome}</strong>.
          </p>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Mês de Referência *</label>
            <input
              type="month"
              value={mesCobranca}
              onChange={(e) => setMesCobranca(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
            />
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-sm font-medium text-foreground">Valor calculado automaticamente</p>
            <p className="text-xs text-muted-foreground mt-1">
              A cobrança é criada com base na turma atual e no desconto da aluna.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsNovaCobrancaOpen(false)} className="flex-1 px-4 py-2.5 border border-border rounded-lg font-semibold text-foreground">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</> : "Criar Cobrança"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Registrar Pagamento */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Registrar Pagamento">
        <form className="space-y-4" onSubmit={handleRegistrarPagamento}>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Mês de Referência</label>
            <select
              value={mesPagamento}
              onChange={(e) => setMesPagamento(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
            >
              <option value="">Selecione o mês</option>
              {pendentes.map((p: any) => (
                <option key={p.id} value={p.mes_referencia} className="capitalize">
                  {formatMes(p.mes_referencia)} — {formatCurrency(p.valor)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Data do Pagamento</label>
            <input
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 px-4 py-2.5 border border-border rounded-lg font-semibold text-foreground">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold disabled:opacity-60">
              {saving ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
