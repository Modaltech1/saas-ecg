"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { MailCheck } from "lucide-react"
import { reenviarConfirmacaoEmail } from "@/lib/supabase/actions"
import { AuthCard, AuthError } from "@/components/shared/auth-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ReenviarConfirmacaoPage() {
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setErro(null)
    setSucesso(null)

    startTransition(async () => {
      const result = await reenviarConfirmacaoEmail(formData)

      if (result?.erro) {
        setErro(result.erro)
        return
      }

      setSucesso("Se a conta estiver pendente, enviaremos um novo link de confirmacao.")
    })
  }

  return (
    <AuthCard title="Confirmar e-mail" description="Receba um novo link para ativar o acesso da sua conta.">
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

            {erro ? <AuthError>{erro}</AuthError> : null}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Enviando..." : "Reenviar confirmacao"}
            </Button>
          </form>

          <div className="mt-5 border-t pt-4 text-center text-sm text-muted-foreground">
            <span>Ja confirmou? </span>
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Entrar
            </Link>
          </div>
        </>
      )}
    </AuthCard>
  )
}
