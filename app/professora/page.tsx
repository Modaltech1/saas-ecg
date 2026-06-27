import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronRight, ClipboardList, GraduationCap, Users } from "lucide-react"
import { MobileHeaderServer } from "@/components/layout/mobile-header-server"
import { MetricCard } from "@/components/shared/metric-card"
import { Section } from "@/components/shared/section"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function ProfessoraDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome, papel, ativo")
    .eq("id", user.id)
    .single()

  if (!perfil || perfil.papel !== "professora" || !perfil.ativo) {
    redirect("/login")
  }

  const { data: turmasProfessora } = await supabase
    .from("turmas_professoras")
    .select("turma_id")
    .eq("professora_id", user.id)

  const turmaIds = (turmasProfessora ?? []).map((tp) => tp.turma_id).filter(Boolean)

  let turmas: any[] = []
  let totalAlunas = 0

  if (turmaIds.length > 0) {
    const { data: turmasData } = await supabase
      .from("turmas")
      .select("id, nome, nivel")
      .in("id", turmaIds)
      .eq("ativo", true)

    turmas = turmasData ?? []

    const { data: alunasData } = await supabase
      .from("alunas")
      .select("turma_id")
      .in("turma_id", turmaIds)
      .eq("status", "Ativa")

    totalAlunas = (alunasData ?? []).length
  }

  const diasSemana = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"]
  const hoje = diasSemana[new Date().getDay()]

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeaderServer title="Dashboard" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
        <Card className="overflow-hidden border-primary/20 bg-primary text-primary-foreground">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-primary-foreground/75">Bem-vinda de volta</p>
            <h2 className="mt-1 text-2xl font-bold">{perfil.nome}</h2>
            <p className="mt-1 text-sm text-primary-foreground/75">
              {hoje},{" "}
              {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard title="Minhas turmas" value={turmas.length} icon={GraduationCap} />
          <MetricCard title="Minhas alunas" value={totalAlunas} icon={Users} tone="blue" />
        </div>

        <Link
          href="/professora/chamadas"
          className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardList className="size-5" />
            </div>
            <div>
              <p className="font-semibold">Chamadas de hoje</p>
              <p className="text-sm text-muted-foreground">Registrar presenca das alunas</p>
            </div>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>

        <Section
          title="Minhas turmas"
          description="Turmas ativas vinculadas ao seu perfil."
          action={
            <Link href="/professora/turmas" className="text-sm font-medium text-primary hover:underline">
              Ver todas
            </Link>
          }
        >
          <div className="space-y-2">
            {turmas.map((turma) => (
              <Link
                key={turma.id}
                href={`/professora/turmas/${turma.id}`}
                className="flex items-center justify-between rounded-lg border bg-background p-4 transition-colors hover:bg-muted/60"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{turma.nome}</h3>
                  <p className="text-sm text-muted-foreground">{turma.nivel}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            ))}

            {turmas.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma turma atribuida ainda.</p>
            ) : null}
          </div>
        </Section>
      </main>
    </div>
  )
}
