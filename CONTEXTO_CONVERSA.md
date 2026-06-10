# 🧠 Contexto e Memória de Desenvolvimento — FinControl

> **Para a nova IA**: Leia este arquivo na íntegra. Ele contém o perfil do usuário, a arquitetura do software, o histórico de alterações realizadas e o estado exato da aplicação para que você continue o desenvolvimento sem perda de contexto.

---

## 👤 Perfil do Usuário e Objetivos
- **Cargo/Renda**: Estagiário com renda média de R$ 1.550/mês + renda extra aos fins de semana (diárias variáveis de ~R$ 250).
- **Reservas**: R$ 5.280 investidos em uma "caixinha de rendimento".
- **Objetivo Principal**: Acumular patrimônio, ter dinheiro líquido para oportunidades e gastos imprevistos.
- **Objetivo de Consumo**: Comprar um Volkswagen Up TSI futuramente (sem pressa ou data fixa).
- **Situação Pessoal**: Mora com os pais (baixos gastos fixos).
- **Necessidade**: Um fluxo muito fluido para registrar gastos pelo celular, com uma interface bonita, profissional e com gráficos avançados para análise no computador.

---

## 🛠️ Arquitetura do Sistema (FinControl v2)
O sistema foi desenhado para contornar a limitação de não termos um banco de dados tradicional. A arquitetura final é:

```
📱 Celular ──➔ Google Sheets App (Planilha "FinControl", aba "📱 Rápido")
                        ↕
              Google Sheets (Dados consolidados em abas)
                        ↕
              Google Apps Script (Publicado como Web App / API REST)
                        ↕
💻 PC ──────➔ Site FinControl (Interface Dark Premium, gráficos via Chart.js)
```

- **Sincronização**: O site consome dados da API do Apps Script (via chamadas HTTP GET/POST).
- **Cache Local**: Para máxima velocidade, o site mantém os dados salvos em `localStorage`. Ao clicar em **🔄 Sincronizar**, ele faz a requisição para a API do Planilhas e atualiza o cache local.
- **Hospedagem**: O site é 100% estático (HTML+CSS+JS). Hospedável gratuitamente no GitHub Pages.

---

## 📂 Estrutura de Arquivos (ESTADO FINAL)

Tudo está localizado no diretório: `C:\Users\joao.leite\.gemini\antigravity\scratch\financeiro-pessoal\`

```
financeiro-pessoal/
├── index.html              # Interface única com todas as abas
├── COMO_CONTINUAR.md       # Guia passo-a-passo de configuração
├── CONTEXTO_CONVERSA.md    # Este arquivo (memória para nova conversa)
├── css/
│   └── style.css           # Design system dark premium completo (~92KB)
├── google-apps-script/
│   └── Code.gs             # Backend Google Sheets (API + setup automático)
└── js/
    ├── app.js              # Controlador central: navegação, sync, init
    ├── data.js             # DataManager: CRUD local + API Google Sheets
    ├── charts.js           # ChartManager: factories Chart.js + tema dark
    ├── dashboard.js        # Dashboard: KPIs, gráficos, inteligência, projeções
    ├── lancamentos.js      # Quick entry + tabela de lançamentos
    ├── contas.js           # Gestão de contas bancárias
    ├── cartoes.js          # Gestão de cartões de crédito + parcelamentos
    ├── patrimonio.js       # Registro e evolução patrimonial
    ├── metas.js            # Metas financeiras com progresso
    ├── veiculo.js          # Custos veiculares (Up TSI)
    ├── relatorios.js       # 7 gráficos filtráveis de relatórios
    └── config.js           # Configurações: categorias, bancos, cartões
```

---

## ✅ Estado do Projeto: FINALIZADO

### O que funciona:
- **Dashboard completo**: 6 KPIs, gráfico de evolução patrimonial, gráfico de gastos por categoria, resumo de contas bancárias, inteligência financeira (8 indicadores), projeções de patrimônio (6/12/24 meses), alertas automáticos, últimos lançamentos.
- **Lançamento rápido**: Formulário otimizado para celular com tipo/categoria/valor/conta.
- **Tabela de lançamentos**: Filtros por tipo, categoria, conta, pesquisa por texto.
- **Contas bancárias**: CRUD de contas com saldo calculado.
- **Cartões de crédito**: Gestão de cartões e parcelamentos.
- **Patrimônio**: Registro mensal de snapshots.
- **Metas**: Barras de progresso com prazo e aporte mensal sugerido.
- **Veículo**: Custos de combustível, manutenção, documentação.
- **Relatórios**: 7 gráficos filtráveis (receitas x despesas, categoria, mensal, banco, pagamento, patrimônio, economia).
- **Configurações**: Categorias, bancos, cartões, renda fixa.
- **Sincronização Google Sheets**: Botão no Dashboard + seção nas Configurações.
- **Design premium**: Dark theme, glassmorphism, animações, responsivo.

### Bugs corrigidos:
1. **Loop infinito de gráficos**: Removido listener de `resize` em `app.js`, adicionadas centenas de linhas CSS com `.chart-card`, `.dashboard-charts`, `.reports-grid`, `.stats-grid`, `.accounts-summary`, `.stat-card`, `.alert-badge`, `.kpi-trend`, `.transaction-item-*`, `.empty-state` — todas classes referenciadas no HTML/JS mas que NUNCA foram definidas no CSS. Containers sem altura causavam Chart.js crescer infinitamente.
2. **ChartManager.init()**: Adicionado método `init()` no-op para evitar warning no console.
3. **Rendering guard**: `_rendering` flag no `app.js` para impedir re-renderizações simultâneas.

---

## 🔧 O que falta para rodar:
1. **Criar planilha no Google Sheets** (seguir COMO_CONTINUAR.md)
2. **Instalar Apps Script** (colar Code.gs e executar configurarPlanilha)
3. **Publicar como Web App** (copiar URL da API)
4. **Conectar no site** (Configurações → colar URL → Conectar)
5. **Hospedar no GitHub Pages** (para acesso via celular)

---

## 📝 TEXTO PARA COLAR NA NOVA CONVERSA:

```text
Olá! Estou continuando o desenvolvimento do meu projeto "FinControl".

Por favor, leia os arquivos de contexto na pasta do projeto:
- CONTEXTO_CONVERSA.md (estado completo do projeto e perfil do usuário)
- COMO_CONTINUAR.md (guia de configuração)

Diretório do projeto:
C:\Users\joao.leite\.gemini\antigravity\scratch\financeiro-pessoal\

Após ler, me dê um resumo do estado atual e pergunte como posso ajudá-lo.
```
