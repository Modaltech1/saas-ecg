"use client"

import { useState, useMemo } from "react"
import useSWR, { mutate } from "swr"
import { MobileHeader } from "@/components/layout/mobile-header"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Receipt, Layers, Tag } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())
type TabType = "mensalidades" | "matriculas" | "custos" | "salarios"

function monthLabel(mes: string) {
  const [y, m] = mes.split("-")
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
}

function getMeses() {
  const meses = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    meses.push({ value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: monthLabel(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`) })
  }
  return meses
}

export default function FinanceiroPage() {
  const MESES = getMeses()
  const [activeTab, setActiveTab] = useState<TabType>("mensalidades")
  const [mesSelecionado, setMesSelecionado] = useState(MESES[MESES.length - 1].value)
  const [filtroPoloFin, setFiltroPoloFin] = useState("")
  const [filtroLocalFin, setFiltroLocalFin] = useState("")
  const [filtroTurmaFin, setFiltroTurmaFin] = useState("")
  const [salvandoSalario, setSalvandoSalario] = useState<string | null>(null)

  const finKey = `/api/admin/financeiro?mes=${mesSelecionado}&polo=${filtroPoloFin}&local=${filtroLocalFin}&turma=${filtroTurmaFin}`

  async function handleMarcarSalario(prof: any, pago: boolean) {
    setSalvandoSalario(prof.id)
    if (pago) {
      await fetch("/api/admin/financeiro/salarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professora_id: prof.id, mes_referencia: mesSelecionado, valor: prof.salario_previsto }),
      })
    } else {
      await fetch("/api/admin/financeiro/salarios", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professora_id: prof.id, mes_referencia: mesSelecionado }),
      })
    }
    await mutate(finKey)
    setSalvandoSalario(null)
  }

  const { data: polosData } = useSWR("/api/admin/polos", fetcher)
  const { data: locaisData } = useSWR("/api/admin/locais", fetcher)
  const { data: turmasData } = useSWR("/api/admin/turmas", fetcher)

  const polos: any[] = polosData?.polos ?? []
  const locais: any[] = locaisData?.locais ?? []
  const turmas: any[] = turmasData?.turmas ?? []
  const { data: finData } = useSWR(finKey, fetcher)

  const locaisFiltro = filtroPoloFin ? locais.filter((l: any) => l.polo_id === filtroPoloFin) : locais
  const turmasFiltroSelect = useMemo(() => {
    let t = turmas
    if (filtroPoloFin) t = t.filter((x: any) => x.polo_id === filtroPoloFin)
    if (filtroLocalFin) t = t.filter((x: any) => x.local_id === filtroLocalFin)
    return t
  }, [turmas, filtroPoloFin, filtroLocalFin])

  const totalRecebido = finData?.total_recebido ?? 0
  const totalEsperado = finData?.total_esperado ?? 0
  const totalPendenteMes = totalEsperado - totalRecebido
  const alunasMesMatricula = finData?.matriculas ?? []
  const totalMatriculas = finData?.total_matriculas ?? 0
  const totalMatriculasPendentes = alunasMesMatricula.filter((m: any) => m.status === "Pendente").reduce((s: number, m: any) => s + Number(m.taxa_matricula), 0)
  const totalMatriculasEsperado = totalMatriculas + totalMatriculasPendentes
  const totalCustos = finData?.total_custos ?? 0
  const totalSalariosPrevistos = finData?.total_salarios_previstos ?? 0
  const totalSalariosPagos = finData?.total_salarios_pagos ?? 0
  const totalSalariosPendentes = totalSalariosPrevistos - totalSalariosPagos
  const saldoLiquido = totalRecebido + totalMatriculas - totalSalariosPagos - totalCustos
  const pendenciasAnteriores = finData?.pendencias_anteriores ?? []
  const mensalidadesPorTurma = finData?.mensalidades_por_turma ?? []
  const custosPorCategoria = finData?.custos_por_categoria ?? []
  const salariosProfessoras = finData?.salarios ?? []

  const inputCls = "w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-card"
  const tabs: { id: TabType; label: string }[] = [
    { id: "mensalidades", label: "Mensalidades" },
    { id: "matriculas", label: "Matrículas" },
    { id: "custos", label: "Custos" },
    { id: "salarios", label: "Salários" },
  ]

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeader title="Financeiro" />

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 lg:px-8">
        <PageHeader title="Financeiro" description="Receitas, matriculas, custos e salarios por periodo." />

        {/* Filtros */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Período</label>
            <select value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)} className={inputCls}>
              {MESES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Polo</label>
              <select value={filtroPoloFin} onChange={(e) => { setFiltroPoloFin(e.target.value); setFiltroLocalFin(""); setFiltroTurmaFin("") }} className={inputCls}>
                <option value="">Todos</option>
                {polos.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Local</label>
              <select value={filtroLocalFin} onChange={(e) => { setFiltroLocalFin(e.target.value); setFiltroTurmaFin("") }} className={inputCls} disabled={!filtroPoloFin}>
                <option value="">Todos</option>
                {locaisFiltro.map((l: any) => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Turma</label>
              <select value={filtroTurmaFin} onChange={(e) => setFiltroTurmaFin(e.target.value)} className={inputCls} disabled={!filtroPoloFin}>
                <option value="">Todas</option>
                {turmasFiltroSelect.map((t: any) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Visão Geral */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Visão Geral — {monthLabel(mesSelecionado)}</h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-50 rounded-lg p-2.5">
              <p className="text-[10px] text-green-700 mb-0.5">Receita</p>
              <p className="font-bold text-sm text-green-800">{formatCurrency(totalRecebido + totalMatriculas)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-2.5">
              <p className="text-[10px] text-red-700 mb-0.5">Saídas</p>
              <p className="font-bold text-sm text-red-800">{formatCurrency(totalSalariosPagos + totalCustos)}</p>
            </div>
            <div className={`rounded-lg p-2.5 ${saldoLiquido >= 0 ? "bg-primary/10" : "bg-red-50"}`}>
              <p className={`text-[10px] mb-0.5 ${saldoLiquido >= 0 ? "text-primary" : "text-red-700"}`}>Saldo</p>
              <p className={`font-bold text-sm ${saldoLiquido >= 0 ? "text-foreground" : "text-red-800"}`}>{formatCurrency(saldoLiquido)}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[80px] px-3 py-2 rounded-lg font-semibold text-sm transition-colors whitespace-nowrap ${activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >{tab.label}</button>
          ))}
        </div>

        {/* Mensalidades */}
        {activeTab === "mensalidades" && (
          <div className="space-y-5">
            <div className="grid gap-3">
              <StatCard title="Total Esperado" value={formatCurrency(totalEsperado)} icon={<TrendingUp className="w-5 h-5 text-blue-600" />} />
              <StatCard title="Total Recebido" value={formatCurrency(totalRecebido)} icon={<DollarSign className="w-5 h-5 text-[color:var(--success)]" />} />
              <StatCard title="Pendente (mês)" value={formatCurrency(totalPendenteMes)} icon={<AlertCircle className="w-5 h-5 text-[color:var(--warning)]" />} />
            </div>
            {pendenciasAnteriores.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Pendências de meses anteriores</p>
                    <p className="text-sm text-red-700">{pendenciasAnteriores.length} pagamentos em atraso</p>
                  </div>
                </div>
                {pendenciasAnteriores.slice(0, 5).map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center text-sm bg-card rounded-lg px-3 py-2 border border-red-100 mb-1">
                    <span className="text-gray-800 font-medium">{p.aluna_nome}</span>
                    <span className="text-xs text-red-600">{monthLabel(p.mes_referencia)} • {formatCurrency(p.valor)}</span>
                  </div>
                ))}
              </div>
            )}
            <h3 className="font-bold text-foreground">Por Turma</h3>
            <div className="space-y-2">
              {mensalidadesPorTurma.map((item: any) => (
                <div key={item.turma_id} className="bg-card rounded-lg p-4 border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-foreground">{item.turma_nome}</h4>
                      <p className="text-xs text-muted-foreground">{item.polo_nome} • {item.local_nome} • {item.n_alunas} alunas</p>
                    </div>
                    {item.pendente > 0 && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Pendências</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-muted/30 rounded-lg p-2"><p className="text-[10px] text-muted-foreground">Esperado</p><p className="font-semibold text-sm">{formatCurrency(item.esperado)}</p></div>
                    <div className="bg-green-50 rounded-lg p-2"><p className="text-[10px] text-green-700">Recebido</p><p className="font-semibold text-sm text-green-700">{formatCurrency(item.recebido)}</p></div>
                    <div className="bg-amber-50 rounded-lg p-2"><p className="text-[10px] text-amber-700">Pendente</p><p className="font-semibold text-sm text-amber-700">{formatCurrency(item.pendente)}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matrículas */}
        {activeTab === "matriculas" && (
          <div className="space-y-5">
            <div className="grid gap-3">
              <StatCard title="Total Esperado" value={formatCurrency(totalMatriculasEsperado)} icon={<TrendingUp className="w-5 h-5 text-blue-600" />} />
              <StatCard title="Total Recebido" value={formatCurrency(totalMatriculas)} icon={<Receipt className="w-5 h-5 text-purple-600" />} />
              <StatCard title="Pendente" value={formatCurrency(totalMatriculasPendentes)} icon={<AlertCircle className="w-5 h-5 text-[color:var(--warning)]" />} />
            </div>
            {alunasMesMatricula.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma matrícula neste período.</p>
            ) : (
              <div className="space-y-2">
                {alunasMesMatricula.map((m: any) => (
                  <div key={m.id} className="bg-card rounded-lg p-3 border border-border flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{m.nome}</p>
                      <p className="text-xs text-muted-foreground">{m.polo_nome} • {m.turma_nome}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{formatCurrency(m.taxa_matricula)}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${m.status === "Pago" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {m.status === "Pago" ? "Paga" : "Pendente"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Custos */}
        {activeTab === "custos" && (
          <div className="space-y-5">
            <div className="grid gap-3">
              <StatCard title="Total de Custos" value={formatCurrency(totalCustos)} icon={<TrendingUp className="w-5 h-5 text-red-600" />} />
            </div>
            {custosPorCategoria.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum custo cadastrado nas turmas filtradas.</p>
            ) : (
              <div className="space-y-3">
                {custosPorCategoria.map((grupo: any) => (
                  <div key={grupo.categoria} className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                      <div className="flex items-center gap-2"><Tag className="w-4 h-4 text-muted-foreground" /><span className="font-semibold text-foreground">{grupo.categoria}</span></div>
                      <span className="font-bold text-foreground">{formatCurrency(grupo.total)}</span>
                    </div>
                    {(grupo.itens ?? grupo.turmas ?? []).map((tg: any, i: number) => (
                      <div key={i} className="flex justify-between items-center px-4 py-2 border-t border-border">
                        <span className="text-sm text-muted-foreground">{tg.descricao ?? tg.nome} <span className="text-[10px] text-muted-foreground ml-1">({tg.turma})</span></span>
                        <span className="text-sm font-medium text-foreground">{formatCurrency(tg.valor)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Salários */}
        {activeTab === "salarios" && (
          <div className="space-y-5">
            <div className="grid gap-3">
              <StatCard title="Total Previsto" value={formatCurrency(totalSalariosPrevistos)} icon={<TrendingUp className="w-5 h-5 text-blue-600" />} />
              <StatCard title="Total Pago" value={formatCurrency(totalSalariosPagos)} icon={<CheckCircle className="w-5 h-5 text-[color:var(--success)]" />} />
              <StatCard title="Pendente" value={formatCurrency(totalSalariosPendentes)} icon={<AlertCircle className="w-5 h-5 text-[color:var(--warning)]" />} />
            </div>
            <div className="space-y-3">
              {salariosProfessoras.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma professora encontrada para este período.</p>
              )}
              {salariosProfessoras.map((prof: any) => (
                <div key={prof.id} className="bg-card rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{prof.nome}</p>
                      <p className="text-xs text-muted-foreground">{prof.n_turmas} turma{prof.n_turmas !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <p className="font-bold text-foreground">{formatCurrency(prof.salario_previsto)}</p>
                      {prof.pago && prof.salario_pago !== prof.salario_previsto && (
                        <p className="text-xs text-muted-foreground">Pago: {formatCurrency(prof.salario_pago)}</p>
                      )}
                      <button
                        onClick={() => handleMarcarSalario(prof, !prof.pago)}
                        disabled={salvandoSalario === prof.id}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors disabled:opacity-50 ${
                          prof.pago
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        }`}
                      >
                        {salvandoSalario === prof.id ? "..." : prof.pago ? "Pago — desfazer" : "Marcar como Pago"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
