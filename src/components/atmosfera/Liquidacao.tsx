import { Banknote, Copy, CreditCard, Landmark, Lock, QrCode, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatarUSD } from "@/lib/atmosfera/formato";
import {
  CONTA_ESCROW,
  COTACAO_REFERENCIA_BRL,
  FORMAS_PAGAMENTO,
  gerarDadosPix,
  gerarHash,
  referenciaSwift,
  type DadosCartao,
} from "@/lib/atmosfera/regras";
import type { FormaPagamento } from "@/lib/atmosfera/tipos";
import { cn } from "@/lib/utils";

const ICONES: Record<FormaPagamento, typeof QrCode> = { pix: QrCode, swift: Landmark, cartao: CreditCard };

export function SeletorPagamento({
  valor,
  onChange,
  bloqueado,
}: {
  valor: FormaPagamento;
  onChange: (f: FormaPagamento) => void;
  bloqueado: boolean;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-soft">
      <h3 className="font-sans text-base font-semibold">Forma de pagamento</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Os fundos ficam retidos em conta garantia (Escrow) e só vão ao vendedor após a baixa do crédito.
      </p>
      <div role="radiogroup" aria-label="Forma de pagamento" className="mt-4 grid gap-3 md:grid-cols-3">
        {(Object.keys(FORMAS_PAGAMENTO) as FormaPagamento[]).map((f) => {
          const Icone = ICONES[f];
          const ativo = valor === f;
          return (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={ativo}
              disabled={bloqueado}
              onClick={() => onChange(f)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all disabled:cursor-not-allowed",
                ativo ? "border-primary bg-secondary" : "border-border hover:border-primary/40",
                bloqueado && !ativo && "opacity-50",
              )}
            >
              <Icone className={cn("size-5", ativo ? "text-primary" : "text-muted-foreground")} />
              <span className="text-sm font-semibold">{FORMAS_PAGAMENTO[f].nome}</span>
              <span className="text-xs text-muted-foreground">{FORMAS_PAGAMENTO[f].prazo}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function copiar(texto: string, rotulo: string) {
  void navigator.clipboard?.writeText(texto).then(
    () => toast.success(`${rotulo} copiado.`),
    () => toast.error("Não foi possível copiar."),
  );
}

function Campo({ rotulo, valor, mono = true, copiavel = false }: { rotulo: string; valor: string; mono?: boolean; copiavel?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border py-2 text-sm last:border-0">
      <span className="shrink-0 text-muted-foreground">{rotulo}</span>
      <span className="flex min-w-0 items-center gap-1.5 text-right">
        <span className={cn(mono ? "font-mono text-xs break-all" : "font-medium")}>{valor}</span>
        {copiavel && (
          <button type="button" onClick={() => copiar(valor, rotulo)} aria-label={`Copiar ${rotulo}`} className="text-muted-foreground hover:text-primary">
            <Copy className="size-3.5" />
          </button>
        )}
      </span>
    </div>
  );
}

/** QR ilustrativo gerado a partir do código — não é escaneável (demonstração). */
function QrIlustrativo({ semente }: { semente: string }) {
  const n = 25;
  const bits = Array.from({ length: 8 }, (_, i) => gerarHash(`${semente}|${i}`)).join("");
  const finder = (x: number, y: number) => {
    const dentro = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
    for (const [ox, oy] of [[0, 0], [n - 7, 0], [0, n - 7]] as const) {
      if (dentro(ox, oy)) {
        const dx = x - ox, dy = y - oy;
        return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4) ? 1 : 0;
      }
    }
    return -1;
  };
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const f = finder(x, y);
      const on = f === -1 ? parseInt(bits[(y * n + x) % bits.length] ?? "0", 16) % 2 === 1 : f === 1;
      if (on) cells.push({ x, y });
    }
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} className="size-44 rounded-lg bg-card" role="img" aria-label="QR Code PIX ilustrativo">
      {cells.map(({ x, y }) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" className="fill-foreground" />)}
    </svg>
  );
}

export function PainelLiquidacao({
  forma,
  escrowId,
  loteId,
  totalUSD,
  cartao,
  onCartao,
}: {
  forma: FormaPagamento;
  escrowId: string;
  loteId: string;
  totalUSD: number;
  cartao: DadosCartao;
  onCartao: (c: DadosCartao) => void;
}) {
  const pix = gerarDadosPix(escrowId, totalUSD);
  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pix.valorBRL);

  return (
    <section className="animate-stream-in overflow-hidden rounded-xl border-2 border-primary bg-card shadow-lift">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-deep px-6 py-4 text-deep-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-gold" />
          <div>
            <p className="eyebrow text-gold">Liquidação em conta garantia</p>
            <p className="text-sm font-semibold">{FORMAS_PAGAMENTO[forma].nome}</p>
          </div>
        </div>
        <span className="rounded-md bg-deep-foreground/10 px-2.5 py-1 font-mono text-xs">{escrowId}</span>
      </div>

      <div className="p-6">
        {forma === "pix" && (
          <div className="grid gap-6 md:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-xl border border-border p-2"><QrIlustrativo semente={pix.copiaECola} /></div>
              <span className="text-[0.65rem] text-muted-foreground">QR ilustrativo (demonstração)</span>
            </div>
            <div>
              <p className="font-display text-3xl">{brl}</p>
              <p className="text-xs text-muted-foreground">
                {formatarUSD(totalUSD)} × cotação de referência R$ {COTACAO_REFERENCIA_BRL.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <div className="mt-4">
                <Campo rotulo="Chave PIX (aleatória)" valor={pix.chave} copiavel />
                <Campo rotulo="Favorecido" valor={CONTA_ESCROW.beneficiario} mono={false} />
                <Campo rotulo="CNPJ" valor={CONTA_ESCROW.cnpj} />
                <Campo rotulo="Identificador" valor={escrowId} copiavel />
              </div>
              <div className="mt-3 rounded-lg bg-muted p-3">
                <div className="flex items-center justify-between">
                  <span className="eyebrow text-muted-foreground">PIX Copia e Cola</span>
                  <button type="button" onClick={() => copiar(pix.copiaECola, "Código PIX")} className="flex items-center gap-1 text-xs font-medium text-primary">
                    <Copy className="size-3.5" /> Copiar
                  </button>
                </div>
                <p className="mt-1 font-mono text-[0.65rem] leading-relaxed break-all text-muted-foreground">{pix.copiaECola}</p>
              </div>
            </div>
          </div>
        )}

        {forma === "swift" && (
          <div>
            <p className="font-display text-3xl">{formatarUSD(totalUSD)}</p>
            <p className="text-xs text-muted-foreground">Envie o valor exato em dólares americanos (USD), tarifas por conta do remetente (OUR).</p>
            <div className="mt-4 grid gap-x-8 md:grid-cols-2">
              <div>
                <Campo rotulo="Beneficiário" valor={CONTA_ESCROW.beneficiario} mono={false} />
                <Campo rotulo="CNPJ" valor={CONTA_ESCROW.cnpj} />
                <Campo rotulo="Banco" valor={CONTA_ESCROW.banco} mono={false} />
                <Campo rotulo="Agência / Conta" valor={`${CONTA_ESCROW.agencia} / ${CONTA_ESCROW.conta}`} />
              </div>
              <div>
                <Campo rotulo="SWIFT/BIC" valor={CONTA_ESCROW.swift} copiavel />
                <Campo rotulo="IBAN" valor={CONTA_ESCROW.iban} copiavel />
                <Campo rotulo="Banco intermediário" valor={CONTA_ESCROW.intermediario} mono={false} />
                <Campo rotulo="Referência obrigatória" valor={referenciaSwift(escrowId, loteId)} copiavel />
              </div>
            </div>
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-gold/15 p-3 text-xs text-gold-foreground">
              <Banknote className="mt-0.5 size-4 shrink-0" />
              Inclua a referência no campo “Remittance information” (MT103 campo 70) para conciliação automática.
            </p>
          </div>
        )}

        {forma === "cartao" && (
          <div>
            <p className="font-display text-3xl">{formatarUSD(totalUSD)}</p>
            <p className="text-xs text-muted-foreground">Pré-autorização retida em Escrow; a captura ocorre na baixa do crédito no registro.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="cartao-numero">Número do cartão corporativo</Label>
                <Input
                  id="cartao-numero"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  className="font-mono"
                  placeholder="0000 0000 0000 0000"
                  value={cartao.numero}
                  onChange={(e) => onCartao({ ...cartao, numero: e.target.value.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ") })}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="cartao-nome">Nome impresso no cartão</Label>
                <Input id="cartao-nome" autoComplete="cc-name" value={cartao.nome} onChange={(e) => onCartao({ ...cartao, nome: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cartao-validade">Validade (MM/AA)</Label>
                <Input
                  id="cartao-validade"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="12/28"
                  value={cartao.validade}
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                    onCartao({ ...cartao, validade: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d });
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cartao-cvv">CVV</Label>
                <Input id="cartao-cvv" inputMode="numeric" autoComplete="cc-csc" type="password" placeholder="•••" value={cartao.cvv} onChange={(e) => onCartao({ ...cartao, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3.5" /> Demonstração: nenhum dado de cartão é enviado ou guardado — apenas os 4 últimos dígitos no extrato.
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-2 rounded-lg border border-dashed border-primary/40 p-4 text-xs text-muted-foreground md:grid-cols-3">
          <p><span className="font-semibold text-foreground">1. Pagamento</span> — valor entra na conta garantia {escrowId}.</p>
          <p><span className="font-semibold text-foreground">2. Baixa do crédito</span> — unidades retiradas do estoque do vendedor (Art. 6.2).</p>
          <p><span className="font-semibold text-foreground">3. Liberação</span> — fundos ao vendedor e certificado IFRS S2 emitido.</p>
        </div>
      </div>
    </section>
  );
}
