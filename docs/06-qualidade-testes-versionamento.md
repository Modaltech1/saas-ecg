# 06 - Qualidade, Testes e Versionamento

Este documento define o padrao minimo de engenharia para evoluir o projeto com seguranca.

## Estado atual

| Item | Situacao |
| --- | --- |
| Git | Pasta `.git` existe, mas nao e repositorio valido (`git status` falha) |
| Testes | Vitest configurado com `npm test` e testes unitarios iniciais |
| Lint | ESLint configurado com `npm run lint`; warnings herdados seguem registrados |
| Build | `next build` passa com TypeScript ativo |
| TypeScript | `strict: true` e `npm run typecheck` passam |
| Migrations | Migrations versionadas em `scripts/migrations/`; banco e execucao ficam exclusivamente sob controle do usuario |
| Package manager | npm usado nesta rodada; ainda existem `package-lock.json` e `pnpm-lock.yaml` |

## Padrao de versionamento recomendado

1. Inicializar Git antes de mudancas estruturais.
2. Criar um commit inicial com o estado atual documentado.
3. Trabalhar em branches curtas por tema.
4. Commits pequenos e descritivos.
5. Toda mudanca de banco deve ter migration propria.
6. Toda mudanca de regra financeira deve citar teste ou validacao.

Sugestao de prefixos:

- `docs:` documentacao
- `chore:` configuracao, tooling, manutencao
- `feat:` nova funcionalidade
- `fix:` correcao
- `refactor:` reorganizacao sem alterar comportamento esperado
- `test:` testes
- `db:` migrations e schema

## Padrao de testes recomendado

### Unitarios

Cobrir funcoes puras e regras:

- calculo de mensalidade com desconto/acrescimo;
- calculo de salario fixo/percentual;
- formatadores e mascaras;
- normalizacao de CPF/telefone;
- regras de status de pagamento;
- validacoes Zod.

### Integrados

Cobrir API routes e services:

- resolver tenant publico por slug/header;
- bloquear acesso entre tenants;
- criar aluna;
- aprovar pre-matricula;
- gerar cobranca de matricula;
- listar pendencias;
- gerar PIX;
- receber webhook Cora;
- salvar chamada.

### E2E

Cobrir jornadas criticas:

- login admin;
- cadastrar turma;
- cadastrar aluna;
- aprovar pre-matricula;
- consultar pagamento por CPF;
- gerar PIX;
- professora fazer chamada.

### Regressao visual/mobile

Como o produto e mobile first, mudancas de UI devem ser verificadas em pelo menos:

- viewport mobile estreito;
- viewport mobile comum;
- desktop.

## Politica para banco/migrations

- Cada mudanca de banco deve ter migration incremental em `scripts/migrations/`.
- Codex deve criar migration e orientar a execucao; Codex nunca executa migration, SQL, seed ou teste live que toque banco.
- Primeiro destino e sempre banco de teste.
- Producao exige plano separado, janela, backup e rollback.
- RLS deve ser testada com usuario real de cada role, por execucao controlada pelo usuario.
- Seed deve ser separado de schema.
- Dados reais devem ter plano de backfill.
- Cora nao deve ser chamada em teste automatizado; usar mocks/fixtures e separar qualquer validacao sandbox manual.

## Definicao de pronto para mudancas futuras

Uma tarefa so deve ser considerada pronta quando:

- codigo foi implementado no escopo combinado;
- tipos passam sem erro;
- testes relevantes passam;
- build passa, salvo bloqueio documentado;
- documentacao afetada foi atualizada;
- riscos conhecidos foram registrados.

## Riscos tecnicos atuais a priorizar

1. Git invalido/nao inicializado para controle de versao real.
2. Ambiguidade de package manager por dois lockfiles.
3. Cobertura de testes ainda inicial.
4. Scripts SQL possivelmente desatualizados em relacao ao banco real.
5. Rotas Cora tenantizadas, mas ainda sem suite integrada com mocks.
6. Logica de negocio duplicada entre UI, API e SQL.
7. Componentes de pagina muito grandes.
8. Uso amplo de `any`.
9. Warnings de lint herdados em hooks/componentes gerados.
10. Falta ampliar testes integrados alem da prova inicial de isolamento entre tenants.

## Padrao para novas features

Toda feature nova deve nascer com:

- arquivo/rota pequeno;
- service com regra de negocio;
- valida input com schema;
- tipos explicitos;
- teste unitario da regra;
- teste integrado da API quando houver persistencia;
- documentacao do fluxo em `docs/` quando alterar comportamento de negocio.
