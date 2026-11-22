const usd = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" });
const num = new Intl.NumberFormat("pt-BR");

export const formatarUSD = (v: number) => usd.format(v);
export const formatarNumero = (v: number) => num.format(v);
export const formatarData = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
export const encurtarHash = (h: string) => `${h.slice(0, 10)}…${h.slice(-8)}`;

export function rotuloNota(nota: number) {
  if (nota >= 90) return "Excelente";
  if (nota >= 80) return "Alta integridade";
  if (nota >= 70) return "Boa";
  return "Regular";
}
