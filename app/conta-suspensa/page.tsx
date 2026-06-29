"use client"

import Link from "next/link"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { LockKeyhole } from "lucide-react"
import { AuthCard } from "@/components/shared/auth-card"
import { Button } from "@/components/ui/button"

function ContaSuspensaInner() {
  const searchParams = useSearchParams()
  const status = searchParams.get("status")
  const isCancelada = status === "cancelado"

  return (
    <AuthCard
      title={isCancelada ? "Instituicao cancelada" : "Instituicao suspensa"}
      description="O acesso administrativo esta temporariamente indisponivel."
    >
      <div className="space-y-5 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <LockKeyhole className="size-7" />
        </div>

        <div className="rounded-lg border bg-background px-4 py-3 text-left text-sm">
          <p className="font-semibold text-foreground">
            {isCancelada ? "Instituicao cancelada" : "Acesso suspenso"}
          </p>
          <p className="mt-1 text-muted-foreground">
            {isCancelada
              ? "Esta instituicao nao esta mais ativa na plataforma."
              : "Esta instituicao esta com o acesso bloqueado ate regularizacao."}
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          Se voce acredita que isso e um erro, fale com o suporte responsavel pela sua instituicao.
        </p>

        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Voltar para login</Link>
        </Button>
      </div>
    </AuthCard>
  )
}

export default function ContaSuspensaPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <ContaSuspensaInner />
    </Suspense>
  )
}
