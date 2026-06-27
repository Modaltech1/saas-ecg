# 08 - Design System Prodexy

Registro criado em 2026-06-25 a partir da leitura do projeto de referencia:

`C:\Users\elenf\Downloads\frota-prodexy-prototipo\frota-prodexy-prototipo`

O projeto de referencia foi tratado como somente leitura. Nenhum arquivo dele foi alterado. Nenhum comando de banco foi executado. Nenhum servidor local foi iniciado nesta rodada.

## Referencia adotada

O projeto de frota usa:

- `@prodexy/ui` como biblioteca visual;
- `branding/brand.ts` para metadados do cliente;
- `branding/brand.css` para tokens de cor, fonte e raio;
- `components/layout/admin-shell.tsx` como shell autenticado;
- `components/layout/page-header.tsx`;
- componentes compartilhados como `MetricCard`, `Section` e filtros;
- paleta clara com fundo esverdeado suave, azul primario, amarelo/laranja de apoio e cards brancos.

## Decisao aplicada neste projeto

Como o projeto atual ainda nao possui `@prodexy/ui` instalado e nao queriamos depender de rede nesta etapa, a aplicacao recebeu uma camada local compativel:

- os tokens do visual Prodexy foram aplicados em `branding/brand.css`;
- o branding do cliente ficou em `branding/brand.ts`;
- o CSS global passou a importar o branding e mapear tokens Tailwind;
- o header autenticado virou um shell com logo, subtitulo por papel, avatar, drawer lateral, icones e estado ativo;
- o header publico passou a usar o mesmo brand e navegacao com icones;
- os dashboards de admin e professora foram reestruturados com cards, secoes e metricas do padrao de referencia;
- as paginas publicas principais tiveram o verde antigo substituido por tokens de tema.

## Aprofundamento aplicado em 2026-06-25

Depois da primeira aproximacao visual, foi feita uma segunda rodada para reduzir vestigios do layout antigo nas telas que ainda pareciam isoladas do design de referencia.

Principais ajustes:

- `components/layout/mobile-header.tsx`: o header autenticado deixou de renderizar uma segunda faixa visual de titulo; agora a barra superior fica focada em marca, navegacao e avatar, e o titulo da pagina vive no conteudo com `PageHeader`.
- `components/ui/modal.tsx`: overlay, raio, sombra e header foram ajustados para o padrao operacional do prototipo.
- `components/ui/empty-state.tsx` e `components/ui/filter-chip.tsx`: estados vazios e chips passaram a usar tokens, raio `rounded-lg`/`rounded-md` e menos visual antigo.
- `components/shared/table-pagination.tsx` e `components/shared/table-details-button.tsx`: adicionados para replicar o padrao de tabela/paginacao do projeto de referencia.
- `app/admin/polos/page.tsx`: refeito com `PageHeader`, metricas, card de filtros, tabela, paginacao e acoes compactas.
- `app/admin/locais/page.tsx`: refeito com o mesmo template operacional de Polos.
- `app/admin/cobrancas/page.tsx`: refeito como tela financeira operacional com metricas, filtros, tabela, selecao em massa e modal de cobranca.
- `app/admin/eventos/page.tsx`: refeito com metricas, filtros, tabela e acoes compactas.
- `app/admin/produtos/page.tsx`: refeito como catalogo administrativo com metricas, filtros, tabela, status e acoes.
- `app/admin/page.tsx`, `app/admin/turmas/page.tsx`, `app/admin/alunas/page.tsx`, `app/admin/financeiro/page.tsx`, `app/admin/configuracoes/page.tsx` e `app/admin/professoras/professoras-client.tsx`: receberam `PageHeader`, largura `max-w-7xl`, metricas ou card de conteudo para manter a mesma gramatica visual.
- `app/eventos/page.tsx` e `app/produtos/page.tsx`: receberam ajustes de largura, grid responsivo e tokens para reduzir a aparencia antiga nas telas publicas.

O objetivo desta rodada foi mover as telas para a mesma linguagem do prototipo: shell enxuto, titulo no conteudo, metricas no topo, filtros em card, listas/tabelas escaneaveis e acoes mais compactas.

## Padroes visuais

| Elemento | Padrao |
| --- | --- |
| Fundo de app | `bg-muted/30` ou `var(--background)` |
| Cards | `bg-card`, `border`, `rounded-lg`, `shadow-sm` |
| Cor primaria | `--primary: #0b9bd3` |
| Apoio | `--secondary`, `--accent`, `--warning`, `--success` |
| Fonte de titulo | `var(--font-heading)` |
| Fonte de corpo | `var(--font-body)` |
| Navegacao | drawer lateral com icones lucide e estado ativo `bg-primary text-primary-foreground` |
| Botoes primarios | `bg-primary text-primary-foreground hover:bg-primary/90` |
| Inputs | borda `border-input`, foco `ring-primary` |

## Arquivos-base do design

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
- `components/shared/table-pagination.tsx`
- `components/shared/table-details-button.tsx`

## Proximo passo visual recomendado

Quando a governanca de dependencias estiver definida, instalar e versionar `@prodexy/ui` oficialmente, atualizar lockfile e migrar imports gradualmente:

1. Instalar `@prodexy/ui` a partir do GitHub oficial.
2. Validar compatibilidade de versoes de Radix, Tailwind, React e Next.
3. Trocar imports de componentes locais por imports da lib modulo a modulo.
4. Manter uma suite visual minima para login, dashboard admin, dashboard professora e paginas publicas.

## Validacoes desta rodada

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Passou |
| `npm test` | Passou: 2 arquivos, 8 testes |
| `npm run lint` | Passou com 14 warnings herdados |
| `npm run build` | Passou |

Nao foi executado `npm run dev`. Nao foi executado nenhum comando de banco de dados.

## Restricoes operacionais

Enquanto o banco conectado continuar sendo de producao, ficam proibidos nesta frente:

- iniciar servidor local para navegar contra dados reais;
- executar scripts, migrations, seeds, resets ou qualquer comando de banco;
- abrir consoles ou clientes que possam modificar dados;
- testar fluxos que disparem chamadas reais contra integracoes financeiras sem ambiente controlado.
