"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { MobileHeader } from "@/components/layout/mobile-header"
import { SearchInput } from "@/components/ui/search-input"
import { Modal } from "@/components/ui/modal"
import {
  Plus, Users, AlertCircle, Edit, Trash2, ChevronRight,
  CheckCircle, Receipt, ClipboardList, Clock, Check, X, Loader2,
} from "lucide-react"
import Link from "next/link"
import { MetricCard } from "@/components/shared/metric-card"
import { PageHeader } from "@/components/shared/page-header"

const inputCls = "w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-card"
const labelCls = "block text-sm font-medium text-foreground mb-1.5"
const sectionTitle = "font-semibold text-foreground text-sm border-b border-border pb-1 mb-3"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatCpf(v: string) {
  const n = v.replace(/\D/g, "").slice(0, 11)
  return n.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}
function formatTel(v: string) {
  const n = v.replace(/\D/g, "").slice(0, 11)
  if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "")
  return n.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "")
}

function getResponsavel(aluna: any) {
  if (Array.isArray(aluna?.responsaveis)) return aluna.responsaveis[0] ?? null
  return aluna?.responsaveis ?? null
}

type Aba = "alunas" | "pre-matriculas"

function calcIdade(dataNasc: string) {
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR")
}

function statusBadgePm(status: string) {
  if (status === "pendente") return "bg-amber-100 text-amber-700"
  if (status === "aprovada") return "bg-green-100 text-green-700"
  return "bg-red-100 text-red-600"
}

function statusLabelPm(status: string) {
  if (status === "pendente") return "Pendente"
  if (status === "aprovada") return "Aprovada"
  return "Reprovada"
}

