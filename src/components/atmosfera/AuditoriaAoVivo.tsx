import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle, Globe, Loader2, ScanSearch, ShieldCheck, XCircle } from "lucide-react";
import { SeloNota } from "./SeloNota";
import type { ResultadoAuditoria } from "@/lib/atmosfera/regras";
import type { ExtracaoReal } from "@/lib/atmosfera/firecrawl.server";
import { cn } from "@/lib/utils";

interface Evento {
  passo: 0 | 1 | 2;
  texto: string;
  ok?: boolean;
}

const PASSOS = [
  { titulo: "Agente Extrator (Firecrawl)", sub: "Consultando o registro na internet", icone: Globe },
  { titulo: "Agente Auditor Contábil", sub: "Guardrails + Regex · lastro e dupla contagem", icone: ScanSearch },
  { titulo: "Selo de Integridade ATMOSFERA", sub: "Nota 0–100 e publicação", icone: ShieldCheck },
];

function roteiro(registro: string, r: ResultadoAuditoria, x?: ExtracaoReal | null): Evento[] {
  const host = registro.match(/https?:\/\/([^/]+)/)?.[1] ?? "registro público da certificadora";
  const extracao: Evento[] = x
    ? x.ok
      ? [
          { passo: 0, texto: `[Firecrawl REAL] POST /v2/scrape ${host} → ${x.status ?? 200} OK`, ok: true },
          { passo: 0, texto: `Título extraído: "${x.titulo}"` },
          { passo: 0, texto: `Trecho público: "${x.trecho || "(página sem texto legível)"}…"` },
        ]
      : [{ passo: 0, texto: `[Firecrawl REAL] ${host} → ${x.erro} · usando simulação como alternativa`, ok: false }]
    : [{ passo: 0, texto: `[simulação] GET ${host} → 200 OK (scrape markdown)` }];
  return [
    { passo: 0, texto: `event: start · agente=extrator · alvo="${registro.slice(0, 60)}"` },
    ...extracao,
    { passo: 0, texto: `Certificadora detectada: ${r.certificadora}` },
    { passo: 0, texto: `Código normalizado: ${r.codigoNormalizado}` },
    ...r.verificacoes.map((v) => ({ passo: 1 as const, texto: `${v.rotulo}: ${v.detalhe}`, ok: v.ok })),
    { passo: 2, texto: `Nota calculada: ${r.nota}/100` },
    {
      passo: 2,
      texto: r.aprovado ? "event: done · status=aprovado · publicado no Marketplace" : "event: done · status=reprovado",
      ok: r.aprovado,
    },
  ];
}

export function AuditoriaAoVivo({
  registro,
  resultado,
  extracao,
  onConcluir,
}: {
  registro: string;
  extracao?: ExtracaoReal | null;
  resultado: ResultadoAuditoria;
  onConcluir: () => void;
}) {
  const eventos = useRef(roteiro(registro, resultado, extracao)).current;
  const [visiveis, setVisiveis] = useState(0);
  const concluiu = useRef(false);

  useEffect(() => {
    if (visiveis >= eventos.length) {
      if (!concluiu.current) {
        concluiu.current = true;
        onConcluir();
      }
      return;
    }
    const atual = eventos[visiveis];
    const anterior = eventos[visiveis - 1];
    const troca = anterior && atual && anterior.passo !== atual.passo;
    const t = setTimeout(() => setVisiveis((v) => v + 1), troca ? 1100 : 520);
    return () => clearTimeout(t);
  }, [visiveis, eventos, onConcluir]);

  const passoAtual = visiveis >= eventos.length ? 3 : (eventos[visiveis]?.passo ?? 0);
  const terminou = visiveis >= eventos.length;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <div className="grid gap-px bg-border md:grid-cols-3">
        {PASSOS.map((p, i) => {
          const estado = passoAtual > i ? "feito" : passoAtual === i ? "ativo" : "espera";
          const falhou = terminou && i === 2 && !resultado.aprovado;
          return (
            <div key={p.titulo} className={cn("flex gap-3 bg-card p-4", estado === "ativo" && "bg-secondary")}>
              <div className="mt-0.5">
                {falhou ? (
                  <XCircle className="size-5 text-destructive" />
                ) : estado === "feito" ? (
                  <CheckCircle2 className="size-5 text-success" />
                ) : estado === "ativo" ? (
                  <Loader2 className="size-5 animate-spin text-primary" />
                ) : (
                  <Circle className="size-5 text-muted-foreground/50" />
                )}
              </div>
              <div>
                <p className="eyebrow text-muted-foreground">Passo {i + 1}</p>
                <p className="text-sm font-semibold">{p.titulo}</p>
                <p className="text-xs text-muted-foreground">{p.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 p-5 md:grid-cols-[1fr_auto]">
        <div className="max-h-72 overflow-y-auto rounded-lg bg-deep p-4 font-mono text-xs leading-relaxed text-deep-foreground/85" aria-live="polite">
          {eventos.slice(0, visiveis).map((e, i) => (
            <p key={i} className="animate-stream-in">
              <span className="text-gold">data:</span>{" "}
              <span className={cn(e.ok === false && "text-destructive", e.ok === true && "text-sky")}>{e.texto}</span>
            </p>
          ))}
          {!terminou && <span className="inline-block h-3 w-1.5 animate-pulse bg-gold align-middle" />}
        </div>
        <div className="flex min-w-44 flex-col items-center justify-center text-center">
          {terminou ? (
            <div className="animate-seal-pop">
              <SeloNota nota={resultado.nota} tamanho="lg" />
              <p className={cn("mt-3 text-sm font-semibold", resultado.aprovado ? "text-success" : "text-destructive")}>
                {resultado.aprovado ? "Aprovado e publicado" : "Reprovado na auditoria"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Calculando selo…</p>
          )}
        </div>
      </div>
    </div>
  );
}
