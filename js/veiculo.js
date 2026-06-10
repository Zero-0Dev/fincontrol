// ============================================================
// veiculo.js — Vehicle Tab UI Manager
// Financeiro Pessoal — Personal Finance Application
// ============================================================

(function () {
  'use strict';

  var fuelChartInstance = null;

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
    // Sub-tab switching
    var tabBtns = document.querySelectorAll('.vehicle-tab-btn');
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-vehicle-tab');
        switchTab(target);
      });
    });

    // Fuel modal
    var addFuelBtn = document.getElementById('btn-add-fuel');
    if (addFuelBtn) addFuelBtn.addEventListener('click', openFuelModal);

    var fuelClose = document.getElementById('modal-fuel-close');
    var fuelCancel = document.getElementById('modal-fuel-cancel');
    var fuelSave = document.getElementById('modal-fuel-save');
    if (fuelClose) fuelClose.addEventListener('click', function () { closeModal('modal-fuel'); });
    if (fuelCancel) fuelCancel.addEventListener('click', function () { closeModal('modal-fuel'); });
    if (fuelSave) fuelSave.addEventListener('click', handleFuelSubmit);

    // Maintenance modal
    var addMaintBtn = document.getElementById('btn-add-maintenance');
    if (addMaintBtn) addMaintBtn.addEventListener('click', openMaintenanceModal);

    var maintClose = document.getElementById('modal-maintenance-close');
    var maintCancel = document.getElementById('modal-maintenance-cancel');
    var maintSave = document.getElementById('modal-maintenance-save');
    if (maintClose) maintClose.addEventListener('click', function () { closeModal('modal-maintenance'); });
    if (maintCancel) maintCancel.addEventListener('click', function () { closeModal('modal-maintenance'); });
    if (maintSave) maintSave.addEventListener('click', handleMaintenanceSubmit);

    // Document modal
    var addDocBtn = document.getElementById('btn-add-document');
    if (addDocBtn) addDocBtn.addEventListener('click', openDocumentModal);

    var docClose = document.getElementById('modal-document-close');
    var docCancel = document.getElementById('modal-document-cancel');
    var docSave = document.getElementById('modal-document-save');
    if (docClose) docClose.addEventListener('click', function () { closeModal('modal-document'); });
    if (docCancel) docCancel.addEventListener('click', function () { closeModal('modal-document'); });
    if (docSave) docSave.addEventListener('click', handleDocumentSubmit);

    // Close modals on overlay click
    ['modal-fuel', 'modal-maintenance', 'modal-document'].forEach(function (id) {
      var overlay = document.getElementById(id);
      if (overlay) {
        overlay.addEventListener('click', function (e) {
          if (e.target === overlay) closeModal(id);
        });
      }
    });

    // Auto-calculate fuel total
    var fuelLiters = document.getElementById('fuel-liters');
    var fuelPrice = document.getElementById('fuel-price-per-liter');
    var fuelTotal = document.getElementById('fuel-total');
    function calcFuelTotal() {
      if (fuelLiters && fuelPrice && fuelTotal) {
        var l = parseFloat(fuelLiters.value) || 0;
        var p = parseFloat(fuelPrice.value) || 0;
        if (l > 0 && p > 0) {
          fuelTotal.value = (l * p).toFixed(2);
        }
      }
    }
    if (fuelLiters) fuelLiters.addEventListener('input', calcFuelTotal);
    if (fuelPrice) fuelPrice.addEventListener('input', calcFuelTotal);

    render();
  }

  // ----------------------------------------------------------
  // Tab Switching
  // ----------------------------------------------------------

  function switchTab(tabName) {
    // Update button states
    var btns = document.querySelectorAll('.vehicle-tab-btn');
    btns.forEach(function (btn) {
      if (btn.getAttribute('data-vehicle-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Show/hide panes
    var panes = document.querySelectorAll('.vehicle-tab-pane');
    panes.forEach(function (pane) {
      if (pane.id === tabName) {
        pane.classList.add('active');
        pane.hidden = false;
      } else {
        pane.classList.remove('active');
        pane.hidden = true;
      }
    });
  }

  // ----------------------------------------------------------
  // Render All
  // ----------------------------------------------------------

  function render() {
    renderFuel();
    renderMaintenance();
    renderDocuments();
  }

  // ----------------------------------------------------------
  // FUEL
  // ----------------------------------------------------------

  function renderFuel() {
    renderFuelStats();
    renderFuelChart();
    renderFuelTable();
  }

  function renderFuelStats() {
    var container = document.getElementById('fuel-stats');
    if (!container) return;

    var DM = window.DataManager;
    var stats = DM.getAverageFuelConsumption();
    var costs = DM.getVehicleTotalCosts();
    var logs = DM.getVehicleLogs();
    var fuelLogs = logs.fuelLogs || [];

    // Calculate average monthly fuel cost
    var avgMonthlyCost = 0;
    if (fuelLogs.length > 0) {
      var monthSet = {};
      fuelLogs.forEach(function (log) {
        var month = log.date.slice(0, 7);
        if (!monthSet[month]) monthSet[month] = 0;
        monthSet[month] += log.totalCost;
      });
      var monthKeys = Object.keys(monthSet);
      if (monthKeys.length > 0) {
        var totalMonthly = monthKeys.reduce(function (s, k) { return s + monthSet[k]; }, 0);
        avgMonthlyCost = totalMonthly / monthKeys.length;
      }
    }

    var hasData = fuelLogs.length > 0;

    container.innerHTML =
      '<div class="stat-card">' +
      '<span class="stat-label">⛽ Consumo Médio</span>' +
      '<span class="stat-value">' + (hasData ? stats.kmPerLiter.toFixed(1) + ' km/l' : '— km/l') + '</span>' +
      '</div>' +
      '<div class="stat-card">' +
      '<span class="stat-label">💲 Custo por KM</span>' +
      '<span class="stat-value">' + (hasData ? DM.formatCurrency(stats.costPerKm) : '—') + '</span>' +
      '</div>' +
      '<div class="stat-card">' +
      '<span class="stat-label">📅 Gasto Mensal Médio</span>' +
      '<span class="stat-value">' + (hasData ? DM.formatCurrency(avgMonthlyCost) : '—') + '</span>' +
      '</div>' +
      '<div class="stat-card">' +
      '<span class="stat-label">🔥 Total em Combustível</span>' +
      '<span class="stat-value">' + (hasData ? DM.formatCurrency(costs.fuel) : '—') + '</span>' +
      '</div>';
  }

  function renderFuelChart() {
    var canvas = document.getElementById('chart-fuel');
    if (!canvas) return;
    if (typeof Chart === 'undefined') return;

    var DM = window.DataManager;
    var logs = DM.getVehicleLogs();
    var fuelLogs = (logs.fuelLogs || []).slice().sort(function (a, b) { return a.date.localeCompare(b.date); });

    // Group by month
    var monthData = {};
    fuelLogs.forEach(function (log) {
      var month = log.date.slice(0, 7);
      if (!monthData[month]) monthData[month] = 0;
      monthData[month] += log.totalCost;
    });

    var labels = Object.keys(monthData).map(function (m) { return DM.formatMonth(m + '-01'); });
    var data = Object.values(monthData).map(function (v) { return Math.round(v * 100) / 100; });

    if (fuelChartInstance) {
      fuelChartInstance.destroy();
      fuelChartInstance = null;
    }

    if (data.length === 0) {
      return;
    }

    var ctx = canvas.getContext('2d');
    fuelChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Custo Combustível',
          data: data,
          backgroundColor: 'rgba(245, 158, 11, 0.7)',
          borderColor: '#f59e0b',
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
              label: function (context) {
                return DM.formatCurrency(context.parsed.y);
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

  function renderFuelTable() {
    var tbody = document.getElementById('fuel-body');
    if (!tbody) return;

    var DM = window.DataManager;
    var logs = DM.getVehicleLogs();
    var fuelLogs = (logs.fuelLogs || []).slice().sort(function (a, b) { return b.date.localeCompare(a.date); });

    if (fuelLogs.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="8" style="text-align:center;color:#888;padding:24px;">' +
        '🚗 Esta seção está preparada para quando você adquirir seu VW Up TSI! ' +
        'Referência de custo: ~R$180 a cada duas semanas.' +
        '</td></tr>';
      return;
    }

    // Sort by km for consumption calculation
    var sortedByKm = fuelLogs.slice().sort(function (a, b) { return a.km - b.km; });

    var rows = '';
    fuelLogs.forEach(function (log) {
      // Calculate consumption for this log
      var consumption = '—';
      var kmIndex = sortedByKm.findIndex(function (l) { return l.id === log.id; });
      if (kmIndex > 0) {
        var kmDiff = sortedByKm[kmIndex].km - sortedByKm[kmIndex - 1].km;
        if (log.liters > 0 && kmDiff > 0) {
          consumption = (kmDiff / log.liters).toFixed(1) + ' km/l';
        }
      }

      rows += '<tr>';
      rows += '<td>' + esc(DM.formatDate(log.date)) + '</td>';
      rows += '<td>' + log.km.toLocaleString('pt-BR') + '</td>';
      rows += '<td>' + log.liters.toFixed(2) + '</td>';
      rows += '<td>' + DM.formatCurrency(log.pricePerLiter) + '</td>';
      rows += '<td>' + DM.formatCurrency(log.totalCost) + '</td>';
      rows += '<td>' + esc(consumption) + '</td>';
      rows += '<td>' + esc(log.station || '—') + '</td>';
      rows += '<td><button class="btn btn-danger btn-sm" onclick="VehicleManager.deleteFuelLog(\'' + esc(log.id) + '\')" title="Excluir">🗑️</button></td>';
      rows += '</tr>';
    });

    tbody.innerHTML = rows;
  }

  function openFuelModal() {
    var modal = document.getElementById('modal-fuel');
    if (!modal) return;

    // Reset form
    var form = document.getElementById('fuel-form');
    if (form) form.reset();

    // Set default date to today
    var dateInput = document.getElementById('fuel-date');
    if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

    modal.hidden = false;
  }

  function handleFuelSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    var DM = window.DataManager;

    var date = (document.getElementById('fuel-date') || {}).value || '';
    var km = parseInt((document.getElementById('fuel-km') || {}).value, 10) || 0;
    var liters = parseFloat((document.getElementById('fuel-liters') || {}).value) || 0;
    var pricePerLiter = parseFloat((document.getElementById('fuel-price-per-liter') || {}).value) || 0;
    var totalCost = parseFloat((document.getElementById('fuel-total') || {}).value) || 0;
    var station = (document.getElementById('fuel-station') || {}).value || '';

    if (!date || km <= 0 || liters <= 0 || pricePerLiter <= 0 || totalCost <= 0) {
      showToast('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    DM.addFuelLog({
      date: date,
      km: km,
      liters: liters,
      pricePerLiter: pricePerLiter,
      totalCost: totalCost,
      station: station,
      notes: '',
    });

    showToast('Abastecimento registrado com sucesso!', 'success');
    closeModal('modal-fuel');
    renderFuel();
  }

  function deleteFuelLog(id) {
    if (!confirm('Deseja excluir este registro de abastecimento?')) return;

    var DM = window.DataManager;
    var data = DM.getData();
    if (!data || !data.vehicle) return;

    data.vehicle.fuelLogs = data.vehicle.fuelLogs.filter(function (l) { return l.id !== id; });
    DM.saveData(data);

    showToast('Registro excluído!', 'success');
    renderFuel();
  }

  // ----------------------------------------------------------
  // MAINTENANCE
  // ----------------------------------------------------------

  function renderMaintenance() {
    renderMaintenanceTable();
  }

  function renderMaintenanceTable() {
    var tbody = document.getElementById('maintenance-body');
    if (!tbody) return;

    var DM = window.DataManager;
    var logs = DM.getVehicleLogs();
    var maintLogs = (logs.maintenanceLogs || []).slice().sort(function (a, b) { return b.date.localeCompare(a.date); });

    if (maintLogs.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align:center;color:#888;padding:24px;">' +
        'Nenhum registro de manutenção encontrado.' +
        '</td></tr>';
      return;
    }

    var rows = '';
    maintLogs.forEach(function (log) {
      rows += '<tr>';
      rows += '<td>' + esc(DM.formatDate(log.date)) + '</td>';
      rows += '<td>' + esc(log.type || '—') + '</td>';
      rows += '<td>' + esc(log.description || '—') + '</td>';
      rows += '<td>' + (log.km ? log.km.toLocaleString('pt-BR') : '—') + '</td>';
      rows += '<td>' + DM.formatCurrency(log.cost) + '</td>';
      rows += '<td>' + esc(log.location || log.notes || '—') + '</td>';
      rows += '<td><button class="btn btn-danger btn-sm" onclick="VehicleManager.deleteMaintenanceLog(\'' + esc(log.id) + '\')" title="Excluir">🗑️</button></td>';
      rows += '</tr>';
    });

    tbody.innerHTML = rows;
  }

  function openMaintenanceModal() {
    var modal = document.getElementById('modal-maintenance');
    if (!modal) return;

    var form = document.getElementById('maintenance-form');
    if (form) form.reset();

    var dateInput = document.getElementById('maint-date');
    if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

    modal.hidden = false;
  }

  function handleMaintenanceSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    var DM = window.DataManager;

    var date = (document.getElementById('maint-date') || {}).value || '';
    var type = (document.getElementById('maint-type') || {}).value || '';
    var description = (document.getElementById('maint-description') || {}).value || '';
    var km = parseInt((document.getElementById('maint-km') || {}).value, 10) || 0;
    var cost = parseFloat((document.getElementById('maint-amount') || {}).value) || 0;
    var location = (document.getElementById('maint-location') || {}).value || '';

    if (!date || !description || cost < 0) {
      showToast('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    DM.addMaintenanceLog({
      date: date,
      type: type,
      description: description,
      km: km,
      cost: cost,
      location: location,
      notes: '',
    });

    showToast('Manutenção registrada com sucesso!', 'success');
    closeModal('modal-maintenance');
    renderMaintenance();
  }

  function deleteMaintenanceLog(id) {
    if (!confirm('Deseja excluir este registro de manutenção?')) return;

    var DM = window.DataManager;
    var data = DM.getData();
    if (!data || !data.vehicle) return;

    data.vehicle.maintenanceLogs = data.vehicle.maintenanceLogs.filter(function (l) { return l.id !== id; });
    DM.saveData(data);

    showToast('Registro excluído!', 'success');
    renderMaintenance();
  }

  // ----------------------------------------------------------
  // DOCUMENTS
  // ----------------------------------------------------------

  function renderDocuments() {
    renderDocumentsTable();
  }

  function renderDocumentsTable() {
    var tbody = document.getElementById('documents-body');
    if (!tbody) return;

    var DM = window.DataManager;
    var logs = DM.getVehicleLogs();
    var docs = (logs.documents || []).slice();

    if (docs.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;color:#888;padding:24px;">' +
        'Nenhum documento registrado.' +
        '</td></tr>';
      return;
    }

    // Sort by due date
    docs.sort(function (a, b) { return (a.dueDate || '').localeCompare(b.dueDate || ''); });

    var rows = '';
    docs.forEach(function (doc) {
      var statusColor = '#888';
      var statusLabel = doc.status || 'pendente';
      if (statusLabel === 'pago') statusColor = '#10b981';
      else if (statusLabel === 'pendente') statusColor = '#f59e0b';
      else if (statusLabel === 'vencido') statusColor = '#ef4444';

      rows += '<tr>';
      rows += '<td>' + esc(doc.type || '—') + '</td>';
      rows += '<td>' + esc(doc.notes || doc.description || '—') + '</td>';
      rows += '<td>' + (doc.dueDate ? esc(DM.formatDate(doc.dueDate)) : '—') + '</td>';
      rows += '<td>' + DM.formatCurrency(doc.cost || 0) + '</td>';
      rows += '<td><span style="color:' + statusColor + ';font-weight:600;text-transform:capitalize;">' + esc(statusLabel) + '</span></td>';
      rows += '<td><button class="btn btn-danger btn-sm" onclick="VehicleManager.deleteDocument(\'' + esc(doc.id) + '\')" title="Excluir">🗑️</button></td>';
      rows += '</tr>';
    });

    tbody.innerHTML = rows;
  }

  function openDocumentModal() {
    var modal = document.getElementById('modal-document');
    if (!modal) return;

    var form = document.getElementById('document-form');
    if (form) form.reset();

    var dateInput = document.getElementById('doc-due-date');
    if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

    modal.hidden = false;
  }

  function handleDocumentSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    var DM = window.DataManager;

    var type = (document.getElementById('doc-type') || {}).value || '';
    var description = (document.getElementById('doc-description') || {}).value || '';
    var dueDate = (document.getElementById('doc-due-date') || {}).value || '';
    var cost = parseFloat((document.getElementById('doc-amount') || {}).value) || 0;
    var status = (document.getElementById('doc-status') || {}).value || 'pendente';

    if (!type || !dueDate) {
      showToast('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    DM.addVehicleDocument({
      type: type,
      description: description,
      dueDate: dueDate,
      cost: cost,
      status: status,
      notes: description,
    });

    showToast('Documento registrado com sucesso!', 'success');
    closeModal('modal-document');
    renderDocuments();
  }

  function deleteDocument(id) {
    if (!confirm('Deseja excluir este documento?')) return;

    var DM = window.DataManager;
    var data = DM.getData();
    if (!data || !data.vehicle) return;

    data.vehicle.documents = data.vehicle.documents.filter(function (d) { return d.id !== id; });
    DM.saveData(data);

    showToast('Documento excluído!', 'success');
    renderDocuments();
  }

  // ----------------------------------------------------------
  // Modal Close
  // ----------------------------------------------------------

  function closeModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) modal.hidden = true;
  }

  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------

  window.VehicleManager = {
    init: init,
    render: render,

    switchTab: switchTab,

    renderFuel: renderFuel,
    renderFuelStats: renderFuelStats,
    renderFuelChart: renderFuelChart,
    renderFuelTable: renderFuelTable,
    openFuelModal: openFuelModal,
    handleFuelSubmit: handleFuelSubmit,
    deleteFuelLog: deleteFuelLog,

    renderMaintenance: renderMaintenance,
    renderMaintenanceTable: renderMaintenanceTable,
    openMaintenanceModal: openMaintenanceModal,
    handleMaintenanceSubmit: handleMaintenanceSubmit,
    deleteMaintenanceLog: deleteMaintenanceLog,

    renderDocuments: renderDocuments,
    renderDocumentsTable: renderDocumentsTable,
    openDocumentModal: openDocumentModal,
    handleDocumentSubmit: handleDocumentSubmit,
    deleteDocument: deleteDocument,

    closeModal: closeModal,
  };
})();
