-- 20260626_0001_multi_tenant_foundation.sql
-- Objetivo:
--   1. Criar a fronteira multi-tenant sem apagar dados existentes.
--   2. Backfillar o banco atual para um tenant legado/padrao.
--   3. Preparar RLS, unicidades por tenant e integridade anti-cross-tenant.
--
-- IMPORTANTE:
--   - Execute primeiro no banco de teste.
--   - Nao executa ou valida Banco Cora.
--   - Depois de validar a aplicacao, a fase 2 deve remover defaults legados
--     de tenant_id para obrigar toda escrita nova a informar tenant explicitamente.

begin;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  nome text not null,
  status text not null default 'ativo',
  plano text not null default 'legacy',
  dominio text,
  metadata jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint tenants_slug_not_blank check (length(trim(slug)) > 0),
  constraint tenants_status_check check (status in ('ativo', 'suspenso', 'cancelado'))
);

create unique index if not exists tenants_slug_unique_idx on public.tenants (lower(slug));
create unique index if not exists tenants_dominio_unique_idx on public.tenants (lower(dominio)) where dominio is not null;

create table if not exists public.tenant_memberships (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  status text not null default 'ativo',
  is_default boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  primary key (tenant_id, user_id),
  constraint tenant_memberships_role_check check (role in ('owner', 'admin', 'colaborador', 'professora')),
  constraint tenant_memberships_status_check check (status in ('ativo', 'inativo', 'convidado'))
);

create index if not exists tenant_memberships_user_idx on public.tenant_memberships (user_id);
create unique index if not exists tenant_memberships_one_default_idx
  on public.tenant_memberships (user_id)
  where is_default and status = 'ativo';

create or replace function public.default_tenant_id()
returns uuid
language sql
immutable
as $$
  select '00000000-0000-0000-0000-000000000001'::uuid;
$$;

insert into public.tenants (id, slug, nome, status, plano, metadata)
values (
  public.default_tenant_id(),
  'ecg',
  'Equipe Carolina Garcia',
  'ativo',
  'legacy',
  jsonb_build_object('origem', 'single-tenant-migration', 'created_by_migration', '20260626_0001')
)
on conflict (id) do update set
  slug = excluded.slug,
  nome = excluded.nome,
  status = excluded.status,
  atualizado_em = now();

create or replace function public.current_tenant_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claim_tenant text;
  claim_tenant_uuid uuid;
  resolved uuid;
begin
  claim_tenant := nullif(current_setting('request.jwt.claim.tenant_id', true), '');

  if claim_tenant is not null then
    begin
      claim_tenant_uuid := claim_tenant::uuid;
      return claim_tenant_uuid;
    exception when invalid_text_representation then
      null;
    end;
  end if;

  if auth.uid() is not null then
    select tm.tenant_id
      into resolved
    from public.tenant_memberships tm
    where tm.user_id = auth.uid()
      and tm.status = 'ativo'
    order by tm.is_default desc, tm.criado_em asc
    limit 1;

    if resolved is not null then
      return resolved;
    end if;
  end if;

  return public.default_tenant_id();
end;
$$;

create or replace function public.tenant_role(p_tenant_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select tm.role
  from public.tenant_memberships tm
  where tm.tenant_id = p_tenant_id
    and tm.user_id = auth.uid()
    and tm.status = 'ativo'
  order by tm.is_default desc, tm.criado_em asc
  limit 1;
$$;

create or replace function public.is_tenant_member(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_memberships tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = auth.uid()
      and tm.status = 'ativo'
  );
$$;

create or replace function public.can_manage_tenant(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_memberships tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = auth.uid()
      and tm.status = 'ativo'
      and tm.role in ('owner', 'admin', 'colaborador')
  );
$$;

create or replace function public.can_teach_tenant(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_memberships tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = auth.uid()
      and tm.status = 'ativo'
      and tm.role = 'professora'
  );
$$;

-- Mantem compatibilidade com policies/codigo legado, mas agora a decisao e por tenant.
create or replace function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_memberships tm
    where tm.user_id = auth.uid()
      and tm.status = 'ativo'
      and tm.role in ('owner', 'admin', 'colaborador')
  );
$$;

create or replace function public.eh_professora()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_memberships tm
    where tm.user_id = auth.uid()
      and tm.status = 'ativo'
      and tm.role = 'professora'
  );
