# 12 - Plano Executivo V1 SaaS

Este documento e o plano vivo ate a V1 do SaaS. Ele deve funcionar como checklist compartilhado entre produto, engenharia e operacao.

Legenda:

- [ ] Pendente
- [x] Feito ou assumido como administrado fora da execucao Codex

## Norte da V1

- [ ] Uma instituicao consegue criar uma conta.
- [ ] Uma instituicao consegue confirmar e-mail.
- [ ] Uma instituicao consegue configurar dados essenciais.
- [ ] Uma instituicao consegue configurar logo e cores basicas usadas no app, paginas publicas e PWA.
- [ ] Uma instituicao consegue cadastrar sua operacao.
- [ ] Uma instituicao consegue receber pre-matriculas.
- [ ] Uma instituicao consegue gerenciar alunas, turmas, professoras, chamadas e financeiro.
- [ ] Uma instituicao consegue configurar integracoes por conta.
- [ ] Uma instituicao consegue pagar/assinar o SaaS via Stripe.
- [ ] Uma conta ativa opera sem enxergar dados de outra conta.
- [ ] A experiencia V1 e mobile first, coerente e confiavel.

## Fora da V1, salvo decisao contraria

- [ ] Marketplace complexo.
- [ ] Multi-idioma.
- [ ] Aplicativo nativo.
- [ ] BI avancado.
- [ ] Automacao completa de WhatsApp.
- [ ] Billing altamente customizavel.
- [ ] White-label profundo por cliente.
- [ ] Multi-conta avancado para o mesmo usuario com troca ativa de conta.

## Principios inegociaveis

- [x] Codex nunca executa nada no banco.
- [x] Toda mudanca de banco vira migration; o usuario executa.
- [ ] Toda tabela de dominio deve ter fronteira clara de conta/tenant.
- [ ] Service role so pode existir em rotas server-side com filtro explicito por conta.
- [ ] Regra financeira precisa de teste.
- [ ] Fluxo publico precisa de validacao rigorosa.
- [x] Layout deve reutilizar componentes compartilhados antes de criar UI nova.
- [ ] Branding basico por instituicao e parte da V1: logo, cores principais e PWA devem ter fallback seguro e validacao visual.
- [ ] Primeiro estabilizar o monolito modular; extrair backend separado so quando houver ganho real.
- [x] Stripe e Cora sao integracoes diferentes.
- [x] Stripe cobra a assinatura do SaaS.
- [x] Cora cobra mensalidades/matriculas das alunas da instituicao.
- [x] UI principal deve falar "Instituicao"; "Conta" fica para contexto de acesso, plano, credenciais e codigo/banco/docs tecnicos.

## Fase 0 - Governanca Administrada pelo Usuario

Status: pulada da execucao Codex e administrada pelo usuario.

- [x] Corrigir Git/repo local para `git status` funcionar.
- [x] Escolher package manager oficial.
- [x] Remover lockfile nao escolhido.
- [x] Padronizar `.env.example`.
- [x] Revisar variaveis obrigatorias para Vercel.
- [x] Criar checklist de deploy.
- [x] Corrigir encoding UTF-8 dos textos com caracteres quebrados.
- [x] Definir convencao de branches/commits.
- [x] Documentar ambientes: local, preview, teste e producao.

## Fase 1 - Conta, Auth, Configuracoes e Seguranca

Objetivo: garantir que a base de contas SaaS esteja correta antes de ampliar produto.

### Ja feito/checado

