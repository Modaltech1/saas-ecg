"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Building2, CheckCircle2, Loader2, MapPin, Settings, Users } from "lucide-react"
import { concluirOnboardingInicial } from "@/lib/supabase/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type OnboardingClientProps = {
  instituicaoNome: string
  stats: {
    polos: number
    locais: number
    turmas: number
    usuarios: number
  }
}

const steps = [
  {
    title: "Dados da instituicao",
    description: "Revise nome, responsavel, WhatsApp e dados de contato.",
    href: "/admin/conta",
    icon: Building2,
  },
  {
    title: "Estrutura operacional",
    description: "Crie polos, locais e turmas para organizar a rotina.",
    href: "/admin/polos",
    icon: MapPin,
  },
  {
    title: "Acessos da equipe",
    description: "Cadastre administradores, colaboradores e professoras.",
    href: "/admin/usuarios",
    icon: Users,
  },
  {
    title: "Configuracoes",
    description: "Prepare integracoes e parametros antes de operar financeiro.",
    href: "/admin/configuracoes",
    icon: Settings,
  },
]

const objetivos = [
  "Organizar matriculas e turmas",
  "Controlar mensalidades e cobrancas",
  "Gerenciar professoras e chamadas",
  "Preparar vendas, eventos e produtos",
]

export function OnboardingClient({ instituicaoNome, stats }: OnboardingClientProps) {
  const router = useRouter()
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setErro(null)

    startTransition(async () => {
      const result = await concluirOnboardingInicial(formData)

      if (result?.erro) {
        setErro(result.erro)
        return
      }

      router.push("/admin")
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo a {instituicaoNome}</CardTitle>
          <CardDescription>
            Este primeiro passo ajuda a deixar a instituicao pronta para operar com seguranca.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-2xl font-bold">{stats.polos}</p>
              <p className="text-xs text-muted-foreground">Polos</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-2xl font-bold">{stats.locais}</p>
              <p className="text-xs text-muted-foreground">Locais</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-2xl font-bold">{stats.turmas}</p>
              <p className="text-xs text-muted-foreground">Turmas</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-2xl font-bold">{stats.usuarios}</p>
              <p className="text-xs text-muted-foreground">Acessos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {steps.map(({ title, description, href, icon: Icon }) => (
          <Link key={href} href={href} className="rounded-lg border bg-background p-4 transition-colors hover:bg-muted/60">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
              <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Concluir primeira entrada</CardTitle>
          <CardDescription>
            Marque os objetivos principais e abra o painel administrativo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {objetivos.map((objetivo) => (
                <label key={objetivo} className="flex gap-3 rounded-lg border bg-background p-3 text-sm">
                  <input name="objetivos" value={objetivo} type="checkbox" className="mt-1 size-4" disabled={isPending} />
                  <span className="text-muted-foreground">{objetivo}</span>
                </label>
              ))}
            </div>

            {erro ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {erro}
              </div>
            ) : null}

            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Concluir e abrir painel
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
