import { redirect } from "next/navigation"
import { MobileHeaderServer } from "@/components/layout/mobile-header-server"
import { PageHeader } from "@/components/shared/page-header"
import { isOnboardingComplete } from "@/lib/account-status"
import { requireTenantContext } from "@/lib/tenant"
import { OnboardingClient } from "./onboarding-client"

export default async function AdminOnboardingPage() {
  let ctx
  try {
    ctx = await requireTenantContext(["owner", "admin", "colaborador"])
  } catch {
    redirect("/login")
  }

  const { db, tenantId, tenant } = ctx

  const [{ data: conta }, { count: polos }, { count: locais }, { count: turmas }, { count: usuarios }] = await Promise.all([
    db
      .from("tenants")
      .select("nome, metadata")
      .eq("id", tenantId)
      .maybeSingle(),
    db
      .from("polos")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    db
      .from("locais")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    db
      .from("turmas")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    db
      .from("tenant_memberships")
      .select("user_id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
  ])

  if (isOnboardingComplete(conta?.metadata)) {
    redirect("/admin")
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeaderServer title="Primeiros passos" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
        <PageHeader
          title="Primeiros passos"
          description="Configure a base da instituicao antes de escalar a operacao."
        />

        <OnboardingClient
          instituicaoNome={conta?.nome ?? tenant.nome}
          stats={{
            polos: polos ?? 0,
            locais: locais ?? 0,
            turmas: turmas ?? 0,
            usuarios: usuarios ?? 0,
          }}
        />
      </main>
    </div>
  )
}
