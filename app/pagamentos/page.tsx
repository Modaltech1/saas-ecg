"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { QRCodeSVG } from "qrcode.react"
import {
  Search, CheckCircle, AlertCircle, Clock, QrCode, Copy, ChevronDown, ChevronUp,
  ExternalLink, Loader2, RefreshCw, AlertTriangle, Timer,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { PublicHeader } from "@/components/layout/public-header"

const POLLING_INTERVAL = 30 * 60 // 30 minutos em segundos

function formatCpf(value: string) {
  const num = value.replace(/\D/g, "").slice(0, 11)
  return num
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

function formatMes(mesRef: string) {
  if (!mesRef) return ""
  const [year, month] = mesRef.split("-")
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  })
}

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

type Pagamento = {
  id: string
  mes_referencia: string
  valor: number
  status: "Pago" | "Pendente" | "Expirado"
  data_pagamento: string | null
  tipo: "mensalidade" | "matricula"
  txid_cora: string | null
  pix_status: string | null
}

type AlunaData = {
  id: string
  nome: string
  turma: string
  responsavel: string
  pagamentos: Pagamento[]
}

type PixGerado = {
  invoiceId: string
  pixCopyPaste: string | null
  pixQrCode: string | null
  paymentUrl: string | null
  valorReais: number
  descricao: string
  pagamentoIds: string[]
}

