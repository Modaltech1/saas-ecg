import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { accountStatusPath, shouldShowInitialOnboarding } from "@/lib/account-status"

function roleDestino(role: string | null, papel: string | null) {
  if (role === "professora" || papel === "professora") return "/professora"
  if (["owner", "admin", "colaborador"].includes(role ?? "") || papel === "admin") return "/admin"
  return null
}

function redirectToPath(request: NextRequest, path: string) {
  const url = request.nextUrl.clone()
  const [pathname, search = ""] = path.split("?")
  url.pathname = pathname
  url.search = search
  return NextResponse.redirect(url)
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const { pathname } = request.nextUrl
  const rotaLogin = pathname.startsWith("/login")
  const rotasAdmin = pathname.startsWith("/admin")
  const rotasProfessora = pathname.startsWith("/professora")

  if (!supabaseUrl || !supabaseAnonKey) {
    if ((pathname === "/" || rotasAdmin || rotasProfessora) && !rotaLogin) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("config", "missing-supabase-env")
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  let perfil: { papel: string; ativo: boolean; tenant_id: string | null } | null = null
  let role: string | null = null
  let membershipStatus: string | null = null
  let tenantStatus: string | null = null
  let tenantMetadata: unknown = null

  if (user) {
    const [{ data: perfilData }, { data: memberships }] = await Promise.all([
      supabase
        .from("perfis")
        .select("papel, ativo, tenant_id")
        .eq("id", user.id)
        .single(),
      supabase
        .from("tenant_memberships")
        .select("role, status, tenants(status, metadata)")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("criado_em", { ascending: true })
        .limit(1),
    ])

    const membership = memberships?.[0] as
      | {
          role: string
          status: string
          tenants: { status: string; metadata: unknown } | { status: string; metadata: unknown }[] | null
        }
      | undefined
    const tenant = Array.isArray(membership?.tenants)
      ? membership?.tenants[0]
      : membership?.tenants

    perfil = perfilData
    role = membership?.role ?? null
    membershipStatus = membership?.status ?? null
    tenantStatus = tenant?.status ?? (membershipStatus === "convidado" ? "pendente_confirmacao" : null)
    tenantMetadata = tenant?.metadata ?? null
  }

  const statusPath = accountStatusPath(tenantStatus)
  const activeMembership = membershipStatus === "ativo"
  const activeTenant = tenantStatus === "ativo"
  const activeAccess = Boolean(perfil?.ativo && activeMembership && activeTenant)
  const destino = activeAccess ? roleDestino(role, perfil?.papel ?? null) : null
  const onboardingPath = shouldShowInitialOnboarding({
    pathname,
    role,
    tenantStatus,
    tenantMetadata,
  })
    ? "/admin/onboarding"
    : null

  if (pathname === "/") {
    if (statusPath) {
      return redirectToPath(request, statusPath)
    }

    if (!user || !perfil || !activeAccess || !destino) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    return redirectToPath(request, onboardingPath ?? destino)
  }

  if (rotaLogin) {
    if (statusPath) {
      return redirectToPath(request, statusPath)
    }

    if (!user || !perfil || !activeAccess || !destino) {
      return supabaseResponse
    }

    return redirectToPath(request, onboardingPath ?? destino)
  }

  if ((rotasAdmin || rotasProfessora) && statusPath) {
    return redirectToPath(request, statusPath)
  }

  if ((rotasAdmin || rotasProfessora) && (!user || !perfil || !activeAccess || !destino)) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }

  if (rotasAdmin && onboardingPath) {
    return redirectToPath(request, onboardingPath)
  }

  if (rotasAdmin && destino !== "/admin") {
    const url = request.nextUrl.clone()
    url.pathname = "/professora"
    return NextResponse.redirect(url)
  }

  if (rotasProfessora && destino !== "/professora") {
    const url = request.nextUrl.clone()
    url.pathname = "/admin"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
