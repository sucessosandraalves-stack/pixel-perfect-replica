import { useSyncExternalStore } from "react";
import { COMPRADOR_DEMO, VENDEDOR_DEMO, lotesIniciais } from "./dados-iniciais";
import {
  abaterEstoque,
  calcularResumo,
  exigirPagamentoConfirmado,
  gerarHash,
  type ResultadoAuditoria,
} from "./regras";
import type { Compra, Enquadramento, Lote, PagamentoConfirmado, Perfil, TipoProjeto, Usuario } from "./tipos";

export interface Estado {
  hidratado: boolean;
  usuarios: Usuario[];
  sessaoId: string | null;
  lotes: Lote[];
  compras: Compra[];
}

const CHAVE = "atmosfera:v1";

function estadoInicial(hidratado: boolean): Estado {
  return {
    hidratado,
    usuarios: [VENDEDOR_DEMO, COMPRADOR_DEMO],
    sessaoId: null,
    lotes: lotesIniciais(),
    compras: [],
  };
}

const ESTADO_SERVIDOR = estadoInicial(false);
let estado: Estado | null = null;
const ouvintes = new Set<() => void>();

function carregar(): Estado {
  if (estado) return estado;
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (bruto) {
      const salvo = JSON.parse(bruto) as Omit<Estado, "hidratado">;
      estado = { ...salvo, hidratado: true };
      return estado;
    }
  } catch {
    /* armazenamento indisponível: segue com dados iniciais */
  }
  estado = estadoInicial(true);
  return estado;
}

function definir(atualizar: (e: Estado) => Estado) {
  estado = atualizar(carregar());
  try {
    const { hidratado: _h, ...persistir } = estado;
    window.localStorage.setItem(CHAVE, JSON.stringify(persistir));
  } catch {
    /* ignora */
  }
  ouvintes.forEach((o) => o());
}

function assinar(o: () => void) {
  ouvintes.add(o);
  return () => ouvintes.delete(o);
}

export function useAtmosfera<T>(seletor: (e: Estado) => T): T {
  return useSyncExternalStore(
    assinar,
    () => seletor(carregar()),
    () => seletor(ESTADO_SERVIDOR),
  );
}

export function useSessao() {
  const hidratado = useAtmosfera((e) => e.hidratado);
  const usuario = useAtmosfera((e) => e.usuarios.find((u) => u.id === e.sessaoId) ?? null);
  return { hidratado, usuario };
}

const novoId = (prefixo: string) =>
  `${prefixo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const acoes = {
  cadastrar(dados: Omit<Usuario, "id">): Usuario {
    const usuario: Usuario = { ...dados, id: novoId("u") };
    definir((e) => ({ ...e, usuarios: [...e.usuarios, usuario], sessaoId: usuario.id }));
    return usuario;
  },
  entrarDemo(perfil: Perfil) {
    const id = perfil === "vendedor" ? VENDEDOR_DEMO.id : COMPRADOR_DEMO.id;
    definir((e) => ({ ...e, sessaoId: id }));
  },
  sair() {
    definir((e) => ({ ...e, sessaoId: null }));
  },
  restaurarDemo() {
    definir((e) => ({ ...estadoInicial(true), sessaoId: e.sessaoId }));
  },
  publicarLote(
    vendedor: Usuario,
    dados: {
      projeto: string;
      localizacao: string;
      tipo: TipoProjeto;
      quantidade: number;
      precoTonelada: number;
      registro: string;
    },
    auditoria: ResultadoAuditoria,
  ): Lote {
    const id = novoId("lote");
    const lote: Lote = {
      id,
      vendedorId: vendedor.id,
      vendedorNome: vendedor.nome,
      vendedorDocumento: vendedor.documento,
      projeto: dados.projeto,
      localizacao: dados.localizacao,
      pais: vendedor.pais,
      tipo: dados.tipo,
      quantidadeTotal: dados.quantidade,
      quantidadeDisponivel: dados.quantidade,
      precoTonelada: dados.precoTonelada,
      registro: dados.registro,
      certificadora: auditoria.certificadora,
      nota: auditoria.nota,
      hashAuditoria: gerarHash(`auditoria|${id}|${dados.registro}|${auditoria.nota}`),
      vintage: new Date().getFullYear(),
      criadoEm: new Date().toISOString(),
    };
    definir((e) => ({ ...e, lotes: [lote, ...e.lotes] }));
    return lote;
  },
  comprar(
    comprador: Usuario,
    loteId: string,
    quantidade: number,
    aprovacaoHumana: boolean,
    pagamento: PagamentoConfirmado,
    enquadramento: Enquadramento,
  ): Compra {
    exigirPagamentoConfirmado(pagamento);
    const atual = carregar();
    const lote = atual.lotes.find((l) => l.id === loteId);
    if (!lote) throw new Error("Lote não encontrado.");
    const novosLotes = abaterEstoque(atual.lotes, loteId, quantidade);
    const resumo = calcularResumo(quantidade, lote.precoTonelada);
    if (resumo.exigeAprovacaoHumana && !aprovacaoHumana)
      throw new Error("Compra acima de US$ 10.000 exige aprovação humana.");
    const data = new Date().toISOString();
    const id = novoId("cmp");
    const compra: Compra = {
      id,
      loteId,
      compradorId: comprador.id,
      compradorNome: comprador.nome,
      compradorDocumento: comprador.documento,
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
      quantidade,
      precoTonelada: lote.precoTonelada,
      subtotal: resumo.subtotal,
      taxa: resumo.taxa,
      total: resumo.total,
      aprovacaoHumana: resumo.exigeAprovacaoHumana,
      pagamento,
      enquadramento,
      hash: gerarHash(`compra|${id}|${loteId}|${comprador.id}|${quantidade}|${data}`),
      data,
    };
    definir((e) => ({ ...e, lotes: novosLotes, compras: [compra, ...e.compras] }));
    return compra;
  },
};
