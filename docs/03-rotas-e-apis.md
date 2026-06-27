# 03 - Rotas e APIs

Inventario das rotas observadas no projeto.

## Paginas

| Rota | Persona | Finalidade |
| --- | --- | --- |
| `/` | Auth | Redireciona para `/login`; proxy tambem redireciona por perfil |
| `/login` | Admin/Professora | Login via Supabase Auth |
| `/criar-conta` | Publico/SaaS | Cadastro de uma nova escolinha/tenant com confirmacao de e-mail |
| `/cadastro` | Publico | Pre-matricula externa |
| `/pagamentos` | Publico | Consulta de pagamentos por CPF e geracao de PIX |
| `/produtos` | Publico | Vitrine publica de produtos |
| `/eventos` | Publico | Lista e inscricao publica em eventos |
| `/admin` | Admin | Dashboard administrativo |
| `/admin/polos` | Admin | Lista/CRUD de polos |
| `/admin/polos/{id}` | Admin | Detalhe de polo |
| `/admin/locais` | Admin | Lista/CRUD de locais |
| `/admin/locais/{id}` | Admin | Detalhe de local |
| `/admin/turmas` | Admin | Lista/CRUD de turmas, horarios, professoras e custos |
| `/admin/turmas/{id}` | Admin | Detalhe de turma |
| `/admin/alunas` | Admin | Lista/CRUD de alunas e pre-matriculas |
| `/admin/alunas/{id}` | Admin | Ficha da aluna |
| `/admin/professoras` | Admin | Lista/criacao/desativacao de professoras |
| `/admin/professoras/{id}` | Admin | Detalhe de professora |
| `/admin/financeiro` | Admin | Visao financeira mensal |
| `/admin/cobrancas` | Admin | Cobrancas pendentes e WhatsApp |
| `/admin/produtos` | Admin | Catalogo administrativo de produtos |
| `/admin/eventos` | Admin | CRUD de eventos |
| `/admin/eventos/{id}` | Admin | Detalhe e inscricoes do evento |
| `/admin/configuracoes` | Admin | Cora, webhook e contato |
| `/professora` | Professora | Dashboard professora |
| `/professora/turmas` | Professora | Turmas vinculadas |
| `/professora/turmas/{id}` | Professora | Detalhe de turma da professora |
| `/professora/alunas` | Professora | Alunas das turmas vinculadas |
| `/professora/alunas/{id}` | Professora | Detalhe de aluna |
| `/professora/chamadas` | Professora | Chamada do dia e historico |
| `/professora/financeiro` | Professora | Visao financeira da professora |

## API routes

