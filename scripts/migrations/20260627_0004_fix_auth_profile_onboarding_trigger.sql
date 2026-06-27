-- 20260627_0004_fix_auth_profile_onboarding_trigger.sql
-- Objetivo:
--   1. Garantir que o trigger de auth.users -> perfis/tenant_memberships existe.
--   2. Corrigir contas SaaS ja criadas no Auth que ficaram sem perfil/membership.
--
-- IMPORTANTE:
--   - Execute manualmente no banco de teste.
--   - Codex nao executa migrations no banco.

begin;

-- A migration 0003 redefiniu a funcao, mas alguns bancos podem nao ter o trigger
-- on_auth_user_created instalado em auth.users. Este bloco torna isso explicito.
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_novo_usuario();

-- Backfill para usuarios ja existentes no Auth que foram criados pelo fluxo
-- /criar-conta, mas nao ganharam linhas em public.perfis/tenant_memberships.
with auth_candidates as (
  select
    u.id as user_id,
    u.email,
    u.raw_user_meta_data,
    coalesce(u.email_confirmed_at, u.confirmed_at) is not null as email_confirmed,
    case
      when nullif(u.raw_user_meta_data->>'tenant_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then (u.raw_user_meta_data->>'tenant_id')::uuid
      else null
    end as metadata_tenant_id
  from auth.users u
  where coalesce(u.raw_user_meta_data->>'onboarding_tipo', '') = 'nova_conta_saas'
),
resolved as (
  select
    ac.user_id,
    ac.email,
    ac.raw_user_meta_data,
    ac.email_confirmed,
    coalesce(ac.metadata_tenant_id, tas.tenant_id) as tenant_id,
    coalesce(nullif(ac.raw_user_meta_data->>'nome', ''), tas.nome_responsavel, ac.email) as nome,
    coalesce(nullif(ac.raw_user_meta_data->>'papel', ''), 'admin') as papel
  from auth_candidates ac
  left join public.tenant_account_signups tas
    on tas.user_id = ac.user_id
    or lower(tas.email) = lower(ac.email)
  where coalesce(ac.metadata_tenant_id, tas.tenant_id) is not null
)
insert into public.perfis (id, tenant_id, nome, papel, username, email, ativo)
select
  r.user_id,
  r.tenant_id,
  r.nome,
  case
    when r.papel in ('admin', 'colaborador', 'professora') then r.papel
    else 'admin'
  end,
  nullif(r.raw_user_meta_data->>'username', ''),
  r.email,
  r.email_confirmed
from resolved r
on conflict (id) do update set
  tenant_id = excluded.tenant_id,
  nome = coalesce(nullif(public.perfis.nome, ''), excluded.nome),
  papel = excluded.papel,
  email = excluded.email,
  ativo = excluded.ativo;

with auth_candidates as (
  select
    u.id as user_id,
    u.email,
    u.raw_user_meta_data,
    coalesce(u.email_confirmed_at, u.confirmed_at) is not null as email_confirmed,
    case
      when nullif(u.raw_user_meta_data->>'tenant_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then (u.raw_user_meta_data->>'tenant_id')::uuid
      else null
    end as metadata_tenant_id
  from auth.users u
  where coalesce(u.raw_user_meta_data->>'onboarding_tipo', '') = 'nova_conta_saas'
),
resolved as (
  select
    ac.user_id,
    ac.raw_user_meta_data,
    ac.email_confirmed,
    coalesce(ac.metadata_tenant_id, tas.tenant_id) as tenant_id,
    coalesce(nullif(ac.raw_user_meta_data->>'papel', ''), 'admin') as papel
  from auth_candidates ac
  left join public.tenant_account_signups tas
    on tas.user_id = ac.user_id
    or lower(tas.email) = lower(ac.email)
  where coalesce(ac.metadata_tenant_id, tas.tenant_id) is not null
)
insert into public.tenant_memberships (tenant_id, user_id, role, status, is_default, atualizado_em)
select
  r.tenant_id,
  r.user_id,
  case
    when r.papel = 'professora' then 'professora'
    when r.papel = 'colaborador' then 'colaborador'
    else 'owner'
  end,
  case when r.email_confirmed then 'ativo' else 'convidado' end,
  true,
  now()
from resolved r
on conflict (tenant_id, user_id) do update set
  role = excluded.role,
  status = excluded.status,
  is_default = true,
  atualizado_em = now();

with confirmed_tenants as (
  select distinct
    coalesce(
      case
        when nullif(u.raw_user_meta_data->>'tenant_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then (u.raw_user_meta_data->>'tenant_id')::uuid
        else null
      end,
      tas.tenant_id
    ) as tenant_id
  from auth.users u
  left join public.tenant_account_signups tas
    on tas.user_id = u.id
    or lower(tas.email) = lower(u.email)
  where coalesce(u.raw_user_meta_data->>'onboarding_tipo', '') = 'nova_conta_saas'
    and coalesce(u.email_confirmed_at, u.confirmed_at) is not null
)
update public.tenants t
set
  status = 'ativo',
  metadata = coalesce(t.metadata, '{}'::jsonb) || jsonb_build_object('onboarding_confirmado_em', now()),
  atualizado_em = now()
from confirmed_tenants ct
where t.id = ct.tenant_id
  and t.status in ('pendente_confirmacao', 'ativo');

update public.tenant_account_signups tas
set
  status = 'confirmado',
  confirmado_em = coalesce(tas.confirmado_em, now())
from auth.users u
where (tas.user_id = u.id or lower(tas.email) = lower(u.email))
  and coalesce(u.raw_user_meta_data->>'onboarding_tipo', '') = 'nova_conta_saas'
  and coalesce(u.email_confirmed_at, u.confirmed_at) is not null;

commit;
