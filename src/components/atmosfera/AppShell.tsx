import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Bot, FileCheck2, LayoutDashboard, LogOut, Store, Leaf, ArrowLeftRight } from "lucide-react";
import { Marca } from "./Marca";
import { Button } from "@/components/ui/button";
import { acoes, useSessao } from "@/lib/atmosfera/store";
import type { Perfil } from "@/lib/atmosfera/tipos";
import { cn } from "@/lib/utils";

const ABAS = [
  { to: "/vendedor", rotulo: "Anunciar créditos", icone: Leaf },
  { to: "/marketplace", rotulo: "Marketplace", icone: Store },
  { to: "/assistente", rotulo: "Assistente IA", icone: Bot },
  { to: "/certificados", rotulo: "Certificados", icone: FileCheck2 },
  { to: "/admin", rotulo: "Painel Executivo", icone: LayoutDashboard },
] as const;

const PERFIS: Record<Perfil, string> = {
  vendedor: "Vendedor",
  comprador: "Comprador",
  admin: "Admin",
};

const PROXIMO_PERFIL: Record<Perfil, Perfil> = {
  vendedor: "comprador",
  comprador: "admin",
  admin: "vendedor",
};

export function AppShell({ children }: { children: ReactNode }) {
  const { usuario } = useSessao();
  const navigate = useNavigate();
  const abas = ABAS.filter((aba) =>
    usuario?.perfil === "admin"
      ? aba.to === "/admin" || aba.to === "/marketplace" || aba.to === "/certificados"
      : aba.to !== "/admin",
  );
  const proximoPerfil = usuario ? PROXIMO_PERFIL[usuario.perfil] : "vendedor";

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print sticky top-0 z-30 bg-gradient-deep text-deep-foreground shadow-lift">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 md:px-8">
          <Link to={usuario?.perfil === "admin" ? "/admin" : "/marketplace"} aria-label="ATMOSFERA — início">
            <Marca claro />
          </Link>
          <nav className="hidden flex-1 items-center gap-1 lg:flex">
            {abas.map(({ to, rotulo, icone: Icone }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-deep-foreground/70 transition-colors hover:bg-deep-foreground/10 hover:text-deep-foreground"
                activeProps={{ className: "bg-deep-foreground/10 !text-deep-foreground" }}
              >
                <Icone className="size-4" />
                {rotulo}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {usuario && (
              <div className="hidden text-right md:block">
                <p className="max-w-56 truncate text-sm font-medium">{usuario.nome}</p>
                <p className="eyebrow text-gold">{PERFIS[usuario.perfil]}</p>
              </div>
            )}
            {usuario && (
              <Button
                variant="ghostDeep"
                size="icon"
                title={`Trocar para ${PERFIS[proximoPerfil]} demo`}
                aria-label="Trocar perfil demo"
                onClick={() => acoes.entrarDemo(proximoPerfil)}
              >
                <ArrowLeftRight />
              </Button>
            )}
            <Button
              variant="ghostDeep"
              size="icon"
              aria-label="Sair"
              title="Sair"
              onClick={() => {
                acoes.sair();
                navigate({ to: "/" });
              }}
            >
              <LogOut />
            </Button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
          {abas.map(({ to, rotulo, icone: Icone }) => (
            <Link
              key={to}
              to={to}
              className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-deep-foreground/70"
              activeProps={{ className: "bg-deep-foreground/10 !text-deep-foreground" }}
            >
              <Icone className="size-3.5" />
              {rotulo}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">{children}</main>
      <footer className="no-print border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground md:px-8">
          <span>ATMOSFERA · Alinhado ao Artigo 6.2 do Acordo de Paris (pós-COP 31) · Contabilidade IFRS S2</span>
          <button className="underline-offset-4 hover:underline" onClick={() => acoes.restaurarDemo()}>
            Restaurar dados de demonstração
          </button>
        </div>
      </footer>
    </div>
  );
}

export function CabecalhoPagina({
  eyebrow,
  titulo,
  descricao,
  acao,
  className,
}: {
  eyebrow: string;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="max-w-2xl">
        <p className="eyebrow text-primary">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-medium text-foreground md:text-4xl">{titulo}</h1>
        {descricao && <p className="mt-2 text-muted-foreground">{descricao}</p>}
      </div>
      {acao}
    </div>
  );
}
