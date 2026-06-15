/**
 * FinControl — Google Apps Script (API + Setup)
 * Cole este código em: Extensões → Apps Script
 * Execute "configurarPlanilha" uma vez, depois publique como Web App.
 */

// ============================================================
// CONFIGURAÇÃO INICIAL
// ============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('💰 FinControl')
    .addItem('Configurar Planilha', 'configurarPlanilha')
    .addToUi();
}

function configurarPlanilha() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  criarAbaLancamentos(ss);
  criarAbaLancamentoRapido(ss);
  criarAbaContas(ss);
  criarAbaParcelamentos(ss);
  criarAbaPatrimonio(ss);
  criarAbaMetas(ss);
  criarAbaVeiculo(ss);
  criarAbaConfig(ss);
  
  // Remove aba padrão se existir
  const sheet1 = ss.getSheetByName('Sheet1') || ss.getSheetByName('Página1');
  if (sheet1 && ss.getSheets().length > 1) {
    ss.deleteSheet(sheet1);
  }
  
  SpreadsheetApp.getUi().alert('✅ Planilha configurada com sucesso!\n\nAgora publique como Web App:\n1. Implantações → Nova implantação\n2. Tipo: App da Web\n3. Executar como: Eu\n4. Quem pode acessar: Qualquer pessoa\n5. Copie a URL gerada');
}

// ============================================================
// CRIAÇÃO DAS ABAS
// ============================================================

