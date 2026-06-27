import type { Polo, Local, Turma, Horario, Aluna, Professora, PagamentoAluna, PagamentoProfessora, User, Produto, ConfiguracaoCora, CobrancaGerada, PreMatricula, Chamada } from "./types"

// Usuário logado (pode ser alterado para simular diferentes perfis)
export const currentUser: User = {
  id: "1",
  name: "Ana Paula",
  email: "ana@ginastica.com",
  role: "admin", // Mude para 'professora' para testar a área da professora
}

// Polos
export const polos: Polo[] = [
  { id: "1", name: "Polo São Mateus", city: "São Mateus", createdAt: new Date("2023-01-15") },
  { id: "2", name: "Polo Vitória", city: "Vitória", createdAt: new Date("2023-02-20") },
  { id: "3", name: "Polo Linhares", city: "Linhares", createdAt: new Date("2023-03-10") },
]

// Locais
export const locais: Local[] = [
  { id: "1", poloId: "1", name: "Escola Elesmão", address: "Rua das Flores, 123", createdAt: new Date("2023-01-20") },
  {
    id: "2",
    poloId: "1",
    name: "Ginásio Artístico Municipal",
    address: "Av. Principal, 456",
    createdAt: new Date("2023-01-25"),
  },
  {
    id: "3",
    poloId: "2",
    name: "Centro Esportivo Vitória",
    address: "Rua Central, 789",
    createdAt: new Date("2023-02-25"),
  },
  { id: "4", poloId: "3", name: "Ginásio Linhares", address: "Av. Beira Mar, 321", createdAt: new Date("2023-03-15") },
]

// Professoras
export const professoras: Professora[] = [
  {
    id: "1",
    nome: "Mariana Silva",
    email: "mariana@ginastica.com",
    telefone: "(27) 98765-4321",
    turmaIds: ["1", "2"],
    createdAt: new Date("2023-01-10"),
  },
  {
    id: "2",
    nome: "Carolina Santos",
    email: "carolina@ginastica.com",
    telefone: "(27) 98888-7777",
    turmaIds: ["3", "4"],
    createdAt: new Date("2023-02-15"),
  },
  {
    id: "3",
    nome: "Juliana Oliveira",
    email: "juliana@ginastica.com",
    telefone: "(27) 99999-6666",
    turmaIds: ["5"],
    createdAt: new Date("2023-03-05"),
  },
]

