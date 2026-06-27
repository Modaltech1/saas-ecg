import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

export const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001"
export const DEFAULT_TENANT_SLUG = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "ecg"

export type TenantRole = "owner" | "admin" | "colaborador" | "professora"

export interface TenantContext {
  db: ReturnType<typeof createAdminClient>
  tenantId: string
  tenant: {
    id: string
    slug: string
    nome: string
    status: string
  }
  role: TenantRole
  userId: string
}

export class TenantAccessError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "TenantAccessError"
    this.status = status
  }
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function normalizeSlug(slug: string | null | undefined) {
  const value = slug?.trim().toLowerCase()
  return value || DEFAULT_TENANT_SLUG
}

function tenantSlugFromRequest(request?: NextRequest) {
  if (!request) return DEFAULT_TENANT_SLUG

  const explicitTenant =
    request.headers.get("x-prodexy-tenant") ??
    request.nextUrl.searchParams.get("tenant")

  if (explicitTenant) return normalizeSlug(explicitTenant)

  const host = request.headers.get("host")?.split(":")[0] ?? ""
  const parts = host.split(".").filter(Boolean)
  const isLocalhost = host === "localhost" || host === "127.0.0.1"

  if (!isLocalhost && parts.length > 2) {
    return normalizeSlug(parts[0])
  }

  return DEFAULT_TENANT_SLUG
}

export function tenantErrorResponse(error: unknown) {
  if (error instanceof TenantAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }

  console.error("[tenant]", error)
  return NextResponse.json({ error: "Erro ao resolver contexto da conta" }, { status: 500 })
}

export function withTenant<T extends Record<string, unknown>>(payload: T, tenantId: string) {
  return {
    ...payload,
    tenant_id: tenantId,
  }
}

export async function resolvePublicTenant(request?: NextRequest) {
  const db = createAdminClient()
  const slug = tenantSlugFromRequest(request)

  const { data, error } = await db
    .from("tenants")
    .select("id, slug, nome, status")
    .eq("slug", slug)
    .maybeSingle()

  if (error) {
    throw new TenantAccessError(500, error.message)
  }

  if (!data || data.status !== "ativo") {
    throw new TenantAccessError(404, "Conta nao encontrada ou inativa")
  }

  return {
    db,
    tenantId: data.id as string,
    tenant: data as TenantContext["tenant"],
  }
}

export async function requireTenantContext(
  allowedRoles: TenantRole[] = ["owner", "admin", "colaborador"],
): Promise<TenantContext> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new TenantAccessError(401, "Nao autorizado")
  }

  const db = createAdminClient()
  const { data, error } = await db
    .from("tenant_memberships")
    .select("tenant_id, role, is_default, tenants!inner(id, slug, nome, status)")
    .eq("user_id", user.id)
    .eq("status", "ativo")
    .order("is_default", { ascending: false })
    .order("criado_em", { ascending: true })
    .limit(1)

  if (error) {
    throw new TenantAccessError(500, error.message)
  }

  const membership = data?.[0] as
    | {
        tenant_id: string
        role: TenantRole
        tenants: TenantContext["tenant"] | TenantContext["tenant"][] | null
      }
    | undefined

  const tenant = one(membership?.tenants)

  if (!membership || !tenant || tenant.status !== "ativo") {
    throw new TenantAccessError(403, "Usuario sem conta ativa")
  }

  if (!allowedRoles.includes(membership.role)) {
    throw new TenantAccessError(403, "Sem permissao para esta conta")
  }

  return {
    db,
    tenantId: membership.tenant_id,
    tenant,
    role: membership.role,
    userId: user.id,
  }
}
