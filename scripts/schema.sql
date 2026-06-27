


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."calcular_salario_professora"("p_professora_id" "uuid", "p_mes" "text") RETURNS numeric
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select coalesce(sum(
    case
      when tp.tipo_pagamento = 'fixo' then tp.valor
      else (
        select coalesce(sum(pm.valor), 0) * tp.valor / 100
        from public.pagamentos_mensalidade pm
        join public.alunas a on a.id = pm.aluna_id
        where a.turma_id = tp.turma_id
          and pm.mes_referencia = p_mes
          and pm.status = 'Pago'
      )
    end
  ), 0)
  from public.turmas_professoras tp
  where tp.professora_id = p_professora_id;
$$;


ALTER FUNCTION "public"."calcular_salario_professora"("p_professora_id" "uuid", "p_mes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calcular_valor_mensalidade"("p_turma_id" "uuid", "p_data" "date" DEFAULT CURRENT_DATE) RETURNS numeric
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select coalesce(
    (
      select valor
      from public.blocos_cobranca
      where turma_id = p_turma_id
        and dia_limite >= extract(day from p_data)::integer
      order by dia_limite asc
      limit 1
    ),
    (select mensalidade from public.turmas where id = p_turma_id)
  );
$$;


ALTER FUNCTION "public"."calcular_valor_mensalidade"("p_turma_id" "uuid", "p_data" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."eh_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.perfis
    where id = auth.uid()
      and papel = 'admin'
      and ativo = true
  );
$$;


ALTER FUNCTION "public"."eh_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."eh_professora"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select exists (
    select 1 from public.perfis
    where id = auth.uid() and papel = 'professora' and ativo = true
  );
$$;


ALTER FUNCTION "public"."eh_professora"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_novo_usuario"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.perfis (id, nome, papel, username, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'nome', ''), new.email),
    coalesce(nullif(new.raw_user_meta_data->>'papel', ''), 'admin'),
    nullif(new.raw_user_meta_data->>'username', ''),
    new.email
  )
  on conflict (id) do update set
    email = excluded.email,
    papel = coalesce(nullif(new.raw_user_meta_data->>'papel', ''), public.perfis.papel),
    username = coalesce(excluded.username, public.perfis.username),
    nome = case
      when public.perfis.nome = '' or public.perfis.nome is null then excluded.nome
      else public.perfis.nome
    end;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_novo_usuario"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."alunas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "data_nascimento" "date" NOT NULL,
    "turma_id" "uuid",
    "responsavel_id" "uuid",
    "logradouro" "text",
    "numero" "text",
    "complemento" "text",
    "bairro" "text",
    "cidade" "text",
    "estado" "text",
    "cep" "text",
    "status" "text" DEFAULT 'Ativa'::"text" NOT NULL,
    "taxa_matricula_paga" boolean DEFAULT false NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cpf_aluna" "text",
    "desconto_percentual" numeric(5,2) DEFAULT 0 NOT NULL,
    CONSTRAINT "alunas_desconto_percentual_chk" CHECK ((("desconto_percentual" >= (0)::numeric) AND ("desconto_percentual" <= (100)::numeric))),
    CONSTRAINT "alunas_status_check" CHECK (("status" = ANY (ARRAY['Ativa'::"text", 'Trancada'::"text"])))
);


ALTER TABLE "public"."alunas" OWNER TO "postgres";


COMMENT ON COLUMN "public"."alunas"."desconto_percentual" IS 'Desconto percentual da aluna sobre mensalidade base da turma (0 a 100).';



CREATE TABLE IF NOT EXISTS "public"."blocos_cobranca" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "turma_id" "uuid" NOT NULL,
    "dia_limite" integer NOT NULL,
    "valor" numeric(10,2) DEFAULT 0 NOT NULL,
    "ordem" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "blocos_cobranca_dia_limite_check" CHECK ((("dia_limite" >= 1) AND ("dia_limite" <= 31)))
);


ALTER TABLE "public"."blocos_cobranca" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chamadas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "turma_id" "uuid" NOT NULL,
    "professora_id" "uuid" NOT NULL,
    "horario_id" "uuid",
    "data" "date" NOT NULL,
    "encerrada" boolean DEFAULT false NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chamadas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."configuracoes" (
    "id" integer DEFAULT 1 NOT NULL,
    "cora_client_id" "text" DEFAULT ''::"text",
    "cora_client_secret" "text" DEFAULT ''::"text",
    "cora_ambiente" "text" DEFAULT 'sandbox'::"text",
    "cora_webhook_url" "text" DEFAULT ''::"text",
    "cora_ativo" boolean DEFAULT false,
    "chave_pix" "text" DEFAULT ''::"text",
    "tipo_chave_pix" "text" DEFAULT 'CNPJ'::"text",
    "whatsapp_admin" "text" DEFAULT ''::"text",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "configuracoes_cora_ambiente_check" CHECK (("cora_ambiente" = ANY (ARRAY['sandbox'::"text", 'producao'::"text"]))),
    CONSTRAINT "configuracoes_id_check" CHECK (("id" = 1)),
    CONSTRAINT "configuracoes_tipo_chave_pix_check" CHECK (("tipo_chave_pix" = ANY (ARRAY['CPF'::"text", 'CNPJ'::"text", 'Email'::"text", 'Telefone'::"text", 'Aleatoria'::"text"])))
);


