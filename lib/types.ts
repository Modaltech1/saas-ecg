// Tipos e interfaces do sistema

export type UserRole = "admin" | "professora"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

export interface Polo {
  id: string
  name: string
  city: string
  observations?: string
  createdAt: Date
}

export interface Local {
  id: string
  poloId: string
  name: string
  address?: string
  observations?: string
  createdAt: Date
}

export type CategoriaCusto =
  | "Aluguel"
  | "Parceiro"
  | "Material"
  | "Marketing"
  | "Transporte"
  | "Alimentação"
  | "Equipamento"
  | "Administrativo"
  | "Outro"

// Custo fixo ou percentual atribuído à turma (ex: local, parceiro, etc.)
export interface CustoTurma {
  id: string
  descricao: string
  categoria: CategoriaCusto
  tipo: "fixo" | "percentual"
  valor: number // se tipo=fixo: R$, se tipo=percentual: %
}

// Pré-matrícula enviada pelo pai via página externa
export interface PreMatricula {
  id: string
  nomeAluna: string
  dataNascimento: string
  nomeResponsavel: string
  cpfResponsavel: string
  telefone: string
  whatsapp: string
  email: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
  cep: string
  observacoes?: string
  status: "pendente" | "aprovada" | "recusada"
  createdAt: Date
}

// Vinculação professora x turma com remuneração própria
export interface ProfessoraTurma {
  professoraId: string
  tipo: "fixo" | "percentual"
  valor: number // valor fixo em R$ OU % da receita da turma
}

// Bloco de cobrança: define valores e vencimentos
export interface BlocoCobranca {
  diaLimite: number   // ex: 10 → até dia 10
  valor: number       // mensalidade nesse prazo
}

export interface Turma {
  id: string
  poloId: string
  localId: string
  name: string
  nivel: "Iniciante 1" | "Iniciante 2" | "Intermediário" | "Avançado"
  mensalidade: number           // valor base de referência
  taxaMatricula: number         // taxa cobrada na matrícula
  idadeAlvo?: string
  professorasConfig: ProfessoraTurma[]   // substituiu professoraIds simples
  professoraIds: string[]                // mantido para compatibilidade de filtros
  custos: CustoTurma[]          // custos da turma (local, parceiro, etc.)
  blocoCobranca: BlocoCobranca[] // regras de cobrança por prazo
  createdAt: Date
}

export interface Horario {
  id: string
  turmaId: string
  diaSemana: "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta" | "Sábado" | "Domingo"
  horaInicio: string
  horaFim: string
}

export interface Responsavel {
  nome: string
  cpf?: string
  telefone: string
  whatsapp: string
  email: string   // campo principal para cobranças automáticas
}

export interface EnderecoAluna {
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
  cep: string
}

export interface Aluna {
  id: string
  nome: string
  dataNascimento: Date
  turmaId: string
  descontoPercentual?: number
  responsavel: Responsavel
  endereco?: EnderecoAluna
  status: "Ativa" | "Trancada"
  taxaMatriculaPaga: boolean    // controla se a taxa de matrícula foi registrada
  createdAt: Date
}

export interface PagamentoAluna {
  id: string
  alunaId: string
  mesReferencia: string // formato: 'YYYY-MM'
  valor: number
  status: "Pago" | "Pendente"
  dataPagamento?: Date
}

export interface Professora {
  id: string
  nome: string
  email: string
  telefone: string
  turmaIds: string[]
  // salário é calculado dinamicamente a partir das configurações de cada turma (ProfessoraTurma)
  createdAt: Date
}

export interface PagamentoProfessora {
  id: string
  professoraId: string
  mesReferencia: string // formato: 'YYYY-MM'
  valor: number
  status: "Pago" | "Pendente"
  dataPagamento?: Date
}

export interface Produto {
  id: string
  nome: string
  descricao: string
  valor: number
  categoria: "Roupa" | "Sapatilha" | "Equipamento" | "Uniforme" | "Acessório" | "Outro"
  disponivel: boolean
  imagemUrl?: string
  tamanhos?: string[]
  createdAt: Date
}

export interface ConfiguracaoCora {
  clientId: string
  clientSecret: string
  ambiente: "sandbox" | "producao"
  contaBancaria: string
  chavePix: string
  tipoChavePix: "CPF" | "CNPJ" | "Email" | "Telefone" | "Aleatoria"
  webhookUrl: string
  ativo: boolean
  whatsappAdmin: string
}

export type StatusPresenca = "presente" | "ausente" | "justificada"

export interface PresencaAluna {
  alunaId: string
  status: StatusPresenca
  observacao?: string
}

export interface Chamada {
  id: string
  turmaId: string
  professoraId: string
  data: string // formato: 'YYYY-MM-DD'
  horarioId: string
  presencas: PresencaAluna[]
  encerrada: boolean
  createdAt: Date
}

export interface CobrancaGerada {
  id: string
  alunaId: string
  mesReferencia: string
  valor: number
  status: "Pendente" | "Enviada" | "Paga" | "Vencida"
  linkPagamento?: string
  txid?: string
  dataGeracao: Date
  dataVencimento: Date
  dataPagamento?: Date
}
