export type TenantStatus = "pendente_confirmacao" | "ativo" | "suspenso" | "cancelado"
export type TenantRole = "owner" | "admin" | "colaborador" | "professora"

export function normalizeTenantStatus(value: string | null | undefined): TenantStatus | null {
  if (
    value === "pendente_confirmacao" ||
    value === "ativo" ||
    value === "suspenso" ||
    value === "cancelado"
  ) {
    return value
  }

  return null
}

export function accountStatusPath(status: string | null | undefined) {
  const normalized = normalizeTenantStatus(status)

  if (normalized === "pendente_confirmacao") return "/conta-pendente"
  if (normalized === "suspenso") return "/conta-suspensa?status=suspenso"
  if (normalized === "cancelado") return "/conta-suspensa?status=cancelado"

  return null
}

export function isAdministrativeRole(role: string | null | undefined) {
  return role === "owner" || role === "admin" || role === "colaborador"
}

export function isOnboardingComplete(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return false

  const value = (metadata as Record<string, unknown>).onboarding_inicial_concluido_em
  return typeof value === "string" && value.trim().length > 0
}

export function shouldShowInitialOnboarding(input: {
  pathname: string
  role: string | null | undefined
  tenantStatus: string | null | undefined
  tenantMetadata: unknown
}) {
  if (input.pathname !== "/admin") return false
  if (!isAdministrativeRole(input.role)) return false
  if (normalizeTenantStatus(input.tenantStatus) !== "ativo") return false

  return !isOnboardingComplete(input.tenantMetadata)
}
