# 10 - Testes de Login e Isolamento

Este documento descreve como validar login e isolamento sem misturar cadastro SaaS com administracao interna.

## Regra de banco

Codex nunca executa nada no banco. Scripts que acessam Supabase real devem ser rodados somente pelo usuario.

## Migrations obrigatorias

Rode no banco de teste, nesta ordem:

1. `scripts/migrations/20260626_0001_multi_tenant_foundation.sql`
2. `scripts/migrations/20260626_0002_tenant_cora_config.sql`
3. `scripts/migrations/20260626_0003_account_signup_onboarding.sql`
4. `scripts/migrations/20260627_0004_fix_auth_profile_onboarding_trigger.sql`

## Fluxos corretos

| Fluxo | Rota | Finalidade |
| --- | --- | --- |
| Criar nova instituicao/tenant | `/criar-conta` | Cadastro publico SaaS com confirmacao de e-mail |
| Confirmar e-mail | `/auth/confirm` | Callback Supabase que ativa tenant, perfil e membership |
| Criar usuario dentro da conta | `/admin/usuarios` | Owner/admin adiciona admin, colaborador ou professora ao tenant atual |

`/admin/usuarios` nao deve criar nova instituicao. Ele serve apenas para administracao interna da instituicao autenticada.

## Teste manual de nova conta

1. Rode as migrations ate a `0004`.
2. Configure as variaveis de ambiente e Redirect URLs descritas em [11 - Criacao de conta SaaS](./11-criacao-conta-saas.md).
3. Abra `/criar-conta`.
4. Crie uma conta com e-mail real de teste.
5. Confirme o e-mail pelo link recebido.
6. Confirme que o callback redireciona para `/admin/onboarding` ou `/admin`.
7. Crie um polo ou outro dado simples.
8. Saia e entre com o tenant legado.
9. Confirme que o dado da nova instituicao nao aparece no tenant legado.

## Se o usuario existe no Auth mas `perfis` esta vazio

Isso indica que o trigger `on_auth_user_created` nao existia ou nao disparou quando o usuario foi criado. Rode a migration:

```txt
scripts/migrations/20260627_0004_fix_auth_profile_onboarding_trigger.sql
```

Ela:

- recria o trigger em `auth.users`;
- faz backfill de `perfis`;
- faz backfill de `tenant_memberships`;
- ativa o tenant se o e-mail ja estiver confirmado.

Depois de publicar o codigo atual na Vercel, o login tambem tenta reparar a conta SaaS confirmada se encontrar metadata de onboarding no usuario do Auth.

## Teste automatizado de isolamento

Existe o script:

```bash
npm run test:tenant-isolation
```

Ele cria dados temporarios no Supabase real e deve ser executado somente pelo usuario, quando quiser validar RLS com banco de teste.

O teste:

- cria dois tenants temporarios;
- cria um owner em cada tenant;
- cria um polo em cada tenant;
- autentica com anon key como cada owner;
- valida que cada owner so enxerga seu proprio polo;
- tenta inserir dado cross-tenant e espera bloqueio;
- limpa os dados temporarios ao final.

## Configurar Cora por tenant

Depois de rodar a migration `0002`, abra:

- `/admin/configuracoes`

Para cada tenant, cadastre:

- ambiente;
- client id;
- chave privada PEM;
- certificado PEM;
- URL de webhook;
- status ativo/inativo.

As chaves nao sao devolvidas para o navegador depois de salvas. A tela mostra apenas se cada segredo esta configurado.
