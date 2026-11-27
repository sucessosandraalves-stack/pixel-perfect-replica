import { calcularResumo, gerarEscrowId, gerarHash } from "./regras";
import type { Compra, FormaPagamento, Lote, RegistroAuditoria, StatusLiquidacao, Usuario } from "./tipos";

export const VENDEDOR_DEMO: Usuario = {
  id: "u-vendedor-demo",
  nome: "Fazenda Santa Clara Agropecuária Ltda.",
  documento: "12.345.678/0001-90",
  pais: "Brasil",
  estado: "MS",
  email: "carbono@fazendasantaclara.com.br",
  perfil: "vendedor",
  atuacao: "Produtor rural",
};

export const COMPRADOR_DEMO: Usuario = {
  id: "u-comprador-demo",
  nome: "Siderúrgica Horizonte S.A.",
  documento: "98.765.432/0001-10",
  pais: "Brasil",
  estado: "MG",
  email: "esg@horizonte.com.br",
  perfil: "comprador",
  atuacao: "Indústria (escopo 1 e 2)",
};

export const ADMIN_DEMO: Usuario = {
  id: "u-admin-demo",
  nome: "Gestão ATMOSFERA",
  documento: "52.418.903/0001-27",
  pais: "Brasil",
  estado: "SP",
  email: "gestao@atmosfera.eco.br",
  perfil: "admin",
  atuacao: "Gestão da plataforma",
};

type Semente = Omit<Lote, "hashAuditoria" | "quantidadeDisponivel" | "criadoEm"> & {
  disponivel?: number;
};

const sementes: Semente[] = [
  {
    id: "lote-001",
    vendedorId: VENDEDOR_DEMO.id,
    vendedorNome: VENDEDOR_DEMO.nome,
    vendedorDocumento: VENDEDOR_DEMO.documento,
    projeto: "Fazenda Santa Clara — Corredor Ecológico",
    localizacao: "Corumbá - Pantanal/MS",
    pais: "Brasil",
    tipo: "Reflorestamento",
    quantidadeTotal: 1200,
    disponivel: 180,
    precoTonelada: 24.5,
    registro: "VCS-2741",
    certificadora: "Verra (VCS)",
    nota: 94,
    vintage: 2025,
  },
  {
    id: "lote-002",
    vendedorId: "u-v-02",
    vendedorNome: "Cooperativa Agroflorestal Tomé-Açu",
    vendedorDocumento: "05.112.334/0001-77",
    projeto: "SAFs da Cooperativa Tomé-Açu",
    localizacao: "Tomé-Açu - Pará/PA",
    pais: "Brasil",
    tipo: "Agricultura Regenerativa",
    quantidadeTotal: 800,
    disponivel: 500,
    precoTonelada: 19.8,
    registro: "https://registry.goldstandard.org/projects/details/GS1187",
    certificadora: "Gold Standard",
    nota: 88,
    vintage: 2024,
  },
  {
    id: "lote-003",
    vendedorId: "u-v-03",
    vendedorNome: "Biogás Vale do Taquari S.A.",
    vendedorDocumento: "21.908.553/0001-04",
    projeto: "Aterro Sanitário Taquari — Captura de Metano",
    localizacao: "Estrela - Vale do Taquari/RS",
    pais: "Brasil",
    tipo: "Captura de Metano",
    quantidadeTotal: 2500,
    disponivel: 2250,
    precoTonelada: 11.2,
    registro: "VCS-1932",
    certificadora: "Verra (VCS)",
    nota: 82,
    vintage: 2024,
  },
  {
    id: "lote-004",
    vendedorId: "u-v-04",
    vendedorNome: "Ventos do Sertão Energia",
    vendedorDocumento: "33.201.876/0001-55",
    projeto: "Complexo Eólico Chapada do Araripe",
    localizacao: "Araripina - Sertão/PE",
    pais: "Brasil",
    tipo: "Energia Renovável",
    quantidadeTotal: 5000,
    precoTonelada: 7.4,
    registro: "GS-2290",
    certificadora: "Gold Standard",
    nota: 76,
    vintage: 2023,
  },
  {
    id: "lote-005",
    vendedorId: "u-v-05",
    vendedorNome: "Fundación Bosques del Chocó",
    vendedorDocumento: "NIT 901.442.118-3",
    projeto: "Restauración Bosque del Chocó",
    localizacao: "Quibdó - Chocó/CO",
    pais: "Colômbia",
    tipo: "Reflorestamento",
    quantidadeTotal: 1500,
    precoTonelada: 21.0,
    registro: "CDC-0418",
    certificadora: "Cercarbono",
    nota: 85,
    vintage: 2025,
  },
  {
    id: "lote-006",
    vendedorId: "u-v-06",
    vendedorNome: "Kasigau Community Trust",
    vendedorDocumento: "KRA P051234567Z",
    projeto: "Kasigau Dryland Restoration",
    localizacao: "Taita-Taveta - Costa/KE",
    pais: "Quênia",
    tipo: "Reflorestamento",
    quantidadeTotal: 3000,
    precoTonelada: 16.5,
    registro: "https://registry.verra.org/app/projectDetail/VCS/612",
    certificadora: "Verra (VCS)",
    nota: 91,
    vintage: 2024,
  },
  {
    id: "lote-007",
    vendedorId: "u-v-07",
    vendedorNome: "Rajasthan Solar Collective",
    vendedorDocumento: "GSTIN 08AABCR1234F1Z5",
    projeto: "Parque Solar Bhadla Fase III",
    localizacao: "Jodhpur - Rajasthan/IN",
    pais: "Índia",
    tipo: "Energia Renovável",
    quantidadeTotal: 8000,
    precoTonelada: 5.9,
    registro: "GS-3051",
    certificadora: "Gold Standard",
    nota: 72,
    vintage: 2023,
  },
  {
    id: "lote-008",
    vendedorId: "u-v-08",
    vendedorNome: "Ejido Sierra Gorda A.C.",
    vendedorDocumento: "RFC ESG010203AB1",
    projeto: "Manejo Florestal Sierra Gorda",
    localizacao: "Jalpan - Querétaro/MX",
    pais: "México",
    tipo: "Reflorestamento",
    quantidadeTotal: 900,
    precoTonelada: 18.0,
    registro: "ACR-0577",
    certificadora: "American Carbon Registry",
    nota: 80,
    vintage: 2024,
  },
  {
    id: "lote-009",
    vendedorId: "u-v-09",
    vendedorNome: "Produtores Associados do Cerrado",
    vendedorDocumento: "44.556.112/0001-30",
    projeto: "Integração Lavoura-Pecuária-Floresta Rio Verde",
    localizacao: "Rio Verde - Cerrado/GO",
    pais: "Brasil",
    tipo: "Agricultura Regenerativa",
    quantidadeTotal: 1100,
    precoTonelada: 15.3,
    registro: "VCS-3318",
    certificadora: "Verra (VCS)",
    nota: 86,
    vintage: 2025,
  },
];

