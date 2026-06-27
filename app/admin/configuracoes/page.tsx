"use client"

import { useState, useEffect } from "react"
import { MobileHeader } from "@/components/layout/mobile-header"
import { PageHeader } from "@/components/shared/page-header"
import {
  Settings, Webhook, CheckCircle, AlertCircle,
  ToggleLeft, ToggleRight, MessageCircle, CreditCard,
  Wifi, WifiOff, Loader2, Save, ExternalLink, ShieldCheck, Key,
} from "lucide-react"

type Config = {
  cora_ambiente: "producao" | "sandbox"
  cora_webhook_url: string
  cora_ativo: boolean
  cora_client_id: string
  cora_private_key: string
  cora_certificate: string
  cora_client_id_configurado: boolean
  cora_private_key_configurada: boolean
  cora_certificate_configurado: boolean
  whatsapp_admin: string
}

type TesteStatus = "idle" | "testando" | "ok" | "erro"

function CredentialStatus({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
      ok
        ? "border-green-200 bg-green-50 text-green-700"
        : "border-amber-200 bg-amber-50 text-amber-700"
    }`}>
      {ok ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
      {ok ? "Configurada" : "Pendente"}
    </span>
  )
}

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<Config>({
    cora_ambiente: "producao",
    cora_webhook_url: "",
    cora_ativo: false,
    cora_client_id: "",
    cora_private_key: "",
    cora_certificate: "",
    cora_client_id_configurado: false,
    cora_private_key_configurada: false,
    cora_certificate_configurado: false,
    whatsapp_admin: "",
  })
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erroSalvar, setErroSalvar] = useState("")
  const [testeStatus, setTesteStatus] = useState<TesteStatus>("idle")
  const [testeErro, setTesteErro] = useState("")
  const [activeTab, setActiveTab] = useState<"cora" | "contato">("cora")

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch("/api/admin/configuracoes")
        if (res.ok) {
          const data = await res.json()
          setConfig((prev) => ({
            ...prev,
            cora_ambiente: data.cora_ambiente ?? "producao",
            cora_webhook_url: data.cora_webhook_url ?? "",
            cora_ativo: data.cora_ativo ?? false,
            cora_client_id: "",
            cora_private_key: "",
            cora_certificate: "",
            cora_client_id_configurado: data.cora_client_id_configurado ?? false,
            cora_private_key_configurada: data.cora_private_key_configurada ?? false,
            cora_certificate_configurado: data.cora_certificate_configurado ?? false,
            whatsapp_admin: data.whatsapp_admin ?? "",
          }))
        }
      } catch { /* silencia */ } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErroSalvar("")
    try {
      const res = await fetch("/api/admin/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? "Erro ao salvar")
      }
      setConfig((prev) => ({
        ...prev,
        cora_client_id_configurado: prev.cora_client_id_configurado || prev.cora_client_id.trim().length > 0,
        cora_private_key_configurada: prev.cora_private_key_configurada || prev.cora_private_key.trim().length > 0,
        cora_certificate_configurado: prev.cora_certificate_configurado || prev.cora_certificate.trim().length > 0,
        cora_client_id: "",
        cora_private_key: "",
        cora_certificate: "",
      }))
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2500)
    } catch (err) {
      setErroSalvar(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSalvando(false)
    }
  }

  async function testarConexao() {
    setTesteStatus("testando")
    setTesteErro("")
    try {
      const res = await fetch("/api/cora/testar-conexao", { method: "POST" })
      const data = await res.json()
      if (data.ok) {
        setTesteStatus("ok")
      } else {
        setTesteStatus("erro")
        setTesteErro(data.erro ?? "Falha na autenticação")
      }
    } catch (err) {
      setTesteStatus("erro")
      setTesteErro(err instanceof Error ? err.message : "Erro de rede")
    }
  }

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/cora/webhook`
      : "/api/cora/webhook"

  if (carregando) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeader title="Configurações" />

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-6 lg:px-8">
        <PageHeader title="Configuracoes do Sistema" description="Integracao Banco Cora (PIX) e dados de contato." />

        <section className="hidden">
          <h1 className="text-xl font-bold text-foreground">Configurações do Sistema</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Integração Banco Cora (PIX) e dados de contato.
          </p>
        </section>

        {/* Status geral */}
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${config.cora_ativo
          ? "bg-green-50 border-green-200"
          : "bg-amber-50 border-amber-200"
          }`}>
          {config.cora_ativo ? (
            <>
              <Wifi className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800">Integração ativa</p>
                <p className="text-xs text-green-600">Banco Cora conectado — pagamentos PIX automáticos habilitados</p>
              </div>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-800">Integração inativa</p>
                <p className="text-xs text-amber-600">Ative após testar a conexão com sucesso</p>
              </div>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="flex bg-card rounded-lg border border-border p-1 gap-1">
          {([
            { key: "cora", label: "Banco Cora", icon: CreditCard },
            { key: "contato", label: "Contato", icon: MessageCircle },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={salvar} className="space-y-4">

          {/* Tab Banco Cora */}
          {activeTab === "cora" && (
            <section className="bg-card rounded-lg border border-border p-5 space-y-5">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-foreground">Banco Cora — PIX (Produção)</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Ambiente
                </label>
                <select
                  value={config.cora_ambiente}
                  onChange={(e) => setConfig((c) => ({ ...c, cora_ambiente: e.target.value as Config["cora_ambiente"] }))}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="producao">Produção</option>
                  <option value="sandbox">Sandbox</option>
                </select>
              </div>

              {/* Credenciais mTLS por tenant */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="flex items-center gap-2 bg-muted/30 px-4 py-3 border-b border-border">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Credenciais mTLS</p>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <label className="text-sm font-medium text-foreground">Client ID</label>
                      <CredentialStatus ok={config.cora_client_id_configurado || config.cora_client_id.trim().length > 0} />
                    </div>
                    <input
                      type="text"
                      value={config.cora_client_id}
                      onChange={(e) => setConfig((c) => ({ ...c, cora_client_id: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                      placeholder={config.cora_client_id_configurado ? "Client ID salvo. Preencha para substituir." : "Client ID fornecido pela Cora"}
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <label className="text-sm font-medium text-foreground">Chave privada PEM</label>
                      <CredentialStatus ok={config.cora_private_key_configurada || config.cora_private_key.trim().length > 0} />
                    </div>
                    <textarea
                      value={config.cora_private_key}
                      onChange={(e) => setConfig((c) => ({ ...c, cora_private_key: e.target.value }))}
                      className="min-h-28 w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                      placeholder={config.cora_private_key_configurada ? "Chave salva. Cole uma nova PEM para substituir." : "-----BEGIN PRIVATE KEY-----"}
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <label className="text-sm font-medium text-foreground">Certificado PEM</label>
                      <CredentialStatus ok={config.cora_certificate_configurado || config.cora_certificate.trim().length > 0} />
                    </div>
                    <textarea
                      value={config.cora_certificate}
                      onChange={(e) => setConfig((c) => ({ ...c, cora_certificate: e.target.value }))}
                      className="min-h-28 w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                      placeholder={config.cora_certificate_configurado ? "Certificado salvo. Cole um novo PEM para substituir." : "-----BEGIN CERTIFICATE-----"}
                    />
                  </div>
                </div>
              </div>

              {/* Webhook URL — auto-gerada */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Webhook className="w-4 h-4" />
                    URL do Webhook
                  </span>
                </label>
                <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg px-3 py-2.5">
                  <span className="flex-1 font-mono text-xs text-foreground break-all">{webhookUrl}</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(webhookUrl)}
                    className="flex-shrink-0 text-xs text-primary font-semibold hover:underline"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              {/* URL webhook de referência */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  URL cadastrada no Cora (referência)
                </label>
                <input
                  type="text"
                  value={config.cora_webhook_url}
                  onChange={(e) => setConfig((c) => ({ ...c, cora_webhook_url: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  placeholder={webhookUrl}
                />
              </div>

              {/* Toggle ativo */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-semibold text-foreground">Ativar integração Cora</p>
                  <p className="text-xs text-muted-foreground">Habilita geração de PIX automático para os responsáveis</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, cora_ativo: !c.cora_ativo }))}
                >
                  {config.cora_ativo ? (
                    <ToggleRight className="w-10 h-10 text-primary" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Testar conexão */}
              <button
                type="button"
                onClick={testarConexao}
                disabled={testeStatus === "testando"}
                className="w-full py-2.5 border-2 border-primary text-primary rounded-lg font-semibold text-sm hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {testeStatus === "testando" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Testando conexão mTLS...</>
                ) : (
                  <><Wifi className="w-4 h-4" /> Testar Conexão com Banco Cora</>
                )}
              </button>

              {testeStatus === "ok" && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">Conexão mTLS estabelecida!</p>
                    <p className="text-xs text-green-600">Token OAuth2 obtido com sucesso. Você pode ativar a integração.</p>
                  </div>
                </div>
              )}
              {testeStatus === "erro" && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Falha na conexão</p>
                    <p className="text-xs text-red-600 mt-0.5 font-mono">{testeErro}</p>
                  </div>
                </div>
              )}

              {/* Link portal pagamentos */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-800 mb-1.5">Link público para enviar aos pais</p>
                <div className="flex items-center gap-2">
                  <span className="flex-1 font-mono text-xs text-green-700 bg-card rounded border border-green-200 px-3 py-2 break-all">
                    {typeof window !== "undefined" ? window.location.origin : "https://seu-dominio.com"}/pagamentos
                  </span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(
                      `${typeof window !== "undefined" ? window.location.origin : ""}/pagamentos`
                    )}
                    className="flex-shrink-0 text-xs text-green-700 font-semibold hover:underline"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Tab Contato */}
          {activeTab === "contato" && (
            <section className="bg-card rounded-lg border border-border p-5 space-y-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-foreground">Contato da Administração</h2>
              </div>

              <p className="text-sm text-muted-foreground">
                Número de WhatsApp que aparece como suporte na página de pagamentos e produtos.
              </p>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    WhatsApp da Administração
                  </span>
                </label>
                <input
                  type="text"
                  value={config.whatsapp_admin}
                  onChange={(e) => setConfig((c) => ({ ...c, whatsapp_admin: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="(27) 99000-0000"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                <p className="text-xs font-semibold text-blue-800">Links públicos do sistema</p>
                <div className="space-y-1 text-xs text-blue-700">
                  <p><span className="font-medium">Pagamentos:</span> <span className="font-mono">/pagamentos</span></p>
                  <p><span className="font-medium">Vitrine de produtos:</span> <span className="font-mono">/produtos</span></p>
                  <p><span className="font-medium">Pré-matrícula:</span> <span className="font-mono">/cadastro</span></p>
                  <p><span className="font-medium">Eventos:</span> <span className="font-mono">/eventos</span></p>
                </div>
              </div>
            </section>
          )}

          {/* Botão salvar */}
          <button
            type="submit"
            disabled={salvando}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold text-base hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {salvando ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</>
            ) : salvo ? (
              <><CheckCircle className="w-5 h-5" /> Salvo!</>
            ) : (
              <><Save className="w-5 h-5" /> Salvar Configurações</>
            )}
          </button>

          {erroSalvar && (
            <p className="text-sm text-red-600 text-center flex items-center justify-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> {erroSalvar}
            </p>
          )}
        </form>
      </main>
    </div>
  )
}
