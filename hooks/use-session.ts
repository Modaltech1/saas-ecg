"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface SessionInfo {
  userName: string
  userPapel: "admin" | "professora"
  tenantId: string | null
  loading: boolean
}

export function useSession(): SessionInfo {
  const [info, setInfo] = useState<SessionInfo>({
    userName: "Usuario",
    userPapel: "professora",
    tenantId: null,
    loading: true,
  })

  useEffect(() => {
    const supabase = createClient()

    async function fetchSession() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setInfo({ userName: "Usuario", userPapel: "professora", tenantId: null, loading: false })
        return
      }

      const [{ data: perfil }, { data: memberships }] = await Promise.all([
        supabase
          .from("perfis")
          .select("nome, papel, tenant_id")
          .eq("id", user.id)
          .single(),
        supabase
          .from("tenant_memberships")
          .select("tenant_id, role")
          .eq("user_id", user.id)
          .eq("status", "ativo")
          .limit(1),
      ])

      if (perfil) {
        const role = memberships?.[0]?.role as string | undefined
        setInfo({
          userName: perfil.nome,
          userPapel: role === "professora" || perfil.papel === "professora" ? "professora" : "admin",
          tenantId: memberships?.[0]?.tenant_id ?? perfil.tenant_id ?? null,
          loading: false,
        })
      } else {
        setInfo({ userName: "Usuario", userPapel: "professora", tenantId: null, loading: false })
      }
    }

    fetchSession()
  }, [])

  return info
}