export function lotesIniciais(): Lote[] {
  return sementes.map(({ disponivel, ...s }) => ({
    ...s,
    quantidadeDisponivel: disponivel ?? s.quantidadeTotal,
    hashAuditoria: gerarHash(`auditoria|${s.id}|${s.registro}|${s.nota}`),
    criadoEm: "2026-10-01T12:00:00.000Z",
  }));
}

interface SementeCompra {
  id: string;
  loteId: string;
  quantidade: number;
  data: string;
  compradorId: string;
  compradorNome: string;
  compradorDocumento: string;
  forma: FormaPagamento;
  status: StatusLiquidacao;
  finalidade: "compensacao" | "carteira";
}

const sementesCompras: SementeCompra[] = [
  {
    id: "cmp-demo-001",
    loteId: "lote-001",
    quantidade: 600,
    data: "2026-11-18T14:30:00.000Z",
    compradorId: COMPRADOR_DEMO.id,
    compradorNome: COMPRADOR_DEMO.nome,
    compradorDocumento: COMPRADOR_DEMO.documento,
    forma: "pix",
    status: "liquidado",
    finalidade: "compensacao",
  },
  {
    id: "cmp-demo-002",
    loteId: "lote-001",
    quantidade: 420,
    data: "2026-11-21T10:15:00.000Z",
    compradorId: "u-c-02",
    compradorNome: "Vale Verde Alimentos S.A.",
    compradorDocumento: "11.222.333/0001-44",
    forma: "swift",
    status: "retido_escrow",
    finalidade: "carteira",
  },
  {
    id: "cmp-demo-003",
    loteId: "lote-002",
    quantidade: 300,
    data: "2026-11-23T16:45:00.000Z",
    compradorId: COMPRADOR_DEMO.id,
    compradorNome: COMPRADOR_DEMO.nome,
    compradorDocumento: COMPRADOR_DEMO.documento,
    forma: "cartao",
    status: "liquidado",
    finalidade: "compensacao",
  },
  {
    id: "cmp-demo-004",
    loteId: "lote-003",
    quantidade: 250,
    data: "2026-11-25T09:20:00.000Z",
    compradorId: "u-c-04",
    compradorNome: "AeroNorte Logística S.A.",
    compradorDocumento: "22.333.444/0001-55",
    forma: "pix",
    status: "retido_escrow",
    finalidade: "compensacao",
  },
];

