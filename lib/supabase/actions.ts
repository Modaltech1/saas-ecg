"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { isValidAccountSlug, normalizarSlugConta } from "@/lib/account-onboarding"
import { requireTenantContext } from "@/lib/tenant"
import { createClient, createAdminClient } from "@/lib/supabase/server"

async function appOrigin() {
  const headerStore = await headers()
  const origin = headerStore.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL

  if (!origin) return null

  try {
    return new URL(origin).origin
  } catch {
    return null
  }
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get("email") as string).trim().toLowerCase()
  const senha = formData.get("senha") as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  })

  if (error || !data.user) {
    return { erro: "E-mail ou senha invalidos." }
  }

  const adminClient = createAdminClient()

  const [{ data: perfil }, { data: memberships }] = await Promise.all([
    adminClient
      .from("perfis")
      .select("papel, ativo")
      .eq("id", data.user.id)
      .single(),
    adminClient
      .from("tenant_memberships")
      .select("role, status, tenants!inner(status)")
      .eq("user_id", data.user.id)
      .eq("status", "ativo")
      .limit(1),
  ])

  const role = memberships?.[0]?.role as string | undefined

  if (!perfil || !perfil.ativo || !role) {
    await supabase.auth.signOut()
    return { erro: "Seu acesso esta inativo ou invalido." }
  }

  if (["owner", "admin", "colaborador"].includes(role) || perfil.papel === "admin") {
    return { sucesso: true, destino: "/admin" }
  }

  if (role === "professora" || perfil.papel === "professora") {
    return { sucesso: true, destino: "/professora" }
  }

  await supabase.auth.signOut()
  return { erro: "Perfil sem rota configurada neste projeto." }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function criarContaEscolinha(formData: FormData) {
  const nomeEscolinha = (formData.get("nome_escolinha") as string).trim()
  const nomeResponsavel = (formData.get("nome_responsavel") as string).trim()
  const email = (formData.get("email") as string).trim().toLowerCase()
  const telefone = ((formData.get("telefone") as string) ?? "").trim()
  const senha = formData.get("senha") as string
  const confirmarSenha = formData.get("confirmar_senha") as string
  const slug = normalizarSlugConta((formData.get("slug") as string) || nomeEscolinha)
  const aceiteTermos = formData.get("aceite_termos") === "on"

  if (!nomeEscolinha || !nomeResponsavel || !email || !senha || !confirmarSenha || !slug) {
    return { erro: "Preencha todos os campos obrigatorios." }
  }

  if (!isValidAccountSlug(slug)) {
    return { erro: "Use um identificador com pelo menos 3 caracteres, apenas letras, numeros e hifens." }
  }

  if (senha.length < 8) {
    return { erro: "A senha precisa ter pelo menos 8 caracteres." }
  }

  if (senha !== confirmarSenha) {
    return { erro: "As senhas nao conferem." }
  }

  if (!aceiteTermos) {
    return { erro: "Confirme que voce pode criar esta conta." }
  }

  const origin = await appOrigin()
  if (!origin) {
    return { erro: "URL publica da aplicacao nao configurada. Defina NEXT_PUBLIC_APP_URL." }
  }

  const adminClient = createAdminClient()

  const [{ data: tenantExistente }, { data: usuariosExistentes }] = await Promise.all([
    adminClient.from("tenants").select("id").eq("slug", slug).maybeSingle(),
    adminClient.auth.admin.listUsers(),
  ])

  if (tenantExistente) {
    return { erro: "Este identificador de conta ja esta em uso." }
  }

  const emailJaExiste = usuariosExistentes?.users?.some(
    (u) => u.email?.toLowerCase() === email,
  )

  if (emailJaExiste) {
    return { erro: "Este e-mail ja esta em uso." }
  }

  const { data: tenant, error: erroTenant } = await adminClient
    .from("tenants")
    .insert({
      slug,
      nome: nomeEscolinha,
      status: "pendente_confirmacao",
      plano: "teste",
      metadata: {
        origem: "public-account-signup",
        responsavel: nomeResponsavel,
        email,
        telefone,
      },
    })
    .select("id, slug")
    .single()

  if (erroTenant || !tenant) {
    return {
      erro: erroTenant?.message || "Nao foi possivel iniciar o cadastro da conta.",
    }
  }

  const supabase = await createClient()
  const emailRedirectTo = `${origin}/auth/confirm?next=/admin`
  const { data, error: erroSignup } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      emailRedirectTo,
      data: {
        nome: nomeResponsavel,
        papel: "admin",
        tenant_id: tenant.id,
        tenant_slug: slug,
        tenant_nome: nomeEscolinha,
        onboarding_tipo: "nova_conta_saas",
      },
    },
  })

  if (erroSignup || !data.user) {
    await adminClient.from("tenants").delete().eq("id", tenant.id)
    return { erro: erroSignup?.message || "Nao foi possivel criar o usuario da conta." }
  }

  await adminClient
    .from("tenant_account_signups")
    .insert({
      tenant_id: tenant.id,
      user_id: data.user.id,
      email,
      nome_responsavel: nomeResponsavel,
      nome_escolinha: nomeEscolinha,
      slug,
      status: "aguardando_email",
      metadata: {
        telefone,
        redirect_to: emailRedirectTo,
      },
    })

  return { sucesso: true, email, slug }
}

