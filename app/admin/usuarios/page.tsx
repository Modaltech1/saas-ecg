import { redirect } from "next/navigation"
import { MobileHeaderServer } from "@/components/layout/mobile-header-server"
import { requireTenantContext } from "@/lib/tenant"
import { UsuariosClient } from "./usuarios-client"

export default async function UsuariosPage() {
  let ctx
  try {
    ctx = await requireTenantContext(["owner", "admin"])
  } catch {
    redirect("/login")
  }

  const { db, tenantId, tenant, role } = ctx
  const { data: memberships } = await db
    .from("tenant_memberships")
    .select("user_id, role, status, is_default, criado_em")
    .eq("tenant_id", tenantId)
    .order("criado_em", { ascending: true })

  const userIds = (memberships ?? []).map((m) => m.user_id)
  const { data: perfis } = userIds.length > 0
    ? await db
        .from("perfis")
        .select("id, nome, email, papel, ativo")
        .eq("tenant_id", tenantId)
        .in("id", userIds)
    : { data: [] }

  const perfisMap = new Map((perfis ?? []).map((perfil) => [perfil.id, perfil]))
  const usuarios = (memberships ?? []).map((membership) => ({
    ...membership,
    perfil: perfisMap.get(membership.user_id) ?? null,
  }))

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeaderServer title="Usuarios" />
      <UsuariosClient tenant={tenant} currentRole={role} usuarios={usuarios} />
    </div>
  )
}