export function comprasIniciais(): Compra[] {
  const lotes = lotesIniciais();
  return sementesCompras.map((s) => {
    const lote = lotes.find((l) => l.id === s.loteId);
    if (!lote) throw new Error(`Lote de demonstração não encontrado: ${s.loteId}`);
    const resumo = calcularResumo(s.quantidade, lote.precoTonelada);
    return {
      id: s.id,
      loteId: lote.id,
      compradorId: s.compradorId,
      compradorNome: s.compradorNome,
      compradorDocumento: s.compradorDocumento,
      vendedorNome: lote.vendedorNome,
      vendedorDocumento: lote.vendedorDocumento,
      projeto: lote.projeto,
      localizacao: lote.localizacao,
      pais: lote.pais,
      tipo: lote.tipo,
      registro: lote.registro,
      certificadora: lote.certificadora,
      nota: lote.nota,
      vintage: lote.vintage,
      quantidade: s.quantidade,
      precoTonelada: lote.precoTonelada,
      subtotal: resumo.subtotal,
      taxa: resumo.taxa,
      total: resumo.total,
      aprovacaoHumana: resumo.exigeAprovacaoHumana,
      pagamento: {
        forma: s.forma,
        escrowId: gerarEscrowId(s.id),
        confirmado: true,
        confirmadoEm: s.data,
      },
      enquadramento: s.finalidade === "compensacao" ? { finalidade: s.finalidade, escopo: 1 } : { finalidade: s.finalidade },
      statusLiquidacao: s.status,
      hash: gerarHash(`compra|${s.id}|${lote.id}|${s.compradorId}|${s.quantidade}|${s.data}`),
      data: s.data,
    };
  });
}

export function auditoriasIniciais(): RegistroAuditoria[] {
  const aprovadas = lotesIniciais().map((lote, indice): RegistroAuditoria => ({
    id: `aud-${lote.id}`,
    data: new Date(Date.UTC(2026, 9, 1 + indice, 12)).toISOString(),
    projeto: lote.projeto,
    vendedorNome: lote.vendedorNome,
    registro: lote.registro,
    certificadora: lote.certificadora,
    nota: lote.nota,
    status: "aprovada",
    duplaContagem: false,
    hash: lote.hashAuditoria,
  }));
  const reprovadas: RegistroAuditoria[] = [
    {
      id: "aud-demo-reprovada-001",
      data: "2026-11-24T11:40:00.000Z",
      projeto: "Fazenda Boa Vista — Recuperação de Mata Ciliar",
      vendedorNome: "Fazenda Boa Vista Ltda.",
      registro: "VCS-2741",
      certificadora: "Verra (VCS)",
      nota: 25,
      status: "reprovada",
      duplaContagem: true,
      motivoReprovacao: "Dupla contagem: o registro VCS-2741 já foi anunciado pela Fazenda Santa Clara Agropecuária Ltda.",
      hash: gerarHash("auditoria|aud-demo-reprovada-001|VCS-2741|25"),
    },
    {
      id: "aud-demo-reprovada-002",
      data: "2026-11-26T15:10:00.000Z",
      projeto: "Solar Horizonte Fase II",
      vendedorNome: "Solar Horizonte Participações S.A.",
      registro: "GS-2290",
      certificadora: "Gold Standard",
      nota: 25,
      status: "reprovada",
      duplaContagem: true,
      motivoReprovacao: "Dupla contagem: o registro GS-2290 já foi anunciado pela Ventos do Sertão Energia.",
      hash: gerarHash("auditoria|aud-demo-reprovada-002|GS-2290|25"),
    },
  ];
  return [...aprovadas, ...reprovadas];
}