ALTER TABLE "public"."configuracoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custos_turma" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "turma_id" "uuid" NOT NULL,
    "descricao" "text" NOT NULL,
    "categoria" "text" DEFAULT 'Outro'::"text" NOT NULL,
    "tipo" "text" DEFAULT 'fixo'::"text" NOT NULL,
    "valor" numeric DEFAULT 0 NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "custos_turma_tipo_check" CHECK (("tipo" = ANY (ARRAY['fixo'::"text", 'percentual'::"text"])))
);


ALTER TABLE "public"."custos_turma" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custos_turma_historico" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "custo_id" "uuid" NOT NULL,
    "turma_id" "uuid" NOT NULL,
    "mes_referencia" "text" NOT NULL,
    "valor_calculado" numeric DEFAULT 0 NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."custos_turma_historico" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."eventos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "descricao" "text",
    "data_evento" "date" NOT NULL,
    "local" "text",
    "taxa_inscricao" numeric DEFAULT 0 NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."eventos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."horarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "turma_id" "uuid" NOT NULL,
    "dia_semana" "text" NOT NULL,
    "hora_inicio" time without time zone NOT NULL,
    "hora_fim" time without time zone NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "horarios_dia_semana_check" CHECK (("dia_semana" = ANY (ARRAY['Segunda'::"text", 'Terça'::"text", 'Quarta'::"text", 'Quinta'::"text", 'Sexta'::"text", 'Sábado'::"text", 'Domingo'::"text"])))
);


ALTER TABLE "public"."horarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inscricoes_evento" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "evento_id" "uuid" NOT NULL,
    "aluna_id" "uuid",
    "nome_aluna" "text" NOT NULL,
    "cpf_aluna" "text" NOT NULL,
    "turma" "text",
    "inscrito_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "pago" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."inscricoes_evento" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locais" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "polo_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "endereco" "text",
    "observacoes" "text",
    "ativo" boolean DEFAULT true NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."locais" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pagamentos_matricula" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "valor" numeric(10,2) NOT NULL,
    "status" "text" DEFAULT 'Pendente'::"text" NOT NULL,
    "data_pagamento" timestamp with time zone,
    "txid_cora" "text",
    "link_pagamento" "text",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "qr_code_base64" "text",
    "pago_em" timestamp with time zone,
    "aluna_id" "uuid",
    "turma_id" "uuid",
    "pix_status" "text",
    CONSTRAINT "pagamentos_matricula_status_check" CHECK (("status" = ANY (ARRAY['Pago'::"text", 'Pendente'::"text"])))
);


ALTER TABLE "public"."pagamentos_matricula" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pagamentos_mensalidade" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "mes_referencia" "text" NOT NULL,
    "valor" numeric(10,2) NOT NULL,
    "status" "text" DEFAULT 'Pendente'::"text" NOT NULL,
    "data_pagamento" timestamp with time zone,
    "txid_cora" "text",
    "link_pagamento" "text",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "qr_code_base64" "text",
    "pago_em" timestamp with time zone,
    "aluna_id" "uuid",
    "turma_id" "uuid",
    "pix_status" "text",
    CONSTRAINT "pagamentos_mensalidade_status_check" CHECK (("status" = ANY (ARRAY['Pago'::"text", 'Pendente'::"text"])))
);


ALTER TABLE "public"."pagamentos_mensalidade" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pagamentos_professora" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "professora_id" "uuid" NOT NULL,
    "mes_referencia" "text" NOT NULL,
    "valor" numeric(10,2) NOT NULL,
    "status" "text" DEFAULT 'Pendente'::"text" NOT NULL,
    "data_pagamento" timestamp with time zone,
    "observacoes" "text",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "turma_id" "uuid",
    "competencia_base" "text",
    CONSTRAINT "pagamentos_professora_status_check" CHECK (("status" = ANY (ARRAY['Pago'::"text", 'Pendente'::"text"])))
);


ALTER TABLE "public"."pagamentos_professora" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."perfis" (
    "id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "papel" "text" NOT NULL,
    "username" "text",
    "ativo" boolean DEFAULT true NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text",
    CONSTRAINT "perfis_papel_check" CHECK (("papel" = ANY (ARRAY['admin'::"text", 'colaborador'::"text", 'professora'::"text"])))
);