// Turmas
export const turmas: Turma[] = [
  {
    id: "1",
    poloId: "1",
    localId: "1",
    name: "Iniciante 1",
    nivel: "Iniciante 1",
    mensalidade: 150,
    taxaMatricula: 80,
    idadeAlvo: "4-6 anos",
    professoraIds: ["1"],
    professorasConfig: [{ professoraId: "1", tipo: "percentual", valor: 40 }],
    custos: [
      { id: "c1", descricao: "Aluguel Local", categoria: "Aluguel", tipo: "percentual", valor: 20 },
      { id: "c2", descricao: "Parceiro Esportivo", categoria: "Parceiro", tipo: "fixo", valor: 50 },
    ],
    blocoCobranca: [
      { diaLimite: 10, valor: 150 },
      { diaLimite: 31, valor: 170 },
    ],
    createdAt: new Date("2023-02-01"),
  },
  {
    id: "2",
    poloId: "1",
    localId: "1",
    name: "Iniciante 2",
    nivel: "Iniciante 2",
    mensalidade: 180,
    taxaMatricula: 80,
    idadeAlvo: "6-8 anos",
    professoraIds: ["1"],
    professorasConfig: [{ professoraId: "1", tipo: "percentual", valor: 40 }],
    custos: [
      { id: "c3", descricao: "Aluguel Local", categoria: "Aluguel", tipo: "percentual", valor: 20 },
    ],
    blocoCobranca: [
      { diaLimite: 10, valor: 180 },
      { diaLimite: 31, valor: 200 },
    ],
    createdAt: new Date("2023-02-01"),
  },
  {
    id: "3",
    poloId: "1",
    localId: "2",
    name: "Intermediário A",
    nivel: "Intermediário",
    mensalidade: 220,
    taxaMatricula: 100,
    idadeAlvo: "8-10 anos",
    professoraIds: ["2"],
    professorasConfig: [{ professoraId: "2", tipo: "fixo", valor: 800 }],
    custos: [
      { id: "c4", descricao: "Aluguel Ginásio", categoria: "Aluguel", tipo: "fixo", valor: 300 },
    ],
    blocoCobranca: [
      { diaLimite: 10, valor: 220 },
      { diaLimite: 31, valor: 245 },
    ],
    createdAt: new Date("2023-02-05"),
  },
  {
    id: "4",
    poloId: "2",
    localId: "3",
    name: "Avançado",
    nivel: "Avançado",
    mensalidade: 280,
    taxaMatricula: 120,
    idadeAlvo: "10-14 anos",
    professoraIds: ["2"],
    professorasConfig: [
      { professoraId: "2", tipo: "percentual", valor: 35 },
    ],
    custos: [
      { id: "c5", descricao: "Aluguel Centro Esportivo", categoria: "Aluguel", tipo: "percentual", valor: 25 },
      { id: "c6", descricao: "Material Didático", categoria: "Material", tipo: "fixo", valor: 100 },
    ],
    blocoCobranca: [
      { diaLimite: 10, valor: 280 },
      { diaLimite: 31, valor: 310 },
    ],
    createdAt: new Date("2023-03-01"),
  },
  {
    id: "5",
    poloId: "3",
    localId: "4",
    name: "Iniciante 1",
    nivel: "Iniciante 1",
    mensalidade: 140,
    taxaMatricula: 70,
    idadeAlvo: "4-6 anos",
    professoraIds: ["3"],
    professorasConfig: [{ professoraId: "3", tipo: "fixo", valor: 600 }],
    custos: [
      { id: "c7", descricao: "Aluguel Ginásio", categoria: "Aluguel", tipo: "fixo", valor: 200 },
    ],
    blocoCobranca: [
      { diaLimite: 10, valor: 140 },
      { diaLimite: 31, valor: 160 },
    ],
    createdAt: new Date("2023-03-20"),
  },
]

// Horários
export const horarios: Horario[] = [
  { id: "1", turmaId: "1", diaSemana: "Segunda", horaInicio: "10:00", horaFim: "11:00" },
  { id: "2", turmaId: "1", diaSemana: "Quarta", horaInicio: "10:00", horaFim: "11:00" },
  { id: "3", turmaId: "2", diaSemana: "Terça", horaInicio: "14:00", horaFim: "15:30" },
  { id: "4", turmaId: "2", diaSemana: "Quinta", horaInicio: "14:00", horaFim: "15:30" },
  { id: "5", turmaId: "3", diaSemana: "Segunda", horaInicio: "16:00", horaFim: "17:30" },
  { id: "6", turmaId: "3", diaSemana: "Sexta", horaInicio: "16:00", horaFim: "17:30" },
  { id: "7", turmaId: "4", diaSemana: "Terça", horaInicio: "18:00", horaFim: "20:00" },
  { id: "8", turmaId: "4", diaSemana: "Quinta", horaInicio: "18:00", horaFim: "20:00" },
  { id: "9", turmaId: "5", diaSemana: "Segunda", horaInicio: "09:00", horaFim: "10:00" },
  { id: "10", turmaId: "5", diaSemana: "Quarta", horaInicio: "09:00", horaFim: "10:00" },
]

