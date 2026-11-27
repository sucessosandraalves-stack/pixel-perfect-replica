export type Perfil = "vendedor" | "comprador" | "admin";

export const TIPOS_PROJETO = [
  "Reflorestamento",
  "Energia Renovável",
  "Agricultura Regenerativa",
  "Captura de Metano",
] as const;
export type TipoProjeto = (typeof TIPOS_PROJETO)[number];

export interface Usuario {
  id: string;
  nome: string;
  documento: string;
  pais: string;
  estado: string;
  email: string;
  perfil: Perfil;
  atuacao: string;
}

export interface Lote {
  id: string;
  vendedorId: string;
  vendedorNome: string;
  vendedorDocumento: string;
  projeto: string;
  localizacao: string;
  pais: string;
  tipo: TipoProjeto;
  quantidadeTotal: number;
  quantidadeDisponivel: number;
  precoTonelada: number;
  registro: string;
  certificadora: string;
  nota: number;
  hashAuditoria: string;
  vintage: number;
  criadoEm: string;
}

export type FormaPagamento = "pix" | "swift" | "cartao";

export interface PagamentoConfirmado {
  forma: FormaPagamento;
  escrowId: string;
  confirmado: boolean;
  confirmadoEm: string;
  /** Últimos 4 dígitos, apenas para cartão. Número completo nunca é guardado. */
  ultimos4?: string;
  /** Valor convertido em reais, apenas para PIX. */
  valorBRL?: number;
}

export type FinalidadeContabil = "compensacao" | "carteira";
export type Escopo = 1 | 2 | 3;

export interface Enquadramento {
  finalidade: FinalidadeContabil;
  /** Escopo de emissões compensado, apenas para compensação. */
  escopo?: Escopo;
}

export type StatusLiquidacao = "retido_escrow" | "liquidado";

export interface RegistroAuditoria {
  id: string;
  data: string;
  projeto: string;
  vendedorNome: string;
  registro: string;
  certificadora: string;
  nota: number;
  status: "aprovada" | "reprovada";
  duplaContagem: boolean;
  motivoReprovacao?: string;
  hash: string;
}

export interface Compra {
  id: string;
  loteId: string;
  compradorId: string;
  compradorNome: string;
  compradorDocumento: string;
  vendedorNome: string;
  vendedorDocumento: string;
  projeto: string;
  localizacao: string;
  pais: string;
  tipo: TipoProjeto;
  registro: string;
  certificadora: string;
  nota: number;
  vintage: number;
  quantidade: number;
  precoTonelada: number;
  subtotal: number;
  taxa: number;
  total: number;
  aprovacaoHumana: boolean;
  pagamento?: PagamentoConfirmado;
  enquadramento?: Enquadramento;
  statusLiquidacao?: StatusLiquidacao;
  hash: string;
  data: string;
}