export default function PagamentosPublicPage() {
  const [cpfInput, setCpfInput] = useState("")
  const [buscando, setBuscando] = useState(false)
  const [buscado, setBuscado] = useState(false)
  const [alunas, setAlunas] = useState<AlunaData[]>([])
  const [erroFetch, setErroFetch] = useState("")

  const [gerando, setGerando] = useState<string | null>(null)
  const [pixGerado, setPixGerado] = useState<PixGerado | null>(null)
  const [erroPix, setErroPix] = useState("")
  const [copiado, setCopiado] = useState(false)
  const [expandedPag, setExpandedPag] = useState<string | null>(null)

  // Polling a cada 10 minutos
  const [countdown, setCountdown] = useState(POLLING_INTERVAL)
  const [verificando, setVerificando] = useState(false)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentCpfRef = useRef("")
  const ultimoPixRecuperadoRef = useRef<string | null>(null)

  const buscarDados = useCallback(async (cpf: string, silent = false) => {
    if (!cpf || cpf.length < 11) return
    if (!silent) setBuscando(true)
    setErroFetch("")

    try {
      const res = await fetch(`/api/pagamentos/buscar-cpf?cpf=${cpf}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro na busca")
      setAlunas(data.alunas ?? [])
    } catch (err) {
      if (!silent) {
        setErroFetch(err instanceof Error ? err.message : "Erro ao buscar")
        setAlunas([])
      }
    } finally {
      if (!silent) {
        setBuscando(false)
        setBuscado(true)
      }
    }
  }, [])

  const verificarPagamentos = useCallback(async (alunaId: string) => {
    setVerificando(true)
    try {
      await fetch("/api/pagamentos/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alunaId }),
      })
      // Após verificar na Cora, atualiza os dados do banco na tela
      await buscarDados(currentCpfRef.current, true)
    } catch {
      // erro silencioso — não bloqueia o pai
    } finally {
      setVerificando(false)
      setCountdown(POLLING_INTERVAL)
    }
  }, [buscarDados])

  // Inicia polling assim que há alunas carregadas
  useEffect(() => {
    if (alunas.length === 0) return

    const alunaId = alunas[0].id

    // Countdown tick
    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : POLLING_INTERVAL))
    }, 1000)

    // Polling a cada 10 minutos
    pollingRef.current = setInterval(() => {
      verificarPagamentos(alunaId)
    }, POLLING_INTERVAL * 1000)

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [alunas, verificarPagamentos])

  async function handleBusca(e: React.FormEvent) {
    e.preventDefault()
    const cpf = cpfInput.replace(/\D/g, "")
    if (cpf.length < 11) return

    currentCpfRef.current = cpf
    setPixGerado(null)
    setErroPix("")
    setCountdown(POLLING_INTERVAL)

    if (countdownRef.current) clearInterval(countdownRef.current)
    if (pollingRef.current) clearInterval(pollingRef.current)

    await buscarDados(cpf)
  }

  async function gerarPix(
    alunaId: string,
    pagamentoIds: string[],
    tipo: "mensalidade" | "matricula" | "total"
  ) {
    const key = `${alunaId}-${tipo}`
    setGerando(key)
    setErroPix("")
    setPixGerado(null)

    try {
      const res = await fetch("/api/cora/criar-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagamentoIds, tipo, alunaId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao gerar PIX")
      setPixGerado({ ...data, pagamentoIds })
      // Atualiza dados após gerar PIX (txid_cora foi salvo no banco)
      await buscarDados(currentCpfRef.current, true)
    } catch (err) {
      setErroPix(err instanceof Error ? err.message : "Erro ao gerar PIX")
    } finally {
      setGerando(null)
    }
  }

  const recuperarPixPendente = useCallback(async (alunaId: string, invoiceId: string) => {
    if (!invoiceId) return

    try {
      const res = await fetch(
        `/api/pagamentos/pix?invoiceId=${encodeURIComponent(invoiceId)}&alunaId=${encodeURIComponent(alunaId)}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao recuperar PIX pendente")
      setPixGerado(data)
    } catch {
      // não bloqueia a tela; o responsável ainda pode gerar um novo PIX se necessário
    }
  }, [])

  function copiarPix() {
    if (!pixGerado?.pixCopyPaste) return
    navigator.clipboard.writeText(pixGerado.pixCopyPaste)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  // Detecta se um pagamento pendente tem PIX expirado (sem txid = expirado ou nunca gerado)
  function pixExpirado(pag: Pagamento) {
    return (
      pag.status === "Pendente" &&
      pag.txid_cora === null &&
      (pag.pix_status === "EXPIRED" || pag.pix_status === "CANCELLED" || pag.pix_status === "OVERDUE")
    )
  }

  // Detecta PIX aguardando pagamento (txid preenchido, pendente)
  function pixAguardando(pag: Pagamento) {
    return pag.status === "Pendente" && pag.txid_cora !== null
  }

  // Reidrata o card do QR quando já existe PIX pendente salvo no banco.
  useEffect(() => {
    if (pixGerado || alunas.length === 0) return

    const aluna = alunas[0]
    const pendenteComPix = aluna.pagamentos.find((p) =>
      p.status === "Pendente" &&
      !!p.txid_cora &&
      p.pix_status !== "EXPIRED" &&
      p.pix_status !== "CANCELLED" &&
      p.pix_status !== "OVERDUE"
    )

    if (!pendenteComPix?.txid_cora) return
    if (ultimoPixRecuperadoRef.current === pendenteComPix.txid_cora) return

    ultimoPixRecuperadoRef.current = pendenteComPix.txid_cora
    recuperarPixPendente(aluna.id, pendenteComPix.txid_cora)
  }, [alunas, pixGerado, recuperarPixPendente])

  return (
    <div className="min-h-screen bg-muted/30">
      <PublicHeader subtitle="Portal de Pagamentos" />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* Busca por CPF */}
        <section className="bg-card rounded-lg border border-border p-5 shadow-sm">
          <h1 className="text-xl font-bold text-foreground mb-1">Consultar Pagamentos</h1>
          <p className="text-sm text-gray-500 mb-4">
            Digite o CPF da aluna para consultar e pagar mensalidades pendentes.
          </p>
          <form onSubmit={handleBusca} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CPF da Aluna</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={cpfInput}
                  onChange={(e) => setCpfInput(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full pl-10 pr-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg tracking-wider"
                  maxLength={14}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={buscando}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold text-base hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {buscando ? <><Loader2 className="w-5 h-5 animate-spin" /> Buscando...</> : "Consultar"}
            </button>
          </form>
        </section>

        {/* Erro de busca */}
        {buscado && erroFetch && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-5 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
            <p className="font-semibold text-red-800">{erroFetch}</p>
            <p className="text-sm text-red-600 mt-1">Verifique o CPF digitado ou entre em contato com a escola.</p>
          </div>
        )}

        {/* Sem resultados */}
        {buscado && !erroFetch && alunas.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 text-center">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
            <p className="font-semibold text-amber-800">Nenhuma aluna encontrada</p>
            <p className="text-sm text-amber-600 mt-1">Nao encontramos alunas vinculadas a este CPF.</p>
          </div>
        )}

        {/* Banner de polling */}
        {alunas.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 text-blue-700">
              <Timer className="w-4 h-4 flex-shrink-0" />
              <p className="text-xs">
                {verificando
                  ? "Verificando pagamentos..."
                  : `Status atualizado automaticamente. Proxima verificacao em ${formatCountdown(countdown)}`}
              </p>
            </div>
            <button
              onClick={() => verificarPagamentos(alunas[0].id)}
              disabled={verificando}
              className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 disabled:opacity-50 ml-2 flex-shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${verificando ? "animate-spin" : ""}`} />
              Verificar agora
            </button>
          </div>
        )}

        {/* Resultado por aluna */}
        {alunas.map((aluna) => {
          const pendentes = aluna.pagamentos.filter((p) => p.status === "Pendente")
          const mensalidadesPendentes = pendentes.filter((p) => p.tipo === "mensalidade")
          const matriculaPendente = pendentes.find((p) => p.tipo === "matricula")
          const totalPendente = pendentes.reduce((sum, p) => sum + Number(p.valor), 0)
          // Pendentes sem PIX gerado ou com PIX expirado (podem gerar novo)
          const pendentesParaPagar = pendentes.filter((p) => !pixAguardando(p))

          return (
            <div key={aluna.id} className="space-y-4">

              {/* Info da aluna */}
              <section className="bg-card rounded-lg border border-border p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold flex-shrink-0">
                    {aluna.nome.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground text-lg">{aluna.nome}</h2>
                    <p className="text-sm text-gray-500">{aluna.turma}</p>
                  </div>
                </div>

                {pendentes.length === 0 ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800">Mensalidades em dia!</p>
                      <p className="text-xs text-green-600">Nenhuma pendencia encontrada.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-amber-800">
                        {pendentes.length} pendencia{pendentes.length > 1 ? "s" : ""}
                      </p>
                      <p className="text-sm font-bold text-amber-700">Total: {formatCurrency(totalPendente)}</p>
                    </div>
                  </div>
                )}
              </section>

              {/* Pendencias e botoes de pagamento */}
              {pendentes.length > 0 && (
                <section className="bg-card rounded-lg border border-border p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-foreground text-lg">Pagar com PIX</h3>

                  {/* Pagar tudo junto — só mostra se há pendentes sem PIX ativo */}
                  {pendentesParaPagar.length > 1 && (
                    <div className="bg-primary/10 border border-primary/40 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-foreground">Pagar tudo</p>
                          <p className="text-xs text-gray-500">{pendentesParaPagar.length} itens pendentes</p>
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          {formatCurrency(pendentesParaPagar.reduce((s, p) => s + p.valor, 0))}
                        </p>
                      </div>
                      <button
                        onClick={() => gerarPix(aluna.id, pendentesParaPagar.map((p) => p.id), "total")}
                        disabled={gerando === `${aluna.id}-total`}
                        className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {gerando === `${aluna.id}-total` ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Gerando PIX...</>
                        ) : (
                          <><QrCode className="w-4 h-4" /> Gerar PIX — {formatCurrency(pendentesParaPagar.reduce((s, p) => s + p.valor, 0))}</>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Mensalidades individuais */}
                  {mensalidadesPendentes.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-700">Mensalidades pendentes:</p>
                      {mensalidadesPendentes.map((m) => {
                        const expirado = pixExpirado(m)
                        const aguardando = pixAguardando(m)
                        return (
                          <div key={m.id} className={`p-3 border rounded-lg ${expirado ? "bg-red-50 border-red-200" : aguardando ? "bg-blue-50 border-blue-200" : "bg-muted/30 border-border"}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-800 text-sm capitalize">{formatMes(m.mes_referencia)}</p>
                                {expirado && (
                                  <p className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
                                    <AlertTriangle className="w-3 h-3" /> PIX expirado — gere um novo
                                  </p>
                                )}
                                {aguardando && (
                                  <p className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3" /> Aguardando pagamento...
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-foreground text-sm">{formatCurrency(m.valor)}</p>
                                {!aguardando && (
                                  <button
                                    onClick={() => gerarPix(aluna.id, [m.id], "mensalidade")}
                                    disabled={!!gerando}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1 ${expirado ? "bg-red-600 text-white hover:bg-red-700" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
                                  >
                                    {gerando === `${aluna.id}-mensalidade` ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <QrCode className="w-3 h-3" />
                                    )}
                                    {expirado ? "Novo PIX" : "PIX"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Matrícula pendente */}
                  {matriculaPendente && (() => {
                    const expirado = pixExpirado(matriculaPendente)
                    const aguardando = pixAguardando(matriculaPendente)
                    return (
                      <div className={`flex items-center justify-between p-3 border rounded-lg ${expirado ? "bg-red-50 border-red-200" : aguardando ? "bg-blue-50 border-blue-200" : "bg-blue-50 border-blue-200"}`}>
                        <div>
                          <p className="font-medium text-blue-900 text-sm">Taxa de Matricula</p>
                          {expirado && (
                            <p className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="w-3 h-3" /> PIX expirado — gere um novo
                            </p>
                          )}
                          {aguardando && (
                            <p className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> Aguardando pagamento...
                            </p>
                          )}
                          {!expirado && !aguardando && <p className="text-xs text-blue-600">Pagamento unico</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-blue-900 text-sm">{formatCurrency(matriculaPendente.valor)}</p>
                          {!aguardando && (
                            <button
                              onClick={() => gerarPix(aluna.id, [matriculaPendente.id], "matricula")}
                              disabled={!!gerando}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1 ${expirado ? "bg-red-600 text-white hover:bg-red-700" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                            >
                              {gerando === `${aluna.id}-matricula` ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <QrCode className="w-3 h-3" />
                              )}
                              {expirado ? "Novo PIX" : "PIX"}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </section>
              )}

              {/* Historico */}
              <section className="bg-card rounded-lg border border-border p-5 shadow-sm">
                <h3 className="font-bold text-foreground text-lg mb-3">Historico de Pagamentos</h3>
                <div className="space-y-2">
                  {aluna.pagamentos.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">Nenhum registro encontrado.</p>
                  )}
                  {aluna.pagamentos.map((pag) => {
                    const isOpen = expandedPag === pag.id
                    const label = pag.tipo === "matricula"
                      ? "Taxa de Matricula"
                      : `${formatMes(pag.mes_referencia)}`
                    return (
                      <div key={pag.id} className="border border-gray-100 rounded-lg overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                          onClick={() => setExpandedPag(isOpen ? null : pag.id)}
                        >
                          <div className="flex items-center gap-3">
                            {pag.status === "Pago" ? (
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            )}
                            <span className="font-medium text-gray-800 text-sm text-left">{label}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <span className="font-bold text-foreground text-sm">{formatCurrency(pag.valor)}</span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              pag.status === "Pago"
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {pag.status}
                            </span>
                            {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                          </div>
                        </button>
                        {isOpen && (
                          <div className="px-3 pb-3 text-xs text-gray-500 space-y-1">
                            {pag.data_pagamento && (
                              <p>Pago em {new Date(pag.data_pagamento).toLocaleDateString("pt-BR")}</p>
                            )}
                            {pag.pix_status && pag.status !== "Pago" && (
                              <p>Status PIX: {pag.pix_status}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>
          )
        })}

        {/* Modal/Card PIX gerado */}
        {pixGerado && (
          <section className="bg-card rounded-lg border-2 border-primary p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                PIX Gerado!
              </h3>
              <button
                onClick={() => setPixGerado(null)}
                className="text-gray-400 hover:text-gray-600 text-sm underline"
              >
                Fechar
              </button>
            </div>

            <div className="text-center bg-primary/10 rounded-lg p-4">
              <p className="text-sm text-gray-600">{pixGerado.descricao}</p>
              <p className="text-3xl font-bold text-foreground mt-1">{formatCurrency(pixGerado.valorReais)}</p>
              <p className="text-xs text-gray-500 mt-1">Vencimento: amanha</p>
            </div>

            {/* QR Code */}
            {pixGerado.pixQrCode && (
              <div className="flex justify-center p-3 border border-border rounded-lg bg-card">
                <QRCodeSVG value={pixGerado.pixQrCode} size={192} level="M" />
              </div>
            )}

            {/* Copia e cola */}
            {pixGerado.pixCopyPaste && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1.5">Copia e Cola:</p>
                <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg p-3">
                  <span className="flex-1 font-mono text-xs text-gray-700 break-all">{pixGerado.pixCopyPaste}</span>
                  <button
                    onClick={copiarPix}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiado ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>
            )}

            {/* Link de pagamento */}
            {pixGerado.paymentUrl && (
              <a
                href={pixGerado.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-input rounded-lg text-sm font-semibold text-gray-700 hover:bg-muted/30 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir pagina de pagamento
              </a>
            )}

            {/* Instrucoes */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-1.5">
              <p className="text-xs font-semibold text-blue-800 mb-2">Como pagar:</p>
              {[
                "Abra o app do seu banco e escolha pagar com PIX.",
                "Use o copia e cola ou escaneie o QR Code acima.",
                `Confirme o valor de ${formatCurrency(pixGerado.valorReais)}.`,
                "O status e verificado automaticamente a cada 10 minutos. Voce pode fechar e reabrir a pagina quando quiser.",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-blue-700">{step}</p>
                </div>
              ))}
            </div>

            {erroPix && (
              <p className="text-sm text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> {erroPix}
              </p>
            )}

            <button
              onClick={() => { setPixGerado(null); buscarDados(currentCpfRef.current, false) }}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar status dos pagamentos
            </button>
          </section>
        )}

        {erroPix && !pixGerado && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {erroPix}
            </p>
          </div>
        )}

        <footer className="text-center text-xs text-gray-400 pb-4 space-y-1">
          <p>Em caso de duvidas, entre em contato pelo WhatsApp.</p>
          <p>
            desenvolvido por{" "}
            <a href="https://www.prodexylabs.com/" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-gray-600 transition-colors">
              Prodexy
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}