ALTER TABLE "public"."perfis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."polos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "cidade" "text" NOT NULL,
    "observacoes" "text",
    "ativo" boolean DEFAULT true NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."polos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pre_matriculas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome_aluna" "text" NOT NULL,
    "data_nascimento" "date" NOT NULL,
    "nome_responsavel" "text" NOT NULL,
    "cpf_responsavel" "text",
    "telefone" "text",
    "whatsapp" "text",
    "email" "text" NOT NULL,
    "logradouro" "text",
    "numero" "text",
    "complemento" "text",
    "bairro" "text",
    "cidade" "text",
    "estado" "text",
    "cep" "text",
    "observacoes" "text",
    "status" "text" DEFAULT 'pendente'::"text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cpf_aluna" "text",
    CONSTRAINT "pre_matriculas_status_check" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'aprovada'::"text", 'recusada'::"text"])))
);


ALTER TABLE "public"."pre_matriculas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."presencas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chamada_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "observacao" "text",
    "aluna_id" "uuid",
    CONSTRAINT "presencas_status_check" CHECK (("status" = ANY (ARRAY['presente'::"text", 'ausente'::"text", 'justificada'::"text"])))
);


ALTER TABLE "public"."presencas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."produtos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "descricao" "text",
    "valor" numeric(10,2) NOT NULL,
    "categoria" "text" NOT NULL,
    "disponivel" boolean DEFAULT true NOT NULL,
    "tamanhos" "text"[],
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "produtos_categoria_check" CHECK (("categoria" = ANY (ARRAY['Roupa'::"text", 'Sapatilha'::"text", 'Equipamento'::"text", 'Uniforme'::"text", 'Acessório'::"text", 'Outro'::"text"])))
);


ALTER TABLE "public"."produtos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."responsaveis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "cpf" "text",
    "telefone" "text",
    "whatsapp" "text",
    "email" "text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."responsaveis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."turmas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "polo_id" "uuid" NOT NULL,
    "local_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "nivel" "text" NOT NULL,
    "mensalidade" numeric(10,2) DEFAULT 0 NOT NULL,
    "taxa_matricula" numeric(10,2) DEFAULT 0 NOT NULL,
    "idade_alvo" "text",
    "ativo" boolean DEFAULT true NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "acrescimo" numeric DEFAULT 0 NOT NULL,
    CONSTRAINT "turmas_nivel_check" CHECK (("nivel" = ANY (ARRAY['Iniciante 1'::"text", 'Iniciante 2'::"text", 'Intermediário'::"text", 'Avançado'::"text"])))
);


ALTER TABLE "public"."turmas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."turmas_professoras" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "turma_id" "uuid" NOT NULL,
    "professora_id" "uuid" NOT NULL,
    "tipo_pagamento" "text" NOT NULL,
    "valor" numeric(10,2) DEFAULT 0 NOT NULL,
    CONSTRAINT "turmas_professoras_tipo_pagamento_check" CHECK (("tipo_pagamento" = ANY (ARRAY['fixo'::"text", 'percentual'::"text"])))
);


ALTER TABLE "public"."turmas_professoras" OWNER TO "postgres";


ALTER TABLE ONLY "public"."alunas"
    ADD CONSTRAINT "alunas_cpf_key" UNIQUE ("cpf_aluna");



ALTER TABLE ONLY "public"."alunas"
    ADD CONSTRAINT "alunas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blocos_cobranca"
    ADD CONSTRAINT "blocos_cobranca_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chamadas"
    ADD CONSTRAINT "chamadas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chamadas"
    ADD CONSTRAINT "chamadas_turma_id_data_horario_id_key" UNIQUE ("turma_id", "data", "horario_id");



ALTER TABLE ONLY "public"."configuracoes"
    ADD CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custos_turma_historico"
    ADD CONSTRAINT "custos_turma_historico_custo_id_mes_referencia_key" UNIQUE ("custo_id", "mes_referencia");



ALTER TABLE ONLY "public"."custos_turma_historico"
    ADD CONSTRAINT "custos_turma_historico_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custos_turma"
    ADD CONSTRAINT "custos_turma_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."eventos"
    ADD CONSTRAINT "eventos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."horarios"
    ADD CONSTRAINT "horarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inscricoes_evento"
    ADD CONSTRAINT "inscricoes_evento_evento_id_cpf_aluna_key" UNIQUE ("evento_id", "cpf_aluna");



ALTER TABLE ONLY "public"."inscricoes_evento"
    ADD CONSTRAINT "inscricoes_evento_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locais"
    ADD CONSTRAINT "locais_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pagamentos_matricula"
    ADD CONSTRAINT "pagamentos_matricula_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pagamentos_mensalidade"
    ADD CONSTRAINT "pagamentos_mensalidade_aluna_mes_unique" UNIQUE ("aluna_id", "mes_referencia");



ALTER TABLE ONLY "public"."pagamentos_mensalidade"
    ADD CONSTRAINT "pagamentos_mensalidade_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pagamentos_professora"
    ADD CONSTRAINT "pagamentos_professora_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pagamentos_professora"
    ADD CONSTRAINT "pagamentos_professora_professora_id_mes_referencia_key" UNIQUE ("professora_id", "mes_referencia");



