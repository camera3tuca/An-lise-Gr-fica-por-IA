# 💳 Plano de Monetização — Chart AI Plus

Documento de planejamento. Descreve **como transformar o app em um produto pago
por assinatura**, sem ainda implementar. Serve de guia para as fases futuras.

> Resumo: modelo **freemium** — recursos gratuitos que não custam nada de IA,
> e recursos **Premium** (análise por IA e envio de gráfico) liberados só para
> assinantes. Um **backend** guarda a chave da IA e verifica a assinatura antes
> de liberar o conteúdo pago.

---

## 1. Objetivo

- Gerar receita recorrente cobrindo o **custo variável da IA** (Claude) e gerando lucro.
- Proteger a `ANTHROPIC_API_KEY` (nunca embarcada no app/cliente).
- Preparar a base para publicação **web** e depois **Google Play Store**.

---

## 2. Modelo de negócio: Freemium

| Recurso | Grátis | Premium |
|---|:---:|:---:|
| Gráfico de candlestick + indicadores | ✅ | ✅ |
| Smart Insights (tendência, volatilidade, volume, sentimento) | ✅ | ✅ |
| Sinais de swing + stop/alvo (ATR) | ✅ | ✅ |
| Detecção de padrões e suporte/resistência | ✅ | ✅ |
| Top Gainers & Losers | ✅ | ✅ |
| News & Sentiments | ✅ | ✅ |
| **Análise avançada por IA (texto)** | 🔒 (ex.: 3 grátis/mês) | ✅ ilimitado* |
| **Enviar gráfico para análise (visão)** | 🔒 | ✅ |
| Idiomas da análise | 🔒 (só PT) | ✅ todos |
| Watchlist, alertas (roadmap) | 🔒 | ✅ |

\* "Ilimitado" com um **limite justo** por usuário (ver seção 6) para evitar abuso.

**Racional:** os recursos gratuitos usam apenas yfinance/RSS (custo ~zero) e
servem de **isca**; os recursos pagos são os que têm **custo por uso** (IA).
Assim a assinatura paga a IA e ainda dá margem.

---

## 3. Planos e preços (sugestão inicial)

Valores a validar com mercado; o custo de IA por análise é de ~US$ 0,01–0,02.

| Plano | Preço sugerido | Inclui |
|---|---|---|
| **Grátis** | R$ 0 | Tudo do gráfico + 3 análises de IA/mês |
| **Premium Mensal** | ~R$ 19,90/mês | IA ilimitada (limite justo), envio de gráfico, todos os idiomas |
| **Premium Anual** | ~R$ 199/ano (2 meses grátis) | Igual, mais barato no total |
| **Teste grátis** | 7 dias ou 3 análises | Converter novos usuários |

> Regra de ouro: **preço da assinatura > custo médio de IA por usuário/mês**.
> Com limite justo (ex.: 100 análises/mês), o custo máximo de IA por usuário
> fica em torno de US$ 1–2 (~R$ 5–11), bem abaixo da mensalidade.

---

## 4. Meios de pagamento

| Plataforma | Meio de pagamento | Taxa aproximada |
|---|---|---|
| **Web** | Stripe, Mercado Pago, Hotmart/Kiwify (Pix, cartão, boleto) | ~2–4% + tarifa de Pix |
| **App Android (Play Store)** | **Google Play Billing (obrigatório p/ conteúdo digital)** | 15% (primeiro US$ 1M/ano) a 30% |

**Estratégia para reduzir taxa:** vender a assinatura **no site** (Stripe/Pix) e
permitir que o usuário apenas **faça login** no app. É prática comum e permitida,
desde que o app não force um fluxo de pagamento externo proibido pela política do
Google. Avaliar a política vigente antes de publicar.

---

## 5. Arquitetura técnica

```
┌────────────┐     login/JWT      ┌─────────────────────┐     verifica       ┌──────────┐
│  Cliente   │ ─────────────────▶ │   Backend (API)     │ ─── assinatura ──▶ │  Banco   │
│ (web/app)  │ ◀───────────────── │  FastAPI + auth     │                    │ (Postgres│
└────────────┘   conteúdo/erro    │  guarda a API key   │ ── chama Claude ─▶ │  users)  │
                                   └─────────────────────┘   (só se pago)     └──────────┘
                                            ▲  webhook de pagamento (Stripe/Play)
                                   ┌─────────────────────┐
                                   │  Provedor de pgto   │
                                   └─────────────────────┘
```