function criarAbaLancamentos(ss) {
  let sheet = ss.getSheetByName('Lançamentos');
  if (!sheet) sheet = ss.insertSheet('Lançamentos');
  
  sheet.clear();
  const headers = ['Data', 'Tipo', 'Categoria', 'Subcategoria', 'Valor', 'Forma de Pagamento', 'Conta', 'Observação'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Formatação header
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#1e293b').setFontColor('#f8fafc').setFontWeight('bold').setFontSize(11);
  sheet.setFrozenRows(1);
  
  // Larguras
  sheet.setColumnWidth(1, 110); // Data
  sheet.setColumnWidth(2, 90);  // Tipo
  sheet.setColumnWidth(3, 140); // Categoria
  sheet.setColumnWidth(4, 130); // Subcategoria
  sheet.setColumnWidth(5, 110); // Valor
  sheet.setColumnWidth(6, 150); // Pagamento
  sheet.setColumnWidth(7, 130); // Conta
  sheet.setColumnWidth(8, 200); // Obs
  
  // Validações
  const maxRows = 5000;
  
  // Tipo
  const tipoRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Receita', 'Despesa'], true).build();
  sheet.getRange(2, 2, maxRows, 1).setDataValidation(tipoRule);
  
  // Categorias (todas)
  const catList = [
    'Estágio', 'Trabalho de Final de Semana', 'Reembolso',
    'Combustível', 'Alimentação', 'Lazer', 'Compras', 'Assinaturas',
    'Saúde', 'Transporte', 'Vestuário', 'Manutenção Veicular',
    'Seguro Veicular', 'Documentação Veicular', 'Estacionamento',
    'Pedágio', 'Marketplace', 'Amazon', 'Reserva', 'Consumo Pessoal',
    'Diversos', 'Transferência', 'Outros'
  ];
  const catRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(catList, true).build();
  sheet.getRange(2, 3, maxRows, 1).setDataValidation(catRule);
  
  // Pagamento
  const pagList = ['Pix', 'Cartão de Débito', 'Cartão de Crédito', 'Dinheiro', 'Transferência', 'Boleto'];
  const pagRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(pagList, true).build();
  sheet.getRange(2, 6, maxRows, 1).setDataValidation(pagRule);
  
  // Conta
  const contaList = ['Itaú Principal', 'Itaú Secundária', 'Nubank'];
  const contaRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(contaList, true).build();
  sheet.getRange(2, 7, maxRows, 1).setDataValidation(contaRule);
  
  // Formato valor
  sheet.getRange(2, 5, maxRows, 1).setNumberFormat('R$ #.##0,00');
  
  // Formato data
  sheet.getRange(2, 1, maxRows, 1).setNumberFormat('dd/MM/yyyy');
  
  // Sem dados de exemplo — aba inicia vazia
  
  // Colorir receitas/despesas (formatação condicional)
  const tipoRange = sheet.getRange(2, 2, maxRows, 1);
  const ruleReceita = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Receita').setFontColor('#10b981').setBackground('#052e16').setRanges([tipoRange]).build();
  const ruleDespesa = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Despesa').setFontColor('#ef4444').setBackground('#450a0a').setRanges([tipoRange]).build();
  sheet.setConditionalFormatRules([ruleReceita, ruleDespesa]);
}

function criarAbaLancamentoRapido(ss) {
  let sheet = ss.getSheetByName('📱 Rápido');
  if (!sheet) sheet = ss.insertSheet('📱 Rápido');
  
  sheet.clear();
  
  // Layout otimizado para celular - poucos campos, grandes
  const headers = ['Data', 'Tipo', 'Categoria', 'Valor', 'Conta', 'Obs'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4f46e5').setFontColor('#ffffff').setFontWeight('bold').setFontSize(12);
  sheet.setFrozenRows(1);
  
  // Colunas largas para toque fácil
  sheet.setColumnWidth(1, 120);
  sheet.setColumnWidth(2, 100);
  sheet.setColumnWidth(3, 150);
  sheet.setColumnWidth(4, 120);
  sheet.setColumnWidth(5, 140);
  sheet.setColumnWidth(6, 180);
  
  // Altura das linhas maior (melhor para toque)
  sheet.setRowHeights(2, 100, 40);
  
  const maxRows = 2000;
  
  // Fonte maior para celular
  sheet.getRange(2, 1, maxRows, headers.length).setFontSize(13);
  
  // Validações
  const tipoRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Receita', 'Despesa'], true).build();
  sheet.getRange(2, 2, maxRows, 1).setDataValidation(tipoRule);
  
  const catList = [
    'Estágio', 'Trabalho de Final de Semana', 'Reembolso',
    'Combustível', 'Alimentação', 'Lazer', 'Compras', 'Assinaturas',
    'Saúde', 'Transporte', 'Vestuário', 'Marketplace', 'Amazon',
    'Consumo Pessoal', 'Diversos', 'Outros'
  ];
  const catRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(catList, true).build();
  sheet.getRange(2, 3, maxRows, 1).setDataValidation(catRule);
  
  const contaRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Itaú Principal', 'Itaú Secundária', 'Nubank'], true).build();
  sheet.getRange(2, 5, maxRows, 1).setDataValidation(contaRule);
  
  sheet.getRange(2, 4, maxRows, 1).setNumberFormat('R$ #.##0,00');
  sheet.getRange(2, 1, maxRows, 1).setNumberFormat('dd/MM/yyyy');
  
  // Instrução no topo
  sheet.insertRowBefore(1);
  sheet.getRange(1, 1, 1, 6).merge().setValue('📱 Preencha aqui pelo celular — dados vão automaticamente para Lançamentos')
    .setBackground('#312e81').setFontColor('#c7d2fe').setFontSize(11).setWrap(true);
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(2);
}

function criarAbaContas(ss) {
  let sheet = ss.getSheetByName('Contas');
  if (!sheet) sheet = ss.insertSheet('Contas');
  
  sheet.clear();
  const headers = ['Conta', 'Saldo Inicial', 'Tipo'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setBackground('#1e293b').setFontColor('#f8fafc').setFontWeight('bold');
  
  const data = [
    ['Itaú Principal', 1200, 'Corrente'],
    ['Itaú Secundária', 300, 'Corrente'],
    ['Nubank', 850, 'Corrente']
  ];
  sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  sheet.getRange(2, 2, data.length, 1).setNumberFormat('R$ #.##0,00');
  sheet.setFrozenRows(1);
}

function criarAbaParcelamentos(ss) {
  let sheet = ss.getSheetByName('Parcelamentos');
  if (!sheet) sheet = ss.insertSheet('Parcelamentos');
  
  sheet.clear();
  const headers = ['Descrição', 'Cartão', 'Valor Total', 'Parcelas', 'Parcela Atual', 'Valor Parcela', 'Data Início', 'Data Término', 'Categoria'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setBackground('#1e293b').setFontColor('#f8fafc').setFontWeight('bold');
  
  const cartaoRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Cartão Itaú', 'Cartão Nubank'], true).build();
  sheet.getRange(2, 2, 500, 1).setDataValidation(cartaoRule);
  
  // Sem dados de exemplo — aba inicia vazia
  
  sheet.getRange(2, 3, 500, 1).setNumberFormat('R$ #.##0,00');
  sheet.getRange(2, 6, 500, 1).setNumberFormat('R$ #.##0,00');
  sheet.getRange(2, 7, 500, 1).setNumberFormat('dd/MM/yyyy');
  sheet.getRange(2, 8, 500, 1).setNumberFormat('dd/MM/yyyy');
  sheet.setFrozenRows(1);
}

function criarAbaPatrimonio(ss) {
  let sheet = ss.getSheetByName('Patrimônio');
  if (!sheet) sheet = ss.insertSheet('Patrimônio');
  
  sheet.clear();
  const headers = ['Mês', 'Valor'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setBackground('#1e293b').setFontColor('#f8fafc').setFontWeight('bold');
  
  // Sem dados de exemplo — aba inicia vazia
  sheet.getRange(2, 2, 500, 1).setNumberFormat('R$ #.##0,00');
  sheet.setFrozenRows(1);
}

function criarAbaMetas(ss) {
  let sheet = ss.getSheetByName('Metas');
  if (!sheet) sheet = ss.insertSheet('Metas');
  
  sheet.clear();
  const headers = ['Nome', 'Meta', 'Atual', 'Prazo', 'Ícone', 'Cor'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setBackground('#1e293b').setFontColor('#f8fafc').setFontWeight('bold');
  
  // Sem dados de exemplo — aba inicia vazia
  sheet.getRange(2, 2, 500, 1).setNumberFormat('R$ #.##0,00');
  sheet.getRange(2, 3, 500, 1).setNumberFormat('R$ #.##0,00');
  
  const iconRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['🎯', '🚗', '💻', '🏠', '🎓', '✈️', '💰', '🛡️'], true).build();
  sheet.getRange(2, 5, 500, 1).setDataValidation(iconRule);
  sheet.setFrozenRows(1);
}

function criarAbaVeiculo(ss) {
  let sheet = ss.getSheetByName('Veículo');
  if (!sheet) sheet = ss.insertSheet('Veículo');
  
  sheet.clear();
  const headers = ['Data', 'Tipo', 'KM', 'Litros', 'R$/L', 'Total', 'Descrição'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setBackground('#1e293b').setFontColor('#f8fafc').setFontWeight('bold');
  
  const tipoRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Abastecimento', 'Manutenção', 'Seguro', 'IPVA', 'Licenciamento', 'Multa', 'Pneus', 'Outros'], true).build();
  sheet.getRange(2, 2, 500, 1).setDataValidation(tipoRule);
  
  sheet.getRange(2, 1, 500, 1).setNumberFormat('dd/MM/yyyy');
  sheet.getRange(2, 6, 500, 1).setNumberFormat('R$ #.##0,00');
  sheet.getRange(2, 5, 500, 1).setNumberFormat('R$ #,##0.00');
  sheet.setFrozenRows(1);
}

function criarAbaConfig(ss) {
  let sheet = ss.getSheetByName('Config');
  if (!sheet) sheet = ss.insertSheet('Config');
  
  sheet.clear();
  
  // Categorias de Receita
  sheet.getRange(1, 1).setValue('Categorias Receita').setFontWeight('bold').setBackground('#1e293b').setFontColor('#10b981');
  const catReceita = ['Estágio', 'Trabalho de Final de Semana', 'Reembolso', 'Outros'];
  catReceita.forEach((c, i) => sheet.getRange(i + 2, 1).setValue(c));
  
  // Categorias de Despesa
  sheet.getRange(1, 2).setValue('Categorias Despesa').setFontWeight('bold').setBackground('#1e293b').setFontColor('#ef4444');
  const catDespesa = [
    'Combustível', 'Alimentação', 'Lazer', 'Compras', 'Assinaturas',
    'Saúde', 'Transporte', 'Vestuário', 'Manutenção Veicular',
    'Seguro Veicular', 'Documentação Veicular', 'Estacionamento',
    'Pedágio', 'Marketplace', 'Amazon', 'Reserva', 'Consumo Pessoal', 'Diversos'
  ];
  catDespesa.forEach((c, i) => sheet.getRange(i + 2, 2).setValue(c));
  
  // Bancos
  sheet.getRange(1, 3).setValue('Bancos').setFontWeight('bold').setBackground('#1e293b').setFontColor('#6366f1');
  ['Itaú Principal', 'Itaú Secundária', 'Nubank'].forEach((c, i) => sheet.getRange(i + 2, 3).setValue(c));
  
  // Cartões
  sheet.getRange(1, 4).setValue('Cartões').setFontWeight('bold').setBackground('#1e293b').setFontColor('#f59e0b');
  ['Cartão Itaú', 'Cartão Nubank'].forEach((c, i) => sheet.getRange(i + 2, 4).setValue(c));
  
  // Pagamentos
  sheet.getRange(1, 5).setValue('Pagamentos').setFontWeight('bold').setBackground('#1e293b').setFontColor('#06b6d4');
  ['Pix', 'Cartão de Débito', 'Cartão de Crédito', 'Dinheiro', 'Transferência', 'Boleto'].forEach((c, i) => sheet.getRange(i + 2, 5).setValue(c));
  
  sheet.setColumnWidths(1, 5, 180);
  sheet.setFrozenRows(1);
}

// ============================================================
// TRIGGER: Copiar Lançamento Rápido → Lançamentos
// ============================================================

function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() !== '📱 Rápido') return;
  
  const row = e.range.getRow();
  if (row <= 2) return; // Headers
  
  // Verificar se a linha tem dados suficientes (Data + Tipo + Categoria + Valor)
  const data = sheet.getRange(row, 1, 1, 6).getValues()[0];
  const [dataVal, tipo, categoria, valor, conta, obs] = data;
  
  if (!dataVal || !tipo || !categoria || !valor) return;
  
  // Copiar para Lançamentos
  const lancSheet = e.source.getSheetByName('Lançamentos');
  if (!lancSheet) return;
  
  const lastRow = lancSheet.getLastRow() + 1;
  lancSheet.getRange(lastRow, 1, 1, 8).setValues([
    [dataVal, tipo, categoria, '', valor, 'Pix', conta || 'Nubank', obs || '']
  ]);
}

// ============================================================
// API — Web App Endpoints
// ============================================================

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'getAllData';
    let result;
    
    switch (action) {
      case 'getAllData':
        result = getAllData();
        break;
      case 'ping':
        result = { status: 'ok', timestamp: new Date().toISOString() };
        break;
      default:
        result = { error: 'Ação desconhecida: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    let result;
    
    switch (action) {
      case 'addTransaction':
        result = addTransaction(body.data);
        break;
      case 'addPatrimony':
        result = addPatrimony(body.data);
        break;
      case 'updateGoal':
        result = updateGoal(body.data);
        break;
      case 'addInstallment':
        result = addInstallment(body.data);
        break;
      case 'addVehicleLog':
        result = addVehicleLog(body.data);
        break;
      default:
        result = { error: 'Ação desconhecida: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// LEITURA DE DADOS
// ============================================================

function getAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  return {
    transactions: getSheetData(ss, 'Lançamentos'),
    accounts: getSheetData(ss, 'Contas'),
    installments: getSheetData(ss, 'Parcelamentos'),
    patrimony: getSheetData(ss, 'Patrimônio'),
    goals: getSheetData(ss, 'Metas'),
    vehicle: getSheetData(ss, 'Veículo'),
    config: getSheetData(ss, 'Config'),
    lastUpdated: new Date().toISOString()
  };
}

function getSheetData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Só header
  
  // Para a aba "📱 Rápido" e "Config", tratamento especial
  if (sheetName === 'Config') {
    return getConfigData(sheet, data);
  }
  
  const headers = data[0];
  // Pular primeira linha de instrução no "📱 Rápido"
  const startRow = (sheetName === '📱 Rápido') ? 2 : 1;
  const rows = [];
  
  for (let i = startRow; i < data.length; i++) {
    // Pular linhas completamente vazias
    if (data[i].every(cell => cell === '' || cell === null || cell === undefined)) continue;
    
    const row = {};
    headers.forEach((h, j) => {
      let val = data[i][j];
      // Converter datas para ISO string
      if (val instanceof Date) {
        val = val.toISOString().split('T')[0];
      }
      row[h] = val;
    });
    rows.push(row);
  }
  
  return rows;
}

function getConfigData(sheet, data) {
  const config = {};
  const headers = data[0];
  
  headers.forEach((header, colIndex) => {
    if (!header) return;
    const values = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][colIndex]) values.push(data[i][colIndex]);
    }
    config[header] = values;
  });
  
  return config;
}

// ============================================================
// ESCRITA DE DADOS
// ============================================================

function addTransaction(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Lançamentos');
  if (!sheet) return { error: 'Aba Lançamentos não encontrada' };
  
  const lastRow = sheet.getLastRow() + 1;
  sheet.getRange(lastRow, 1, 1, 8).setValues([[
    new Date(data.date),
    data.type,
    data.category,
    data.subcategory || '',
    data.amount,
    data.paymentMethod || 'Pix',
    data.account || 'Nubank',
    data.notes || ''
  ]]);
  
  return { success: true, row: lastRow };
}

function addPatrimony(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Patrimônio');
  if (!sheet) return { error: 'Aba Patrimônio não encontrada' };
  
  const lastRow = sheet.getLastRow() + 1;
  sheet.getRange(lastRow, 1, 1, 2).setValues([[data.date, data.amount]]);
  
  return { success: true };
}

function updateGoal(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Metas');
  if (!sheet) return { error: 'Aba Metas não encontrada' };
  
  // Encontrar meta pelo nome
  const allData = sheet.getDataRange().getValues();
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === data.name) {
      if (data.current !== undefined) sheet.getRange(i + 1, 3).setValue(data.current);
      if (data.target !== undefined) sheet.getRange(i + 1, 2).setValue(data.target);
      return { success: true };
    }
  }
  
  // Se não encontrou, adicionar nova
  const lastRow = sheet.getLastRow() + 1;
  sheet.getRange(lastRow, 1, 1, 6).setValues([[
    data.name, data.target || 0, data.current || 0, data.deadline || '', data.icon || '🎯', data.color || '#6366f1'
  ]]);
  
  return { success: true, action: 'created' };
}

function addInstallment(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Parcelamentos');
  if (!sheet) return { error: 'Aba Parcelamentos não encontrada' };
  
  const lastRow = sheet.getLastRow() + 1;
  sheet.getRange(lastRow, 1, 1, 9).setValues([[
    data.description,
    data.card,
    data.totalAmount,
    data.installmentCount,
    data.currentInstallment,
    data.installmentAmount,
    new Date(data.startDate),
    new Date(data.endDate),
    data.category || ''
  ]]);
  
  return { success: true };
}

function addVehicleLog(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Veículo');
  if (!sheet) return { error: 'Aba Veículo não encontrada' };
  
  const lastRow = sheet.getLastRow() + 1;
  sheet.getRange(lastRow, 1, 1, 7).setValues([[
    new Date(data.date),
    data.type,
    data.km || '',
    data.liters || '',
    data.pricePerLiter || '',
    data.total || '',
    data.description || ''
  ]]);
  
  return { success: true };
}