$$;

-- Coluna tenant_id em todas as tabelas de dominio.
do $$
declare
  tbl text;
  default_tenant constant uuid := public.default_tenant_id();
  tenant_tables text[] := array[
    'perfis',
    'polos',
    'locais',
    'turmas',
    'horarios',
    'turmas_professoras',
    'responsaveis',
    'alunas',
    'pagamentos_mensalidade',
    'pagamentos_matricula',
    'pagamentos_professora',
    'chamadas',
    'presencas',
    'custos_turma',
    'custos_turma_historico',
    'blocos_cobranca',
    'produtos',
    'eventos',
    'inscricoes_evento',
    'pre_matriculas',
    'configuracoes'
  ];
begin
  foreach tbl in array tenant_tables loop
    execute format('alter table public.%I add column if not exists tenant_id uuid', tbl);
    execute format('alter table public.%I alter column tenant_id set default public.current_tenant_id()', tbl);
    execute format('update public.%I set tenant_id = $1 where tenant_id is null', tbl) using default_tenant;
    execute format('alter table public.%I alter column tenant_id set not null', tbl);
    execute format('create index if not exists %I on public.%I (tenant_id)', 'idx_' || tbl || '_tenant_id', tbl);

    if not exists (
      select 1
      from pg_constraint
      where conname = tbl || '_tenant_id_fkey'
        and conrelid = format('public.%I', tbl)::regclass
    ) then
      execute format(
        'alter table public.%I add constraint %I foreign key (tenant_id) references public.tenants(id) on delete restrict',
        tbl,
        tbl || '_tenant_id_fkey'
      );
    end if;
  end loop;
end $$;

-- Membership inicial: todo perfil atual entra no tenant legado.
insert into public.tenant_memberships (tenant_id, user_id, role, status, is_default)
select
  coalesce(p.tenant_id, public.default_tenant_id()),
  p.id,
  case
    when p.papel = 'admin' then 'owner'
    when p.papel = 'colaborador' then 'colaborador'
    when p.papel = 'professora' then 'professora'
    else 'colaborador'
  end,
  case when p.ativo then 'ativo' else 'inativo' end,
  true
from public.perfis p
on conflict (tenant_id, user_id) do update set
  role = excluded.role,
  status = excluded.status,
  is_default = excluded.is_default,
  atualizado_em = now();

-- Unicidades que eram globais passam a ser por tenant.
alter table public.alunas drop constraint if exists alunas_cpf_key;
create unique index if not exists alunas_tenant_cpf_unique_idx
  on public.alunas (tenant_id, cpf_aluna)
  where cpf_aluna is not null;

alter table public.responsaveis drop constraint if exists responsaveis_cpf_key;
create unique index if not exists responsaveis_tenant_cpf_unique_idx
  on public.responsaveis (tenant_id, cpf)
  where cpf is not null;

alter table public.perfis drop constraint if exists perfis_username_key;
create unique index if not exists perfis_tenant_username_unique_idx
  on public.perfis (tenant_id, username)
  where username is not null;

alter table public.chamadas drop constraint if exists chamadas_turma_id_data_horario_id_key;
create unique index if not exists chamadas_tenant_turma_data_horario_unique_idx
  on public.chamadas (tenant_id, turma_id, data, horario_id);

alter table public.custos_turma_historico drop constraint if exists custos_turma_historico_custo_id_mes_referencia_key;
create unique index if not exists custos_turma_historico_tenant_custo_mes_unique_idx
  on public.custos_turma_historico (tenant_id, custo_id, mes_referencia);

alter table public.inscricoes_evento drop constraint if exists inscricoes_evento_evento_id_cpf_aluna_key;
create unique index if not exists inscricoes_evento_tenant_evento_cpf_unique_idx
  on public.inscricoes_evento (tenant_id, evento_id, cpf_aluna);

alter table public.pagamentos_mensalidade drop constraint if exists pagamentos_mensalidade_aluna_mes_unique;
create unique index if not exists pagamentos_mensalidade_tenant_aluna_mes_unique_idx
  on public.pagamentos_mensalidade (tenant_id, aluna_id, mes_referencia)
  where aluna_id is not null;

