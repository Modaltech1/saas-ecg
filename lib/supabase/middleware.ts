import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

function roleDestino(role: string | null, papel: string | null) {
  if (role === "professora" || papel === "professora") return "/professora"
  if (["owner", "admin", "colaborador"].includes(role ?? "") || papel === "admin") return "/admin"
  return null
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

  if (user) {
    const [{ data: perfilData }, { data: memberships }] = await Promise.all([
      supabase
        .from("perfis")
        .select("papel, ativo, tenant_id")
        .eq("id", user.id)
        .single(),
      supabase
        .from("tenant_memberships")
        .select("role, status")
        .eq("user_id", user.id)
        .eq("status", "ativo")
        .limit(1),
    ])

    perfil = perfilData
    role = memberships?.[0]?.role ?? null
  }

  const destino = perfil?.ativo ? roleDestino(role, perfil.papel) : null

  if (pathname === "/") {
    if (!user || !perfil || !perfil.ativo || !destino) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    const url = request.nextUrl.clone()
    url.pathname = destino
    return NextResponse.redirect(url)
  }

  if (rotaLogin) {
    if (!user || !perfil || !perfil.ativo || !destino) {
      return supabaseResponse
    }

    const url = request.nextUrl.clone()
    url.pathname = destino
    return NextResponse.redirect(url)
  }

  if ((rotasAdmin || rotasProfessora) && (!user || !perfil || !perfil.ativo || !destino)) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
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
