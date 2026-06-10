// ============================================================
// contas.js — Account Manager (Contas Bancárias Tab)
// Financeiro Pessoal — Personal Finance Application
// ============================================================

(function () {
  'use strict';

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

  // Store chart instances so we can destroy before re-creating
  var chartInstances = {};

  // ----------------------------------------------------------
  // Populate Helpers
  // ----------------------------------------------------------

  function populateTransferSelects() {
    var settings = window.DataManager.getSettings();
    var banks = settings.banks || [];
    var fromSelect = document.getElementById('transfer-from');
    var toSelect = document.getElementById('transfer-to');

    [fromSelect, toSelect].forEach(function (select) {
      if (!select) return;
      select.innerHTML = '';
      banks.forEach(function (bank) {
        var opt = document.createElement('option');
        opt.value = bank;
        opt.textContent = bank;
        select.appendChild(opt);
      });
    });

    // Default "to" to second bank if available
    if (toSelect && banks.length > 1) {
      toSelect.value = banks[1];
    }
  }

  // ----------------------------------------------------------
  // Account Cards
  // ----------------------------------------------------------

  function renderAccountCards() {
    var accounts = window.DataManager.getAccounts();

    accounts.forEach(function (account) {
      var slug = sanitizeName(account.name);
      var summary = window.DataManager.getAccountSummary(account.name);

      // Balance
      var balanceEl = document.getElementById('balance-' + slug);
      if (balanceEl) {
        balanceEl.textContent = window.DataManager.formatCurrency(summary.balance);
        // Color based on balance
        if (summary.balance < 0) {
          balanceEl.style.color = '#ef4444';
        } else {
          balanceEl.style.color = '';
        }
      }

      // Income
      var incomeEl = document.getElementById('income-' + slug);
      if (incomeEl) {
        incomeEl.textContent = window.DataManager.formatCurrency(summary.income);
      }

      // Expenses
      var expenseEl = document.getElementById('expense-' + slug);
      if (expenseEl) {
        expenseEl.textContent = window.DataManager.formatCurrency(summary.expenses);
      }

      // Transfers (filter by category "Transferência")
      var allTx = window.DataManager.getTransactions({ account: account.name, category: 'Transferência' });
      var transferTotal = 0;
      allTx.forEach(function (tx) {
        if (tx.type === 'receita') transferTotal += tx.amount;
        else transferTotal -= tx.amount;
      });
      var transferEl = document.getElementById('transfers-' + slug);
      if (transferEl) {
        transferEl.textContent = window.DataManager.formatCurrency(Math.abs(transferTotal));
      }

      // Mini chart
      var canvasId = 'chart-' + slug;
      renderAccountChart(account.name, canvasId);
    });
  }

  // ----------------------------------------------------------
  // Account Balance Evolution Chart
  // ----------------------------------------------------------

  function renderAccountChart(accountName, canvasId) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Destroy existing chart
    if (chartInstances[canvasId]) {
      chartInstances[canvasId].destroy();
      chartInstances[canvasId] = null;
    }

    // Build monthly balance evolution
    var account = window.DataManager.getAccounts().find(function (a) { return a.name === accountName; });
    if (!account) return;

    var allTx = window.DataManager.getTransactions({ account: accountName });
    // Sort by date ascending
    allTx.sort(function (a, b) { return a.date.localeCompare(b.date); });

    // Group by month
    var monthMap = {};
    allTx.forEach(function (tx) {
      var monthKey = tx.date.slice(0, 7); // YYYY-MM
      if (!monthMap[monthKey]) monthMap[monthKey] = { income: 0, expenses: 0 };
      if (tx.type === 'receita') monthMap[monthKey].income += tx.amount;
      else if (tx.type === 'despesa') monthMap[monthKey].expenses += tx.amount;
    });

    var months = Object.keys(monthMap).sort();
    if (months.length === 0) {
      // No data, show a flat line at initial balance
      months = [todayISO().slice(0, 7)];
      monthMap[months[0]] = { income: 0, expenses: 0 };
    }

    var labels = [];
    var data = [];
    var runningBalance = account.initialBalance;

    months.forEach(function (m) {
      var monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      var parts = m.split('-');
      var monthIdx = parseInt(parts[1], 10) - 1;
      labels.push(monthNames[monthIdx] + '/' + parts[0].slice(2));

      runningBalance += monthMap[m].income - monthMap[m].expenses;
      data.push(Math.round(runningBalance * 100) / 100);
    });

    var ctx = canvas.getContext('2d');
    var gradient = ctx.createLinearGradient(0, 0, 0, canvas.height || 150);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.02)');

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          borderColor: '#6366f1',
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#6366f1',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                return window.DataManager.formatCurrency(context.parsed.y);
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#888', font: { size: 10 } },
            grid: { display: false },
          },
          y: {
            ticks: {
              color: '#888',
              font: { size: 10 },
              callback: function (value) {
                return 'R$ ' + value.toLocaleString('pt-BR');
              },
            },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
        },
      },
    });
  }

  // ----------------------------------------------------------
  // Consolidation
  // ----------------------------------------------------------

  function renderConsolidation() {
    var container = document.getElementById('accounts-consolidation');
    if (!container) return;

    var accounts = window.DataManager.getAccounts();
    var totalBalance = 0;
    var breakdown = [];

    accounts.forEach(function (account) {
      var summary = window.DataManager.getAccountSummary(account.name);
      totalBalance += summary.balance;
      breakdown.push({
        name: account.name,
        balance: summary.balance,
        income: summary.income,
        expenses: summary.expenses,
      });
    });

    var html = '<div class="consolidation-total">' +
      '<span class="consolidation-label">Saldo Total Consolidado</span>' +
      '<span class="consolidation-value">' + window.DataManager.formatCurrency(totalBalance) + '</span>' +
    '</div>' +
    '<div class="consolidation-breakdown">';

    breakdown.forEach(function (item) {
      var percentage = totalBalance > 0 ? Math.round((item.balance / totalBalance) * 100) : 0;
      html += '<div class="consolidation-item">' +
        '<div class="consolidation-item-header">' +
          '<span class="consolidation-item-name">🏦 ' + esc(item.name) + '</span>' +
          '<span class="consolidation-item-value">' + window.DataManager.formatCurrency(item.balance) + '</span>' +
        '</div>' +
        '<div class="progress-bar">' +
          '<div class="progress-fill" style="width:' + Math.max(percentage, 0) + '%;background:#6366f1;"></div>' +
        '</div>' +
        '<span class="consolidation-item-percent">' + percentage + '% do total</span>' +
      '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
  }

  // ----------------------------------------------------------
  // Transfer Form
  // ----------------------------------------------------------

  function renderTransferForm() {
    populateTransferSelects();

    var dateInput = document.getElementById('transfer-date');
    if (dateInput && !dateInput.value) {
      dateInput.value = todayISO();
    }

    var form = document.getElementById('transfer-form');
    if (form) {
      // Remove previous listener to avoid duplication
      form.removeEventListener('submit', handleTransfer);
      form.addEventListener('submit', handleTransfer);
    }
  }

  function handleTransfer(e) {
    e.preventDefault();

    var fromSelect = document.getElementById('transfer-from');
    var toSelect = document.getElementById('transfer-to');
    var amountInput = document.getElementById('transfer-amount');
    var dateInput = document.getElementById('transfer-date');

    var fromAccount = fromSelect ? fromSelect.value : '';
    var toAccount = toSelect ? toSelect.value : '';
    var amount = amountInput ? parseFloat(amountInput.value) : 0;
    var date = dateInput ? dateInput.value : todayISO();

    if (!fromAccount || !toAccount) {
      showToast('Selecione as contas de origem e destino.', 'warning');
      return;
    }

    if (fromAccount === toAccount) {
      showToast('As contas de origem e destino devem ser diferentes.', 'warning');
      return;
    }

    if (!amount || amount <= 0) {
      showToast('Informe um valor válido.', 'warning');
      return;
    }

    // Create two transactions: expense from source, income to target
    var transferNote = 'Transferência: ' + fromAccount + ' → ' + toAccount;

    window.DataManager.addTransaction({
      date: date,
      type: 'despesa',
      category: 'Transferência',
      subcategory: '',
      amount: amount,
      paymentMethod: 'Transferência',
      account: fromAccount,
      notes: transferNote,
    });

    window.DataManager.addTransaction({
      date: date,
      type: 'receita',
      category: 'Transferência',
      subcategory: '',
      amount: amount,
      paymentMethod: 'Transferência',
      account: toAccount,
      notes: transferNote,
    });

    showToast('Transferência realizada!', 'success');

    // Clear amount
    if (amountInput) amountInput.value = '';

    // Re-render everything
    render();

    // Refresh transactions if available
    if (window.TransactionManager && window.TransactionManager._refreshTransactions) {
      window.TransactionManager._refreshTransactions();
    }
  }

  // ----------------------------------------------------------
  // Transfer History
  // ----------------------------------------------------------

  function renderTransfers() {
    var tbody = document.getElementById('transfers-body');
    if (!tbody) return;

    // Get all transfer transactions (category = "Transferência" and type = "despesa")
    // We show the expense side only to avoid duplicates
    var allTx = window.DataManager.getTransactions({ category: 'Transferência' });
    var expenseTransfers = allTx.filter(function (tx) { return tx.type === 'despesa'; });

    // Sort by date descending
    expenseTransfers.sort(function (a, b) {
      return b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    if (expenseTransfers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;padding:24px;">Nenhuma transferência registrada</td></tr>';
      return;
    }

    var html = '';
    expenseTransfers.forEach(function (tx) {
      // Parse "from → to" from notes
      var fromAccount = tx.account || '';
      var toAccount = '';
      if (tx.notes && tx.notes.indexOf('→') !== -1) {
        var parts = tx.notes.replace('Transferência: ', '').split(' → ');
        if (parts.length === 2) {
          fromAccount = parts[0].trim();
          toAccount = parts[1].trim();
        }
      }

      html += '<tr>' +
        '<td>' + window.DataManager.formatDate(tx.date) + '</td>' +
        '<td>' + esc(fromAccount) + '</td>' +
        '<td>' + esc(toAccount) + '</td>' +
        '<td>' + window.DataManager.formatCurrency(tx.amount) + '</td>' +
        '<td>' +
          '<button class="btn btn-sm btn-danger" onclick="AccountManager.deleteTransfer(\'' + tx.id + '\')" title="Excluir">🗑️</button>' +
        '</td>' +
      '</tr>';
    });

    tbody.innerHTML = html;
  }

  function deleteTransfer(id) {
    if (!confirm('Excluir esta transferência? Ambos os lançamentos (saída e entrada) serão removidos.')) return;

    // Find the matching income transaction (same notes, same amount, type=receita)
    var allTx = window.DataManager.getTransactions();
    var expenseTx = allTx.find(function (t) { return t.id === id; });

    if (expenseTx) {
      // Find the corresponding income transaction
      var matchingIncome = allTx.find(function (t) {
        return t.type === 'receita' &&
               t.category === 'Transferência' &&
               t.amount === expenseTx.amount &&
               t.date === expenseTx.date &&
               t.notes === expenseTx.notes &&
               t.id !== id;
      });

      window.DataManager.deleteTransaction(id);
      if (matchingIncome) {
        window.DataManager.deleteTransaction(matchingIncome.id);
      }
    }

    showToast('Transferência excluída!', 'success');
    render();

    if (window.TransactionManager && window.TransactionManager._refreshTransactions) {
      window.TransactionManager._refreshTransactions();
    }
  }

  // ----------------------------------------------------------
  // Render All
  // ----------------------------------------------------------

  function render() {
    renderAccountCards();
    renderConsolidation();
    renderTransferForm();
    renderTransfers();
  }

  // ----------------------------------------------------------
  // Init
  // ----------------------------------------------------------

  function init() {
    render();
  }

  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------

  window.AccountManager = {
    init: init,
    render: render,
    renderAccountCards: renderAccountCards,
    renderConsolidation: renderConsolidation,
    renderTransferForm: renderTransferForm,
    handleTransfer: handleTransfer,
    renderTransfers: renderTransfers,
    renderAccountChart: renderAccountChart,
    deleteTransfer: deleteTransfer,
  };
})();
