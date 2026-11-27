import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeDollarSign,
  CheckCircle2,
  FileSearch,
  Landmark,
  ShieldCheck,
  WalletCards,
  XCircle,
} from "lucide-react";
import { CabecalhoPagina } from "@/components/atmosfera/AppShell";
import { RequerSessao } from "@/components/atmosfera/RequerSessao";
import { Badge } from "@/components/ui/badge";
import { formatarData, formatarNumero, formatarUSD } from "@/lib/atmosfera/formato";
import { TAXA_PLATAFORMA, calcularIndicadoresPlataforma } from "@/lib/atmosfera/regras";
import { useAtmosfera } from "@/lib/atmosfera/store";
import type { StatusLiquidacao } from "@/lib/atmosfera/tipos";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Executivo da Plataforma — Admin ATMOSFERA" },
      {
        name: "description",
        content: "Gestão executiva do GMV, receita, conta garantia, transações P2P e auditorias Firecrawl/IFRS S2.",
      },
      { property: "og:title", content: "Painel Executivo — Admin ATMOSFERA" },
      {
        property: "og:description",
        content: "Indicadores financeiros, liquidação em Escrow e auditorias de créditos de carbono.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <RequerSessao perfil="admin">{() => <PainelAdmin />}</RequerSessao>,
});

const STATUS_LIQUIDACAO: Record<StatusLiquidacao, string> = {
  retido_escrow: "Retido em Escrow",
  liquidado: "Liquidado ao vendedor",
};

function PainelAdmin() {
  const compras = useAtmosfera((e) => e.compras);
  const auditorias = useAtmosfera((e) => e.auditorias);
  const indicadores = calcularIndicadoresPlataforma(compras, auditorias);
  const transacoes = [...compras].sort((a, b) => b.data.localeCompare(a.data));
  const historico = [...auditorias].sort((a, b) => b.data.localeCompare(a.data));
  const aprovadas = auditorias.filter((a) => a.status === "aprovada").length;
  const reprovadas = auditorias.length - aprovadas;

  const cards = [
    {
      titulo: "Volume Total Transacionado (GMV)",
      valor: formatarUSD(indicadores.gmv),
      detalhe: "Valor bruto negociado entre vendedores e compradores",
      icone: BadgeDollarSign,
    },
    {
      titulo: "Receita Líquida ATMOSFERA",
      valor: formatarUSD(indicadores.receitaLiquida),
      detalhe: `Comissão de ${(TAXA_PLATAFORMA * 100).toLocaleString("pt-BR")}% sobre o GMV`,
      icone: WalletCards,
    },
    {
      titulo: "Saldo Retido em Conta Garantia",
      valor: formatarUSD(indicadores.escrowRetido),
      detalhe: "Valores em Escrow aguardando liberação ao vendedor",
      icone: Landmark,
    },
    {
      titulo: "Total de Lotes Auditados",
      valor: formatarNumero(indicadores.lotesAuditados),
      detalhe: `${aprovadas} aprovados · ${reprovadas} reprovados`,
      icone: FileSearch,
    },
  ];

  return (
    <>
      <CabecalhoPagina
        eyebrow="Admin ATMOSFERA · Gestão"
        titulo="Painel Executivo da Plataforma"
        descricao="Acompanhe o desempenho financeiro, a liquidação das transações P2P e a integridade das auditorias."
        acao={<Badge variant="gold"><ShieldCheck className="mr-1 size-3.5" /> Demonstração simulada</Badge>}
      />

      <section aria-label="Indicadores financeiros" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ titulo, valor, detalhe, icone: Icone }) => (
          <article key={titulo} className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
              <span className="rounded-lg bg-secondary p-2 text-primary"><Icone className="size-5" /></span>
            </div>
            <p className="mt-4 font-display text-3xl font-medium text-foreground">{valor}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{detalhe}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <div>
            <p className="eyebrow text-primary">Gestão financeira</p>
            <h2 className="mt-1 text-xl font-medium">Transações P2P</h2>
          </div>
          <Badge variant="secondary">{transacoes.length} transações</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead className="bg-muted/60 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Vendedor</th>
                <th className="px-4 py-3 font-medium">Comprador</th>
                <th className="px-4 py-3 text-right font-medium">Quantidade (tCO₂e)</th>
                <th className="px-4 py-3 text-right font-medium">Valor bruto</th>
                <th className="px-4 py-3 text-right font-medium">Comissão ATMOSFERA (2,5%)</th>
                <th className="px-5 py-3 font-medium">Status de liquidação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transacoes.map((c) => {
                const status = c.statusLiquidacao ?? "liquidado";
                return (
                  <tr key={c.id} className="align-top transition-colors hover:bg-muted/40">
                    <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">{formatarData(c.data)}</td>
                    <td className="max-w-56 px-4 py-4"><span className="line-clamp-2 font-medium">{c.vendedorNome}</span></td>
                    <td className="max-w-52 px-4 py-4"><span className="line-clamp-2">{c.compradorNome}</span></td>
                    <td className="px-4 py-4 text-right font-mono whitespace-nowrap">{formatarNumero(c.quantidade)}</td>
                    <td className="px-4 py-4 text-right font-mono whitespace-nowrap">{formatarUSD(c.subtotal)}</td>
                    <td className="px-4 py-4 text-right font-mono whitespace-nowrap text-primary">{formatarUSD(c.taxa)}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Badge variant={status === "liquidado" ? "success" : "gold"}>{STATUS_LIQUIDACAO[status]}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <div>
            <p className="eyebrow text-primary">Firecrawl · Guardrails · IFRS S2</p>
            <h2 className="mt-1 text-xl font-medium">Auditorias realizadas</h2>
            <p className="mt-1 text-sm text-muted-foreground">Histórico de lotes aprovados e reprovados, com destaque para dupla contagem.</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="success">{aprovadas} aprovadas</Badge>
            <Badge variant="destructive">{reprovadas} reprovadas</Badge>
          </div>
        </div>
        <div className="divide-y divide-border">
          {historico.map((a) => (
            <article key={a.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="flex min-w-0 gap-3">
                {a.status === "aprovada" ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
                ) : (
                  <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{a.projeto}</h3>
                    <Badge variant={a.status === "aprovada" ? "success" : "destructive"}>
                      {a.status === "aprovada" ? "Aprovada" : "Reprovada"}
                    </Badge>
                    {a.duplaContagem && <Badge variant="warning">Dupla contagem detectada</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{a.vendedorNome} · {formatarData(a.data)}</p>
                  <p className="mt-2 font-mono text-xs break-all text-muted-foreground">{a.registro} · {a.certificadora}</p>
                  {a.motivoReprovacao && <p className="mt-2 text-sm text-destructive">{a.motivoReprovacao}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 pl-8 lg:pl-4">
                <div className="text-right">
                  <p className="eyebrow text-muted-foreground">Nota de integridade</p>
                  <p className="font-display text-2xl">{a.nota}<span className="text-sm text-muted-foreground">/100</span></p>
                </div>
                <span className="max-w-32 truncate font-mono text-[0.65rem] text-muted-foreground" title={a.hash}>{a.hash.slice(0, 10)}…</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