export default function AlunasPage() {
  const [aba, setAba] = useState<Aba>("alunas")

  // Filtros alunas
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredPoloId, setFilteredPoloId] = useState("")
  const [filteredLocalId, setFilteredLocalId] = useState("")
  const [filteredTurmaId, setFilteredTurmaId] = useState("")
  const [filteredStatus, setFilteredStatus] = useState("")

  // Modais alunas
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedAluna, setSelectedAluna] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  // Filtros pré-matrículas
  const [pmSearch, setPmSearch] = useState("")
  const [pmStatus, setPmStatus] = useState("")
  const [selectedPm, setSelectedPm] = useState<any>(null)
  const [isPmDetailOpen, setIsPmDetailOpen] = useState(false)
  const [isAprovarModalOpen, setIsAprovarModalOpen] = useState(false)
  const [pmParaAprovar, setPmParaAprovar] = useState<any>(null)
  const [aprovarTurmaId, setAprovarTurmaId] = useState("")
  const [aprovarCobrarMatricula, setAprovarCobrarMatricula] = useState(true)
  const [aprovando, setAprovando] = useState(false)
  const [aprovarErro, setAprovarErro] = useState("")

  // Form nova aluna
  const [formNome, setFormNome] = useState("")
  const [formCpf, setFormCpf] = useState("")
  const [formDataNasc, setFormDataNasc] = useState("")
  const [formTurmaId, setFormTurmaId] = useState("")
  const [formPolo, setFormPolo] = useState("")
  const [formLocal, setFormLocal] = useState("")
  const [formRespNome, setFormRespNome] = useState("")
  const [formRespCpf, setFormRespCpf] = useState("")
  const [formRespEmail, setFormRespEmail] = useState("")
  const [formRespTel, setFormRespTel] = useState("")
  const [formRespWhatsapp, setFormRespWhatsapp] = useState("")
  const [formDescontoPercentual, setFormDescontoPercentual] = useState("0")
  const [formCobrarMatricula, setFormCobrarMatricula] = useState(true)
  // Endereço
  const [formCep, setFormCep] = useState("")
  const [formLogradouro, setFormLogradouro] = useState("")
  const [formNumero, setFormNumero] = useState("")
  const [formComplemento, setFormComplemento] = useState("")
  const [formBairro, setFormBairro] = useState("")
  const [formCidade, setFormCidade] = useState("")
  const [formEstado, setFormEstado] = useState("")

  // Form editar aluna
  const [editNome, setEditNome] = useState("")
  const [editCpf, setEditCpf] = useState("")
  const [editDataNasc, setEditDataNasc] = useState("")
  const [editTurmaId, setEditTurmaId] = useState("")
  const [editStatus, setEditStatus] = useState("Ativa")
  const [editRespId, setEditRespId] = useState("")
  const [editRespNome, setEditRespNome] = useState("")
  const [editRespCpf, setEditRespCpf] = useState("")
  const [editRespEmail, setEditRespEmail] = useState("")
  const [editRespTel, setEditRespTel] = useState("")
  const [editRespWhatsapp, setEditRespWhatsapp] = useState("")
  const [editDescontoPercentual, setEditDescontoPercentual] = useState("0")
  const [editCep, setEditCep] = useState("")
  const [editLogradouro, setEditLogradouro] = useState("")
  const [editNumero, setEditNumero] = useState("")
  const [editComplemento, setEditComplemento] = useState("")
  const [editBairro, setEditBairro] = useState("")
  const [editCidade, setEditCidade] = useState("")
  const [editEstado, setEditEstado] = useState("")

  // Dados do servidor
  const params = new URLSearchParams()
  if (searchQuery) params.set("q", searchQuery)
  if (filteredPoloId) params.set("polo_id", filteredPoloId)
  if (filteredLocalId) params.set("local_id", filteredLocalId)
  if (filteredTurmaId) params.set("turma_id", filteredTurmaId)
  if (filteredStatus) params.set("status", filteredStatus)

  const { data: alunasData, isLoading: loadingAlunas } = useSWR(
    `/api/admin/alunas?${params.toString()}`,
    fetcher,
    { keepPreviousData: true }
  )
  const { data: pmData, isLoading: loadingPms, mutate: mutatePms } = useSWR(
    "/api/admin/pre-matriculas",
    fetcher
  )
  const { data: polosData } = useSWR("/api/admin/polos", fetcher)
  const { data: locaisData } = useSWR("/api/admin/locais", fetcher)
  const { data: turmasData } = useSWR("/api/admin/turmas", fetcher)

  const alunas: any[] = alunasData?.alunas ?? []
  const pmList: any[] = pmData?.preMatriculas ?? []
  const polos: any[] = polosData?.polos ?? []
  const locais: any[] = locaisData?.locais ?? []
  const turmas: any[] = turmasData?.turmas ?? []

  const locaisDisponiveis = filteredPoloId ? locais.filter((l) => l.polo_id === filteredPoloId) : locais
  const turmasDisponiveis = filteredLocalId
    ? turmas.filter((t) => t.local_id === filteredLocalId)
    : filteredPoloId
      ? turmas.filter((t) => t.polo_id === filteredPoloId)
      : turmas

  const locaisForm = formPolo ? locais.filter((l) => l.polo_id === formPolo) : []
  const turmasForm = formLocal
    ? turmas.filter((t) => t.local_id === formLocal)
    : formPolo
      ? turmas.filter((t) => t.polo_id === formPolo)
      : turmas

  const filteredPms = pmList.filter((pm) => {
    const q = pmSearch.toLowerCase()
    const matchesSearch =
      pm.nome_aluna?.toLowerCase().includes(q) ||
      pm.nome_responsavel?.toLowerCase().includes(q) ||
      pm.email?.toLowerCase().includes(q)
    const matchesStatus = !pmStatus || pm.status === pmStatus
    return matchesSearch && matchesStatus
  })

  const pmPendentes = pmList.filter((p) => p.status === "pendente").length

  const resetForm = () => {
    setFormNome(""); setFormCpf(""); setFormDataNasc(""); setFormTurmaId("")
    setFormPolo(""); setFormLocal("")
    setFormRespNome(""); setFormRespCpf(""); setFormRespEmail("")
    setFormRespTel(""); setFormRespWhatsapp(""); setFormCobrarMatricula(true)
    setFormDescontoPercentual("0")
    setFormCep(""); setFormLogradouro(""); setFormNumero(""); setFormComplemento("")
    setFormBairro(""); setFormCidade(""); setFormEstado("")
  }

  const handleAddAluna = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch("/api/admin/alunas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: formNome,
        cpf_aluna: formCpf.replace(/\D/g, "") || null,
        data_nascimento: formDataNasc || null,
        turma_id: formTurmaId || null,
        desconto_percentual: Number(formDescontoPercentual || "0"),
        cobrar_matricula: formCobrarMatricula,
        responsavel: {
          nome: formRespNome,
          cpf: formRespCpf.replace(/\D/g, "") || null,
          email: formRespEmail,
          telefone: formRespTel,
          whatsapp: formRespWhatsapp,
        },
        logradouro: formLogradouro || null,
        numero: formNumero || null,
        complemento: formComplemento || null,
        bairro: formBairro || null,
        cidade: formCidade || null,
        estado: formEstado || null,
        cep: formCep || null,
      }),
    })
    await mutate(`/api/admin/alunas?${params.toString()}`)
    setSaving(false)
    resetForm()
    setIsAddModalOpen(false)
  }

  const handleEditAluna = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAluna) return
    setSaving(true)
    await fetch(`/api/admin/alunas/${selectedAluna.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: editNome,
        cpf_aluna: editCpf.replace(/\D/g, "") || null,
        data_nascimento: editDataNasc || null,
        turma_id: editTurmaId || null,
        desconto_percentual: Number(editDescontoPercentual || "0"),
        status: editStatus,
        responsavel: {
          id: editRespId || undefined,
          nome: editRespNome,
          cpf: editRespCpf.replace(/\D/g, "") || null,
          email: editRespEmail || null,
          telefone: editRespTel || null,
          whatsapp: editRespWhatsapp || null,
        },
        logradouro: editLogradouro || null,
        numero: editNumero || null,
        complemento: editComplemento || null,
        bairro: editBairro || null,
        cidade: editCidade || null,
        estado: editEstado || null,
        cep: editCep || null,
      }),
    })
    await mutate(`/api/admin/alunas?${params.toString()}`)
    setSaving(false)
    setIsEditModalOpen(false)
    setSelectedAluna(null)
  }

  const handleDeleteAluna = async () => {
    if (!selectedAluna) return
    setSaving(true)
    await fetch(`/api/admin/alunas/${selectedAluna.id}`, { method: "DELETE" })
    await mutate(`/api/admin/alunas?${params.toString()}`)
    setSaving(false)
    setIsDeleteModalOpen(false)
    setSelectedAluna(null)
  }

  const handleReprovarPm = async (id: string) => {
    await fetch(`/api/admin/pre-matriculas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "recusada" }),
    })
    await mutatePms()
    setIsPmDetailOpen(false)
  }

  const handleAbrirAprovar = (pm: any) => {
    setPmParaAprovar(pm)
    setAprovarTurmaId("")
    setAprovarCobrarMatricula(true)
    setAprovarErro("")
    setIsAprovarModalOpen(true)
  }

  const handleConfirmarAprovar = async () => {
    if (!aprovarTurmaId) { setAprovarErro("Selecione uma turma para continuar."); return }
    setAprovando(true)
    setAprovarErro("")
    const res = await fetch(`/api/admin/pre-matriculas/${pmParaAprovar.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "aprovada", turma_id: aprovarTurmaId, cobrar_matricula: aprovarCobrarMatricula }),
    })
    const data = await res.json()
    setAprovando(false)
    if (!res.ok) { setAprovarErro(data.error ?? "Erro ao aprovar"); return }
    await mutatePms()
    await mutate(`/api/admin/alunas?${params.toString()}`)
    setIsAprovarModalOpen(false)
    setIsPmDetailOpen(false)
    setPmParaAprovar(null)
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeader title="Alunas" />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
        <PageHeader title="Alunas" description="Cadastro, pre-matriculas e acompanhamento financeiro das alunas." />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Alunas filtradas" value={alunas.length} icon={Users} tone="blue" />
          <MetricCard title="Pre-matriculas" value={pmList.length} icon={ClipboardList} />
          <MetricCard title="Pendentes" value={pmPendentes} icon={AlertCircle} tone="warning" />
          <MetricCard title="Turmas disponiveis" value={turmas.length} icon={Users} />
        </div>
      </div>

      {/* ABAS */}
      <div className="bg-card border-b border-border px-4">
        <div className="mx-auto flex max-w-7xl gap-0 lg:px-4">
          <button
            onClick={() => setAba("alunas")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              aba === "alunas"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            Alunas
          </button>
          <button
            onClick={() => setAba("pre-matriculas")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              aba === "pre-matriculas"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Pré-Matrículas
            {pmPendentes > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary text-white leading-none">
                {pmPendentes}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ABA: ALUNAS */}
      {aba === "alunas" && (
        <main className="mx-auto max-w-7xl px-4 pb-6 space-y-4 lg:px-8">
          <div className="pt-4 space-y-3">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Buscar aluna ou responsável..." />

            <div>
              <label className={labelCls}>Polo</label>
              <select value={filteredPoloId} onChange={(e) => { setFilteredPoloId(e.target.value); setFilteredLocalId(""); setFilteredTurmaId("") }} className={inputCls}>
                <option value="">Todos os polos</option>
                {polos.map((p: any) => <option key={p.id} value={p.id}>{p.nome} — {p.cidade}</option>)}
              </select>
            </div>

            {filteredPoloId && (
              <div>
                <label className={labelCls}>Local</label>
                <select value={filteredLocalId} onChange={(e) => { setFilteredLocalId(e.target.value); setFilteredTurmaId("") }} className={inputCls}>
                  <option value="">Todos os locais</option>
                  {locaisDisponiveis.map((l: any) => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className={labelCls}>Turma</label>
              <select value={filteredTurmaId} onChange={(e) => setFilteredTurmaId(e.target.value)} className={inputCls}>
                <option value="">Todas as turmas</option>
                {turmasDisponiveis.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.nome} — {t.polos?.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Status Financeiro</label>
              <select value={filteredStatus} onChange={(e) => setFilteredStatus(e.target.value)} className={inputCls}>
                <option value="">Todos</option>
                <option value="emdia">Em dia</option>
                <option value="pendente">Com pendência</option>
                <option value="vencidos">Vencidos</option>
              </select>
            </div>

            <button
              onClick={() => { resetForm(); setIsAddModalOpen(true) }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" /> Adicionar Aluna
            </button>
          </div>

          {loadingAlunas ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground px-1">
                {alunas.length} aluna{alunas.length !== 1 ? "s" : ""} encontrada{alunas.length !== 1 ? "s" : ""}
              </p>
              <section className="space-y-2">
                {alunas.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Nenhuma aluna encontrada</p>
                  </div>
                ) : alunas.map((aluna: any) => {
                  const turma = aluna.turmas
                  const polo = turma?.polos
                  const responsavel = getResponsavel(aluna)
                  const pendencias = aluna.pendencias ?? 0
                  const idade = calcIdade(aluna.data_nascimento)

                  return (
                    <div key={aluna.id} className="bg-card rounded-lg border border-border overflow-hidden">
                      <Link href={`/admin/alunas/${aluna.id}`} className="block p-3 hover:bg-muted/60 transition-colors">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground truncate">{aluna.nome}</h3>
                              {!aluna.taxa_matricula_paga && (
                                <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 text-blue-700 flex items-center gap-0.5">
                                  <Receipt className="w-2.5 h-2.5" /> Matrícula
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {idade} anos • {turma?.nome} • {polo?.nome}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{responsavel?.email}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {pendencias > 0 ? (
                              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex items-center gap-1 whitespace-nowrap">
                                <AlertCircle className="w-3 h-3" /> {pendencias}m
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                              </span>
                            )}
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                      </Link>
                      <div className="flex border-t border-border">
                        <button
                          onClick={() => {
                            setSelectedAluna(aluna)
                            setEditNome(aluna.nome)
                            setEditCpf(aluna.cpf_aluna ? formatCpf(aluna.cpf_aluna) : "")
                            setEditDataNasc(aluna.data_nascimento ?? "")
                            setEditTurmaId(aluna.turma_id ?? "")
                            setEditStatus(aluna.status ?? "Ativa")
                            setEditRespId(responsavel?.id ?? "")
                            setEditRespNome(responsavel?.nome ?? "")
                            setEditRespCpf(responsavel?.cpf ? formatCpf(responsavel.cpf) : "")
                            setEditRespEmail(responsavel?.email ?? "")
                            setEditRespTel(responsavel?.telefone ? formatTel(responsavel.telefone) : "")
                            setEditRespWhatsapp(responsavel?.whatsapp ? formatTel(responsavel.whatsapp) : "")
                            setEditDescontoPercentual(String(aluna.desconto_percentual ?? 0))
                            setEditCep(aluna.cep ?? "")
                            setEditLogradouro(aluna.logradouro ?? "")
                            setEditNumero(aluna.numero ?? "")
                            setEditComplemento(aluna.complemento ?? "")
                            setEditBairro(aluna.bairro ?? "")
                            setEditCidade(aluna.cidade ?? "")
                            setEditEstado(aluna.estado ?? "")
                            setIsEditModalOpen(true)
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" /><span className="text-xs font-medium">Editar</span>
                        </button>
                        <div className="w-px bg-(--color-border)" />
                        <button
                          onClick={() => { setSelectedAluna(aluna); setIsDeleteModalOpen(true) }}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-destructive hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /><span className="text-xs font-medium">Excluir</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </section>
            </>
          )}
        </main>
      )}

      {/* ABA: PRÉ-MATRÍCULAS */}
      {aba === "pre-matriculas" && (
        <main className="mx-auto max-w-7xl px-4 pb-6 space-y-4 lg:px-8">
          <div className="pt-4 space-y-3">
            <SearchInput value={pmSearch} onChange={setPmSearch} placeholder="Buscar aluna ou responsável..." />
            <div>
              <label className={labelCls}>Status</label>
              <select value={pmStatus} onChange={(e) => setPmStatus(e.target.value)} className={inputCls}>
                <option value="">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="aprovada">Aprovada</option>
                <option value="reprovada">Reprovada</option>
              </select>
            </div>
          </div>

          {loadingPms ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground px-1">
                {filteredPms.length} pré-matrícula{filteredPms.length !== 1 ? "s" : ""} encontrada{filteredPms.length !== 1 ? "s" : ""}
              </p>
              <section className="space-y-2">
                {filteredPms.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Nenhuma pré-matrícula encontrada</p>
                  </div>
                ) : filteredPms.map((pm: any) => (
                  <div key={pm.id} className="bg-card rounded-lg border border-border overflow-hidden">
                    <button
                      onClick={() => { setSelectedPm(pm); setIsPmDetailOpen(true) }}
                      className="w-full text-left block p-3 hover:bg-muted/60 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-foreground truncate">{pm.nome_aluna}</h3>
                            <span className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full ${statusBadgePm(pm.status)}`}>
                              {statusLabelPm(pm.status)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {calcIdade(pm.data_nascimento)} anos • Resp: {pm.nome_responsavel}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{pm.email}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            <Clock className="w-3 h-3 inline mr-0.5" />
                            {formatDate(pm.criado_em)}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                      </div>
                    </button>

                    {pm.status === "pendente" && (
                      <div className="flex border-t border-border">
                        <button
                          onClick={() => handleAbrirAprovar(pm)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-green-700 hover:bg-green-50 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" /><span className="text-xs font-medium">Converter em Aluna</span>
                        </button>
                        <div className="w-px bg-(--color-border)" />
                        <button
                          onClick={() => handleReprovarPm(pm.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-destructive hover:bg-red-50 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /><span className="text-xs font-medium">Reprovar</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </section>
            </>
          )}
        </main>
      )}

      {/* MODAL APROVAR PRÉ-MATRÍCULA — seleção de turma obrigatória */}
      <Modal isOpen={isAprovarModalOpen} onClose={() => setIsAprovarModalOpen(false)} title="Converter em Aluna">
        {pmParaAprovar && (
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
              <p><span className="font-medium">Aluna:</span> {pmParaAprovar.nome_aluna}</p>
              <p><span className="font-medium">Responsável:</span> {pmParaAprovar.nome_responsavel}</p>
              <p><span className="font-medium">E-mail:</span> {pmParaAprovar.email}</p>
            </div>

            <div>
              <label className={labelCls}>Selecionar Turma *</label>
              <select
                value={aprovarTurmaId}
                onChange={(e) => setAprovarTurmaId(e.target.value)}
                className={inputCls}
                required
              >
                <option value="">Selecione uma turma</option>
                {turmas.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}{t.polos?.nome ? ` — ${t.polos.nome}` : ""}
                    {t.taxa_matricula ? ` (matrícula: R$ ${Number(t.taxa_matricula).toFixed(2)})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border bg-muted/30">
              <input
                type="checkbox"
                checked={aprovarCobrarMatricula}
                onChange={(e) => setAprovarCobrarMatricula(e.target.checked)}
                className="w-4 h-4 accent-(--color-primary)"
              />
              <div>
                <p className="text-sm font-medium text-foreground">Gerar cobrança de matrícula</p>
                <p className="text-xs text-muted-foreground">Desmarque se a aluna não precisa pagar a taxa de matrícula.</p>
              </div>
            </label>

            {aprovarErro && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {aprovarErro}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsAprovarModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-border rounded-lg font-semibold text-foreground"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarAprovar}
                disabled={aprovando || !aprovarTurmaId}
                className="flex-[2] px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {aprovando ? <><Loader2 className="w-4 h-4 animate-spin" /> Aprovando...</> : <><Check className="w-4 h-4" /> Aprovar e Criar Aluna</>}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL ADICIONAR ALUNA */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adicionar Aluna" size="lg">
        <form className="space-y-5" onSubmit={handleAddAluna}>
          <p className={sectionTitle}>Dados da Aluna</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Nome Completo *</label>
              <input type="text" value={formNome} onChange={(e) => setFormNome(e.target.value)} placeholder="Ex: Sofia Rodrigues" className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>CPF da Aluna</label>
              <input type="text" value={formCpf} onChange={(e) => setFormCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" className={inputCls} maxLength={14} />
            </div>
            <div>
              <label className={labelCls}>Data de Nascimento *</label>
              <input type="date" value={formDataNasc} onChange={(e) => setFormDataNasc(e.target.value)} className={inputCls} required />
            </div>
          </div>

          <p className={sectionTitle}>Matrícula</p>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Polo *</label>
              <select value={formPolo} onChange={(e) => { setFormPolo(e.target.value); setFormLocal(""); setFormTurmaId("") }} className={inputCls} required>
                <option value="">Selecione o polo</option>
                {polos.map((p: any) => <option key={p.id} value={p.id}>{p.nome} — {p.cidade}</option>)}
              </select>
            </div>
            {formPolo && (
              <div>
                <label className={labelCls}>Local *</label>
                <select value={formLocal} onChange={(e) => { setFormLocal(e.target.value); setFormTurmaId("") }} className={inputCls} required>
                  <option value="">Selecione o local</option>
                  {locaisForm.map((l: any) => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>
              </div>
            )}
            {formPolo && (
              <div>
                <label className={labelCls}>Turma *</label>
                <select value={formTurmaId} onChange={(e) => setFormTurmaId(e.target.value)} className={inputCls} required>
                  <option value="">Selecione a turma</option>
                  {turmasForm.map((t: any) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className={labelCls}>Desconto (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={formDescontoPercentual}
                onChange={(e) => setFormDescontoPercentual(e.target.value)}
                placeholder="0"
                className={inputCls}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Percentual aplicado sobre a mensalidade base da turma.
              </p>
            </div>
          </div>

          <p className={sectionTitle}>Responsável</p>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Nome completo *</label>
              <input type="text" value={formRespNome} onChange={(e) => setFormRespNome(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>CPF do responsável *</label>
              <input type="text" value={formRespCpf} onChange={(e) => setFormRespCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" className={inputCls} required maxLength={14} />
            </div>
            <div>
              <label className={labelCls}>E-mail *</label>
              <input type="email" value={formRespEmail} onChange={(e) => setFormRespEmail(e.target.value)} className={inputCls} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Telefone *</label>
                <input type="tel" value={formRespTel} onChange={(e) => setFormRespTel(formatTel(e.target.value))} placeholder="(00) 00000-0000" className={inputCls} required maxLength={15} />
              </div>
              <div>
                <label className={labelCls}>WhatsApp *</label>
                <input type="tel" value={formRespWhatsapp} onChange={(e) => setFormRespWhatsapp(formatTel(e.target.value))} placeholder="(00) 00000-0000" className={inputCls} required maxLength={15} />
              </div>
            </div>
          </div>

          <p className={sectionTitle}>Endereço</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>CEP</label>
                <input type="text" value={formCep} onChange={(e) => setFormCep(e.target.value.replace(/\D/g,"").slice(0,8).replace(/(\d{5})(\d{0,3})/,"$1-$2"))} placeholder="00000-000" className={inputCls} maxLength={9} />
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <input type="text" value={formEstado} onChange={(e) => setFormEstado(e.target.value.toUpperCase().slice(0,2))} placeholder="ES" className={inputCls} maxLength={2} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Logradouro</label>
              <input type="text" value={formLogradouro} onChange={(e) => setFormLogradouro(e.target.value)} placeholder="Rua, Av., etc." className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Número</label>
                <input type="text" value={formNumero} onChange={(e) => setFormNumero(e.target.value)} placeholder="123" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Complemento</label>
                <input type="text" value={formComplemento} onChange={(e) => setFormComplemento(e.target.value)} placeholder="Apto" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Bairro</label>
                <input type="text" value={formBairro} onChange={(e) => setFormBairro(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Cidade</label>
                <input type="text" value={formCidade} onChange={(e) => setFormCidade(e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          <p className={sectionTitle}>Cobrança</p>
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border bg-muted/30">
            <input
              type="checkbox"
              checked={formCobrarMatricula}
              onChange={(e) => setFormCobrarMatricula(e.target.checked)}
              className="w-4 h-4 accent-(--color-primary)"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Gerar cobrança de matrícula</p>
              <p className="text-xs text-muted-foreground">Se desmarcado, nenhuma ordem de pagamento de matrícula será criada.</p>
            </div>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-2.5 border border-border rounded-lg font-semibold text-foreground">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold disabled:opacity-60">
              {saving ? "Salvando..." : "Adicionar"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL EDITAR ALUNA */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Aluna" size="lg">
        <form className="space-y-5" onSubmit={handleEditAluna}>
          <p className={sectionTitle}>Dados da Aluna</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Nome Completo *</label>
              <input type="text" value={editNome} onChange={(e) => setEditNome(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>CPF da Aluna</label>
              <input type="text" value={editCpf} onChange={(e) => setEditCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" className={inputCls} maxLength={14} />
            </div>
            <div>
              <label className={labelCls}>Data de Nascimento</label>
              <input type="date" value={editDataNasc} onChange={(e) => setEditDataNasc(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Turma</label>
              <select value={editTurmaId} onChange={(e) => setEditTurmaId(e.target.value)} className={inputCls}>
                <option value="">Sem turma</option>
                {turmas.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.nome} — {t.polos?.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className={inputCls}>
                <option value="Ativa">Ativa</option>
                <option value="Inativa">Inativa</option>
                <option value="Trancada">Trancada</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Desconto (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={editDescontoPercentual}
                onChange={(e) => setEditDescontoPercentual(e.target.value)}
                placeholder="0"
                className={inputCls}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Percentual aplicado sobre a mensalidade base da turma.
              </p>
            </div>
          </div>

          <p className={sectionTitle}>Responsável</p>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Nome completo *</label>
              <input type="text" value={editRespNome} onChange={(e) => setEditRespNome(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>CPF do responsável</label>
              <input type="text" value={editRespCpf} onChange={(e) => setEditRespCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" className={inputCls} maxLength={14} />
            </div>
            <div>
              <label className={labelCls}>E-mail</label>
              <input type="email" value={editRespEmail} onChange={(e) => setEditRespEmail(e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Telefone</label>
                <input type="tel" value={editRespTel} onChange={(e) => setEditRespTel(formatTel(e.target.value))} placeholder="(00) 00000-0000" className={inputCls} maxLength={15} />
              </div>
              <div>
                <label className={labelCls}>WhatsApp</label>
                <input type="tel" value={editRespWhatsapp} onChange={(e) => setEditRespWhatsapp(formatTel(e.target.value))} placeholder="(00) 00000-0000" className={inputCls} maxLength={15} />
              </div>
            </div>
          </div>

          <p className={sectionTitle}>Endereço</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>CEP</label>
                <input type="text" value={editCep} onChange={(e) => setEditCep(e.target.value.replace(/\D/g,"").slice(0,8).replace(/(\d{5})(\d{0,3})/,"$1-$2"))} placeholder="00000-000" className={inputCls} maxLength={9} />
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <input type="text" value={editEstado} onChange={(e) => setEditEstado(e.target.value.toUpperCase().slice(0,2))} placeholder="ES" className={inputCls} maxLength={2} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Logradouro</label>
              <input type="text" value={editLogradouro} onChange={(e) => setEditLogradouro(e.target.value)} placeholder="Rua, Av., etc." className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Número</label>
                <input type="text" value={editNumero} onChange={(e) => setEditNumero(e.target.value)} placeholder="123" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Complemento</label>
                <input type="text" value={editComplemento} onChange={(e) => setEditComplemento(e.target.value)} placeholder="Apto" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Bairro</label>
                <input type="text" value={editBairro} onChange={(e) => setEditBairro(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Cidade</label>
                <input type="text" value={editCidade} onChange={(e) => setEditCidade(e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-2.5 border border-border rounded-lg font-semibold text-foreground">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold disabled:opacity-60">
              {saving ? "Salvando..." : "Atualizar"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL DELETAR */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Excluir Aluna">
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Tem certeza que deseja excluir <strong>{selectedAluna?.nome}</strong>? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-2.5 border border-border rounded-lg font-semibold text-foreground">
              Cancelar
            </button>
            <button onClick={handleDeleteAluna} disabled={saving} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold disabled:opacity-60">
              {saving ? "Excluindo..." : "Excluir"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
