"use client"

import Link from "next/link"
import { Suspense, useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { MailCheck } from "lucide-react"
import { enviarRecuperacaoSenha } from "@/lib/supabase/actions"
import { AuthCard, AuthError } from "@/components/shared/auth-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function RecuperarSenhaPageInner() {
  const searchParams = useSearchParams()
  const erroLink = searchParams.get("erro")
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const erroVisivel =
    erro ??
    (erroLink === "link-invalido"
      ? "Link de recuperacao invalido ou expirado. Solicite um novo link."
      : null)

  function handleSubmit(formData: FormData) {
    setErro(null)
    setSucesso(null)

    startTransition(async () => {
      const result = await enviarRecuperacaoSenha(formData)

      if (result?.erro) {
        setErro(result.erro)
        return
      }

      setSucesso("Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.")
    })
  }

  return (
    <AuthCard title="Recuperar senha" description="Informe seu e-mail para receber um link de redefinicao.">
      {sucesso ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="size-7" />
          </div>
          <p className="text-sm text-muted-foreground">{sucesso}</p>
          <Button asChild className="w-full">
            <Link href="/login">Voltar para login</Link>
          </Button>
        </div>
      ) : (
        <>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" placeholder="seu@email.com" required disabled={isPending} />
            </div>

            {erroVisivel ? <AuthError>{erroVisivel}</AuthError> : null}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Enviando..." : "Enviar link de recuperacao"}
            </Button>
          </form>

          <div className="mt-5 border-t pt-4 text-center text-sm text-muted-foreground">
            <span>Lembrou a senha? </span>
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Entrar
            </Link>
          </div>
        </>
      )}
    </AuthCard>
  )
}

export default function RecuperarSenhaPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <RecuperarSenhaPageInner />
    </Suspense>
  )
}
