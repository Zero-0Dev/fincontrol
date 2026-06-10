// ============================================================
// dashboard.js — Dashboard Tab Manager
// Financeiro Pessoal — Personal Finance Application
// ============================================================

(function () {
  'use strict';

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------

  var currentMonth;
  var currentYear;

  // ----------------------------------------------------------
  // Initialization
  // ----------------------------------------------------------

  function init() {
    var now = new Date();
    currentMonth = now.getMonth() + 1;
    currentYear = now.getFullYear();

    // Set month/year selectors to current date
    var monthSelect = document.getElementById('dashboard-month');
    var yearSelect = document.getElementById('dashboard-year');

    if (monthSelect) {
      monthSelect.value = String(currentMonth - 1); // select uses 0-indexed
      monthSelect.addEventListener('change', function () {
        currentMonth = parseInt(this.value, 10) + 1;
        render();
      });
    }

    if (yearSelect) {
      yearSelect.value = String(currentYear);
      yearSelect.addEventListener('change', function () {
        currentYear = parseInt(this.value, 10);
        render();
      });
    }

    render();
  }

  // ----------------------------------------------------------
  // Full Render
  // ----------------------------------------------------------

  function render() {
    try {
      renderKPIs();
      renderCharts();
      renderAccountsSummary();
      renderIntelligence();
      renderProjections();
      renderAlerts();
      renderRecentTransactions();
    } catch (e) {
      console.error('[DashboardManager] Render error:', e);
    }
  }

  // ----------------------------------------------------------
  // KPI Cards
  // ----------------------------------------------------------

  function renderKPIs() {
    var totals = DataManager.getMonthlyTotals(currentYear, currentMonth);
    var patrimony = DataManager.getCurrentPatrimony();

    // Patrimônio Total
    var patrimonioValue = document.getElementById('kpi-patrimonio-value');
    var patrimonioTrend = document.getElementById('kpi-patrimonio-trend');
    if (patrimonioValue) {
      patrimonioValue.textContent = DataManager.formatCurrency(patrimony);
    }
    if (patrimonioTrend) {
      var history = DataManager.getPatrimonyHistory();
      if (history.length >= 2) {
        var prev = history[history.length - 2].amount;
        var diff = patrimony - prev;
        var pct = prev > 0 ? ((diff / prev) * 100).toFixed(1) : '0.0';
        var arrow = diff >= 0 ? '↑' : '↓';
        var cls = diff >= 0 ? 'trend-up' : 'trend-down';
        patrimonioTrend.className = 'kpi-trend ' + cls;
        patrimonioTrend.innerHTML = '<span class="trend-arrow">' + arrow + '</span> ' + Math.abs(pct) + '% vs mês anterior';
      } else {
        patrimonioTrend.textContent = '';
      }
    }

    // Saldo Disponível
    var saldoValue = document.getElementById('kpi-saldo-value');
    if (saldoValue) {
      var accounts = DataManager.getAccounts();
      var totalBalance = 0;
      accounts.forEach(function (acc) {
        totalBalance += DataManager.getAccountBalance(acc.name);
      });
      saldoValue.textContent = DataManager.formatCurrency(totalBalance);
      saldoValue.className = 'kpi-value ' + (totalBalance >= 0 ? 'text-success' : 'text-danger');
    }

    // Recebido este mês
    var receitaValue = document.getElementById('kpi-receita-value');
    if (receitaValue) {
      receitaValue.textContent = DataManager.formatCurrency(totals.income);
      receitaValue.className = 'kpi-value text-success';
    }

    // Gasto este mês
    var despesaValue = document.getElementById('kpi-despesa-value');
    if (despesaValue) {
      despesaValue.textContent = DataManager.formatCurrency(totals.expenses);
      despesaValue.className = 'kpi-value text-danger';
    }

    // Economia do mês
    var economiaValue = document.getElementById('kpi-economia-value');
    var economiaPercent = document.getElementById('kpi-economia-percent');
    if (economiaValue) {
      economiaValue.textContent = DataManager.formatCurrency(totals.savings);
      economiaValue.className = 'kpi-value ' + (totals.savings >= 0 ? 'text-success' : 'text-danger');
    }
    if (economiaPercent) {
      if (totals.income > 0) {
        economiaPercent.textContent = totals.savingsRate.toFixed(1) + '% da renda';
        economiaPercent.className = 'kpi-trend ' + (totals.savings >= 0 ? 'trend-up' : 'trend-down');
      } else {
        economiaPercent.textContent = '';
      }
    }

    // % Economizado
    var percentualValue = document.getElementById('kpi-percentual-value');
    var percentualIndicator = document.getElementById('kpi-percentual-indicator');
    if (percentualValue) {
      percentualValue.textContent = totals.savingsRate.toFixed(1) + '%';

      // Color indicator
      if (totals.savingsRate >= 30) {
        percentualValue.className = 'kpi-value text-success';
      } else if (totals.savingsRate >= 15) {
        percentualValue.className = 'kpi-value text-warning';
      } else {
        percentualValue.className = 'kpi-value text-danger';
      }
    }
    if (percentualIndicator) {
      var indicatorLabel = '';
      var indicatorClass = '';
      if (totals.savingsRate >= 30) {
        indicatorLabel = '🟢 Excelente';
        indicatorClass = 'indicator-success';
      } else if (totals.savingsRate >= 15) {
        indicatorLabel = '🟡 Bom';
        indicatorClass = 'indicator-warning';
      } else if (totals.savingsRate > 0) {
        indicatorLabel = '🔴 Atenção';
        indicatorClass = 'indicator-danger';
      } else {
        indicatorLabel = '⚫ Negativo';
        indicatorClass = 'indicator-danger';
      }
      percentualIndicator.textContent = indicatorLabel;
      percentualIndicator.className = 'kpi-indicator ' + indicatorClass;
    }
  }

  // ----------------------------------------------------------
  // Charts
  // ----------------------------------------------------------

  function renderCharts() {
    renderPatrimonyChart();
    renderExpensesCategoryChart();
  }

  function renderPatrimonyChart() {
    var history = DataManager.getPatrimonyHistory();
    if (!history || history.length === 0) {
      var canvas = document.getElementById('chart-patrimony-evolution');
      if (canvas && canvas.parentNode) {
        ChartManager.destroyChart('chart-patrimony-evolution');
      }
      return;
    }

    var labels = history.map(function (h) {
      return DataManager.formatMonth(h.date + '-01');
    });
    var values = history.map(function (h) {
      return h.amount;
    });

    // Add projections
    var projections = DataManager.getPatrimonyProjection(3);
    var projLabels = projections.map(function (p) {
      return DataManager.formatMonth(p.date + '-01') + ' *';
    });
    var projValues = projections.map(function (p) {
      return p.amount;
    });

    // Build combined arrays for projection line
    var allLabels = labels.concat(projLabels);
    var actualData = values.concat(projValues.map(function () { return null; }));
    var projData = values.map(function (_, i) {
      return i === values.length - 1 ? values[i] : null;
    }).concat(projValues);

    var datasets = [
      {
        label: 'Patrimônio',
        data: actualData,
        borderColor: '#6366f1',
        backgroundColor: ChartManager.hexToRgba('#6366f1', 0.12),
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 8
      },
      {
        label: 'Projeção',
        data: projData,
        borderColor: '#a855f7',
        backgroundColor: ChartManager.hexToRgba('#a855f7', 0.06),
        borderDash: [8, 4],
        fill: true,
        pointRadius: 4,
        pointStyle: 'rectRot'
      }
    ];

    ChartManager.createLineChart('chart-patrimony-evolution', allLabels, datasets, {
      plugins: {
        legend: { display: true }
      }
    });
  }

  function renderExpensesCategoryChart() {
    var categories = DataManager.getCategoryTotals(currentYear, currentMonth);
    var entries = Object.keys(categories).map(function (k) {
      return { category: k, total: categories[k] };
    });

    // Sort descending
    entries.sort(function (a, b) { return b.total - a.total; });

    if (entries.length === 0) {
      ChartManager.destroyChart('chart-expenses-category');
      var container = document.getElementById('chart-expenses-category');
      if (container && container.parentNode) {
        // Show empty state
      }
      return;
    }

    var labels = entries.map(function (e) { return e.category; });
    var data = entries.map(function (e) { return e.total; });

    ChartManager.createDoughnutChart('chart-expenses-category', labels, data, {
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: { size: 11 },
            padding: 12,
            generateLabels: function (chart) {
              var dataset = chart.data.datasets[0];
              var total = dataset.data.reduce(function (a, b) { return a + b; }, 0);
              return chart.data.labels.map(function (label, i) {
                var value = dataset.data[i];
                var pct = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                return {
                  text: label + ' (' + pct + '%)',
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.backgroundColor[i],
                  lineWidth: 0,
                  hidden: false,
                  index: i,
                  pointStyle: 'circle'
                };
              });
            }
          }
        }
      }
    });
  }

  // ----------------------------------------------------------
  // Accounts Summary
  // ----------------------------------------------------------

  function renderAccountsSummary() {
    var container = document.getElementById('dashboard-accounts');
    if (!container) return;

    var accounts = DataManager.getAccounts();
    if (!accounts || accounts.length === 0) {
      container.innerHTML = '<div class="empty-state"><span class="empty-icon">🏦</span><p>Nenhuma conta cadastrada</p></div>';
      return;
    }

    var html = '';
    var totalBalance = 0;

    accounts.forEach(function (acc) {
      var balance = DataManager.getAccountBalance(acc.name);
      totalBalance += balance;
      var isPositive = balance >= 0;
      var colorClass = isPositive ? 'text-success' : 'text-danger';
      var icon = getAccountIcon(acc.name);

      html += '' +
        '<div class="account-mini-card">' +
          '<div class="account-mini-header">' +
            '<span class="account-mini-icon">' + icon + '</span>' +
            '<span class="account-mini-name">' + escapeHtml(acc.name) + '</span>' +
          '</div>' +
          '<div class="account-mini-balance ' + colorClass + '">' +
            DataManager.formatCurrency(balance) +
          '</div>' +
        '</div>';
    });

    // Consolidated total
    var totalClass = totalBalance >= 0 ? 'text-success' : 'text-danger';
    html += '' +
      '<div class="account-mini-card account-mini-total">' +
        '<div class="account-mini-header">' +
          '<span class="account-mini-icon">💼</span>' +
          '<span class="account-mini-name">Total Consolidado</span>' +
        '</div>' +
        '<div class="account-mini-balance ' + totalClass + '">' +
          DataManager.formatCurrency(totalBalance) +
        '</div>' +
      '</div>';

    container.innerHTML = html;
  }

  function getAccountIcon(name) {
    var lower = name.toLowerCase();
    if (lower.indexOf('itaú') !== -1 || lower.indexOf('itau') !== -1) return '🏦';
    if (lower.indexOf('nubank') !== -1) return '💜';
    if (lower.indexOf('inter') !== -1) return '🧡';
    if (lower.indexOf('bradesco') !== -1) return '🔴';
    if (lower.indexOf('caixa') !== -1) return '🔵';
    if (lower.indexOf('bb') !== -1 || lower.indexOf('banco do brasil') !== -1) return '💛';
    return '🏦';
  }

  // ----------------------------------------------------------
  // Financial Intelligence
  // ----------------------------------------------------------

  function renderIntelligence() {
    var container = document.getElementById('dashboard-intelligence');
    if (!container) return;

    var daily = DataManager.getDailyAverage(currentYear, currentMonth);
    var history = DataManager.getMonthlyHistory(3);
    var autonomy = DataManager.getAutonomyMonths();
    var bestWorst = DataManager.getBestWorstMonths();
    var yearHistory = DataManager.getMonthlyHistory(12);

    // Calculate averages from last 3 months
    var avgExpenses3 = 0;
    var avgIncome3 = 0;
    var expenseCount = 0;
    var incomeCount = 0;

    history.forEach(function (m) {
      if (m.expenses > 0) {
        avgExpenses3 += m.expenses;
        expenseCount++;
      }
      if (m.income > 0) {
        avgIncome3 += m.income;
        incomeCount++;
      }
    });
    avgExpenses3 = expenseCount > 0 ? avgExpenses3 / expenseCount : 0;
    avgIncome3 = incomeCount > 0 ? avgIncome3 / incomeCount : 0;

    // Total saved last 12 months
    var totalSaved12 = yearHistory.reduce(function (sum, m) {
      return sum + m.savings;
    }, 0);

    // Total transactions
    var allTx = DataManager.getTransactions();
    var totalTx = allTx ? allTx.length : 0;

    var bestLabel = bestWorst.best ? DataManager.formatMonth(bestWorst.best.month + '-01') : 'N/A';
    var bestValue = bestWorst.best ? DataManager.formatCurrency(bestWorst.best.savings) : 'N/A';
    var worstLabel = bestWorst.worst ? DataManager.formatMonth(bestWorst.worst.month + '-01') : 'N/A';
    var worstValue = bestWorst.worst ? DataManager.formatCurrency(bestWorst.worst.savings) : 'N/A';

    var autonomyText = autonomy === Infinity ? '∞' : autonomy.toFixed(1);
    var autonomyColor = autonomy >= 6 ? 'text-success' : (autonomy >= 3 ? 'text-warning' : 'text-danger');

    container.innerHTML = '' +
      '<div class="stat-card">' +
        '<div class="stat-card-icon">💸</div>' +
        '<div class="stat-card-content">' +
          '<span class="stat-card-label">Gasto por dia</span>' +
          '<span class="stat-card-value text-danger">' + DataManager.formatCurrency(daily.dailyExpense) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<div class="stat-card-icon">📊</div>' +
        '<div class="stat-card-content">' +
          '<span class="stat-card-label">Média mensal de gastos</span>' +
          '<span class="stat-card-value">' + DataManager.formatCurrency(avgExpenses3) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<div class="stat-card-icon">💰</div>' +
        '<div class="stat-card-content">' +
          '<span class="stat-card-label">Média mensal de renda</span>' +
          '<span class="stat-card-value text-success">' + DataManager.formatCurrency(avgIncome3) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<div class="stat-card-icon">🛡️</div>' +
        '<div class="stat-card-content">' +
          '<span class="stat-card-label">Autonomia do patrimônio</span>' +
          '<span class="stat-card-value ' + autonomyColor + '">' + autonomyText + ' meses</span>' +
        '</div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<div class="stat-card-icon">🏆</div>' +
        '<div class="stat-card-content">' +
          '<span class="stat-card-label">Melhor mês</span>' +
          '<span class="stat-card-value text-success">' + bestLabel + '</span>' +
          '<span class="stat-card-detail">' + bestValue + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<div class="stat-card-icon">📉</div>' +
        '<div class="stat-card-content">' +
          '<span class="stat-card-label">Pior mês</span>' +
          '<span class="stat-card-value text-danger">' + worstLabel + '</span>' +
          '<span class="stat-card-detail">' + worstValue + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<div class="stat-card-icon">💎</div>' +
        '<div class="stat-card-content">' +
          '<span class="stat-card-label">Economizado (12 meses)</span>' +
          '<span class="stat-card-value ' + (totalSaved12 >= 0 ? 'text-success' : 'text-danger') + '">' + DataManager.formatCurrency(totalSaved12) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<div class="stat-card-icon">📋</div>' +
        '<div class="stat-card-content">' +
          '<span class="stat-card-label">Total de lançamentos</span>' +
          '<span class="stat-card-value">' + totalTx + '</span>' +
        '</div>' +
      '</div>';
  }

  // ----------------------------------------------------------
  // Projections
  // ----------------------------------------------------------

  function renderProjections() {
    var container = document.getElementById('dashboard-projections');
    if (!container) return;

    var proj6 = DataManager.getPatrimonyProjection(6);
    var proj12 = DataManager.getPatrimonyProjection(12);
    var proj24 = DataManager.getPatrimonyProjection(24);

    var val6 = proj6.length > 0 ? proj6[proj6.length - 1].amount : 0;
    var val12 = proj12.length > 0 ? proj12[proj12.length - 1].amount : 0;
    var val24 = proj24.length > 0 ? proj24[proj24.length - 1].amount : 0;

    var current = DataManager.getCurrentPatrimony();

    function growthBadge(projected) {
      if (current <= 0) return '';
      var diff = projected - current;
      var pct = ((diff / current) * 100).toFixed(0);
      var sign = diff >= 0 ? '+' : '';
      var cls = diff >= 0 ? 'badge-success' : 'badge-danger';
      return '<span class="projection-badge ' + cls + '">' + sign + pct + '%</span>';
    }

    container.innerHTML = '' +
      '<div class="stat-card projection-card">' +
        '<div class="stat-card-icon">📅</div>' +
        '<div class="stat-card-content">' +
          '<span class="stat-card-label">Patrimônio em 6 meses</span>' +
          '<span class="stat-card-value text-success">' + DataManager.formatCurrency(val6) + '</span>' +
          growthBadge(val6) +
        '</div>' +
      '</div>' +
      '<div class="stat-card projection-card">' +
        '<div class="stat-card-icon">📆</div>' +
        '<div class="stat-card-content">' +
          '<span class="stat-card-label">Patrimônio em 12 meses</span>' +
          '<span class="stat-card-value text-success">' + DataManager.formatCurrency(val12) + '</span>' +
          growthBadge(val12) +
        '</div>' +
      '</div>' +
      '<div class="stat-card projection-card">' +
        '<div class="stat-card-icon">🗓️</div>' +
        '<div class="stat-card-content">' +
          '<span class="stat-card-label">Patrimônio em 24 meses</span>' +
          '<span class="stat-card-value text-success">' + DataManager.formatCurrency(val24) + '</span>' +
          growthBadge(val24) +
        '</div>' +
      '</div>';
  }

  // ----------------------------------------------------------
  // Alerts
  // ----------------------------------------------------------

  function renderAlerts() {
    var container = document.getElementById('dashboard-alerts');
    if (!container) return;

    var alerts = DataManager.getAlerts();

    if (!alerts || alerts.length === 0) {
      container.innerHTML = '' +
        '<div class="empty-state">' +
          '<span class="empty-icon">✅</span>' +
          '<p>Nenhum alerta no momento. Tudo sob controle!</p>' +
        '</div>';
      return;
    }

    var html = '';
    alerts.forEach(function (alert) {
      var bgClass = 'alert-info';
      if (alert.type === 'danger') bgClass = 'alert-danger';
      else if (alert.type === 'warning') bgClass = 'alert-warning';
      else if (alert.type === 'success') bgClass = 'alert-success';

      html += '' +
        '<div class="alert-badge ' + bgClass + '">' +
          '<div class="alert-badge-icon">' + (alert.icon || '⚠️') + '</div>' +
          '<div class="alert-badge-content">' +
            '<strong class="alert-badge-title">' + escapeHtml(alert.title) + '</strong>' +
            '<span class="alert-badge-message">' + escapeHtml(alert.message) + '</span>' +
          '</div>' +
        '</div>';
    });

    container.innerHTML = html;
  }

  // ----------------------------------------------------------
  // Recent Transactions
  // ----------------------------------------------------------

  function renderRecentTransactions() {
    var container = document.getElementById('dashboard-recent');
    if (!container) return;

    var all = DataManager.getTransactions();
    if (!all || all.length === 0) {
      container.innerHTML = '' +
        '<div class="empty-state">' +
          '<span class="empty-icon">📝</span>' +
          '<p>Nenhuma movimentação registrada</p>' +
        '</div>';
      return;
    }

    // Sort by date descending, then take last 8
    var sorted = all.slice().sort(function (a, b) {
      return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
    });
    var recent = sorted.slice(0, 8);

    var html = '';
    recent.forEach(function (tx) {
      var isIncome = tx.type === 'receita';
      var amountClass = isIncome ? 'text-success' : 'text-danger';
      var sign = isIncome ? '+' : '-';
      var categoryIcon = getCategoryIcon(tx.category);

      html += '' +
        '<div class="transaction-item">' +
          '<div class="transaction-item-left">' +
            '<span class="transaction-item-icon">' + categoryIcon + '</span>' +
            '<div class="transaction-item-details">' +
              '<span class="transaction-item-category">' + escapeHtml(tx.category) +
                (tx.subcategory ? ' <span class="transaction-subcategory">· ' + escapeHtml(tx.subcategory) + '</span>' : '') +
              '</span>' +
              '<span class="transaction-item-meta">' +
                DataManager.formatDate(tx.date) + ' · ' + escapeHtml(tx.account) +
                (tx.notes ? ' · ' + escapeHtml(tx.notes) : '') +
              '</span>' +
            '</div>' +
          '</div>' +
          '<div class="transaction-item-amount ' + amountClass + '">' +
            sign + ' ' + DataManager.formatCurrency(tx.amount) +
          '</div>' +
        '</div>';
    });

    container.innerHTML = html;
  }

  function getCategoryIcon(category) {
    var icons = {
      'Estágio':               '💼',
      'Trabalho de Final de Semana': '🔨',
      'Reembolso':             '↩️',
      'Alimentação':           '🍽️',
      'Combustível':           '⛽',
      'Lazer':                 '🎮',
      'Compras':               '🛒',
      'Assinaturas':           '📱',
      'Saúde':                 '❤️',
      'Transporte':            '🚗',
      'Vestuário':             '👕',
      'Manutenção Veicular':   '🔧',
      'Seguro Veicular':       '🛡️',
      'Documentação Veicular': '📄',
      'Estacionamento':        '🅿️',
      'Pedágio':               '🛣️',
      'Marketplace':           '🏪',
      'Amazon':                '📦',
      'Reserva':               '💰',
      'Consumo Pessoal':       '🧴',
      'Diversos':              '📌',
      'Outros':                '📎'
    };
    return icons[category] || '💳';
  }

  // ----------------------------------------------------------
  // Utilities
  // ----------------------------------------------------------

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------

  window.DashboardManager = {
    init: init,
    render: render,
    renderKPIs: renderKPIs,
    renderCharts: renderCharts,
    renderAccountsSummary: renderAccountsSummary,
    renderIntelligence: renderIntelligence,
    renderProjections: renderProjections,
    renderAlerts: renderAlerts,
    renderRecentTransactions: renderRecentTransactions
  };
})();