- [x] Validar migrations `0001` a `0004` no banco de teste.
- [x] Validar `/criar-conta` com e-mail real.
- [x] Validar `/auth/confirm`.
- [x] Validar login apos confirmacao.
- [x] Validar `perfis`, `tenants`, `tenant_memberships` e `tenant_account_signups`.
- [x] Corrigir fluxo em que usuario existia no Auth, mas `perfis` ficava vazio.
- [x] Criar tela de Instituicao.
- [x] Permitir editar nome da conta.
- [x] Permitir editar responsavel principal.
- [x] Permitir editar e-mail de contato.
- [x] Permitir editar telefone.
- [x] Permitir editar WhatsApp de atendimento.
- [x] Permitir editar documento.
- [x] Permitir editar site.
- [x] Permitir editar endereco, cidade e estado.
- [x] Sincronizar WhatsApp da conta com `configuracoes.whatsapp_admin`.
- [x] Criar bloco de seguranca e acessos na tela de Instituicao.
- [x] Adicionar link de Instituicao no menu administrativo.
- [x] Adicionar Instituicao no acesso rapido do painel.
- [x] Trocar linguagem visivel de "tenant" para "conta".
- [x] Trocar comunicacao publica de "escolinha" para "instituicao".
- [x] Ajustar `/admin/usuarios` para linguagem de produto: "Acessos" e "Instituicao".

### Pendente

- [x] Criar fluxo de reenvio de confirmacao de e-mail.
- [x] Criar fluxo de recuperar senha.
- [x] Criar fluxo de redefinir senha.
- [x] Criar fluxo de troca de senha logado.
- [x] Criar pagina amigavel para link de confirmacao invalido/expirado.
- [x] Revisar middleware/proxy para suportar conta suspensa/cancelada.
- [x] Criar tela/estado visual de conta pendente.
- [x] Criar tela/estado visual de conta suspensa.
- [x] Criar onboarding inicial apos primeira entrada.
- [x] Definir se "Conta" ou "Instituicao" sera o termo principal em toda a UI.

### Paginas da fase

- [x] `/criar-conta`
- [x] `/auth/confirm`
- [x] `/admin/conta`
- [x] `/admin/usuarios`
- [x] `/reenviar-confirmacao`
- [x] `/recuperar-senha`
- [x] `/redefinir-senha`
- [x] `/confirmacao-email`
- [x] `/conta-pendente`
- [x] `/conta-suspensa`
- [x] `/admin/onboarding`

### Criterio de pronto

- [x] Conta nova consegue entrar depois da confirmacao.
- [x] Usuario sem perfil e corrigido ou bloqueado com erro claro.
- [x] Admin cria usuarios internos sem criar novas contas.
- [x] Conta possui tela de dados institucionais.
- [x] Conta inativa nao acessa admin.
- [x] Fluxos de senha estao prontos.
- [x] Onboarding inicial esta pronto.

## Fase 2 - Arquitetura de Codigo e Contratos de Dominio

Objetivo: reduzir acoplamento gerado e preparar evolucao com menos risco.

- [ ] Criar estrutura gradual `features/`.
- [ ] Criar estrutura gradual `shared/`.
- [ ] Criar estrutura gradual `integrations/`.
- [ ] Escolher dominio piloto.
- [ ] Extrair schemas Zod do dominio piloto.
- [ ] Extrair DTOs do dominio piloto.
- [ ] Extrair services/use cases do dominio piloto.
- [ ] Extrair repositories Supabase do dominio piloto.
- [ ] Extrair formatadores do dominio piloto.
- [ ] Criar testes unitarios do dominio piloto.
- [ ] Padronizar resposta de API.
- [ ] Padronizar tratamento de erro.
- [ ] Remover `any` de rotas criticas.
- [ ] Criar helpers de query com fronteira de conta.
- [ ] Documentar padrao de nova feature.

Ordem recomendada:

- [ ] `shared/validation`
- [ ] `shared/http`
- [ ] `shared/tenant`
- [ ] `features/polos`
- [ ] `features/alunas`
- [ ] `features/financeiro`
- [ ] `integrations/cora`
- [ ] `integrations/stripe`

## Fase 3 - UI/UX V1 e Refatoracao de Layout

Objetivo: consolidar uma experiencia SaaS consistente, mobile first e reaproveitavel.

