import { createClient } from "@/lib/supabase/server"
import { MobileHeaderServer } from "@/components/layout/mobile-header-server"
import { BackButton } from "@/components/ui/back-button"
import { notFound } from "next/navigation"
import Link from "next/link"
import { GraduationCap, Users, Mail, MapPin } from "lucide-react"
import { many, one } from "@/lib/supabase/relations"

export default async function ProfessoraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: professora } = await supabase
    .from("perfis")
    .select(`
      id,
      nome,
      username,
      ativo,
      criado_em,
      turmas_professoras (
        turma_id,
        tipo_pagamento,
        valor,
        turmas (
          id,
          nome,
          nivel,
          polo_id,
          local_id,
          mensalidade,
          polos ( nome ),
          locais ( nome ),
          alunas ( id, nome, status )
        )
      )
    `)
    .eq("id", id)
    .eq("papel", "professora")
    .single()

  if (!professora) notFound()

  const turmas = ((professora as any).turmas_professoras ?? [])
    .map((tp: any) => {
      const turma = one<any>(tp.turmas)
      if (!turma) return null

      return {
        ...turma,
        polos: one(turma.polos),
        locais: one(turma.locais),
        alunas: many(turma.alunas),
        tipo_pagamento: tp.tipo_pagamento,
        valor_remuneracao: tp.valor,
      }
    })
    .filter(Boolean)

  const totalAlunas = turmas.reduce((acc: number, t: any) => acc + (t?.alunas?.length ?? 0), 0)

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeaderServer title={professora.nome} />

      <main className="px-4 pb-6 space-y-6">
        <div className="pt-4">
          <BackButton />
        </div>

        {/* Info da professora */}
        <section className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
              {professora.nome.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-xl text-foreground">{professora.nome}</h2>
              {professora.username && (
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-mono">
                    @{professora.username}
                  </span>
                </div>
              )}
              <span
                className={`inline-block mt-1.5 px-2 py-0.5 text-xs font-medium rounded-full ${
                  professora.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {professora.ativo ? "Ativa" : "Inativa"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Turmas</p>
              </div>
              <p className="text-lg font-bold text-foreground">{turmas.length}</p>
            </div>

            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Alunas</p>
              </div>
              <p className="text-lg font-bold text-foreground">{totalAlunas}</p>
            </div>
          </div>
        </section>

        {/* Turmas */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-foreground">Turmas</h3>

          {turmas.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-lg border border-border">
              <GraduationCap className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma turma atribuída</p>
            </div>
          ) : (
            <div className="space-y-2">
              {turmas.map((turma: any) => {
                if (!turma) return null
                const alunas = turma.alunas ?? []
                const poloNome = (turma as any).polos?.nome
                const localNome = (turma as any).locais?.nome

                return (
                  <Link
                    key={turma.id}
                    href={`/admin/turmas/${turma.id}`}
                    className="block bg-card rounded-lg p-4 border border-border hover:bg-muted/60 transition-shadow"
                  >
                    <h4 className="font-semibold text-foreground mb-1">{turma.nome}</h4>
                    {(poloNome || localNome) && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3" />
                        {[poloNome, localNome].filter(Boolean).join(" • ")}
                      </p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        {alunas.length} alunas
                      </span>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        {turma.nivel}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                        {turma.tipo_pagamento === "percentual"
                          ? `${turma.valor_remuneracao}% receita`
                          : `R$ ${Number(turma.valor_remuneracao).toFixed(2)} fixo`}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
