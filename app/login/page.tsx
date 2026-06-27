"use client"

import { Suspense, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { login } from "@/lib/supabase/actions"
import { AuthCard, AuthError } from "@/components/shared/auth-card"
import { PasswordInput } from "@/components/shared/password-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("from") || "/admin"
  const erroConfirmacao = searchParams.get("erro")

  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const erroVisivel =
    erro ??
    (erroConfirmacao === "confirmacao-email"
      ? "Nao foi possivel confirmar o e-mail. Solicite um novo link."
      : erroConfirmacao === "link-invalido"
        ? "Link de confirmacao invalido ou expirado."
        : null)

  async function handleSubmit(formData: FormData) {
    setErro(null)

    startTransition(async () => {
      const resultado = await login(formData)

      if (resultado?.erro) {
        setErro(resultado.erro)
        return
      }

      if (resultado?.sucesso && resultado?.destino) {
        router.push(resultado.destino || redirectTo)
        router.refresh()
      }
    })
  }

  return (
    <AuthCard description="Acesse o sistema com seu e-mail e senha.">
      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="seu@email.com"
            required
            autoComplete="email"
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="senha">Senha</Label>
          <PasswordInput
            id="senha"
            name="senha"
            visible={mostrarSenha}
            onToggleVisible={() => setMostrarSenha(!mostrarSenha)}
            placeholder="********"
            required
            autoComplete="current-password"
            disabled={isPending}
          />
        </div>

        {erroVisivel ? <AuthError>{erroVisivel}</AuthError> : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="mt-5 border-t pt-4 text-center text-sm text-muted-foreground">
        <span>Novo cliente? </span>
        <Link href="/criar-conta" className="font-semibold text-primary hover:underline">
          Criar conta
        </Link>
      </div>
    </AuthCard>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <LoginPageInner />
    </Suspense>
  )
}
