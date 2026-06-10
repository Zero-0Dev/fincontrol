// ============================================================
// data.js — Core Data Management Module (localStorage)
// Financeiro Pessoal — Personal Finance Application
// ============================================================

(function () {
  'use strict';

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------

  function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    var parts = dateString.split('-');
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  function formatMonth(dateString) {
    var months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    if (!dateString) return '';
    var parts = dateString.split('-');
    var monthIndex = parseInt(parts[1], 10) - 1;
    return months[monthIndex] + ' ' + parts[0];
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // ----------------------------------------------------------
  // Default Settings
  // ----------------------------------------------------------

  var DEFAULT_SETTINGS = {
    incomeCategories: ['Estágio', 'Trabalho de Final de Semana', 'Reembolso', 'Outros'],
    expenseCategories: [
      'Combustível', 'Alimentação', 'Lazer', 'Compras', 'Assinaturas',
      'Saúde', 'Transporte', 'Vestuário', 'Manutenção Veicular',
      'Seguro Veicular', 'Documentação Veicular', 'Estacionamento',
      'Pedágio', 'Marketplace', 'Amazon', 'Reserva', 'Consumo Pessoal', 'Diversos',
    ],
    subcategories: {
      'Alimentação': ['Almoço', 'Lanche', 'Supermercado', 'Delivery', 'Restaurante'],
      'Combustível': ['Gasolina', 'Etanol'],
      'Lazer': ['Cinema', 'Jogos', 'Streaming', 'Passeio', 'Evento'],
      'Compras': ['Online', 'Loja Física', 'Presente'],
      'Assinaturas': ['Spotify', 'Netflix', 'YouTube Premium', 'iCloud', 'Xbox Game Pass'],
      'Saúde': ['Farmácia', 'Consulta', 'Exame'],
      'Transporte': ['Uber', 'Ônibus', 'Estacionamento', 'Pedágio'],
      'Vestuário': ['Roupas', 'Calçados', 'Acessórios'],
      'Manutenção Veicular': ['Óleo', 'Filtro', 'Pneu', 'Revisão', 'Lavagem'],
      'Consumo Pessoal': ['Higiene', 'Cuidados Pessoais', 'Barbeiro'],
      'Diversos': ['Outros', 'Imprevisto'],
    },
    banks: ['Itaú Principal', 'Itaú Secundária', 'Nubank'],
    cards: ['Cartão Itaú', 'Cartão Nubank'],
    paymentMethods: ['Dinheiro', 'Pix', 'Cartão de Débito', 'Cartão de Crédito', 'Transferência'],
    monthlyIncome: 1550,
    extraIncome: 250,
  };

  // ----------------------------------------------------------
  // Default Accounts
  // ----------------------------------------------------------

  var DEFAULT_ACCOUNTS = [
    { id: generateId(), name: 'Itaú Principal', initialBalance: 1200, type: 'corrente' },
    { id: generateId(), name: 'Itaú Secundária', initialBalance: 300, type: 'poupança' },
    { id: generateId(), name: 'Nubank', initialBalance: 850, type: 'corrente' },
  ];

  // ----------------------------------------------------------
  // Sample Data Generator
  // ----------------------------------------------------------

  function buildSampleData() {
    // Returns clean empty structure — no fake data
    return {
      transactions: [],
      accounts: deepClone(DEFAULT_ACCOUNTS),
      installments: [],
      patrimony: [],
      goals: [],
      vehicle: { fuelLogs: [], maintenanceLogs: [], documents: [] },
      settings: deepClone(DEFAULT_SETTINGS),
    };
  }

  // ----------------------------------------------------------
  // Storage Key
  // ----------------------------------------------------------

  var STORAGE_KEY = 'financeApp';

  // ----------------------------------------------------------
  // Core I/O
  // ----------------------------------------------------------

  function getData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error('[DataManager] Failed to read data:', e);
      return null;
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('[DataManager] Failed to save data:', e);
      return false;
    }
  }

  function init() {
    var existing = getData();
    if (!existing) {
      var sample = buildSampleData();
      saveData(sample);
      console.log('[DataManager] Initialised with sample data.');
      return sample;
    }
    // Migrate: ensure all keys exist
    var changed = false;
    if (!existing.vehicle) { existing.vehicle = { fuelLogs: [], maintenanceLogs: [], documents: [] }; changed = true; }
    if (!existing.goals) { existing.goals = []; changed = true; }
    if (!existing.patrimony) { existing.patrimony = []; changed = true; }
    if (!existing.installments) { existing.installments = []; changed = true; }
    if (!existing.settings) { existing.settings = deepClone(DEFAULT_SETTINGS); changed = true; }
    if (changed) saveData(existing);
    return existing;
  }

  // ----------------------------------------------------------
  // Transactions
  // ----------------------------------------------------------

  function addTransaction(transaction) {
    var data = getData();
    var record = Object.assign({}, transaction, {
      id: transaction.id || generateId(),
      createdAt: new Date().toISOString(),
    });
    data.transactions.push(record);
    saveData(data);
    return record;
  }

  function updateTransaction(id, updates) {
    var data = getData();
    var idx = data.transactions.findIndex(function (t) { return t.id === id; });
    if (idx === -1) return null;
    Object.assign(data.transactions[idx], updates);
    saveData(data);
    return data.transactions[idx];
  }

  function deleteTransaction(id) {
    var data = getData();
    var len = data.transactions.length;
    data.transactions = data.transactions.filter(function (t) { return t.id !== id; });
    if (data.transactions.length === len) return false;
    saveData(data);
    return true;
  }

  function getTransactions(filters) {
    var data = getData();
    var list = data.transactions || [];
    if (!filters) return list;

    return list.filter(function (t) {
      if (filters.type && t.type !== filters.type) return false;
      if (filters.category && t.category !== filters.category) return false;
      if (filters.account && t.account !== filters.account) return false;
      if (filters.month !== undefined && filters.year !== undefined) {
        var parts = t.date.split('-');
        if (parseInt(parts[0], 10) !== filters.year) return false;
        if (parseInt(parts[1], 10) !== filters.month) return false;
      }
      return true;
    });
  }

  function getTransactionsByMonth(year, month) {
    return getTransactions({ year: year, month: month });
  }

  function getTransactionsByDateRange(startDate, endDate) {
    var data = getData();
    return (data.transactions || []).filter(function (t) {
      return t.date >= startDate && t.date <= endDate;
    });
  }

  // ----------------------------------------------------------
  // Accounts
  // ----------------------------------------------------------

  function getAccounts() {
    var data = getData();
    return data.accounts || [];
  }

  function updateAccountBalance(id, balance) {
    var data = getData();
    var account = data.accounts.find(function (a) { return a.id === id; });
    if (!account) return null;
    account.initialBalance = balance;
    saveData(data);
    return account;
  }

  function getAccountBalance(accountName) {
    var data = getData();
    var account = data.accounts.find(function (a) { return a.name === accountName; });
    if (!account) return 0;
    var balance = account.initialBalance;
    (data.transactions || []).forEach(function (t) {
      if (t.account !== accountName) return;
      if (t.type === 'receita') balance += t.amount;
      else if (t.type === 'despesa') balance -= t.amount;
    });
    return Math.round(balance * 100) / 100;
  }

  function getAccountSummary(accountName) {
    var data = getData();
    var account = data.accounts.find(function (a) { return a.name === accountName; });
    var initial = account ? account.initialBalance : 0;
    var income = 0;
    var expenses = 0;
    (data.transactions || []).forEach(function (t) {
      if (t.account !== accountName) return;
      if (t.type === 'receita') income += t.amount;
      else if (t.type === 'despesa') expenses += t.amount;
    });
    return {
      balance: Math.round((initial + income - expenses) * 100) / 100,
      income: Math.round(income * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      initialBalance: initial,
    };
  }

  // ----------------------------------------------------------
  // Installments
  // ----------------------------------------------------------

  function addInstallment(installment) {
    var data = getData();
    var record = Object.assign({}, installment, {
      id: installment.id || generateId(),
    });
    data.installments.push(record);
    saveData(data);
    return record;
  }

  function updateInstallment(id, updates) {
    var data = getData();
    var idx = data.installments.findIndex(function (i) { return i.id === id; });
    if (idx === -1) return null;
    Object.assign(data.installments[idx], updates);
    saveData(data);
    return data.installments[idx];
  }

  function deleteInstallment(id) {
    var data = getData();
    var len = data.installments.length;
    data.installments = data.installments.filter(function (i) { return i.id !== id; });
    if (data.installments.length === len) return false;
    saveData(data);
    return true;
  }

  function getInstallments() {
    var data = getData();
    return data.installments || [];
  }

  function getActiveInstallments() {
    var today = new Date().toISOString().slice(0, 10);
    return getInstallments().filter(function (i) {
      return i.endDate >= today && i.currentInstallment <= i.installmentCount;
    });
  }

  function getUpcomingPayments() {
    var today = new Date().toISOString().slice(0, 10);
    var nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    var limit = nextMonth.toISOString().slice(0, 10);

    return getInstallments()
      .filter(function (i) { return i.endDate >= today; })
      .map(function (i) {
        return {
          description: i.description,
          amount: i.installmentAmount,
          remaining: i.installmentCount - i.currentInstallment + 1,
          card: i.card,
          nextDate: i.startDate, // simplified
        };
      });
  }

  // ----------------------------------------------------------
  // Patrimony
  // ----------------------------------------------------------

  function addPatrimonySnapshot(date, amount) {
    var data = getData();
    var existing = data.patrimony.findIndex(function (p) { return p.date === date; });
    if (existing !== -1) {
      data.patrimony[existing].amount = amount;
    } else {
      data.patrimony.push({ date: date, amount: amount });
      data.patrimony.sort(function (a, b) { return a.date.localeCompare(b.date); });
    }
    saveData(data);
    return true;
  }

  function getPatrimonyHistory() {
    var data = getData();
    return (data.patrimony || []).slice().sort(function (a, b) {
      return a.date.localeCompare(b.date);
    });
  }

  function getCurrentPatrimony() {
    var history = getPatrimonyHistory();
    if (history.length === 0) return 0;
    return history[history.length - 1].amount;
  }

  // ----------------------------------------------------------
  // Goals
  // ----------------------------------------------------------

  function addGoal(goal) {
    var data = getData();
    var record = Object.assign({}, goal, { id: goal.id || generateId() });
    data.goals.push(record);
    saveData(data);
    return record;
  }

  function updateGoal(id, updates) {
    var data = getData();
    var idx = data.goals.findIndex(function (g) { return g.id === id; });
    if (idx === -1) return null;
    Object.assign(data.goals[idx], updates);
    saveData(data);
    return data.goals[idx];
  }

  function deleteGoal(id) {
    var data = getData();
    var len = data.goals.length;
    data.goals = data.goals.filter(function (g) { return g.id !== id; });
    if (data.goals.length === len) return false;
    saveData(data);
    return true;
  }

  function getGoals() {
    var data = getData();
    return data.goals || [];
  }

  // ----------------------------------------------------------
  // Vehicle
  // ----------------------------------------------------------

  function getVehicleData() {
    var data = getData();
    if (!data.vehicle) {
      data.vehicle = { fuelLogs: [], maintenanceLogs: [], documents: [] };
      saveData(data);
    }
    return data.vehicle;
  }

  function addFuelLog(log) {
    var data = getData();
    var record = Object.assign({}, log, { id: log.id || generateId() });
    data.vehicle.fuelLogs.push(record);
    data.vehicle.fuelLogs.sort(function (a, b) { return b.date.localeCompare(a.date); });
    saveData(data);
    return record;
  }

  function addMaintenanceLog(log) {
    var data = getData();
    var record = Object.assign({}, log, { id: log.id || generateId() });
    data.vehicle.maintenanceLogs.push(record);
    data.vehicle.maintenanceLogs.sort(function (a, b) { return b.date.localeCompare(a.date); });
    saveData(data);
    return record;
  }

  function addVehicleDocument(doc) {
    var data = getData();
    var record = Object.assign({}, doc, { id: doc.id || generateId() });
    data.vehicle.documents.push(record);
    saveData(data);
    return record;
  }

  function getVehicleLogs() {
    return getVehicleData();
  }

  function getAverageFuelConsumption() {
    var logs = getVehicleData().fuelLogs;
    if (logs.length < 2) return { kmPerLiter: 0, costPerKm: 0, avgPricePerLiter: 0 };

    var sorted = logs.slice().sort(function (a, b) { return a.km - b.km; });
    var totalKm = sorted[sorted.length - 1].km - sorted[0].km;
    var totalLiters = 0;
    var totalCost = 0;
    // Skip the first log (baseline odometer reading)
    for (var i = 1; i < sorted.length; i++) {
      totalLiters += sorted[i].liters;
      totalCost += sorted[i].totalCost;
    }
    var kmPerLiter = totalLiters > 0 ? totalKm / totalLiters : 0;
    var costPerKm = totalKm > 0 ? totalCost / totalKm : 0;
    var avgPrice = totalLiters > 0 ? totalCost / totalLiters : 0;

    return {
      kmPerLiter: Math.round(kmPerLiter * 100) / 100,
      costPerKm: Math.round(costPerKm * 100) / 100,
      avgPricePerLiter: Math.round(avgPrice * 100) / 100,
      totalKm: totalKm,
      totalLiters: Math.round(totalLiters * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
    };
  }

  function getVehicleTotalCosts() {
    var v = getVehicleData();
    var fuelTotal = v.fuelLogs.reduce(function (sum, l) { return sum + l.totalCost; }, 0);
    var maintTotal = v.maintenanceLogs.reduce(function (sum, l) { return sum + l.cost; }, 0);
    var docTotal = v.documents.reduce(function (sum, d) { return sum + (d.cost || 0); }, 0);
    return {
      fuel: Math.round(fuelTotal * 100) / 100,
      maintenance: Math.round(maintTotal * 100) / 100,
      documents: Math.round(docTotal * 100) / 100,
      total: Math.round((fuelTotal + maintTotal + docTotal) * 100) / 100,
    };
  }

  // ----------------------------------------------------------
  // Analytics
  // ----------------------------------------------------------

  function getMonthlyTotals(year, month) {
    var txs = getTransactionsByMonth(year, month);
    var income = 0;
    var expenses = 0;
    txs.forEach(function (t) {
      if (t.type === 'receita') income += t.amount;
      else if (t.type === 'despesa') expenses += t.amount;
    });
    var savings = income - expenses;
    var savingsRate = income > 0 ? (savings / income) * 100 : 0;
    return {
      income: Math.round(income * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      savings: Math.round(savings * 100) / 100,
      savingsRate: Math.round(savingsRate * 10) / 10,
      transactionCount: txs.length,
    };
  }

  function getCategoryTotals(year, month) {
    var txs = getTransactionsByMonth(year, month);
    var result = {};
    txs.forEach(function (t) {
      if (t.type !== 'despesa') return;
      if (!result[t.category]) result[t.category] = 0;
      result[t.category] += t.amount;
    });
    // Round
    Object.keys(result).forEach(function (k) {
      result[k] = Math.round(result[k] * 100) / 100;
    });
    return result;
  }

  function getPaymentMethodTotals(year, month) {
    var txs = getTransactionsByMonth(year, month);
    var result = {};
    txs.forEach(function (t) {
      if (t.type !== 'despesa') return;
      if (!result[t.paymentMethod]) result[t.paymentMethod] = 0;
      result[t.paymentMethod] += t.amount;
    });
    Object.keys(result).forEach(function (k) {
      result[k] = Math.round(result[k] * 100) / 100;
    });
    return result;
  }

  function getMonthlyHistory(months) {
    var result = [];
    var now = new Date();
    for (var i = months - 1; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var y = d.getFullYear();
      var m = d.getMonth() + 1;
      var totals = getMonthlyTotals(y, m);
      var label = y + '-' + String(m).padStart(2, '0');
      result.push(Object.assign({ month: label }, totals));
    }
    return result;
  }

  function getDailyAverage(year, month) {
    var totals = getMonthlyTotals(year, month);
    var daysInMonth = new Date(year, month, 0).getDate();

    // If the month is the current month, use days elapsed
    var today = new Date();
    var daysElapsed = daysInMonth;
    if (today.getFullYear() === year && today.getMonth() + 1 === month) {
      daysElapsed = today.getDate();
    }

    return {
      dailyExpense: daysElapsed > 0 ? Math.round((totals.expenses / daysElapsed) * 100) / 100 : 0,
      dailyIncome: daysElapsed > 0 ? Math.round((totals.income / daysElapsed) * 100) / 100 : 0,
      daysElapsed: daysElapsed,
      daysInMonth: daysInMonth,
      projectedExpense: daysElapsed > 0 ? Math.round(((totals.expenses / daysElapsed) * daysInMonth) * 100) / 100 : 0,
    };
  }

  function getPatrimonyProjection(months) {
    var history = getPatrimonyHistory();
    if (history.length < 2) return [];

    // Average monthly growth
    var growthRates = [];
    for (var i = 1; i < history.length; i++) {
      var growth = history[i].amount - history[i - 1].amount;
      growthRates.push(growth);
    }
    var avgGrowth = growthRates.reduce(function (a, b) { return a + b; }, 0) / growthRates.length;
    var last = history[history.length - 1];
    var lastDate = last.date; // "YYYY-MM"

    var projection = [];
    var current = last.amount;
    var parts = lastDate.split('-');
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);

    for (var j = 1; j <= months; j++) {
      month++;
      if (month > 12) { month = 1; year++; }
      current += avgGrowth;
      projection.push({
        date: year + '-' + String(month).padStart(2, '0'),
        amount: Math.round(current * 100) / 100,
        isProjection: true,
      });
    }
    return projection;
  }

  function getBestWorstMonths() {
    var data = getData();
    var monthMap = {};
    (data.transactions || []).forEach(function (t) {
      var key = t.date.slice(0, 7); // "YYYY-MM"
      if (!monthMap[key]) monthMap[key] = { income: 0, expenses: 0 };
      if (t.type === 'receita') monthMap[key].income += t.amount;
      else if (t.type === 'despesa') monthMap[key].expenses += t.amount;
    });

    var entries = Object.keys(monthMap).map(function (k) {
      return {
        month: k,
        savings: Math.round((monthMap[k].income - monthMap[k].expenses) * 100) / 100,
        income: Math.round(monthMap[k].income * 100) / 100,
        expenses: Math.round(monthMap[k].expenses * 100) / 100,
      };
    });

    if (entries.length === 0) return { best: null, worst: null };

    entries.sort(function (a, b) { return b.savings - a.savings; });
    return {
      best: entries[0],
      worst: entries[entries.length - 1],
    };
  }

  function getAutonomyMonths() {
    var patrimony = getCurrentPatrimony();
    if (patrimony <= 0) return 0;

    var history = getMonthlyHistory(6);
    var expenseMonths = history.filter(function (m) { return m.expenses > 0; });
    if (expenseMonths.length === 0) return Infinity;

    var avgExpense = expenseMonths.reduce(function (s, m) { return s + m.expenses; }, 0) / expenseMonths.length;
    if (avgExpense <= 0) return Infinity;

    return Math.round((patrimony / avgExpense) * 10) / 10;
  }

  function getAlerts() {
    var alerts = [];
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var settings = getSettings();
    var totals = getMonthlyTotals(year, month);
    var dailyAvg = getDailyAverage(year, month);

    // 1. Overspending alert
    var budget = (settings.monthlyIncome || 1550) + (settings.extraIncome || 250);
    if (totals.expenses > budget * 0.8) {
      alerts.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Gastos elevados',
        message: 'Você já gastou ' + formatCurrency(totals.expenses) +
          ' este mês (' + Math.round((totals.expenses / budget) * 100) + '% da renda).',
      });
    }

    // 2. Projected overspending
    if (dailyAvg.projectedExpense > budget) {
      alerts.push({
        type: 'danger',
        icon: '🚨',
        title: 'Projeção de gastos acima da renda',
        message: 'Projeção de ' + formatCurrency(dailyAvg.projectedExpense) +
          ' para o mês, acima da renda de ' + formatCurrency(budget) + '.',
      });
    }

    // 3. Low savings rate
    if (totals.savingsRate < 10 && totals.income > 0) {
      alerts.push({
        type: 'warning',
        icon: '📉',
        title: 'Taxa de economia baixa',
        message: 'Sua taxa de economia este mês é de apenas ' + totals.savingsRate + '%.',
      });
    }

    // 4. Negative savings
    if (totals.savings < 0) {
      alerts.push({
        type: 'danger',
        icon: '🔴',
        title: 'Gastos acima da receita',
        message: 'Você gastou ' + formatCurrency(Math.abs(totals.savings)) + ' a mais do que recebeu este mês.',
      });
    }

    // 5. Upcoming vehicle documents
    var vehicle = getVehicleData();
    var thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    var thirtyStr = thirtyDays.toISOString().slice(0, 10);
    var todayStr = now.toISOString().slice(0, 10);

    vehicle.documents.forEach(function (doc) {
      if (doc.status === 'pendente' && doc.dueDate <= thirtyStr) {
        var isOverdue = doc.dueDate < todayStr;
        alerts.push({
          type: isOverdue ? 'danger' : 'info',
          icon: isOverdue ? '🔴' : '📋',
          title: doc.type + (isOverdue ? ' vencido!' : ' próximo do vencimento'),
          message: doc.type + ' com vencimento em ' + formatDate(doc.dueDate) +
            ' — ' + formatCurrency(doc.cost) + '.',
        });
      }
    });

    // 6. Active installments ending soon
    var activeInstallments = getActiveInstallments();
    activeInstallments.forEach(function (inst) {
      if (inst.currentInstallment >= inst.installmentCount) {
        alerts.push({
          type: 'info',
          icon: '🎉',
          title: 'Última parcela!',
          message: inst.description + ' — última parcela de ' + formatCurrency(inst.installmentAmount) + '.',
        });
      }
    });

    // 7. Goals close to deadline
    var goals = getGoals();
    goals.forEach(function (g) {
      var pct = g.target > 0 ? (g.current / g.target) * 100 : 0;
      if (g.deadline && g.deadline <= thirtyStr && pct < 100) {
        alerts.push({
          type: 'warning',
          icon: '🎯',
          title: 'Meta próxima do prazo',
          message: g.name + ': ' + Math.round(pct) + '% concluída, prazo em ' + formatDate(g.deadline) + '.',
        });
      }
    });

    // 8. Patrimony milestone
    var patrimony = getCurrentPatrimony();
    var milestones = [1000, 2500, 5000, 10000, 25000, 50000];
    milestones.forEach(function (m) {
      if (patrimony >= m && patrimony < m * 1.05) {
        alerts.push({
          type: 'success',
          icon: '🏆',
          title: 'Marco atingido!',
          message: 'Seu patrimônio atingiu ' + formatCurrency(m) + '!',
        });
      }
    });

    return alerts;
  }

  // ----------------------------------------------------------
  // Settings
  // ----------------------------------------------------------

  function getSettings() {
    var data = getData();
    return data.settings || deepClone(DEFAULT_SETTINGS);
  }

  function updateSettings(updates) {
    var data = getData();
    Object.assign(data.settings, updates);
    saveData(data);
    return data.settings;
  }

  function addCategory(type, category) {
    var data = getData();
    var key = type === 'receita' ? 'incomeCategories' : 'expenseCategories';
    if (data.settings[key].indexOf(category) !== -1) return false;
    data.settings[key].push(category);
    saveData(data);
    return true;
  }

  function removeCategory(type, category) {
    var data = getData();
    var key = type === 'receita' ? 'incomeCategories' : 'expenseCategories';
    var idx = data.settings[key].indexOf(category);
    if (idx === -1) return false;
    data.settings[key].splice(idx, 1);
    saveData(data);
    return true;
  }

  // ----------------------------------------------------------
  // Export / Import
  // ----------------------------------------------------------

  function exportToCSV() {
    var data = getData();
    var txs = data.transactions || [];
    if (txs.length === 0) return '';

    var headers = ['Data', 'Tipo', 'Categoria', 'Subcategoria', 'Valor', 'Método Pagamento', 'Conta', 'Observações'];
    var rows = [headers.join(';')];

    txs.sort(function (a, b) { return a.date.localeCompare(b.date); });

    txs.forEach(function (t) {
      var row = [
        formatDate(t.date),
        t.type === 'receita' ? 'Receita' : 'Despesa',
        t.category,
        t.subcategory || '',
        t.amount.toFixed(2).replace('.', ','),
        t.paymentMethod,
        t.account,
        (t.notes || '').replace(/;/g, ','),
      ];
      rows.push(row.join(';'));
    });

    var csv = rows.join('\n');
    var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'financeiro_pessoal_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return csv;
  }

  function exportToJSON() {
    var data = getData();
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'financeiro_pessoal_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return json;
  }

  function importFromJSON(jsonString) {
    try {
      var imported = JSON.parse(jsonString);
      // Validate basic structure
      if (!imported.transactions || !Array.isArray(imported.transactions)) {
        throw new Error('Formato inválido: "transactions" não encontrado ou não é um array.');
      }
      if (!imported.settings) {
        throw new Error('Formato inválido: "settings" não encontrado.');
      }
      // Ensure all required keys
      if (!imported.accounts) imported.accounts = [];
      if (!imported.installments) imported.installments = [];
      if (!imported.patrimony) imported.patrimony = [];
      if (!imported.goals) imported.goals = [];
      if (!imported.vehicle) imported.vehicle = { fuelLogs: [], maintenanceLogs: [], documents: [] };

      saveData(imported);
      return { success: true, transactionCount: imported.transactions.length };
    } catch (e) {
      console.error('[DataManager] Import failed:', e);
      return { success: false, error: e.message };
    }
  }

  function resetAllData() {
    localStorage.removeItem(STORAGE_KEY);
    var sample = buildSampleData();
    saveData(sample);
    return sample;
  }

  // ----------------------------------------------------------
  // Google Sheets API Integration
  // ----------------------------------------------------------

  var API_URL_KEY = 'financeApp_apiUrl';
  var LAST_SYNC_KEY = 'financeApp_lastSync';

  function getApiUrl() {
    return localStorage.getItem(API_URL_KEY) || '';
  }

  function setApiUrl(url) {
    localStorage.setItem(API_URL_KEY, url);
  }

  function isConnected() {
    return !!getApiUrl();
  }

  function getLastSync() {
    return localStorage.getItem(LAST_SYNC_KEY) || null;
  }

  // Convert Google Sheets data format to app format
  function convertSheetsData(sheetsData) {
    var data = getData() || buildSampleData();

    // Convert transactions
    if (sheetsData.transactions && sheetsData.transactions.length > 0) {
      data.transactions = sheetsData.transactions.map(function(row) {
        return {
          id: generateId(),
          date: row['Data'] || '',
          type: (row['Tipo'] || '').toLowerCase() === 'receita' ? 'receita' : 'despesa',
          category: row['Categoria'] || 'Diversos',
          subcategory: row['Subcategoria'] || '',
          amount: parseFloat(row['Valor']) || 0,
          paymentMethod: row['Forma de Pagamento'] || 'Pix',
          account: row['Conta'] || 'Nubank',
          notes: row['Observação'] || row['Observacao'] || '',
          createdAt: new Date().toISOString()
        };
      }).filter(function(t) { return t.date && t.amount > 0; });
    }

    // Convert accounts
    if (sheetsData.accounts && sheetsData.accounts.length > 0) {
      data.accounts = sheetsData.accounts.map(function(row) {
        return {
          id: generateId(),
          name: row['Conta'] || '',
          initialBalance: parseFloat(row['Saldo Inicial']) || 0,
          type: (row['Tipo'] || 'corrente').toLowerCase()
        };
      }).filter(function(a) { return a.name; });
    }

    // Convert installments
    if (sheetsData.installments && sheetsData.installments.length > 0) {
      data.installments = sheetsData.installments.map(function(row) {
        return {
          id: generateId(),
          description: row['Descrição'] || row['Descricao'] || '',
          card: row['Cartão'] || row['Cartao'] || '',
          totalAmount: parseFloat(row['Valor Total']) || 0,
          installmentCount: parseInt(row['Parcelas']) || 1,
          currentInstallment: parseInt(row['Parcela Atual']) || 1,
          installmentAmount: parseFloat(row['Valor Parcela']) || 0,
          startDate: row['Data Início'] || row['Data Inicio'] || '',
          endDate: row['Data Término'] || row['Data Termino'] || '',
          category: row['Categoria'] || ''
        };
      }).filter(function(i) { return i.description; });
    }

    // Convert patrimony
    if (sheetsData.patrimony && sheetsData.patrimony.length > 0) {
      data.patrimony = sheetsData.patrimony.map(function(row) {
        return {
          date: row['Mês'] || row['Mes'] || '',
          amount: parseFloat(row['Valor']) || 0
        };
      }).filter(function(p) { return p.date && p.amount > 0; });
      data.patrimony.sort(function(a, b) { return a.date.localeCompare(b.date); });
    }

    // Convert goals
    if (sheetsData.goals && sheetsData.goals.length > 0) {
      data.goals = sheetsData.goals.map(function(row) {
        return {
          id: generateId(),
          name: row['Nome'] || '',
          target: parseFloat(row['Meta']) || 0,
          current: parseFloat(row['Atual']) || 0,
          deadline: row['Prazo'] || '',
          icon: row['Ícone'] || row['Icone'] || '🎯',
          color: row['Cor'] || '#6366f1'
        };
      }).filter(function(g) { return g.name; });
    }

    // Convert vehicle logs
    if (sheetsData.vehicle && sheetsData.vehicle.length > 0) {
      data.vehicle = { fuelLogs: [], maintenanceLogs: [], documents: [] };
      sheetsData.vehicle.forEach(function(row) {
        var tipo = (row['Tipo'] || '').toLowerCase();
        if (tipo === 'abastecimento') {
          data.vehicle.fuelLogs.push({
            id: generateId(),
            date: row['Data'] || '',
            km: parseFloat(row['KM']) || 0,
            liters: parseFloat(row['Litros']) || 0,
            pricePerLiter: parseFloat(row['R$/L']) || 0,
            totalCost: parseFloat(row['Total']) || 0,
            station: row['Descrição'] || row['Descricao'] || '',
            notes: ''
          });
        } else {
          data.vehicle.maintenanceLogs.push({
            id: generateId(),
            date: row['Data'] || '',
            type: row['Tipo'] || '',
            description: row['Descrição'] || row['Descricao'] || '',
            cost: parseFloat(row['Total']) || 0,
            km: parseFloat(row['KM']) || 0,
            notes: ''
          });
        }
      });
    }

    // Convert config/settings
    if (sheetsData.config && typeof sheetsData.config === 'object' && !Array.isArray(sheetsData.config)) {
      var cfg = sheetsData.config;
      if (cfg['Categorias Receita']) data.settings.incomeCategories = cfg['Categorias Receita'];
      if (cfg['Categorias Despesa']) data.settings.expenseCategories = cfg['Categorias Despesa'];
      if (cfg['Bancos']) data.settings.banks = cfg['Bancos'];
      if (cfg['Cartões'] || cfg['Cartoes']) data.settings.cards = cfg['Cartões'] || cfg['Cartoes'];
      if (cfg['Pagamentos']) data.settings.paymentMethods = cfg['Pagamentos'];
    }

    return data;
  }

  // Sync data from Google Sheets
  async function syncFromSheets() {
    var url = getApiUrl();
    if (!url) {
      return { success: false, error: 'URL da API não configurada' };
    }

    try {
      var response = await fetch(url + '?action=getAllData');
      if (!response.ok) throw new Error('HTTP ' + response.status);
      
      var sheetsData = await response.json();
      if (sheetsData.error) throw new Error(sheetsData.error);

      var converted = convertSheetsData(sheetsData);
      saveData(converted);
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

      console.log('[DataManager] Sincronizado com Google Sheets ✓');
      return { success: true, lastUpdated: sheetsData.lastUpdated };
    } catch (err) {
      console.error('[DataManager] Erro na sincronização:', err);
      return { success: false, error: err.message };
    }
  }

  // Post data to Google Sheets
  async function postToSheets(action, postData) {
    var url = getApiUrl();
    if (!url) return { success: false, error: 'API não configurada' };

    try {
      var response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: action, data: postData })
      });
      var result = await response.json();
      return result;
    } catch (err) {
      console.error('[DataManager] Erro ao enviar para planilha:', err);
      return { success: false, error: err.message };
    }
  }

  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------

  window.DataManager = {
    // Core
    init: init,
    getData: getData,
    saveData: saveData,

    // Transactions
    addTransaction: addTransaction,
    updateTransaction: updateTransaction,
    deleteTransaction: deleteTransaction,
    getTransactions: getTransactions,
    getTransactionsByMonth: getTransactionsByMonth,
    getTransactionsByDateRange: getTransactionsByDateRange,

    // Accounts
    getAccounts: getAccounts,
    updateAccountBalance: updateAccountBalance,
    getAccountBalance: getAccountBalance,
    getAccountSummary: getAccountSummary,

    // Installments
    addInstallment: addInstallment,
    updateInstallment: updateInstallment,
    deleteInstallment: deleteInstallment,
    getInstallments: getInstallments,
    getActiveInstallments: getActiveInstallments,
    getUpcomingPayments: getUpcomingPayments,

    // Patrimony
    addPatrimonySnapshot: addPatrimonySnapshot,
    getPatrimonyHistory: getPatrimonyHistory,
    getCurrentPatrimony: getCurrentPatrimony,

    // Goals
    addGoal: addGoal,
    updateGoal: updateGoal,
    deleteGoal: deleteGoal,
    getGoals: getGoals,

    // Vehicle
    addFuelLog: addFuelLog,
    addMaintenanceLog: addMaintenanceLog,
    addVehicleDocument: addVehicleDocument,
    getVehicleLogs: getVehicleLogs,
    getAverageFuelConsumption: getAverageFuelConsumption,
    getVehicleTotalCosts: getVehicleTotalCosts,

    // Analytics
    getMonthlyTotals: getMonthlyTotals,
    getCategoryTotals: getCategoryTotals,
    getPaymentMethodTotals: getPaymentMethodTotals,
    getMonthlyHistory: getMonthlyHistory,
    getDailyAverage: getDailyAverage,
    getPatrimonyProjection: getPatrimonyProjection,
    getBestWorstMonths: getBestWorstMonths,
    getAutonomyMonths: getAutonomyMonths,
    getAlerts: getAlerts,

    // Settings
    getSettings: getSettings,
    updateSettings: updateSettings,
    addCategory: addCategory,
    removeCategory: removeCategory,

    // Export/Import
    exportToCSV: exportToCSV,
    exportToJSON: exportToJSON,
    importFromJSON: importFromJSON,
    resetAllData: resetAllData,

    // Google Sheets Sync
    getApiUrl: getApiUrl,
    setApiUrl: setApiUrl,
    isConnected: isConnected,
    syncFromSheets: syncFromSheets,
    postToSheets: postToSheets,
    getLastSync: getLastSync,

    // Utilities
    generateId: generateId,
    formatCurrency: formatCurrency,
    formatDate: formatDate,
    formatMonth: formatMonth,
  };
})();
