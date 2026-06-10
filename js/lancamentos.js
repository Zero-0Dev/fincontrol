// ============================================================
// lancamentos.js — Transaction Manager (Quick Entry + Transactions)
// Financeiro Pessoal — Personal Finance Application
// ============================================================

(function () {
  'use strict';

  // ----------------------------------------------------------
  // Internal State
  // ----------------------------------------------------------

  var currentQuickType = 'despesa';
  var currentTransType = 'despesa';
  var editingTransactionId = null;

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------

  function esc(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function showToast(message, type) {
    type = type || 'success';
    var container = document.getElementById('toast-container');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function () { toast.classList.add('toast-show'); }, 10);
    setTimeout(function () {
      toast.classList.remove('toast-show');
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function sanitizeName(name) {
    return (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  // Map from the HTML option values to actual bank names in DataManager
  function accountValueToName(val) {
    var settings = window.DataManager.getSettings();
    var banks = settings.banks || [];
    // Try exact match first
    for (var i = 0; i < banks.length; i++) {
      if (sanitizeName(banks[i]) === val || banks[i] === val) {
        return banks[i];
      }
    }
    return val;
  }

  function accountNameToValue(name) {
    return sanitizeName(name);
  }

  // ----------------------------------------------------------
  // Populate Helpers
  // ----------------------------------------------------------

  function populateAccountSelect(selectEl) {
    if (!selectEl) return;
    var settings = window.DataManager.getSettings();
    var banks = settings.banks || [];
    selectEl.innerHTML = '';
    banks.forEach(function (bank) {
      var opt = document.createElement('option');
      opt.value = bank;
      opt.textContent = bank;
      selectEl.appendChild(opt);
    });
  }

  function populatePaymentSelect(selectEl) {
    if (!selectEl) return;
    var settings = window.DataManager.getSettings();
    var methods = settings.paymentMethods || [];
    selectEl.innerHTML = '';
    methods.forEach(function (method) {
      var opt = document.createElement('option');
      opt.value = method;
      opt.textContent = method;
      selectEl.appendChild(opt);
    });
  }

  function getCategoriesForType(type) {
    var settings = window.DataManager.getSettings();
    if (type === 'receita') {
      return settings.incomeCategories || [];
    }
    return (settings.expenseCategories || []).concat(['Transferência']);
  }

  function getSubcategoriesForCategory(category) {
    var settings = window.DataManager.getSettings();
    var subs = settings.subcategories || {};
    return subs[category] || [];
  }

  // ============================================================
  // QUICK ENTRY
  // ============================================================

  function initQuickEntry() {
    var form = document.getElementById('quick-entry-form');
    var dateInput = document.getElementById('quick-date');
    var toggleContainer = document.getElementById('quick-type-toggle');

    // Default date to today
    if (dateInput) {
      dateInput.value = todayISO();
    }

    // Populate account dropdown from settings
    populateAccountSelect(document.getElementById('quick-account'));

    // Populate categories for default type
    populateQuickCategories();

    // Toggle buttons
    if (toggleContainer) {
      var buttons = toggleContainer.querySelectorAll('.toggle-btn');
      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          buttons.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          currentQuickType = btn.getAttribute('data-value');
          populateQuickCategories();
        });
      });
    }

    // Form submit
    if (form) {
      form.addEventListener('submit', handleQuickSubmit);
    }

    // Render recent
    renderQuickRecent();
  }

  function populateQuickCategories() {
    var select = document.getElementById('quick-category');
    if (!select) return;
    var categories = getCategoriesForType(currentQuickType);
    select.innerHTML = '';
    categories.forEach(function (cat) {
      var opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });
  }

  function handleQuickSubmit(e) {
    e.preventDefault();

    var dateInput = document.getElementById('quick-date');
    var categoryInput = document.getElementById('quick-category');
    var amountInput = document.getElementById('quick-amount');
    var accountInput = document.getElementById('quick-account');
    var notesInput = document.getElementById('quick-notes');

    var date = dateInput ? dateInput.value : todayISO();
    var category = categoryInput ? categoryInput.value : '';
    var amount = amountInput ? parseFloat(amountInput.value) : 0;
    var account = accountInput ? accountInput.value : '';
    var notes = notesInput ? notesInput.value.trim() : '';

    if (!date || !category || !amount || amount <= 0) {
      showToast('Preencha todos os campos obrigatórios.', 'warning');
      return;
    }

    var transaction = {
      date: date,
      type: currentQuickType,
      category: category,
      subcategory: '',
      amount: amount,
      paymentMethod: currentQuickType === 'receita' ? 'Transferência' : 'Pix',
      account: account,
      notes: notes,
    };

    window.DataManager.addTransaction(transaction);
    showToast('Lançamento registrado! ✓', 'success');

    // Clear form but keep date and account
    if (amountInput) amountInput.value = '';
    if (notesInput) notesInput.value = '';

    renderQuickRecent();

    // Refresh other tabs if they exist
    if (window.TransactionManager && window.TransactionManager._refreshTransactions) {
      window.TransactionManager._refreshTransactions();
    }
  }

  function renderQuickRecent() {
    var container = document.getElementById('quick-recent-list');
    if (!container) return;

    var allTx = window.DataManager.getTransactions();
    // Sort by createdAt descending, then take last 5
    allTx.sort(function (a, b) {
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    var recent = allTx.slice(0, 5);

    if (recent.length === 0) {
      container.innerHTML = '<p class="empty-state">Nenhum lançamento ainda</p>';
      return;
    }

    var html = '';
    recent.forEach(function (tx) {
      var isIncome = tx.type === 'receita';
      var colorClass = isIncome ? 'text-success' : 'text-danger';
      var sign = isIncome ? '+' : '-';
      html += '<div class="transaction-item">' +
        '<div class="transaction-info">' +
          '<span class="transaction-category">' + esc(tx.category) + '</span>' +
          '<span class="transaction-date">' + window.DataManager.formatDate(tx.date) +
            (tx.notes ? ' — ' + esc(tx.notes) : '') + '</span>' +
        '</div>' +
        '<div class="transaction-amount ' + colorClass + '">' +
          sign + ' ' + window.DataManager.formatCurrency(tx.amount) +
        '</div>' +
        '<button class="btn btn-sm btn-danger" onclick="TransactionManager.deleteQuickRecent(\'' + tx.id + '\')" title="Excluir">🗑️</button>' +
      '</div>';
    });

    container.innerHTML = html;
  }

  function deleteQuickRecent(id) {
    if (!confirm('Excluir este lançamento?')) return;
    window.DataManager.deleteTransaction(id);
    showToast('Lançamento excluído!', 'success');
    renderQuickRecent();
    renderTransactions();
  }

  // ============================================================
  // FULL TRANSACTIONS TAB
  // ============================================================

  function initTransactions() {
    var form = document.getElementById('transaction-form');
    var dateInput = document.getElementById('trans-date');
    var typeSelect = document.getElementById('trans-type');
    var categorySelect = document.getElementById('trans-category');

    // Default date to today
    if (dateInput) {
      dateInput.value = todayISO();
    }

    // Populate account dropdown from settings
    populateAccountSelect(document.getElementById('trans-account'));

    // Populate payment methods from settings
    populatePaymentSelect(document.getElementById('trans-payment'));

    // Populate filter dropdowns
    populateFilters();

    // Type change → update categories
    if (typeSelect) {
      typeSelect.addEventListener('change', function () {
        currentTransType = typeSelect.value;
        populateCategories();
        populateSubcategories();
      });
    }

    // Category change → update subcategories
    if (categorySelect) {
      categorySelect.addEventListener('change', function () {
        populateSubcategories();
      });
    }

    // Form submit
    if (form) {
      form.addEventListener('submit', handleTransactionSubmit);
    }

    // Filter listeners
    var filterIds = ['filter-month', 'filter-year', 'filter-type', 'filter-category', 'filter-account'];
    filterIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', applyFilters);
      }
    });

    // Set default filter values to current month/year
    var now = new Date();
    var filterMonth = document.getElementById('filter-month');
    var filterYear = document.getElementById('filter-year');
    if (filterMonth) filterMonth.value = String(now.getMonth());
    if (filterYear) filterYear.value = String(now.getFullYear());

    // Initial populate
    populateCategories();
    populateSubcategories();

    // Initial render
    renderTransactions();
  }

  function populateCategories() {
    var select = document.getElementById('trans-category');
    if (!select) return;
    var categories = getCategoriesForType(currentTransType);
    var currentVal = select.value;
    select.innerHTML = '';
    categories.forEach(function (cat) {
      var opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });
    // Restore value if it still exists
    if (categories.indexOf(currentVal) !== -1) {
      select.value = currentVal;
    }
    populateSubcategories();
  }

  function populateSubcategories() {
    var catSelect = document.getElementById('trans-category');
    var subSelect = document.getElementById('trans-subcategory');
    if (!subSelect) return;

    var category = catSelect ? catSelect.value : '';
    var subs = getSubcategoriesForCategory(category);

    subSelect.innerHTML = '<option value="">Nenhuma</option>';
    subs.forEach(function (sub) {
      var opt = document.createElement('option');
      opt.value = sub;
      opt.textContent = sub;
      subSelect.appendChild(opt);
    });
  }

  function populateFilters() {
    var settings = window.DataManager.getSettings();
    var allCategories = (settings.incomeCategories || [])
      .concat(settings.expenseCategories || [])
      .concat(['Transferência']);
    var banks = settings.banks || [];

    // Category filter
    var catFilter = document.getElementById('filter-category');
    if (catFilter) {
      // Keep the first "Todas" option
      catFilter.innerHTML = '<option value="">Todas as categorias</option>';
      allCategories.forEach(function (cat) {
        var opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        catFilter.appendChild(opt);
      });
    }

    // Account filter
    var accFilter = document.getElementById('filter-account');
    if (accFilter) {
      accFilter.innerHTML = '<option value="">Todas as contas</option>';
      banks.forEach(function (bank) {
        var opt = document.createElement('option');
        opt.value = bank;
        opt.textContent = bank;
        accFilter.appendChild(opt);
      });
    }
  }

  function handleTransactionSubmit(e) {
    e.preventDefault();

    var dateInput = document.getElementById('trans-date');
    var typeInput = document.getElementById('trans-type');
    var categoryInput = document.getElementById('trans-category');
    var subcategoryInput = document.getElementById('trans-subcategory');
    var amountInput = document.getElementById('trans-amount');
    var paymentInput = document.getElementById('trans-payment');
    var accountInput = document.getElementById('trans-account');
    var notesInput = document.getElementById('trans-notes');

    var date = dateInput ? dateInput.value : todayISO();
    var type = typeInput ? typeInput.value : 'despesa';
    var category = categoryInput ? categoryInput.value : '';
    var subcategory = subcategoryInput ? subcategoryInput.value : '';
    var amount = amountInput ? parseFloat(amountInput.value) : 0;
    var paymentMethod = paymentInput ? paymentInput.value : 'Pix';
    var account = accountInput ? accountInput.value : '';
    var notes = notesInput ? notesInput.value.trim() : '';

    if (!date || !category || !amount || amount <= 0) {
      showToast('Preencha todos os campos obrigatórios.', 'warning');
      return;
    }

    var txData = {
      date: date,
      type: type,
      category: category,
      subcategory: subcategory,
      amount: amount,
      paymentMethod: paymentMethod,
      account: account,
      notes: notes,
    };

    if (editingTransactionId) {
      window.DataManager.updateTransaction(editingTransactionId, txData);
      showToast('Lançamento atualizado! ✓', 'success');
      editingTransactionId = null;

      // Reset submit button text
      var submitBtn = document.querySelector('#transaction-form .btn-primary');
      if (submitBtn) submitBtn.textContent = 'Adicionar';

      // Collapse the form
      var details = document.querySelector('#transactions details.collapsible-form');
      if (details) details.removeAttribute('open');
    } else {
      window.DataManager.addTransaction(txData);
      showToast('Lançamento registrado! ✓', 'success');
    }

    // Clear form
    if (amountInput) amountInput.value = '';
    if (notesInput) notesInput.value = '';
    if (subcategoryInput) subcategoryInput.value = '';

    renderTransactions();
    renderQuickRecent();
  }

  function getFilteredTransactions() {
    var filterMonth = document.getElementById('filter-month');
    var filterYear = document.getElementById('filter-year');
    var filterType = document.getElementById('filter-type');
    var filterCategory = document.getElementById('filter-category');
    var filterAccount = document.getElementById('filter-account');

    var filters = {};

    var monthVal = filterMonth ? filterMonth.value : '';
    var yearVal = filterYear ? filterYear.value : '';

    if (monthVal !== '' && yearVal !== '') {
      filters.month = parseInt(monthVal, 10) + 1; // HTML uses 0-indexed, DataManager uses 1-indexed
      filters.year = parseInt(yearVal, 10);
    }

    var typeVal = filterType ? filterType.value : '';
    if (typeVal) filters.type = typeVal;

    var catVal = filterCategory ? filterCategory.value : '';
    if (catVal) filters.category = catVal;

    var accVal = filterAccount ? filterAccount.value : '';
    if (accVal) filters.account = accVal;

    return window.DataManager.getTransactions(filters);
  }

  function renderTransactions() {
    var tbody = document.getElementById('transactions-body');
    if (!tbody) return;

    var transactions = getFilteredTransactions();

    // Sort by date descending
    transactions.sort(function (a, b) {
      return b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    if (transactions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#888;padding:24px;">Nenhum lançamento encontrado</td></tr>';
      updateTotals(transactions);
      return;
    }

    var html = '';
    transactions.forEach(function (tx) {
      var isIncome = tx.type === 'receita';
      var badgeClass = isIncome ? 'receita' : 'despesa';
      var typeLabel = isIncome ? 'Receita' : 'Despesa';
      var amountClass = isIncome ? 'text-success' : 'text-danger';
      var categoryDisplay = tx.category + (tx.subcategory ? ' / ' + tx.subcategory : '');

      html += '<tr>' +
        '<td>' + window.DataManager.formatDate(tx.date) + '</td>' +
        '<td><span class="badge badge-' + badgeClass + '">' + typeLabel + '</span></td>' +
        '<td>' + esc(categoryDisplay) + '</td>' +
        '<td class="' + amountClass + '">' + window.DataManager.formatCurrency(tx.amount) + '</td>' +
        '<td>' + esc(tx.account || '') + '</td>' +
        '<td>' + esc(tx.paymentMethod || '') + '</td>' +
        '<td>' + esc(tx.notes || '') + '</td>' +
        '<td>' +
          '<button class="btn btn-sm btn-outline" onclick="TransactionManager.editTransaction(\'' + tx.id + '\')" title="Editar">✏️</button>' +
          '<button class="btn btn-sm btn-danger" onclick="TransactionManager.deleteTransaction(\'' + tx.id + '\')" title="Excluir">🗑️</button>' +
        '</td>' +
      '</tr>';
    });

    tbody.innerHTML = html;
    updateTotals(transactions);
  }

  function applyFilters() {
    renderTransactions();
  }

  function updateTotals(transactions) {
    if (!transactions) {
      transactions = getFilteredTransactions();
    }

    var countEl = document.getElementById('transactions-count');
    var totalEl = document.getElementById('transactions-total');

    var count = transactions.length;
    var total = 0;
    transactions.forEach(function (tx) {
      if (tx.type === 'receita') {
        total += tx.amount;
      } else {
        total -= tx.amount;
      }
    });

    if (countEl) {
      countEl.textContent = count + ' lançamento' + (count !== 1 ? 's' : '');
    }
    if (totalEl) {
      totalEl.textContent = 'Total: ' + window.DataManager.formatCurrency(total);
    }
  }

  function editTransaction(id) {
    var transactions = window.DataManager.getTransactions();
    var tx = null;
    for (var i = 0; i < transactions.length; i++) {
      if (transactions[i].id === id) {
        tx = transactions[i];
        break;
      }
    }
    if (!tx) {
      showToast('Lançamento não encontrado.', 'error');
      return;
    }

    editingTransactionId = id;

    // Open the collapsible form
    var details = document.querySelector('#transactions details.collapsible-form');
    if (details) details.setAttribute('open', '');

    // Fill form fields
    var dateInput = document.getElementById('trans-date');
    var typeInput = document.getElementById('trans-type');
    var categoryInput = document.getElementById('trans-category');
    var subcategoryInput = document.getElementById('trans-subcategory');
    var amountInput = document.getElementById('trans-amount');
    var paymentInput = document.getElementById('trans-payment');
    var accountInput = document.getElementById('trans-account');
    var notesInput = document.getElementById('trans-notes');

    if (dateInput) dateInput.value = tx.date;
    if (typeInput) {
      typeInput.value = tx.type;
      currentTransType = tx.type;
    }

    // Populate categories for this type, then set value
    populateCategories();
    if (categoryInput) categoryInput.value = tx.category;

    // Populate subcategories, then set value
    populateSubcategories();
    if (subcategoryInput) subcategoryInput.value = tx.subcategory || '';

    if (amountInput) amountInput.value = tx.amount;
    if (paymentInput) paymentInput.value = tx.paymentMethod || '';
    if (accountInput) accountInput.value = tx.account || '';
    if (notesInput) notesInput.value = tx.notes || '';

    // Change submit button text
    var submitBtn = document.querySelector('#transaction-form .btn-primary');
    if (submitBtn) submitBtn.textContent = 'Salvar Alterações';

    // Scroll to form
    if (details) {
      details.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function deleteTransaction(id) {
    if (!confirm('Tem certeza que deseja excluir este lançamento?')) return;

    var success = window.DataManager.deleteTransaction(id);
    if (success) {
      showToast('Lançamento excluído!', 'success');
      renderTransactions();
      renderQuickRecent();
    } else {
      showToast('Erro ao excluir lançamento.', 'error');
    }
  }

  // ============================================================
  // SHARED
  // ============================================================

  function toggleType(type) {
    // For quick entry
    var toggleContainer = document.getElementById('quick-type-toggle');
    if (toggleContainer) {
      var buttons = toggleContainer.querySelectorAll('.toggle-btn');
      buttons.forEach(function (btn) {
        if (btn.getAttribute('data-value') === type) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
    currentQuickType = type;
    populateQuickCategories();
  }

  // ============================================================
  // INIT
  // ============================================================

  function init() {
    initQuickEntry();
    initTransactions();
  }

  function _refreshTransactions() {
    renderTransactions();
    renderQuickRecent();
  }

  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------

  window.TransactionManager = {
    init: init,

    // Quick Entry
    initQuickEntry: initQuickEntry,
    handleQuickSubmit: handleQuickSubmit,
    renderQuickRecent: renderQuickRecent,
    populateQuickCategories: populateQuickCategories,
    deleteQuickRecent: deleteQuickRecent,

    // Full Transactions Tab
    initTransactions: initTransactions,
    handleTransactionSubmit: handleTransactionSubmit,
    renderTransactions: renderTransactions,
    applyFilters: applyFilters,
    editTransaction: editTransaction,
    deleteTransaction: deleteTransaction,
    updateTotals: updateTotals,
    populateCategories: populateCategories,
    populateSubcategories: populateSubcategories,
    populateFilters: populateFilters,

    // Shared
    toggleType: toggleType,

    // Internal refresh hook
    _refreshTransactions: _refreshTransactions,
  };
})();
