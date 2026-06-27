import crypto from "crypto"
import http from "http"
import https from "https"

type CoraAmbiente = "producao" | "sandbox"

export interface CoraCredentials {
  tenantId?: string
  clientId: string
  privateKey: string
  certificate: string
  ambiente?: CoraAmbiente
}

export interface CriarCobrancaParams {
  valorCentavos: number
  dataVencimento: string
  nomeCliente: string
  cpfCliente: string
  descricao: string
  correlationId: string
}

export interface CoraResponse {
  id: string
  status: string
  payment_options?: {
    bank_slip?: {
      url?: string
      barcode?: string
      digitable?: string
    }
  }
  pix?: {
    emv?: string
  }
  [key: string]: unknown
}

const CORA_PRODUCTION_BASE = "https://matls-clients.api.cora.com.br"
const tokenCache = new Map<string, { token: string; expiresAt: number }>()

function normalizePem(value: string) {
  return value.replace(/\\n/g, "\n").trim()
}

function getCoraBaseUrl(ambiente: CoraAmbiente = "producao") {
  if (ambiente === "sandbox") {
    const sandboxBaseUrl = process.env.CORA_SANDBOX_API_BASE_URL
    if (!sandboxBaseUrl) {
      throw new Error("Ambiente sandbox da Cora nao configurado. Defina CORA_SANDBOX_API_BASE_URL ou use producao.")
    }
    return sandboxBaseUrl.replace(/\/$/, "")
  }

  return CORA_PRODUCTION_BASE
}

function getLegacyCredentials(): CoraCredentials {
  const clientId = process.env.CORA_CLIENT_ID
  const privateKey = process.env.CORA_PRIVATE_KEY
  const certificate = process.env.CORA_CERTIFICATE

  if (!clientId || !privateKey || !certificate) {
    throw new Error("Credenciais Cora incompletas para o tenant.")
  }

  return {
    clientId,
    privateKey,
    certificate,
    ambiente: "producao",
  }
}

function resolveCredentials(credentials?: CoraCredentials): Required<CoraCredentials> {
  const source = credentials ?? getLegacyCredentials()

  if (!source.clientId || !source.privateKey || !source.certificate) {
    throw new Error("Credenciais Cora incompletas para o tenant.")
  }

  return {
    tenantId: source.tenantId ?? "legacy-env",
    clientId: source.clientId,
    privateKey: normalizePem(source.privateKey),
    certificate: normalizePem(source.certificate),
    ambiente: source.ambiente ?? "producao",
  }
}

function cacheKey(credentials: Required<CoraCredentials>) {
  const fingerprint = crypto
    .createHash("sha256")
    .update(`${credentials.clientId}:${credentials.certificate}`)
    .digest("hex")

  return `${credentials.tenantId}:${credentials.ambiente}:${fingerprint}`
}

function httpsRequestWithMtls(
  url: string,
  options: {
    method: string
    headers: Record<string, string>
    body?: string
  },
  credentials: Required<CoraCredentials>,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)

    const reqOptions: https.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: options.method,
      headers: options.headers,
      cert: credentials.certificate,
      key: credentials.privateKey,
      rejectUnauthorized: true,
    }

    const req = https.request(reqOptions, (res: http.IncomingMessage) => {
      let data = ""
      res.on("data", (chunk: Buffer) => {
        data += chunk.toString()
      })
      res.on("end", () => {
        resolve({ status: res.statusCode ?? 0, body: data })
      })
    })

    req.on("error", reject)

    if (options.body) {
      req.write(options.body)
    }
    req.end()
  })
}

