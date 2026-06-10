// ============================================================
// charts.js — Chart.js Helpers & Dark Theme Configuration
// Financeiro Pessoal — Personal Finance Application
// ============================================================

(function () {
  'use strict';

  // ----------------------------------------------------------
  // Theme Colors
  // ----------------------------------------------------------

  var CHART_COLORS = {
    primary:    '#6366f1',
    success:    '#10b981',
    warning:    '#f59e0b',
    danger:     '#ef4444',
    purple:     '#a855f7',
    pink:       '#ec4899',
    cyan:       '#06b6d4',
    orange:     '#f97316',
    lime:       '#84cc16',
    teal:       '#14b8a6',
    rose:       '#f43f5e',
    indigo:     '#818cf8',
    text:       '#94a3b8',
    grid:       'rgba(255,255,255,0.06)',
    background: '#111827'
  };

  var CATEGORY_COLORS = [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#a855f7',
    '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#14b8a6',
    '#f43f5e', '#818cf8', '#3b82f6', '#8b5cf6', '#d946ef',
    '#0ea5e9', '#22d3ee', '#fbbf24'
  ];

  // ----------------------------------------------------------
  // Chart.js Global Defaults
  // ----------------------------------------------------------

  Chart.defaults.color = '#94a3b8';
  Chart.defaults.font.family = 'Inter, sans-serif';
  Chart.defaults.font.size = 12;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.padding = 16;
  Chart.defaults.plugins.tooltip.backgroundColor = '#1e293b';
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.1)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.titleFont = { weight: '600' };

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------

  function hexToRgba(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  function currencyTooltipCallback(context) {
    var label = context.dataset.label || '';
    var value = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
    if (label) {
      label += ': ';
    }
    label += DataManager.formatCurrency(value);
    return label;
  }

  function doughnutTooltipCallback(context) {
    var label = context.label || '';
    var value = context.parsed;
    var total = context.dataset.data.reduce(function (a, b) { return a + b; }, 0);
    var pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
    return label + ': ' + DataManager.formatCurrency(value) + ' (' + pct + '%)';
  }

  // ----------------------------------------------------------
  // Default Options Builder
  // ----------------------------------------------------------

  function getDefaultOptions(type) {
    var base = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 750,
        easing: 'easeInOutQuart'
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: CHART_COLORS.text,
            usePointStyle: true,
            padding: 16,
            font: {
              family: 'Inter, sans-serif',
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#f1f5f9',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          titleFont: { weight: '600', size: 13 },
          bodyFont: { size: 12 },
          displayColors: true,
          boxPadding: 6,
          callbacks: {
            label: currencyTooltipCallback
          }
        }
      }
    };

    if (type === 'line' || type === 'bar') {
      base.scales = {
        x: {
          grid: {
            color: CHART_COLORS.grid,
            drawBorder: false
          },
          ticks: {
            color: CHART_COLORS.text,
            font: { size: 11 },
            maxRotation: 0
          },
          border: {
            display: false
          }
        },
        y: {
          grid: {
            color: CHART_COLORS.grid,
            drawBorder: false
          },
          ticks: {
            color: CHART_COLORS.text,
            font: { size: 11 },
            callback: function (value) {
              return DataManager.formatCurrency(value);
            }
          },
          border: {
            display: false
          },
          beginAtZero: true
        }
      };
    }

    if (type === 'doughnut') {
      base.cutout = '72%';
      base.plugins.legend.position = 'right';
      base.plugins.tooltip.callbacks = {
        label: doughnutTooltipCallback
      };
    }

    if (type === 'horizontalBar') {
      base.indexAxis = 'y';
      base.scales = {
        x: {
          grid: {
            color: CHART_COLORS.grid,
            drawBorder: false
          },
          ticks: {
            color: CHART_COLORS.text,
            font: { size: 11 },
            callback: function (value) {
              return DataManager.formatCurrency(value);
            }
          },
          border: {
            display: false
          },
          beginAtZero: true
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            color: CHART_COLORS.text,
            font: { size: 11 }
          },
          border: {
            display: false
          }
        }
      };
    }

    return base;
  }

  // ----------------------------------------------------------
  // Chart Instance Manager
  // ----------------------------------------------------------

  var charts = {};

  function destroyChart(canvasId) {
    if (charts[canvasId]) {
      charts[canvasId].destroy();
      delete charts[canvasId];
    }
  }

  function destroyAll() {
    Object.keys(charts).forEach(function (id) {
      if (charts[id]) {
        charts[id].destroy();
      }
    });
    charts = {};
  }

  function getCanvas(canvasId) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.warn('[ChartManager] Canvas not found: #' + canvasId);
      return null;
    }
    return canvas.getContext('2d');
  }

  // ----------------------------------------------------------
  // Chart Factories
  // ----------------------------------------------------------

  function createLineChart(canvasId, labels, datasets, options) {
    destroyChart(canvasId);
    var ctx = getCanvas(canvasId);
    if (!ctx) return null;

    var defaults = getDefaultOptions('line');
    var mergedOptions = deepMerge(defaults, options || {});

    // Apply line-specific styling to datasets
    var styledDatasets = datasets.map(function (ds, i) {
      var color = ds.borderColor || CATEGORY_COLORS[i % CATEGORY_COLORS.length];
      return Object.assign({
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: color,
        pointBorderColor: color,
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: color,
        pointHoverBorderWidth: 3,
        pointStyle: 'circle',
        fill: ds.fill !== undefined ? ds.fill : true,
        backgroundColor: ds.backgroundColor || hexToRgba(color, 0.08),
        borderColor: color
      }, ds, {
        borderColor: color,
        backgroundColor: ds.fill === false ? 'transparent' : (ds.backgroundColor || hexToRgba(color, 0.08))
      });
    });

    var chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: styledDatasets
      },
      options: mergedOptions
    });

    charts[canvasId] = chart;
    return chart;
  }

  function createBarChart(canvasId, labels, datasets, options) {
    destroyChart(canvasId);
    var ctx = getCanvas(canvasId);
    if (!ctx) return null;

    var defaults = getDefaultOptions('bar');
    var mergedOptions = deepMerge(defaults, options || {});

    // Apply bar-specific styling
    var styledDatasets = datasets.map(function (ds, i) {
      var color = ds.backgroundColor || CATEGORY_COLORS[i % CATEGORY_COLORS.length];
      return Object.assign({
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 48,
        hoverBackgroundColor: ds.hoverBackgroundColor || hexToRgba(typeof color === 'string' ? color : CATEGORY_COLORS[i], 0.85)
      }, ds, {
        backgroundColor: color
      });
    });

    var chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: styledDatasets
      },
      options: mergedOptions
    });

    charts[canvasId] = chart;
    return chart;
  }

  function createDoughnutChart(canvasId, labels, data, options) {
    destroyChart(canvasId);
    var ctx = getCanvas(canvasId);
    if (!ctx) return null;

    var defaults = getDefaultOptions('doughnut');
    var mergedOptions = deepMerge(defaults, options || {});

    // Generate colors for each slice
    var backgroundColors = labels.map(function (_, i) {
      return CATEGORY_COLORS[i % CATEGORY_COLORS.length];
    });
    var hoverColors = backgroundColors.map(function (c) {
      return hexToRgba(c, 0.85);
    });
    var borderColors = labels.map(function () {
      return 'rgba(17,24,39,0.8)';
    });

    var chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors,
          hoverBackgroundColor: hoverColors,
          borderColor: borderColors,
          borderWidth: 2,
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: mergedOptions,
      plugins: [{
        id: 'doughnutCenterText',
        beforeDraw: function (chart) {
          var total = chart.data.datasets[0].data.reduce(function (a, b) { return a + b; }, 0);
          if (total <= 0) return;

          var ctx2 = chart.ctx;
          var centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
          var centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

          ctx2.save();

          // "Total" label
          ctx2.font = '500 11px Inter, sans-serif';
          ctx2.fillStyle = '#64748b';
          ctx2.textAlign = 'center';
          ctx2.textBaseline = 'middle';
          ctx2.fillText('Total', centerX, centerY - 10);

          // Currency value
          ctx2.font = '700 15px Inter, sans-serif';
          ctx2.fillStyle = '#f1f5f9';
          ctx2.fillText(DataManager.formatCurrency(total), centerX, centerY + 10);

          ctx2.restore();
        }
      }]
    });

    charts[canvasId] = chart;
    return chart;
  }

  function createHorizontalBarChart(canvasId, labels, data, options) {
    destroyChart(canvasId);
    var ctx = getCanvas(canvasId);
    if (!ctx) return null;

    var defaults = getDefaultOptions('horizontalBar');
    var mergedOptions = deepMerge(defaults, options || {});

    var backgroundColors = labels.map(function (_, i) {
      return CATEGORY_COLORS[i % CATEGORY_COLORS.length];
    });
    var hoverColors = backgroundColors.map(function (c) {
      return hexToRgba(c, 0.85);
    });

    var chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors,
          hoverBackgroundColor: hoverColors,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 28
        }]
      },
      options: mergedOptions
    });

    charts[canvasId] = chart;
    return chart;
  }

  // ----------------------------------------------------------
  // Deep Merge Utility
  // ----------------------------------------------------------

  function deepMerge(target, source) {
    var result = Object.assign({}, target);
    Object.keys(source).forEach(function (key) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        target[key] &&
        typeof target[key] === 'object' &&
        !Array.isArray(target[key])
      ) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    });
    return result;
  }

  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------

  window.ChartManager = {
    charts: charts,
    COLORS: CHART_COLORS,
    CATEGORY_COLORS: CATEGORY_COLORS,

    // Init (no-op, charts are created on demand)
    init: function() {},

    // Options
    getDefaultOptions: getDefaultOptions,

    // Factories
    createLineChart: createLineChart,
    createBarChart: createBarChart,
    createDoughnutChart: createDoughnutChart,
    createHorizontalBarChart: createHorizontalBarChart,

    // Lifecycle
    destroyChart: destroyChart,
    destroyAll: destroyAll,

    // Utilities
    hexToRgba: hexToRgba
  };
})();
