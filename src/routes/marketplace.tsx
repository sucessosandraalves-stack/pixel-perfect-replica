import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { CabecalhoPagina } from "@/components/atmosfera/AppShell";
import { CartaoLote } from "@/components/atmosfera/CartaoLote";
import { RequerSessao } from "@/components/atmosfera/RequerSessao";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { formatarNumero } from "@/lib/atmosfera/formato";
import { useAtmosfera } from "@/lib/atmosfera/store";
import { TIPOS_PROJETO } from "@/lib/atmosfera/tipos";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace P2P de créditos de carbono auditados | ATMOSFERA" },
      { name: "description", content: "Vitrine global de lotes de créditos de carbono com nota de auditoria contábil IFRS S2." },
      { property: "og:title", content: "Marketplace P2P — ATMOSFERA" },
      { property: "og:description", content: "Compre créditos de carbono direto de produtores e projetos auditados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <RequerSessao>{() => <Marketplace />}</RequerSessao>,
});

const TODOS = "todos";

function Marketplace() {
  const lotes = useAtmosfera((e) => e.lotes);
  const [pais, setPais] = useState(TODOS);
  const [tipo, setTipo] = useState(TODOS);
  const [notaMin, setNotaMin] = useState(60);
  const [ordem, setOrdem] = useState("nota");

  const paises = useMemo(() => [...new Set(lotes.map((l) => l.pais))].sort(), [lotes]);
  const filtrados = useMemo(() => {
    const r = lotes
      .filter((l) => pais === TODOS || l.pais === pais)
      .filter((l) => tipo === TODOS || l.tipo === tipo)
      .filter((l) => l.nota >= notaMin);
    return r.sort((a, b) =>
      ordem === "preco" ? a.precoTonelada - b.precoTonelada : ordem === "volume" ? b.quantidadeDisponivel - a.quantidadeDisponivel : b.nota - a.nota,
    );
  }, [lotes, pais, tipo, notaMin, ordem]);

  const totalT = filtrados.reduce((s, l) => s + l.quantidadeDisponivel, 0);

  return (
    <>
      <CabecalhoPagina
        eyebrow="Vitrine global de ofertas"
        titulo="Marketplace P2P"
        descricao="Todos os lotes passaram pela auditoria dos agentes ATMOSFERA. Negocie direto com quem gera o crédito."
        acao={
          <div className="flex gap-6 text-right">
            <div><p className="font-display text-2xl">{filtrados.length}</p><p className="eyebrow text-muted-foreground">lotes</p></div>
            <div><p className="font-display text-2xl">{formatarNumero(totalT)}</p><p className="eyebrow normal-case text-muted-foreground">tCO₂e</p></div>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 rounded-xl border border-border bg-card p-4 shadow-soft md:grid-cols-[auto_1fr_1fr_1.2fr_1fr_auto] md:items-end">
        <SlidersHorizontal className="hidden size-5 self-center text-primary md:block" />
        <div className="space-y-1.5">
          <Label>País</Label>
          <Select value={pais} onValueChange={setPais}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os países</SelectItem>
              {paises.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tipo de projeto</Label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os tipos</SelectItem>
              {TIPOS_PROJETO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <Label>Nota de auditoria mínima: <span className="font-mono text-primary">{notaMin}</span></Label>
          <Slider value={[notaMin]} min={60} max={100} step={1} onValueChange={(v) => setNotaMin(v[0] ?? 60)} />
        </div>
        <div className="space-y-1.5">
          <Label>Ordenar por</Label>
          <Select value={ordem} onValueChange={setOrdem}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nota">Maior nota</SelectItem>
              <SelectItem value="preco">Menor preço</SelectItem>
              <SelectItem value="volume">Maior volume</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" onClick={() => { setPais(TODOS); setTipo(TODOS); setNotaMin(60); setOrdem("nota"); }}>
          Limpar
        </Button>
      </div>

      {filtrados.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Nenhum lote encontrado com esses filtros.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((l) => <CartaoLote key={l.id} lote={l} />)}
        </div>
      )}
    </>
  );
}
