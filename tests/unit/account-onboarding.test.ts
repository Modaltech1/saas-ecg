import { describe, expect, it } from "vitest"
import {
  authConfirmErrorPath,
  isValidAccountSlug,
  normalizarSlugConta,
  safeAccountNextPath,
} from "@/lib/account-onboarding"

describe("normalizarSlugConta", () => {
  it("normalizes account names into SaaS-safe slugs", () => {
    expect(normalizarSlugConta(" Escolinha São João 2026! ")).toBe("escolinha-sao-joao-2026")
  })

  it("collapses duplicate separators", () => {
    expect(normalizarSlugConta("Minha---Escola___Teste")).toBe("minha-escola-teste")
  })
})

describe("isValidAccountSlug", () => {
  it("accepts lowercase letters, numbers and internal hyphens", () => {
    expect(isValidAccountSlug("escola-123")).toBe(true)
  })

  it("rejects unsafe or too short slugs", () => {
    expect(isValidAccountSlug("ab")).toBe(false)
    expect(isValidAccountSlug("-escola")).toBe(false)
    expect(isValidAccountSlug("escola_abc")).toBe(false)
  })
})

describe("safeAccountNextPath", () => {
  it("keeps local paths", () => {
    expect(safeAccountNextPath("/admin")).toBe("/admin")
    expect(safeAccountNextPath("/redefinir-senha")).toBe("/redefinir-senha")
  })

  it("blocks external redirects", () => {
    expect(safeAccountNextPath("https://evil.test")).toBe("/admin")
    expect(safeAccountNextPath("//evil.test")).toBe("/admin")
  })
})

describe("authConfirmErrorPath", () => {
  it("routes password recovery failures back to password recovery", () => {
    expect(authConfirmErrorPath("/redefinir-senha")).toBe("/recuperar-senha?erro=link-invalido")
  })

  it("routes signup confirmation failures to a friendly confirmation page", () => {
    expect(authConfirmErrorPath("/admin")).toBe("/confirmacao-email?erro=link-invalido")
  })
})
