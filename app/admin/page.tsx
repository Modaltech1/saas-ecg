"use client"

import Link from "next/link"
import useSWR from "swr"
import {
  AlertCircle,
  Building2,
  CalendarDays,
  DollarSign,
  GraduationCap,
  Loader2,
  MapPin,
  MapPinned,
  Settings,
  ShoppingBag,
  TrendingUp,
  UserCog,
  UserRoundCheck,
  Users,
} from "lucide-react"
import { MobileHeader } from "@/components/layout/mobile-header"
import { MetricCard } from "@/components/shared/metric-card"
import { PageHeader } from "@/components/shared/page-header"
import { Section } from "@/components/shared/section"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((response) => response.json())

const quickLinks = [
  { label: "Polos", href: "/admin/polos", icon: MapPinned, description: "Unidades macro" },
  { label: "Locais", href: "/admin/locais", icon: MapPin, description: "Espacos de aula" },
  { label: "Turmas", href: "/admin/turmas", icon: GraduationCap, description: "Grupos e niveis" },
  { label: "Alunas", href: "/admin/alunas", icon: Users, description: "Cadastro e status" },
  { label: "Professoras", href: "/admin/professoras", icon: UserRoundCheck, description: "Equipe docente" },
  { label: "Financeiro", href: "/admin/financeiro", icon: DollarSign, description: "Receitas e custos" },
  { label: "Cobrancas", href: "/admin/cobrancas", icon: AlertCircle, description: "Pendencias" },
  { label: "Produtos", href: "/admin/produtos", icon: ShoppingBag, description: "Vitrine e loja" },
  { label: "Eventos", href: "/admin/eventos", icon: CalendarDays, description: "Inscricoes" },
  { label: "Instituicao", href: "/admin/conta", icon: Building2, description: "Dados e seguranca" },
  { label: "Acessos", href: "/admin/usuarios", icon: UserCog, description: "Usuarios" },
  { label: "Configuracoes", href: "/admin/configuracoes", icon: Settings, description: "Integracoes" },
]

export default function AdminDashboard() {
  const { data, isLoading } = useSWR("/api/admin/stats", fetcher)

  const totalAlunas = data?.totalAlunas ?? 0
  const totalProfessoras = data?.totalProfessoras ?? 0
  const totalPolos = data?.totalPolos ?? 0
  const totalLocais = data?.totalLocais ?? 0
  const totalPendente = data?.totalPendente ?? 0
  const alunasPendentes = data?.alunasPendentes ?? 0

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeader title="Painel administrativo" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
        <PageHeader title="Painel administrativo" description="Visao geral operacional e financeira da instituicao." />

        {isLoading ? (
          <Card>
            <CardContent className="flex min-h-40 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Alunas ativas" value={totalAlunas} icon={Users} />
              <MetricCard title="Professoras" value={totalProfessoras} icon={GraduationCap} />
              <MetricCard title="Polos" value={totalPolos} icon={MapPinned} tone="blue" />
              <MetricCard title="Locais" value={totalLocais} icon={MapPin} />
            </div>

            <Section title="Financeiro" description="Pendencias em aberto e concentracao de atrasos.">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total pendente</p>
                  <p className="text-3xl font-bold leading-tight">{formatCurrency(totalPendente)}</p>
                </div>
                <div className="text-left lg:text-right">
                  <p className="text-sm text-muted-foreground">Alunas com atraso</p>
                  <p className="text-3xl font-bold leading-tight text-[color:var(--warning)]">{alunasPendentes}</p>
                </div>
              </div>

              {alunasPendentes > 0 ? (
                <Button asChild variant="outline" className="mt-5 w-full border-[color:var(--warning)]/40 bg-accent text-accent-foreground hover:bg-accent/80">
                  <Link href="/admin/cobrancas">
                    <AlertCircle className="size-4" />
                    Ver cobrancas pendentes
                  </Link>
                </Button>
              ) : null}
            </Section>

            <Section title="Acesso rapido" description="Atalhos para os principais modulos operacionais.">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {quickLinks.map(({ href, label, icon: Icon, description }) => (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-lg border bg-background p-4 transition-colors hover:bg-muted/60"
                  >
                    <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <p className="font-semibold leading-tight">{label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                  </Link>
                ))}
              </div>
            </Section>

            <Section title="Leitura executiva" description="Resumo de saude operacional para priorizacao.">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg bg-muted/50 p-4">
                  <TrendingUp className="mb-3 size-5 text-primary" />
                  <p className="font-semibold">Crescimento</p>
                  <p className="mt-1 text-sm text-muted-foreground">Acompanhe alunas, turmas e receita antes de expandir para SaaS.</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <AlertCircle className="mb-3 size-5 text-[color:var(--warning)]" />
                  <p className="font-semibold">Risco financeiro</p>
                  <p className="mt-1 text-sm text-muted-foreground">Pendencias e cobrancas devem virar indicadores auditaveis por instituicao.</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <Settings className="mb-3 size-5 text-muted-foreground" />
                  <p className="font-semibold">Configuracao</p>
                  <p className="mt-1 text-sm text-muted-foreground">Dados da instituicao, planos e permissoes entram como proximas camadas de produto.</p>
                </div>
              </div>
            </Section>
          </>
        )}
      </main>
    </div>
  )
}