ALTER TABLE ONLY "public"."perfis"
    ADD CONSTRAINT "perfis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."perfis"
    ADD CONSTRAINT "perfis_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."polos"
    ADD CONSTRAINT "polos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pre_matriculas"
    ADD CONSTRAINT "pre_matriculas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."presencas"
    ADD CONSTRAINT "presencas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."produtos"
    ADD CONSTRAINT "produtos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."responsaveis"
    ADD CONSTRAINT "responsaveis_cpf_key" UNIQUE ("cpf");



ALTER TABLE ONLY "public"."responsaveis"
    ADD CONSTRAINT "responsaveis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."turmas"
    ADD CONSTRAINT "turmas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."turmas_professoras"
    ADD CONSTRAINT "turmas_professoras_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."turmas_professoras"
    ADD CONSTRAINT "turmas_professoras_turma_id_professora_id_key" UNIQUE ("turma_id", "professora_id");



CREATE INDEX "idx_alunas_responsavel" ON "public"."alunas" USING "btree" ("responsavel_id");



CREATE INDEX "idx_alunas_turma" ON "public"."alunas" USING "btree" ("turma_id");



CREATE INDEX "idx_blocos_turma" ON "public"."blocos_cobranca" USING "btree" ("turma_id");



CREATE INDEX "idx_chamadas_data" ON "public"."chamadas" USING "btree" ("data");



CREATE INDEX "idx_chamadas_prof" ON "public"."chamadas" USING "btree" ("professora_id");



CREATE INDEX "idx_chamadas_turma" ON "public"."chamadas" USING "btree" ("turma_id");



CREATE INDEX "idx_custos_historico_custo" ON "public"."custos_turma_historico" USING "btree" ("custo_id");



CREATE INDEX "idx_custos_historico_mes" ON "public"."custos_turma_historico" USING "btree" ("mes_referencia");



CREATE INDEX "idx_custos_historico_turma" ON "public"."custos_turma_historico" USING "btree" ("turma_id");



CREATE INDEX "idx_custos_turma_turma" ON "public"."custos_turma" USING "btree" ("turma_id");



CREATE INDEX "idx_eventos_data" ON "public"."eventos" USING "btree" ("data_evento");



CREATE INDEX "idx_horarios_turma" ON "public"."horarios" USING "btree" ("turma_id");



CREATE INDEX "idx_inscricoes_evento_cpf" ON "public"."inscricoes_evento" USING "btree" ("cpf_aluna");



CREATE INDEX "idx_inscricoes_evento_evento_id" ON "public"."inscricoes_evento" USING "btree" ("evento_id");



CREATE INDEX "idx_locais_polo" ON "public"."locais" USING "btree" ("polo_id");



CREATE INDEX "idx_pm_mes" ON "public"."pagamentos_mensalidade" USING "btree" ("mes_referencia");



CREATE INDEX "idx_pm_status" ON "public"."pagamentos_mensalidade" USING "btree" ("status");



CREATE INDEX "idx_pm_status_txid_cora" ON "public"."pagamentos_mensalidade" USING "btree" ("status", "txid_cora");



CREATE INDEX "idx_pm_txid_cora" ON "public"."pagamentos_mensalidade" USING "btree" ("txid_cora");



CREATE INDEX "idx_pmat_status_txid_cora" ON "public"."pagamentos_matricula" USING "btree" ("status", "txid_cora");



CREATE INDEX "idx_pmt_txid_cora" ON "public"."pagamentos_matricula" USING "btree" ("txid_cora");



CREATE INDEX "idx_pp_mes" ON "public"."pagamentos_professora" USING "btree" ("mes_referencia");



CREATE INDEX "idx_pp_professora" ON "public"."pagamentos_professora" USING "btree" ("professora_id");



CREATE INDEX "idx_pre_matriculas_status" ON "public"."pre_matriculas" USING "btree" ("status");



CREATE INDEX "idx_presencas_chamada" ON "public"."presencas" USING "btree" ("chamada_id");



CREATE INDEX "idx_resp_cpf" ON "public"."responsaveis" USING "btree" ("cpf");



CREATE INDEX "idx_resp_email" ON "public"."responsaveis" USING "btree" ("email");



CREATE INDEX "idx_tp_professora" ON "public"."turmas_professoras" USING "btree" ("professora_id");



CREATE INDEX "idx_tp_turma" ON "public"."turmas_professoras" USING "btree" ("turma_id");



CREATE INDEX "idx_turmas_local" ON "public"."turmas" USING "btree" ("local_id");



CREATE INDEX "idx_turmas_polo" ON "public"."turmas" USING "btree" ("polo_id");