- [x] Criar `AuthCard`.
- [x] Criar `PasswordInput`.
- [x] Login e criar conta usam a mesma base visual.
- [x] Documentar regra de reaproveitamento para telas de autenticacao.
- [ ] Revisar todas as telas admin com o mesmo template.
- [ ] Garantir `MobileHeaderServer` nas telas server-side.
- [ ] Garantir `PageHeader` nas telas principais.
- [ ] Usar metricas quando fizer sentido.
- [ ] Usar filtros compartilhados quando fizer sentido.
- [ ] Padronizar tabela/lista responsiva.
- [ ] Padronizar modal/drawer.
- [ ] Revisar `/cadastro`.
- [ ] Revisar `/pagamentos`.
- [ ] Revisar `/produtos`.
- [ ] Revisar `/eventos`.
- [ ] Criar `EntityListPage`.
- [ ] Criar `DataToolbar`.
- [ ] Criar `ConfirmActionDialog`.
- [ ] Criar `FormSection`.
- [ ] Criar `StatusBadge`.
- [ ] Criar `MoneyDisplay`.
- [ ] Consolidar `EmptyState` unico.
- [ ] Criar estados vazios reais por modulo.
- [ ] Criar loading states.
- [ ] Revisar mobile de formularios longos.
- [ ] Remover vestigios visuais antigos.
- [ ] Criar arquitetura de branding por instituicao com fallback Prodexy/padrao.
- [ ] Permitir logo da instituicao no app autenticado.
- [ ] Permitir logo da instituicao nas paginas publicas: pre-matricula, pagamentos, produtos e eventos.
- [ ] Permitir logo/icone da instituicao no manifesto/PWA quando tecnicamente viavel por dominio/subdominio.
- [ ] Permitir cores basicas por instituicao: primaria, secundaria/acento e tema de superficie.
- [ ] Validar contraste minimo das cores configuradas.
- [ ] Criar preview de branding antes de salvar.
- [ ] Garantir que o design system consuma tokens dinamicos por instituicao sem duplicar CSS por pagina.

## Fase 4 - Banco, RLS e Modelo de Dados V1

Objetivo: deixar o schema coerente, seguro e preparado para clientes reais.

- [ ] Revisar migrations existentes contra schema real.
- [ ] Criar documento de schema atual como fonte de verdade.
- [ ] Remover defaults legados de `tenant_id` quando seguro.
- [ ] Garantir `tenant_id` obrigatorio nas escritas novas.
- [ ] Revisar unicidades por conta.
- [ ] Revisar FKs cross-tenant.
- [ ] Revisar RLS por role.
- [ ] Criar modelo de auditoria basico.
- [ ] Criar tabela de eventos de dominio ou logs de atividade.
- [ ] Criar plano de backup/rollback.
- [ ] Revisar `perfis` vs `tenant_memberships`.
- [ ] Decidir se `perfis` vira perfil global e memberships carregam role por conta.

Migrations provaveis:

- [ ] Auditoria/logs.
- [ ] Ajustes de status de conta.
- [ ] Ajustes de billing Stripe.
- [ ] Ajustes de convites.
- [ ] Configuracao de branding por instituicao: logo, favicon/PWA e cores.
- [ ] Configuracao de agendas financeiras por instituicao.
- [ ] Remocao de defaults legados.
- [ ] Indices de performance.

## Fase 5 - Billing SaaS com Stripe

Objetivo: cobrar assinatura da plataforma sem misturar com pagamentos Cora das alunas.

Modelo recomendado para V1:

- [ ] Stripe Customer por conta.
- [ ] Stripe Subscription por conta.
- [ ] Plano Trial.
- [ ] Plano Essencial.
- [ ] Plano Profissional.
- [ ] Status local `trialing`.
- [ ] Status local `active`.
- [ ] Status local `past_due`.
- [ ] Status local `canceled`.
- [ ] Status local `unpaid`.
- [ ] Webhooks Stripe como fonte de verdade.
- [ ] Bloqueio/suspensao gradual por status.

