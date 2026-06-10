// ============================================================
// config.js — Configurações (Settings) Tab UI Manager
// Financeiro Pessoal — Personal Finance Application
// ============================================================

(function () {
  'use strict';

  // ----------------------------------------------------------
  // Internal Helpers
  // ----------------------------------------------------------

  function esc(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showToast(message, type) {
    type = type || 'success';
    var toast = document.createElement('div');
    toast.className = 'config-toast config-toast--' + type;
    toast.textContent = message;
    toast.style.cssText =
      'position:fixed;bottom:24px;right:24px;padding:12px 24px;border-radius:8px;' +
      'color:#fff;font-size:14px;font-weight:500;z-index:10000;opacity:0;' +
      'transition:opacity .3s ease;box-shadow:0 4px 12px rgba(0,0,0,.2);';
    var colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
    toast.style.background = colors[type] || colors.info;
    document.body.appendChild(toast);
    requestAnimationFrame(function () { toast.style.opacity = '1'; });
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 350);
    }, 2800);
  }

  function confirmDialog(title, message, onConfirm) {
    // Build modal overlay
    var overlay = document.createElement('div');
    overlay.className = 'config-confirm-overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;' +
      'align-items:center;justify-content:center;z-index:9999;';

    var box = document.createElement('div');
    box.className = 'config-confirm-box';
    box.style.cssText =
      'background:#1e1e2e;border:1px solid #333;border-radius:12px;padding:24px;' +
      'max-width:400px;width:90%;color:#e0e0e0;box-shadow:0 8px 32px rgba(0,0,0,.4);';

    box.innerHTML =
      '<h3 style="margin:0 0 8px;font-size:18px;color:#f0f0f0;">' + esc(title) + '</h3>' +
      '<p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#aaa;">' + esc(message) + '</p>' +
      '<div style="display:flex;gap:12px;justify-content:flex-end;">' +
        '<button class="config-btn-cancel" style="' +
          'padding:8px 20px;border-radius:8px;border:1px solid #555;' +
          'background:transparent;color:#ccc;cursor:pointer;font-size:14px;">Cancelar</button>' +
        '<button class="config-btn-confirm" style="' +
          'padding:8px 20px;border-radius:8px;border:none;' +
          'background:#ef4444;color:#fff;cursor:pointer;font-size:14px;font-weight:600;">Confirmar</button>' +
      '</div>';

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    var close = function () { overlay.remove(); };
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    box.querySelector('.config-btn-cancel').addEventListener('click', close);
    box.querySelector('.config-btn-confirm').addEventListener('click', function () {
      close();
      if (typeof onConfirm === 'function') onConfirm();
    });
  }

  // ----------------------------------------------------------
  // Render Helpers
  // ----------------------------------------------------------

  function createEditableList(title, items, options) {
    var onAdd = options.onAdd;
    var onRemove = options.onRemove;
    var icon = options.icon || '📋';
    var addPlaceholder = options.addPlaceholder || 'Novo item...';
    var removable = options.removable !== false;

    var section = document.createElement('div');
    section.className = 'config-section';
    section.style.cssText =
      'background:#1a1a2e;border:1px solid #2a2a3e;border-radius:12px;padding:20px;margin-bottom:16px;';

    var header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:12px;';
    header.innerHTML = '<span style="font-size:20px;">' + icon + '</span>' +
      '<h3 style="margin:0;font-size:16px;font-weight:600;color:#e0e0e0;">' + esc(title) + '</h3>' +
      '<span style="margin-left:auto;font-size:12px;color:#888;background:#2a2a3e;' +
      'padding:2px 8px;border-radius:10px;">' + items.length + '</span>';
    section.appendChild(header);

    var list = document.createElement('div');
    list.className = 'config-list';
    list.style.cssText = 'display:flex;flex-direction:column;gap:4px;margin-bottom:12px;';

    items.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'config-list-item';
      row.style.cssText =
        'display:flex;align-items:center;justify-content:space-between;' +
        'padding:8px 12px;background:#252540;border-radius:8px;transition:background .15s;';
      row.addEventListener('mouseenter', function () { row.style.background = '#2d2d4a'; });
      row.addEventListener('mouseleave', function () { row.style.background = '#252540'; });

      var label = document.createElement('span');
      label.style.cssText = 'font-size:14px;color:#d0d0d0;';
      label.textContent = item;
      row.appendChild(label);

      if (removable) {
        var btn = document.createElement('button');
        btn.style.cssText =
          'background:none;border:none;color:#ef4444;cursor:pointer;font-size:16px;' +
          'padding:2px 6px;border-radius:4px;opacity:.6;transition:opacity .15s;';
        btn.textContent = '✕';
        btn.title = 'Remover ' + item;
        btn.addEventListener('mouseenter', function () { btn.style.opacity = '1'; });
        btn.addEventListener('mouseleave', function () { btn.style.opacity = '.6'; });
        btn.addEventListener('click', function () {
          confirmDialog(
            'Remover item',
            'Tem certeza que deseja remover "' + item + '"?',
            function () { onRemove(item); }
          );
        });
        row.appendChild(btn);
      }

      list.appendChild(row);
    });

    section.appendChild(list);

    // Add input
    if (typeof onAdd === 'function') {
      var addRow = document.createElement('div');
      addRow.style.cssText = 'display:flex;gap:8px;';

      var input = document.createElement('input');
      input.type = 'text';
      input.placeholder = addPlaceholder;
      input.style.cssText =
        'flex:1;padding:8px 12px;border-radius:8px;border:1px solid #333;' +
        'background:#1e1e2e;color:#e0e0e0;font-size:14px;outline:none;' +
        'transition:border-color .15s;';
      input.addEventListener('focus', function () { input.style.borderColor = '#6366f1'; });
      input.addEventListener('blur', function () { input.style.borderColor = '#333'; });

      var addBtn = document.createElement('button');
      addBtn.style.cssText =
        'padding:8px 16px;border-radius:8px;border:none;background:#6366f1;' +
        'color:#fff;cursor:pointer;font-size:14px;font-weight:500;transition:background .15s;';
      addBtn.textContent = '+ Adicionar';
      addBtn.addEventListener('mouseenter', function () { addBtn.style.background = '#4f46e5'; });
      addBtn.addEventListener('mouseleave', function () { addBtn.style.background = '#6366f1'; });

      var doAdd = function () {
        var val = input.value.trim();
        if (val) {
          onAdd(val);
          input.value = '';
        }
      };

      addBtn.addEventListener('click', doAdd);
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') doAdd(); });

      addRow.appendChild(input);
      addRow.appendChild(addBtn);
      section.appendChild(addRow);
    }

    return section;
  }

  // ----------------------------------------------------------
  // ConfigManager
  // ----------------------------------------------------------

  function getContainer() {
    return document.getElementById('config-content') ||
           document.getElementById('settings-content') ||
           document.querySelector('[data-tab="configuracoes"]') ||
           document.querySelector('.tab-content.settings');
  }

  function renderSettings() {
    var container = getContainer();
    if (!container) {
      console.warn('[ConfigManager] Settings container not found.');
      return;
    }
    container.innerHTML = '';

    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'max-width:700px;margin:0 auto;padding:20px 0;';

    // Title
    var title = document.createElement('h2');
    title.style.cssText = 'margin:0 0 24px;font-size:24px;font-weight:700;color:#f0f0f0;';
    title.innerHTML = '⚙️ Configurações';
    wrapper.appendChild(title);

    // Category lists
    wrapper.appendChild(renderCategoryList('receita'));
    wrapper.appendChild(renderCategoryList('despesa'));
    wrapper.appendChild(renderBanksList());
    wrapper.appendChild(renderCardsList());
    wrapper.appendChild(renderPaymentMethodsList());
    wrapper.appendChild(renderIncomeSettings());
    wrapper.appendChild(renderExportSection());
    wrapper.appendChild(renderImportSection());
    wrapper.appendChild(renderResetSection());
    wrapper.appendChild(renderVersionInfo());

    container.appendChild(wrapper);
  }

  function renderCategoryList(type) {
    var settings = window.DataManager.getSettings();
    var key = type === 'receita' ? 'incomeCategories' : 'expenseCategories';
    var items = settings[key] || [];
    var titleStr = type === 'receita' ? 'Categorias de Receita' : 'Categorias de Despesa';
    var icon = type === 'receita' ? '💰' : '💸';

    return createEditableList(titleStr, items, {
      icon: icon,
      addPlaceholder: 'Nova categoria...',
      onAdd: function (val) { handleAddCategory(type, val); },
      onRemove: function (val) { handleRemoveCategory(type, val); },
    });
  }

  function renderBanksList() {
    var settings = window.DataManager.getSettings();
    var items = settings.banks || [];

    return createEditableList('Bancos / Contas', items, {
      icon: '🏦',
      addPlaceholder: 'Novo banco...',
      onAdd: function (val) {
        var s = window.DataManager.getSettings();
        if (s.banks.indexOf(val) !== -1) {
          showToast('Banco já existe!', 'warning');
          return;
        }
        s.banks.push(val);
        window.DataManager.updateSettings({ banks: s.banks });
        showToast('Banco adicionado: ' + val, 'success');
        renderSettings();
      },
      onRemove: function (val) {
        var s = window.DataManager.getSettings();
        s.banks = s.banks.filter(function (b) { return b !== val; });
        window.DataManager.updateSettings({ banks: s.banks });
        showToast('Banco removido: ' + val, 'success');
        renderSettings();
      },
    });
  }

  function renderCardsList() {
    var settings = window.DataManager.getSettings();
    var items = settings.cards || [];

    return createEditableList('Cartões', items, {
      icon: '💳',
      addPlaceholder: 'Novo cartão...',
      onAdd: function (val) {
        var s = window.DataManager.getSettings();
        if (s.cards.indexOf(val) !== -1) {
          showToast('Cartão já existe!', 'warning');
          return;
        }
        s.cards.push(val);
        window.DataManager.updateSettings({ cards: s.cards });
        showToast('Cartão adicionado: ' + val, 'success');
        renderSettings();
      },
      onRemove: function (val) {
        var s = window.DataManager.getSettings();
        s.cards = s.cards.filter(function (c) { return c !== val; });
        window.DataManager.updateSettings({ cards: s.cards });
        showToast('Cartão removido: ' + val, 'success');
        renderSettings();
      },
    });
  }

  function renderPaymentMethodsList() {
    var settings = window.DataManager.getSettings();
    var items = settings.paymentMethods || [];

    return createEditableList('Métodos de Pagamento', items, {
      icon: '🔄',
      addPlaceholder: 'Novo método...',
      onAdd: function (val) {
        var s = window.DataManager.getSettings();
        if (s.paymentMethods.indexOf(val) !== -1) {
          showToast('Método já existe!', 'warning');
          return;
        }
        s.paymentMethods.push(val);
        window.DataManager.updateSettings({ paymentMethods: s.paymentMethods });
        showToast('Método adicionado: ' + val, 'success');
        renderSettings();
      },
      onRemove: function (val) {
        var s = window.DataManager.getSettings();
        s.paymentMethods = s.paymentMethods.filter(function (m) { return m !== val; });
        window.DataManager.updateSettings({ paymentMethods: s.paymentMethods });
        showToast('Método removido: ' + val, 'success');
        renderSettings();
      },
    });
  }

  function renderIncomeSettings() {
    var settings = window.DataManager.getSettings();

    var section = document.createElement('div');
    section.className = 'config-section';
    section.style.cssText =
      'background:#1a1a2e;border:1px solid #2a2a3e;border-radius:12px;padding:20px;margin-bottom:16px;';

    section.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">' +
        '<span style="font-size:20px;">📊</span>' +
        '<h3 style="margin:0;font-size:16px;font-weight:600;color:#e0e0e0;">Renda Mensal Base</h3>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div>' +
          '<label style="display:block;font-size:12px;color:#888;margin-bottom:4px;">Renda Principal (Estágio)</label>' +
          '<input id="config-monthly-income" type="number" value="' + (settings.monthlyIncome || 0) + '" ' +
            'style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #333;' +
            'background:#1e1e2e;color:#e0e0e0;font-size:14px;outline:none;box-sizing:border-box;" />' +
        '</div>' +
        '<div>' +
          '<label style="display:block;font-size:12px;color:#888;margin-bottom:4px;">Renda Extra Média (FDS)</label>' +
          '<input id="config-extra-income" type="number" value="' + (settings.extraIncome || 0) + '" ' +
            'style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #333;' +
            'background:#1e1e2e;color:#e0e0e0;font-size:14px;outline:none;box-sizing:border-box;" />' +
        '</div>' +
      '</div>' +
      '<button id="config-save-income" style="' +
        'margin-top:12px;padding:8px 20px;border-radius:8px;border:none;' +
        'background:#10b981;color:#fff;cursor:pointer;font-size:14px;font-weight:500;' +
        'transition:background .15s;">Salvar Renda</button>';

    // Attach listener after insertion
    setTimeout(function () {
      var btn = document.getElementById('config-save-income');
      if (btn) {
        btn.addEventListener('click', function () {
          var monthly = parseFloat(document.getElementById('config-monthly-income').value) || 0;
          var extra = parseFloat(document.getElementById('config-extra-income').value) || 0;
          window.DataManager.updateSettings({ monthlyIncome: monthly, extraIncome: extra });
          showToast('Renda atualizada!', 'success');
        });
      }
    }, 0);

    return section;
  }

  // ----------------------------------------------------------
  // Export Section
  // ----------------------------------------------------------

  function renderExportSection() {
    var section = document.createElement('div');
    section.className = 'config-section';
    section.style.cssText =
      'background:#1a1a2e;border:1px solid #2a2a3e;border-radius:12px;padding:20px;margin-bottom:16px;';

    section.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">' +
        '<span style="font-size:20px;">📤</span>' +
        '<h3 style="margin:0;font-size:16px;font-weight:600;color:#e0e0e0;">Exportar Dados</h3>' +
      '</div>' +
      '<p style="margin:0 0 12px;font-size:13px;color:#888;line-height:1.5;">' +
        'Exporte seus dados para backup ou análise em planilhas. O CSV usa ponto-e-vírgula como separador (compatível com Excel brasileiro).' +
      '</p>' +
      '<div style="display:flex;gap:12px;">' +
        '<button id="config-export-csv" style="' +
          'padding:10px 24px;border-radius:8px;border:1px solid #3b82f6;' +
          'background:transparent;color:#3b82f6;cursor:pointer;font-size:14px;' +
          'font-weight:500;transition:all .15s;display:flex;align-items:center;gap:6px;">' +
          '📊 Exportar CSV</button>' +
        '<button id="config-export-json" style="' +
          'padding:10px 24px;border-radius:8px;border:1px solid #8b5cf6;' +
          'background:transparent;color:#8b5cf6;cursor:pointer;font-size:14px;' +
          'font-weight:500;transition:all .15s;display:flex;align-items:center;gap:6px;">' +
          '💾 Exportar JSON</button>' +
      '</div>';

    setTimeout(function () {
      var csvBtn = document.getElementById('config-export-csv');
      var jsonBtn = document.getElementById('config-export-json');
      if (csvBtn) csvBtn.addEventListener('click', handleExportCSV);
      if (jsonBtn) jsonBtn.addEventListener('click', handleExportJSON);
    }, 0);

    return section;
  }

  // ----------------------------------------------------------
  // Import Section
  // ----------------------------------------------------------

  function renderImportSection() {
    var section = document.createElement('div');
    section.className = 'config-section';
    section.style.cssText =
      'background:#1a1a2e;border:1px solid #2a2a3e;border-radius:12px;padding:20px;margin-bottom:16px;';

    section.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">' +
        '<span style="font-size:20px;">📥</span>' +
        '<h3 style="margin:0;font-size:16px;font-weight:600;color:#e0e0e0;">Importar Dados</h3>' +
      '</div>' +
      '<p style="margin:0 0 12px;font-size:13px;color:#888;line-height:1.5;">' +
        'Importe um arquivo JSON previamente exportado. <strong style="color:#ef4444;">Atenção: isso substituirá TODOS os seus dados atuais.</strong>' +
      '</p>' +
      '<div style="display:flex;align-items:center;gap:12px;">' +
        '<label for="config-import-file" style="' +
          'padding:10px 24px;border-radius:8px;border:1px dashed #555;' +
          'background:#252540;color:#ccc;cursor:pointer;font-size:14px;' +
          'transition:all .15s;display:flex;align-items:center;gap:6px;">' +
          '📁 Selecionar arquivo JSON' +
        '</label>' +
        '<input type="file" id="config-import-file" accept=".json" style="display:none;" />' +
        '<span id="config-import-filename" style="font-size:13px;color:#666;"></span>' +
      '</div>';

    setTimeout(function () {
      var fileInput = document.getElementById('config-import-file');
      var filenameSpan = document.getElementById('config-import-filename');
      if (fileInput) {
        fileInput.addEventListener('change', function () {
          if (fileInput.files.length > 0) {
            filenameSpan.textContent = fileInput.files[0].name;
            handleImportJSON(fileInput.files[0]);
          }
        });
      }
    }, 0);

    return section;
  }

  // ----------------------------------------------------------
  // Reset Section
  // ----------------------------------------------------------

  function renderResetSection() {
    var section = document.createElement('div');
    section.className = 'config-section';
    section.style.cssText =
      'background:#1a1a2e;border:1px solid #3a1a1a;border-radius:12px;padding:20px;margin-bottom:16px;';

    section.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">' +
        '<span style="font-size:20px;">🗑️</span>' +
        '<h3 style="margin:0;font-size:16px;font-weight:600;color:#ef4444;">Zona de Perigo</h3>' +
      '</div>' +
      '<p style="margin:0 0 16px;font-size:13px;color:#888;line-height:1.5;">' +
        'Apagar todos os dados e restaurar para os valores padrão com dados de exemplo. ' +
        '<strong style="color:#ef4444;">Esta ação é irreversível!</strong>' +
      '</p>' +
      '<button id="config-reset-btn" style="' +
        'padding:12px 28px;border-radius:8px;border:2px solid #ef4444;' +
        'background:transparent;color:#ef4444;cursor:pointer;font-size:14px;' +
        'font-weight:600;transition:all .15s;">' +
        '🗑️ Resetar Todos os Dados</button>';

    setTimeout(function () {
      var resetBtn = document.getElementById('config-reset-btn');
      if (resetBtn) {
        resetBtn.addEventListener('mouseenter', function () {
          resetBtn.style.background = '#ef4444';
          resetBtn.style.color = '#fff';
        });
        resetBtn.addEventListener('mouseleave', function () {
          resetBtn.style.background = 'transparent';
          resetBtn.style.color = '#ef4444';
        });
        resetBtn.addEventListener('click', handleResetData);
      }
    }, 0);

    return section;
  }

  // ----------------------------------------------------------
  // Version Info
  // ----------------------------------------------------------

  function renderVersionInfo() {
    var section = document.createElement('div');
    section.style.cssText =
      'text-align:center;padding:20px;color:#555;font-size:12px;';
    section.innerHTML =
      '<p style="margin:0 0 4px;">Financeiro Pessoal v1.0.0</p>' +
      '<p style="margin:0;">Desenvolvido com ❤️ para controle financeiro inteligente</p>' +
      '<p style="margin:4px 0 0;font-size:11px;color:#444;">' +
        'Dados armazenados localmente no navegador (localStorage)' +
      '</p>';
    return section;
  }

  // ----------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------

  function handleAddCategory(type, value) {
    if (!value || !value.trim()) {
      showToast('Digite o nome da categoria.', 'warning');
      return;
    }
    var success = window.DataManager.addCategory(type, value.trim());
    if (success) {
      showToast('Categoria adicionada: ' + value.trim(), 'success');
      renderSettings();
    } else {
      showToast('Essa categoria já existe!', 'warning');
    }
  }

  function handleRemoveCategory(type, category) {
    var success = window.DataManager.removeCategory(type, category);
    if (success) {
      showToast('Categoria removida: ' + category, 'success');
      renderSettings();
    } else {
      showToast('Erro ao remover categoria.', 'error');
    }
  }

  function handleExportCSV() {
    try {
      window.DataManager.exportToCSV();
      showToast('CSV exportado com sucesso!', 'success');
    } catch (e) {
      console.error('[ConfigManager] CSV export error:', e);
      showToast('Erro ao exportar CSV.', 'error');
    }
  }

  function handleExportJSON() {
    try {
      window.DataManager.exportToJSON();
      showToast('JSON exportado com sucesso!', 'success');
    } catch (e) {
      console.error('[ConfigManager] JSON export error:', e);
      showToast('Erro ao exportar JSON.', 'error');
    }
  }

  function handleImportJSON(file) {
    if (!file) {
      showToast('Selecione um arquivo para importar.', 'warning');
      return;
    }

    confirmDialog(
      'Importar dados',
      'Todos os seus dados atuais serão substituídos pelo conteúdo do arquivo "' +
        file.name + '". Tem certeza?',
      function () {
        var reader = new FileReader();
        reader.onload = function (e) {
          var result = window.DataManager.importFromJSON(e.target.result);
          if (result.success) {
            showToast('Dados importados! ' + result.transactionCount + ' transações carregadas.', 'success');
            renderSettings();
            // Trigger global refresh if available
            if (typeof window.refreshApp === 'function') window.refreshApp();
          } else {
            showToast('Erro na importação: ' + result.error, 'error');
          }
        };
        reader.onerror = function () {
          showToast('Erro ao ler o arquivo.', 'error');
        };
        reader.readAsText(file);
      }
    );
  }

  function handleResetData() {
    confirmDialog(
      '⚠️ Resetar TODOS os dados?',
      'Esta ação vai APAGAR permanentemente todos os seus dados e restaurar os dados de exemplo. Você perderá todas as transações, metas e configurações.',
      function () {
        // Double confirmation
        confirmDialog(
          '🔴 Última confirmação',
          'Tem ABSOLUTA CERTEZA? Não será possível recuperar seus dados após esta ação.',
          function () {
            window.DataManager.resetAllData();
            showToast('Todos os dados foram resetados.', 'info');
            renderSettings();
            if (typeof window.refreshApp === 'function') window.refreshApp();
          }
        );
      }
    );
  }

  function initConfig() {
    // Ensure DataManager is initialised
    if (window.DataManager && typeof window.DataManager.init === 'function') {
      window.DataManager.init();
    }
    renderSettings();
  }

  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------

  window.ConfigManager = {
    init: initConfig,
    renderSettings: renderSettings,
    renderCategoryList: renderCategoryList,
    renderBanksList: renderBanksList,
    renderCardsList: renderCardsList,
    handleAddCategory: handleAddCategory,
    handleRemoveCategory: handleRemoveCategory,
    handleExportCSV: handleExportCSV,
    handleExportJSON: handleExportJSON,
    handleImportJSON: handleImportJSON,
    handleResetData: handleResetData,
  };
})();
