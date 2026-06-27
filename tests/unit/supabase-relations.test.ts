import { describe, expect, it } from "vitest"
import { many, one } from "@/lib/supabase/relations"

describe("one", () => {
  it("returns the first item when Supabase returns a relation array", () => {
    expect(one([{ id: "a" }, { id: "b" }])).toEqual({ id: "a" })
  })

  it("returns null for empty or missing relations", () => {
    expect(one([])).toBeNull()
    expect(one(null)).toBeNull()
    expect(one(undefined)).toBeNull()
  })
})

describe("many", () => {
  it("normalizes a single relation object into a list", () => {
    expect(many({ id: "a" })).toEqual([{ id: "a" }])
  })

  it("keeps arrays as arrays", () => {
    expect(many([{ id: "a" }])).toEqual([{ id: "a" }])
  })
})