// Alunas
export const alunas: Aluna[] = [
  {
    id: "1",
    nome: "Sofia Rodrigues",
    dataNascimento: new Date("2018-05-12"),
    turmaId: "1",
    status: "Ativa",
    taxaMatriculaPaga: true,
    responsavel: { nome: "Maria Rodrigues", cpf: "123.456.789-00", telefone: "(27) 99111-2222", whatsapp: "(27) 99111-2222", email: "maria@email.com" },
    endereco: { logradouro: "Rua das Flores", numero: "123", bairro: "Centro", cidade: "São Mateus", estado: "ES", cep: "29930-000" },
    createdAt: new Date("2023-02-10"),
  },
  {
    id: "2",
    nome: "Isabella Costa",
    dataNascimento: new Date("2017-08-23"),
    turmaId: "1",
    status: "Ativa",
    taxaMatriculaPaga: true,
    responsavel: { nome: "João Costa", cpf: "987.654.321-00", telefone: "(27) 99222-3333", whatsapp: "(27) 99222-3333", email: "joao@email.com" },
    endereco: { logradouro: "Av. Principal", numero: "456", bairro: "Vila Nova", cidade: "São Mateus", estado: "ES", cep: "29930-100" },
    createdAt: new Date("2023-02-15"),
  },
  {
    id: "3",
    nome: "Laura Almeida",
    dataNascimento: new Date("2016-03-14"),
    turmaId: "2",
    status: "Ativa",
    taxaMatriculaPaga: true,
    responsavel: { nome: "Paula Almeida", cpf: "111.222.333-44", telefone: "(27) 99333-4444", whatsapp: "(27) 99333-4444", email: "paula@email.com" },
    endereco: { logradouro: "Rua do Parque", numero: "78", bairro: "Jardim", cidade: "São Mateus", estado: "ES", cep: "29930-200" },
    createdAt: new Date("2023-02-20"),
  },
  {
    id: "4",
    nome: "Valentina Souza",
    dataNascimento: new Date("2015-11-30"),
    turmaId: "3",
    status: "Ativa",
    taxaMatriculaPaga: true,
    responsavel: { nome: "Carlos Souza", cpf: "555.666.777-88", telefone: "(27) 99444-5555", whatsapp: "(27) 99444-5555", email: "carlos@email.com" },
    endereco: { logradouro: "Rua das Palmeiras", numero: "321", bairro: "Bela Vista", cidade: "São Mateus", estado: "ES", cep: "29930-300" },
    createdAt: new Date("2023-03-05"),
  },
  {
    id: "5",
    nome: "Helena Martins",
    dataNascimento: new Date("2018-07-08"),
    turmaId: "1",
    status: "Ativa",
    taxaMatriculaPaga: false,
    responsavel: { nome: "Ana Martins", cpf: "222.333.444-55", telefone: "(27) 99555-6666", whatsapp: "(27) 99555-6666", email: "ana@email.com" },
    createdAt: new Date("2023-02-12"),
  },
  {
    id: "6",
    nome: "Alice Ferreira",
    dataNascimento: new Date("2014-01-19"),
    turmaId: "4",
    status: "Ativa",
    taxaMatriculaPaga: true,
    responsavel: { nome: "Roberto Ferreira", cpf: "333.444.555-66", telefone: "(27) 99666-7777", whatsapp: "(27) 99666-7777", email: "roberto@email.com" },
    endereco: { logradouro: "Av. Central", numero: "900", bairro: "Centro", cidade: "Vitória", estado: "ES", cep: "29010-000" },
    createdAt: new Date("2023-03-10"),
  },
  {
    id: "7",
    nome: "Sophia Lima",
    dataNascimento: new Date("2017-09-25"),
    turmaId: "5",
    status: "Ativa",
    taxaMatriculaPaga: true,
    responsavel: { nome: "Fernanda Lima", cpf: "444.555.666-77", telefone: "(27) 99777-8888", whatsapp: "(27) 99777-8888", email: "fernanda@email.com" },
    endereco: { logradouro: "Rua dos Coqueiros", numero: "15", bairro: "Norte", cidade: "Linhares", estado: "ES", cep: "29900-000" },
    createdAt: new Date("2023-03-25"),
  },
  {
    id: "8",
    nome: "Manuela Santos",
    dataNascimento: new Date("2016-12-03"),
    turmaId: "2",
    status: "Ativa",
    taxaMatriculaPaga: true,
    responsavel: { nome: "Pedro Santos", cpf: "666.777.888-99", telefone: "(27) 99888-9999", whatsapp: "(27) 99888-9999", email: "pedro@email.com" },
    endereco: { logradouro: "Rua das Acácias", numero: "200", bairro: "Sul", cidade: "São Mateus", estado: "ES", cep: "29930-400" },
    createdAt: new Date("2023-02-22"),
  },
]