ALTER TABLE ONLY "public"."alunas"
    ADD CONSTRAINT "alunas_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "public"."responsaveis"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."alunas"
    ADD CONSTRAINT "alunas_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "public"."turmas"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."blocos_cobranca"
    ADD CONSTRAINT "blocos_cobranca_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "public"."turmas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chamadas"
    ADD CONSTRAINT "chamadas_horario_id_fkey" FOREIGN KEY ("horario_id") REFERENCES "public"."horarios"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chamadas"
    ADD CONSTRAINT "chamadas_professora_id_fkey" FOREIGN KEY ("professora_id") REFERENCES "public"."perfis"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chamadas"
    ADD CONSTRAINT "chamadas_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "public"."turmas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custos_turma_historico"
    ADD CONSTRAINT "custos_turma_historico_custo_id_fkey" FOREIGN KEY ("custo_id") REFERENCES "public"."custos_turma"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custos_turma_historico"
    ADD CONSTRAINT "custos_turma_historico_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "public"."turmas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custos_turma"
    ADD CONSTRAINT "custos_turma_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "public"."turmas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."horarios"
    ADD CONSTRAINT "horarios_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "public"."turmas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inscricoes_evento"
    ADD CONSTRAINT "inscricoes_evento_aluna_id_fkey" FOREIGN KEY ("aluna_id") REFERENCES "public"."alunas"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inscricoes_evento"
    ADD CONSTRAINT "inscricoes_evento_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."locais"
    ADD CONSTRAINT "locais_polo_id_fkey" FOREIGN KEY ("polo_id") REFERENCES "public"."polos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pagamentos_matricula"
    ADD CONSTRAINT "pagamentos_matricula_aluna_id_fkey" FOREIGN KEY ("aluna_id") REFERENCES "public"."alunas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pagamentos_matricula"
    ADD CONSTRAINT "pagamentos_matricula_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "public"."turmas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pagamentos_mensalidade"
    ADD CONSTRAINT "pagamentos_mensalidade_aluna_id_fkey" FOREIGN KEY ("aluna_id") REFERENCES "public"."alunas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pagamentos_mensalidade"
    ADD CONSTRAINT "pagamentos_mensalidade_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "public"."turmas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pagamentos_professora"
    ADD CONSTRAINT "pagamentos_professora_professora_id_fkey" FOREIGN KEY ("professora_id") REFERENCES "public"."perfis"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pagamentos_professora"
    ADD CONSTRAINT "pagamentos_professora_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "public"."turmas"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."perfis"
    ADD CONSTRAINT "perfis_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."presencas"
    ADD CONSTRAINT "presencas_aluna_id_fkey" FOREIGN KEY ("aluna_id") REFERENCES "public"."alunas"("id") ON DELETE SET DEFAULT;



ALTER TABLE ONLY "public"."presencas"
    ADD CONSTRAINT "presencas_chamada_id_fkey" FOREIGN KEY ("chamada_id") REFERENCES "public"."chamadas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."turmas"
    ADD CONSTRAINT "turmas_local_id_fkey" FOREIGN KEY ("local_id") REFERENCES "public"."locais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."turmas"
    ADD CONSTRAINT "turmas_polo_id_fkey" FOREIGN KEY ("polo_id") REFERENCES "public"."polos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."turmas_professoras"
    ADD CONSTRAINT "turmas_professoras_professora_id_fkey" FOREIGN KEY ("professora_id") REFERENCES "public"."perfis"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."turmas_professoras"
    ADD CONSTRAINT "turmas_professoras_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "public"."turmas"("id") ON DELETE CASCADE;



CREATE POLICY "admin_all_custos_historico" ON "public"."custos_turma_historico" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."perfis"
  WHERE (("perfis"."id" = "auth"."uid"()) AND ("perfis"."papel" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."perfis"
  WHERE (("perfis"."id" = "auth"."uid"()) AND ("perfis"."papel" = 'admin'::"text")))));



ALTER TABLE "public"."alunas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "alunas_admin" ON "public"."alunas" USING ("public"."eh_admin"());



CREATE POLICY "alunas_professora" ON "public"."alunas" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."turmas_professoras" "tp"
  WHERE (("tp"."turma_id" = "alunas"."turma_id") AND ("tp"."professora_id" = "auth"."uid"())))));



ALTER TABLE "public"."blocos_cobranca" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "blocos_delete" ON "public"."blocos_cobranca" FOR DELETE USING ("public"."eh_admin"());



CREATE POLICY "blocos_insert" ON "public"."blocos_cobranca" FOR INSERT WITH CHECK ("public"."eh_admin"());



CREATE POLICY "blocos_select" ON "public"."blocos_cobranca" FOR SELECT USING (true);



CREATE POLICY "blocos_update" ON "public"."blocos_cobranca" FOR UPDATE USING ("public"."eh_admin"());



ALTER TABLE "public"."chamadas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "chamadas_delete" ON "public"."chamadas" FOR DELETE USING ("public"."eh_admin"());



CREATE POLICY "chamadas_insert" ON "public"."chamadas" FOR INSERT WITH CHECK (("public"."eh_admin"() OR "public"."eh_professora"()));



