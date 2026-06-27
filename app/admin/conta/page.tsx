import { redirect } from "next/navigation"
import { Building2, ShieldCheck, Users } from "lucide-react"
import { MobileHeaderServer } from "@/components/layout/mobile-header-server"
import { MetricCard } from "@/components/shared/metric-card"
import { requireTenantContext } from "@/lib/tenant"
import { ContaClient } from "./conta-client"

type TenantMetadata = {
  responsavel?: string
  email_contato?: string
  telefone?: string
  whatsapp?: string
  documento?: string
  site?: string
  endereco?: string
  cidade?: string
  estado?: string
}

function metadataValue(metadata: unknown, key: keyof TenantMetadata) {
  if (!metadata || typeof metadata !== "object") return ""
  const value = (metadata as TenantMetadata)[key]
  return typeof value === "string" ? value : ""
}

export default async function ContaPage() {
  let ctx
  try {
    ctx = await requireTenantContext(["owner", "admin"])
  } catch {
    redirect("/login")
  }

  const { db, tenantId } = ctx

  const [{ data: conta }, { data: config }, { count: usuariosCount }] = await Promise.all([
    db
      .from("tenants")
      .select("id, slug, nome, status, plano, metadata, criado_em")
      .eq("id", tenantId)
      .maybeSingle(),
    db
      .from("configuracoes")
      .select("whatsapp_admin")
      .eq("tenant_id", tenantId)
      .eq("id", 1)
      .maybeSingle(),
    db
      .from("tenant_memberships")
      .select("user_id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
  ])

  if (!conta) {
    redirect("/login")
  }

  const initialData = {
    nome: conta.nome ?? "",
    slug: conta.slug ?? "",
    status: conta.status ?? "",
    plano: conta.plano ?? "",
    responsavel: metadataValue(conta.metadata, "responsavel"),
    email_contato: metadataValue(conta.metadata, "email_contato"),
    telefone: metadataValue(conta.metadata, "telefone"),
    whatsapp: metadataValue(conta.metadata, "whatsapp") || config?.whatsapp_admin || "",
    documento: metadataValue(conta.metadata, "documento"),
    site: metadataValue(conta.metadata, "site"),
    endereco: metadataValue(conta.metadata, "endereco"),
    cidade: metadataValue(conta.metadata, "cidade"),
    estado: metadataValue(conta.metadata, "estado"),
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <MobileHeaderServer title="Conta" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard title="Status" value={initialData.status || "ativo"} icon={ShieldCheck} tone="success" />
          <MetricCard title="Acessos" value={usuariosCount ?? 0} icon={Users} />
          <MetricCard title="Plano" value={initialData.plano || "Nao definido"} icon={Building2} />
        </div>

        <ContaClient initialData={initialData} />
      </main>
    </div>
  )
}