| Endpoint | Metodos | Finalidade principal | Tabelas/servicos centrais |
| --- | --- | --- | --- |
| `/api/admin/stats` | GET | Indicadores do dashboard admin | alunas, perfis, polos, locais, turmas, pagamentos_mensalidade |
| `/api/admin/polos` | GET, POST | Lista/cria polos | polos |
| `/api/admin/polos/{id}` | GET, PUT, DELETE | Detalhe/edicao/remocao de polo | polos |
| `/api/admin/locais` | GET, POST | Lista/cria locais | locais |
| `/api/admin/locais/{id}` | GET, PUT, DELETE | Detalhe/edicao/remocao de local | locais |
| `/api/admin/turmas` | GET, POST | Lista/cria turmas com dependencias | turmas, horarios, turmas_professoras, custos_turma |
| `/api/admin/turmas/{id}` | GET, PUT, DELETE | Detalhe/edicao/remocao de turma | turmas, horarios, turmas_professoras, custos_turma |
| `/api/admin/alunas` | GET, POST | Lista/cria alunas | alunas, responsaveis, turmas, pagamentos_matricula, pagamentos_mensalidade |
| `/api/admin/alunas/{id}` | GET, PUT, DELETE | Ficha/edicao/remocao de aluna | alunas, responsaveis, pagamentos |
| `/api/admin/alunas/{id}/cobrancas` | POST | Gera cobranca mensal manual | alunas, turmas, pagamentos_mensalidade |
| `/api/admin/pre-matriculas` | GET, POST | Lista/cria pre-matriculas | pre_matriculas |
| `/api/admin/pre-matriculas/{id}` | PUT, DELETE | Aprova/reprova/remove pre-matricula | pre_matriculas, responsaveis, alunas, pagamentos_matricula, turmas |
| `/api/admin/professoras` | GET | Lista professoras | perfis |
| `/api/admin/financeiro` | GET | Relatorio financeiro | turmas, alunas, pagamentos_mensalidade, pagamentos_matricula, pagamentos_professora, perfis |
| `/api/admin/financeiro/salarios` | POST, DELETE | Marca/desfaz salario pago | pagamentos_professora |
| `/api/admin/cobrancas` | GET | Lista alunas com pendencias | pagamentos_mensalidade |
| `/api/admin/cobrancas/{id}` | PUT, DELETE | Atualiza/remove cobranca | pagamentos_mensalidade |
| `/api/admin/produtos` | GET, POST | Lista/cria produtos | produtos |
| `/api/admin/produtos/{id}` | PUT, DELETE | Edita/remove produto | produtos |
| `/api/admin/eventos` | GET, POST | Lista/cria eventos | eventos |
| `/api/admin/eventos/{id}` | GET, PATCH, DELETE | Detalhe/edicao/remocao de evento | eventos, inscricoes_evento |
| `/api/admin/eventos/inscricoes/{id}` | PATCH | Atualiza inscricao | inscricoes_evento |
| `/api/admin/configuracoes` | GET, PUT | Configuracoes de Cora/contato por tenant | configuracoes, tenant_cora_configuracoes |
| `/api/professora/turmas` | GET | Turmas da professora autenticada | perfis, turmas_professoras, turmas, pagamentos_mensalidade |
| `/api/professora/turmas/{id}` | GET | Detalhe de turma da professora | turmas, horarios, alunas, pagamentos_mensalidade |
| `/api/professora/chamadas` | GET, POST | Chamada do dia/historico e salvamento | perfis, turmas_professoras, turmas, horarios, chamadas, presencas |
| `/api/public/eventos` | GET | Eventos publicos | eventos |
| `/api/public/eventos/{id}/inscrever` | POST | Inscricao publica em evento | eventos, alunas, inscricoes_evento |
| `/api/public/produtos` | GET | Vitrine publica | produtos, configuracoes |
| `/api/pagamentos/buscar-cpf` | GET | Busca aluna/pagamentos por CPF | alunas, pagamentos_mensalidade, pagamentos_matricula |
| `/api/pagamentos/pix` | GET | Recupera PIX pendente | pagamentos_mensalidade, pagamentos_matricula, Cora |
| `/api/pagamentos/verificar` | POST | Consulta Cora e sincroniza status | pagamentos_mensalidade, pagamentos_matricula, alunas, Cora |
| `/api/cora/criar-pix` | POST | Cria invoice PIX na Cora | alunas, pagamentos_mensalidade, pagamentos_matricula, Cora |
| `/api/cora/webhook` | POST | Recebe eventos da Cora | pagamentos_mensalidade, pagamentos_matricula, alunas |
| `/api/cora/testar-conexao` | POST | Testa credenciais mTLS Cora | Cora |
| `/auth/confirm` | GET | Callback de confirmacao de e-mail Supabase e ativacao de nova conta SaaS | auth.users, tenants, perfis, tenant_memberships, tenant_account_signups |

## Observacoes de roteamento

- Rotas `/admin/*` e `/professora/*` sao protegidas pelo proxy (`proxy.ts`), que reutiliza `lib/supabase/middleware.ts`.
- Rotas publicas de pagamentos, pre-matricula, eventos e produtos ficam fora do bloqueio de perfil.
- A area publica usa algumas APIs embaixo de `/api/admin/*`, como pre-matricula. Funciona, mas semanticamente isso deve ser separado em uma arquitetura SaaS.
- Em 2026-06-26, as rotas principais admin/professora/publicas foram atualizadas para usar contexto de tenant via `lib/tenant.ts`.
- Service role continua permitido apenas em rotas server-side, mas agora deve sempre vir acompanhado de filtro explicito por `tenant_id`.
- Rotas Cora foram tenantizadas em 2026-06-26 e agora buscam credenciais em `tenant_cora_configuracoes`.
- Testes automatizados continuam sem chamar a API externa da Cora; quando a fase de integracao financeira avancar, os testes devem usar mocks/fixtures e ambiente sandbox controlado.
- `/admin/usuarios` e apenas gestao de usuarios dentro do tenant atual. Criacao de nova escolinha/tenant deve passar por `/criar-conta`.
