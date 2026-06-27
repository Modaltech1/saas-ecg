import { createClient } from "@/lib/supabase/server"
import { MobileHeaderServer } from "@/components/layout/mobile-header-server"
import { ProfessorasClient } from "./professoras-client"
import { one } from "@/lib/supabase/relations"

export default async function ProfessorasPage() {
  const supabase = await createClient()

  const { data: professoras } = await supabase
    .from("perfis")
    .select(`
      id,
      nome,
      email,
      ativo,
      criado_em,
      turmas_professoras (
        turma_id,
        tipo_pagamento,
        valor,
        turmas ( id, nome, nivel, polo_id, polos ( nome ) )
      )
    `)
    .eq("papel", "professora")
    .order("nome")

  const professorasNormalizadas = (professoras ?? []).map((professora: any) => ({
    ...professora,
    turmas_professoras: (professora.turmas_professoras ?? []).map((vinculo: any) => {
      const turma = one<any>(vinculo.turmas)

      return {
        ...vinculo,
        turmas: turma
          ? {
              ...turma,
              polos: one(turma.polos),
            }
          : null,
      }
    }),
  }))

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeaderServer title="Professoras" />
      <ProfessorasClient professoras={professorasNormalizadas} />
    </div>
  )
}
