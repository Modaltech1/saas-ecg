# 09 - Fundacao Multi-Tenant

Este documento registra a fundacao estrutural para transformar o sistema em SaaS. Migrations sao criadas pelo projeto, mas nunca executadas por Codex.

## Regra de decisao

Este projeto deve ser conduzido com opiniao tecnica ativa, nao como execucao passiva de pedidos. Sempre que uma decisao ferir manutencao, extensibilidade, testabilidade, confiabilidade, disponibilidade, usabilidade, desempenho ou seguranca, a decisao deve ser questionada e registrada.

## Migration criada

Arquivo:

- `scripts/migrations/20260626_0001_multi_tenant_foundation.sql`

Ordem correta:

1. Rodar primeiro no banco de teste.
2. Validar login admin, login professora, dashboard, alunas, turmas, financeiro, produtos, eventos, pre-matricula e chamadas.
3. Validar que dados de um tenant nao aparecem em outro tenant.
4. So depois discutir qualquer plano de producao.

Regra permanente: Codex nao executa migrations, SQL, seeds, testes live contra Supabase real ou chamadas externas Cora.

## Modelo de dados

Novas tabelas:

| Tabela | Papel |
| --- | --- |
| `tenants` | Cliente/workspace do SaaS |
| `tenant_memberships` | Vinculo usuario x tenant com role por tenant |
| `tenant_account_signups` | Onboarding publico de novas contas SaaS |

Roles de membership:

- `owner`
- `admin`
- `colaborador`
- `professora`

Tenant legado criado pela migration:

| Campo | Valor |
| --- | --- |
| `id` | `00000000-0000-0000-0000-000000000001` |
| `slug` | `ecg` |
| `nome` | `Equipe Carolina Garcia` |
| `plano` | `legacy` |

Tabelas de dominio passam a ter `tenant_id`:

- `perfis`
- `polos`
- `locais`
- `turmas`
- `horarios`
- `turmas_professoras`
- `responsaveis`
- `alunas`
- `pagamentos_mensalidade`
- `pagamentos_matricula`
- `pagamentos_professora`
- `chamadas`
- `presencas`
- `custos_turma`
- `custos_turma_historico`
- `blocos_cobranca`
- `produtos`
- `eventos`
- `inscricoes_evento`
- `pre_matriculas`
- `configuracoes`

## Integridade e seguranca

A migration adiciona:

- backfill dos dados atuais para o tenant legado;
- FK de `tenant_id` para `tenants`;
- indices por `tenant_id`;
- unicidades por tenant para CPF, username, chamadas, pagamentos e inscricoes;
- triggers anti-cross-tenant para relacionamentos sensiveis;
- RLS tenant-aware;
- `configuracoes` deixa de ser singleton global e passa a ser `(tenant_id, id)`.

Decisao importante: RLS nao basta quando a rota usa service role. Por isso a aplicacao tambem recebeu `lib/tenant.ts` e filtros explicitos por `tenant_id` em rotas criticas.

## Camada de aplicacao

Novo helper:

- `lib/tenant.ts`

Responsabilidades:

- resolver tenant publico por header `x-prodexy-tenant`, query `tenant` ou slug/subdominio;
- validar usuario autenticado via `tenant_memberships`;
- padronizar erro de tenant;
- sobrescrever `tenant_id` no servidor antes de inserts/upserts.

Rotas ja tenant-aware nesta rodada:

- admin: stats, polos, locais, turmas, alunas, cobrancas, financeiro, professoras, produtos, eventos, configuracoes, pre-matriculas;
- professora: turmas, chamadas e detalhe server-side de turma;
- publicas: produtos, eventos, inscricao em evento, pre-matricula e busca de pagamento por CPF.

## Banco Cora

Estado atual:

- a nova migration `0002` cria configuracao Cora por tenant;
- as rotas Cora nao foram chamadas contra a API externa;
- nenhum teste automatizado chama Cora real;
- as variaveis `CORA_*` continuam como fallback legado de baixo nivel ate cada tenant cadastrar suas credenciais.

Implementado nesta fase:

- migration `scripts/migrations/20260626_0002_tenant_cora_config.sql`;
- tabela `tenant_cora_configuracoes`;
- tela de configuracoes com credenciais por tenant;
- rotas Cora/pagamentos filtrando tenant;
- token Cora cacheado por tenant/credencial;
- testes sem chamada externa real.

Pendencia tecnica deliberada:

- a tabela guarda PEMs no banco de teste. Para producao, a recomendacao de engenharia e evoluir para Supabase Vault/KMS antes de escalar muitos clientes.
- sandbox Cora exige `CORA_SANDBOX_API_BASE_URL`; producao usa `https://matls-clients.api.cora.com.br`.

## Criacao de conta SaaS

Estado atual:

- `/criar-conta` cria uma nova escolinha/tenant como `pendente_confirmacao`;
- Supabase Auth envia confirmacao de e-mail;
- `/auth/confirm` ativa tenant, perfil e membership somente apos token confirmado;
- `/admin/usuarios` fica restrito a usuarios internos do tenant atual.

Implementado nesta fase:

- migration `scripts/migrations/20260626_0003_account_signup_onboarding.sql`;
- tabela `tenant_account_signups`;
- ajuste no trigger `handle_novo_usuario()` para onboarding SaaS entrar como perfil inativo e membership `convidado`;
- pagina publica `/criar-conta`;
- callback `/auth/confirm`.

## Limitacoes conscientes desta fase

- `perfis` ainda funciona como perfil principal/default do usuario; `tenant_memberships` prepara roles por tenant, mas multi-membership completo vai exigir evoluir perfil por tenant.
- Defaults legados de `tenant_id` existem para facilitar backfill e transicao. Em uma fase futura, escritas novas devem ser obrigadas a informar tenant explicitamente na aplicacao.
- Crons financeiros fora da rota `/api/pagamentos/verificar` ainda precisam ser revisados para iterar por tenant.
- Ainda falta teste integrado com mocks de Cora, sem chamada real externa.

## Validacoes locais permitidas

Codex pode rodar validacoes que nao toquem banco:

- `npm run typecheck`;
- `npm test`;
- `npm run lint`;
- `npm run build`.

Scripts live, como `npm run test:tenant-isolation`, ficam reservados para execucao manual pelo usuario.

Nao foi rodado:

- migration no banco;
- qualquer rota ou teste que chame Banco Cora.
