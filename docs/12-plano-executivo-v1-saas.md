# 12 - Plano Executivo V1 SaaS

Este documento e o plano de trabalho ate a V1 do SaaS. Ele deve ser tratado como plano vivo: discutido, ajustado e usado para decidir prioridade.

## Norte da V1

Lancamento V1 significa que uma escolinha consegue:

1. criar uma conta;
2. confirmar e-mail;
3. configurar dados essenciais;
4. cadastrar sua operacao;
5. receber pre-matriculas;
6. gerenciar alunas, turmas, professoras, chamadas e financeiro;
7. configurar integracoes por conta;
8. pagar/assinar o SaaS via Stripe;
9. operar sem enxergar dados de outra escolinha;
10. ter experiencia mobile first coerente e confiavel.

Fora da V1, salvo decisao contraria:

- marketplace complexo;
- multi-idioma;
- aplicativo nativo;
- BI avancado;
- automacao completa de WhatsApp;
- billing altamente customizavel;
- white-label profundo por cliente;
- multi-conta avancado para o mesmo usuario com troca ativa de tenant.

## Principios inegociaveis

- Codex nunca executa nada no banco. Toda mudanca de banco vira migration, e o usuario executa.
- Toda tabela de dominio deve ter fronteira clara de conta/tenant.
- Service role so pode existir em rotas server-side com filtro explicito por tenant.
- Regra financeira precisa de teste.
- Fluxo publico precisa de validacao rigorosa.
- Layout deve reutilizar componentes compartilhados antes de criar UI nova.
- Primeiro estabilizar o monolito modular; extrair backend separado so quando houver ganho real.
- Stripe e Cora sao integracoes diferentes:
  - Stripe cobra a assinatura do SaaS.
  - Cora cobra mensalidades/matriculas das alunas da escolinha.

## Fase 0 - Governanca e Base Operacional

Objetivo: parar de evoluir em terreno movel.

Entregaveis:

- corrigir Git/repo local para `git status` funcionar;
- escolher package manager oficial, preferencialmente npm enquanto ja temos `package-lock.json`;
- remover lockfile nao escolhido;
- padronizar `.env.example`;
- revisar variaveis obrigatorias para Vercel;
- criar checklist de deploy;
- corrigir encoding UTF-8 dos textos com caracteres quebrados;
- definir convencao de branches/commits;
- documentar ambientes: local, preview, teste e producao.

Criterio de pronto:

- `npm run typecheck`, `npm test`, `npm run lint` e `npm run build` documentados;
- repo versionavel;
- Vercel com variaveis organizadas;
- nenhuma chave sensivel versionada.

## Fase 1 - Fundacao SaaS de Conta, Auth e Tenant

Objetivo: garantir que a base de contas SaaS esteja correta antes de ampliar produto.

Entregaveis:

- validar migrations `0001` a `0004` no banco de teste;
- validar `/criar-conta` com e-mail real;
- validar `/auth/confirm`;
- validar login apos confirmacao;
- validar `perfis`, `tenants`, `tenant_memberships` e `tenant_account_signups`;
- criar tela de "Minha conta" ou "Conta da escolinha";
- permitir editar nome da conta, contato, WhatsApp e dados basicos;
- separar linguagem de produto:
  - UI usa "Conta" ou "Escolinha";
  - codigo/banco pode usar `tenant`;
- revisar middleware/proxy para suportar conta suspensa/cancelada;
- criar fluxo de reenvio de confirmacao de e-mail;
- criar fluxo de recuperar senha;
- criar fluxo de troca de senha logado;
- criar pagina de status apos confirmacao/erro de link.

Paginas faltantes:

- `/recuperar-senha`;
- `/redefinir-senha`;
- `/admin/conta`;
- estado visual de "conta pendente/suspensa";
- pagina amigavel para link de confirmacao invalido/expirado.

Criterio de pronto:

- conta nova consegue entrar e criar dados proprios;
- usuario sem perfil e corrigido ou bloqueado com erro claro;
- conta inativa nao acessa admin;
- admin cria usuarios internos sem criar novas contas;
- testes unitarios das regras de onboarding;
- testes integrados planejados/roteirizados para execucao manual pelo usuario quando tocarem banco.

## Fase 2 - Arquitetura de Codigo e Contratos de Dominio

Objetivo: reduzir acoplamento gerado e preparar evolucao com menos risco.

Entregaveis:

