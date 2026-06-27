"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { MobileHeader } from "@/components/layout/mobile-header"
import { SearchInput } from "@/components/ui/search-input"
import { Modal } from "@/components/ui/modal"
import {
  Plus, GraduationCap, Users, DollarSign, Edit, Trash2, ChevronRight,
  PlusCircle, X, Receipt, Tag, Loader2, Clock,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { MetricCard } from "@/components/shared/metric-card"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const inputCls = "w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-card"
const labelCls = "block text-sm font-medium text-foreground mb-1.5"
const sectionTitle = "font-semibold text-foreground text-sm uppercase tracking-wide pt-1"

const CATEGORIAS_CUSTO = ["Aluguel", "Parceiro", "Material", "Marketing", "Transporte", "Alimentação", "Equipamento", "Administrativo", "Outro"]

export default function TurmasPage() {
  const { data: polosData } = useSWR("/api/admin/polos", fetcher)
  const { data: locaisData } = useSWR("/api/admin/locais", fetcher)
  const { data: turmasData, mutate } = useSWR("/api/admin/turmas", fetcher)
  const { data: professoresData } = useSWR("/api/admin/professoras", fetcher)

  const polos: any[] = polosData?.polos ?? []
  const locais: any[] = locaisData?.locais ?? []
  const turmas: any[] = turmasData?.turmas ?? []
  const professoras: any[] = professoresData?.professoras ?? professoresData ?? []

  const [searchQuery, setSearchQuery] = useState("")
  const [filteredPolo, setFilteredPolo] = useState("")
  const [filteredLocal, setFilteredLocal] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedTurma, setSelectedTurma] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  // form fields
  const [form, setForm] = useState<any>({
    nome: "", polo_id: "", local_id: "", nivel: "Iniciante 1",
    mensalidade: "", acrescimo: "0", taxa_matricula: "", idade_alvo: "", ativo: true,
  })
  const [formProfessoras, setFormProfessoras] = useState<any[]>([])
  const [formCustos, setFormCustos] = useState<any[]>([])
  const [formHorarios, setFormHorarios] = useState<any[]>([])

  const locaisDisponiveis = filteredPolo ? locais.filter((l: any) => l.polo_id === filteredPolo) : locais
  const locaisForm = form.polo_id ? locais.filter((l: any) => l.polo_id === form.polo_id) : []

  const filteredTurmas = turmas.filter((t: any) => {
    const matchSearch = t.nome?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchPolo = !filteredPolo || t.polo_id === filteredPolo
    const matchLocal = !filteredLocal || t.local_id === filteredLocal
    return matchSearch && matchPolo && matchLocal
  })
  const totalAlunas = turmas.reduce((total: number, turma: any) => total + (turma.alunas?.length ?? 0), 0)
  const totalProfessoras = turmas.reduce((total: number, turma: any) => total + (turma.turmas_professoras?.length ?? 0), 0)

  function resetForm() {
    setForm({ nome: "", polo_id: "", local_id: "", nivel: "Iniciante 1", mensalidade: "", acrescimo: "0", taxa_matricula: "", idade_alvo: "", ativo: true })
    setFormProfessoras([])
    setFormCustos([])
    setFormHorarios([])
  }

  function openEdit(turma: any) {
    setSelectedTurma(turma)
    setForm({
      nome: turma.nome, polo_id: turma.polo_id, local_id: turma.local_id,
      nivel: turma.nivel, mensalidade: turma.mensalidade,
      acrescimo: turma.acrescimo ?? "0",
      taxa_matricula: turma.taxa_matricula,
      idade_alvo: turma.idade_alvo ?? "", ativo: turma.ativo,
    })
    setFormProfessoras((turma.turmas_professoras ?? []).map((p: any) => ({ ...p, valor: p.valor != null ? String(p.valor) : "" })))
    setFormCustos((turma.custos_turma ?? []).map((c: any) => ({ ...c, valor: c.valor != null ? String(c.valor) : "" })))
    setFormHorarios(turma.horarios ?? [])
    setIsEditModalOpen(true)
  }

  async function handleSave(isEdit: boolean) {
    setSaving(true)
    const payload = {
      ...form,
      professoras: formProfessoras.map((p: any) => ({ ...p, valor: p.valor === "" ? 0 : Number(p.valor) })),
      custos: formCustos.map((c: any) => ({ ...c, valor: c.valor === "" ? 0 : Number(c.valor) })),
      horarios: formHorarios,
    }
    try {
      const url = isEdit ? `/api/admin/turmas/${selectedTurma.id}` : "/api/admin/turmas"
      const method = isEdit ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (res.ok) {
        mutate()
        isEdit ? setIsEditModalOpen(false) : setIsAddModalOpen(false)
        resetForm()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedTurma) return
    setSaving(true)
    try {
      await fetch(`/api/admin/turmas/${selectedTurma.id}`, { method: "DELETE" })
      mutate()
      setIsDeleteModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  // JSX reutilizável do formulário como variável (não como componente)
  // para evitar remontagem e perda de foco a cada keystroke
  const formJSX = (
    <div className="space-y-5">
      <p className={sectionTitle}>Localização</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Polo *</label>
          <select value={form.polo_id} onChange={(e) => setForm((f: any) => ({ ...f, polo_id: e.target.value, local_id: "" }))} className={inputCls} required>
            <option value="">Selecione</option>
            {polos.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Local *</label>
          <select value={form.local_id} onChange={(e) => setForm((f: any) => ({ ...f, local_id: e.target.value }))} className={inputCls} required disabled={!form.polo_id}>
            <option value="">Selecione</option>
            {locaisForm.map((l: any) => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </div>
      </div>

      <p className={sectionTitle}>Dados da Turma</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelCls}>Nome *</label>
          <input type="text" value={form.nome} onChange={(e) => setForm((f: any) => ({ ...f, nome: e.target.value }))} placeholder="Ex: Iniciante 1" className={inputCls} required />
        </div>
        <div>
          <label className={labelCls}>Nível</label>
          <select value={form.nivel} onChange={(e) => setForm((f: any) => ({ ...f, nivel: e.target.value }))} className={inputCls}>
            {["Iniciante 1", "Iniciante 2", "Intermediário", "Avançado"].map((n) => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Faixa Etária</label>
          <input type="text" value={form.idade_alvo} onChange={(e) => setForm((f: any) => ({ ...f, idade_alvo: e.target.value }))} placeholder="Ex: 6-10 anos" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Mensalidade (R$)</label>
          <input type="number" step="0.01" value={form.mensalidade} onChange={(e) => setForm((f: any) => ({ ...f, mensalidade: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Acréscimo após dia 10 (R$)</label>
          <input type="number" step="0.01" min="0" value={form.acrescimo} onChange={(e) => setForm((f: any) => ({ ...f, acrescimo: e.target.value }))} placeholder="0" className={inputCls} />
        </div>
        <div className="col-span-2 bg-muted/30 rounded-lg px-3 py-2 text-xs text-muted-foreground">
          Mensalidade paga ate dia 10: <strong>R$ {Number(form.mensalidade || 0).toFixed(2)}</strong> — apos dia 10: <strong>R$ {(Number(form.mensalidade || 0) + Number(form.acrescimo || 0)).toFixed(2)}</strong>.
        </div>
        <div>
          <label className={labelCls}>Taxa Matrícula (R$)</label>
          <input type="number" step="0.01" value={form.taxa_matricula} onChange={(e) => setForm((f: any) => ({ ...f, taxa_matricula: e.target.value }))} className={inputCls} />
        </div>
      </div>

      {/* Horários */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className={sectionTitle + " flex items-center gap-1"}><Clock className="w-3.5 h-3.5" /> Horários</p>
          <button type="button" onClick={() => setFormHorarios((h: any[]) => [...h, { dia_semana: "Segunda", hora_inicio: "08:00", hora_fim: "09:00" }])} className="flex items-center gap-1 text-xs text-primary font-medium"><PlusCircle className="w-3.5 h-3.5" /> Horário</button>
        </div>
        {formHorarios.length === 0 && (
          <p className="text-xs text-muted-foreground italic">Nenhum horário cadastrado.</p>
        )}
        {formHorarios.map((h: any, i: number) => (
          <div key={i} className="flex items-center gap-2 bg-muted/30 rounded-lg p-2 mb-2">
            <div className="flex-[2]">
              <p className="text-xs text-muted-foreground mb-1">Dia</p>
              <select value={h.dia_semana} onChange={(e) => setFormHorarios((prev: any[]) => prev.map((x, j) => j === i ? { ...x, dia_semana: e.target.value } : x))} className={inputCls}>
                {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Início</p>
              <input type="time" value={h.hora_inicio} onChange={(e) => setFormHorarios((prev: any[]) => prev.map((x, j) => j === i ? { ...x, hora_inicio: e.target.value } : x))} className={inputCls} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Fim</p>
              <input type="time" value={h.hora_fim} onChange={(e) => setFormHorarios((prev: any[]) => prev.map((x, j) => j === i ? { ...x, hora_fim: e.target.value } : x))} className={inputCls} />
            </div>
            <button type="button" onClick={() => setFormHorarios((prev: any[]) => prev.filter((_, j) => j !== i))} className="mt-5 text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      {/* Professoras */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className={sectionTitle + " flex items-center gap-1"}><GraduationCap className="w-3.5 h-3.5" /> Professoras</p>
          <button type="button" onClick={() => setFormProfessoras((p: any[]) => [...p, { professora_id: "", tipo_pagamento: "percentual", valor: "" }])} className="flex items-center gap-1 text-xs text-primary font-medium"><PlusCircle className="w-3.5 h-3.5" /> Adicionar</button>
        </div>
        {formProfessoras.map((p: any, i: number) => (
          <div key={i} className="flex items-end gap-2 bg-muted/30 rounded-lg p-2 mb-2">
            <div className="flex-[2]">
              <p className="text-xs text-muted-foreground mb-1">Professora</p>
              <select value={p.professora_id} onChange={(e) => setFormProfessoras((prev: any[]) => prev.map((x, j) => j === i ? { ...x, professora_id: e.target.value } : x))} className={inputCls}>
                <option value="">Selecione</option>
                {professoras.map((pr: any) => <option key={pr.id} value={pr.id}>{pr.nome}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Tipo</p>
              <select value={p.tipo_pagamento} onChange={(e) => setFormProfessoras((prev: any[]) => prev.map((x, j) => j === i ? { ...x, tipo_pagamento: e.target.value } : x))} className={inputCls}>
                <option value="percentual">% Receita</option>
                <option value="fixo">Fixo R$</option>
              </select>
            </div>
            <div className="w-20">
              <p className="text-xs text-muted-foreground mb-1">{p.tipo_pagamento === "percentual" ? "%" : "R$"}</p>
              <input type="number" step="0.01" value={p.valor ?? ""} onChange={(e) => setFormProfessoras((prev: any[]) => prev.map((x, j) => j === i ? { ...x, valor: e.target.value } : x))} className={inputCls} />
            </div>
            <button type="button" onClick={() => setFormProfessoras((prev: any[]) => prev.filter((_, j) => j !== i))} className="mb-0.5 text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      {/* Custos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className={sectionTitle + " flex items-center gap-1"}><DollarSign className="w-3.5 h-3.5" /> Outros Custos</p>
          <button type="button" onClick={() => setFormCustos((c: any[]) => [...c, { descricao: "", categoria: "Outro", tipo: "percentual", valor: "" }])} className="flex items-center gap-1 text-xs text-primary font-medium"><PlusCircle className="w-3.5 h-3.5" /> Custo</button>
        </div>
        {formCustos.map((c: any, i: number) => (
          <div key={i} className="bg-muted/30 rounded-lg p-2 space-y-2 mb-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Categoria</p>
                <select value={c.categoria} onChange={(e) => setFormCustos((prev: any[]) => prev.map((x, j) => j === i ? { ...x, categoria: e.target.value } : x))} className={inputCls}>
                  {CATEGORIAS_CUSTO.map((cat) => <option key={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                <select value={c.tipo} onChange={(e) => setFormCustos((prev: any[]) => prev.map((x, j) => j === i ? { ...x, tipo: e.target.value } : x))} className={inputCls}>
                  <option value="percentual">%</option>
                  <option value="fixo">Fixo R$</option>
                </select>
              </div>
              <div className="w-20">
                <p className="text-xs text-muted-foreground mb-1">{c.tipo === "percentual" ? "%" : "R$"}</p>
                <input type="number" step="0.01" value={c.valor ?? ""} onChange={(e) => setFormCustos((prev: any[]) => prev.map((x, j) => j === i ? { ...x, valor: e.target.value } : x))} className={inputCls} />
              </div>
              <button type="button" onClick={() => setFormCustos((prev: any[]) => prev.filter((_, j) => j !== i))} className="mt-5 text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Descrição</p>
              <input type="text" value={c.descricao} onChange={(e) => setFormCustos((prev: any[]) => prev.map((x, j) => j === i ? { ...x, descricao: e.target.value } : x))} placeholder="Ex: Aluguel Quadra" className={inputCls} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeader title="Turmas" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
        <PageHeader title="Turmas" description="Organizacao de horarios, valores, professoras e custos por turma.">
          <Button onClick={() => { resetForm(); setIsAddModalOpen(true) }}>
            <Plus className="size-4" />
            Adicionar turma
          </Button>
        </PageHeader>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Turmas cadastradas" value={turmas.length} icon={GraduationCap} tone="blue" />
          <MetricCard title="Alunas vinculadas" value={totalAlunas} icon={Users} />
          <MetricCard title="Professoras vinculadas" value={totalProfessoras} icon={GraduationCap} />
          <MetricCard title="Resultado filtrado" value={filteredTurmas.length} icon={Receipt} />
        </div>

        <Card>
          <CardContent className="space-y-4">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Buscar turma..." />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Polo</label>
              <select value={filteredPolo} onChange={(e) => { setFilteredPolo(e.target.value); setFilteredLocal("") }} className={inputCls}>
                <option value="">Todos os polos</option>
                {polos.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Local</label>
              <select value={filteredLocal} onChange={(e) => setFilteredLocal(e.target.value)} className={inputCls} disabled={!filteredPolo}>
                <option value="">Todos</option>
                {locaisDisponiveis.map((l: any) => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </div>
          </div>

        <section className="space-y-3">
          {filteredTurmas.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhuma turma encontrada</p>
            </div>
          ) : filteredTurmas.map((turma: any) => {
            const polo = polos.find((p: any) => p.id === turma.polo_id)
            const local = locais.find((l: any) => l.id === turma.local_id)
            return (
              <div key={turma.id} className="bg-card rounded-lg border border-border overflow-hidden">
                <Link href={`/admin/turmas/${turma.id}`} className="block p-4 hover:bg-muted/60 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{turma.nome}</h3>
                      <p className="text-sm text-muted-foreground">{polo?.nome} • {local?.nome}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">{turma.nivel}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { icon: DollarSign, label: "Mensalidade", value: formatCurrency(turma.mensalidade) },
                      { icon: Receipt, label: "Matrícula", value: formatCurrency(turma.taxa_matricula) },
                      { icon: Users, label: "Alunas", value: turma.alunas?.length ?? 0 },
                      { icon: GraduationCap, label: "Profs.", value: turma.turmas_professoras?.length ?? 0 },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="bg-muted/30 rounded-lg p-2">
                        <Icon className="w-3 h-3 text-muted-foreground mb-1" />
                        <p className="text-[10px] text-muted-foreground">{label}</p>
                        <p className="font-semibold text-xs text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                  {turma.custos_turma?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {turma.custos_turma.map((c: any) => (
                        <span key={c.id} className="flex items-center gap-1 px-2 py-0.5 bg-muted/30 border border-border rounded-full text-[10px] text-muted-foreground">
                          <Tag className="w-2.5 h-2.5" />{c.categoria}: {c.tipo === "percentual" ? `${c.valor}%` : formatCurrency(c.valor)}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
                <div className="flex border-t border-border">
                  <button onClick={() => openEdit(turma)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-muted-foreground hover:bg-muted transition-colors">
                    <Edit className="w-4 h-4" /><span className="text-sm font-medium">Editar</span>
                  </button>
                  <div className="w-px bg-border" />
                  <button onClick={() => { setSelectedTurma(turma); setIsDeleteModalOpen(true) }} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-destructive hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" /><span className="text-sm font-medium">Excluir</span>
                  </button>
                </div>
              </div>
            )
          })}
        </section>
          </CardContent>
        </Card>
      </main>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adicionar Turma" size="lg">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(false) }}>
          {formJSX}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-2.5 border border-border rounded-lg font-semibold text-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Salvar
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Turma" size="lg">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(true) }}>
          {formJSX}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-2.5 border border-border rounded-lg font-semibold text-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Atualizar
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Excluir Turma">
        <div className="space-y-4">
          <p className="text-muted-foreground">Deseja excluir a turma <strong>{selectedTurma?.nome}</strong>? Esta ação não pode ser desfeita.</p>
          <div className="flex gap-3">
            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-2.5 border border-border rounded-lg font-semibold text-foreground">Cancelar</button>
            <button onClick={handleDelete} disabled={saving} className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg font-semibold hover:bg-destructive/90 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Excluir
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
