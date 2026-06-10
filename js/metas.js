// ============================================================
// metas.js — Goals Tab UI Manager
// Financeiro Pessoal — Personal Finance Application
// ============================================================

(function () {
  'use strict';

  // ----------------------------------------------------------
  // Constants
  // ----------------------------------------------------------

  var GOAL_COLORS = {
    indigo: '#6366f1',
    green: '#10b981',
    amber: '#f59e0b',
    pink: '#ec4899',
    cyan: '#06b6d4',
  };

  var GOAL_ICONS = ['🎯', '🚗', '💻', '🏠', '🎓', '✈️', '💰', '🛡️'];

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------

  function esc(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function resolveColor(colorKey) {
    if (colorKey && colorKey.charAt(0) === '#') return colorKey;
    return GOAL_COLORS[colorKey] || GOAL_COLORS.indigo;
  }

  // ----------------------------------------------------------
  // Init
  // ----------------------------------------------------------

  function init() {
    // "Nova Meta" button
    var addBtn = document.getElementById('btn-add-goal');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        openGoalModal(null);
      });
    }

    // Modal close/cancel buttons
    var closeBtn = document.getElementById('modal-goal-close');
    var cancelBtn = document.getElementById('modal-goal-cancel');
    var saveBtn = document.getElementById('modal-goal-save');

    if (closeBtn) closeBtn.addEventListener('click', closeGoalModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeGoalModal);
    if (saveBtn) saveBtn.addEventListener('click', handleGoalSubmit);

    // Close modal on overlay click
    var overlay = document.getElementById('modal-goal');
    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeGoalModal();
      });
    }

    render();
  }

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  function render() {
    renderGoals();
  }

  // ----------------------------------------------------------
  // Render Goals
  // ----------------------------------------------------------

  function renderGoals() {
    var container = document.getElementById('goals-container');
    if (!container) return;

    var DM = window.DataManager;
    var goals = DM.getGoals();

    if (goals.length === 0) {
      container.innerHTML =
        '<div style="text-align:center;padding:48px 24px;color:#888;">' +
        '<p style="font-size:48px;margin:0 0 16px;">🎯</p>' +
        '<p style="font-size:16px;margin:0 0 8px;">Nenhuma meta cadastrada</p>' +
        '<p style="font-size:14px;color:#666;">Clique em "Nova Meta" para começar a planejar seus objetivos financeiros.</p>' +
        '</div>';
      return;
    }

    var html = '';
    goals.forEach(function (goal) {
      var color = resolveColor(goal.color);
      var percent = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
      var remaining = Math.max(goal.target - goal.current, 0);
      var timeEstimate = calculateTimeToGoal(goal);
      var deadlineFormatted = goal.deadline ? DM.formatMonth(goal.deadline + '-01') : 'Sem prazo';

      // If deadline is a date (YYYY-MM-DD), format properly
      if (goal.deadline && goal.deadline.length === 10) {
        deadlineFormatted = DM.formatDate(goal.deadline);
      }

      html += '<div class="goal-card" style="--goal-color: ' + color + '">';

      // Header
      html += '<div class="goal-header">';
      html += '<span class="goal-icon">' + (goal.icon || '🎯') + '</span>';
      html += '<div>';
      html += '<h3 class="goal-name">' + esc(goal.name) + '</h3>';
      html += '<span class="goal-deadline">Meta: ' + esc(deadlineFormatted) + '</span>';
      html += '</div>';
      html += '<div class="goal-actions">';
      html += '<button class="btn btn-sm" onclick="GoalManager.openGoalModal(\'' + esc(goal.id) + '\')" title="Editar">✏️</button>';
      html += '<button class="btn btn-sm" onclick="GoalManager.deleteGoal(\'' + esc(goal.id) + '\')" title="Excluir">🗑️</button>';
      html += '</div>';
      html += '</div>';

      // Progress
      html += '<div class="goal-progress">';
      html += '<div class="progress-bar">';
      html += '<div class="progress-fill" style="width: ' + percent.toFixed(1) + '%; background: ' + color + '"></div>';
      html += '</div>';
      html += '<div class="progress-labels">';
      html += '<span>' + esc(DM.formatCurrency(goal.current)) + '</span>';
      html += '<span>' + percent.toFixed(1) + '%</span>';
      html += '<span>' + esc(DM.formatCurrency(goal.target)) + '</span>';
      html += '</div>';
      html += '</div>';

      // Footer
      html += '<div class="goal-footer">';
      html += '<span>Faltam ' + esc(DM.formatCurrency(remaining)) + '</span>';
      html += '<span>' + esc(timeEstimate) + '</span>';
      html += '</div>';

      html += '</div>';
    });

    container.innerHTML = html;
  }

  // ----------------------------------------------------------
  // Open Goal Modal
  // ----------------------------------------------------------

  function openGoalModal(id) {
    var modal = document.getElementById('modal-goal');
    var title = document.getElementById('modal-goal-title');
    if (!modal) return;

    var goalIdInput = document.getElementById('goal-id');
    var nameInput = document.getElementById('goal-name');
    var targetInput = document.getElementById('goal-target');
    var currentInput = document.getElementById('goal-current');
    var deadlineInput = document.getElementById('goal-deadline');
    var iconSelect = document.getElementById('goal-icon');
    var colorSelect = document.getElementById('goal-color');

    if (id) {
      // Edit mode
      var DM = window.DataManager;
      var goals = DM.getGoals();
      var goal = goals.find(function (g) { return g.id === id; });

      if (!goal) {
        showToast('Meta não encontrada.', 'error');
        return;
      }

      if (title) title.textContent = 'Editar Meta';
      if (goalIdInput) goalIdInput.value = goal.id;
      if (nameInput) nameInput.value = goal.name;
      if (targetInput) targetInput.value = goal.target;
      if (currentInput) currentInput.value = goal.current;

      // Handle deadline format — could be YYYY-MM-DD or YYYY-MM
      if (deadlineInput) {
        if (goal.deadline && goal.deadline.length === 10) {
          deadlineInput.value = goal.deadline.slice(0, 7);
        } else {
          deadlineInput.value = goal.deadline || '';
        }
      }

      if (iconSelect) iconSelect.value = goal.icon || '🎯';
      if (colorSelect) {
        // Find color key from hex value
        var colorKey = 'indigo';
        Object.keys(GOAL_COLORS).forEach(function (key) {
          if (GOAL_COLORS[key] === goal.color) colorKey = key;
        });
        // Also check if the stored value is a key directly
        if (GOAL_COLORS[goal.color]) colorKey = goal.color;
        colorSelect.value = colorKey;
      }
    } else {
      // New mode
      if (title) title.textContent = 'Nova Meta';
      if (goalIdInput) goalIdInput.value = '';
      if (nameInput) nameInput.value = '';
      if (targetInput) targetInput.value = '';
      if (currentInput) currentInput.value = '0';
      if (deadlineInput) {
        var now = new Date();
        now.setFullYear(now.getFullYear() + 1);
        deadlineInput.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
      }
      if (iconSelect) iconSelect.value = '🎯';
      if (colorSelect) colorSelect.value = 'indigo';
    }

    modal.hidden = false;
  }

  // ----------------------------------------------------------
  // Close Goal Modal
  // ----------------------------------------------------------

  function closeGoalModal() {
    var modal = document.getElementById('modal-goal');
    if (modal) modal.hidden = true;
  }

  // ----------------------------------------------------------
  // Handle Goal Submit
  // ----------------------------------------------------------

  function handleGoalSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    var DM = window.DataManager;

    var goalId = (document.getElementById('goal-id') || {}).value || '';
    var name = (document.getElementById('goal-name') || {}).value || '';
    var target = parseFloat((document.getElementById('goal-target') || {}).value) || 0;
    var current = parseFloat((document.getElementById('goal-current') || {}).value) || 0;
    var deadline = (document.getElementById('goal-deadline') || {}).value || '';
    var icon = (document.getElementById('goal-icon') || {}).value || '🎯';
    var colorKey = (document.getElementById('goal-color') || {}).value || 'indigo';

    // Validation
    if (!name.trim()) {
      showToast('Digite o nome da meta.', 'error');
      return;
    }
    if (target <= 0) {
      showToast('O valor da meta deve ser maior que zero.', 'error');
      return;
    }

    var color = resolveColor(colorKey);

    var goalData = {
      name: name.trim(),
      target: target,
      current: current,
      deadline: deadline ? deadline + '-01' : '',
      icon: icon,
      color: color,
    };

    if (goalId) {
      // Update existing goal
      DM.updateGoal(goalId, goalData);
      showToast('Meta atualizada com sucesso!', 'success');
    } else {
      // Add new goal
      DM.addGoal(goalData);
      showToast('Meta criada com sucesso!', 'success');
    }

    closeGoalModal();
    render();
  }

  // ----------------------------------------------------------
  // Delete Goal
  // ----------------------------------------------------------

  function deleteGoal(id) {
    if (!confirm('Deseja realmente excluir esta meta?')) return;

    var DM = window.DataManager;
    var result = DM.deleteGoal(id);
    if (result) {
      showToast('Meta excluída com sucesso!', 'success');
    } else {
      showToast('Erro ao excluir meta.', 'error');
    }
    render();
  }

  // ----------------------------------------------------------
  // Calculate Time to Goal
  // ----------------------------------------------------------

  function calculateTimeToGoal(goal) {
    if (goal.current >= goal.target) return '✅ Meta alcançada!';

    var DM = window.DataManager;
    var history = DM.getPatrimonyHistory();

    // Calculate average monthly savings from last 3 months of patrimony growth
    var avgMonthlySavings = 0;
    if (history.length >= 2) {
      var recentHistory = history.slice(-4); // Last 4 entries to get 3 growth periods
      var growths = [];
      for (var i = 1; i < recentHistory.length; i++) {
        growths.push(recentHistory[i].amount - recentHistory[i - 1].amount);
      }
      if (growths.length > 0) {
        avgMonthlySavings = growths.reduce(function (a, b) { return a + b; }, 0) / growths.length;
      }
    }

    if (avgMonthlySavings <= 0) {
      return 'Não estimável';
    }

    var remaining = goal.target - goal.current;
    var months = Math.ceil(remaining / avgMonthlySavings);

    if (months <= 1) return '~1 mês restante';
    if (months > 120) return '> 10 anos';
    return '~' + months + ' meses restantes';
  }

  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------

  window.GoalManager = {
    init: init,
    render: render,
    renderGoals: renderGoals,
    openGoalModal: openGoalModal,
    closeGoalModal: closeGoalModal,
    handleGoalSubmit: handleGoalSubmit,
    deleteGoal: deleteGoal,
    calculateTimeToGoal: calculateTimeToGoal,
  };
})();
