import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "./AppShell";
import { Button } from "@/components/ui/button";
import { acoes, useSessao } from "@/lib/atmosfera/store";
import type { Perfil, Usuario } from "@/lib/atmosfera/tipos";

export function RequerSessao({
  perfil,
  children,
}: {
  perfil?: Perfil;
  children: (usuario: Usuario) => ReactNode;
}) {
  const { hidratado, usuario } = useSessao();

  if (!hidratado) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-medium">Entre para continuar</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Faça seu cadastro ou use um acesso rápido de demonstração.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Ir para o acesso</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (perfil && usuario.perfil !== perfil) {
    const nome = perfil === "vendedor" ? "Vendedor" : "Comprador";
    return (
      <AppShell>
        <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-soft">
          <p className="eyebrow text-primary">Acesso restrito</p>
          <h2 className="mt-2 text-2xl font-medium">Esta área é do perfil {nome}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Você está como {usuario.perfil === "vendedor" ? "Vendedor" : "Comprador"}. Troque para o
            perfil {nome} de demonstração para continuar.
          </p>
          <Button className="mt-6" onClick={() => acoes.entrarDemo(perfil)}>
            Entrar como {nome} demo
          </Button>
        </div>
      </AppShell>
    );
  }

  return <AppShell>{children(usuario)}</AppShell>;
}