alter table public.pagamentos_professora drop constraint if exists pagamentos_professora_professora_id_mes_referencia_key;
create unique index if not exists pagamentos_professora_tenant_prof_mes_unique_idx
  on public.pagamentos_professora (tenant_id, professora_id, mes_referencia);

alter table public.turmas_professoras drop constraint if exists turmas_professoras_turma_id_professora_id_key;
create unique index if not exists turmas_professoras_tenant_turma_prof_unique_idx
  on public.turmas_professoras (tenant_id, turma_id, professora_id);

-- Configuracoes era singleton global. Em SaaS, cada tenant precisa ter seu proprio id = 1.
alter table public.configuracoes drop constraint if exists configuracoes_pkey;
alter table public.configuracoes add constraint configuracoes_pkey primary key (tenant_id, id);

-- Gatilho generico para impedir relacionamento entre tenants diferentes.
create or replace function public.enforce_same_tenant_uuid_fk()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_table text := tg_argv[0];
  parent_pk text := tg_argv[1];
  child_fk text := tg_argv[2];
  fk_text text;
  parent_tenant uuid;
begin
  fk_text := nullif(to_jsonb(new)->>child_fk, '');

  if fk_text is null then
    return new;
  end if;

  execute format('select tenant_id from public.%I where %I = $1::uuid', parent_table, parent_pk)
    into parent_tenant
    using fk_text;

  if parent_tenant is null then
    return new;
  end if;

  if new.tenant_id is null then
    new.tenant_id := parent_tenant;
  elsif new.tenant_id <> parent_tenant then
    raise exception 'Cross-tenant reference blocked: %.% references %.% from another tenant',
      tg_table_name, child_fk, parent_table, parent_pk
      using errcode = '23514';
  end if;

  return new;
end;
$$;

