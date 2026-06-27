import { type EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import { safeAccountNextPath } from "@/lib/account-onboarding"
import { ensureSaasAccountActivated } from "@/lib/account-onboarding-server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

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
    await ensureSaasAccountActivated(createAdminClient(), user)
  }

  const redirectUrl = new URL(nextPath, requestUrl.origin)
  redirectUrl.searchParams.set("conta", "confirmada")
  return NextResponse.redirect(redirectUrl)
}
