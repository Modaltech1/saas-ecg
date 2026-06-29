"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Building2, CheckCircle, KeyRound, Loader2, Save, ShieldCheck, Users } from "lucide-react"
import { alterarSenhaLogado, atualizarConta } from "@/lib/supabase/actions"
import { PageHeader } from "@/components/shared/page-header"
import { PasswordInput } from "@/components/shared/password-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ContaData = {
  nome: string
  slug: string
  status: string
  plano: string
  responsavel: string
  email_contato: string
  telefone: string
  whatsapp: string
  documento: string
  site: string
  endereco: string
  cidade: string
  estado: string
}

export function ContaClient({ initialData }: { initialData: ContaData }) {
  const router = useRouter()
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [erroSenha, setErroSenha] = useState<string | null>(null)
  const [sucessoSenha, setSucessoSenha] = useState<string | null>(null)
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false)
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isPasswordPending, startPasswordTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setErro(null)
    setSucesso(null)

    startTransition(async () => {
      const result = await atualizarConta(formData)

      if (result?.erro) {
        setErro(result.erro)
        return
      }

      setSucesso("Dados da conta atualizados.")
      router.refresh()
    })
  }

  function handlePasswordSubmit(formData: FormData) {
    setErroSenha(null)
    setSucessoSenha(null)

    startPasswordTransition(async () => {
      const result = await alterarSenhaLogado(formData)

      if (result?.erro) {
        setErroSenha(result.erro)
        return
      }

      setSucessoSenha("Senha atualizada com sucesso.")
    })
  }

  return (
    <>
      <PageHeader title="Conta" description="Dados institucionais, contato e seguranca da sua conta." />

      {(erro || sucesso) ? (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          erro ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"
        }`}>
          {erro ?? sucesso}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              Dados da conta
            </CardTitle>
            <CardDescription>
              Essas informacoes aparecem em contatos, paginas publicas e operacao interna.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nome">Nome da conta</Label>
                  <Input id="nome" name="nome" defaultValue={initialData.nome} required disabled={isPending} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="identificador">Identificador publico</Label>
                  <Input id="identificador" value={initialData.slug} disabled readOnly />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documento">Documento</Label>
                  <Input id="documento" name="documento" defaultValue={initialData.documento} placeholder="CNPJ ou CPF" disabled={isPending} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsavel">Responsavel principal</Label>
                  <Input id="responsavel" name="responsavel" defaultValue={initialData.responsavel} placeholder="Nome completo" disabled={isPending} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_contato">E-mail de contato</Label>
                  <Input id="email_contato" name="email_contato" type="email" defaultValue={initialData.email_contato} placeholder="contato@instituicao.com" disabled={isPending} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" name="telefone" defaultValue={initialData.telefone} placeholder="(00) 0000-0000" disabled={isPending} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp de atendimento</Label>
                  <Input id="whatsapp" name="whatsapp" defaultValue={initialData.whatsapp} placeholder="(00) 00000-0000" disabled={isPending} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="site">Site</Label>
                  <Input id="site" name="site" defaultValue={initialData.site} placeholder="https://instituicao.com" disabled={isPending} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endereco">Endereco</Label>
                  <Input id="endereco" name="endereco" defaultValue={initialData.endereco} placeholder="Rua, numero e complemento" disabled={isPending} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" name="cidade" defaultValue={initialData.cidade} disabled={isPending} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input id="estado" name="estado" defaultValue={initialData.estado} placeholder="UF" maxLength={2} disabled={isPending} />
                </div>
              </div>

              <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Salvar dados da conta
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                Seguranca
              </CardTitle>
              <CardDescription>
                Controles essenciais de acesso e protecao da conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border bg-background p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 size-5 text-[color:var(--success)]" />
                  <div>
                    <p className="font-semibold">Confirmacao de e-mail</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Novas contas precisam confirmar e-mail antes do acesso administrativo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <div className="flex items-start gap-3">
                  <KeyRound className="mt-0.5 size-5 text-primary" />
                  <div>
                    <p className="font-semibold">Permissoes por usuario</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Gerencie administradores, colaboradores e professoras em Acessos.
                    </p>
                  </div>
                </div>
              </div>

              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/usuarios">
                  <Users className="size-4" />
                  Gerenciar acessos
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="size-5 text-primary" />
                Trocar senha
              </CardTitle>
              <CardDescription>
                Atualize sua senha de acesso mantendo a sessao atual.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="senha_atual">Senha atual</Label>
                  <PasswordInput
                    id="senha_atual"
                    name="senha_atual"
                    visible={mostrarSenhaAtual}
                    onToggleVisible={() => setMostrarSenhaAtual((value) => !value)}
                    placeholder="Senha atual"
                    required
                    disabled={isPasswordPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nova_senha">Nova senha</Label>
                  <PasswordInput
                    id="nova_senha"
                    name="senha"
                    visible={mostrarNovaSenha}
                    onToggleVisible={() => setMostrarNovaSenha((value) => !value)}
                    minLength={8}
                    placeholder="Minimo 8 caracteres"
                    required
                    disabled={isPasswordPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmar_senha">Confirmar nova senha</Label>
                  <PasswordInput
                    id="confirmar_senha"
                    name="confirmar_senha"
                    visible={mostrarNovaSenha}
                    onToggleVisible={() => setMostrarNovaSenha((value) => !value)}
                    minLength={8}
                    placeholder="Repita a nova senha"
                    required
                    disabled={isPasswordPending}
                  />
                </div>

                {(erroSenha || sucessoSenha) ? (
                  <div className={`rounded-lg border px-4 py-3 text-sm ${
                    erroSenha ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"
                  }`}>
                    {erroSenha ?? sucessoSenha}
                  </div>
                ) : null}

                <Button type="submit" disabled={isPasswordPending} className="w-full">
                  {isPasswordPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Atualizar senha
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Identificacao</CardTitle>
              <CardDescription>
                O identificador publico ajuda a resolver links e paginas publicas da conta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Identificador</p>
                <p className="mt-1 font-mono text-sm">{initialData.slug}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