do $$
begin
  -- Estrutura operacional
  drop trigger if exists trg_locais_same_tenant_polo on public.locais;
  create trigger trg_locais_same_tenant_polo before insert or update of tenant_id, polo_id on public.locais
    for each row execute function public.enforce_same_tenant_uuid_fk('polos', 'id', 'polo_id');

  drop trigger if exists trg_turmas_same_tenant_polo on public.turmas;
  create trigger trg_turmas_same_tenant_polo before insert or update of tenant_id, polo_id on public.turmas
    for each row execute function public.enforce_same_tenant_uuid_fk('polos', 'id', 'polo_id');

  drop trigger if exists trg_turmas_same_tenant_local on public.turmas;
  create trigger trg_turmas_same_tenant_local before insert or update of tenant_id, local_id on public.turmas
    for each row execute function public.enforce_same_tenant_uuid_fk('locais', 'id', 'local_id');

  drop trigger if exists trg_horarios_same_tenant_turma on public.horarios;
  create trigger trg_horarios_same_tenant_turma before insert or update of tenant_id, turma_id on public.horarios
    for each row execute function public.enforce_same_tenant_uuid_fk('turmas', 'id', 'turma_id');

  drop trigger if exists trg_turmas_professoras_same_tenant_turma on public.turmas_professoras;
  create trigger trg_turmas_professoras_same_tenant_turma before insert or update of tenant_id, turma_id on public.turmas_professoras
    for each row execute function public.enforce_same_tenant_uuid_fk('turmas', 'id', 'turma_id');

  drop trigger if exists trg_turmas_professoras_same_tenant_professora on public.turmas_professoras;
  create trigger trg_turmas_professoras_same_tenant_professora before insert or update of tenant_id, professora_id on public.turmas_professoras
    for each row execute function public.enforce_same_tenant_uuid_fk('perfis', 'id', 'professora_id');

  -- Pessoas e financeiro
  drop trigger if exists trg_alunas_same_tenant_turma on public.alunas;
  create trigger trg_alunas_same_tenant_turma before insert or update of tenant_id, turma_id on public.alunas
    for each row execute function public.enforce_same_tenant_uuid_fk('turmas', 'id', 'turma_id');

  drop trigger if exists trg_alunas_same_tenant_responsavel on public.alunas;
  create trigger trg_alunas_same_tenant_responsavel before insert or update of tenant_id, responsavel_id on public.alunas
    for each row execute function public.enforce_same_tenant_uuid_fk('responsaveis', 'id', 'responsavel_id');

  drop trigger if exists trg_pagmens_same_tenant_aluna on public.pagamentos_mensalidade;
  create trigger trg_pagmens_same_tenant_aluna before insert or update of tenant_id, aluna_id on public.pagamentos_mensalidade
    for each row execute function public.enforce_same_tenant_uuid_fk('alunas', 'id', 'aluna_id');

  drop trigger if exists trg_pagmens_same_tenant_turma on public.pagamentos_mensalidade;
  create trigger trg_pagmens_same_tenant_turma before insert or update of tenant_id, turma_id on public.pagamentos_mensalidade
    for each row execute function public.enforce_same_tenant_uuid_fk('turmas', 'id', 'turma_id');

  drop trigger if exists trg_pagmat_same_tenant_aluna on public.pagamentos_matricula;
  create trigger trg_pagmat_same_tenant_aluna before insert or update of tenant_id, aluna_id on public.pagamentos_matricula
    for each row execute function public.enforce_same_tenant_uuid_fk('alunas', 'id', 'aluna_id');

  drop trigger if exists trg_pagmat_same_tenant_turma on public.pagamentos_matricula;
  create trigger trg_pagmat_same_tenant_turma before insert or update of tenant_id, turma_id on public.pagamentos_matricula
    for each row execute function public.enforce_same_tenant_uuid_fk('turmas', 'id', 'turma_id');

  drop trigger if exists trg_pagprof_same_tenant_professora on public.pagamentos_professora;
  create trigger trg_pagprof_same_tenant_professora before insert or update of tenant_id, professora_id on public.pagamentos_professora
    for each row execute function public.enforce_same_tenant_uuid_fk('perfis', 'id', 'professora_id');

  drop trigger if exists trg_pagprof_same_tenant_turma on public.pagamentos_professora;
  create trigger trg_pagprof_same_tenant_turma before insert or update of tenant_id, turma_id on public.pagamentos_professora
    for each row execute function public.enforce_same_tenant_uuid_fk('turmas', 'id', 'turma_id');

  -- Presenca
  drop trigger if exists trg_chamadas_same_tenant_turma on public.chamadas;
  create trigger trg_chamadas_same_tenant_turma before insert or update of tenant_id, turma_id on public.chamadas
    for each row execute function public.enforce_same_tenant_uuid_fk('turmas', 'id', 'turma_id');

  drop trigger if exists trg_chamadas_same_tenant_professora on public.chamadas;
  create trigger trg_chamadas_same_tenant_professora before insert or update of tenant_id, professora_id on public.chamadas
    for each row execute function public.enforce_same_tenant_uuid_fk('perfis', 'id', 'professora_id');

  drop trigger if exists trg_chamadas_same_tenant_horario on public.chamadas;
  create trigger trg_chamadas_same_tenant_horario before insert or update of tenant_id, horario_id on public.chamadas
    for each row execute function public.enforce_same_tenant_uuid_fk('horarios', 'id', 'horario_id');

  drop trigger if exists trg_presencas_same_tenant_chamada on public.presencas;
  create trigger trg_presencas_same_tenant_chamada before insert or update of tenant_id, chamada_id on public.presencas
    for each row execute function public.enforce_same_tenant_uuid_fk('chamadas', 'id', 'chamada_id');

  drop trigger if exists trg_presencas_same_tenant_aluna on public.presencas;
  create trigger trg_presencas_same_tenant_aluna before insert or update of tenant_id, aluna_id on public.presencas
    for each row execute function public.enforce_same_tenant_uuid_fk('alunas', 'id', 'aluna_id');

  -- Custos e comercial
  drop trigger if exists trg_custos_same_tenant_turma on public.custos_turma;
  create trigger trg_custos_same_tenant_turma before insert or update of tenant_id, turma_id on public.custos_turma
    for each row execute function public.enforce_same_tenant_uuid_fk('turmas', 'id', 'turma_id');

  drop trigger if exists trg_custos_hist_same_tenant_custo on public.custos_turma_historico;
  create trigger trg_custos_hist_same_tenant_custo before insert or update of tenant_id, custo_id on public.custos_turma_historico
    for each row execute function public.enforce_same_tenant_uuid_fk('custos_turma', 'id', 'custo_id');

  drop trigger if exists trg_custos_hist_same_tenant_turma on public.custos_turma_historico;
  create trigger trg_custos_hist_same_tenant_turma before insert or update of tenant_id, turma_id on public.custos_turma_historico
    for each row execute function public.enforce_same_tenant_uuid_fk('turmas', 'id', 'turma_id');

  drop trigger if exists trg_blocos_same_tenant_turma on public.blocos_cobranca;
  create trigger trg_blocos_same_tenant_turma before insert or update of tenant_id, turma_id on public.blocos_cobranca
    for each row execute function public.enforce_same_tenant_uuid_fk('turmas', 'id', 'turma_id');

  drop trigger if exists trg_inscricoes_same_tenant_evento on public.inscricoes_evento;
  create trigger trg_inscricoes_same_tenant_evento before insert or update of tenant_id, evento_id on public.inscricoes_evento
    for each row execute function public.enforce_same_tenant_uuid_fk('eventos', 'id', 'evento_id');

  drop trigger if exists trg_inscricoes_same_tenant_aluna on public.inscricoes_evento;
  create trigger trg_inscricoes_same_tenant_aluna before insert or update of tenant_id, aluna_id on public.inscricoes_evento
    for each row execute function public.enforce_same_tenant_uuid_fk('alunas', 'id', 'aluna_id');