// Pagamentos de Alunas
export const pagamentosAlunas: PagamentoAluna[] = [
  // Sofia Rodrigues - em dia
  {
    id: "1",
    alunaId: "1",
    mesReferencia: "2024-01",
    valor: 150,
    status: "Pago",
    dataPagamento: new Date("2024-01-05"),
  },
  {
    id: "2",
    alunaId: "1",
    mesReferencia: "2024-02",
    valor: 150,
    status: "Pago",
    dataPagamento: new Date("2024-02-05"),
  },
  {
    id: "3",
    alunaId: "1",
    mesReferencia: "2024-03",
    valor: 150,
    status: "Pago",
    dataPagamento: new Date("2024-03-05"),
  },

  // Isabella Costa - 2 meses pendentes
  {
    id: "4",
    alunaId: "2",
    mesReferencia: "2024-01",
    valor: 150,
    status: "Pago",
    dataPagamento: new Date("2024-01-10"),
  },
  { id: "5", alunaId: "2", mesReferencia: "2024-02", valor: 150, status: "Pendente" },
  { id: "6", alunaId: "2", mesReferencia: "2024-03", valor: 150, status: "Pendente" },

  // Laura Almeida - em dia
  {
    id: "7",
    alunaId: "3",
    mesReferencia: "2024-01",
    valor: 180,
    status: "Pago",
    dataPagamento: new Date("2024-01-07"),
  },
  {
    id: "8",
    alunaId: "3",
    mesReferencia: "2024-02",
    valor: 180,
    status: "Pago",
    dataPagamento: new Date("2024-02-07"),
  },
  {
    id: "9",
    alunaId: "3",
    mesReferencia: "2024-03",
    valor: 180,
    status: "Pago",
    dataPagamento: new Date("2024-03-07"),
  },

  // Valentina Souza - 1 mês pendente
  {
    id: "10",
    alunaId: "4",
    mesReferencia: "2024-01",
    valor: 220,
    status: "Pago",
    dataPagamento: new Date("2024-01-08"),
  },
  {
    id: "11",
    alunaId: "4",
    mesReferencia: "2024-02",
    valor: 220,
    status: "Pago",
    dataPagamento: new Date("2024-02-08"),
  },
  { id: "12", alunaId: "4", mesReferencia: "2024-03", valor: 220, status: "Pendente" },
]

// Pagamentos de Professoras
export const pagamentosProfessoras: PagamentoProfessora[] = [
  // Mariana Silva
  {
    id: "1",
    professoraId: "1",
    mesReferencia: "2024-01",
    valor: 2500,
    status: "Pago",
    dataPagamento: new Date("2024-01-30"),
  },
  {
    id: "2",
    professoraId: "1",
    mesReferencia: "2024-02",
    valor: 2500,
    status: "Pago",
    dataPagamento: new Date("2024-02-28"),
  },
  { id: "3", professoraId: "1", mesReferencia: "2024-03", valor: 2500, status: "Pendente" },

  // Carolina Santos
  {
    id: "4",
    professoraId: "2",
    mesReferencia: "2024-01",
    valor: 3000,
    status: "Pago",
    dataPagamento: new Date("2024-01-30"),
  },
  {
    id: "5",
    professoraId: "2",
    mesReferencia: "2024-02",
    valor: 3000,
    status: "Pago",
    dataPagamento: new Date("2024-02-28"),
  },
  { id: "6", professoraId: "2", mesReferencia: "2024-03", valor: 3000, status: "Pendente" },

  // Juliana Oliveira
  {
    id: "7",
    professoraId: "3",
    mesReferencia: "2024-01",
    valor: 1800,
    status: "Pago",
    dataPagamento: new Date("2024-01-30"),
  },
  {
    id: "8",
    professoraId: "3",
    mesReferencia: "2024-02",
    valor: 1800,
    status: "Pago",
    dataPagamento: new Date("2024-02-28"),
  },
  {
    id: "9",
    professoraId: "3",
    mesReferencia: "2024-03",
    valor: 1800,
    status: "Pago",
    dataPagamento: new Date("2023-03-05"),
  },
]

