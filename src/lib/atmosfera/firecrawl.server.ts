const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";

export interface ExtracaoReal {
  ok: boolean;
  url: string;
  titulo?: string;
  trecho?: string;
  status?: number;
  erro?: string;
}

export async function raspar(url: string): Promise<ExtracaoReal> {
  const lovable = process.env["LOVABLE_API_KEY"];
  const fc = process.env["FIRECRAWL_API_KEY"];
  if (!lovable || !fc) return { ok: false, url, erro: "Integração Firecrawl não configurada" };
  try {
    const res = await fetch(`${GATEWAY}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": fc },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, timeout: 30000 }),
    });
    if (!res.ok) {
      console.error(`Firecrawl [${res.status}]: ${await res.text()}`);
      return { ok: false, url, status: res.status, erro: `Falha na extração (HTTP ${res.status})` };
    }
    const j = (await res.json()) as { data?: { markdown?: string; metadata?: { title?: string; statusCode?: number } } };
    const md = j.data?.markdown ?? "";
    const trecho = md
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[#*_>`|-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 280);
    return { ok: true, url, titulo: j.data?.metadata?.title || "(sem título)", trecho, status: j.data?.metadata?.statusCode ?? 200 };
  } catch (e) {
    console.error("Firecrawl erro", e);
    return { ok: false, url, erro: "Não foi possível contatar o extrator" };
  }
}