end $$;

-- Recria policies com fronteira tenant-aware.
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'tenants',
    'tenant_memberships',
    'perfis',
    'polos',
    'locais',
    'turmas',
    'horarios',
    'turmas_professoras',
    'responsaveis',
    'alunas',
    'pagamentos_mensalidade',
    'pagamentos_matricula',
    'pagamentos_professora',
    'chamadas',
    'presencas',
    'custos_turma',
    'custos_turma_historico',
    'blocos_cobranca',
    'produtos',
    'eventos',
    'inscricoes_evento',
    'pre_matriculas',
    'configuracoes'
  ] loop
    execute format('alter table public.%I enable row level security', tbl);
  end loop;
end $$;

-- Drop explicito das policies antigas conhecidas. Mantemos nomes novos padronizados abaixo.
do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'alunas','blocos_cobranca','chamadas','configuracoes','custos_turma','custos_turma_historico',
        'eventos','horarios','inscricoes_evento','locais','pagamentos_matricula','pagamentos_mensalidade',
        'pagamentos_professora','perfis','polos','pre_matriculas','presencas','produtos','responsaveis',
        'turmas','turmas_professoras','tenants','tenant_memberships'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- Tenants e memberships
create policy tenants_select_member on public.tenants
  for select using (public.is_tenant_member(id));

create policy tenants_manage_owner on public.tenants
  for update using (public.tenant_role(id) = 'owner')
  with check (public.tenant_role(id) = 'owner');

create policy tenant_memberships_select on public.tenant_memberships
  for select using (user_id = auth.uid() or public.can_manage_tenant(tenant_id));

create policy tenant_memberships_manage on public.tenant_memberships
  for all using (public.can_manage_tenant(tenant_id))
  with check (public.can_manage_tenant(tenant_id));

-- Perfis
create policy perfis_select_tenant on public.perfis
  for select using (id = auth.uid() or public.can_manage_tenant(tenant_id));

create policy perfis_insert_admin on public.perfis
  for insert with check (public.can_manage_tenant(tenant_id));

create policy perfis_update_admin_or_self on public.perfis
  for update using (id = auth.uid() or public.can_manage_tenant(tenant_id))
  with check (id = auth.uid() or public.can_manage_tenant(tenant_id));

create policy perfis_delete_admin on public.perfis
  for delete using (public.can_manage_tenant(tenant_id));

