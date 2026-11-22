import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { CabecalhoPagina } from "@/components/atmosfera/AppShell";
import { RequerSessao } from "@/components/atmosfera/RequerSessao";
import { SeloNota } from "@/components/atmosfera/SeloNota";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { formatarNumero, formatarUSD } from "@/lib/atmosfera/formato";
import { LIMITE_APROVACAO_HUMANA, TAXA_PLATAFORMA, calcularResumo } from "@/lib/atmosfera/regras";
import { acoes, useAtmosfera } from "@/lib/atmosfera/store";
import type { Usuario } from "@/lib/atmosfera/tipos";

export const Route = createFileRoute("/checkout/$loteId")({
  validateSearch: (s: Record<string, unknown>): { qtd?: number } => {
    const n = Number(s["qtd"]);
    return Number.isFinite(n) && n > 0 ? { qtd: Math.floor(n) } : {};
  },
  head: () => ({
    meta: [
      { title: "Checkout P2P — Comprar créditos de carbono | ATMOSFERA" },
      { name: "description", content: "Escolha a quantidade, veja a taxa transparente e confirme a compra de créditos de carbono." },
      { property: "og:title", content: "Checkout P2P — ATMOSFERA" },
      { property: "og:description", content: "Compra de créditos com certificado contábil IFRS S2 instantâneo." },
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

function Checkout({ comprador, loteId, qtdInicial }: { comprador: Usuario; loteId: string; qtdInicial: number | undefined }) {
  const navigate = useNavigate();
  const lote = useAtmosfera((e) => e.lotes.find((l) => l.id === loteId));
  const max = lote?.quantidadeDisponivel ?? 0;
  const [qtd, setQtd] = useState(() => Math.min(qtdInicial ?? Math.min(100, max), max) || 1);
  const [aprovado, setAprovado] = useState(false);
  const [aprovador, setAprovador] = useState("");
  const [enviando, setEnviando] = useState(false);

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

  function confirmar() {
    if (!lote) return;
    setEnviando(true);
    setTimeout(() => {
      try {
        const compra = acoes.comprar(comprador, lote.id, q, r.exigeAprovacaoHumana ? aprovado : false);
        toast.success("Compra confirmada! Certificado emitido.");
        navigate({ to: "/certificado/$compraId", params: { compraId: compra.id } });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Não foi possível concluir a compra.");
        setEnviando(false);
      }
    }, 900);
  }

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/marketplace"><ArrowLeft /> Marketplace</Link>
      </Button>
      <CabecalhoPagina eyebrow="Checkout P2P" titulo="Comprar créditos de carbono" />

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

          <section className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="qtd">Quantidade (tCO₂e)</Label>
                <Input id="qtd" inputMode="numeric" className="w-40 font-mono text-lg" value={qtd} onChange={(e) => setQtd(parseInt(e.target.value.replace(/\D/g, ""), 10) || 0)} />
              </div>
              <p className="text-sm text-muted-foreground">Disponível: <span className="font-medium text-foreground">{formatarNumero(max)} t</span></p>
            </div>
            <Slider className="mt-6" value={[q]} min={1} max={max} step={1} onValueChange={(v) => setQtd(v[0] ?? 1)} />
            {qtd > max && <p className="mt-2 text-xs text-destructive">Máximo disponível: {formatarNumero(max)} t.</p>}
          </section>

          {r.exigeAprovacaoHumana && (
            <section className="rounded-xl border-2 border-gold bg-gold/10 p-6">
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
                      <Input id="aprovador" value={aprovador} onChange={(e) => setAprovador(e.target.value)} placeholder="Ex.: Diretora Financeira" className="bg-card" />
                    </div>
                    <label className="flex items-start gap-2 text-sm">
                      <Checkbox checked={aprovado} onCheckedChange={(v) => setAprovado(v === true)} className="mt-0.5" />
                      Revisei o lote, o vendedor e o valor de {formatarUSD(r.total)} e autorizo esta compra.
                    </label>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="h-fit rounded-xl bg-gradient-deep p-6 text-deep-foreground shadow-lift lg:sticky lg:top-24">
          <p className="eyebrow text-gold">Resumo financeiro</p>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-deep-muted">{formatarNumero(q)} t × {formatarUSD(lote.precoTonelada)}</dt><dd></dd></div>
            <div className="flex justify-between"><dt className="text-deep-muted">Valor do vendedor</dt><dd className="font-mono">{formatarUSD(r.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-deep-muted">Taxa da plataforma ({(TAXA_PLATAFORMA * 100).toLocaleString("pt-BR")}%)</dt><dd className="font-mono">{formatarUSD(r.taxa)}</dd></div>
            <div className="border-t border-deep-foreground/15 pt-3">
              <div className="flex items-baseline justify-between"><dt>Total</dt><dd className="font-display text-3xl text-gold">{formatarUSD(r.total)}</dd></div>
            </div>
          </dl>
          <p className="mt-4 text-xs text-deep-muted">
            {formatarUSD(r.subtotal)} vão direto ao vendedor. A taxa cobre auditoria, registro e emissão do certificado.
          </p>
          <Button variant="gold" size="lg" className="mt-6 w-full" disabled={travado || enviando || qtd < 1 || qtd > max} onClick={confirmar}>
            {travado ? <Lock /> : <ShieldCheck />}
            {enviando ? "Liquidando e emitindo certificado…" : travado ? "Aguardando aprovação humana" : "Confirmar compra"}
          </Button>
        </aside>
      </div>
    </>
  );
}
