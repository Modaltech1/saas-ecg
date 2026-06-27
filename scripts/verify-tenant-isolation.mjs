import fs from "fs"
import path from "path"
import process from "process"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  const content = fs.readFileSync(filePath, "utf8")
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const index = trimmed.indexOf("=")
    if (index === -1) continue

    const key = trimmed.slice(0, index).trim()
    let value = trimmed.slice(index + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"))
loadEnvFile(path.resolve(process.cwd(), ".env"))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function requiredEnv(name, value) {
  if (!value) throw new Error(`Env obrigatoria ausente: ${name}`)
}

requiredEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl)
requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey)
requiredEnv("SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey)

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const suffix = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`
const tenantA = crypto.randomUUID()
const tenantB = crypto.randomUUID()
const password = `Iso-${crypto.randomBytes(8).toString("hex")}1!`
const emailA = `tenant-a-${suffix}@prodexy.test`
const emailB = `tenant-b-${suffix}@prodexy.test`
const createdUserIds = []
const createdPolos = []

async function cleanup() {
  for (const polo of createdPolos) {
    await admin.from("polos").delete().eq("id", polo.id)
  }

  await admin.from("tenant_memberships").delete().in("tenant_id", [tenantA, tenantB])
  await admin.from("perfis").delete().in("tenant_id", [tenantA, tenantB])
  await admin.from("tenants").delete().in("id", [tenantA, tenantB])

  for (const userId of createdUserIds) {
    await admin.auth.admin.deleteUser(userId).catch(() => null)
  }
}

async function createTenant(id, slug, nome) {
  const { error } = await admin
    .from("tenants")
    .insert({ id, slug, nome, status: "ativo", plano: "teste", metadata: { origem: "verify-tenant-isolation" } })

  if (error) throw new Error(`Erro ao criar tenant ${slug}: ${error.message}`)
}

async function createOwner(tenantId, email, nome) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome, papel: "admin", tenant_id: tenantId },
  })

  if (error || !data.user) throw new Error(`Erro ao criar usuario ${email}: ${error?.message}`)
  createdUserIds.push(data.user.id)

  const { error: perfilError } = await admin.from("perfis").upsert({
    id: data.user.id,
    tenant_id: tenantId,
    nome,
    papel: "admin",
    email,
    ativo: true,
  })
  if (perfilError) throw new Error(`Erro ao criar perfil ${email}: ${perfilError.message}`)

  const { error: membershipError } = await admin.from("tenant_memberships").upsert({
    tenant_id: tenantId,
    user_id: data.user.id,
    role: "owner",
    status: "ativo",
    is_default: true,
  })
  if (membershipError) throw new Error(`Erro ao criar membership ${email}: ${membershipError.message}`)

  return data.user.id
}

async function createPolo(tenantId, nome) {
  const { data, error } = await admin
    .from("polos")
    .insert({ tenant_id: tenantId, nome, cidade: "Teste", ativo: true })
    .select("id, nome, tenant_id")
    .single()

  if (error) throw new Error(`Erro ao criar polo ${nome}: ${error.message}`)
  createdPolos.push(data)
  return data
}

async function signIn(email) {
  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Erro ao autenticar ${email}: ${error.message}`)
  return client
}

try {
  await createTenant(tenantA, `iso-a-${suffix}`, `Tenant Isolamento A ${suffix}`)
  await createTenant(tenantB, `iso-b-${suffix}`, `Tenant Isolamento B ${suffix}`)

  await createOwner(tenantA, emailA, "Owner Tenant A")
  await createOwner(tenantB, emailB, "Owner Tenant B")

  const poloA = await createPolo(tenantA, `Polo Tenant A ${suffix}`)
  const poloB = await createPolo(tenantB, `Polo Tenant B ${suffix}`)

  const clientA = await signIn(emailA)
  const clientB = await signIn(emailB)

  const [queryA, queryB] = await Promise.all([
    clientA.from("polos").select("id, nome, tenant_id").order("nome"),
    clientB.from("polos").select("id, nome, tenant_id").order("nome"),
  ])

  if (queryA.error) throw new Error(`Erro RLS tenant A: ${queryA.error.message}`)
  if (queryB.error) throw new Error(`Erro RLS tenant B: ${queryB.error.message}`)

  assert(queryA.data.some((row) => row.id === poloA.id), "Tenant A nao enxergou seu proprio polo.")
  assert(!queryA.data.some((row) => row.id === poloB.id), "Tenant A enxergou dado do Tenant B.")
  assert(queryB.data.some((row) => row.id === poloB.id), "Tenant B nao enxergou seu proprio polo.")
  assert(!queryB.data.some((row) => row.id === poloA.id), "Tenant B enxergou dado do Tenant A.")

  const crossInsert = await clientA
    .from("polos")
    .insert({ tenant_id: tenantB, nome: `Cross Tenant ${suffix}`, cidade: "Teste", ativo: true })
    .select("id")

  assert(crossInsert.error, "Tenant A conseguiu inserir dado no Tenant B.")

  console.log("OK tenant isolation")
  console.log(`Tenant A rows visible: ${queryA.data.length}`)
  console.log(`Tenant B rows visible: ${queryB.data.length}`)
  console.log("Cross-tenant insert blocked")
} finally {
  await cleanup()
}
