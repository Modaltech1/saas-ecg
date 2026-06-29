# 11 - Criacao de Conta SaaS

Este documento define o fluxo publico para uma nova instituicao criar conta na plataforma.

## Decisao de produto

Criar uma nova instituicao SaaS nao e uma acao administrativa dentro de outro tenant. O fluxo correto e publico:

```txt
/criar-conta -> Supabase email confirmation -> /auth/confirm -> /admin/onboarding -> /admin
```

`/admin/usuarios` fica restrito a criar usuarios dentro do tenant atual.

## Fluxo implementado

1. Usuario acessa `/criar-conta`.
2. Preenche nome da instituicao, identificador publico, nome do responsavel, e-mail, telefone e senha.
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
9. Usuario entra no onboarding inicial `/admin/onboarding`.
10. Ao concluir o onboarding, `tenants.metadata.onboarding_inicial_concluido_em` e gravado e o usuario segue para `/admin`.

## Fluxos complementares de autenticacao

Todos os fluxos abaixo reaproveitam o layout compartilhado de autenticacao (`AuthCard`, `AuthError`, `PasswordInput`). A linguagem principal da UI e "Instituicao"; "Conta" fica restrito a acesso, credenciais, plano e contexto tecnico.

| Rota | Objetivo | Observacao |
| --- | --- | --- |
| `/reenviar-confirmacao` | Reenviar e-mail de confirmacao para instituicoes pendentes | Se o e-mail ja estiver confirmado, informa que o usuario ja pode entrar; caso contrario usa `supabase.auth.resend` com callback `/auth/confirm?next=/admin` |
| `/recuperar-senha` | Solicitar link de recuperacao de senha | Usa `supabase.auth.resetPasswordForEmail` com callback `/auth/confirm?next=/redefinir-senha` |
| `/redefinir-senha` | Definir nova senha apos abrir o link recebido por e-mail | Exige sessao temporaria criada pelo callback de recuperacao |
| `/admin/conta` | Trocar senha estando logado | Confirma a senha atual antes de atualizar a senha |
| `/confirmacao-email` | Mostrar link de confirmacao invalido ou expirado | Oferece reenvio de confirmacao |
| `/conta-pendente` | Mostrar instituicao aguardando confirmacao | Oferece reenvio de confirmacao |
| `/conta-suspensa` | Mostrar instituicao suspensa ou cancelada | Bloqueia acesso administrativo com mensagem clara |
| `/admin/onboarding` | Primeira entrada guiada | Usa `tenants.metadata` e nao exige migration nova |

O callback `/auth/confirm` diferencia o destino:

- confirmacao de instituicao retorna para `/admin` com `conta=confirmada`;
- recuperacao de senha retorna para `/redefinir-senha` com `fluxo=recuperacao`;
- link de recuperacao invalido retorna para `/recuperar-senha?erro=link-invalido`.
- link de confirmacao invalido retorna para `/confirmacao-email?erro=link-invalido`.

## Estados de acesso

O proxy e o login tratam os status principais de `tenants.status`:

| Status | Resultado |
| --- | --- |
| `pendente_confirmacao` | Redireciona para `/conta-pendente` |
| `ativo` sem onboarding concluido | Primeira entrada em `/admin` redireciona para `/admin/onboarding` |
| `ativo` com onboarding concluido | Acesso normal ao painel |
| `suspenso` | Redireciona para `/conta-suspensa?status=suspenso` |
| `cancelado` | Redireciona para `/conta-suspensa?status=cancelado` |

O onboarding inicial grava em `tenants.metadata`:

```json
{
  "onboarding_inicial_concluido_em": "ISO_DATE",
  "onboarding_objetivos": []
}
```

Nao ha migration nova para esta etapa.

## Migration necessaria

Antes de testar, execute manualmente:

```txt
scripts/migrations/20260626_0003_account_signup_onboarding.sql
scripts/migrations/20260627_0004_fix_auth_profile_onboarding_trigger.sql
```

Codex nunca executa essa migration no banco.

## Correcao de perfil ausente

Se o Supabase Auth mostrar o usuario confirmado, mas `public.perfis` estiver vazio, o login retornara "Seu acesso esta inativo ou invalido". A causa provavel e ausencia do trigger `on_auth_user_created`.

A migration `0004` corrige isso e faz backfill das contas SaaS ja criadas pelo fluxo `/criar-conta`.

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
3. Adicione Redirect URL. O mesmo callback atende confirmacao de e-mail e recuperacao de senha:

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
