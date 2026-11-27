import { createFileRoute, Link } from "@tanstack/react-router";
import { FileCheck2 } from "lucide-react";
import { CabecalhoPagina } from "@/components/atmosfera/AppShell";
import { RequerSessao } from "@/components/atmosfera/RequerSessao";
import { Button } from "@/components/ui/button";
import { encurtarHash, formatarData, formatarNumero, formatarUSD } from "@/lib/atmosfera/formato";
import { useAtmosfera } from "@/lib/atmosfera/store";
import type { Usuario } from "@/lib/atmosfera/tipos";

export const Route = createFileRoute("/certificados")({
  head: () => ({
    meta: [
      { title: "Meus certificados de compensação | ATMOSFERA" },
      { name: "description", content: "Histórico de compras de créditos de carbono e certificados contábeis IFRS S2." },
      { property: "og:title", content: "Certificados — ATMOSFERA" },
      { property: "og:description", content: "Histórico de compensações com hash único e extrato IFRS S2." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <RequerSessao>{(u) => <Certificados usuario={u} />}</RequerSessao>,
});

function Certificados({ usuario }: { usuario: Usuario }) {
  const todas = useAtmosfera((e) => e.compras);
  const lotesDoVendedor = useAtmosfera((e) => e.lotes.filter((l) => l.vendedorId === usuario.id).map((l) => l.id));
  const compras =
    usuario.perfil === "admin"
      ? todas
      : usuario.perfil === "comprador"
        ? todas.filter((c) => c.compradorId === usuario.id)
        : todas.filter((c) => lotesDoVendedor.includes(c.loteId));
  const totalT = compras.reduce((s, c) => s + c.quantidade, 0);
  const totalUSD = compras.reduce((s, c) => s + (usuario.perfil === "vendedor" ? c.subtotal : c.total), 0);
  const titulo =
    usuario.perfil === "admin"
      ? "Certificados emitidos na plataforma"
      : usuario.perfil === "comprador"
        ? "Meus certificados"
        : "Certificados emitidos dos meus lotes";

  return (
    <>
      <CabecalhoPagina
        eyebrow={usuario.perfil === "admin" ? "Visão consolidada" : usuario.perfil === "comprador" ? "Compensações" : "Vendas liquidadas"}
        titulo={titulo}
        acao={
          <div className="flex gap-6 text-right">
            <div><p className="font-display text-2xl">{formatarNumero(totalT)}</p><p className="eyebrow normal-case text-muted-foreground">tCO₂e</p></div>
            <div><p className="font-display text-2xl">{formatarUSD(totalUSD)}</p><p className="eyebrow text-muted-foreground">{usuario.perfil === "admin" ? "volume total" : usuario.perfil === "comprador" ? "investido" : "recebido"}</p></div>
          </div>
        }
      />
      {compras.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <FileCheck2 className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">Nenhum certificado ainda.</p>
          <Button asChild className="mt-5"><Link to="/marketplace">Ir ao Marketplace</Link></Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          {compras.map((c) => (
            <Link
              key={c.id}
              to="/certificado/$compraId"
              params={{ compraId: c.id }}
              className="flex flex-wrap items-center gap-4 border-b border-border p-5 transition-colors last:border-0 hover:bg-muted"
            >
              <FileCheck2 className="size-5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{c.projeto}</p>
                <p className="text-xs text-muted-foreground">
                  {formatarData(c.data)} · {usuario.perfil === "admin" ? `${c.vendedorNome} → ${c.compradorNome}` : usuario.perfil === "comprador" ? c.vendedorNome : c.compradorNome}
                </p>
              </div>
              <span className="font-mono text-xs text-muted-foreground">{encurtarHash(c.hash)}</span>
              <span className="w-28 text-right">{formatarNumero(c.quantidade)} t</span>
              <span className="w-32 text-right font-mono">{formatarUSD(c.total)}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
