"use client"

import { Suspense, useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { brand } from "@/branding/brand"
import { login } from "@/lib/supabase/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex size-16 items-center justify-center overflow-hidden rounded-lg bg-card">
              <Image src={brand.logoUrl} alt={brand.appName} width={64} height={64} className="h-full w-full object-cover" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl">{brand.appName}</CardTitle>
              <CardDescription>Acesse o sistema com seu e-mail e senha.</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
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
                <div className="relative">
                  <Input
                    id="senha"
                    name="senha"
                    type={mostrarSenha ? "text" : "password"}
                    placeholder="********"
                    required
                    autoComplete="current-password"
                    disabled={isPending}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {erroVisivel ? (
                <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                  <p className="text-sm text-destructive">{erroVisivel}</p>
                </div>
              ) : null}

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
          </CardContent>
        </Card>

        <a
          href="https://www.prodexylabs.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          desenvolvido por <span className="font-semibold">Prodexy Labs</span>
        </a>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <LoginPageInner />
    </Suspense>
  )
}
