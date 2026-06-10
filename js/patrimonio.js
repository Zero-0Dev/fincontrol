// ============================================================
// patrimonio.js — Patrimony Tab UI Manager
// Financeiro Pessoal — Personal Finance Application
// ============================================================

(function () {
  'use strict';

  var chartInstance = null;

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------

  function esc(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ----------------------------------------------------------
  // Init
  // ----------------------------------------------------------

  function init() {
    var form = document.getElementById('patrimony-form');
    if (form) {
      form.addEventListener('submit', handleSubmit);
    }
    // Set default month to current
    var monthInput = document.getElementById('patrimony-month');
    if (monthInput) {
      var now = new Date();
      monthInput.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    }
    render();
  }

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  function render() {
    renderKPIs();
    renderChart();
    renderTable();
  }

  // ----------------------------------------------------------
  // KPI Cards
  // ----------------------------------------------------------

  function renderKPIs() {
    var DM = window.DataManager;
    var history = DM.getPatrimonyHistory();

    // Current patrimony (latest snapshot)
    var current = history.length > 0 ? history[history.length - 1].amount : 0;
    var currentEl = document.getElementById('patrimony-current-value');
    if (currentEl) currentEl.textContent = DM.formatCurrency(current);

    // Month-over-month growth
    var growthAbs = 0;
    var growthPct = 0;
    if (history.length >= 2) {
      var last = history[history.length - 1].amount;
      var prev = history[history.length - 2].amount;
      growthAbs = last - prev;
      growthPct = prev > 0 ? (growthAbs / prev) * 100 : 0;
    }
    var growthEl = document.getElementById('patrimony-growth-value');
    if (growthEl) {
      var sign = growthAbs >= 0 ? '+' : '';
      growthEl.textContent = sign + DM.formatCurrency(growthAbs);
      growthEl.style.color = growthAbs >= 0 ? '#10b981' : '#ef4444';
    }
    // Add percentage as a trend indicator
    var growthCard = document.getElementById('patrimony-growth');
    if (growthCard) {
      var trendEl = growthCard.querySelector('.kpi-trend');
      if (!trendEl) {
        trendEl = document.createElement('span');
        trendEl.className = 'kpi-trend';
        var kpiInfo = growthCard.querySelector('.kpi-info');
        if (kpiInfo) kpiInfo.appendChild(trendEl);
      }
      if (trendEl) {
        var pctSign = growthPct >= 0 ? '+' : '';
        trendEl.textContent = pctSign + growthPct.toFixed(1) + '%';
        trendEl.style.color = growthPct >= 0 ? '#10b981' : '#ef4444';
      }
    }

    // Total saved since first entry
    var totalSaved = 0;
    if (history.length >= 2) {
      totalSaved = history[history.length - 1].amount - history[0].amount;
    }
    var totalSavedEl = document.getElementById('patrimony-total-saved-value');
    if (totalSavedEl) totalSavedEl.textContent = DM.formatCurrency(totalSaved);

    // Accumulated growth percentage
    var accumulatedPct = 0;
    if (history.length >= 2 && history[0].amount > 0) {
      accumulatedPct = ((history[history.length - 1].amount - history[0].amount) / history[0].amount) * 100;
    }
    var accumulatedEl = document.getElementById('patrimony-accumulated-value');
    if (accumulatedEl) {
      var accSign = accumulatedPct >= 0 ? '+' : '';
      accumulatedEl.textContent = accSign + accumulatedPct.toFixed(1) + '%';
      accumulatedEl.style.color = accumulatedPct >= 0 ? '#10b981' : '#ef4444';
    }
  }

  // ----------------------------------------------------------
  // Chart
  // ----------------------------------------------------------

  function renderChart() {
    var canvas = document.getElementById('chart-patrimony-full');
    if (!canvas) return;
    if (typeof Chart === 'undefined') return;

    var DM = window.DataManager;
    var history = DM.getPatrimonyHistory();

    var labels = history.map(function (h) { return DM.formatMonth(h.date + '-01'); });
    var data = history.map(function (h) { return h.amount; });

    // Destroy existing chart
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }

    var ctx = canvas.getContext('2d');

    // Create gradient fill
    var gradient = ctx.createLinearGradient(0, 0, 0, canvas.height || 300);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');

    chartInstance = new Chart(ctx, {
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
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(30, 30, 46, 0.95)',
            titleColor: '#e0e0e0',
            bodyColor: '#e0e0e0',
            borderColor: '#333',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: function (context) {
                return DM.formatCurrency(context.parsed.y);
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255,255,255,0.05)',
            },
            ticks: {
              color: '#888',
              font: { size: 11 },
            },
          },
          y: {
            grid: {
              color: 'rgba(255,255,255,0.05)',
            },
            ticks: {
              color: '#888',
              font: { size: 11 },
              callback: function (value) {
                return DM.formatCurrency(value);
              },
            },
          },
        },
      },
    });
  }

  // ----------------------------------------------------------
  // Table
  // ----------------------------------------------------------

  function renderTable() {
    var tbody = document.getElementById('patrimony-body');
    if (!tbody) return;

    var DM = window.DataManager;
    var history = DM.getPatrimonyHistory();

    if (history.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#888;padding:24px;">Nenhum registro de patrimônio encontrado.</td></tr>';
      return;
    }

    // Show in descending order (newest first)
    var sorted = history.slice().reverse();
    var rows = '';

    sorted.forEach(function (entry, index) {
      // Find the previous entry (chronologically) to calculate variation
      var chronoIndex = history.length - 1 - index;
      var variationAbs = 0;
      var variationPct = 0;
      var hasVariation = false;

      if (chronoIndex > 0) {
        var prevAmount = history[chronoIndex - 1].amount;
        variationAbs = entry.amount - prevAmount;
        variationPct = prevAmount > 0 ? (variationAbs / prevAmount) * 100 : 0;
        hasVariation = true;
      }

      var varColor = variationAbs >= 0 ? '#10b981' : '#ef4444';
      var varSign = variationAbs >= 0 ? '+' : '';

      rows += '<tr>';
      rows += '<td>' + esc(DM.formatMonth(entry.date + '-01')) + '</td>';
      rows += '<td>' + esc(DM.formatCurrency(entry.amount)) + '</td>';
      rows += '<td style="color:' + varColor + '">';
      if (hasVariation) {
        rows += varSign + DM.formatCurrency(variationAbs);
      } else {
        rows += '—';
      }
      rows += '</td>';
      rows += '<td style="color:' + varColor + '">';
      if (hasVariation) {
        rows += varSign + variationPct.toFixed(1) + '%';
      } else {
        rows += '—';
      }
      rows += '</td>';
      rows += '<td>';
      rows += '<button class="btn btn-danger btn-sm" onclick="PatrimonyManager.deleteSnapshot(\'' + esc(entry.date) + '\')" title="Excluir">🗑️</button>';
      rows += '</td>';
      rows += '</tr>';
    });

    tbody.innerHTML = rows;
  }

  // ----------------------------------------------------------
  // Form Submit
  // ----------------------------------------------------------

  function handleSubmit(e) {
    e.preventDefault();

    var DM = window.DataManager;
    var monthInput = document.getElementById('patrimony-month');
    var amountInput = document.getElementById('patrimony-amount');

    if (!monthInput || !amountInput) return;

    var date = monthInput.value; // "YYYY-MM"
    var amount = parseFloat(amountInput.value);

    if (!date || isNaN(amount) || amount < 0) {
      showToast('Preencha todos os campos corretamente.', 'error');
      return;
    }

    DM.addPatrimonySnapshot(date, amount);
    showToast('Patrimônio registrado com sucesso!', 'success');

    // Reset form
    amountInput.value = '';

    // Re-render
    render();
  }

  // ----------------------------------------------------------
  // Delete Snapshot
  // ----------------------------------------------------------

  function deleteSnapshot(date) {
    if (!confirm('Deseja realmente excluir o registro de ' + window.DataManager.formatMonth(date + '-01') + '?')) {
      return;
    }

    var DM = window.DataManager;
    var data = DM.getData();
    if (!data || !data.patrimony) return;

    data.patrimony = data.patrimony.filter(function (p) { return p.date !== date; });
    DM.saveData(data);

    showToast('Registro excluído com sucesso!', 'success');
    render();
  }

  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------

  window.PatrimonyManager = {
    init: init,
    render: render,
    renderKPIs: renderKPIs,
    renderChart: renderChart,
    renderTable: renderTable,
    handleSubmit: handleSubmit,
    deleteSnapshot: deleteSnapshot,
  };
})();