// Produtos
export const produtos: Produto[] = [
  {
    id: "1",
    nome: "Collant Oficial Equipe",
    descricao: "Collant oficial da Equipe Carolina Garcia, tecido premium, disponível em vários tamanhos.",
    valor: 180,
    categoria: "Uniforme",
    disponivel: true,
    tamanhos: ["2", "4", "6", "8", "10", "12", "14"],
    createdAt: new Date("2023-01-10"),
  },
  {
    id: "2",
    nome: "Sapatilha de Meia Ponta",
    descricao: "Sapatilha de meia ponta para ginástica rítmica, sola de couro, extremamente flexível.",
    valor: 95,
    categoria: "Sapatilha",
    disponivel: true,
    tamanhos: ["25", "26", "27", "28", "29", "30", "31", "32", "33", "34"],
    createdAt: new Date("2023-01-10"),
  },
  {
    id: "3",
    nome: "Bola de GR 16cm",
    descricao: "Bola oficial de ginástica rítmica 16cm, aprovada pela FIG, diversas cores disponíveis.",
    valor: 220,
    categoria: "Equipamento",
    disponivel: true,
    createdAt: new Date("2023-02-15"),
  },
  {
    id: "4",
    nome: "Corda de GR",
    descricao: "Corda de ginástica rítmica de nylon, comprimento regulável, com punhos emborrachados.",
    valor: 75,
    categoria: "Equipamento",
    disponivel: true,
    createdAt: new Date("2023-02-15"),
  },
  {
    id: "5",
    nome: "Meia Pé Inteiro",
    descricao: "Meia calça de pé inteiro para treino, tecido suave e resistente.",
    valor: 35,
    categoria: "Roupa",
    disponivel: true,
    tamanhos: ["PP", "P", "M", "G"],
    createdAt: new Date("2023-03-01"),
  },
  {
    id: "6",
    nome: "Fita 6m",
    descricao: "Fita de ginástica rítmica 6 metros, com bastão incluído.",
    valor: 110,
    categoria: "Equipamento",
    disponivel: false,
    createdAt: new Date("2023-03-10"),
  },
]

// Configuração Cora
export const configuracaoCora: ConfiguracaoCora = {
  clientId: "",
  clientSecret: "",
  ambiente: "sandbox",
  contaBancaria: "",
  chavePix: "",
  tipoChavePix: "CNPJ",
  webhookUrl: "",
  ativo: false,
  whatsappAdmin: "(27) 99000-0000",
}

// Cobranças geradas
export const cobrancasGeradas: CobrancaGerada[] = [
  {
    id: "1",
    alunaId: "2",
    mesReferencia: "2024-02",
    valor: 150,
    status: "Enviada",
    dataGeracao: new Date("2024-03-01"),
    dataVencimento: new Date("2024-03-10"),
  },
  {
    id: "2",
    alunaId: "2",
    mesReferencia: "2024-03",
    valor: 150,
    status: "Pendente",
    dataGeracao: new Date("2024-03-01"),
    dataVencimento: new Date("2024-04-10"),
  },
  {
    id: "3",
    alunaId: "4",
    mesReferencia: "2024-03",
    valor: 220,
    status: "Pendente",
    dataGeracao: new Date("2024-03-01"),
    dataVencimento: new Date("2024-04-10"),
  },
]

