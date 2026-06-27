export function normalizarSlugConta(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function isValidAccountSlug(value: string) {
  return value.length >= 3 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}

export function safeAccountNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/admin"
  return value
}
