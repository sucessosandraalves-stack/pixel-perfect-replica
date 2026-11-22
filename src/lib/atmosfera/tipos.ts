export type Perfil = "vendedor" | "comprador";

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
  hash: string;
  data: string;
}