// Pré-matrículas (enviadas pelos pais)
export const preMatriculas: PreMatricula[] = [
  {
    id: "pm1",
    nomeAluna: "Gabriela Nunes",
    dataNascimento: "2019-04-10",
    nomeResponsavel: "Tatiane Nunes",
    cpfResponsavel: "321.654.987-11",
    telefone: "(27) 99100-2200",
    whatsapp: "(27) 99100-2200",
    email: "tatiane@email.com",
    logradouro: "Rua Sete de Setembro",
    numero: "410",
    bairro: "Centro",
    cidade: "São Mateus",
    estado: "ES",
    cep: "29930-000",
    observacoes: "Filha nunca fez ginástica antes.",
    status: "pendente",
    createdAt: new Date("2024-03-14"),
  },
  {
    id: "pm2",
    nomeAluna: "Beatriz Torres",
    dataNascimento: "2017-11-22",
    nomeResponsavel: "Renata Torres",
    cpfResponsavel: "456.789.123-22",
    telefone: "(27) 99200-3300",
    whatsapp: "(27) 99200-3300",
    email: "renata@email.com",
    logradouro: "Av. Getúlio Vargas",
    numero: "88",
    bairro: "Vila Nova",
    cidade: "Vitória",
    estado: "ES",
    cep: "29010-100",
    status: "pendente",
    createdAt: new Date("2024-03-15"),
  },
  {
    id: "pm3",
    nomeAluna: "Layla Mendes",
    dataNascimento: "2016-07-03",
    nomeResponsavel: "Adriana Mendes",
    cpfResponsavel: "789.123.456-33",
    telefone: "(27) 99300-4400",
    whatsapp: "(27) 99300-4400",
    email: "adriana@email.com",
    logradouro: "Rua das Mangueiras",
    numero: "55",
    bairro: "Jardim Tropical",
    cidade: "Linhares",
    estado: "ES",
    cep: "29900-200",
    observacoes: "Já tem experiência em ballet.",
    status: "aprovada",
    createdAt: new Date("2024-03-10"),
  },
]

// Chamadas registradas
export const chamadas: Chamada[] = [
  {
    id: "ch1",
    turmaId: "1",
    professoraId: "1",
    data: "2024-03-11",
    horarioId: "1",
    encerrada: true,
    presencas: [
      { alunaId: "1", status: "presente" },
      { alunaId: "2", status: "ausente", observacao: "Sem aviso" },
      { alunaId: "5", status: "presente" },
    ],
    createdAt: new Date("2024-03-11"),
  },
  {
    id: "ch2",
    turmaId: "1",
    professoraId: "1",
    data: "2024-03-13",
    horarioId: "2",
    encerrada: true,
    presencas: [
      { alunaId: "1", status: "presente" },
      { alunaId: "2", status: "justificada", observacao: "Atestado médico" },
      { alunaId: "5", status: "ausente" },
    ],
    createdAt: new Date("2024-03-13"),
  },
  {
    id: "ch3",
    turmaId: "2",
    professoraId: "1",
    data: "2024-03-12",
    horarioId: "3",
    encerrada: true,
    presencas: [
      { alunaId: "3", status: "presente" },
      { alunaId: "8", status: "presente" },
    ],
    createdAt: new Date("2024-03-12"),
  },
]

export function getCurrentUser(pathname: string): User {
  // Se estiver em rota de professora, simula login como professora
  if (pathname.startsWith("/professora")) {
    return {
      id: "1", // ID da professora Mariana Silva
      name: "Mariana Silva",
      email: "mariana@ginastica.com",
      role: "professora",
    }
  }

  // Caso contrário, é admin
  return {
    id: "1",
    name: "Ana Paula",
    email: "ana@ginastica.com",
    role: "admin",
  }
}

// Usuário padrão (admin) - mantido para compatibilidade
export const defaultCurrentUser: User = {
  id: "1",
  name: "Ana Paula",
  email: "ana@ginastica.com",
  role: "admin",
}
