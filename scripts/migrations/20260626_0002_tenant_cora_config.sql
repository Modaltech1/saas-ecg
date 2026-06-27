-- 20260626_0002_tenant_cora_config.sql
-- Objetivo:
--   1. Separar credenciais/configuracoes Banco Cora por tenant.
--   2. Migrar flags nao secretas de configuracoes para a tabela dedicada.
--   3. Proteger acesso via RLS tenant-aware.
--
-- IMPORTANTE:
--   - Execute primeiro no banco de teste.
--   - Esta migration nao copia CORA_CLIENT_ID/CORA_PRIVATE_KEY/CORA_CERTIFICATE
--     do ambiente. As credenciais devem ser cadastradas por tenant na aplicacao.

begin;

create table if not exists public.tenant_cora_configuracoes (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  ambiente text not null default 'producao',
  ativo boolean not null default false,
  client_id text,
  private_key_pem text,
  certificate_pem text,
  webhook_url text,
  webhook_secret text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint tenant_cora_ambiente_check check (ambiente in ('producao', 'sandbox')),
  constraint tenant_cora_ativo_requires_credentials check (
    ativo = false
    or (
      nullif(trim(coalesce(client_id, '')), '') is not null
      and nullif(trim(coalesce(private_key_pem, '')), '') is not null
      and nullif(trim(coalesce(certificate_pem, '')), '') is not null
    )
  )
);

create index if not exists idx_tenant_cora_configuracoes_ativo
  on public.tenant_cora_configuracoes (ativo)
  where ativo;

insert into public.tenant_cora_configuracoes (
  tenant_id,
  ativo,
  webhook_url,
  ambiente,
  criado_em,
  atualizado_em
)
select
  c.tenant_id,
  coalesce(c.cora_ativo, false),
  nullif(c.cora_webhook_url, ''),
  coalesce(nullif(c.cora_ambiente, ''), 'producao'),
  now(),
  now()
from public.configuracoes c
where c.tenant_id is not null
on conflict (tenant_id) do update set
  ativo = excluded.ativo,
  webhook_url = excluded.webhook_url,
  ambiente = excluded.ambiente,
  atualizado_em = now();

alter table public.tenant_cora_configuracoes enable row level security;

do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tenant_cora_configuracoes'
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

create policy tenant_cora_select_admin on public.tenant_cora_configuracoes
  for select using (public.can_manage_tenant(tenant_id));

create policy tenant_cora_insert_admin on public.tenant_cora_configuracoes
  for insert with check (public.can_manage_tenant(tenant_id));

create policy tenant_cora_update_admin on public.tenant_cora_configuracoes
  for update using (public.can_manage_tenant(tenant_id))
  with check (public.can_manage_tenant(tenant_id));

create policy tenant_cora_delete_owner on public.tenant_cora_configuracoes
  for delete using (public.tenant_role(tenant_id) = 'owner');

commit;
