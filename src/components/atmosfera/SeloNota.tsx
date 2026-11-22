import { cn } from "@/lib/utils";
import { rotuloNota } from "@/lib/atmosfera/formato";

export function SeloNota({
  nota,
  tamanho = "md",
  className,
}: {
  nota: number;
  tamanho?: "sm" | "md" | "lg";
  className?: string;
}) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const dim = tamanho === "lg" ? "size-36" : tamanho === "sm" ? "size-14" : "size-20";
  const texto = tamanho === "lg" ? "text-4xl" : tamanho === "sm" ? "text-base" : "text-2xl";
  return (
    <div className={cn("relative grid place-items-center", dim, className)} title={`Nota de integridade ${nota}/100 — ${rotuloNota(nota)}`}>
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
        <circle cx="32" cy="32" r={r} className="fill-none stroke-muted" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={r}
          className={cn("fill-none", nota >= 80 ? "stroke-gold" : nota >= 60 ? "stroke-sky" : "stroke-destructive")}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * nota) / 100}
        />
      </svg>
      <div className="text-center leading-none">
        <span className={cn("font-display font-semibold text-foreground", texto)}>{nota}</span>
        {tamanho !== "sm" && <span className="eyebrow mt-1 block text-muted-foreground">/100</span>}
      </div>
    </div>
  );
}
