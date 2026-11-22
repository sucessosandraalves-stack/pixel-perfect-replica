import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, Loader2, SendHorizontal, ShoppingCart, User } from "lucide-react";
import { CabecalhoPagina } from "@/components/atmosfera/AppShell";
import { RequerSessao } from "@/components/atmosfera/RequerSessao";
import { SeloNota } from "@/components/atmosfera/SeloNota";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatarNumero, formatarUSD } from "@/lib/atmosfera/formato";
import { interpretarPedido, recomendarCombinacao, type Pedido, type Recomendacao } from "@/lib/atmosfera/regras";
import { useAtmosfera } from "@/lib/atmosfera/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assistente")({
  head: () => ({
    meta: [
      { title: "Assistente Inteligente de Compra de créditos de carbono | ATMOSFERA" },
      { name: "description", content: "Diga quanto precisa compensar e o agente de IA monta a melhor combinação de ofertas P2P." },
      { property: "og:title", content: "Assistente de Compra — ATMOSFERA" },
      { property: "og:description", content: "Agente orquestrador que recomenda a melhor combinação de créditos de carbono." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <RequerSessao>{() => <Assistente />}</RequerSessao>,
});

type Mensagem =
  | { id: number; autor: "usuario"; texto: string }
  | { id: number; autor: "agente"; texto: string; pedido?: Pedido; rec?: Recomendacao; pensando?: string[] };

const SUGESTOES = [
  "Preciso comprar 250 toneladas de créditos brasileiros auditados",
  "Quero 1.000 t de energia renovável com o menor preço",
  "Compensar 400 toneladas de reflorestamento com nota mínima 85",
  "Preciso de 150 t de captura de metano",
];

function descreverPedido(p: Pedido) {
  const partes = [`${formatarNumero(p.quantidade)} tCO₂e`];
  if (p.tipo) partes.push(p.tipo.toLowerCase());
  if (p.pais) partes.push(`origem ${p.pais}`);
  partes.push(`nota ≥ ${p.notaMinima}`);
  return partes.join(" · ");
}

function Assistente() {
  const lotes = useAtmosfera((e) => e.lotes);
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [msgs, setMsgs] = useState<Mensagem[]>([
    {
      id: 0,
      autor: "agente",
      texto:
        "Olá! Sou o Agente Orquestrador da ATMOSFERA. Diga quantas toneladas você precisa compensar — e, se quiser, país, tipo de projeto ou nota mínima. Eu monto a melhor combinação de ofertas P2P disponíveis.",
    },
  ]);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs]);

  function perguntar(entrada: string) {
    const t = entrada.trim();
    if (!t || ocupado) return;
    setTexto("");
    setOcupado(true);
    const idU = Date.now();
    const idA = idU + 1;
    const pedido = interpretarPedido(t);
    const passos = pedido
      ? [
          `Interpretando pedido: ${descreverPedido(pedido)}`,
          `Consultando ${lotes.length} lotes publicados no Marketplace…`,
          "Filtrando por nota de auditoria IFRS S2 e estoque disponível…",
          "Otimizando combinação por menor custo total…",
        ]
      : ["Interpretando pedido…"];
    setMsgs((m) => [...m, { id: idU, autor: "usuario", texto: t }, { id: idA, autor: "agente", texto: "", pensando: [] }]);

    passos.forEach((p, i) => {
      setTimeout(() => {
        setMsgs((m) => m.map((x) => (x.id === idA && x.autor === "agente" ? { ...x, pensando: [...(x.pensando ?? []), p] } : x)));
      }, 450 * (i + 1));
    });

    setTimeout(() => {
      let resposta: Mensagem;
      if (!pedido) {
        resposta = { id: idA, autor: "agente", texto: "Não identifiquei a quantidade. Tente algo como “Preciso de 300 toneladas de créditos brasileiros”." };
      } else {
        const rec = recomendarCombinacao(lotes, pedido);
        const textoResp =
          rec.itens.length === 0
            ? "Não encontrei lotes que atendam a esses critérios. Experimente reduzir a nota mínima ou remover o filtro de país/tipo."
            : rec.faltante > 0
              ? `Consegui reunir ${formatarNumero(rec.quantidadeAtendida)} de ${formatarNumero(pedido.quantidade)} t com os critérios pedidos. Faltam ${formatarNumero(rec.faltante)} t — considere ampliar os filtros.`
              : `Encontrei a melhor combinação para ${formatarNumero(pedido.quantidade)} t, com preço médio de ${formatarUSD(rec.precoMedio)}/t.`;
        resposta = { id: idA, autor: "agente", texto: textoResp, pedido, rec, pensando: passos };
      }
      setMsgs((m) => m.map((x) => (x.id === idA ? resposta : x)));
      setOcupado(false);
    }, 450 * (passos.length + 1) + 200);
  }

  function enviar(e: FormEvent) {
    e.preventDefault();
    perguntar(texto);
  }

  return (
    <>
      <CabecalhoPagina
        eyebrow="Agente Orquestrador"
        titulo="Assistente Inteligente de Compra"
        descricao="Descreva sua necessidade de compensação em linguagem natural."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="flex h-[68vh] min-h-[520px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {msgs.map((m) => (
              <div key={m.id} className={cn("flex gap-3", m.autor === "usuario" && "flex-row-reverse")}>
                <div className={cn("grid size-8 shrink-0 place-items-center rounded-full", m.autor === "agente" ? "bg-deep text-gold" : "bg-secondary text-primary")}>
                  {m.autor === "agente" ? <Bot className="size-4" /> : <User className="size-4" />}
                </div>
                <div className={cn("max-w-[85%] space-y-3", m.autor === "usuario" && "text-right")}>
                  {m.autor === "agente" && m.pensando && m.pensando.length > 0 && (
                    <div className="space-y-1 rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                      {m.pensando.map((p, i) => <p key={i} className="animate-stream-in">› {p}</p>)}
                      {!m.texto && <Loader2 className="size-3 animate-spin" />}
                    </div>
                  )}
                  {m.texto && (
                    <p className={cn("inline-block rounded-xl px-4 py-2.5 text-sm", m.autor === "usuario" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
                      {m.texto}
                    </p>
                  )}
                  {m.autor === "agente" && m.rec && m.rec.itens.length > 0 && <CartaoRecomendacao rec={m.rec} />}
                </div>
              </div>
            ))}
            <div ref={fim} />
          </div>
          <form onSubmit={enviar} className="flex gap-2 border-t border-border p-3">
            <Input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ex.: Preciso comprar 250 toneladas de créditos brasileiros auditados" disabled={ocupado} />
            <Button type="submit" size="icon" disabled={ocupado || !texto.trim()} aria-label="Enviar">
              <SendHorizontal />
            </Button>
          </form>
        </div>
        <aside className="space-y-2">
          <p className="eyebrow text-muted-foreground">Experimente</p>
          {SUGESTOES.map((s) => (
            <button key={s} disabled={ocupado} onClick={() => perguntar(s)} className="w-full rounded-lg border border-border bg-card p-3 text-left text-sm transition-colors hover:border-primary hover:bg-secondary disabled:opacity-50">
              {s}
            </button>
          ))}
          <p className="pt-3 text-xs text-muted-foreground">
            “Auditados” aplica nota mínima 80. Critério de escolha: menor preço por tonelada entre lotes elegíveis; empate decidido pela maior nota.
          </p>
        </aside>
      </div>
    </>
  );
}

function CartaoRecomendacao({ rec }: { rec: Recomendacao }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border text-left">
      {rec.itens.map(({ lote, quantidade, subtotal }) => (
        <div key={lote.id} className="flex flex-wrap items-center gap-3 border-b border-border p-3 last:border-0">
          <SeloNota nota={lote.nota} tamanho="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{lote.projeto}</p>
            <p className="text-xs text-muted-foreground">{lote.vendedorNome} · {lote.pais} · {formatarUSD(lote.precoTonelada)}/t</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm">{formatarNumero(quantidade)} t</p>
            <p className="text-xs text-muted-foreground">{formatarUSD(subtotal)}</p>
          </div>
          <Button asChild size="sm">
            <Link to="/checkout/$loteId" params={{ loteId: lote.id }} search={{ qtd: quantidade }}>
              <ShoppingCart /> Comprar
            </Link>
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap justify-between gap-2 bg-deep px-4 py-3 text-sm text-deep-foreground">
        <span>{formatarNumero(rec.quantidadeAtendida)} t · taxa {formatarUSD(rec.taxa)}</span>
        <span>Total estimado <strong className="font-display text-lg text-gold">{formatarUSD(rec.total)}</strong></span>
      </div>
    </div>
  );
}
