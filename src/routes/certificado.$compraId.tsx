import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer, ShieldCheck } from "lucide-react";
import { Marca } from "@/components/atmosfera/Marca";
import { RequerSessao } from "@/components/atmosfera/RequerSessao";
import { SeloNota } from "@/components/atmosfera/SeloNota";
import { Button } from "@/components/ui/button";
import { formatarData, formatarNumero, formatarUSD } from "@/lib/atmosfera/formato";
import { FORMAS_PAGAMENTO, TAXA_PLATAFORMA } from "@/lib/atmosfera/regras";
import { useAtmosfera } from "@/lib/atmosfera/store";

export const Route = createFileRoute("/certificado/$compraId")({
  head: () => ({
    meta: [
      { title: "Certificado Digital de Compensação | ATMOSFERA" },
      { name: "description", content: "Certificado de compensação de emissões e extrato contábil IFRS S2 com hash único." },
      { property: "og:title", content: "Certificado de Compensação — ATMOSFERA" },
      { property: "og:description", content: "Certificado digital e extrato contábil IFRS S2." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CertificadoPagina,
});

function CertificadoPagina() {
  const { compraId } = Route.useParams();
  return <RequerSessao>{() => <Certificado compraId={compraId} />}</RequerSessao>;
}

function Linha({ rotulo, valor, mono }: { rotulo: string; valor: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
      <dt className="text-muted-foreground">{rotulo}</dt>
      <dd className={mono ? "font-mono text-right" : "text-right font-medium"}>{valor}</dd>
    </div>
  );
}

function Certificado({ compraId }: { compraId: string }) {
  const c = useAtmosfera((e) => e.compras.find((x) => x.id === compraId));

  if (!c) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-medium">Certificado não encontrado</h1>
        <Button asChild className="mt-6"><Link to="/certificados">Ver meus certificados</Link></Button>
      </div>
    );
  }

  const codigo = `ATM-${c.hash.slice(0, 4).toUpperCase()}-${c.hash.slice(4, 8).toUpperCase()}-${c.hash.slice(8, 12).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/certificados"><ArrowLeft /> Meus certificados</Link>
        </Button>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/marketplace">Continuar comprando</Link></Button>
          <Button onClick={() => window.print()}><Printer /> Imprimir / salvar PDF</Button>
        </div>
      </div>

      <article className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
        <div className="grid-lines absolute inset-0 opacity-60" aria-hidden />
        <div className="relative border-b-4 border-gold bg-gradient-deep px-8 py-8 text-deep-foreground md:px-12">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <Marca claro />
              <p className="eyebrow mt-6 text-gold">Certificado Digital de Compensação</p>
              <h1 className="mt-2 text-3xl font-medium md:text-4xl">
                {formatarNumero(c.quantidade)} toneladas de CO₂e compensadas
              </h1>
              <p className="mt-2 text-deep-foreground/80">em nome de <span className="font-semibold text-deep-foreground">{c.compradorNome}</span></p>
            </div>
            <div className="rounded-full bg-card p-2"><SeloNota nota={c.nota} /></div>
          </div>
        </div>

        <div className="relative grid gap-8 px-8 py-8 md:grid-cols-2 md:px-12">
          <section>
            <h2 className="eyebrow mb-3 font-mono text-primary">Origem do crédito</h2>
            <dl>
              <Linha rotulo="Projeto" valor={c.projeto} />
              <Linha rotulo="Localização" valor={`${c.localizacao} · ${c.pais}`} />
              <Linha rotulo="Tipo" valor={c.tipo} />
              <Linha rotulo="Vendedor" valor={c.vendedorNome} />
              <Linha rotulo="CPF/CNPJ vendedor" valor={c.vendedorDocumento} mono />
              <Linha rotulo="Certificadora" valor={c.certificadora} />
              <Linha rotulo="Safra (vintage)" valor={String(c.vintage)} />
              <Linha rotulo="Selo ATMOSFERA" valor={`${c.nota}/100`} />
            </dl>
          </section>

          <section>
            <h2 className="eyebrow mb-3 font-mono text-primary">Extrato contábil · IFRS S2</h2>
            <dl>
              <Linha rotulo="Data da liquidação" valor={formatarData(c.data)} />
              <Linha rotulo="Comprador" valor={c.compradorNome} />
              <Linha rotulo="CPF/CNPJ comprador" valor={c.compradorDocumento} mono />
              <Linha rotulo="Quantidade" valor={`${formatarNumero(c.quantidade)} tCO₂e`} />
              <Linha rotulo="Preço unitário" valor={formatarUSD(c.precoTonelada)} mono />
              <Linha rotulo="Valor ao vendedor" valor={formatarUSD(c.subtotal)} mono />
              <Linha rotulo={`Taxa plataforma (${(TAXA_PLATAFORMA * 100).toLocaleString("pt-BR")}%)`} valor={formatarUSD(c.taxa)} mono />
              <Linha rotulo="Total desembolsado" valor={formatarUSD(c.total)} mono />
              <Linha rotulo="Aprovação humana" valor={c.aprovacaoHumana ? "Sim (acima de US$ 10.000)" : "Não exigida"} />
              {c.pagamento && (
                <>
                  <Linha
                    rotulo="Forma de pagamento"
                    valor={`${FORMAS_PAGAMENTO[c.pagamento.forma].nome}${c.pagamento.ultimos4 ? ` · final ${c.pagamento.ultimos4}` : ""}`}
                  />
                  {c.pagamento.valorBRL !== undefined && (
                    <Linha rotulo="Valor liquidado em R$" valor={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(c.pagamento.valorBRL)} mono />
                  )}
                  <Linha rotulo="Conta garantia (Escrow)" valor={`${c.pagamento.escrowId} · liberada`} mono />
                </>
              )}
            </dl>
          </section>

          <section className="rounded-xl bg-muted p-5 md:col-span-2">
            <div className="grid gap-4 text-sm md:grid-cols-3">
              <div>
                <p className="eyebrow text-muted-foreground">Classificação IFRS S2</p>
                <p className="mt-1">Créditos de carbono usados para atingir meta climática (§ 36(e)) — compensação de emissões.</p>
              </div>
              <div>
                <p className="eyebrow text-muted-foreground">Ajuste correspondente</p>
                <p className="mt-1">Artigo 6.2 do Acordo de Paris — unidade baixada do estoque do vendedor, sem dupla contagem.</p>
              </div>
              <div>
                <p className="eyebrow text-muted-foreground">Código do certificado</p>
                <p className="mt-1 font-mono font-medium">{codigo}</p>
              </div>
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <p className="eyebrow flex items-center gap-1.5 text-muted-foreground"><ShieldCheck className="size-3.5 text-success" /> Hash único (registro imutável)</p>
              <p className="mt-1 font-mono text-xs break-all text-foreground">{c.hash}</p>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
