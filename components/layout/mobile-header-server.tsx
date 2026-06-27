import { createClient } from "@/lib/supabase/server"
import { MobileHeader } from "./mobile-header"

interface MobileHeaderServerProps {
  title: string
}

export async function MobileHeaderServer({ title }: MobileHeaderServerProps) {
  const supabase = await createClient()

  // getUser() valida o token — sem user_metadata para autorização
  const { data: { user } } = await supabase.auth.getUser()

  let userName = "Usuário"
  let userPapel: "admin" | "professora" = "professora"

  if (user) {
    // Perfil vem do banco — fonte de verdade
    const { data: perfil } = await supabase
      .from("perfis")
      .select("nome, papel")
      .eq("id", user.id)
      .single()

    if (perfil) {
      userName = perfil.nome
      userPapel = perfil.papel as "admin" | "professora"
    }
  }

  return <MobileHeader title={title} userName={userName} userPapel={userPapel} />
}
