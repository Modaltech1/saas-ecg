"use client"

import { useState } from "react"
import Image from "next/image"
import { CheckCircle, User, Phone, MapPin, ChevronDown, ChevronUp } from "lucide-react"
import { PublicHeader } from "@/components/layout/public-header"

type Step = "dados" | "endereco" | "sucesso"

export default function CadastroPublicPage() {
  const [step, setStep] = useState<Step>("dados")

  // Dados da aluna
  const [nomeAluna, setNomeAluna] = useState("")
  const [cpfAluna, setCpfAluna] = useState("")
  const [dataNasc, setDataNasc] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Dados do responsável
  const [nomeResp, setNomeResp] = useState("")
  const [cpfResp, setCpfResp] = useState("")
  const [telefone, setTelefone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [email, setEmail] = useState("")
  const [obs, setObs] = useState("")

  // Endereço
  const [cep, setCep] = useState("")
  const [logradouro, setLogradouro] = useState("")
  const [numero, setNumero] = useState("")
  const [complemento, setComplemento] = useState("")
  const [bairro, setBairro] = useState("")
  const [cidade, setCidade] = useState("")
  const [estado, setEstado] = useState("")

  function formatCpf(v: string) {
    const n = v.replace(/\D/g, "").slice(0, 11)
    return n.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2")
  }

  function formatTel(v: string) {
    const n = v.replace(/\D/g, "").slice(0, 11)
    if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
    return n.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
  }

  function formatCep(v: string) {
    return v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d{0,3})/, "$1-$2")
  }

  const inputCls = "w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base"
  const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5"

  if (step === "sucesso") {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col">
        <PublicHeader subtitle="Pré-matrícula" />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Pré-matrícula enviada!</h1>
            <p className="text-gray-600">
              Recebemos os dados de <strong>{nomeAluna}</strong>. Nossa equipe entrará em contato pelo WhatsApp
              <strong> {whatsapp}</strong> para confirmar a matrícula e informar sobre a turma disponível.
            </p>
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-left">
              <p className="text-sm font-semibold text-gray-700 mb-2">Próximos passos:</p>
              <ol className="space-y-1.5 text-sm text-gray-600">
                <li className="flex gap-2"><span className="font-bold text-primary">1.</span> Aguarde nosso contato em até 48h</li>
                <li className="flex gap-2"><span className="font-bold text-primary">2.</span> Confirme a turma e o horário</li>
                <li className="flex gap-2"><span className="font-bold text-primary">3.</span> Pague a taxa de matrícula pelo portal de pagamentos</li>
              </ol>
            </div>
            <a href="/pagamentos" className="block w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold text-base hover:bg-primary/90 transition-colors">
              Ir para Portal de Pagamentos
            </a>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <PublicHeader subtitle="Pré-matrícula" />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Hero */}
        <section className="bg-primary text-primary-foreground rounded-lg p-5">
          <h1 className="text-xl font-bold mb-1">Matricule sua filha</h1>
          <p className="text-sm text-primary-foreground/75">
            Preencha os dados abaixo para solicitar a pré-matrícula. Nossa equipe confirmará a turma disponível e entrará em contato.
          </p>
        </section>

        {/* Indicador de etapa */}
        <div className="flex items-center gap-2">
          {[
            { id: "dados", label: "Dados" },
            { id: "endereco", label: "Endereço" },
          ].map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${step === s.id ? "bg-primary text-primary-foreground" : "bg-gray-200 text-gray-500"}`}>
                {i + 1}
              </div>
              <span className={`text-sm font-medium flex-1 ${step === s.id ? "text-foreground" : "text-gray-400"}`}>{s.label}</span>
              {i === 0 && <div className="w-8 h-px bg-gray-300" />}
            </div>
          ))}
        </div>

        {step === "dados" && (
          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setStep("endereco") }}>
            {/* Dados da aluna */}
            <div className="bg-card rounded-lg border border-border p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-foreground">Dados da Aluna</h2>
              </div>
              <div>
                <label className={labelCls}>Nome completo da aluna *</label>
                <input type="text" value={nomeAluna} onChange={(e) => setNomeAluna(e.target.value)} placeholder="Nome da criança" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Data de nascimento *</label>
                <input type="date" value={dataNasc} onChange={(e) => setDataNasc(e.target.value)} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>CPF da aluna *</label>
                <input type="text" value={cpfAluna} onChange={(e) => setCpfAluna(formatCpf(e.target.value))} placeholder="000.000.000-00" className={inputCls} required minLength={14} maxLength={14} />
              </div>
              <div>
                <label className={labelCls}>Observações (opcional)</label>
                <textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex: experiência anterior, necessidades especiais..." rows={2} className={inputCls + " resize-none"} />
              </div>
            </div>

            {/* Dados do responsável */}
            <div className="bg-card rounded-lg border border-border p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Phone className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-foreground">Dados do Responsável</h2>
              </div>
              <div>
                <label className={labelCls}>Nome completo *</label>
                <input type="text" value={nomeResp} onChange={(e) => setNomeResp(e.target.value)} placeholder="Nome do responsável" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>CPF *</label>
                <input type="text" value={cpfResp} onChange={(e) => setCpfResp(formatCpf(e.target.value))} placeholder="000.000.000-00" className={inputCls} required maxLength={14} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Telefone *</label>
                  <input type="text" value={telefone} onChange={(e) => setTelefone(formatTel(e.target.value))} placeholder="(27) 99000-0000" className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>WhatsApp *</label>
                  <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(formatTel(e.target.value))} placeholder="(27) 99000-0000" className={inputCls} required />
                </div>
              </div>
              <div>
                <label className={labelCls}>E-mail *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" className={inputCls} required />
                <p className="text-xs text-gray-400 mt-1">Será usado para cobranças e comunicados.</p>
              </div>
            </div>

            <button type="submit" className="w-full py-3.5 bg-primary text-primary-foreground rounded-lg font-bold text-base hover:bg-primary/90 transition-colors">
              Continuar para Endereço
            </button>
          </form>
        )}

        {step === "endereco" && (
          <form className="space-y-5" onSubmit={async (e) => {
            e.preventDefault()
            setLoading(true)
            setError("")

            try {
              const res = await fetch("/api/admin/pre-matriculas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  nome_aluna: nomeAluna,
                  cpf_aluna: cpfAluna.replace(/\D/g, ""),
                  data_nascimento: dataNasc,
                  nome_responsavel: nomeResp,
                  cpf_responsavel: cpfResp.replace(/\D/g, ""),
                  telefone,
                  whatsapp,
                  email,
                  logradouro,
                  numero,
                  complemento,
                  bairro,
                  cidade,
                  estado,
                  cep,
                  observacoes: obs,
                }),
              })

              if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Erro ao enviar pré-matrícula")
              }

              setStep("sucesso")
            } catch (err) {
              setError(err instanceof Error ? err.message : "Erro desconhecido")
            } finally {
              setLoading(false)
            }
          }}>
            <div className="bg-card rounded-lg border border-border p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-foreground">Endereço</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>CEP *</label>
                  <input type="text" value={cep} onChange={(e) => setCep(formatCep(e.target.value))} placeholder="00000-000" className={inputCls} required maxLength={9} />
                </div>
                <div>
                  <label className={labelCls}>Estado *</label>
                  <input type="text" value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))} placeholder="ES" className={inputCls} required maxLength={2} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Logradouro *</label>
                <input type="text" value={logradouro} onChange={(e) => setLogradouro(e.target.value)} placeholder="Rua, Av., etc." className={inputCls} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Número *</label>
                  <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="123" className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Complemento</label>
                  <input type="text" value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Apto, Bloco" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Bairro *</label>
                  <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Cidade *</label>
                  <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" className={inputCls} required />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep("dados")} className="flex-1 py-3.5 border border-input text-gray-700 rounded-lg font-bold text-base hover:bg-muted transition-colors">
                Voltar
              </button>
              <button type="submit" disabled={loading} className="flex-[2] py-3.5 bg-primary text-primary-foreground rounded-lg font-bold text-base hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Enviando..." : "Enviar Pré-matrícula"}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                {error}
              </div>
            )}
          </form>
        )}

        <footer className="text-center text-xs text-gray-400 pb-4 space-y-1">
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