-- Admin-managed generic tables
create policy polos_admin_all on public.polos for all using (public.can_manage_tenant(tenant_id)) with check (public.can_manage_tenant(tenant_id));
create policy locais_admin_all on public.locais for all using (public.can_manage_tenant(tenant_id)) with check (public.can_manage_tenant(tenant_id));
create policy produtos_admin_all on public.produtos for all using (public.can_manage_tenant(tenant_id)) with check (public.can_manage_tenant(tenant_id));
create policy eventos_admin_all on public.eventos for all using (public.can_manage_tenant(tenant_id)) with check (public.can_manage_tenant(tenant_id));
create policy configuracoes_admin_all on public.configuracoes for all using (public.can_manage_tenant(tenant_id)) with check (public.can_manage_tenant(tenant_id));
create policy pre_matriculas_admin_all on public.pre_matriculas for all using (public.can_manage_tenant(tenant_id)) with check (public.can_manage_tenant(tenant_id));
create policy inscricoes_evento_admin_all on public.inscricoes_evento for all using (public.can_manage_tenant(tenant_id)) with check (public.can_manage_tenant(tenant_id));
create policy custos_turma_admin_all on public.custos_turma for all using (public.can_manage_tenant(tenant_id)) with check (public.can_manage_tenant(tenant_id));
create policy custos_turma_historico_admin_all on public.custos_turma_historico for all using (public.can_manage_tenant(tenant_id)) with check (public.can_manage_tenant(tenant_id));
create policy blocos_cobranca_admin_all on public.blocos_cobranca for all using (public.can_manage_tenant(tenant_id)) with check (public.can_manage_tenant(tenant_id));

-- Responsaveis: admin gerencia, professora le responsaveis de alunas das suas turmas.
create policy responsaveis_admin_all on public.responsaveis
  for all using (public.can_manage_tenant(tenant_id))
  with check (public.can_manage_tenant(tenant_id));

create policy responsaveis_select_professora on public.responsaveis
  for select using (
    exists (
      select 1
      from public.alunas a
      join public.turmas_professoras tp on tp.turma_id = a.turma_id and tp.tenant_id = a.tenant_id
      where a.responsavel_id = responsaveis.id
        and a.tenant_id = responsaveis.tenant_id
        and tp.professora_id = auth.uid()
    )
  );

-- Turmas e dependencias visiveis para professoras vinculadas.
create policy turmas_admin_all on public.turmas
  for all using (public.can_manage_tenant(tenant_id))
  with check (public.can_manage_tenant(tenant_id));

create policy turmas_select_professora on public.turmas
  for select using (
    exists (
      select 1 from public.turmas_professoras tp
      where tp.turma_id = turmas.id
        and tp.tenant_id = turmas.tenant_id
        and tp.professora_id = auth.uid()
    )
  );

create policy horarios_admin_all on public.horarios
  for all using (public.can_manage_tenant(tenant_id))
  with check (public.can_manage_tenant(tenant_id));

create policy horarios_select_professora on public.horarios
  for select using (
    exists (
      select 1 from public.turmas_professoras tp
      where tp.turma_id = horarios.turma_id
        and tp.tenant_id = horarios.tenant_id
        and tp.professora_id = auth.uid()
    )
  );

create policy turmas_professoras_admin_all on public.turmas_professoras
  for all using (public.can_manage_tenant(tenant_id))
  with check (public.can_manage_tenant(tenant_id));

create policy turmas_professoras_select_self on public.turmas_professoras
  for select using (professora_id = auth.uid() and public.is_tenant_member(tenant_id));

-- Alunas e pagamentos.
create policy alunas_admin_all on public.alunas
  for all using (public.can_manage_tenant(tenant_id))
  with check (public.can_manage_tenant(tenant_id));

create policy alunas_select_professora on public.alunas
  for select using (
    exists (
      select 1 from public.turmas_professoras tp
      where tp.turma_id = alunas.turma_id
        and tp.tenant_id = alunas.tenant_id
        and tp.professora_id = auth.uid()
    )
  );

create policy pagmens_admin_all on public.pagamentos_mensalidade
  for all using (public.can_manage_tenant(tenant_id))
  with check (public.can_manage_tenant(tenant_id));

create policy pagmens_select_professora on public.pagamentos_mensalidade
  for select using (
    exists (
      select 1
      from public.alunas a
      join public.turmas_professoras tp on tp.turma_id = a.turma_id and tp.tenant_id = a.tenant_id
      where a.id = pagamentos_mensalidade.aluna_id
        and a.tenant_id = pagamentos_mensalidade.tenant_id
        and tp.professora_id = auth.uid()
    )
  );

create policy pagmat_admin_all on public.pagamentos_matricula
  for all using (public.can_manage_tenant(tenant_id))
  with check (public.can_manage_tenant(tenant_id));

