import type { CoraCredentials } from "@/lib/cora"
import { createAdminClient } from "@/lib/supabase/server"

type AdminDb = ReturnType<typeof createAdminClient>

export interface TenantCoraConfig {
  tenant_id: string
  ambiente: "producao" | "sandbox"
  ativo: boolean
  client_id: string | null
  private_key_pem: string | null
  certificate_pem: string | null
  webhook_url: string | null
  webhook_secret: string | null
}

export interface TenantCoraPublicConfig {
  cora_ambiente: "producao" | "sandbox"
  cora_ativo: boolean
  cora_webhook_url: string
  cora_client_id_configurado: boolean
  cora_private_key_configurada: boolean
  cora_certificate_configurado: boolean
}

function hasValue(value: string | null | undefined) {
  return Boolean(value && value.trim().length > 0)
}

export function toCoraPublicConfig(config: TenantCoraConfig | null): TenantCoraPublicConfig {
  return {
    cora_ambiente: config?.ambiente ?? "producao",
    cora_ativo: config?.ativo ?? false,
    cora_webhook_url: config?.webhook_url ?? "",
    cora_client_id_configurado: hasValue(config?.client_id),
    cora_private_key_configurada: hasValue(config?.private_key_pem),
    cora_certificate_configurado: hasValue(config?.certificate_pem),
  }
}

export function toCoraCredentials(config: TenantCoraConfig): CoraCredentials {
  if (!hasValue(config.client_id) || !hasValue(config.private_key_pem) || !hasValue(config.certificate_pem)) {
    throw new Error("Credenciais Cora incompletas para esta conta.")
  }

  return {
    tenantId: config.tenant_id,
    clientId: config.client_id!,
    privateKey: config.private_key_pem!,
    certificate: config.certificate_pem!,
    ambiente: config.ambiente,
  }
}

export async function getTenantCoraConfig(db: AdminDb, tenantId: string) {
  const { data, error } = await db
    .from("tenant_cora_configuracoes")
    .select("tenant_id, ambiente, ativo, client_id, private_key_pem, certificate_pem, webhook_url, webhook_secret")
    .eq("tenant_id", tenantId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? null) as TenantCoraConfig | null
}

export async function requireTenantCoraCredentials(db: AdminDb, tenantId: string) {
  const config = await getTenantCoraConfig(db, tenantId)

  if (!config || !config.ativo) {
    throw new Error("Integracao Cora inativa para esta conta.")
  }

  return toCoraCredentials(config)
}

export async function upsertTenantCoraConfig(
  db: AdminDb,
  tenantId: string,
  input: {
    cora_ambiente?: "producao" | "sandbox"
    cora_ativo?: boolean
    cora_client_id?: string
    cora_private_key?: string
    cora_certificate?: string
    cora_webhook_url?: string
  },
) {
  const current = await getTenantCoraConfig(db, tenantId)
  const payload: Record<string, unknown> = {
    tenant_id: tenantId,
    ambiente: input.cora_ambiente ?? current?.ambiente ?? "producao",
    ativo: input.cora_ativo ?? current?.ativo ?? false,
    webhook_url: input.cora_webhook_url ?? current?.webhook_url ?? null,
    atualizado_em: new Date().toISOString(),
  }

  if (input.cora_client_id !== undefined && input.cora_client_id.trim() !== "") {
    payload.client_id = input.cora_client_id.trim()
  } else if (current?.client_id) {
    payload.client_id = current.client_id
  }

  if (input.cora_private_key !== undefined && input.cora_private_key.trim() !== "") {
    payload.private_key_pem = input.cora_private_key.trim()
  } else if (current?.private_key_pem) {
    payload.private_key_pem = current.private_key_pem
  }

  if (input.cora_certificate !== undefined && input.cora_certificate.trim() !== "") {
    payload.certificate_pem = input.cora_certificate.trim()
  } else if (current?.certificate_pem) {
    payload.certificate_pem = current.certificate_pem
  }

  const { error } = await db
    .from("tenant_cora_configuracoes")
    .upsert(payload, { onConflict: "tenant_id" })

  if (error) {
    throw new Error(error.message)
  }
}