Entregaveis:

- [ ] Criar produtos/precos no Stripe.
- [ ] Adicionar envs Stripe.
- [ ] Criar migration de tabelas de billing.
- [ ] Criar checkout de assinatura.
- [ ] Criar portal do cliente Stripe.
- [ ] Criar webhook `/api/stripe/webhook`.
- [ ] Criar tela `/admin/plano`.
- [ ] Criar regras de acesso por status.
- [ ] Criar tela de bloqueio amigavel para assinatura vencida.
- [ ] Criar testes com mocks/fixtures de webhook.

Tabelas provaveis:

- [ ] `tenant_billing`
- [ ] `billing_events`
- [ ] `plans`, se nao vier tudo do Stripe

Variaveis esperadas:

- [ ] `STRIPE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_PRICE_ESSENCIAL`
- [ ] `STRIPE_PRICE_PROFISSIONAL`

## Fase 6 - Cora por Conta e Financeiro da Instituicao

Objetivo: estabilizar a cobranca das alunas, as rotinas financeiras automatizadas e a integracao Cora sem risco de usar credencial global.

- [x] Criar tabela `tenant_cora_configuracoes`.
- [x] Tela de configuracoes salva Cora por conta.
- [x] Rotas Cora filtram conta.
- [ ] Validar armazenamento seguro de PEMs.
- [ ] Decidir Supabase Vault/KMS antes de producao.
- [ ] Criar mocks de Cora.
- [ ] Criar teste de criacao de cobranca com mock.
- [ ] Criar teste de consulta de cobranca com mock.
- [ ] Criar teste de cancelamento de cobranca com mock.
- [ ] Revisar webhook Cora com conta.
- [ ] Revisar cron de verificacao PIX por conta.
- [ ] Mapear Lambdas/EventBridge atuais e documentar entrada, saida, agenda, idempotencia e dependencia de banco/API.
- [ ] Revisar Lambda de geracao mensal de mensalidades por aluna com base em turma, desconto e instituicao.
- [ ] Revisar Lambda de acrescimo/taxa por atraso conforme configuracao da turma e dia configurado pela instituicao.
- [ ] Revisar Lambda de levantamento mensal de pagamentos/custos a pagar: professoras, alugueis, parcerias e custos de turma.
- [ ] Revisar Lambda de verificacao recorrente de pagamentos pendentes na Cora.
- [ ] Criar configuracao por instituicao para dia de lancamento de mensalidades.
- [ ] Criar configuracao por instituicao para dia de acrescimo/taxa por atraso.
- [ ] Criar configuracao por instituicao para dia de levantamento de pagamentos/custos.
- [ ] Definir frequencia global segura para conciliacao Cora e isolamento por instituicao.
- [ ] Garantir que jobs financeiros sejam idempotentes por instituicao, mes/referencia e tipo de rotina.
- [ ] Garantir logs e auditoria por instituicao em cada execucao financeira automatizada.
- [ ] Criar estrategia de retries, dead-letter e alertas para Lambdas/EventBridge.
- [ ] Criar testes com fixtures para jobs financeiros sem chamar Cora real.
- [ ] Criar log de eventos Cora.
- [ ] Criar tela de status da integracao.
- [ ] Criar checklist para credenciais Cora por instituicao.

## Fase 7 - Produto Core da Instituicao

Objetivo: entregar valor operacional suficiente para cliente real.

Modulos que precisam estar bons na V1:

- [ ] Polos.
- [ ] Locais.
- [ ] Turmas.
- [ ] Professoras.
- [ ] Alunas.
- [ ] Pre-matriculas.
- [ ] Chamadas.
- [ ] Financeiro.
- [ ] Cobrancas.
- [ ] Configuracoes.
- [ ] Portal de pagamentos.
- [ ] Produtos.
- [ ] Eventos.

Melhorias prioritarias:

