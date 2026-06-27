"use client"

import { useMemo, useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { Building2, CheckCircle2, Eye, EyeOff, MailCheck } from "lucide-react"
import { brand } from "@/branding/brand"
import { normalizarSlugConta } from "@/lib/account-onboarding"
import { criarContaEscolinha } from "@/lib/supabase/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CriarContaPage() {
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<{ email: string; slug: string } | null>(null)
  const [nomeEscolinha, setNomeEscolinha] = useState("")
  const [slugManual, setSlugManual] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [isPending, startTransition] = useTransition()

  const slug = useMemo(
    () => normalizarSlugConta(slugManual || nomeEscolinha),
    [nomeEscolinha, slugManual],
  )

  function handleSubmit(formData: FormData) {
    setErro(null)
    setSucesso(null)

    startTransition(async () => {
      const resultado = await criarContaEscolinha(formData)

      if (resultado?.erro) {
        setErro(resultado.erro)
        return
      }

      if (resultado?.sucesso) {
        setSucesso({ email: resultado.email, slug: resultado.slug })
      }
    })
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-5 sm:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="flex items-center justify-between gap-3">
          <Link href="/login" className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card">
              <Image src={brand.logoUrl} alt={brand.appName} width={44} height={44} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{brand.appName}</p>
              <p className="truncate text-xs text-muted-foreground">Nova conta</p>
            </div>
          </Link>

          <Button asChild variant="outline" size="sm">
            <Link href="/login">Entrar</Link>
          </Button>
        </header>

        {sucesso ? (
          <Card className="mx-auto w-full max-w-xl">
            <CardContent className="space-y-5 px-5 py-8 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MailCheck className="size-7" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Confirme seu e-mail</h1>
                <p className="text-sm text-muted-foreground">
                  Enviamos o link de ativacao para <strong className="text-foreground">{sucesso.email}</strong>.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background px-4 py-3 text-left text-sm">
                <p className="font-semibold text-foreground">Conta criada como pendente</p>
                <p className="mt-1 text-muted-foreground">
                  Depois da confirmacao, a conta <span className="font-mono text-foreground">{sucesso.slug}</span> sera ativada e voce sera redirecionado para o painel.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/login">Voltar para login</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
            <section className="flex min-h-[280px] flex-col justify-end rounded-lg border border-border bg-card p-5 shadow-sm lg:p-7">
              <div className="mb-8 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="size-6" />
              </div>
              <div className="max-w-xl space-y-3">
                <h1 className="text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
                  Criar conta
                </h1>
                <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                  O primeiro usuario sera o owner da conta. O acesso so fica ativo depois da confirmacao por e-mail.
                </p>
              </div>
            </section>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="size-5 text-primary" />
                  Dados da conta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form action={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_escolinha">Nome da escolinha</Label>
                    <Input
                      id="nome_escolinha"
                      name="nome_escolinha"
                      value={nomeEscolinha}
                      onChange={(event) => setNomeEscolinha(event.target.value)}
                      placeholder="Ex.: Escola Movimento"
                      required
                      disabled={isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Identificador</Label>
                    <Input
                      id="slug"
                      name="slug"
                      value={slugManual}
                      onChange={(event) => setSlugManual(event.target.value)}
                      placeholder={slug || "escola-movimento"}
                      disabled={isPending}
                    />
                    <p className="text-xs text-muted-foreground">
                      {slug ? `Slug final: ${slug}` : "Gerado automaticamente pelo nome."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nome_responsavel">Seu nome</Label>
                    <Input id="nome_responsavel" name="nome_responsavel" placeholder="Nome completo" required disabled={isPending} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" name="email" type="email" placeholder="voce@escolinha.com" required disabled={isPending} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">WhatsApp</Label>
                    <Input id="telefone" name="telefone" placeholder="(00) 00000-0000" disabled={isPending} />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="space-y-2">
                      <Label htmlFor="senha">Senha</Label>
                      <div className="relative">
                        <Input
                          id="senha"
                          name="senha"
                          type={mostrarSenha ? "text" : "password"}
                          minLength={8}
                          placeholder="Minimo 8 caracteres"
                          required
                          disabled={isPending}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarSenha((value) => !value)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                        >
                          {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmar_senha">Confirmar senha</Label>
                      <Input
                        id="confirmar_senha"
                        name="confirmar_senha"
                        type={mostrarSenha ? "text" : "password"}
                        minLength={8}
                        placeholder="Repita a senha"
                        required
                        disabled={isPending}
                      />
                    </div>
                  </div>

                  <label className="flex gap-3 rounded-lg border border-border bg-background p-3 text-sm">
                    <input name="aceite_termos" type="checkbox" className="mt-1 size-4" required disabled={isPending} />
                    <span className="text-muted-foreground">
                      Confirmo que posso criar e administrar esta conta.
                    </span>
                  </label>

                  {erro ? (
                    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {erro}
                    </div>
                  ) : null}

                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Criando conta..." : "Criar conta"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}