export async function criarProfessora(formData: FormData) {
  let ctx
  try {
    ctx = await requireTenantContext(["owner", "admin", "colaborador"])
  } catch {
    return { erro: "Sem permissao." }
  }

  const adminClient = ctx.db
  const nome = (formData.get("nome") as string).trim()
  const email = (formData.get("email") as string).trim().toLowerCase()
  const senha = formData.get("senha") as string

  const { data: usuariosExistentes } = await adminClient.auth.admin.listUsers()
  const emailJaExiste = usuariosExistentes?.users?.some(
    (u) => u.email?.toLowerCase() === email,
  )

  if (emailJaExiste) return { erro: "Este e-mail ja esta em uso." }

  const { data: novoUser, error: erroCriacao } = await adminClient.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: {
      nome,
      papel: "professora",
      tenant_id: ctx.tenantId,
    },
  })

  if (erroCriacao || !novoUser.user) {
    return { erro: erroCriacao?.message || "Erro ao criar professora." }
  }

  const { error: erroPerfil } = await adminClient
    .from("perfis")
    .upsert({
      id: novoUser.user.id,
      tenant_id: ctx.tenantId,
      nome,
      papel: "professora",
      email,
      ativo: true,
    })

  if (erroPerfil) return { erro: erroPerfil.message }

  const { error: erroMembership } = await adminClient
    .from("tenant_memberships")
    .upsert({
      tenant_id: ctx.tenantId,
      user_id: novoUser.user.id,
      role: "professora",
      status: "ativo",
      is_default: true,
    })

  if (erroMembership) return { erro: erroMembership.message }

  return { sucesso: true, id: novoUser.user.id }
}

export async function criarUsuarioTenant(formData: FormData) {
  let ctx
  try {
    ctx = await requireTenantContext(["owner", "admin"])
  } catch {
    return { erro: "Sem permissao." }
  }

  const adminClient = ctx.db
  const nome = (formData.get("nome") as string).trim()
  const email = (formData.get("email") as string).trim().toLowerCase()
  const senha = formData.get("senha") as string
  const role = (formData.get("role") as string).trim() as "admin" | "colaborador" | "professora"

  if (!nome || !email || !senha || !["admin", "colaborador", "professora"].includes(role)) {
    return { erro: "Dados invalidos." }
  }

  const { data: usuariosExistentes } = await adminClient.auth.admin.listUsers()
  const emailJaExiste = usuariosExistentes?.users?.some(
    (u) => u.email?.toLowerCase() === email,
  )

  if (emailJaExiste) return { erro: "Este e-mail ja esta em uso." }

  const papel = role === "professora" ? "professora" : "admin"
  const { data: novoUser, error: erroCriacao } = await adminClient.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: {
      nome,
      papel,
      tenant_id: ctx.tenantId,
    },
  })

  if (erroCriacao || !novoUser.user) {
    return { erro: erroCriacao?.message || "Erro ao criar usuario." }
  }

  const { error: erroPerfil } = await adminClient
    .from("perfis")
    .upsert({
      id: novoUser.user.id,
      tenant_id: ctx.tenantId,
      nome,
      papel,
      email,
      ativo: true,
    })

  if (erroPerfil) return { erro: erroPerfil.message }

  const { error: erroMembership } = await adminClient
    .from("tenant_memberships")
    .upsert({
      tenant_id: ctx.tenantId,
      user_id: novoUser.user.id,
      role,
      status: "ativo",
      is_default: true,
    })

  if (erroMembership) return { erro: erroMembership.message }

  return { sucesso: true, id: novoUser.user.id }
}

export async function atualizarProfessora(formData: FormData) {
  let ctx
  try {
    ctx = await requireTenantContext(["owner", "admin", "colaborador"])
  } catch {
    return { erro: "Sem permissao." }
  }

  const adminClient = ctx.db
  const professoraId = (formData.get("id") as string).trim()
  const nome = (formData.get("nome") as string).trim()

  if (!professoraId || !nome) {
    return { erro: "Dados invalidos." }
  }

  const { error } = await adminClient
    .from("perfis")
    .update({ nome })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", professoraId)
    .eq("papel", "professora")

  if (error) return { erro: error.message }

  return { sucesso: true }
}

export async function desativarProfessora(professoraId: string) {
  let ctx
  try {
    ctx = await requireTenantContext(["owner", "admin", "colaborador"])
  } catch {
    return { erro: "Sem permissao." }
  }

  const adminClient = ctx.db
  const { error } = await adminClient
    .from("perfis")
    .update({ ativo: false })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", professoraId)
    .eq("papel", "professora")

  if (error) return { erro: error.message }

  return { sucesso: true }
}
