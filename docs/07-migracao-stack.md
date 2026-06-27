# 07 - Migracao de Stack

Registro da migracao aplicada em 2026-06-24.

Atualizacao complementar em 2026-06-25: a stack continuou Next/React, mas a camada visual foi realinhada ao padrao Prodexy usado no projeto de referencia `C:\Users\elenf\Downloads\frota-prodexy-prototipo\frota-prodexy-prototipo`.

## Decisao

A base nao precisou ser migrada de Vue para React porque o projeto ja estava em Next.js/React. A migracao feita nesta etapa foi transformar a base gerada em uma stack Next/React mais confiavel para evolucao SaaS.

## O que mudou

| Area | Antes | Depois |
| --- | --- | --- |
| Build TypeScript | `next.config.mjs` ignorava erros de tipo | Build bloqueia erro de TypeScript |
| Middleware Next | `middleware.ts` | `proxy.ts`, mantendo `updateSession` |
| Testes | Sem script/config de teste | Vitest com `npm test` |
| Typecheck | Sem script dedicado | `npm run typecheck` |
| Lint | Script existia, mas ESLint nao estava instalado | ESLint configurado com baseline Next |
| Supabase client browser | Algumas paginas criavam client no topo do modulo | Client criado dentro do fetcher/browser |
| Supabase env no proxy | Env ausente causava 500 em `/login` local | Proxy permite paginas publicas e redireciona protegidas |
| Relacoes Supabase | Alguns tipos quebravam quando relacao vinha como array | Helper `one`/`many` em `lib/supabase/relations.ts` |
| Design system | Visual v0/mobile com verde hardcoded | Tokens Prodexy, brand centralizado, shell com drawer, cards e componentes compartilhados |

## Arquivos principais alterados/criados

- `package.json`
- `package-lock.json`
- `next.config.mjs`
- `proxy.ts`
- `eslint.config.mjs`
- `vitest.config.ts`
- `lib/supabase/relations.ts`
- `lib/supabase/middleware.ts`
- `tests/unit/utils.test.ts`
- `tests/unit/supabase-relations.test.ts`
- `app/professora/alunas/page.tsx`
- `app/professora/alunas/[id]/page.tsx`
- `app/professora/financeiro/page.tsx`
- `app/admin/professoras/page.tsx`
- `app/admin/professoras/[id]/page.tsx`
- `app/api/admin/financeiro/route.ts`
- `branding/brand.ts`
- `branding/brand.css`
- `app/globals.css`
- `styles/globals.css`
- `components/layout/mobile-header.tsx`
- `components/layout/public-header.tsx`
- `components/shared/page-header.tsx`
- `components/shared/metric-card.tsx`
- `components/shared/section.tsx`
- `components/shared/filters.tsx`
- `app/login/page.tsx`
- `app/admin/page.tsx`
- `app/professora/page.tsx`

## Design system

O projeto de referencia usa `@prodexy/ui` como biblioteca de UI e importa `@prodexy/ui/styles.css`, alem de um arquivo de branding por cliente.

Nesta rodada, o projeto atual recebeu os mesmos padroes por uma camada local:

- `branding/brand.ts` centraliza nome, descricao, logo e cores;
- `branding/brand.css` define os tokens Prodexy usados pelo Tailwind;
- `app/globals.css` importa o branding e mapeia tokens Tailwind;
- os componentes locais de UI continuam como camada de compatibilidade porque ja seguem a mesma base shadcn/Radix da lib;
- `components/shared/*` traz os padroes de pagina, metricas, secoes e filtros observados na referencia.

A dependencia direta `@prodexy/ui` ainda deve ser instalada e versionada em uma etapa propria, com lockfile atualizado, antes de trocar imports em massa. Isso evita quebrar o build por dependencia externa sem revisao.

## Validacoes executadas

| Comando | Resultado |
| --- | --- |
| `npm test` | Passou: 2 arquivos, 8 testes |
| `npm run typecheck` | Passou |
| `npm run lint` | Passou com 14 warnings |
| `npm run build` | Passou |
| Dev server local | Subiu em `http://127.0.0.1:3000`; `/login` respondeu 200 |
| `npm run typecheck` apos realinhamento visual | Passou |
| `npm test` apos realinhamento visual | Passou: 2 arquivos, 8 testes |
| `npm run lint` apos realinhamento visual | Passou com 14 warnings herdados |
| `npm run build` apos realinhamento visual | Passou |

## Warnings conhecidos

O lint passa, mas registra warnings herdados:

- dependencias instaveis em alguns `useMemo`;
- regras novas de React Hooks/Compiler em componentes gerados (`carousel`, `sidebar`, `use-mobile`, `hierarchical-select`);
- alerta em `/pagamentos` sobre acesso a ref durante render.

Esses warnings foram mantidos como warnings para criar baseline sem interromper a migracao. Devem ser atacados por modulo, com teste e validacao visual quando mexerem em UI.

## O que ainda nao foi feito

- Banco e migrations nao foram alterados.
- Tenant/multi-tenant nao foi implementado.
- Git ainda nao esta valido neste diretorio.
- `pnpm-lock.yaml` ainda existe; a rodada usou npm.
- Testes integrados reais de API ainda precisam ser adicionados.
- Variaveis de ambiente ainda nao possuem camada central de validacao.
- A dependencia direta `@prodexy/ui` ainda nao foi instalada neste repositorio; os tokens e padroes foram aplicados localmente.

## Proximo passo recomendado

Escolher uma dessas duas frentes:

1. Base de governanca: inicializar Git corretamente, decidir package manager e criar camada de env.
2. Primeiro modulo piloto: refatorar `produtos` para a arquitetura nova com service, validation, repository e testes integrados.
