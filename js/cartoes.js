// ============================================================
// cartoes.js — Card Manager (Cartões e Parcelamentos Tab)
// Financeiro Pessoal — Personal Finance Application
// ============================================================

(function () {
  'use strict';

  // ----------------------------------------------------------
  // Internal State
  // ----------------------------------------------------------

  var editingInstallmentId = null;

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

  function daysBetween(dateStr1, dateStr2) {
    var d1 = new Date(dateStr1 + 'T00:00:00');
    var d2 = new Date(dateStr2 + 'T00:00:00');
    return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
  }

  // ----------------------------------------------------------
  // Card Summaries
  // ----------------------------------------------------------

  function calculateMonthlyCardTotal(cardName) {
    var installments = window.DataManager.getActiveInstallments();
    var total = 0;
    installments.forEach(function (inst) {
      if (inst.card === cardName) {
        total += inst.installmentAmount;
      }
    });
    return Math.round(total * 100) / 100;
  }

  function getActiveInstallmentCount(cardName) {
    var installments = window.DataManager.getActiveInstallments();
    var count = 0;
    installments.forEach(function (inst) {
      if (inst.card === cardName) {
        count++;
      }
    });
    return count;
  }

  function renderCardSummaries() {
    var settings = window.DataManager.getSettings();
    var cards = settings.cards || [];

    cards.forEach(function (cardName) {
      var slug = sanitizeName(cardName);
      var monthlyTotal = calculateMonthlyCardTotal(cardName);
      var activeCount = getActiveInstallmentCount(cardName);

      // Also add credit card transactions from the current month
      var now = new Date();
      var currentMonth = now.getMonth() + 1;
      var currentYear = now.getFullYear();
      var monthTx = window.DataManager.getTransactionsByMonth(currentYear, currentMonth);
      var cardInvoice = 0;
      monthTx.forEach(function (tx) {
        if (tx.type === 'despesa' && tx.paymentMethod === 'Cartão de Crédito') {
          // Match card by account or by any transaction with this payment method
          // Since transactions don't store card directly, sum all credit card expenses
          // We'll attribute to a card based on name matching
          if (cardName.toLowerCase().indexOf('itaú') !== -1 || cardName.toLowerCase().indexOf('itau') !== -1) {
            if (tx.account && (tx.account.toLowerCase().indexOf('itaú') !== -1 || tx.account.toLowerCase().indexOf('itau') !== -1)) {
              cardInvoice += tx.amount;
            }
          } else if (cardName.toLowerCase().indexOf('nubank') !== -1) {
            if (tx.account && tx.account.toLowerCase().indexOf('nubank') !== -1) {
              cardInvoice += tx.amount;
            }
          }
        }
      });

      // Add installment amounts to invoice
      var totalInvoice = cardInvoice + monthlyTotal;

      // Update the card UI elements
      var invoiceEl = document.getElementById('card-' + slug + '-invoice');
      if (invoiceEl) {
        invoiceEl.textContent = window.DataManager.formatCurrency(totalInvoice);
      }

      var installmentsEl = document.getElementById('card-' + slug + '-installments');
      if (installmentsEl) {
        installmentsEl.textContent = activeCount;
      }
    });
  }

  // ----------------------------------------------------------
  // Installments Table
  // ----------------------------------------------------------

  function renderInstallments() {
    var tbody = document.getElementById('installments-body');
    if (!tbody) return;

    var installments = window.DataManager.getInstallments();

    // Sort: active first, then by end date ascending
    var today = todayISO();
    installments.sort(function (a, b) {
      var aActive = a.endDate >= today && a.currentInstallment <= a.installmentCount;
      var bActive = b.endDate >= today && b.currentInstallment <= b.installmentCount;
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return a.endDate.localeCompare(b.endDate);
    });

    if (installments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#888;padding:24px;">Nenhum parcelamento registrado</td></tr>';
      return;
    }

    var html = '';
    installments.forEach(function (inst) {
      var isActive = inst.endDate >= today && inst.currentInstallment <= inst.installmentCount;
      var daysToEnd = daysBetween(today, inst.endDate);
      var isNearEnd = daysToEnd <= 30 && daysToEnd >= 0;
      var isCompleted = !isActive;

      // Row color coding
      var rowStyle = '';
      if (isCompleted) {
        rowStyle = 'opacity:0.6;';
      } else if (isNearEnd) {
        rowStyle = 'border-left:3px solid #ef4444;';
      } else if (daysToEnd > 180) {
        rowStyle = 'border-left:3px solid #10b981;';
      }

      // Status badge
      var statusBadge = '';
      if (isCompleted) {
        statusBadge = '<span class="badge badge-receita">Finalizado</span>';
      } else if (isNearEnd) {
        statusBadge = '<span class="badge badge-despesa">Finalizando</span>';
      } else {
        statusBadge = '<span class="badge badge-info">Ativo</span>';
      }

      html += '<tr style="' + rowStyle + '">' +
        '<td>' + esc(inst.description) + '</td>' +
        '<td>' + esc(inst.card) + '</td>' +
        '<td>' + window.DataManager.formatCurrency(inst.totalAmount) + '</td>' +
        '<td>' + inst.installmentCount + 'x</td>' +
        '<td>' + inst.currentInstallment + '/' + inst.installmentCount + '</td>' +
        '<td>' + window.DataManager.formatCurrency(inst.installmentAmount) + '</td>' +
        '<td>' + window.DataManager.formatDate(inst.endDate) + ' ' + statusBadge + '</td>' +
        '<td>' +
          '<button class="btn btn-sm btn-outline" onclick="CardManager.openInstallmentModal(\'' + inst.id + '\')" title="Editar">✏️</button>' +
          '<button class="btn btn-sm btn-danger" onclick="CardManager.deleteInstallment(\'' + inst.id + '\')" title="Excluir">🗑️</button>' +
        '</td>' +
      '</tr>';
    });

    tbody.innerHTML = html;
  }

  // ----------------------------------------------------------
  // Alerts
  // ----------------------------------------------------------

  function renderAlerts() {
    var container = document.getElementById('cards-alerts');
    if (!container) return;

    var alerts = [];
    var settings = window.DataManager.getSettings();
    var cards = settings.cards || [];
    var today = todayISO();
    var installments = window.DataManager.getInstallments();

    // 1. High invoice warning (>R$300 monthly per card)
    cards.forEach(function (cardName) {
      var monthlyTotal = calculateMonthlyCardTotal(cardName);

      // Also count this month's credit card transactions
      var now = new Date();
      var monthTx = window.DataManager.getTransactionsByMonth(now.getFullYear(), now.getMonth() + 1);
      var ccTotal = 0;
      monthTx.forEach(function (tx) {
        if (tx.type === 'despesa' && tx.paymentMethod === 'Cartão de Crédito') {
          if (cardName.toLowerCase().indexOf('itaú') !== -1 || cardName.toLowerCase().indexOf('itau') !== -1) {
            if (tx.account && (tx.account.toLowerCase().indexOf('itaú') !== -1 || tx.account.toLowerCase().indexOf('itau') !== -1)) {
              ccTotal += tx.amount;
            }
          } else if (cardName.toLowerCase().indexOf('nubank') !== -1) {
            if (tx.account && tx.account.toLowerCase().indexOf('nubank') !== -1) {
              ccTotal += tx.amount;
            }
          }
        }
      });

      var totalInvoice = monthlyTotal + ccTotal;

      if (totalInvoice > 300) {
        alerts.push({
          type: 'warning',
          icon: '⚠️',
          title: 'Fatura alta — ' + cardName,
          message: 'A fatura atual do ' + cardName + ' está em ' +
            window.DataManager.formatCurrency(totalInvoice) + '.',
        });
      }
    });

    // 2. Long installments (>10 parcelas)
    installments.forEach(function (inst) {
      if (inst.installmentCount > 10 && inst.endDate >= today) {
        alerts.push({
          type: 'info',
          icon: 'ℹ️',
          title: 'Parcelamento longo',
          message: inst.description + ' possui ' + inst.installmentCount +
            ' parcelas (' + inst.currentInstallment + '/' + inst.installmentCount + ').',
        });
      }
    });

    // 3. Ending soon (within 30 days)
    installments.forEach(function (inst) {
      if (inst.endDate >= today) {
        var daysLeft = daysBetween(today, inst.endDate);
        if (daysLeft <= 30 && daysLeft >= 0) {
          alerts.push({
            type: 'danger',
            icon: '🔴',
            title: 'Vencimento próximo',
            message: inst.description + ' termina em ' +
              window.DataManager.formatDate(inst.endDate) +
              ' (' + daysLeft + ' dia' + (daysLeft !== 1 ? 's' : '') + ').',
          });
        }
      }
    });

    // Render alerts
    if (alerts.length === 0) {
      container.innerHTML = '<div class="alert alert-success"><span class="alert-icon">✅</span><div><strong>Tudo certo!</strong><p>Nenhum alerta no momento.</p></div></div>';
      return;
    }

    var html = '';
    alerts.forEach(function (alert) {
      html += '<div class="alert alert-' + alert.type + '">' +
        '<span class="alert-icon">' + alert.icon + '</span>' +
        '<div>' +
          '<strong>' + esc(alert.title) + '</strong>' +
          '<p>' + esc(alert.message) + '</p>' +
        '</div>' +
      '</div>';
    });

    container.innerHTML = html;
  }

  // ----------------------------------------------------------
  // Modal
  // ----------------------------------------------------------

  function populateModalCategories() {
    var select = document.getElementById('inst-category');
    if (!select) return;
    var settings = window.DataManager.getSettings();
    var categories = (settings.expenseCategories || []).concat(['Transferência']);
    select.innerHTML = '';
    categories.forEach(function (cat) {
      var opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });
  }

  function populateModalCards() {
    var select = document.getElementById('inst-card');
    if (!select) return;
    var settings = window.DataManager.getSettings();
    var cards = settings.cards || [];
    select.innerHTML = '';
    cards.forEach(function (card) {
      var opt = document.createElement('option');
      opt.value = card;
      opt.textContent = card;
      select.appendChild(opt);
    });
  }

  function openInstallmentModal(id) {
    var modal = document.getElementById('modal-installment');
    if (!modal) return;

    editingInstallmentId = id || null;
    populateModalCategories();
    populateModalCards();

    var titleEl = document.getElementById('modal-installment-title');

    if (id) {
      // Editing existing installment
      var installments = window.DataManager.getInstallments();
      var inst = installments.find(function (i) { return i.id === id; });
      if (!inst) {
        showToast('Parcelamento não encontrado.', 'error');
        return;
      }

      if (titleEl) titleEl.textContent = 'Editar Parcelamento';

      var descInput = document.getElementById('inst-description');
      var cardInput = document.getElementById('inst-card');
      var totalInput = document.getElementById('inst-total-amount');
      var countInput = document.getElementById('inst-count');
      var currentInput = document.getElementById('inst-current');
      var amountInput = document.getElementById('inst-amount');
      var categoryInput = document.getElementById('inst-category');
      var startInput = document.getElementById('inst-start');
      var endInput = document.getElementById('inst-end');

      if (descInput) descInput.value = inst.description || '';
      if (cardInput) cardInput.value = inst.card || '';
      if (totalInput) totalInput.value = inst.totalAmount || '';
      if (countInput) countInput.value = inst.installmentCount || '';
      if (currentInput) currentInput.value = inst.currentInstallment || '';
      if (amountInput) amountInput.value = inst.installmentAmount || '';
      if (categoryInput) categoryInput.value = inst.category || '';
      if (startInput) startInput.value = inst.startDate || '';
      if (endInput) endInput.value = inst.endDate || '';
    } else {
      // New installment
      if (titleEl) titleEl.textContent = 'Novo Parcelamento';

      var form = document.getElementById('installment-form');
      if (form) form.reset();

      var startInput2 = document.getElementById('inst-start');
      if (startInput2) startInput2.value = todayISO();
    }

    modal.removeAttribute('hidden');
  }

  function closeInstallmentModal() {
    var modal = document.getElementById('modal-installment');
    if (modal) {
      modal.setAttribute('hidden', '');
    }
    editingInstallmentId = null;

    var form = document.getElementById('installment-form');
    if (form) form.reset();
  }

  function handleInstallmentSubmit(e) {
    if (e) e.preventDefault();

    var descInput = document.getElementById('inst-description');
    var cardInput = document.getElementById('inst-card');
    var totalInput = document.getElementById('inst-total-amount');
    var countInput = document.getElementById('inst-count');
    var currentInput = document.getElementById('inst-current');
    var amountInput = document.getElementById('inst-amount');
    var categoryInput = document.getElementById('inst-category');
    var startInput = document.getElementById('inst-start');
    var endInput = document.getElementById('inst-end');

    var description = descInput ? descInput.value.trim() : '';
    var card = cardInput ? cardInput.value : '';
    var totalAmount = totalInput ? parseFloat(totalInput.value) : 0;
    var installmentCount = countInput ? parseInt(countInput.value, 10) : 0;
    var currentInstallment = currentInput ? parseInt(currentInput.value, 10) : 1;
    var installmentAmount = amountInput ? parseFloat(amountInput.value) : 0;
    var category = categoryInput ? categoryInput.value : '';
    var startDate = startInput ? startInput.value : '';
    var endDate = endInput ? endInput.value : '';

    // Validation
    if (!description) {
      showToast('Informe a descrição.', 'warning');
      return;
    }
    if (!card) {
      showToast('Selecione o cartão.', 'warning');
      return;
    }
    if (totalAmount <= 0) {
      showToast('Informe o valor total.', 'warning');
      return;
    }
    if (installmentCount <= 0) {
      showToast('Informe o número de parcelas.', 'warning');
      return;
    }
    if (installmentAmount <= 0) {
      showToast('Informe o valor da parcela.', 'warning');
      return;
    }
    if (!startDate || !endDate) {
      showToast('Informe as datas de início e término.', 'warning');
      return;
    }

    var data = {
      description: description,
      card: card,
      totalAmount: totalAmount,
      installmentCount: installmentCount,
      currentInstallment: currentInstallment,
      installmentAmount: installmentAmount,
      category: category,
      startDate: startDate,
      endDate: endDate,
    };

    if (editingInstallmentId) {
      window.DataManager.updateInstallment(editingInstallmentId, data);
      showToast('Parcelamento atualizado! ✓', 'success');
    } else {
      window.DataManager.addInstallment(data);
      showToast('Parcelamento adicionado! ✓', 'success');
    }

    closeInstallmentModal();
    render();
  }

  function deleteInstallment(id) {
    if (!confirm('Tem certeza que deseja excluir este parcelamento?')) return;

    var success = window.DataManager.deleteInstallment(id);
    if (success) {
      showToast('Parcelamento excluído!', 'success');
      render();
    } else {
      showToast('Erro ao excluir parcelamento.', 'error');
    }
  }

  // ----------------------------------------------------------
  // Auto-calculate installment amount
  // ----------------------------------------------------------

  function setupAutoCalc() {
    var totalInput = document.getElementById('inst-total-amount');
    var countInput = document.getElementById('inst-count');
    var amountInput = document.getElementById('inst-amount');

    function calc() {
      if (!totalInput || !countInput || !amountInput) return;
      var total = parseFloat(totalInput.value);
      var count = parseInt(countInput.value, 10);
      if (total > 0 && count > 0) {
        amountInput.value = (Math.round((total / count) * 100) / 100).toFixed(2);
      }
    }

    if (totalInput) totalInput.addEventListener('input', calc);
    if (countInput) countInput.addEventListener('input', calc);

    // Auto-calculate end date
    var startInput = document.getElementById('inst-start');
    var endInput = document.getElementById('inst-end');

    function calcEndDate() {
      if (!startInput || !endInput || !countInput) return;
      var start = startInput.value;
      var count = parseInt(countInput.value, 10);
      if (start && count > 0) {
        var d = new Date(start + 'T00:00:00');
        d.setMonth(d.getMonth() + count - 1);
        endInput.value = d.toISOString().slice(0, 10);
      }
    }

    if (startInput) startInput.addEventListener('change', calcEndDate);
    if (countInput) countInput.addEventListener('input', calcEndDate);
  }

  // ----------------------------------------------------------
  // Render All
  // ----------------------------------------------------------

  function render() {
    renderCardSummaries();
    renderInstallments();
    renderAlerts();
  }

  // ----------------------------------------------------------
  // Init
  // ----------------------------------------------------------

  function init() {
    // Button to open modal for new installment
    var addBtn = document.getElementById('btn-add-installment');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        openInstallmentModal(null);
      });
    }

    // Modal close buttons
    var closeBtn = document.getElementById('modal-installment-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeInstallmentModal);
    }

    var cancelBtn = document.getElementById('modal-installment-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeInstallmentModal);
    }

    // Modal save button
    var saveBtn = document.getElementById('modal-installment-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', handleInstallmentSubmit);
    }

    // Close modal on overlay click
    var modal = document.getElementById('modal-installment');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) {
          closeInstallmentModal();
        }
      });
    }

    // Setup auto-calculate
    setupAutoCalc();

    // Initial render
    render();
  }

  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------

  window.CardManager = {
    init: init,
    render: render,
    renderCardSummaries: renderCardSummaries,
    renderInstallments: renderInstallments,
    renderAlerts: renderAlerts,
    openInstallmentModal: openInstallmentModal,
    closeInstallmentModal: closeInstallmentModal,
    handleInstallmentSubmit: handleInstallmentSubmit,
    deleteInstallment: deleteInstallment,
    calculateMonthlyCardTotal: calculateMonthlyCardTotal,
  };
})();
