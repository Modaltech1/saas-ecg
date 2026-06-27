import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { calculateAge, formatCurrency, formatDate } from "@/lib/utils"

describe("formatCurrency", () => {
  it("formats Brazilian currency", () => {
    expect(formatCurrency(1234.5).replace(/\s/u, " ")).toBe("R$ 1.234,50")
  })
})

describe("formatDate", () => {
  it("formats ISO dates as pt-BR dates", () => {
    expect(formatDate("2026-06-24T12:00:00")).toBe("24/06/2026")
  })
})

describe("calculateAge", () => {
  beforeAll(() => {
    vi.setSystemTime(new Date("2026-06-24T12:00:00"))
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it("calculates age after the birthday in the current year", () => {
    expect(calculateAge("2016-06-23T12:00:00")).toBe(10)
  })

  it("calculates age before the birthday in the current year", () => {
    expect(calculateAge("2016-06-25T12:00:00")).toBe(9)
  })
})
