# Documentacao do Projeto ECG SaaS Prodexy

Este diretorio e a base viva de documentacao do projeto. Ele registra o estado atual do sistema antes de qualquer mudanca estrutural de banco, e tambem cria um ponto comum para evoluirmos o produto em direcao a um SaaS.

## Descobertas iniciais

- A aplicacao ja esta em Next.js/React, nao em Vue. O projeto usa `app/`, `page.tsx`, `route.ts`, `next.config.mjs`, React 19 e Next 16.
- A base parece ter origem em v0.app, conforme `README.md`, `package.json` e `metadata.generator`.
- O sistema nasceu single-client/single-tenant. Em 2026-06-26 foi criada a fundacao multi-tenant, foi adicionada a migration de Cora por tenant e foi criado o fluxo publico de nova conta SaaS.
- Regra permanente: Codex nunca executa nada no banco. Toda mudanca de banco deve virar migration versionada, e somente o usuario executa no Supabase.
- O diretorio atual nao esta inicializado como repositorio Git, pois `git status --short` retornou `fatal: not a git repository`.
- A primeira etapa de migracao de stack foi aplicada em 2026-06-24: Next/React foi mantido, TypeScript passou a bloquear build, Vitest e ESLint foram configurados, `middleware.ts` foi migrado para `proxy.ts`, e testes unitarios iniciais foram adicionados.
- Em 2026-06-25, o design system foi realinhado ao projeto de referencia `frota-prodexy-prototipo`: branding centralizado, tokens visuais Prodexy, shell autenticado, header publico, login, dashboards, telas administrativas, telas publicas e componentes compartilhados foram atualizados sem tocar no banco e sem rodar servidor local.
- Em 2026-06-26, a aplicacao passou a ter contexto de tenant nas rotas principais, gestao interna de usuarios por tenant, configuracao Cora por tenant via migration `0002` e criacao publica de conta SaaS via `/criar-conta` com confirmacao de e-mail.

## Mapa da documentacao

- [01 - Estado atual](./01-estado-atual.md): stack, estrutura, arquitetura atual e pontos de base tecnica.
- [02 - Modulos e fluxos](./02-modulos-e-fluxos.md): lista funcional dos modulos, personas e jornadas do produto.
- [03 - Rotas e APIs](./03-rotas-e-apis.md): inventario de paginas e endpoints existentes.
- [04 - Dados e integracoes](./04-dados-e-integracoes.md): tabelas, RLS, crons, Cora, Supabase e divergencias entre scripts e codigo.
- [05 - Direcao SaaS](./05-direcao-saas.md): caminho recomendado para escalar a arquitetura sem mexer no banco agora.
- [06 - Qualidade, testes e versionamento](./06-qualidade-testes-versionamento.md): padrao de trabalho para evolucao continua.
- [07 - Migracao de stack](./07-migracao-stack.md): registro do que foi migrado nesta rodada e proximos passos tecnicos.
- [08 - Design system Prodexy](./08-design-system-prodexy.md): padroes visuais adotados a partir do projeto de referencia.
- [09 - Fundacao multi-tenant](./09-multi-tenant.md): migration, decisoes, modelo de tenants/memberships e pendencias de SaaS.
- [10 - Testes de login e isolamento](./10-testes-login-isolamento.md): como criar contas/tenants de teste e validar isolamento no navegador.
- [11 - Criacao de conta SaaS](./11-criacao-conta-saas.md): fluxo publico de cadastro de nova escolinha, confirmacao de e-mail e variaveis de ambiente.
- [12 - Plano executivo V1 SaaS](./12-plano-executivo-v1-saas.md): fases, entregaveis, paginas, Stripe, Cora, riscos e criterios de pronto para a V1.

## Principio de trabalho daqui em diante

Antes de mexer em banco, tenant, migrations ou regras financeiras, qualquer mudanca deve partir desta sequencia:

1. Entender o fluxo atual e o impacto no produto.
2. Registrar decisao ou ajuste relevante em Markdown.
3. Implementar com escopo pequeno e revisavel.
4. Cobrir com testes proporcionais ao risco.
5. Validar build, rotas criticas e regressao visual quando houver UI.

Regra permanente: Codex deve atuar com opiniao tecnica ativa. Se uma decisao solicitada criar risco para manutencao, extensibilidade, testabilidade, confiabilidade, disponibilidade, usabilidade, desempenho ou seguranca, ela deve ser questionada, explicada e documentada.

Regra permanente de banco: Codex nao executa migrations, SQL, seeds, scripts de isolamento com Supabase real, comandos de limpeza ou qualquer acao que toque banco. Codex apenas cria migrations, codigo e instrucoes; o usuario administra e executa o banco.

## Observacao sobre encoding

Alguns arquivos do projeto exibem textos em portugues com caracteres quebrados no terminal. Antes de qualquer reescrita grande de UI ou docs publicas, vale padronizar encoding para UTF-8 e revisar textos exibidos ao usuario.