- criar estrutura gradual `features/`, `shared/` e `integrations/`;
- escolher primeiro dominio piloto, recomendado: `polos/locais` ou `alunas`;
- extrair:
  - schemas Zod;
  - DTOs;
  - services/use cases;
  - repositories Supabase;
  - formatadores;
  - testes unitarios;
- padronizar resposta de API;
- padronizar tratamento de erro;
- remover `any` de rotas criticas;
- criar helpers de query tenant-aware;
- documentar padrao de nova feature.

Ordem recomendada:

1. `shared/validation`;
2. `shared/http`;
3. `shared/tenant`;
4. `features/polos`;
5. `features/alunas`;
6. `features/financeiro`;
7. `integrations/cora`;
8. `integrations/stripe`.

Criterio de pronto:

- pelo menos dois dominios migrados para o padrao novo;
- novas features nascem no padrao novo;
- rotas antigas continuam funcionando;
- testes cobrindo services centrais.

## Fase 3 - UI/UX V1 e Refatoracao de Layout

Objetivo: consolidar uma experiencia SaaS consistente, mobile first e reaproveitavel.

Entregaveis:

- revisar todas as telas admin para seguir o mesmo template:
  - `MobileHeaderServer`;
  - `PageHeader`;
  - metricas quando fizer sentido;
  - filtros compartilhados;
  - tabela/lista responsiva;
  - modal/drawer padronizado;
- revisar telas publicas:
  - `/criar-conta`;
  - `/login`;
  - `/cadastro`;
  - `/pagamentos`;
  - `/produtos`;
  - `/eventos`;
- criar componentes compartilhados:
  - `AuthCard`;
  - `PasswordInput`;
  - `EntityListPage`;
  - `DataToolbar`;
  - `ConfirmActionDialog`;
  - `FormSection`;
  - `StatusBadge`;
  - `MoneyDisplay`;
  - `EmptyState` unico;
- criar estados vazios reais por modulo;
- criar loading states;
- revisar mobile de formularios longos;
- remover vestigios visuais antigos;
- criar pagina de configuracao inicial/onboarding pos-conta.

Paginas/fluxos faltantes:

- onboarding inicial depois da primeira entrada;
- "Dados da escolinha";
- "Usuarios e permissoes" refinado;
- "Plano e assinatura";
- "Central de ajuda/suporte";
- "Politica/Termos" se o cadastro publico exigir aceite formal.

Criterio de pronto:

- login e criar conta usam a mesma base;
- telas principais responsivas;
- componentes duplicados reduzidos;
- fluxo inicial guiado para nova conta;
- build passa.

## Fase 4 - Banco, RLS e Modelo de Dados V1

Objetivo: deixar o schema coerente, seguro e preparado para clientes reais.

Entregaveis:

- revisar migrations existentes contra schema real;
- criar documento de schema atual como fonte de verdade;
- remover defaults legados de `tenant_id` quando seguro;
- garantir `tenant_id` obrigatorio nas escritas novas;
- revisar unicidades por tenant;
- revisar FKs cross-tenant;
- revisar RLS por role;
- criar modelo de auditoria basico;
- criar tabela de eventos de dominio ou logs de atividade;
- criar plano de backup/rollback;
- revisar `perfis` vs `tenant_memberships`;
- decidir se `perfis` vira perfil global e memberships carregam role por conta.

Migrations provaveis:

- auditoria/logs;
- ajustes de status de tenant;
- ajustes de billing Stripe;
- ajustes de convites;
- remocao de defaults legados;
- indices de performance.

Criterio de pronto:

- isolamento comprovavel;
- queries principais com indices;
- migrations incrementais revisadas;
- documento de schema atualizado;
- usuario executa migrations em teste e valida.

## Fase 5 - Billing SaaS com Stripe

Objetivo: cobrar assinatura da plataforma sem misturar com pagamentos Cora das alunas.

Modelo recomendado para V1:

- Stripe Customer por tenant;
- Stripe Subscription por tenant;
- planos simples:
  - Trial;
  - Essencial;
  - Profissional;
- status local de assinatura:
  - `trialing`;
  - `active`;
  - `past_due`;
  - `canceled`;
  - `unpaid`;
- webhooks Stripe como fonte de verdade;
- bloqueio/suspensao gradual por status.

Entregaveis:

- criar produtos/precos no Stripe;
- adicionar envs Stripe;
- migration de tabelas de billing;
- checkout de assinatura;
- portal do cliente Stripe;
- webhook `/api/stripe/webhook`;
- tela `/admin/plano`;
- regras de acesso por status;
- tela de bloqueio amigavel para assinatura vencida;
- testes com mocks/fixtures de webhook.

