import { BookOpenCheck } from "lucide-react";
import { formatarUSD } from "@/lib/atmosfera/formato";
import { FINALIDADES, gerarLancamentos } from "@/lib/atmosfera/regras";
import type { Enquadramento, Escopo, FinalidadeContabil } from "@/lib/atmosfera/tipos";
import { cn } from "@/lib/utils";

export function QuadroContabil({
  enquadramento,
  subtotal,
  taxa,
  quantidade,
  className,
}: {
  enquadramento: Enquadramento;
  subtotal: number;
  taxa: number;
  quantidade: number;
  className?: string;
}) {
  const lancamentos = gerarLancamentos(enquadramento, subtotal, taxa, quantidade);
  const total = lancamentos.reduce((s, l) => s + l.valor, 0);
  return (
    <div className={cn("overflow-x-auto rounded-lg border border-border bg-card", className)}>
      <table className="w-full min-w-[520px] text-xs">
        <thead>
          <tr className="bg-muted text-left text-muted-foreground">
            <th className="eyebrow px-3 py-2 font-normal">Lançamento</th>
            <th className="eyebrow px-3 py-2 font-normal">Conta</th>
            <th className="eyebrow px-3 py-2 text-right font-normal">Débito</th>
            <th className="eyebrow px-3 py-2 text-right font-normal">Crédito</th>
          </tr>
        </thead>
        <tbody>
          {lancamentos.map((l, i) => (
            <tr key={i} className="border-t border-border align-top">
              <td className="px-3 py-2 text-muted-foreground">
                <span className="font-mono text-foreground">#{i + 1}</span> {l.historico}
              </td>
              <td className="px-3 py-2">
                <p><span className="font-semibold text-primary">D</span> <span className="font-mono text-muted-foreground">{l.debito.codigo}</span> {l.debito.nome}</p>
                <p className="mt-1 pl-4"><span className="font-semibold text-gold-foreground">C</span> <span className="font-mono text-muted-foreground">{l.credito.codigo}</span> {l.credito.nome}</p>
              </td>
              <td className="px-3 py-2 text-right font-mono">{formatarUSD(l.valor)}</td>
              <td className="px-3 py-2 text-right font-mono"><span className="mt-[1.1rem] block">{formatarUSD(l.valor)}</span></td>
            </tr>
          ))}
          <tr className="border-t-2 border-foreground/20 font-semibold">
            <td className="px-3 py-2" colSpan={2}>Totais (partidas dobradas)</td>
            <td className="px-3 py-2 text-right font-mono">{formatarUSD(total)}</td>
            <td className="px-3 py-2 text-right font-mono">{formatarUSD(total)}</td>
          </tr>
        </tbody>
      </table>
      <p className="border-t border-border px-3 py-2 text-[0.7rem] text-muted-foreground">{FINALIDADES[enquadramento.finalidade].norma}</p>
    </div>
  );
}

export function SecaoEnquadramento({
  valor,
  onChange,
  bloqueado,
  subtotal,
  taxa,
  quantidade,
}: {
  valor: Enquadramento;
  onChange: (e: Enquadramento) => void;
  bloqueado: boolean;
  subtotal: number;
  taxa: number;
  quantidade: number;
}) {
  const opcoes: FinalidadeContabil[] = ["compensacao", "carteira"];
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center gap-2">
        <BookOpenCheck className="size-5 text-primary" />
        <h3 className="font-sans text-base font-semibold">Enquadramento Contábil Automático (IFRS S2 / CPC)</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Escolha a finalidade da compra. O lançamento sugerido sai impresso no certificado.</p>

      <div role="radiogroup" aria-label="Finalidade contábil" className="mt-4 grid gap-3 md:grid-cols-2">
        {opcoes.map((f) => {
          const ativo = valor.finalidade === f;
          return (
            <div
              key={f}
              className={cn(
                "rounded-lg border-2 p-3 transition-all",
                ativo ? "border-primary bg-secondary" : "border-border",
                bloqueado && !ativo && "opacity-50",
              )}
            >
              <button
                type="button"
                role="radio"
                aria-checked={ativo}
                disabled={bloqueado}
                onClick={() => onChange(f === "compensacao" ? { finalidade: f, escopo: valor.escopo ?? 1 } : { finalidade: f })}
                className="flex w-full items-start gap-2 text-left disabled:cursor-not-allowed"
              >
                <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border-2", ativo ? "border-primary" : "border-muted-foreground/40")}>
                  {ativo && <span className="size-2 rounded-full bg-primary" />}
                </span>
                <span>
                  <span className="block text-sm font-semibold">
                    {f === "compensacao" ? "Compensação / Aposentadoria Imediata (Escopo 1, 2 ou 3)" : "Manutenção em Carteira / Revenda"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {f === "compensacao" ? "Créditos aposentados agora para abater emissões." : "Créditos guardados como estoque para uso ou venda futura."}
                  </span>
                </span>
              </button>
              {f === "compensacao" && ativo && (
                <div className="mt-3 flex items-center gap-1 pl-6" role="group" aria-label="Escopo de emissões">
                  {([1, 2, 3] as Escopo[]).map((e) => (
                    <button
                      key={e}
                      type="button"
                      disabled={bloqueado}
                      aria-pressed={valor.escopo === e}
                      onClick={() => onChange({ finalidade: "compensacao", escopo: e })}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed",
                        valor.escopo === e ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50",
                      )}
                    >
                      Escopo {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <QuadroContabil className="mt-4" enquadramento={valor} subtotal={subtotal} taxa={taxa} quantidade={quantidade} />
    </section>
  );
}