### Componentes
1. **Autenticação:** e-mail/senha (hash com bcrypt) e/ou login Google (OAuth/OIDC).
2. **Backend (FastAPI):** expõe endpoints de análise; **só executa a IA se o
   usuário estiver com assinatura ativa**; guarda a `ANTHROPIC_API_KEY`.
3. **Banco de dados:** usuários, assinaturas, uso mensal (para o limite justo).
4. **Webhook de pagamento:** o provedor avisa o backend quando a assinatura é
   criada/renovada/cancelada; o backend atualiza `assinatura_ativa` e `validade`.
5. **Front-end:** o app/site apenas mostra "Premium" ou "Assine para desbloquear"
   conforme a resposta do backend. **Nunca** decide o acesso sozinho.

### Esboço de esquema do banco
```
usuarios(id, email, senha_hash, criado_em)
assinaturas(id, usuario_id, plano, status, inicio, validade, provedor, ref_externa)
uso_ia(id, usuario_id, competencia_mes, qtd_analises)
```

### Regras de acesso (pseudo)
```python
def pode_usar_ia(usuario) -> bool:
    if assinatura_ativa(usuario):
        return dentro_do_limite_justo(usuario)   # ex.: < 100/mês
    return analises_gratis_restantes(usuario) > 0  # ex.: 3/mês no plano grátis
```

---

## 6. Controle de custo da IA

- **Limite justo** por assinante (ex.: 100 análises/mês) — evita um usuário
  sozinho consumir muito crédito.
- **Cache** de respostas por ativo/período (já existe no app hoje).
- **Rate limiting** por usuário (ex.: X análises por minuto).
- Escolha de modelo por plano: **Sonnet 5** no Premium; opção **Haiku 4.5** (mais
  barato) para reduzir custo, se necessário.
- **Monitorar** o custo real via `usage` da API e o painel de Billing da Anthropic;
  definir **teto mensal** de gastos na conta.

---

## 7. Roadmap de implementação (fases)

**Fase 1 — Base de contas e trava (sem cobrar ainda)**
- [ ] Login (e-mail/senha) + banco de usuários.
- [ ] Tabela de assinaturas (com um "modo teste" que marca alguém como Premium manualmente).
- [ ] Trava: recursos de IA só para Premium; contador de análises grátis.

**Fase 2 — Backend com a chave protegida**
- [ ] Mover as chamadas de IA para um backend (FastAPI) que guarda a `ANTHROPIC_API_KEY`.
- [ ] Endpoints: `/analise-texto`, `/analise-imagem` — checam assinatura antes de rodar.
- [ ] Rate limiting + limite justo + registro de uso.

**Fase 3 — Pagamento real (web)**
- [ ] Integrar Stripe (ou Mercado Pago) com **Checkout** + **webhook**.
- [ ] Teste grátis e fluxo de cancelamento/renovação.
- [ ] Tela de "Minha assinatura".

**Fase 4 — App e Play Store**
- [ ] Empacotar (PWA/TWA ou app nativo) — ver `MOBILE.md` (a criar).
- [ ] Login no app apontando para o mesmo backend.
- [ ] Se vender assinatura dentro do app: **Google Play Billing** + verificação do
      token de compra na Google Play Developer API.

---

## 8. Considerações legais e de política

- **Disclaimer:** manter visível "conteúdo educativo, não é recomendação de
  investimento" (já presente no app). Importante para apps financeiros.
- **LGPD:** política de privacidade, consentimento, e opção de exclusão de conta/dados.
- **Termos de uso** e **política de assinatura** (renovação automática, reembolso).
- **Play Store:** formulário de Data Safety, classificação de conteúdo, regras para
  apps financeiros e para pagamentos digitais (Play Billing).
- **Segurança:** senhas com hash, HTTPS, segredos só no backend, logs sem dados sensíveis.

---

## 9. Métricas para acompanhar

- **Conversão** (grátis → Premium), **churn** (cancelamentos), **MRR** (receita recorrente).
- **Custo de IA por usuário** vs. mensalidade (margem).
- Uso por recurso (quais telas engajam mais).

---

## 10. Resumo executivo

1. Modelo **freemium**: grátis o que não custa IA; **Premium** a IA.
2. **Backend** guarda a chave e verifica assinatura — segurança e controle de custo.
3. **Web** com Stripe/Pix (taxa baixa); **Play Store** com Play Billing (taxa maior)
   ou login de assinatura vendida no site.
4. Implementar por **fases**: contas+trava → backend → pagamento → app.

_Documento de planejamento. Nada aqui é recomendação de investimento._
