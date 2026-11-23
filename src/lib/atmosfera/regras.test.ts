import { describe, expect, it } from "vitest";
import { lotesIniciais } from "./dados-iniciais";
import {
  abaterEstoque,
  auditarLote,
  calcularResumo,
  exigirPagamentoConfirmado,
  gerarDadosPix,
  gerarLancamentos,
  validarCartao,
  interpretarPedido,
  recomendarCombinacao,
} from "./regras";

describe("Trava Human-in-the-Loop", () => {
  it("não exige aprovação até US$ 10.000", () => {
    // 400 t × US$ 24,39 = 9.756 + 2,5% = 9.999,90
    expect(calcularResumo(400, 24.39).exigeAprovacaoHumana).toBe(false);
  });
  it("exige aprovação acima de US$ 10.000", () => {
    expect(calcularResumo(500, 24.5).exigeAprovacaoHumana).toBe(true);
  });
});

describe("Taxa transparente", () => {
  it("cobra 2,5% sobre o valor do vendedor", () => {
    const r = calcularResumo(100, 20);
    expect(r.subtotal).toBe(2000);
    expect(r.taxa).toBe(50);
    expect(r.total).toBe(2050);
  });
});

describe("Abate de estoque", () => {
  it("desconta a quantidade comprada do lote do vendedor", () => {
    const lotes = lotesIniciais();
    const depois = abaterEstoque(lotes, "lote-001", 30);
    expect(depois.find((l) => l.id === "lote-001")?.quantidadeDisponivel).toBe(150);
  });
  it("recusa compra maior que o estoque", () => {
    expect(() => abaterEstoque(lotesIniciais(), "lote-001", 181)).toThrow();
  });
});

describe("Auditoria contra dupla contagem", () => {
  it("reprova código de registro já anunciado", () => {
    const r = auditarLote(
      {
        projeto: "Teste",
        localizacao: "Corumbá - Pantanal/MS",
        tipo: "Reflorestamento",
        quantidade: 100,
        precoTonelada: 20,
        registro: "VCS 2741",
      },
      lotesIniciais(),
    );
    expect(r.aprovado).toBe(false);
  });
  it("aprova registro Verra novo com dados consistentes", () => {
    const r = auditarLote(
      {
        projeto: "Teste",
        localizacao: "Corumbá - Pantanal/MS",
        tipo: "Reflorestamento",
        quantidade: 100,
        precoTonelada: 20,
        registro: "VCS-9999",
      },
      lotesIniciais(),
    );
    expect(r.aprovado).toBe(true);
  });
});

describe("Agente orquestrador", () => {
  it("entende 250 toneladas brasileiras auditadas", () => {
    expect(interpretarPedido("Preciso comprar 250 toneladas de créditos brasileiros auditados")).toEqual({
      quantidade: 250,
      pais: "Brasil",
      notaMinima: 80,
    });
  });
  it("recomenda apenas lotes do país pedido e soma a quantidade", () => {
    const rec = recomendarCombinacao(lotesIniciais(), { quantidade: 250, pais: "Brasil", notaMinima: 80 });
    expect(rec.itens.every((i) => i.lote.pais === "Brasil")).toBe(true);
    expect(rec.quantidadeAtendida).toBe(250);
  });
});

describe("Dupla contagem entre formatos", () => {
  it("reconhece o mesmo projeto Verra por código ou por link", () => {
    const r = auditarLote(
      {
        projeto: "Teste",
        localizacao: "Corumbá - Pantanal/MS",
        tipo: "Reflorestamento",
        quantidade: 100,
        precoTonelada: 20,
        registro: "https://registry.verra.org/app/projectDetail/VCS/2741",
      },
      lotesIniciais(),
    );
    expect(r.aprovado).toBe(false);
  });
});

describe("Pagamento via conta garantia (Escrow)", () => {
  it("não libera o certificado sem pagamento confirmado", () => {
    expect(() => exigirPagamentoConfirmado({ confirmado: false })).toThrow();
    expect(() => exigirPagamentoConfirmado(null)).toThrow();
    expect(() => exigirPagamentoConfirmado({ confirmado: true })).not.toThrow();
  });
  it("PIX cobra o total convertido pela cotação de referência", () => {
    const pix = gerarDadosPix("ESC-TESTE01", 2050);
    expect(pix.valorBRL).toBe(11070);
    expect(pix.copiaECola).toContain("ESC-TESTE01");
  });
  it("recusa cartão corporativo vencido", () => {
    const erro = validarCartao(
      { numero: "4111 1111 1111 1111", nome: "Siderúrgica Horizonte", validade: "10/26", cvv: "123" },
      new Date("2026-11-22T12:00:00Z"),
    );
    expect(erro).toBe("Cartão vencido.");
  });
  it("aceita cartão corporativo válido", () => {
    const erro = validarCartao(
      { numero: "4111 1111 1111 1111", nome: "Siderúrgica Horizonte", validade: "12/28", cvv: "123" },
      new Date("2026-11-22T12:00:00Z"),
    );
    expect(erro).toBeNull();
  });
});

describe("Enquadramento contábil automático", () => {
  const { subtotal, taxa, total } = calcularResumo(100, 20); // 2.000 + 50

  it("compensação debita Despesa Ambiental e credita Caixa / Escrow", () => {
    const l = gerarLancamentos({ finalidade: "compensacao", escopo: 1 }, subtotal, taxa, 100);
    expect(l[0]?.debito.nome).toBe("Despesa Ambiental / Sustentabilidade");
    expect(l[0]?.credito.nome).toBe("Caixa / Conta Garantia Escrow");
    expect(l[0]?.valor).toBe(2000);
  });
  it("carteira debita Estoque de Créditos de Carbono e credita Caixa / Escrow", () => {
    const l = gerarLancamentos({ finalidade: "carteira" }, subtotal, taxa, 100);
    expect(l[0]?.debito.nome).toBe("Ativo Circulante — Estoque de Créditos de Carbono");
    expect(l[0]?.credito.nome).toBe("Caixa / Conta Garantia Escrow");
  });
  it("inclui lançamento da taxa de 2,5% e fecha débitos = total pago", () => {
    for (const finalidade of ["compensacao", "carteira"] as const) {
      const l = gerarLancamentos({ finalidade }, subtotal, taxa, 100);
      expect(l[1]?.valor).toBe(50);
      expect(l.reduce((s, x) => s + x.valor, 0)).toBe(total);
    }
  });
});