CREATE POLICY "chamadas_select" ON "public"."chamadas" FOR SELECT USING (("public"."eh_admin"() OR ("professora_id" = "auth"."uid"())));



CREATE POLICY "chamadas_update" ON "public"."chamadas" FOR UPDATE USING (("public"."eh_admin"() OR ("professora_id" = "auth"."uid"())));



CREATE POLICY "conf_insert" ON "public"."configuracoes" FOR INSERT TO "authenticated" WITH CHECK ("public"."eh_admin"());



CREATE POLICY "conf_select" ON "public"."configuracoes" FOR SELECT USING ("public"."eh_admin"());



CREATE POLICY "conf_update" ON "public"."configuracoes" FOR UPDATE USING ("public"."eh_admin"());



ALTER TABLE "public"."configuracoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "custos_admin" ON "public"."custos_turma" USING ("public"."eh_admin"());



ALTER TABLE "public"."custos_turma" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custos_turma_historico" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."eventos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "eventos_admin" ON "public"."eventos" USING (true) WITH CHECK (true);



ALTER TABLE "public"."horarios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "horarios_delete" ON "public"."horarios" FOR DELETE USING ("public"."eh_admin"());



CREATE POLICY "horarios_insert" ON "public"."horarios" FOR INSERT WITH CHECK ("public"."eh_admin"());



CREATE POLICY "horarios_select_admin" ON "public"."horarios" FOR SELECT USING ("public"."eh_admin"());



CREATE POLICY "horarios_select_prof" ON "public"."horarios" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."turmas_professoras" "tp"
  WHERE (("tp"."turma_id" = "tp"."turma_id") AND ("tp"."professora_id" = "auth"."uid"())))));



CREATE POLICY "horarios_update" ON "public"."horarios" FOR UPDATE USING ("public"."eh_admin"());



CREATE POLICY "inscricoes_admin" ON "public"."inscricoes_evento" USING (true) WITH CHECK (true);



ALTER TABLE "public"."inscricoes_evento" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."locais" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "locais_delete" ON "public"."locais" FOR DELETE USING ("public"."eh_admin"());



CREATE POLICY "locais_insert" ON "public"."locais" FOR INSERT WITH CHECK ("public"."eh_admin"());



CREATE POLICY "locais_select" ON "public"."locais" FOR SELECT USING (true);



CREATE POLICY "locais_update" ON "public"."locais" FOR UPDATE USING ("public"."eh_admin"());



ALTER TABLE "public"."pagamentos_matricula" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pagamentos_mensalidade" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pagamentos_professora" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pagmat_delete" ON "public"."pagamentos_matricula" FOR DELETE USING ("public"."eh_admin"());



CREATE POLICY "pagmat_insert" ON "public"."pagamentos_matricula" FOR INSERT WITH CHECK ("public"."eh_admin"());



CREATE POLICY "pagmat_select" ON "public"."pagamentos_matricula" FOR SELECT USING (true);



CREATE POLICY "pagmat_update" ON "public"."pagamentos_matricula" FOR UPDATE USING ("public"."eh_admin"());



CREATE POLICY "pagmens_delete" ON "public"."pagamentos_mensalidade" FOR DELETE USING ("public"."eh_admin"());



CREATE POLICY "pagmens_insert" ON "public"."pagamentos_mensalidade" FOR INSERT WITH CHECK ("public"."eh_admin"());



CREATE POLICY "pagmens_select" ON "public"."pagamentos_mensalidade" FOR SELECT USING (true);



CREATE POLICY "pagmens_update" ON "public"."pagamentos_mensalidade" FOR UPDATE USING ("public"."eh_admin"());



CREATE POLICY "pagprof_delete" ON "public"."pagamentos_professora" FOR DELETE USING ("public"."eh_admin"());



CREATE POLICY "pagprof_insert" ON "public"."pagamentos_professora" FOR INSERT WITH CHECK ("public"."eh_admin"());



CREATE POLICY "pagprof_select" ON "public"."pagamentos_professora" FOR SELECT USING (("public"."eh_admin"() OR ("professora_id" = "auth"."uid"())));



CREATE POLICY "pagprof_update" ON "public"."pagamentos_professora" FOR UPDATE USING ("public"."eh_admin"());



ALTER TABLE "public"."perfis" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "perfis_delete_admin" ON "public"."perfis" FOR DELETE USING ("public"."eh_admin"());



CREATE POLICY "perfis_insert_admin" ON "public"."perfis" FOR INSERT WITH CHECK ("public"."eh_admin"());



CREATE POLICY "perfis_select" ON "public"."perfis" FOR SELECT USING ((("auth"."uid"() = "id") OR "public"."eh_admin"()));



CREATE POLICY "perfis_select_admin" ON "public"."perfis" FOR SELECT TO "authenticated" USING ("public"."eh_admin"());



CREATE POLICY "perfis_select_own" ON "public"."perfis" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "perfis_update_admin" ON "public"."perfis" FOR UPDATE USING ((("auth"."uid"() = "id") OR "public"."eh_admin"()));



