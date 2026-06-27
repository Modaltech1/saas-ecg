import { type EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import { safeAccountNextPath } from "@/lib/account-onboarding"
import { createAdminClient, createClient } from "@/lib/supabase/server"

async function ativarContaSaas(userId: string, metadata: Record<string, unknown>) {
  if (metadata.onboarding_tipo !== "nova_conta_saas") return

  const tenantId = typeof metadata.tenant_id === "string" ? metadata.tenant_id : null
  if (!tenantId) return

  const db = createAdminClient()
  const confirmedAt = new Date().toISOString()

  const { data: tenant } = await db
    .from("tenants")
    .select("id, metadata")
    .eq("id", tenantId)
    .maybeSingle()

  const tenantMetadata =
    tenant && typeof tenant.metadata === "object" && tenant.metadata !== null
      ? tenant.metadata as Record<string, unknown>
      : {}

  await db
    .from("tenants")
    .update({
      status: "ativo",
      metadata: {
        ...tenantMetadata,
        onboarding_confirmado_em: confirmedAt,
      },
      atualizado_em: confirmedAt,
    })
    .eq("id", tenantId)
    .in("status", ["pendente_confirmacao", "ativo"])

  await Promise.all([
    db
      .from("perfis")
      .update({ ativo: true })
      .eq("id", userId)
      .eq("tenant_id", tenantId),
    db
      .from("tenant_memberships")
      .update({ status: "ativo", is_default: true, atualizado_em: confirmedAt })
      .eq("user_id", userId)
      .eq("tenant_id", tenantId),
    db
      .from("tenant_account_signups")
      .update({ status: "confirmado", confirmado_em: confirmedAt })
      .eq("user_id", userId)
      .eq("tenant_id", tenantId),
  ])
}

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl
  const tokenHash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null
  const code = requestUrl.searchParams.get("code")
  const nextPath = safeAccountNextPath(requestUrl.searchParams.get("next"))
  const supabase = await createClient()

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (error) {
      return NextResponse.redirect(new URL("/login?erro=confirmacao-email", requestUrl.origin))
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(new URL("/login?erro=confirmacao-email", requestUrl.origin))
    }
  } else {
    return NextResponse.redirect(new URL("/login?erro=link-invalido", requestUrl.origin))
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (user?.id && (user.email_confirmed_at || user.confirmed_at)) {
    await ativarContaSaas(user.id, user.user_metadata)
  }

  const redirectUrl = new URL(nextPath, requestUrl.origin)
  redirectUrl.searchParams.set("conta", "confirmada")
  return NextResponse.redirect(redirectUrl)
}