- [ ] Onboarding inicial sugerindo criar polo/local/turma.
- [ ] Criacao de aluna mais guiada.
- [ ] Aprovacao de pre-matricula mais segura.
- [ ] Revisao de regras de mensalidade.
- [ ] Filtros persistentes por modulo.
- [ ] Exportacao CSV simples para financeiro/alunas.
- [ ] Estados vazios por modulo.
- [ ] Validacoes de formulario com Zod.
- [ ] Mensagens de erro legiveis.
- [ ] Logs de acoes importantes.

## Fase 8 - Observabilidade, Suporte e Operacao

Objetivo: conseguir operar o SaaS sem ficar cego.

- [ ] Logs estruturados nas APIs.
- [ ] Tratamento padronizado de erro.
- [ ] Pagina interna de saude basica.
- [ ] Captura de erros client/server.
- [ ] Painel interno Prodexy minimo.
- [ ] Trilha de auditoria por usuario.
- [ ] Trilha de auditoria por conta.
- [ ] Trilha de auditoria por entidade.
- [ ] Trilha de auditoria por data.
- [ ] Suporte consegue ver identificador da conta.
- [ ] Suporte consegue ver estado da assinatura.
- [ ] Suporte consegue ver estado das integracoes.

## Fase 9 - Seguranca e Compliance Minimo

Objetivo: reduzir risco antes de clientes reais.

- [ ] Revisar service role.
- [ ] Revisar rotas publicas.
- [ ] Rate limit em login.
- [ ] Rate limit em criar conta.
- [ ] Rate limit em buscar CPF.
- [ ] Rate limit em gerar PIX.
- [ ] Validar headers de seguranca.
- [ ] Revisar politica de cookies/sessao.
- [ ] Proteger webhooks com assinatura.
- [ ] Revisar exposicao de erros.
- [ ] Criar termos de uso.
- [ ] Criar politica de privacidade.
- [ ] Criar plano de backup.
- [ ] Criar plano de incidentes minimo.

## Sequencia Recomendada de Execucao

### Sprint 1 - Estabilizar Fundacao

- [x] Corrigir Git/package manager: administrado pelo usuario.
- [x] Rodar migrations pendentes: administrado pelo usuario.
- [x] Validar `/criar-conta` e login.
- [x] Corrigir perfil/membership se necessario.
- [x] Criar pagina de conta.
- [x] Profissionalizar linguagem de conta/acessos.
- [x] Recuperar senha.
- [x] Reenvio de confirmacao.
- [x] Estados de conta pendente/suspensa/cancelada.
- [x] Onboarding pos-criacao.
- [ ] Docs de ambiente/Vercel.

### Sprint 2 - Layout e Onboarding

- [x] Onboarding pos-criacao.
- [ ] Branding basico por instituicao: logo e cores.
- [ ] Branding aplicado a links publicos e PWA.
- [ ] Refatorar auth/public pages restantes.
- [ ] Revisar admin shell/telas com maior divergencia.
- [ ] Criar componentes compartilhados faltantes.
- [ ] Estados vazios e loading.

### Sprint 3 - Contratos de Dominio

- [ ] Escolher dominio piloto.
- [ ] Extrair service/repository/schema.
- [ ] Padronizar API response.
- [ ] Testes unitarios.
- [ ] Aplicar padrao em segundo dominio.

### Sprint 4 - Billing Stripe

- [ ] Migrations billing.
- [ ] Checkout.
- [ ] Webhook.
- [ ] Portal.
- [ ] Tela plano.
- [ ] Regras de acesso por assinatura.

### Sprint 5 - Financeiro e Cora

- [ ] Inventariar EventBridge/Lambdas existentes.
- [ ] Configurar agendas financeiras por instituicao.
- [ ] Refatorar jobs financeiros para isolamento por instituicao.
- [ ] Mocks Cora.
- [ ] Webhook Cora por conta.
- [ ] Cron por conta.
- [ ] Tela status integracao.
- [ ] Logs de cobranca.

### Sprint 6 - Core Operacional

