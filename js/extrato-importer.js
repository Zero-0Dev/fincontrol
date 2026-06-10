/**
 * import-extratos.js — Script para importar extratos CSV do Nubank
 * Roda via: abra o index.html no navegador, abra o Console (F12) e cole este script
 * Ou inclua como <script> temporário no index.html
 */
(function() {
  'use strict';

  // ============================================================
  // CLASSIFICADOR AUTOMÁTICO DE TRANSAÇÕES
  // ============================================================
  var RULES = [
    // Transferências internas (Resgate/Aplicação RDB) - IGNORAR
    { pattern: /Resgate RDB/i, skip: true },
    { pattern: /Aplicação RDB/i, skip: true },

    // Alimentação
    { pattern: /KITCHEN CLUB|LANCHONETE/i, category: 'Alimentação', sub: 'Lanche' },
    { pattern: /JUA SUCOS/i, category: 'Alimentação', sub: 'Lanche' },
    { pattern: /MilenioPaes|PADARIA|PAES/i, category: 'Alimentação', sub: 'Lanche' },
    { pattern: /HIROTA|SUPERMERCADO|MERCADO|CONVENIENCIA|LOJAS DE CONVENIENCIA/i, category: 'Alimentação', sub: 'Supermercado' },
    { pattern: /AtlanticaBurguers|BURGER|HAMBURGUER|MCDONALDS/i, category: 'Alimentação', sub: 'Lanche' },
    { pattern: /KEETA DELIVERY|IFOOD|RAPPI|UBER EATS/i, category: 'Alimentação', sub: 'Delivery' },
    { pattern: /RESTAURANTE/i, category: 'Alimentação', sub: 'Restaurante' },

    // Combustível
    { pattern: /AUTO POSTO|POSTO|COMBUSTIVEL|SHELL|IPIRANGA|BR DISTRIBUIDORA/i, category: 'Combustível', sub: 'Gasolina' },

    // Estacionamento
    { pattern: /ESTACIONAMENTO|ESTAPAR|PARKING/i, category: 'Estacionamento', sub: '' },

    // Transporte
    { pattern: /UBER|99|TAXI|CABIFY/i, category: 'Transporte', sub: 'Uber' },

    // Marketplace
    { pattern: /PIX Marketplace|MERCADO PAGO/i, category: 'Marketplace', sub: '' },

    // Hookah/Tabacaria
    { pattern: /CLOUD HOOKAH|HOOKAH|TABACARIA/i, category: 'Lazer', sub: 'Outros' },

    // Pagamento de fatura/boleto
    { pattern: /Pagamento de fatura/i, category: 'Cartão de Crédito', sub: 'Fatura' },
    { pattern: /GPS ARRECADACAO/i, category: 'Diversos', sub: 'INSS/GPS' },
    { pattern: /FUNDACAO CESP/i, category: 'Diversos', sub: 'Previdência' },
    { pattern: /Pagamento de boleto.*NU PAGAMENTOS SA/i, category: 'Cartão de Crédito', sub: 'Fatura Nubank' },
    { pattern: /Pagamento de boleto/i, category: 'Diversos', sub: 'Boleto' },

    // Compras débito genérico
    { pattern: /Compra no débito/i, category: 'Compras', sub: 'Loja Física' },

    // Transferências para pessoas conhecidas - classificar como Diversos/Transferência
    { pattern: /Transferência.*Kaua da Silva/i, category: 'Diversos', sub: 'Transferência Pessoal' },
    { pattern: /Transferência.*Douglas Pompelli/i, category: 'Diversos', sub: 'Transferência Pessoal' },
    { pattern: /Transferência.*Isabel Fernandes/i, category: 'Diversos', sub: 'Transferência Pessoal' },
    { pattern: /Transferência.*Giovanna Pires/i, category: 'Diversos', sub: 'Transferência Pessoal' },
    { pattern: /Transferência.*Guilherme Macario/i, category: 'Diversos', sub: 'Transferência Pessoal' },
    { pattern: /Transferência.*KAITO KITAMURA/i, category: 'Diversos', sub: 'Transferência Pessoal' },
    { pattern: /Transferência.*Vinicius Goncalves/i, category: 'Diversos', sub: 'Transferência Pessoal' },
    { pattern: /Transferência.*HUGO PIRES/i, category: 'Diversos', sub: 'Transferência Pessoal' },

    // Receitas
    { pattern: /Transferência recebida.*VALTER DOS SANTOS/i, category: 'Trabalho de Final de Semana', sub: '', type: 'receita' },
    { pattern: /Transferência recebida.*JOAO VITOR PIRES LEITE/i, category: 'Estágio', sub: '', type: 'receita' },
    { pattern: /Transferência recebida.*KAITO KITAMURA/i, category: 'Reembolso', sub: '', type: 'receita' },
    { pattern: /Transferência Recebida.*Giovanna/i, category: 'Reembolso', sub: '', type: 'receita' },
    { pattern: /Transferência recebida/i, category: 'Outros', sub: '', type: 'receita' },
  ];

  function classify(description, valor) {
    for (var i = 0; i < RULES.length; i++) {
      var rule = RULES[i];
      if (rule.pattern.test(description)) {
        if (rule.skip) return null; // Ignorar (movimentação interna)
        return {
          type: rule.type || (valor < 0 ? 'despesa' : 'receita'),
          category: rule.category,
          subcategory: rule.sub || '',
        };
      }
    }
    // Fallback
    return {
      type: valor < 0 ? 'despesa' : 'receita',
      category: valor < 0 ? 'Diversos' : 'Outros',
      subcategory: '',
    };
  }

  // ============================================================
  // PARSER CSV NUBANK
  // ============================================================
  function parseNubankCSV(csvText) {
    var lines = csvText.trim().split('\n');
    var transactions = [];

    for (var i = 1; i < lines.length; i++) { // Skip header
      var line = lines[i].trim();
      if (!line) continue;

      // Format: Data,Valor,Identificador,Descrição
      var match = line.match(/^(\d{2}\/\d{2}\/\d{4}),([\-\d.]+),([^,]+),(.+)$/);
      if (!match) continue;

      var dateParts = match[1].split('/');
      var dateISO = dateParts[2] + '-' + dateParts[1] + '-' + dateParts[0];
      var valor = parseFloat(match[2]);
      var id = match[3];
      var descricao = match[4];

      var classification = classify(descricao, valor);
      if (!classification) continue; // Skip internal movements

      // Extract person/store name from description
      var notes = descricao;
      // Shorten notes
      if (notes.length > 80) {
        var dashIdx = notes.indexOf(' - ');
        if (dashIdx > 0) {
          var secondDash = notes.indexOf(' - ', dashIdx + 3);
          notes = secondDash > 0 ? notes.substring(0, secondDash) : notes.substring(0, 80);
        }
      }

      transactions.push({
        id: id,
        date: dateISO,
        type: classification.type,
        category: classification.category,
        subcategory: classification.subcategory,
        amount: Math.abs(valor),
        paymentMethod: 'Pix',
        account: 'Nubank',
        notes: notes,
        createdAt: new Date().toISOString(),
        source: 'extrato-nubank',
      });
    }

    return transactions;
  }

  // ============================================================
  // IMPORTAR DADOS NO DATAMANAGER
  // ============================================================
  function importTransactions(newTransactions) {
    var existing = DataManager.getTransactions();
    var existingIds = {};
    existing.forEach(function(t) { existingIds[t.id] = true; });

    var added = 0;
    var skipped = 0;

    newTransactions.forEach(function(tx) {
      if (existingIds[tx.id]) {
        skipped++;
        return;
      }
      existing.push(tx);
      added++;
    });

    // Save back
    localStorage.setItem('fincontrol_transactions', JSON.stringify(existing));
    return { added: added, skipped: skipped, total: newTransactions.length };
  }

  // ============================================================
  // EXPOSE GLOBAL
  // ============================================================
  window.ExtratoImporter = {
    parseNubankCSV: parseNubankCSV,
    classify: classify,
    importTransactions: importTransactions,
    
    // Convenience: import from file input
    importFromFile: function(file) {
      return new Promise(function(resolve) {
        var reader = new FileReader();
        reader.onload = function(e) {
          var transactions = parseNubankCSV(e.target.result);
          var result = importTransactions(transactions);
          resolve(result);
        };
        reader.readAsText(file);
      });
    },

    // Import from raw CSV text
    importFromText: function(csvText) {
      var transactions = parseNubankCSV(csvText);
      return importTransactions(transactions);
    }
  };

  console.log('✅ ExtratoImporter loaded. Use ExtratoImporter.importFromText(csvText) or the UI.');
})();