Tabelas provaveis:

- `tenant_billing`;
- `billing_events`;
- talvez `plans` se nao vier tudo do Stripe.

Variaveis esperadas:

- `STRIPE_SECRET_KEY`;
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`;
- `STRIPE_WEBHOOK_SECRET`;
- `STRIPE_PRICE_ESSENCIAL`;
- `STRIPE_PRICE_PROFISSIONAL`;

Criterio de pronto:

- nova conta pode assinar plano;
- webhook atualiza status;
- tenant sem assinatura ativa segue regra definida;
- portal Stripe abre para o cliente;
- Cora segue independente.

## Fase 6 - Cora por Tenant e Financeiro da Escolinha

Objetivo: estabilizar a cobranca das alunas sem risco de usar credencial global.

Entregaveis:

- validar tabela `tenant_cora_configuracoes`;
- revisar armazenamento seguro de PEMs;
- decidir Supabase Vault/KMS antes de producao;
- criar mocks de Cora;
- criar teste de criacao/consulta/cancelamento de cobranca com mock;
- revisar webhook Cora com tenant;
- revisar cron de verificacao PIX por tenant;
- criar log de eventos Cora;
- criar tela de status da integracao;
- criar checklist para credenciais Cora por escolinha.

Criterio de pronto:

- nenhuma rota Cora usa credencial global em fluxo SaaS;
- webhook atualiza somente dados do tenant correto;
- cron exige segredo e itera por tenants ativos;
- erros Cora aparecem de forma operacional para admin.

## Fase 7 - Produto Core da Escolinha

Objetivo: entregar valor operacional suficiente para cliente real.

Modulos que precisam estar bons na V1:

- Polos;
- Locais;
- Turmas;
- Professoras;
- Alunas;
- Pre-matriculas;
- Chamadas;
- Financeiro;
- Cobrancas;
- Configuracoes;
- Portal de pagamentos;
- Produtos;
- Eventos.

Melhorias prioritarias:

- onboarding inicial sugerindo criar polo/local/turma;
- criacao de aluna mais guiada;
- aprovacao de pre-matricula mais segura;
- revisao de regras de mensalidade;
- filtros persistentes por modulo;
- exportacao CSV simples para financeiro/alunas;
- estados vazios por modulo;
- validacoes de formulario com Zod;
- mensagens de erro legiveis;
- logs de acoes importantes.

Criterio de pronto:

- uma escolinha consegue operar ciclo basico mensal;
- professora consegue fazer chamada;
- admin consegue acompanhar pendencias;
- responsavel consegue consultar e pagar;
- modulo financeiro bate com regras documentadas.

## Fase 8 - Observabilidade, Suporte e Operacao

Objetivo: conseguir operar o SaaS sem ficar cego.

Entregaveis:

- logs estruturados nas APIs;
- tratamento padronizado de erro;
- pagina interna de saude basica;
- captura de erros client/server;
- painel interno Prodexy minimo;
- trilha de auditoria:
  - quem criou/editou/excluiu;
  - tenant;
  - entidade;
  - data;
- suporte:
  - contato;
  - identificador da conta;
  - estado da assinatura;
  - estado das integracoes.

Possiveis ferramentas:

- Vercel logs inicialmente;
- Sentry ou equivalente;
- Supabase logs;
- Stripe dashboard;
- auditoria no banco.

Criterio de pronto:

- erro em producao tem caminho de investigacao;
- webhook falho pode ser reprocessado;
- suporte consegue identificar tenant e usuario.

## Fase 9 - Seguranca e Compliance Minimo

Objetivo: reduzir risco antes de clientes reais.

Entregaveis:

- revisar service role;
- revisar rotas publicas;
- rate limit em fluxos sensiveis:
  - login;
  - criar conta;
  - buscar CPF;
  - gerar PIX;
- validar headers de seguranca;
- revisar politica de cookies/sessao;
- proteger webhooks com assinatura;
- revisar exposicao de erros;
- termos de uso e politica de privacidade;
- plano de backup;
- plano de incidentes minimo.

Criterio de pronto:

- secrets fora do client;
- webhooks verificados;
- rotas publicas validadas;
- dados entre tenants isolados;
- documentos legais minimos publicados se houver cliente real.

## Sequencia Recomendada de Execucao

### Sprint 1 - Estabilizar Fundacao

- corrigir Git/package manager;
- rodar migrations pendentes pelo usuario;
- validar `/criar-conta` e login;
- corrigir perfil/membership se necessario;
- recuperar senha;
- pagina de conta da escolinha;
- docs de ambiente/Vercel.

### Sprint 2 - Layout e Onboarding

- onboarding pos-criacao;
- refatorar auth/public pages;
- revisar admin shell/telas com maior divergencia;
- criar componentes compartilhados faltantes;
- estados vazios e loading.

### Sprint 3 - Contratos de Dominio

- escolher dominio piloto;
- extrair service/repository/schema;
- padronizar API response;
- testes unitarios;
- aplicar padrao em segundo dominio.

### Sprint 4 - Billing Stripe

- migrations billing;
- checkout;
- webhook;
- portal;
- tela plano;
- regras de acesso por assinatura.

### Sprint 5 - Financeiro e Cora

- mocks Cora;
- webhook Cora por tenant;
- cron por tenant;
- tela status integracao;
- logs de cobranca.

### Sprint 6 - Core Operacional

- alunas/pre-matriculas;
- turmas/professoras;
- chamadas;
- financeiro;
- cobrancas;
- exportacoes simples.

### Sprint 7 - Hardening V1

- observabilidade;
- auditoria;
- rate limit;
- backups;
- testes E2E principais;
- checklist de release.

## Backlog de Paginas V1

Publicas/auth:

- `/criar-conta`;
- `/login`;
- `/recuperar-senha`;
- `/redefinir-senha`;
- `/confirmacao-email`;
- `/termos`;
- `/privacidade`.

Admin SaaS:

- `/admin/onboarding`;
- `/admin/conta`;
- `/admin/usuarios`;
- `/admin/plano`;
- `/admin/configuracoes`;
- `/admin/suporte`.

Operacionais:

- `/admin/polos`;
- `/admin/locais`;
- `/admin/turmas`;
- `/admin/alunas`;
- `/admin/professoras`;
- `/admin/financeiro`;
- `/admin/cobrancas`;
- `/admin/produtos`;
- `/admin/eventos`.

Professora:

- `/professora`;
- `/professora/turmas`;
- `/professora/alunas`;
- `/professora/chamadas`;
- `/professora/financeiro`.

Publicas da escolinha:

- `/cadastro`;
- `/pagamentos`;
- `/produtos`;
- `/eventos`.

## Decisoes Pendentes

1. Nome de produto e linguagem: "conta", "escolinha", "organizacao" ou outro termo.
2. Planos Stripe e limites de cada plano.
3. Trial gratuito: sim ou nao; quantos dias.
4. Bloqueio por inadimplencia: bloquear total ou modo leitura.
5. Cora em producao: PEMs no banco temporariamente ou Vault/KMS antes da V1.
6. Usuario pode pertencer a mais de uma escolinha ja na V1?
7. Subdominio por cliente entra na V1 ou fica para depois?
8. WhatsApp manual permanece ou teremos API oficial depois?
9. Eventos/produtos precisam de checkout na V1 ou ficam como vitrine/inscricao simples.
10. Painel interno Prodexy entra na V1 ou V1.1.

## Riscos Principais

| Risco | Impacto | Mitigacao |
| --- | --- | --- |
| Banco real divergir das migrations | Alto | Usuario executa migrations em teste e reporta erro; docs de schema atualizadas |
| Service role sem filtro tenant | Alto | Revisao por rota e helper obrigatorio |
| Stripe/Cora confundidos | Alto | Separar billing SaaS de financeiro da escolinha |
| UI duplicada | Medio | Componentes compartilhados e regra no design system |
| Regras financeiras sem teste | Alto | Testes unitarios antes de expandir |
| Onboarding quebrado | Alto | Fluxo de recuperacao/backfill e mensagens claras |
| Falta observabilidade | Medio | Logs estruturados e auditoria minima |

## Definicao de V1 Pronta

A V1 so deve ser considerada pronta quando:

- nova escolinha cria conta e confirma e-mail;
- assinatura Stripe funciona em modo teste e depois producao;
- tenant ativo opera sem acessar dados de outro tenant;
- admin configura conta e usuarios;
- modulos centrais funcionam no mobile;
- Cora por tenant esta isolada ou explicitamente desativada por tenant;
- rotas publicas estao validadas;
- build/typecheck/test passam;
- migrations estao versionadas;
- docs principais estao atualizados;
- existe checklist de deploy e rollback.
