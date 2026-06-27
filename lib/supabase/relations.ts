export function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export function many<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value
  return value ? [value] : []
}
