# ATMOSFERA — Marketplace P2P e Auditoria Inteligente de Créditos de Carbono

## O Problema
Após a COP 31 e a regulamentação do Artigo 6.2, o mercado global de créditos de carbono enfrenta um gargalo crítico de liquidez, transparência e segurança contábil. Produtores e projetos ambientais têm dificuldade para acessar compradores diretamente, enquanto empresas compradoras enfrentam o risco de fraude por dupla contagem e insegurança na contabilização (IFRS S2).

## A Solução
O **ATMOSFERA** é uma plataforma P2P (ponto a ponto) que conecta diretamente vendedores e compradores de créditos de carbono, mantendo uma experiência simples e intuitiva para o cliente na frente enquanto executa auditorias rigorosas nos bastidores:
- **Cadastro e Oferta P2P:** Vendedores cadastram lotes com localização, safra, quantidade (tCO2e), preço e código/link da certificadora (Verra, Gold Standard).
- **Auditoria Automatizada com Firecrawl e Guardrails:** Um Agente Extrator consulta registros públicos na internet via Firecrawl, enquanto Guardrails e regras Regex validam padrões normativos e bloqueiam dupla contagem, atribuindo um Selo de Integridade (0 a 100).
- **Assistente Orquestrador de Compras:** Interpreta a meta de compensação do comprador e monta a melhor combinação de lotes auditados.
- **Liquidação Segura e Contabilidade IFRS S2:** Conta com trava de revisão humana (*Human-in-the-Loop*), liquidação em conta garantia (*Escrow*) e emissão instantânea de Certificado de Compensação.

## Como Executar o Projeto
1. Clone este repositório: `git clone https://github.com`
2. Instale as dependências: `npm install`
3. Inicie o servidor local: `npm run dev`
