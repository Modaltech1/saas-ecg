"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, ShieldCheck, UserCog, Users } from "lucide-react"
import { criarUsuarioTenant } from "@/lib/supabase/actions"
import { MetricCard } from "@/components/shared/metric-card"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Usuario = {
  user_id: string
  role: string
  status: string
  is_default: boolean
  criado_em: string
  perfil: {
    id: string
    nome: string
    email: string | null
    papel: string
    ativo: boolean
  } | null
}

type Tenant = {
  id: string
  slug: string
  nome: string
  status: string
}

export function UsuariosClient({
  tenant,
  currentRole,
  usuarios,
}: {
  tenant: Tenant
  currentRole: string
  usuarios: Usuario[]
}) {
  const router = useRouter()
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const canCreateUser = ["owner", "admin"].includes(currentRole)

  function handleCreateUser(formData: FormData) {
    setErro(null)
    setSucesso(null)
    startTransition(async () => {
      const result = await criarUsuarioTenant(formData)
      if (result?.erro) {
        setErro(result.erro)
        return
      }
      setSucesso("Usuario criado no tenant atual.")
      router.refresh()
    })
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
      <PageHeader title="Usuarios e tenants" description={`Tenant atual: ${tenant.nome} (${tenant.slug})`} />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Usuarios" value={usuarios.length} icon={Users} />
        <MetricCard title="Admins" value={usuarios.filter((u) => ["owner", "admin", "colaborador"].includes(u.role)).length} icon={ShieldCheck} />
        <MetricCard title="Professoras" value={usuarios.filter((u) => u.role === "professora").length} icon={UserCog} />
      </div>

      {(erro || sucesso) && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          erro ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"
        }`}>
          {erro ?? sucesso}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Usuarios do tenant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {usuarios.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum usuario encontrado.</p>
            ) : (
              usuarios.map((usuario) => (
                <div key={usuario.user_id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{usuario.perfil?.nome ?? usuario.user_id}</p>
                      <p className="text-sm text-muted-foreground">{usuario.perfil?.email ?? "sem e-mail no perfil"}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {usuario.role}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Status: {usuario.status} · Perfil {usuario.perfil?.ativo ? "ativo" : "inativo"}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="size-4" />
              Criar usuario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleCreateUser} className="space-y-3">
              <input name="nome" className="w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="Nome" required disabled={!canCreateUser || isPending} />
              <input name="email" type="email" className="w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="email@exemplo.com" required disabled={!canCreateUser || isPending} />
              <input name="senha" type="password" minLength={6} className="w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="Senha inicial" required disabled={!canCreateUser || isPending} />
              <select name="role" className="w-full rounded-lg border border-border px-3 py-2 text-sm" defaultValue="admin" disabled={!canCreateUser || isPending}>
                <option value="admin">Admin</option>
                <option value="colaborador">Colaborador</option>
                <option value="professora">Professora</option>
              </select>
              <Button type="submit" disabled={isPending || !canCreateUser} className="w-full">
                Criar no tenant atual
              </Button>
              {!canCreateUser ? (
                <p className="text-xs text-muted-foreground">Apenas owner ou admin podem criar usuarios nesta conta.</p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