CREATE POLICY "pm_delete" ON "public"."pre_matriculas" FOR DELETE USING ("public"."eh_admin"());



CREATE POLICY "pm_insert" ON "public"."pre_matriculas" FOR INSERT WITH CHECK (true);



CREATE POLICY "pm_pre_admin" ON "public"."pre_matriculas" USING ("public"."eh_admin"());



CREATE POLICY "pm_pre_insert" ON "public"."pre_matriculas" FOR INSERT WITH CHECK (true);



CREATE POLICY "pm_select" ON "public"."pre_matriculas" FOR SELECT USING ("public"."eh_admin"());



CREATE POLICY "pm_update" ON "public"."pre_matriculas" FOR UPDATE USING ("public"."eh_admin"());



ALTER TABLE "public"."polos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "polos_delete" ON "public"."polos" FOR DELETE USING ("public"."eh_admin"());



CREATE POLICY "polos_insert" ON "public"."polos" FOR INSERT WITH CHECK ("public"."eh_admin"());



CREATE POLICY "polos_select" ON "public"."polos" FOR SELECT USING (true);



CREATE POLICY "polos_update" ON "public"."polos" FOR UPDATE USING ("public"."eh_admin"());



ALTER TABLE "public"."pre_matriculas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."presencas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "presencas_delete" ON "public"."presencas" FOR DELETE USING ("public"."eh_admin"());



CREATE POLICY "presencas_insert" ON "public"."presencas" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."chamadas" "c"
  WHERE (("c"."id" = "presencas"."chamada_id") AND ("public"."eh_admin"() OR ("c"."professora_id" = "auth"."uid"()))))));



CREATE POLICY "presencas_select" ON "public"."presencas" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."chamadas" "c"
  WHERE (("c"."id" = "presencas"."chamada_id") AND ("public"."eh_admin"() OR ("c"."professora_id" = "auth"."uid"()))))));



CREATE POLICY "presencas_update" ON "public"."presencas" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."chamadas" "c"
  WHERE (("c"."id" = "presencas"."chamada_id") AND ("public"."eh_admin"() OR ("c"."professora_id" = "auth"."uid"()))))));



CREATE POLICY "prod_delete" ON "public"."produtos" FOR DELETE USING ("public"."eh_admin"());



CREATE POLICY "prod_insert" ON "public"."produtos" FOR INSERT WITH CHECK ("public"."eh_admin"());



CREATE POLICY "prod_select" ON "public"."produtos" FOR SELECT USING (true);



CREATE POLICY "prod_update" ON "public"."produtos" FOR UPDATE USING ("public"."eh_admin"());



ALTER TABLE "public"."produtos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "resp_admin" ON "public"."responsaveis" USING ("public"."eh_admin"());



CREATE POLICY "resp_leitura_publica" ON "public"."responsaveis" FOR SELECT USING (true);



ALTER TABLE "public"."responsaveis" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tp_delete" ON "public"."turmas_professoras" FOR DELETE USING ("public"."eh_admin"());



CREATE POLICY "tp_insert" ON "public"."turmas_professoras" FOR INSERT WITH CHECK ("public"."eh_admin"());



CREATE POLICY "tp_select" ON "public"."turmas_professoras" FOR SELECT USING (("public"."eh_admin"() OR ("professora_id" = "auth"."uid"())));



CREATE POLICY "tp_update" ON "public"."turmas_professoras" FOR UPDATE USING ("public"."eh_admin"());



ALTER TABLE "public"."turmas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "turmas_delete" ON "public"."turmas" FOR DELETE USING ("public"."eh_admin"());



CREATE POLICY "turmas_insert" ON "public"."turmas" FOR INSERT WITH CHECK ("public"."eh_admin"());



ALTER TABLE "public"."turmas_professoras" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "turmas_select_admin" ON "public"."turmas" FOR SELECT USING ("public"."eh_admin"());



CREATE POLICY "turmas_select_prof" ON "public"."turmas" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."turmas_professoras" "tp"
  WHERE (("tp"."turma_id" = "tp"."id") AND ("tp"."professora_id" = "auth"."uid"())))));



