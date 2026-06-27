-- 20260626_0003_account_signup_onboarding.sql
-- Objetivo:
--   1. Preparar cadastro publico de novas contas SaaS.
--   2. Permitir tenant em estado pendente ate confirmacao de e-mail.
--   3. Evitar que usuarios de onboarding entrem como ativos antes da confirmacao.
--
-- IMPORTANTE:
--   - Execute manualmente no banco de teste antes de testar /criar-conta.
--   - Codex nao executa migrations no banco.

begin;

alter table public.tenants drop constraint if exists tenants_status_check;
alter table public.tenants
  add constraint tenants_status_check
  check (status in ('pendente_confirmacao', 'ativo', 'suspenso', 'cancelado'));

create table if not exists public.tenant_account_signups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  nome_responsavel text not null,
  nome_escolinha text not null,
  slug text not null,
  status text not null default 'aguardando_email',
  metadata jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  confirmado_em timestamptz,
  constraint tenant_account_signups_status_check check (status in ('aguardando_email', 'confirmado', 'cancelado')),
  constraint tenant_account_signups_email_not_blank check (length(trim(email)) > 0),
  constraint tenant_account_signups_slug_not_blank check (length(trim(slug)) > 0)
);

create index if not exists tenant_account_signups_tenant_idx
  on public.tenant_account_signups (tenant_id);

create index if not exists tenant_account_signups_user_idx
  on public.tenant_account_signups (user_id);

create unique index if not exists tenant_account_signups_waiting_email_unique_idx
  on public.tenant_account_signups (lower(email))
  where status = 'aguardando_email';

alter table public.tenant_account_signups enable row level security;

-- Trigger de novos usuarios:
-- onboarding_tipo = nova_conta_saas cria perfil inativo e membership convidado.
-- O callback /auth/confirm ativa tenant, perfil e membership apos e-mail confirmado.
create or replace function public.handle_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_tenant uuid;
  metadata_tenant text;
  target_role text;
  target_papel text;
  is_account_signup boolean;
  profile_active boolean;
  membership_status text;
begin
  metadata_tenant := nullif(new.raw_user_meta_data->>'tenant_id', '');
  is_account_signup := coalesce(new.raw_user_meta_data->>'onboarding_tipo', '') = 'nova_conta_saas';

  begin
    target_tenant := coalesce(metadata_tenant::uuid, public.default_tenant_id());
  exception when invalid_text_representation then
    target_tenant := public.default_tenant_id();
  end;

  target_papel := coalesce(nullif(new.raw_user_meta_data->>'papel', ''), 'admin');
  target_role := case
    when target_papel = 'admin' then 'owner'
    when target_papel = 'professora' then 'professora'
    else 'colaborador'
  end;
  profile_active := not is_account_signup;
  membership_status := case when is_account_signup then 'convidado' else 'ativo' end;

  insert into public.perfis (id, tenant_id, nome, papel, username, email, ativo)
  values (
    new.id,
    target_tenant,
    coalesce(nullif(new.raw_user_meta_data->>'nome', ''), new.email),
    target_papel,
    nullif(new.raw_user_meta_data->>'username', ''),
    new.email,
    profile_active
  )
  on conflict (id) do update set
    email = excluded.email,
    tenant_id = coalesce(public.perfis.tenant_id, excluded.tenant_id),
    papel = coalesce(nullif(new.raw_user_meta_data->>'papel', ''), public.perfis.papel),
    username = coalesce(excluded.username, public.perfis.username),
    ativo = case when is_account_signup then false else public.perfis.ativo end,
    nome = case
      when public.perfis.nome = '' or public.perfis.nome is null then excluded.nome
      else public.perfis.nome
    end;

  insert into public.tenant_memberships (tenant_id, user_id, role, status, is_default)
  values (target_tenant, new.id, target_role, membership_status, true)
  on conflict (tenant_id, user_id) do update set
    role = excluded.role,
    status = excluded.status,
    is_default = true,
    atualizado_em = now();

  return new;
end;
$$;

commit;