function parseJsonBody(body: string) {
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

function coraErrorMessage(prefix: string, status: number, body: string) {
  const parsed = parseJsonBody(body)
  const firstError = parsed?.errors?.[0]?.message
  return `${prefix} (${status}): ${firstError ?? body}`
}

export async function getCoraToken(credentialsInput?: CoraCredentials): Promise<string> {
  const credentials = resolveCredentials(credentialsInput)
  const now = Date.now()
  const key = cacheKey(credentials)
  const cached = tokenCache.get(key)

  if (cached && cached.expiresAt > now + 30_000) {
    return cached.token
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: credentials.clientId,
  }).toString()

  const baseUrl = getCoraBaseUrl(credentials.ambiente)
  const result = await httpsRequestWithMtls(
    `${baseUrl}/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body).toString(),
      },
      body,
    },
    credentials,
  )

  if (result.status < 200 || result.status >= 300) {
    throw new Error(coraErrorMessage("Falha na autenticacao Cora", result.status, result.body))
  }

  const data = parseJsonBody(result.body)
  const accessToken = data?.access_token
  if (!accessToken) {
    throw new Error("Resposta Cora sem access_token.")
  }

  const expiresIn: number = data.expires_in ?? 3600
  tokenCache.set(key, {
    token: accessToken,
    expiresAt: now + expiresIn * 1000,
  })

  return accessToken
}

export async function criarCobrancaCora(
  params: CriarCobrancaParams,
  credentialsInput?: CoraCredentials,
): Promise<CoraResponse> {
  const credentials = resolveCredentials(credentialsInput)
  const token = await getCoraToken(credentials)
  const baseUrl = getCoraBaseUrl(credentials.ambiente)

  const payload = JSON.stringify({
    code: params.correlationId,
    customer: {
      name: params.nomeCliente,
      document: {
        identity: params.cpfCliente,
        type: "CPF",
      },
    },
    services: [
      {
        name: "Mensalidade",
        description: params.descricao,
        amount: params.valorCentavos,
      },
    ],
    payment_terms: {
      due_date: params.dataVencimento,
    },
    payment_forms: ["PIX"],
  })

  const result = await httpsRequestWithMtls(
    `${baseUrl}/v2/invoices`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "Idempotency-Key": crypto.randomUUID(),
        "Content-Length": Buffer.byteLength(payload).toString(),
      },
      body: payload,
    },
    credentials,
  )

  if (result.status < 200 || result.status >= 300) {
    const parsed = parseJsonBody(result.body)
    const firstError = parsed?.errors?.[0]?.message
    if (firstError === "is not a valid CNPJ or CPF") {
      throw new Error("CPF invalido. Entre em contato com o administrador.")
    }
    throw new Error(coraErrorMessage("Erro ao criar cobranca Cora", result.status, result.body))
  }

  return JSON.parse(result.body) as CoraResponse
}

export async function consultarCobrancaCora(
  invoiceId: string,
  credentialsInput?: CoraCredentials,
): Promise<CoraResponse> {
  const credentials = resolveCredentials(credentialsInput)
  const token = await getCoraToken(credentials)
  const baseUrl = getCoraBaseUrl(credentials.ambiente)

  const result = await httpsRequestWithMtls(
    `${baseUrl}/v2/invoices/${invoiceId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
    credentials,
  )

  if (result.status < 200 || result.status >= 300) {
    throw new Error(coraErrorMessage("Erro ao consultar cobranca Cora", result.status, result.body))
  }

  return JSON.parse(result.body) as CoraResponse
}

export async function cancelarCobrancaCora(
  invoiceId: string,
  credentialsInput?: CoraCredentials,
): Promise<void> {
  const credentials = resolveCredentials(credentialsInput)
  const token = await getCoraToken(credentials)
  const baseUrl = getCoraBaseUrl(credentials.ambiente)

  const result = await httpsRequestWithMtls(
    `${baseUrl}/v2/invoices/${invoiceId}/void`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Length": "0",
      },
    },
    credentials,
  )

  if (result.status >= 300) {
    throw new Error(coraErrorMessage("Erro ao cancelar cobranca Cora", result.status, result.body))
  }
}

export async function testarConexaoCora(credentialsInput?: CoraCredentials): Promise<{ ok: boolean; erro?: string }> {
  try {
    const credentials = resolveCredentials(credentialsInput)
    tokenCache.delete(cacheKey(credentials))
    await getCoraToken(credentials)
    return { ok: true }
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : String(err) }
  }
}
