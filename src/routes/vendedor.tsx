import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useRef, useState, type FormEvent } from "react";
import { Loader2, Send, Store } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { extrairRegistro } from "@/lib/atmosfera/firecrawl.functions";
import type { ExtracaoReal } from "@/lib/atmosfera/firecrawl.server";
import { toast } from "sonner";
import { CabecalhoPagina } from "@/components/atmosfera/AppShell";
import { AuditoriaAoVivo } from "@/components/atmosfera/AuditoriaAoVivo";
import { RequerSessao } from "@/components/atmosfera/RequerSessao";
import { SeloNota } from "@/components/atmosfera/SeloNota";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatarNumero, formatarUSD } from "@/lib/atmosfera/formato";
import { auditarLote, type ResultadoAuditoria } from "@/lib/atmosfera/regras";
import { acoes, useAtmosfera } from "@/lib/atmosfera/store";
import { TIPOS_PROJETO, type TipoProjeto, type Usuario } from "@/lib/atmosfera/tipos";

export const Route = createFileRoute("/vendedor")({
  head: () => ({
    meta: [
      { title: "Anunciar créditos de carbono — Painel do Vendedor | ATMOSFERA" },
      { name: "description", content: "Cadastre lotes de créditos de carbono e publique após auditoria automática por agentes de IA." },
      { property: "og:title", content: "Painel do Vendedor — ATMOSFERA" },
      { property: "og:description", content: "Anuncie créditos de carbono com auditoria automática e selo de integridade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <RequerSessao perfil="vendedor">{(u) => <PainelVendedor vendedor={u} />}</RequerSessao>,
});

const VAZIO = { projeto: "", localizacao: "", tipo: "Reflorestamento" as TipoProjeto, quantidade: "", preco: "", registro: "" };

function PainelVendedor({ vendedor }: { vendedor: Usuario }) {
  const lotes = useAtmosfera((e) => e.lotes);
  const meus = lotes.filter((l) => l.vendedorId === vendedor.id);
  const [form, setForm] = useState(VAZIO);
  const [auditoria, setAuditoria] = useState<{
    id: number;
    registro: string;
    resultado: ResultadoAuditoria;
    dados: typeof VAZIO;
    extracao: ExtracaoReal | null;
  } | null>(null);
  const [extraindo, setExtraindo] = useState(false);
  const extrair = useServerFn(extrairRegistro);
  const [concluida, setConcluida] = useState(false);
  const auditoriaRef = useRef(auditoria);
  auditoriaRef.current = auditoria;

  const set = (k: keyof typeof VAZIO) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submeter(e: FormEvent) {
    e.preventDefault();
    const quantidade = parseInt(form.quantidade, 10);
    const precoTonelada = parseFloat(form.preco.replace(",", "."));
    if (!quantidade || quantidade <= 0 || !precoTonelada || precoTonelada <= 0) {
      toast.error("Informe quantidade e preço válidos.");
      return;
    }
    const resultado = auditarLote(
      { projeto: form.projeto, localizacao: form.localizacao, tipo: form.tipo, quantidade, precoTonelada, registro: form.registro },
      lotes,
    );
    setConcluida(false);
    let extracao: ExtracaoReal | null = null;
    const url = form.registro.trim();
    if (/^https?:\/\/\S+$/i.test(url)) {
      setExtraindo(true);
      try {
        extracao = await extrair({ data: { url } });
      } catch {
        extracao = { ok: false, url, erro: "Não foi possível contatar o extrator" };
      } finally {
        setExtraindo(false);
      }
    }
    setAuditoria({ id: Date.now(), registro: form.registro, resultado, dados: form, extracao });
  }

  const concluir = useCallback(() => {
    const a = auditoriaRef.current;
    if (!a) return;
    setConcluida(true);
    acoes.registrarAuditoria(
      vendedor,
      { projeto: a.dados.projeto, registro: a.dados.registro },
      a.resultado,
    );
    if (a.resultado.aprovado) {
      acoes.publicarLote(
        vendedor,
        {
          projeto: a.dados.projeto,
          localizacao: a.dados.localizacao,
          tipo: a.dados.tipo,
          quantidade: parseInt(a.dados.quantidade, 10),
          precoTonelada: parseFloat(a.dados.preco.replace(",", ".")),
          registro: a.dados.registro,
        },
        a.resultado,
      );
      toast.success("Lote aprovado e publicado no Marketplace!");
      setForm(VAZIO);
    } else {
      toast.error("Lote reprovado. Revise o registro e tente novamente.");
    }
  }, [vendedor]);

  function exemplo() {
    setForm({
      projeto: "Fazenda Santa Clara — Mata Ciliar Rio Paraguai",
      localizacao: "Corumbá - Pantanal/MS",
      tipo: "Reflorestamento",
      quantidade: "600",
      preco: "22.90",
      registro: `https://registry.verra.org/app/projectDetail/VCS/${4000 + Math.floor(Math.random() * 5000)}`,
    });
  }

  return (
    <>
      <CabecalhoPagina
        eyebrow="Painel do Vendedor"
        titulo="Anunciar créditos de carbono"
        descricao="Cadastre um lote. Nossos agentes consultam a certificadora, validam o lastro e publicam com selo de integridade."
        acao={<Button variant="outline" onClick={exemplo}>Preencher exemplo</Button>}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <form onSubmit={submeter} className="grid gap-4 rounded-xl border border-border bg-card p-6 shadow-soft md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="projeto">Nome do Projeto</Label>
              <Input id="projeto" required value={form.projeto} onChange={(e) => set("projeto")(e.target.value)} placeholder="Fazenda Santa Clara — Corredor Ecológico" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="localizacao">Localização</Label>
              <Input id="localizacao" required value={form.localizacao} onChange={(e) => set("localizacao")(e.target.value)} placeholder="Corumbá - Pantanal/MS" />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de Projeto</Label>
              <Select value={form.tipo} onValueChange={(v) => set("tipo")(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_PROJETO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantidade">Quantidade disponível (tCO₂e)</Label>
              <Input id="quantidade" required inputMode="numeric" value={form.quantidade} onChange={(e) => set("quantidade")(e.target.value.replace(/\D/g, ""))} placeholder="500" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preco">Preço por tonelada (US$)</Label>
              <Input id="preco" required inputMode="decimal" value={form.preco} onChange={(e) => set("preco")(e.target.value)} placeholder="22,50" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="registro">Código de Registro / Link da Certificadora</Label>
              <Input id="registro" required value={form.registro} onChange={(e) => set("registro")(e.target.value)} placeholder="VCS-1234 ou https://registry.verra.org/…" />
              <p className="text-xs text-muted-foreground">Aceitos: Verra (VCS), Gold Standard (GS), Cercarbono, Puro.earth, ACR.</p>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" size="lg" className="w-full md:w-auto" disabled={extraindo || (!!auditoria && !concluida)}>
                {extraindo ? <><Loader2 className="animate-spin" /> Lendo a página da certificadora…</> : <><Send /> Submeter para Auditoria e Publicar</>}
              </Button>
            </div>
          </form>

          {auditoria && (
            <div className="space-y-3">
              <AuditoriaAoVivo key={auditoria.id} registro={auditoria.registro} resultado={auditoria.resultado} extracao={auditoria.extracao} onConcluir={concluir} />
              {concluida && auditoria.resultado.aprovado && (
                <Button asChild variant="outline">
                  <Link to="/marketplace"><Store /> Ver no Marketplace</Link>
                </Button>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-medium">Meus lotes</h2>
            <span className="text-sm text-muted-foreground">{meus.length} anunciados</span>
          </div>
          {meus.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Você ainda não anunciou lotes. Preencha o formulário ao lado.
            </p>
          )}
          {meus.map((l) => {
            const vendido = l.quantidadeTotal - l.quantidadeDisponivel;
            return (
              <div key={l.id} className="rounded-xl border border-border bg-card p-4 shadow-soft">
                <div className="flex items-start gap-3">
                  <SeloNota nota={l.nota} tamanho="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{l.projeto}</p>
                    <p className="text-xs text-muted-foreground">{l.localizacao}</p>
                    <Badge variant="sky" className="mt-1.5">{l.tipo}</Badge>
                  </div>
                </div>
                <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                  <span>{formatarNumero(vendido)} de {formatarNumero(l.quantidadeTotal)} t vendidas</span>
                  <span className="font-medium text-foreground">{formatarUSD(l.precoTonelada)}/t</span>
                </div>
                <Progress value={(vendido / l.quantidadeTotal) * 100} className="mt-1.5 h-1.5" />
              </div>
            );
          })}
        </aside>
      </div>
    </>
  );
}
