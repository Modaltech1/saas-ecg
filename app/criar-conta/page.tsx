"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { MailCheck } from "lucide-react"
import { normalizarSlugConta } from "@/lib/account-onboarding"
import { criarContaEscolinha } from "@/lib/supabase/actions"
import { AuthCard, AuthError } from "@/components/shared/auth-card"
import { PasswordInput } from "@/components/shared/password-input"
import { Button } from "@/components/ui/button"
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

  if (sucesso) {
    return (
      <AuthCard title="Confirme seu e-mail" description="Enviamos um link de ativacao para concluir sua conta.">
        <div className="space-y-5 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="size-7" />
          </div>
          <p className="text-sm text-muted-foreground">
            O link foi enviado para <strong className="text-foreground">{sucesso.email}</strong>.
          </p>
          <div className="rounded-lg border border-border bg-background px-4 py-3 text-left text-sm">
            <p className="font-semibold text-foreground">Conta criada como pendente</p>
            <p className="mt-1 text-muted-foreground">
              Depois da confirmacao, a conta <span className="font-mono text-foreground">{sucesso.slug}</span> sera ativada.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/login">Voltar para login</Link>
          </Button>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Criar conta" description="Crie a conta da sua escolinha. O acesso fica ativo depois da confirmacao por e-mail.">
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

        <div className="space-y-2">
          <Label htmlFor="senha">Senha</Label>
          <PasswordInput
            id="senha"
            name="senha"
            visible={mostrarSenha}
            onToggleVisible={() => setMostrarSenha((value) => !value)}
            minLength={8}
            placeholder="Minimo 8 caracteres"
            required
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmar_senha">Confirmar senha</Label>
          <PasswordInput
            id="confirmar_senha"
            name="confirmar_senha"
            visible={mostrarSenha}
            onToggleVisible={() => setMostrarSenha((value) => !value)}
            minLength={8}
            placeholder="Repita a senha"
            required
            disabled={isPending}
          />
        </div>

        <label className="flex gap-3 rounded-lg border border-border bg-background p-3 text-sm">
          <input name="aceite_termos" type="checkbox" className="mt-1 size-4" required disabled={isPending} />
          <span className="text-muted-foreground">
            Confirmo que posso criar e administrar esta conta.
          </span>
        </label>

        {erro ? <AuthError>{erro}</AuthError> : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>

      <div className="mt-5 border-t pt-4 text-center text-sm text-muted-foreground">
        <span>Ja tem conta? </span>
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Entrar
        </Link>
      </div>
    </AuthCard>
  )
}
