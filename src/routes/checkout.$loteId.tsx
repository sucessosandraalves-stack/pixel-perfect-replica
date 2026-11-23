import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, Lock, Pencil, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { CabecalhoPagina } from "@/components/atmosfera/AppShell";
import { PainelLiquidacao, SeletorPagamento } from "@/components/atmosfera/Liquidacao";
import { RequerSessao } from "@/components/atmosfera/RequerSessao";
import { SeloNota } from "@/components/atmosfera/SeloNota";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { formatarNumero, formatarUSD } from "@/lib/atmosfera/formato";
import {
  FORMAS_PAGAMENTO,
  LIMITE_APROVACAO_HUMANA,
  TAXA_PLATAFORMA,
  calcularResumo,
  gerarDadosPix,
  gerarEscrowId,
  validarCartao,
  type DadosCartao,
} from "@/lib/atmosfera/regras";
import { acoes, useAtmosfera } from "@/lib/atmosfera/store";
import type { FormaPagamento, PagamentoConfirmado, Usuario } from "@/lib/atmosfera/tipos";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout/$loteId")({
  validateSearch: (s: Record<string, unknown>): { qtd?: number } => {
    const n = Number(s["qtd"]);
    return Number.isFinite(n) && n > 0 ? { qtd: Math.floor(n) } : {};
  },
  head: () => ({
    meta: [
      { title: "Checkout P2P — Comprar créditos de carbono | ATMOSFERA" },
      { name: "description", content: "Escolha quantidade e forma de pagamento (PIX, SWIFT ou cartão) com liquidação em conta garantia." },
      { property: "og:title", content: "Checkout P2P — ATMOSFERA" },
      { property: "og:description", content: "Compra de créditos com liquidação em Escrow e certificado contábil IFRS S2." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPagina,
});

function CheckoutPagina() {
  const { loteId } = Route.useParams();
  const { qtd } = Route.useSearch();
  return <RequerSessao perfil="comprador">{(u) => <Checkout comprador={u} loteId={loteId} qtdInicial={qtd} />}</RequerSessao>;
}

type Etapa = "revisao" | "liquidacao" | "processando";

const PASSOS_LIBERACAO: Record<FormaPagamento, string[]> = {
  pix: ["PIX recebido na conta garantia", "Fundos retidos em Escrow", "Baixa do crédito no registro (Art. 6.2)", "Liberando ao vendedor e emitindo certificado"],
  swift: ["Mensagem MT103 conciliada pela referência", "Fundos retidos em Escrow", "Baixa do crédito no registro (Art. 6.2)", "Liberando ao vendedor e emitindo certificado"],
  cartao: ["Pré-autorização aprovada pelo emissor", "Valor retido em Escrow", "Baixa do crédito no registro (Art. 6.2)", "Captura, repasse ao vendedor e emissão do certificado"],
};

const CARTAO_VAZIO: DadosCartao = { numero: "", nome: "", validade: "", cvv: "" };

function Checkout({ comprador, loteId, qtdInicial }: { comprador: Usuario; loteId: string; qtdInicial: number | undefined }) {
  const navigate = useNavigate();
  const lote = useAtmosfera((e) => e.lotes.find((l) => l.id === loteId));
  const max = lote?.quantidadeDisponivel ?? 0;
  const [qtd, setQtd] = useState(() => Math.min(qtdInicial ?? Math.min(100, max), max) || 1);
  const [aprovado, setAprovado] = useState(false);
  const [aprovador, setAprovador] = useState("");
  const [forma, setForma] = useState<FormaPagamento>("pix");
  const [etapa, setEtapa] = useState<Etapa>("revisao");
  const [escrowId, setEscrowId] = useState("");
  const [cartao, setCartao] = useState<DadosCartao>(CARTAO_VAZIO);
  const [passos, setPassos] = useState(0);
  const painelRef = useRef<HTMLDivElement>(null);

  if (!lote) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-medium">Lote não encontrado</h1>
        <Button asChild className="mt-6"><Link to="/marketplace">Voltar ao Marketplace</Link></Button>
      </div>
    );
  }

  const q = Math.max(1, Math.min(qtd, max));
  const r = calcularResumo(q, lote.precoTonelada);
  const travado = r.exigeAprovacaoHumana && (!aprovado || aprovador.trim().length < 3);
  const bloqueado = etapa !== "revisao";

  function irParaPagamento() {
    if (!lote) return;
    setEscrowId(gerarEscrowId(`${lote.id}|${comprador.id}|${q}|${forma}|${Date.now()}`));
    setEtapa("liquidacao");
    setTimeout(() => painelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function confirmarPagamento() {
    if (!lote) return;
    if (forma === "cartao") {
      const erro = validarCartao(cartao);
      if (erro) {
        toast.error(erro);
        return;
      }
    }
    setEtapa("processando");
    setPassos(0);
    const lista = PASSOS_LIBERACAO[forma];
    lista.forEach((_, i) => setTimeout(() => setPassos(i + 1), 700 * (i + 1)));
    setTimeout(() => {
      const pagamento: PagamentoConfirmado = {
        forma,
        escrowId,
        confirmado: true,
        confirmadoEm: new Date().toISOString(),
      };
      if (forma === "cartao") pagamento.ultimos4 = cartao.numero.replace(/\D/g, "").slice(-4);
      if (forma === "pix") pagamento.valorBRL = gerarDadosPix(escrowId, r.total).valorBRL;
      try {
        const compra = acoes.comprar(comprador, lote.id, q, r.exigeAprovacaoHumana ? aprovado : false, pagamento);
        setCartao(CARTAO_VAZIO);
        toast.success("Pagamento confirmado no Escrow. Certificado liberado!");
        navigate({ to: "/certificado/$compraId", params: { compraId: compra.id } });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Não foi possível concluir a compra.");
        setEtapa("liquidacao");
      }
    }, 700 * (lista.length + 1));
  }

  const rotuloConfirmar =
    forma === "pix" ? "Já paguei — confirmar PIX" : forma === "swift" ? "Confirmar transferência enviada" : "Autorizar cobrança no cartão";

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/marketplace"><ArrowLeft /> Marketplace</Link>
      </Button>
      <CabecalhoPagina eyebrow="Checkout P2P" titulo="Comprar créditos de carbono" />

      <ol className="mb-6 flex flex-wrap gap-2 text-xs">
        {["Pedido e aprovação", "Pagamento em Escrow", "Certificado contábil"].map((t, i) => {
          const idx = etapa === "revisao" ? 0 : 1;
          return (
            <li key={t} className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1", i < idx ? "border-success/40 bg-success/10 text-success" : i === idx ? "border-primary bg-secondary font-semibold text-primary" : "border-border text-muted-foreground")}>
              {i < idx ? <CheckCircle2 className="size-3.5" /> : <span className="font-mono">{i + 1}</span>} {t}
            </li>
          );
        })}
      </ol>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <section className="flex gap-5 rounded-xl border border-border bg-card p-6 shadow-soft">
            <SeloNota nota={lote.nota} />
            <div className="min-w-0">
              <p className="eyebrow text-primary">{lote.tipo}</p>
              <h2 className="text-xl font-medium">{lote.projeto}</h2>
              <p className="text-sm text-muted-foreground">{lote.localizacao} · {lote.pais}</p>
              <p className="mt-2 text-sm">Vendedor: <span className="font-medium">{lote.vendedorNome}</span></p>
              <p className="text-xs text-muted-foreground">{lote.certificadora} · Registro <span className="font-mono">{lote.registro.length > 48 ? `${lote.registro.slice(0, 48)}…` : lote.registro}</span></p>
            </div>
          </section>

          <section className={cn("rounded-xl border border-border bg-card p-6 shadow-soft", bloqueado && "opacity-70")}>
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="qtd">Quantidade (tCO₂e)</Label>
                <Input id="qtd" inputMode="numeric" disabled={bloqueado} className="w-40 font-mono text-lg" value={qtd} onChange={(e) => setQtd(parseInt(e.target.value.replace(/\D/g, ""), 10) || 0)} />
              </div>
              <p className="text-sm text-muted-foreground">Disponível: <span className="font-medium text-foreground">{formatarNumero(max)} t</span></p>
            </div>
            <Slider className="mt-6" disabled={bloqueado} value={[q]} min={1} max={max} step={1} onValueChange={(v) => setQtd(v[0] ?? 1)} />
            {qtd > max && <p className="mt-2 text-xs text-destructive">Máximo disponível: {formatarNumero(max)} t.</p>}
          </section>

          {r.exigeAprovacaoHumana && (
            <section className={cn("rounded-xl border-2 border-gold bg-gold/10 p-6", bloqueado && "opacity-70")}>
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-gold-foreground" />
                <div className="flex-1">
                  <h3 className="font-sans text-base font-semibold">Trava de segurança · Human-in-the-Loop</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Compras acima de {formatarUSD(LIMITE_APROVACAO_HUMANA)} exigem aprovação de um responsável humano antes da liquidação.
                  </p>
                  <div className="mt-4 space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="aprovador">Nome do responsável que aprova</Label>
                      <Input id="aprovador" disabled={bloqueado} value={aprovador} onChange={(e) => setAprovador(e.target.value)} placeholder="Ex.: Diretora Financeira" className="bg-card" />
                    </div>
                    <label className="flex items-start gap-2 text-sm">
                      <Checkbox disabled={bloqueado} checked={aprovado} onCheckedChange={(v) => setAprovado(v === true)} className="mt-0.5" />
                      Revisei o lote, o vendedor e o valor de {formatarUSD(r.total)} e autorizo esta compra.
                    </label>
                  </div>
                </div>
              </div>
            </section>
          )}

          <SeletorPagamento valor={forma} onChange={setForma} bloqueado={bloqueado} />

          <div ref={painelRef} className="scroll-mt-24">
            {etapa !== "revisao" && (
              <PainelLiquidacao forma={forma} escrowId={escrowId} loteId={lote.id} totalUSD={r.total} cartao={cartao} onCartao={setCartao} />
            )}
          </div>

          {etapa === "processando" && (
            <section className="rounded-xl bg-deep p-5 font-mono text-xs text-deep-foreground/85" aria-live="polite">
              {PASSOS_LIBERACAO[forma].slice(0, passos).map((p) => (
                <p key={p} className="animate-stream-in"><span className="text-gold">escrow:</span> <span className="text-sky">✓</span> {p}</p>
              ))}
              {passos < PASSOS_LIBERACAO[forma].length && <Loader2 className="mt-1 size-3.5 animate-spin text-gold" />}
            </section>
          )}
        </div>

        <aside className="h-fit rounded-xl bg-gradient-deep p-6 text-deep-foreground shadow-lift lg:sticky lg:top-24">
          <p className="eyebrow text-gold">Resumo financeiro</p>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-deep-muted">{formatarNumero(q)} t × {formatarUSD(lote.precoTonelada)}</dt><dd></dd></div>
            <div className="flex justify-between"><dt className="text-deep-muted">Valor do vendedor</dt><dd className="font-mono">{formatarUSD(r.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-deep-muted">Taxa da plataforma ({(TAXA_PLATAFORMA * 100).toLocaleString("pt-BR")}%)</dt><dd className="font-mono">{formatarUSD(r.taxa)}</dd></div>
            <div className="flex justify-between"><dt className="text-deep-muted">Pagamento</dt><dd className="text-right">{FORMAS_PAGAMENTO[forma].nome}</dd></div>
            {escrowId && <div className="flex justify-between"><dt className="text-deep-muted">Conta garantia</dt><dd className="font-mono">{escrowId}</dd></div>}
            <div className="border-t border-deep-foreground/15 pt-3">
              <div className="flex items-baseline justify-between"><dt>Total</dt><dd className="font-display text-3xl text-gold">{formatarUSD(r.total)}</dd></div>
            </div>
          </dl>
          <p className="mt-4 text-xs text-deep-muted">
            {formatarUSD(r.subtotal)} ficam retidos em Escrow e vão ao vendedor só após a baixa do crédito. O certificado é liberado depois do pagamento confirmado.
          </p>

          {etapa === "revisao" ? (
            <Button variant="gold" size="lg" className="mt-6 w-full" disabled={travado || qtd < 1 || qtd > max} onClick={irParaPagamento}>
              {travado ? <Lock /> : <Wallet />}
              {travado ? "Aguardando aprovação humana" : "Ir para pagamento"}
            </Button>
          ) : (
            <div className="mt-6 space-y-2">
              <Button variant="gold" size="lg" className="w-full" disabled={etapa === "processando"} onClick={confirmarPagamento}>
                {etapa === "processando" ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                {etapa === "processando" ? "Confirmando no Escrow…" : rotuloConfirmar}
              </Button>
              <Button variant="ghostDeep" className="w-full" disabled={etapa === "processando"} onClick={() => setEtapa("revisao")}>
                <Pencil /> Alterar pedido ou forma de pagamento
              </Button>
              <p className="text-center text-[0.65rem] text-deep-muted">Demonstração: a confirmação do pagamento é simulada.</p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
