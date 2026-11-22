import { Link } from "@tanstack/react-router";
import { BadgeCheck, MapPin, ShoppingCart } from "lucide-react";
import { SeloNota } from "./SeloNota";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatarNumero, formatarUSD, rotuloNota } from "@/lib/atmosfera/formato";
import type { Lote } from "@/lib/atmosfera/tipos";
import { cn } from "@/lib/utils";

export function CartaoLote({ lote }: { lote: Lote }) {
  const esgotado = lote.quantidadeDisponivel === 0;
  return (
    <article className={cn("flex flex-col rounded-xl border border-border bg-card shadow-soft transition-shadow hover:shadow-lift", esgotado && "opacity-60")}>
      <div className="flex items-start justify-between gap-3 border-b border-border p-5">
        <div className="min-w-0">
          <Badge variant="sky">{lote.tipo}</Badge>
          <h3 className="mt-2 text-lg leading-snug font-medium">{lote.projeto}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" /> {lote.localizacao} · {lote.pais}
          </p>
        </div>
        <div className="text-center">
          <SeloNota nota={lote.nota} tamanho="sm" />
          <p className="eyebrow mt-1 text-[0.6rem] text-muted-foreground">IFRS S2</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 p-5 text-sm">
        <div>
          <p className="eyebrow text-muted-foreground">Vendedor</p>
          <p className="font-medium">{lote.vendedorNome}</p>
          <p className="font-mono text-xs text-muted-foreground">{lote.vendedorDocumento}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <BadgeCheck className="size-3.5 text-success" />
          {lote.certificadora} · Safra {lote.vintage} · {rotuloNota(lote.nota)}
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted p-3">
          <div>
            <p className="eyebrow text-muted-foreground">Disponível</p>
            <p className="font-display text-xl">{formatarNumero(lote.quantidadeDisponivel)} <span className="text-xs text-muted-foreground">tCO₂e</span></p>
          </div>
          <div>
            <p className="eyebrow text-muted-foreground">Preço unitário</p>
            <p className="font-display text-xl">{formatarUSD(lote.precoTonelada)}</p>
          </div>
        </div>
      </div>

      <div className="p-5 pt-0">
        {esgotado ? (
          <Button disabled className="w-full">Esgotado</Button>
        ) : (
          <Button asChild className="w-full">
            <Link to="/checkout/$loteId" params={{ loteId: lote.id }} search={{}}>
              <ShoppingCart /> Comprar Créditos
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}
