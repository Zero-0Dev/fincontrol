# 🚀 FinControl — Plano de Continuação e Guia de Uso

Este arquivo serve como um guia completo para você transferir o projeto **FinControl** para o seu computador pessoal, rodar o site, configurar a integração com a planilha do Google Sheets e acessar tudo a partir do celular.

---

## 📌 Estado Atual do Projeto

1. **Correção de Bugs (Gráficos)**: 
   - O bug dos gráficos carregando infinitamente e ocupando a tela inteira foi **totalmente resolvido**.
   - **O que causava o erro**: O Chart.js redimensionava os gráficos baseado no contêiner pai. Se o contêiner não possuísse uma altura fixa, o gráfico se expandia, o que acionava o evento de resize do navegador, recriando o gráfico indefinidamente.
   - **Como foi corrigido**: Removemos os ouvintes (`listeners`) redundantes de redimensionamento em `app.js` e adicionamos travas CSS rígidas no final de `css/style.css` para garantir que todos os elementos `<canvas>` tenham tamanho controlado.
2. **Git Push**: O comando `git` não pôde ser executado localmente porque a ferramenta Git não está instalada ou mapeada nas variáveis de ambiente deste terminal. Por isso, a continuação via arquivos na pasta do projeto é a melhor opção para você levar para casa.

---

## 💻 1. Como Abrir e Rodar o Site no seu Computador de Casa

Como o projeto é feito puramente de **HTML, CSS e JavaScript (Vanilla)**, não há necessidade de rodar processos pesados como `npm install` ou compilações.

### Opção A: Abertura Direta (Rápida)
1. Copie a pasta inteira `financeiro-pessoal` para o seu computador pessoal.
2. Dê um **duplo clique no arquivo `index.html`** para abrir o site no navegador.
   - *Nota*: Alguns navegadores modernos impõem restrições de segurança estritas para arquivos locais (`file://`), o que pode bloquear a sincronização com o Google Sheets. Se isso ocorrer, use a Opção B.

### Opção B: Servidor Local (Recomendada)
Para evitar problemas de permissões no navegador:
- **Se usa o VS Code**: Instale a extensão **Live Server**, abra a pasta `financeiro-pessoal` no VS Code, clique com o botão direito sobre o `index.html` e escolha **"Open with Live Server"**.
- **Se tem Python instalado**: Abra o terminal na pasta do projeto e rode `python -m http.server 8000`. Depois, acesse `http://localhost:8000` no seu navegador.

---

## ☁️ 2. Como Configurar o Google Sheets + Apps Script (Banco de Dados)

Siga estes passos simples para conectar a planilha e o site:

### Passo 1: Criar a Planilha
1. Acesse [sheets.google.com](https://sheets.google.com) e crie uma planilha em branco.
2. Nomeie como **FinControl**.

### Passo 2: Instalar o Código Apps Script
1. Na planilha, clique em **Extensões ➔ Apps Script**.
2. Apague todo o código que estiver no editor.
3. Abra o arquivo do projeto localizado em: `google-apps-script/Code.gs` e copie **todo** o seu conteúdo.
4. Cole o código no editor do Apps Script.
5. Clique em **Salvar (💾)**.
6. Na barra superior do editor, selecione a função **`configurarPlanilha`** e clique em **Executar (▶)**.
7. O Google solicitará **autorizações de segurança** (pois o script criará abas e regras na sua conta). Conceda todas as permissões (se aparecer um aviso de segurança, clique em *Avançado* e depois em *Acessar FinControl (não seguro)*).
8. Volte à planilha: todas as abas, cores, formatações e regras de dropdown foram criadas automaticamente!

### Passo 3: Publicar a API (Web App)
1. No editor do Apps Script, clique no botão azul **Implantar ➔ Nova implantação** (canto superior direito).
2. Clique no ícone de engrenagem e selecione **App da Web**.
3. Configure da seguinte forma:
   - **Descrição**: FinControl API
   - **Executar como**: Eu (seu e-mail)
   - **Quem pode acessar**: **Qualquer pessoa** *(Isso é necessário para que o site consiga se conectar a ela. Fique tranquilo, seus dados continuam seguros e na sua conta).*
4. Clique em **Implantar**.
5. **Copie a URL do App da Web** que será gerada (ela começa com `https://script.google.com/macros/s/...`).

### Passo 4: Conectar no Site
1. Abra o site no seu computador.
2. Vá na aba **⚙️ Configurações**.
3. Na seção **Google Sheets (Sincronização)**, cole a URL que você copiou.
4. Clique em **🔗 Conectar**.
5. Se aparecer a mensagem verde de sucesso, seus dados já estão sincronizados!

---

## 📱 3. Como Acessar o Site e Fazer Lançamentos pelo Celular

### Entrada de dados rápida (Planilha)
Para preencher os seus gastos no celular no dia a dia da forma mais fluida possível:
1. Instale o aplicativo **Google Planilhas** no seu celular.
2. Abra a planilha **FinControl**.
3. Vá para a aba **📱 Rápido**.
4. Esta aba foi criada especificamente com campos largos e dropdowns rápidos. Basta preencher: **Data, Tipo, Categoria, Valor e Conta**. Os dados serão compilados automaticamente.

### Visualização dos Gráficos (Site Hospedado)
Para acessar a interface premium direto do celular, a melhor opção é hospedar o site gratuitamente no **GitHub Pages**:
1. Crie uma conta gratuita no [GitHub](https://github.com).
2. Crie um novo repositório chamado `fincontrol` (marque como **Público**).
3. Envie todos os arquivos da pasta `financeiro-pessoal` para esse repositório.
4. No GitHub, entre em **Settings ➔ Pages**.
5. Em *Build and deployment*, escolha a branch **main** e a pasta **/ (root)**, e clique em **Save**.
6. Aguarde 2 minutos. O site estará online no endereço:
   `https://seu-usuario.github.io/fincontrol/`
7. Abra esse link no seu celular ou PC, configure sua URL de Sincronização nas Configurações, e clique no botão **🔄 Sincronizar** no Dashboard para carregar tudo instantaneamente!

---

## 📂 Estrutura de Arquivos do Projeto

Aqui está a organização dos arquivos caso você queira fazer ajustes no código:
- `index.html`: Toda a estrutura visual do painel, modais e formulários.
- `css/style.css`: Estilização dark premium, transições, responsividade e correções de layout.
- `google-apps-script/Code.gs`: Código backend que roda dentro do seu Google Drive.
- `js/`: Lógica JavaScript modularizada:
  - `app.js`: Lógica de controle geral e inicialização das abas.
  - `data.js`: Lógica de transição e chamadas HTTP de sincronização com a API do Planilhas.
  - `charts.js`: Configurações de cores e inicialização do Chart.js.
  - `dashboard.js`: Montagem dos gráficos e cálculo de estatísticas gerais.
  - Outros arquivos (`contas.js`, `cartoes.js`, `patrimonio.js`, etc.) gerenciam as interações específicas de cada aba do sistema.

Qualquer dúvida que surgir quando você estiver abrindo o projeto em casa, você poderá consultar este arquivo `COMO_CONTINUAR.md`. Boa sorte com a gestão do seu patrimônio e na conquista do seu Up TSI! 🚗💨