- [ ] Alunas/pre-matriculas.
- [ ] Turmas/professoras.
- [ ] Chamadas.
- [ ] Financeiro.
- [ ] Cobrancas.
- [ ] Exportacoes simples.

### Sprint 7 - Hardening V1

- [ ] Observabilidade.
- [ ] Auditoria.
- [ ] Rate limit.
- [ ] Backups.
- [ ] Testes E2E principais.
- [ ] Checklist de release.

## Backlog de Paginas V1

Publicas/auth:

- [x] `/criar-conta`
- [x] `/login`
- [x] `/reenviar-confirmacao`
- [x] `/recuperar-senha`
- [x] `/redefinir-senha`
- [x] `/confirmacao-email`
- [x] `/conta-pendente`
- [x] `/conta-suspensa`
- [ ] `/termos`
- [ ] `/privacidade`

Admin SaaS:

- [x] `/admin/onboarding`
- [x] `/admin/conta`
- [x] `/admin/usuarios`
- [ ] `/admin/branding`
- [ ] `/admin/plano`
- [x] `/admin/configuracoes`
- [ ] `/admin/suporte`

Operacionais:

- [x] `/admin/polos`
- [x] `/admin/locais`
- [x] `/admin/turmas`
- [x] `/admin/alunas`
- [x] `/admin/professoras`
- [x] `/admin/financeiro`
- [x] `/admin/cobrancas`
- [x] `/admin/produtos`
- [x] `/admin/eventos`

Professora:

- [x] `/professora`
- [x] `/professora/turmas`
- [x] `/professora/alunas`
- [x] `/professora/chamadas`
- [x] `/professora/financeiro`

Publicas da instituicao:

- [x] `/cadastro`
- [x] `/pagamentos`
- [x] `/produtos`
- [x] `/eventos`

## Decisoes Pendentes

- [ ] Nome final do produto.
- [x] Termo principal da UI: "Instituicao".
- [ ] Planos Stripe e limites de cada plano.
- [ ] Trial gratuito: sim ou nao; quantos dias.
- [ ] Bloqueio por inadimplencia: bloquear total ou modo leitura.
- [ ] Cora em producao: PEMs no banco temporariamente ou Vault/KMS antes da V1.
- [ ] Usuario pode pertencer a mais de uma instituicao ja na V1?
- [ ] Subdominio por cliente entra na V1 ou fica para depois?
- [ ] Branding por subdominio/dominio: gerar manifest dinamico por instituicao ou manter manifest unico ate V1.1?
- [ ] WhatsApp manual permanece ou teremos API oficial depois?
- [ ] Eventos/produtos precisam de checkout na V1 ou ficam como vitrine/inscricao simples.
- [ ] Painel interno Prodexy entra na V1 ou V1.1.

## Riscos Principais

- [ ] Banco real divergir das migrations.
- [ ] Service role sem filtro de conta.
- [ ] Stripe/Cora confundidos.
- [ ] UI duplicada.
- [ ] Branding por instituicao quebrar contraste, PWA ou cache de assets.
- [ ] Regras financeiras sem teste.
- [ ] Onboarding quebrado.
- [ ] Falta observabilidade.

## Definicao de V1 Pronta

A V1 so deve ser considerada pronta quando:

- [ ] Nova instituicao cria conta e confirma e-mail.
- [ ] Assinatura Stripe funciona em modo teste e depois producao.
- [ ] Conta ativa opera sem acessar dados de outra conta.
- [ ] Admin configura conta e usuarios.
- [ ] Instituicao configura logo e cores com fallback seguro.
- [ ] Modulos centrais funcionam no mobile.
- [ ] Cora por conta esta isolada ou explicitamente desativada por conta.
- [ ] Rotas publicas estao validadas.
- [ ] Build/typecheck/test passam.
- [ ] Migrations estao versionadas.
- [ ] Docs principais estao atualizados.
- [ ] Existe checklist de deploy e rollback.
