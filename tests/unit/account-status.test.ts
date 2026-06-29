import { describe, expect, it } from "vitest"
import {
  accountStatusPath,
  isOnboardingComplete,
  shouldShowInitialOnboarding,
} from "@/lib/account-status"

describe("accountStatusPath", () => {
  it("maps pending, suspended and canceled accounts to friendly pages", () => {
    expect(accountStatusPath("pendente_confirmacao")).toBe("/conta-pendente")
    expect(accountStatusPath("suspenso")).toBe("/conta-suspensa?status=suspenso")
    expect(accountStatusPath("cancelado")).toBe("/conta-suspensa?status=cancelado")
  })

  it("does not redirect active or unknown account statuses", () => {
    expect(accountStatusPath("ativo")).toBeNull()
    expect(accountStatusPath("outro")).toBeNull()
    expect(accountStatusPath(null)).toBeNull()
  })
})

describe("isOnboardingComplete", () => {
  it("requires a completion timestamp in tenant metadata", () => {
    expect(isOnboardingComplete({ onboarding_inicial_concluido_em: "2026-06-29T12:00:00.000Z" })).toBe(true)
    expect(isOnboardingComplete({ onboarding_inicial_concluido_em: "" })).toBe(false)
    expect(isOnboardingComplete(null)).toBe(false)
  })
})

describe("shouldShowInitialOnboarding", () => {
  it("shows onboarding for active admin accounts without completion metadata", () => {
    expect(shouldShowInitialOnboarding({
      pathname: "/admin",
      role: "owner",
      tenantStatus: "ativo",
      tenantMetadata: {},
    })).toBe(true)
  })

  it("does not show onboarding on setup pages or for non-admin roles", () => {
    expect(shouldShowInitialOnboarding({
      pathname: "/admin/onboarding",
      role: "owner",
      tenantStatus: "ativo",
      tenantMetadata: {},
    })).toBe(false)

    expect(shouldShowInitialOnboarding({
      pathname: "/admin",
      role: "professora",
      tenantStatus: "ativo",
      tenantMetadata: {},
    })).toBe(false)
  })
})
