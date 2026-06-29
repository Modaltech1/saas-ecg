"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { CheckCircle } from "lucide-react"
import { redefinirSenha } from "@/lib/supabase/actions"
import { AuthCard, AuthError } from "@/components/shared/auth-card"
import { PasswordInput } from "@/components/shared/password-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function RedefinirSenhaPage() {
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setErro(null)

    startTransition(async () => {
      const result = await redefinirSenha(formData)

      if (result?.erro) {
        setErro(result.erro)
        return
      }

      setSucesso(true)
    })
  }

  return (
    <AuthCard title="Redefinir senha" description="Crie uma nova senha para acessar sua conta.">
      {sucesso ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle className="size-7" />
          </div>
          <p className="text-sm text-muted-foreground">
            Sua senha foi atualizada. Entre novamente para continuar.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">Entrar</Link>
          </Button>
        </div>
      ) : (
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senha">Nova senha</Label>
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
            <Label htmlFor="confirmar_senha">Confirmar nova senha</Label>
            <PasswordInput
              id="confirmar_senha"
              name="confirmar_senha"
              visible={mostrarSenha}
              onToggleVisible={() => setMostrarSenha((value) => !value)}
              minLength={8}
              placeholder="Repita a nova senha"
              required
              disabled={isPending}
            />
          </div>

          {erro ? <AuthError>{erro}</AuthError> : null}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Atualizando..." : "Atualizar senha"}
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
