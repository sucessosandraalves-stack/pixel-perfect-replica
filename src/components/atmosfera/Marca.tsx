import { cn } from "@/lib/utils";

export function Marca({ className, claro = false }: { className?: string; claro?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <circle cx="16" cy="16" r="14" className="fill-none stroke-gold" strokeWidth="1.5" />
        <path
          d="M7 19c3-6 6-9 9-9s6 3 9 9"
          className={cn("fill-none", claro ? "stroke-deep-foreground" : "stroke-primary")}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="16" cy="10" r="2" className="fill-gold" />
      </svg>
      <span
        className={cn(
          "font-display text-lg font-semibold tracking-[0.18em]",
          claro ? "text-deep-foreground" : "text-primary",
        )}
      >
        ATMOSFERA
      </span>
    </span>
  );
}
