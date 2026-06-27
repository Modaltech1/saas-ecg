import type { User } from "@supabase/supabase-js"

type AdminDb = {
  from: (table: string) => any
}

function stringMeta(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key]
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function perfilPapel(metadata: Record<string, unknown>) {
  const papel = stringMeta(metadata, "papel")
  return papel === "professora" || papel === "colaborador" ? papel : "admin"
}

function membershipRole(papel: string) {
  if (papel === "professora") return "professora"
  if (papel === "colaborador") return "colaborador"
  return "owner"
}

async function resolveSignupTenant(db: AdminDb, user: User) {
  const { data } = await db
    .from("tenant_account_signups")
    .select("tenant_id, nome_responsavel, nome_escolinha, email")
    .or(`user_id.eq.${user.id},email.eq.${user.email ?? ""}`)
    .order("criado_em", { ascending: false })
    .limit(1)

  return data?.[0] as
    | {
        tenant_id: string
        nome_responsavel: string | null
        nome_escolinha: string | null
        email: string
      }
    | undefined
}

export async function ensureSaasAccountActivated(db: AdminDb, user: User) {
  const metadata = user.user_metadata ?? {}
  const isSaasSignup = stringMeta(metadata, "onboarding_tipo") === "nova_conta_saas"

  let tenantId = stringMeta(metadata, "tenant_id")
  let nome = stringMeta(metadata, "nome") ?? user.email ?? "Usuario"
  const papel = perfilPapel(metadata)
  const role = membershipRole(papel)
  const emailConfirmed = Boolean(user.email_confirmed_at || user.confirmed_at)

  let signup: Awaited<ReturnType<typeof resolveSignupTenant>> | undefined

  if (!tenantId || isSaasSignup) {
    try {
      signup = await resolveSignupTenant(db, user)
    } catch {
      signup = undefined
    }

    tenantId = tenantId ?? signup?.tenant_id ?? null
    nome = nome || signup?.nome_responsavel || user.email || "Usuario"
  }

  if (!tenantId) return { activated: false, reason: "missing-tenant" as const }

  const now = new Date().toISOString()

  await db
    .from("perfis")
    .upsert({
      id: user.id,
      tenant_id: tenantId,
      nome,
      papel,
      email: user.email,
      ativo: emailConfirmed,
    })

  await db
    .from("tenant_memberships")
    .upsert({
      tenant_id: tenantId,
      user_id: user.id,
      role,
      status: emailConfirmed ? "ativo" : "convidado",
      is_default: true,
      atualizado_em: now,
    })

  if (emailConfirmed) {
    const { data: tenant } = await db
      .from("tenants")
      .select("id, metadata")
      .eq("id", tenantId)
      .maybeSingle()

    const tenantMetadata =
      tenant && typeof tenant.metadata === "object" && tenant.metadata !== null
        ? tenant.metadata as Record<string, unknown>
        : {}

    await db
      .from("tenants")
      .update({
        status: "ativo",
        metadata: {
          ...tenantMetadata,
          onboarding_confirmado_em: tenantMetadata.onboarding_confirmado_em ?? now,
        },
        atualizado_em: now,
      })
      .eq("id", tenantId)
      .in("status", ["pendente_confirmacao", "ativo"])

    try {
      await db
        .from("tenant_account_signups")
        .update({ status: "confirmado", confirmado_em: now })
        .eq("user_id", user.id)
        .eq("tenant_id", tenantId)
    } catch {
      // A tabela existe apos a migration 0003; ignorar aqui permite que o login
      // continue funcionando caso o ambiente ainda esteja parcialmente migrado.
    }
  }

  return { activated: emailConfirmed, tenantId }
}
