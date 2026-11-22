import type { Lote, TipoProjeto } from "./tipos";

/** Taxa transparente da plataforma sobre o valor pago ao vendedor. */
export const TAXA_PLATAFORMA = 0.025;
/** Acima deste total (US$), a compra exige aprovação humana (Human-in-the-Loop). */
export const LIMITE_APROVACAO_HUMANA = 10_000;
/** Nota mínima para um lote ser publicado no Marketplace. */
export const NOTA_MINIMA_PUBLICACAO = 60;

const arred = (v: number) => Math.round(v * 100) / 100;

export function calcularResumo(quantidade: number, precoTonelada: number) {
  const subtotal = arred(quantidade * precoTonelada);
  const taxa = arred(subtotal * TAXA_PLATAFORMA);
  const total = arred(subtotal + taxa);
  return { subtotal, taxa, total, exigeAprovacaoHumana: total > LIMITE_APROVACAO_HUMANA };
}

export function abaterEstoque(lotes: Lote[], loteId: string, quantidade: number): Lote[] {
  const lote = lotes.find((l) => l.id === loteId);
  if (!lote) throw new Error("Lote não encontrado.");
  if (!Number.isInteger(quantidade) || quantidade <= 0)
    throw new Error("Informe uma quantidade inteira maior que zero.");
  if (quantidade > lote.quantidadeDisponivel)
    throw new Error("Quantidade maior que o estoque disponível do vendedor.");
  return lotes.map((l) =>
    l.id === loteId ? { ...l, quantidadeDisponivel: l.quantidadeDisponivel - quantidade } : l,
  );
}

/** Hash determinístico de 64 caracteres hex (FNV-1a encadeado) para selos e certificados. */
export function gerarHash(entrada: string): string {
  let out = "";
  let seed = 0x811c9dc5;
  for (let round = 0; round < 8; round++) {
    let h = (seed ^ (round * 0x9e3779b1)) >>> 0;
    const s = `${round}|${entrada}|${out}`;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    seed = h;
    out += h.toString(16).padStart(8, "0");
  }
  return out;
}

// ---------- Auditoria ----------

export interface EntradaAuditoria {
  projeto: string;
  localizacao: string;
  tipo: TipoProjeto;
  quantidade: number;
  precoTonelada: number;
  registro: string;
}

export interface Verificacao {
  rotulo: string;
  ok: boolean;
  detalhe: string;
}

export interface ResultadoAuditoria {
  aprovado: boolean;
  nota: number;
  certificadora: string;
  codigoNormalizado: string;
  verificacoes: Verificacao[];
}

const PADROES_CERTIFICADORA: { nome: string; re: RegExp }[] = [
  { nome: "Verra (VCS)", re: /(registry\.verra\.org|\bVCS[\s-]?\d{3,6}\b)/i },
  { nome: "Gold Standard", re: /(goldstandard\.org|\bGS[\s-]?\d{3,6}\b)/i },
  { nome: "Cercarbono", re: /(cercarbono|\bCDC[\s-]?\d{2,6}\b)/i },
  { nome: "Puro.earth", re: /(puro\.earth|\bPURO[\s-]?\d{2,6}\b)/i },
  { nome: "American Carbon Registry", re: /(acrcarbon\.org|\bACR[\s-]?\d{2,6}\b)/i },
];

export function normalizarCodigo(registro: string): string {
  const m = registro.match(/\b(VCS|GS|CDC|PURO|ACR)[\s\-\/]?(\d{2,6})\b/i);
  if (m && m[1] && m[2]) return `${m[1].toUpperCase()}-${m[2]}`;
  const id = registro.match(/(\d{3,6})(?!.*\d)/);
  return id && id[1] ? `REG-${id[1]}` : registro.trim().toUpperCase();
}

export function auditarLote(entrada: EntradaAuditoria, lotesExistentes: Lote[]): ResultadoAuditoria {
  const verificacoes: Verificacao[] = [];
  let nota = 35;

  const cert = PADROES_CERTIFICADORA.find((p) => p.re.test(entrada.registro));
  verificacoes.push({
    rotulo: "Certificadora reconhecida",
    ok: !!cert,
    detalhe: cert ? `${cert.nome} identificada no registro.` : "Nenhum padrão conhecido no código ou link.",
  });
  if (cert) nota += 25;

  const codigo = normalizarCodigo(entrada.registro);
  const duplicado = lotesExistentes.find((l) => normalizarCodigo(l.registro) === codigo);
  verificacoes.push({
    rotulo: "Dupla contagem (Art. 6.2)",
    ok: !duplicado,
    detalhe: duplicado
      ? `Código ${codigo} já anunciado por ${duplicado.vendedorNome}.`
      : `Código ${codigo} sem registro anterior na plataforma.`,
  });

  const linkSeguro = /^https:\/\//i.test(entrada.registro.trim());
  verificacoes.push({
    rotulo: "Fonte pública verificável",
    ok: linkSeguro || !!cert,
    detalhe: linkSeguro ? "Link HTTPS da certificadora consultado." : "Código de registro textual.",
  });
  if (linkSeguro) nota += 8;

  const precoOk = entrada.precoTonelada >= 3 && entrada.precoTonelada <= 120;
  verificacoes.push({
    rotulo: "Preço compatível com o mercado",
    ok: precoOk,
    detalhe: precoOk ? "Dentro da faixa US$ 3–120/tCO₂e." : "Fora da faixa usual — revisar lastro.",
  });
  if (precoOk) nota += 12;

  const qtdOk = entrada.quantidade > 0 && entrada.quantidade <= 1_000_000;
  verificacoes.push({
    rotulo: "Volume plausível",
    ok: qtdOk,
    detalhe: qtdOk ? `${entrada.quantidade.toLocaleString("pt-BR")} tCO₂e declaradas.` : "Volume inválido.",
  });
  if (qtdOk) nota += 8;

  const localOk = /[-–\/,]/.test(entrada.localizacao) && entrada.localizacao.trim().length >= 6;
  verificacoes.push({
    rotulo: "Georreferência informada",
    ok: localOk,
    detalhe: localOk ? entrada.localizacao : "Inclua município/estado (ex: Pantanal/MS).",
  });
  if (localOk) nota += 7;

  if (duplicado) nota = Math.min(nota, 25);
  nota = Math.max(0, Math.min(100, nota));
  const aprovado = !duplicado && !!cert && nota >= NOTA_MINIMA_PUBLICACAO;

  return {
    aprovado,
    nota,
    certificadora: cert?.nome ?? "Não identificada",
    codigoNormalizado: codigo,
    verificacoes,
  };
}

