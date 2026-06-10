// ============================================================
// relatorios.js — Reports Tab UI Manager
// Financeiro Pessoal — Personal Finance Application
// ============================================================

(function () {
  'use strict';

  // ----------------------------------------------------------
  // Chart instances (for cleanup)
  // ----------------------------------------------------------

  var charts = {
    incomeExpenses: null,
    categoryBreakdown: null,
    monthlyExpenses: null,
    bankExpenses: null,
    paymentMethods: null,
    patrimonyEvolution: null,
    monthlySavings: null,
  };

  // ----------------------------------------------------------
  // Category Colors
  // ----------------------------------------------------------

  var CATEGORY_COLORS = {
    'Combustível': '#f59e0b',
    'Alimentação': '#ef4444',
    'Lazer': '#8b5cf6',
    'Compras': '#ec4899',
    'Assinaturas': '#6366f1',
    'Saúde': '#10b981',
    'Transporte': '#3b82f6',
    'Vestuário': '#f97316',
    'Manutenção Veicular': '#eab308',
    'Seguro Veicular': '#14b8a6',
    'Documentação Veicular': '#64748b',
    'Estacionamento': '#a855f7',
    'Pedágio': '#06b6d4',
    'Marketplace': '#d946ef',
    'Amazon': '#f97316',
    'Reserva': '#22c55e',
    'Consumo Pessoal': '#fb923c',
    'Diversos': '#94a3b8',
  };

  var BANK_COLORS = {
    'Itaú Principal': '#FF6B00',
    'Itaú Secundária': '#FF9500',
    'Nubank': '#8A05BE',
  };

  var PAYMENT_COLORS = {
    'Dinheiro': '#10b981',
    'Pix': '#06b6d4',
    'Cartão de Débito': '#3b82f6',
    'Cartão de Crédito': '#ef4444',
    'Transferência': '#8b5cf6',
  };

  var MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------

  function getColorForCategory(cat) {
    return CATEGORY_COLORS[cat] || '#' + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0');
  }

  function destroyChart(key) {
    if (charts[key]) {
      charts[key].destroy();
      charts[key] = null;
    }
  }

  function getFilterValues() {
    var monthEl = document.getElementById('report-month');
    var yearEl = document.getElementById('report-year');
    var categoryEl = document.getElementById('report-category');
    var accountEl = document.getElementById('report-account');

    return {
      month: monthEl ? monthEl.value : '',
      year: yearEl ? parseInt(yearEl.value, 10) : new Date().getFullYear(),
      category: categoryEl ? categoryEl.value : '',
      account: accountEl ? accountEl.value : '',
    };
  }

  function getFilteredTransactions(filters) {
    var DM = window.DataManager;
    var allTx = DM.getTransactions();

    return allTx.filter(function (t) {
      // Year filter (always applied)
      var txYear = parseInt(t.date.split('-')[0], 10);
      if (txYear !== filters.year) return false;

      // Month filter
      if (filters.month !== '') {
        var txMonth = parseInt(t.date.split('-')[1], 10) - 1; // 0-indexed
        if (txMonth !== parseInt(filters.month, 10)) return false;
      }

      // Category filter
      if (filters.category && t.category !== filters.category) return false;

      // Account filter
      if (filters.account && t.account !== filters.account) return false;

      return true;
    });
  }

  // ----------------------------------------------------------
  // Init
  // ----------------------------------------------------------

  function init() {
    // Set default year
    var yearEl = document.getElementById('report-year');
    if (yearEl) yearEl.value = String(new Date().getFullYear());

    // Populate filter dropdowns
    populateFilterDropdowns();

    // Filter button
    var filterBtn = document.getElementById('btn-filter-reports');
    if (filterBtn) {
      filterBtn.addEventListener('click', applyFilters);
    }

    // Also apply filters on select change for immediate feedback
    ['report-month', 'report-year', 'report-category', 'report-account'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', applyFilters);
      }
    });

    render();
  }

  // ----------------------------------------------------------
  // Populate Filter Dropdowns
  // ----------------------------------------------------------

  function populateFilterDropdowns() {
    var DM = window.DataManager;
    var settings = DM.getSettings();

    // Category dropdown
    var categoryEl = document.getElementById('report-category');
    if (categoryEl) {
      // Preserve "Todas" option
      var currentVal = categoryEl.value;
      categoryEl.innerHTML = '<option value="">Todas as categorias</option>';
      var categories = (settings.expenseCategories || []).slice();
      categories.sort();
      categories.forEach(function (cat) {
        var opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        categoryEl.appendChild(opt);
      });
      categoryEl.value = currentVal;
    }

    // Account dropdown
    var accountEl = document.getElementById('report-account');
    if (accountEl) {
      var currentAccVal = accountEl.value;
      accountEl.innerHTML = '<option value="">Todas as contas</option>';
      var banks = settings.banks || [];
      banks.forEach(function (bank) {
        var opt = document.createElement('option');
        opt.value = bank;
        opt.textContent = bank;
        accountEl.appendChild(opt);
      });
      accountEl.value = currentAccVal;
    }
  }

  // ----------------------------------------------------------
  // Render All
  // ----------------------------------------------------------

  function render() {
    applyFilters();
  }

  // ----------------------------------------------------------
  // Apply Filters (renders all charts)
  // ----------------------------------------------------------

  function applyFilters() {
    renderIncomeExpenses();
    renderCategoryBreakdown();
    renderMonthlyExpenses();
    renderBankExpenses();
    renderPaymentMethods();
    renderPatrimonyEvolution();
    renderMonthlySavings();
  }

  // ----------------------------------------------------------
  // 1. Receitas x Despesas (Grouped Bar)
  // ----------------------------------------------------------

  function renderIncomeExpenses() {
    var canvas = document.getElementById('chart-income-expenses');
    if (!canvas || typeof Chart === 'undefined') return;

    destroyChart('incomeExpenses');

    var DM = window.DataManager;
    var filters = getFilterValues();

    var months = [];
    var incomeData = [];
    var expenseData = [];

    if (filters.month !== '') {
      // Single month
      var m = parseInt(filters.month, 10) + 1;
      var totals = DM.getMonthlyTotals(filters.year, m);
      months.push(MONTH_NAMES[m - 1]);
      incomeData.push(totals.income);
      expenseData.push(totals.expenses);
    } else {
      // All months — show months that have data, up to last 6
      for (var i = 1; i <= 12; i++) {
        var totals = DM.getMonthlyTotals(filters.year, i);
        if (totals.income > 0 || totals.expenses > 0) {
          months.push(MONTH_NAMES[i - 1].slice(0, 3));
          incomeData.push(totals.income);
          expenseData.push(totals.expenses);
        }
      }
    }

    if (months.length === 0) {
      months.push('—');
      incomeData.push(0);
      expenseData.push(0);
    }

    var ctx = canvas.getContext('2d');
    charts.incomeExpenses = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Receitas',
            data: incomeData,
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: '#10b981',
            borderWidth: 1,
            borderRadius: 6,
          },
          {
            label: 'Despesas',
            data: expenseData,
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            borderColor: '#ef4444',
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#ccc', font: { size: 12 } },
          },
          tooltip: {
            backgroundColor: 'rgba(30, 30, 46, 0.95)',
            titleColor: '#e0e0e0',
            bodyColor: '#e0e0e0',
            borderColor: '#333',
            borderWidth: 1,
            callbacks: {
              label: function (ctx) {
                return ctx.dataset.label + ': ' + DM.formatCurrency(ctx.parsed.y);
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#888', font: { size: 11 } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: {
              color: '#888',
              font: { size: 11 },
              callback: function (v) { return DM.formatCurrency(v); },
            },
          },
        },
      },
    });
  }

  // ----------------------------------------------------------
  // 2. Gastos por Categoria (Doughnut)
  // ----------------------------------------------------------

  function renderCategoryBreakdown() {
    var canvas = document.getElementById('chart-report-categories');
    if (!canvas || typeof Chart === 'undefined') return;

    destroyChart('categoryBreakdown');

    var DM = window.DataManager;
    var filters = getFilterValues();
    var transactions = getFilteredTransactions(filters);

    // Only expenses
    var categoryTotals = {};
    transactions.forEach(function (t) {
      if (t.type !== 'despesa') return;
      if (!categoryTotals[t.category]) categoryTotals[t.category] = 0;
      categoryTotals[t.category] += t.amount;
    });

    var labels = Object.keys(categoryTotals).sort(function (a, b) {
      return categoryTotals[b] - categoryTotals[a];
    });
    var data = labels.map(function (l) { return Math.round(categoryTotals[l] * 100) / 100; });
    var colors = labels.map(function (l) { return getColorForCategory(l); });

    if (labels.length === 0) {
      labels = ['Sem dados'];
      data = [1];
      colors = ['#333'];
    }

    var totalExpenses = data.reduce(function (s, v) { return s + v; }, 0);

    var ctx = canvas.getContext('2d');
    charts.categoryBreakdown = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: '#1a1a2e',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#ccc', font: { size: 11 }, padding: 12 },
          },
          tooltip: {
            backgroundColor: 'rgba(30, 30, 46, 0.95)',
            titleColor: '#e0e0e0',
            bodyColor: '#e0e0e0',
            borderColor: '#333',
            borderWidth: 1,
            callbacks: {
              label: function (ctx) {
                var pct = totalExpenses > 0 ? ((ctx.parsed / totalExpenses) * 100).toFixed(1) : 0;
                return ctx.label + ': ' + DM.formatCurrency(ctx.parsed) + ' (' + pct + '%)';
              },
            },
          },
        },
      },
    });
  }

  // ----------------------------------------------------------
  // 3. Gastos por Mês (Bar)
  // ----------------------------------------------------------

  function renderMonthlyExpenses() {
    var canvas = document.getElementById('chart-monthly-expenses');
    if (!canvas || typeof Chart === 'undefined') return;

    destroyChart('monthlyExpenses');

    var DM = window.DataManager;
    var filters = getFilterValues();

    var months = [];
    var expenseData = [];

    if (filters.month !== '') {
      var m = parseInt(filters.month, 10) + 1;
      var totals = DM.getMonthlyTotals(filters.year, m);
      months.push(MONTH_NAMES[m - 1]);
      expenseData.push(totals.expenses);
    } else {
      for (var i = 1; i <= 12; i++) {
        var totals = DM.getMonthlyTotals(filters.year, i);
        if (totals.expenses > 0) {
          months.push(MONTH_NAMES[i - 1].slice(0, 3));
          expenseData.push(totals.expenses);
        }
      }
    }

    if (months.length === 0) {
      months.push('—');
      expenseData.push(0);
    }

    var ctx = canvas.getContext('2d');
    charts.monthlyExpenses = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Despesas',
          data: expenseData,
          backgroundColor: 'rgba(249, 115, 22, 0.7)',
          borderColor: '#f97316',
          borderWidth: 1,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(30, 30, 46, 0.95)',
            titleColor: '#e0e0e0',
            bodyColor: '#e0e0e0',
            borderColor: '#333',
            borderWidth: 1,
            callbacks: {
              label: function (ctx) { return DM.formatCurrency(ctx.parsed.y); },
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#888', font: { size: 11 } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: {
              color: '#888',
              font: { size: 11 },
              callback: function (v) { return DM.formatCurrency(v); },
            },
          },
        },
      },
    });
  }

  // ----------------------------------------------------------
  // 4. Gastos por Banco (Doughnut)
  // ----------------------------------------------------------

  function renderBankExpenses() {
    var canvas = document.getElementById('chart-bank-expenses');
    if (!canvas || typeof Chart === 'undefined') return;

    destroyChart('bankExpenses');

    var DM = window.DataManager;
    var filters = getFilterValues();
    var transactions = getFilteredTransactions(filters);

    // Only expenses, group by account
    var accountTotals = {};
    transactions.forEach(function (t) {
      if (t.type !== 'despesa') return;
      if (!accountTotals[t.account]) accountTotals[t.account] = 0;
      accountTotals[t.account] += t.amount;
    });

    var labels = Object.keys(accountTotals).sort(function (a, b) {
      return accountTotals[b] - accountTotals[a];
    });
    var data = labels.map(function (l) { return Math.round(accountTotals[l] * 100) / 100; });
    var fallbackColors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#ec4899'];
    var colors = labels.map(function (l, i) {
      return BANK_COLORS[l] || fallbackColors[i % fallbackColors.length];
    });

    if (labels.length === 0) {
      labels = ['Sem dados'];
      data = [1];
      colors = ['#333'];
    }

    var totalExpenses = data.reduce(function (s, v) { return s + v; }, 0);

    var ctx = canvas.getContext('2d');
    charts.bankExpenses = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: '#1a1a2e',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#ccc', font: { size: 11 }, padding: 12 },
          },
          tooltip: {
            backgroundColor: 'rgba(30, 30, 46, 0.95)',
            titleColor: '#e0e0e0',
            bodyColor: '#e0e0e0',
            borderColor: '#333',
            borderWidth: 1,
            callbacks: {
              label: function (ctx) {
                var pct = totalExpenses > 0 ? ((ctx.parsed / totalExpenses) * 100).toFixed(1) : 0;
                return ctx.label + ': ' + DM.formatCurrency(ctx.parsed) + ' (' + pct + '%)';
              },
            },
          },
        },
      },
    });
  }

  // ----------------------------------------------------------
  // 5. Gastos por Forma de Pagamento (Doughnut)
  // ----------------------------------------------------------

  function renderPaymentMethods() {
    var canvas = document.getElementById('chart-payment-methods');
    if (!canvas || typeof Chart === 'undefined') return;

    destroyChart('paymentMethods');

    var DM = window.DataManager;
    var filters = getFilterValues();
    var transactions = getFilteredTransactions(filters);

    // Only expenses, group by payment method
    var methodTotals = {};
    transactions.forEach(function (t) {
      if (t.type !== 'despesa') return;
      var method = t.paymentMethod || 'Outro';
      if (!methodTotals[method]) methodTotals[method] = 0;
      methodTotals[method] += t.amount;
    });

    var labels = Object.keys(methodTotals).sort(function (a, b) {
      return methodTotals[b] - methodTotals[a];
    });
    var data = labels.map(function (l) { return Math.round(methodTotals[l] * 100) / 100; });
    var fallbackColors = ['#10b981', '#06b6d4', '#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b'];
    var colors = labels.map(function (l, i) {
      return PAYMENT_COLORS[l] || fallbackColors[i % fallbackColors.length];
    });

    if (labels.length === 0) {
      labels = ['Sem dados'];
      data = [1];
      colors = ['#333'];
    }

    var totalExpenses = data.reduce(function (s, v) { return s + v; }, 0);

    var ctx = canvas.getContext('2d');
    charts.paymentMethods = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: '#1a1a2e',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#ccc', font: { size: 11 }, padding: 12 },
          },
          tooltip: {
            backgroundColor: 'rgba(30, 30, 46, 0.95)',
            titleColor: '#e0e0e0',
            bodyColor: '#e0e0e0',
            borderColor: '#333',
            borderWidth: 1,
            callbacks: {
              label: function (ctx) {
                var pct = totalExpenses > 0 ? ((ctx.parsed / totalExpenses) * 100).toFixed(1) : 0;
                return ctx.label + ': ' + DM.formatCurrency(ctx.parsed) + ' (' + pct + '%)';
              },
            },
          },
        },
      },
    });
  }

  // ----------------------------------------------------------
  // 6. Evolução Patrimonial (Line)
  // ----------------------------------------------------------

  function renderPatrimonyEvolution() {
    var canvas = document.getElementById('chart-report-patrimony');
    if (!canvas || typeof Chart === 'undefined') return;

    destroyChart('patrimonyEvolution');

    var DM = window.DataManager;
    var history = DM.getPatrimonyHistory();

    var labels = history.map(function (h) { return DM.formatMonth(h.date + '-01'); });
    var data = history.map(function (h) { return h.amount; });

    if (labels.length === 0) {
      labels = ['—'];
      data = [0];
    }

    var ctx = canvas.getContext('2d');

    var gradient = ctx.createLinearGradient(0, 0, 0, canvas.height || 300);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');

    charts.patrimonyEvolution = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Patrimônio',
          data: data,
          borderColor: '#10b981',
          backgroundColor: gradient,
          borderWidth: 3,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(30, 30, 46, 0.95)',
            titleColor: '#e0e0e0',
            bodyColor: '#e0e0e0',
            borderColor: '#333',
            borderWidth: 1,
            displayColors: false,
            callbacks: {
              label: function (ctx) { return DM.formatCurrency(ctx.parsed.y); },
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#888', font: { size: 11 } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: {
              color: '#888',
              font: { size: 11 },
              callback: function (v) { return DM.formatCurrency(v); },
            },
          },
        },
      },
    });
  }

  // ----------------------------------------------------------
  // 7. Economia Mensal (Bar)
  // ----------------------------------------------------------

  function renderMonthlySavings() {
    var canvas = document.getElementById('chart-monthly-savings');
    if (!canvas || typeof Chart === 'undefined') return;

    destroyChart('monthlySavings');

    var DM = window.DataManager;
    var filters = getFilterValues();

    var months = [];
    var savingsData = [];
    var barColors = [];

    if (filters.month !== '') {
      var m = parseInt(filters.month, 10) + 1;
      var totals = DM.getMonthlyTotals(filters.year, m);
      months.push(MONTH_NAMES[m - 1]);
      savingsData.push(totals.savings);
      barColors.push(totals.savings >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)');
    } else {
      for (var i = 1; i <= 12; i++) {
        var totals = DM.getMonthlyTotals(filters.year, i);
        if (totals.income > 0 || totals.expenses > 0) {
          months.push(MONTH_NAMES[i - 1].slice(0, 3));
          savingsData.push(totals.savings);
          barColors.push(totals.savings >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)');
        }
      }
    }

    if (months.length === 0) {
      months.push('—');
      savingsData.push(0);
      barColors.push('#333');
    }

    var ctx = canvas.getContext('2d');
    charts.monthlySavings = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Economia',
          data: savingsData,
          backgroundColor: barColors,
          borderColor: barColors.map(function (c) {
            return c.replace('0.7', '1');
          }),
          borderWidth: 1,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(30, 30, 46, 0.95)',
            titleColor: '#e0e0e0',
            bodyColor: '#e0e0e0',
            borderColor: '#333',
            borderWidth: 1,
            callbacks: {
              label: function (ctx) {
                var val = ctx.parsed.y;
                var prefix = val >= 0 ? '+' : '';
                return prefix + DM.formatCurrency(val);
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#888', font: { size: 11 } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: {
              color: '#888',
              font: { size: 11 },
              callback: function (v) { return DM.formatCurrency(v); },
            },
          },
        },
      },
    });
  }

  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------

  window.ReportManager = {
    init: init,
    render: render,
    applyFilters: applyFilters,

    renderIncomeExpenses: renderIncomeExpenses,
    renderCategoryBreakdown: renderCategoryBreakdown,
    renderMonthlyExpenses: renderMonthlyExpenses,
    renderBankExpenses: renderBankExpenses,
    renderPaymentMethods: renderPaymentMethods,
    renderPatrimonyEvolution: renderPatrimonyEvolution,
    renderMonthlySavings: renderMonthlySavings,
  };
})();
