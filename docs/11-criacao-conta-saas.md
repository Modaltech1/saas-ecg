# 11 - Criacao de Conta SaaS

Este documento define o fluxo publico para uma nova escolinha criar conta na plataforma.

## Decisao de produto

Criar uma nova conta SaaS nao e uma acao administrativa dentro de outro tenant. O fluxo correto e publico:

```txt
/criar-conta -> Supabase email confirmation -> /auth/confirm -> /admin
```

`/admin/usuarios` fica restrito a criar usuarios dentro do tenant atual.

## Fluxo implementado

1. Usuario acessa `/criar-conta`.
2. Preenche nome da escolinha, slug, nome do responsavel, e-mail, telefone e senha.
3. Aplicacao cria um tenant com status `pendente_confirmacao`.
4. Aplicacao chama Supabase Auth `signUp` com metadata:
   - `onboarding_tipo = nova_conta_saas`
   - `tenant_id`
   - `tenant_slug`
   - `tenant_nome`
   - `papel = admin`
5. Trigger `handle_novo_usuario()` cria perfil inativo e membership `convidado`.
6. Supabase envia e-mail de confirmacao.
7. Callback `/auth/confirm` valida o token.
8. Aplicacao ativa:
   - `tenants.status = ativo`
   - `perfis.ativo = true`
   - `tenant_memberships.status = ativo`
   - `tenant_account_signups.status = confirmado`
9. Usuario entra no painel `/admin`.

## Migration necessaria

Antes de testar, execute manualmente:

```txt
scripts/migrations/20260626_0003_account_signup_onboarding.sql
```

Codex nunca executa essa migration no banco.

## Variaveis de ambiente

Local:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Vercel:

```env
NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`SUPABASE_SERVICE_ROLE_KEY` deve ficar somente no servidor/Vercel. Nunca exponha essa chave no client.

## Supabase Auth

No painel do Supabase:

1. Ative Confirm email.
2. Configure Site URL com a URL da Vercel.
3. Adicione Redirect URL:

```txt
https://seu-projeto.vercel.app/auth/confirm
```

Para teste local, adicione tambem:

```txt
http://localhost:3000/auth/confirm
```

Se usar dominio proprio, adicione tambem:

```txt
https://seu-dominio.com/auth/confirm
```

## Fora do escopo agora

- pagamento de assinatura SaaS;
- trial com limite de dias;
- billing;
- convite por e-mail para usuarios internos;
- troca de tenant por usuario multi-conta.

Essas partes devem nascer depois, com migrations e testes proprios.