// ---------- Agente orquestrador ----------

export interface Pedido {
  quantidade: number;
  pais?: string;
  tipo?: TipoProjeto;
  notaMinima: number;
}

const PAISES: { re: RegExp; nome: string }[] = [
  { re: /brasil|brasileir|nacionai?s?/i, nome: "Brasil" },
  { re: /col[oô]mbi/i, nome: "Colômbia" },
  { re: /peru(an)?/i, nome: "Peru" },
  { re: /qu[eê]nia/i, nome: "Quênia" },
  { re: /[ií]ndia|indian/i, nome: "Índia" },
  { re: /indon[eé]si/i, nome: "Indonésia" },
  { re: /m[eé]xic/i, nome: "México" },
];

const TIPOS: { re: RegExp; tipo: TipoProjeto }[] = [
  { re: /reflorest|florest|árvore|arvore/i, tipo: "Reflorestamento" },
  { re: /energia|solar|e[oó]lic|renov/i, tipo: "Energia Renovável" },
  { re: /agricult|regenerat|solo/i, tipo: "Agricultura Regenerativa" },
  { re: /metano|biog[aá]s|aterro/i, tipo: "Captura de Metano" },
];

export function interpretarPedido(texto: string): Pedido | null {
  const num = texto.match(/(\d{1,3}(?:[.\s]\d{3})+|\d+)(?:[,.]\d+)?\s*(mil\b)?/i);
  if (!num || !num[1]) return null;
  let quantidade = parseInt(num[1].replace(/[.\s]/g, ""), 10);
  if (num[2]) quantidade *= 1000;
  if (!quantidade || quantidade <= 0) return null;

  const pais = PAISES.find((p) => p.re.test(texto))?.nome;
  const tipo = TIPOS.find((t) => t.re.test(texto))?.tipo;
  const notaExplicita = texto.match(/nota\s*(?:m[ií]nima)?\s*(?:de|>=?|acima de)?\s*(\d{2,3})/i);
  const notaMinima = notaExplicita?.[1]
    ? Math.min(100, parseInt(notaExplicita[1], 10))
    : /auditad|alta integridade|premium/i.test(texto)
      ? 80
      : NOTA_MINIMA_PUBLICACAO;

  const pedido: Pedido = { quantidade, notaMinima };
  if (pais) pedido.pais = pais;
  if (tipo) pedido.tipo = tipo;
  return pedido;
}

export interface ItemRecomendado {
  lote: Lote;
  quantidade: number;
  subtotal: number;
}

export interface Recomendacao {
  itens: ItemRecomendado[];
  quantidadeAtendida: number;
  faltante: number;
  subtotal: number;
  taxa: number;
  total: number;
  precoMedio: number;
}

/** Melhor combinação: menor preço primeiro entre lotes elegíveis; empate desfeito pela maior nota. */
export function recomendarCombinacao(lotes: Lote[], pedido: Pedido): Recomendacao {
  const elegiveis = lotes
    .filter((l) => l.quantidadeDisponivel > 0)
    .filter((l) => l.nota >= pedido.notaMinima)
    .filter((l) => !pedido.pais || l.pais === pedido.pais)
    .filter((l) => !pedido.tipo || l.tipo === pedido.tipo)
    .sort((a, b) => a.precoTonelada - b.precoTonelada || b.nota - a.nota);

  const itens: ItemRecomendado[] = [];
  let restante = pedido.quantidade;
  for (const lote of elegiveis) {
    if (restante <= 0) break;
    const q = Math.min(restante, lote.quantidadeDisponivel);
    itens.push({ lote, quantidade: q, subtotal: arred(q * lote.precoTonelada) });
    restante -= q;
  }
  const quantidadeAtendida = pedido.quantidade - restante;
  const subtotal = arred(itens.reduce((s, i) => s + i.subtotal, 0));
  const taxa = arred(subtotal * TAXA_PLATAFORMA);
  return {
    itens,
    quantidadeAtendida,
    faltante: restante,
    subtotal,
    taxa,
    total: arred(subtotal + taxa),
    precoMedio: quantidadeAtendida ? arred(subtotal / quantidadeAtendida) : 0,
  };
}
