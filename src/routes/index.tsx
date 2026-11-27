import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Building2, ShieldCheck, Sprout, Zap } from "lucide-react";
import { toast } from "sonner";
import heroImg from "@/assets/pantanal-aereo.jpg";
import { Marca } from "@/components/atmosfera/Marca";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { acoes } from "@/lib/atmosfera/store";
import { validarAcessoAdmin } from "@/lib/atmosfera/regras";
import type { Perfil } from "@/lib/atmosfera/tipos";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ATMOSFERA — Entrar no Marketplace P2P de Créditos de Carbono" },
      {
        name: "description",
        content:
          "Cadastre-se como vendedor ou comprador de créditos de carbono auditados por agentes de IA, alinhados ao Artigo 6.2.",
      },
      { property: "og:title", content: "ATMOSFERA — Marketplace P2P de Créditos de Carbono" },
      {
        property: "og:description",
        content: "Produtores e empresas negociando créditos de carbono direto, com auditoria inteligente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});

const ATUACOES: Record<Perfil, string[]> = {
  vendedor: [
    "Produtor rural",
    "Projeto de reflorestamento",
    "Geradora de energia limpa",
    "Cooperativa agrícola",
    "Gestão de resíduos / metano",
  ],
  comprador: [
    "Indústria (escopo 1 e 2)",
    "Varejo e serviços",
    "Aviação e logística",
    "Instituição financeira",
    "Trading / intermediário",
  ],
  admin: ["Gestão da plataforma", "Compliance e auditoria", "Financeiro / Escrow"],
};

const ROTULOS_PERFIL: Record<Perfil, string> = {
  vendedor: "Vendedor",
  comprador: "Comprador",
  admin: "Admin ATMOSFERA (Gestão)",
};

const DESTINOS = {
  vendedor: "/vendedor",
  comprador: "/marketplace",
  admin: "/admin",
} as const;

const PAISES = ["Brasil", "Colômbia", "Peru", "México", "Quênia", "Índia", "Indonésia", "Portugal", "Estados Unidos"];

function Onboarding() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<Perfil>("vendedor");
  const [restritoAberto, setRestritoAberto] = useState(false);
  const [credenciais, setCredenciais] = useState({ email: "", senha: "" });
  const [erroRestrito, setErroRestrito] = useState<string | null>(null);

  function entrarRestrito(e: FormEvent) {
    e.preventDefault();
    const erro = validarAcessoAdmin(credenciais.email, credenciais.senha);
    if (erro) {
      setErroRestrito(erro);
      return;
    }
    setRestritoAberto(false);
    demo("admin");
  }
  const [form, setForm] = useState({ nome: "", documento: "", pais: "Brasil", estado: "", email: "", atuacao: "" });

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const destino = (p: Perfil) => DESTINOS[p];

  function enviar(e: FormEvent) {
    e.preventDefault();
    const doc = form.documento.replace(/\D/g, "");
    if (form.pais === "Brasil" && doc.length !== 11 && doc.length !== 14) {
      toast.error("Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.");
      return;
    }
    if (!form.atuacao) {
      toast.error("Escolha seu perfil de atuação.");
      return;
    }
    acoes.cadastrar({ ...form, perfil });
    toast.success("Cadastro concluído. Bem-vindo à ATMOSFERA!");
    navigate({ to: destino(perfil) });
  }

  function demo(p: Perfil) {
    acoes.entrarDemo(p);
    navigate({ to: destino(p) });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden lg:block">
        <img
          src={heroImg}
          alt="Vista aérea do Pantanal ao pôr do sol"
          width={1280}
          height={1600}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-veil" />
        <div className="relative flex h-full flex-col justify-between p-12 text-deep-foreground">
          <Marca claro />
          <div className="max-w-lg">
            <p className="eyebrow text-gold">Marketplace P2P · Artigo 6.2 · IFRS S2</p>
            <h1 className="mt-4 text-5xl leading-[1.05] font-medium">
              Carbono negociado direto da origem, com auditoria que não dorme.
            </h1>
            <ul className="mt-8 space-y-3 text-sm text-deep-foreground/85">
              <li className="flex gap-3"><Sprout className="size-5 text-gold" /> Produtores e projetos vendem sem intermediários.</li>
              <li className="flex gap-3"><ShieldCheck className="size-5 text-gold" /> Agentes de IA verificam o registro e evitam dupla contagem.</li>
              <li className="flex gap-3"><Zap className="size-5 text-gold" /> Certificado contábil emitido na hora da compra.</li>
            </ul>
          </div>
        </div>
      </aside>

      <section className="flex items-center justify-center bg-background px-5 py-10 md:px-12">
        <div className="w-full max-w-md">
          <Marca className="mb-8 lg:hidden" />
          <p className="eyebrow text-primary">Acesso à plataforma</p>
          <h2 className="mt-2 text-3xl font-medium">Como você quer entrar?</h2>

          <div role="tablist" className="mt-6 grid grid-cols-1 gap-1 rounded-lg bg-muted p-1 sm:grid-cols-2">
            {(["vendedor", "comprador"] as const).map((p) => (
              <button
                key={p}
                role="tab"
                aria-selected={perfil === p}
                onClick={() => {
                  setPerfil(p);
                  setForm((f) => ({ ...f, atuacao: "" }));
                }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                  perfil === p ? "bg-card text-primary shadow-soft" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p === "vendedor" ? <Sprout className="size-4 shrink-0" /> : <Building2 className="size-4 shrink-0" />}
                <span>Entrar como {ROTULOS_PERFIL[p]}</span>
              </button>
            ))}
          </div>

          <form onSubmit={enviar} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome / Razão Social</Label>
              <Input id="nome" required value={form.nome} onChange={(e) => set("nome")(e.target.value)} placeholder={perfil === "vendedor" ? "Fazenda Boa Esperança" : perfil === "comprador" ? "Empresa Exemplo S.A." : "Gestão ATMOSFERA"} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="documento">CPF / CNPJ</Label>
              <Input id="documento" required value={form.documento} onChange={(e) => set("documento")(e.target.value)} placeholder="00.000.000/0001-00" inputMode="numeric" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>País</Label>
                <Select value={form.pais} onValueChange={set("pais")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAISES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="estado">Estado</Label>
                <Input id="estado" required value={form.estado} onChange={(e) => set("estado")(e.target.value)} placeholder="MS" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e) => set("email")(e.target.value)} placeholder="contato@empresa.com.br" />
            </div>
            <div className="space-y-1.5">
              <Label>Perfil de atuação</Label>
              <Select value={form.atuacao} onValueChange={set("atuacao")}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {ATUACOES[perfil].map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" size="lg" className="w-full">
              Criar conta de {ROTULOS_PERFIL[perfil]}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> ou teste agora <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-2">
            <Button variant="gold" onClick={() => demo("vendedor")}>
              <Sprout /> Acesso Rápido Demo (Vendedor)
            </Button>
            <Button variant="deep" onClick={() => demo("comprador")}>
              <Building2 /> Acesso Rápido Demo (Comprador)
            </Button>
          </div>

          <footer className="mt-10 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => {
                setErroRestrito(null);
                setCredenciais({ email: "", senha: "" });
                setRestritoAberto(true);
              }}
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              Área Restrita (Gestão)
            </button>
          </footer>
        </div>
      </section>

      <Dialog open={restritoAberto} onOpenChange={setRestritoAberto}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Área Restrita (Gestão)</DialogTitle>
            <DialogDescription>Acesso exclusivo à equipe autorizada da ATMOSFERA.</DialogDescription>
          </DialogHeader>
          <form onSubmit={entrarRestrito} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email-restrito">E-mail autorizado</Label>
              <Input id="email-restrito" type="email" required autoComplete="username" value={credenciais.email} onChange={(e) => setCredenciais((c) => ({ ...c, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="senha-restrito">Senha</Label>
              <Input id="senha-restrito" type="password" required autoComplete="current-password" value={credenciais.senha} onChange={(e) => setCredenciais((c) => ({ ...c, senha: e.target.value }))} />
            </div>
            {erroRestrito && <p role="alert" className="text-sm text-destructive">{erroRestrito}</p>}
            <Button type="submit" className="w-full"><ShieldCheck /> Entrar no Painel Executivo</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