CREATE POLICY "turmas_update" ON "public"."turmas" FOR UPDATE USING ("public"."eh_admin"());





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."calcular_salario_professora"("p_professora_id" "uuid", "p_mes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."calcular_salario_professora"("p_professora_id" "uuid", "p_mes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calcular_salario_professora"("p_professora_id" "uuid", "p_mes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."calcular_valor_mensalidade"("p_turma_id" "uuid", "p_data" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calcular_valor_mensalidade"("p_turma_id" "uuid", "p_data" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calcular_valor_mensalidade"("p_turma_id" "uuid", "p_data" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."eh_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."eh_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."eh_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."eh_professora"() TO "anon";
GRANT ALL ON FUNCTION "public"."eh_professora"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."eh_professora"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_novo_usuario"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_novo_usuario"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_novo_usuario"() TO "service_role";


















GRANT ALL ON TABLE "public"."alunas" TO "anon";
GRANT ALL ON TABLE "public"."alunas" TO "authenticated";
GRANT ALL ON TABLE "public"."alunas" TO "service_role";



GRANT ALL ON TABLE "public"."blocos_cobranca" TO "anon";
GRANT ALL ON TABLE "public"."blocos_cobranca" TO "authenticated";
GRANT ALL ON TABLE "public"."blocos_cobranca" TO "service_role";



GRANT ALL ON TABLE "public"."chamadas" TO "anon";
GRANT ALL ON TABLE "public"."chamadas" TO "authenticated";
GRANT ALL ON TABLE "public"."chamadas" TO "service_role";



GRANT ALL ON TABLE "public"."configuracoes" TO "anon";
GRANT ALL ON TABLE "public"."configuracoes" TO "authenticated";
GRANT ALL ON TABLE "public"."configuracoes" TO "service_role";



GRANT ALL ON TABLE "public"."custos_turma" TO "anon";
GRANT ALL ON TABLE "public"."custos_turma" TO "authenticated";
GRANT ALL ON TABLE "public"."custos_turma" TO "service_role";



GRANT ALL ON TABLE "public"."custos_turma_historico" TO "anon";
GRANT ALL ON TABLE "public"."custos_turma_historico" TO "authenticated";
GRANT ALL ON TABLE "public"."custos_turma_historico" TO "service_role";



GRANT ALL ON TABLE "public"."eventos" TO "anon";
GRANT ALL ON TABLE "public"."eventos" TO "authenticated";
GRANT ALL ON TABLE "public"."eventos" TO "service_role";



GRANT ALL ON TABLE "public"."horarios" TO "anon";
GRANT ALL ON TABLE "public"."horarios" TO "authenticated";
GRANT ALL ON TABLE "public"."horarios" TO "service_role";



GRANT ALL ON TABLE "public"."inscricoes_evento" TO "anon";
GRANT ALL ON TABLE "public"."inscricoes_evento" TO "authenticated";
GRANT ALL ON TABLE "public"."inscricoes_evento" TO "service_role";



GRANT ALL ON TABLE "public"."locais" TO "anon";
GRANT ALL ON TABLE "public"."locais" TO "authenticated";
GRANT ALL ON TABLE "public"."locais" TO "service_role";



GRANT ALL ON TABLE "public"."pagamentos_matricula" TO "anon";
GRANT ALL ON TABLE "public"."pagamentos_matricula" TO "authenticated";
GRANT ALL ON TABLE "public"."pagamentos_matricula" TO "service_role";



GRANT ALL ON TABLE "public"."pagamentos_mensalidade" TO "anon";
GRANT ALL ON TABLE "public"."pagamentos_mensalidade" TO "authenticated";
GRANT ALL ON TABLE "public"."pagamentos_mensalidade" TO "service_role";



GRANT ALL ON TABLE "public"."pagamentos_professora" TO "anon";
GRANT ALL ON TABLE "public"."pagamentos_professora" TO "authenticated";
GRANT ALL ON TABLE "public"."pagamentos_professora" TO "service_role";



GRANT ALL ON TABLE "public"."perfis" TO "anon";
GRANT ALL ON TABLE "public"."perfis" TO "authenticated";
GRANT ALL ON TABLE "public"."perfis" TO "service_role";



GRANT ALL ON TABLE "public"."polos" TO "anon";
GRANT ALL ON TABLE "public"."polos" TO "authenticated";
GRANT ALL ON TABLE "public"."polos" TO "service_role";



GRANT ALL ON TABLE "public"."pre_matriculas" TO "anon";
GRANT ALL ON TABLE "public"."pre_matriculas" TO "authenticated";
GRANT ALL ON TABLE "public"."pre_matriculas" TO "service_role";



GRANT ALL ON TABLE "public"."presencas" TO "anon";
GRANT ALL ON TABLE "public"."presencas" TO "authenticated";
GRANT ALL ON TABLE "public"."presencas" TO "service_role";



GRANT ALL ON TABLE "public"."produtos" TO "anon";
GRANT ALL ON TABLE "public"."produtos" TO "authenticated";
GRANT ALL ON TABLE "public"."produtos" TO "service_role";



GRANT ALL ON TABLE "public"."responsaveis" TO "anon";
GRANT ALL ON TABLE "public"."responsaveis" TO "authenticated";
GRANT ALL ON TABLE "public"."responsaveis" TO "service_role";



GRANT ALL ON TABLE "public"."turmas" TO "anon";
GRANT ALL ON TABLE "public"."turmas" TO "authenticated";
GRANT ALL ON TABLE "public"."turmas" TO "service_role";



GRANT ALL ON TABLE "public"."turmas_professoras" TO "anon";
GRANT ALL ON TABLE "public"."turmas_professoras" TO "authenticated";
GRANT ALL ON TABLE "public"."turmas_professoras" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