create policy pagmat_select_professora on public.pagamentos_matricula
  for select using (
    exists (
      select 1
      from public.alunas a
      join public.turmas_professoras tp on tp.turma_id = a.turma_id and tp.tenant_id = a.tenant_id
      where a.id = pagamentos_matricula.aluna_id
        and a.tenant_id = pagamentos_matricula.tenant_id
        and tp.professora_id = auth.uid()
    )
  );

create policy pagprof_admin_all on public.pagamentos_professora
  for all using (public.can_manage_tenant(tenant_id))
  with check (public.can_manage_tenant(tenant_id));

create policy pagprof_select_self on public.pagamentos_professora
  for select using (professora_id = auth.uid() and public.is_tenant_member(tenant_id));

-- Chamadas e presencas.
create policy chamadas_admin_all on public.chamadas
  for all using (public.can_manage_tenant(tenant_id))
  with check (public.can_manage_tenant(tenant_id));

create policy chamadas_professora_select on public.chamadas
  for select using (professora_id = auth.uid() and public.is_tenant_member(tenant_id));

create policy chamadas_professora_insert on public.chamadas
  for insert with check (professora_id = auth.uid() and public.is_tenant_member(tenant_id));

create policy chamadas_professora_update on public.chamadas
  for update using (professora_id = auth.uid() and public.is_tenant_member(tenant_id))
  with check (professora_id = auth.uid() and public.is_tenant_member(tenant_id));

create policy presencas_admin_all on public.presencas
  for all using (public.can_manage_tenant(tenant_id))
  with check (public.can_manage_tenant(tenant_id));

create policy presencas_professora_select on public.presencas
  for select using (
    exists (
      select 1 from public.chamadas c
      where c.id = presencas.chamada_id
        and c.tenant_id = presencas.tenant_id
        and c.professora_id = auth.uid()
    )
  );

create policy presencas_professora_insert on public.presencas
  for insert with check (
    exists (
      select 1 from public.chamadas c
      where c.id = presencas.chamada_id
        and c.tenant_id = presencas.tenant_id
        and c.professora_id = auth.uid()
    )
  );

create policy presencas_professora_update on public.presencas
  for update using (
    exists (
      select 1 from public.chamadas c
      where c.id = presencas.chamada_id
        and c.tenant_id = presencas.tenant_id
        and c.professora_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.chamadas c
      where c.id = presencas.chamada_id
        and c.tenant_id = presencas.tenant_id
        and c.professora_id = auth.uid()
    )
  );

-- Trigger de novos usuarios agora tambem grava tenant inicial e membership.
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
begin
  metadata_tenant := nullif(new.raw_user_meta_data->>'tenant_id', '');

  begin
    target_tenant := coalesce(metadata_tenant::uuid, public.default_tenant_id());
  exception when invalid_text_representation then
    target_tenant := public.default_tenant_id();
  end;

  target_role := case
    when coalesce(nullif(new.raw_user_meta_data->>'papel', ''), 'admin') = 'admin' then 'owner'
    when coalesce(nullif(new.raw_user_meta_data->>'papel', ''), 'admin') = 'professora' then 'professora'
    else 'colaborador'
  end;

  insert into public.perfis (id, tenant_id, nome, papel, username, email)
  values (
    new.id,
    target_tenant,
    coalesce(nullif(new.raw_user_meta_data->>'nome', ''), new.email),
    coalesce(nullif(new.raw_user_meta_data->>'papel', ''), 'admin'),
    nullif(new.raw_user_meta_data->>'username', ''),
    new.email
  )
  on conflict (id) do update set
    email = excluded.email,
    tenant_id = coalesce(public.perfis.tenant_id, excluded.tenant_id),
    papel = coalesce(nullif(new.raw_user_meta_data->>'papel', ''), public.perfis.papel),
    username = coalesce(excluded.username, public.perfis.username),
    nome = case
      when public.perfis.nome = '' or public.perfis.nome is null then excluded.nome
      else public.perfis.nome
    end;

  insert into public.tenant_memberships (tenant_id, user_id, role, status, is_default)
  values (target_tenant, new.id, target_role, 'ativo', true)
  on conflict (tenant_id, user_id) do update set
    role = excluded.role,
    status = excluded.status,
    is_default = true,
    atualizado_em = now();

  return new;
end;
$$;

commit;
