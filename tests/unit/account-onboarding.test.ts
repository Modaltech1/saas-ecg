import { describe, expect, it } from "vitest"
import { isValidAccountSlug, normalizarSlugConta, safeAccountNextPath } from "@/lib/account-onboarding"

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
  })

  it("blocks external redirects", () => {
    expect(safeAccountNextPath("https://evil.test")).toBe("/admin")
    expect(safeAccountNextPath("//evil.test")).toBe("/admin")
  })
})
