/**
 * FinControl - App Controller (app.js)
 * Main application controller: navigation, initialization, global utilities
 */

(function() {
    'use strict';

    // =========================================================================
    // TOAST NOTIFICATION SYSTEM (Global)
    // =========================================================================
    window.showToast = function(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.success}</span>
            <span class="toast-message">${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('toast-show');
        });
        
        // Auto dismiss
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // =========================================================================
    // APP CONTROLLER
    // =========================================================================
    const App = {
        currentTab: 'dashboard',
        initialized: false,
        _rendering: false,
        _modulesInitialized: {},

        // Initialize the application
        init() {
            console.log('🚀 FinControl initializing...');
            
            // Initialize data layer
            if (window.DataManager) {
                DataManager.init();
                console.log('✅ DataManager initialized');
            }

            // Setup navigation
            this.setupNavigation();
            this.setupMobileNav();
            this.setupKeyboardShortcuts();
            this.setupGlobalEventListeners();

            // Initialize all modules
            this.initModules();

            // Show dashboard
            this.switchTab('dashboard');

            this.initialized = true;
            console.log('✅ FinControl ready!');
        },

        // Initialize all modules
        initModules() {
            const modules = [
                { name: 'ChartManager', method: 'init' },
                { name: 'DashboardManager', method: 'init' },
                { name: 'TransactionManager', method: 'init' },
                { name: 'AccountManager', method: 'init' },
                { name: 'CardManager', method: 'init' },
                { name: 'PatrimonyManager', method: 'init' },
                { name: 'GoalManager', method: 'init' },
                { name: 'VehicleManager', method: 'init' },
                { name: 'ReportManager', method: 'init' },
                { name: 'ConfigManager', method: 'init' }
            ];

            modules.forEach(mod => {
                try {
                    if (window[mod.name] && typeof window[mod.name][mod.method] === 'function') {
                        window[mod.name][mod.method]();
                        console.log(`✅ ${mod.name} initialized`);
                    } else {
                        console.warn(`⚠️ ${mod.name} not found or has no ${mod.method}() method`);
                    }
                } catch (err) {
                    console.error(`❌ Error initializing ${mod.name}:`, err);
                }
            });
        },

        // =====================================================================
        // NAVIGATION
        // =====================================================================

        setupNavigation() {
            // Desktop sidebar navigation
            const navItems = document.querySelectorAll('.sidebar .nav-item');
            navItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const tab = item.getAttribute('data-tab');
                    if (tab) {
                        this.switchTab(tab);
                    }
                });
            });

            // Bottom nav items (mobile)
            const bottomNavItems = document.querySelectorAll('.bottom-nav-item[data-tab]');
            bottomNavItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const tab = item.getAttribute('data-tab');
                    if (tab) {
                        this.switchTab(tab);
                        this.closeMoreMenu();
                    }
                });
            });
        },

        setupMobileNav() {
            // More menu button
            const moreBtn = document.querySelector('.bottom-nav-item[data-action="more"]');
            if (moreBtn) {
                moreBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleMoreMenu();
                });
            }

            // More menu overlay close
            const moreOverlay = document.getElementById('more-menu-overlay');
            if (moreOverlay) {
                const closeBtn = moreOverlay.querySelector('.more-menu-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => this.closeMoreMenu());
                }

                // Close on overlay click
                moreOverlay.addEventListener('click', (e) => {
                    if (e.target === moreOverlay) {
                        this.closeMoreMenu();
                    }
                });

                // More menu items
                const moreItems = moreOverlay.querySelectorAll('.more-menu-item');
                moreItems.forEach(item => {
                    item.addEventListener('click', () => {
                        const tab = item.getAttribute('data-tab');
                        if (tab) {
                            this.switchTab(tab);
                            this.closeMoreMenu();
                        }
                    });
                });
            }
        },

        switchTab(tabId) {
            this.currentTab = tabId;

            // Hide all tab panes
            const panes = document.querySelectorAll('.tab-pane');
            panes.forEach(pane => {
                pane.classList.remove('active');
                pane.style.display = 'none';
            });

            // Show target pane
            const targetPane = document.getElementById(tabId);
            if (targetPane) {
                targetPane.style.display = 'block';
                // Trigger animation
                requestAnimationFrame(() => {
                    targetPane.classList.add('active');
                });
            }

            // Update sidebar active state
            const sidebarItems = document.querySelectorAll('.sidebar .nav-item');
            sidebarItems.forEach(item => {
                item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
            });

            // Update bottom nav active state
            const bottomItems = document.querySelectorAll('.bottom-nav-item[data-tab]');
            bottomItems.forEach(item => {
                item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
            });

            // Render tab content on switch
            this.renderTab(tabId);

            // Scroll to top
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.scrollTop = 0;
            }

            // Update page title
            const tabNames = {
                'dashboard': 'Dashboard',
                'quick-entry': 'Lançamento Rápido',
                'transactions': 'Lançamentos',
                'accounts': 'Contas Bancárias',
                'cards': 'Cartões',
                'patrimony': 'Patrimônio',
                'goals': 'Metas',
                'vehicle': 'Veículo',
                'reports': 'Relatórios',
                'settings': 'Configurações'
            };
            document.title = `${tabNames[tabId] || 'FinControl'} — FinControl`;
        },

        renderTab(tabId) {
            if (this._rendering) return;
            this._rendering = true;
            try {
                switch (tabId) {
                    case 'dashboard':
                        if (window.DashboardManager) DashboardManager.render();
                        break;
                    case 'quick-entry':
                        if (window.TransactionManager) TransactionManager.renderQuickRecent();
                        break;
                    case 'transactions':
                        if (window.TransactionManager) TransactionManager.renderTransactions();
                        break;
                    case 'accounts':
                        if (window.AccountManager) AccountManager.render();
                        break;
                    case 'cards':
                        if (window.CardManager) CardManager.render();
                        break;
                    case 'patrimony':
                        if (window.PatrimonyManager) PatrimonyManager.render();
                        break;
                    case 'goals':
                        if (window.GoalManager) GoalManager.render();
                        break;
                    case 'vehicle':
                        if (window.VehicleManager) VehicleManager.render();
                        break;
                    case 'reports':
                        if (window.ReportManager) ReportManager.render();
                        break;
                    case 'settings':
                        if (window.ConfigManager) ConfigManager.renderSettings();
                        break;
                }
            } catch (err) {
                console.error(`Error rendering tab ${tabId}:`, err);
            } finally {
                this._rendering = false;
            }
        },

        toggleMoreMenu() {
            const overlay = document.getElementById('more-menu-overlay');
            if (overlay) {
                overlay.classList.toggle('active');
                if (overlay.hasAttribute('hidden')) {
                    overlay.removeAttribute('hidden');
                } else {
                    overlay.setAttribute('hidden', '');
                }
            }
        },

        closeMoreMenu() {
            const overlay = document.getElementById('more-menu-overlay');
            if (overlay) {
                overlay.classList.remove('active');
                overlay.setAttribute('hidden', '');
            }
        },

        // =====================================================================
        // KEYBOARD SHORTCUTS
        // =====================================================================

        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Ctrl+1-9 for tabs
                if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
                    e.preventDefault();
                    const tabs = [
                        'dashboard', 'quick-entry', 'transactions', 'accounts',
                        'cards', 'patrimony', 'goals', 'vehicle', 'reports'
                    ];
                    const index = parseInt(e.key) - 1;
                    if (tabs[index]) {
                        this.switchTab(tabs[index]);
                    }
                }

                // Ctrl+0 for settings
                if (e.ctrlKey && e.key === '0') {
                    e.preventDefault();
                    this.switchTab('settings');
                }

                // Escape to close modals
                if (e.key === 'Escape') {
                    this.closeAllModals();
                    this.closeMoreMenu();
                }

                // Ctrl+N for quick entry
                if (e.ctrlKey && e.key === 'n') {
                    e.preventDefault();
                    this.switchTab('quick-entry');
                    const amountInput = document.getElementById('quick-amount');
                    if (amountInput) amountInput.focus();
                }
            });
        },

        // =====================================================================
        // GLOBAL EVENT LISTENERS
        // =====================================================================

        setupGlobalEventListeners() {
            // Close modals when clicking overlay
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) {
                    this.closeAllModals();
                }
            });

            // Handle modal close buttons
            document.querySelectorAll('.modal-close, [data-action="close-modal"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.closeAllModals();
                });
            });

            // Chart.js handles its own responsive resizing internally.
            // No resize or visibilitychange listeners needed for re-rendering.

            // Google Sheets sync listeners
            this.setupSyncListeners();

            // CSV Import listeners
            this.setupCSVImport();
        },

        setupCSVImport() {
            const dropZone = document.getElementById('csv-drop-zone');
            const fileInput = document.getElementById('csv-file-input');
            const resultDiv = document.getElementById('csv-import-result');
            if (!dropZone || !fileInput) return;

            // Click to select
            dropZone.addEventListener('click', () => fileInput.click());

            // Drag and drop
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.style.borderColor = 'var(--accent-primary)';
                dropZone.style.background = 'var(--accent-primary-muted)';
            });
            dropZone.addEventListener('dragleave', () => {
                dropZone.style.borderColor = 'var(--border)';
                dropZone.style.background = '';
            });
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.style.borderColor = 'var(--border)';
                dropZone.style.background = '';
                if (e.dataTransfer.files.length > 0) {
                    this.processCSVFiles(e.dataTransfer.files, resultDiv);
                }
            });

            // File input change
            fileInput.addEventListener('change', () => {
                if (fileInput.files.length > 0) {
                    this.processCSVFiles(fileInput.files, resultDiv);
                    fileInput.value = ''; // Reset
                }
            });
        },

        async processCSVFiles(files, resultDiv) {
            if (!window.ExtratoImporter) {
                showToast('Módulo de importação não encontrado', 'error');
                return;
            }

            let totalAdded = 0;
            let totalSkipped = 0;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.name.endsWith('.csv')) continue;

                const result = await ExtratoImporter.importFromFile(file);
                totalAdded += result.added;
                totalSkipped += result.skipped;
            }

            if (resultDiv) {
                resultDiv.innerHTML = `<span style="color: var(--accent-success);">✅ ${totalAdded} lançamentos importados</span>` +
                    (totalSkipped > 0 ? ` <span style="color: var(--text-tertiary);">(${totalSkipped} duplicados ignorados)</span>` : '');
            }

            if (totalAdded > 0) {
                showToast(`${totalAdded} lançamentos importados! ✓`, 'success');
                this.refresh();
            } else if (totalSkipped > 0) {
                showToast('Todos os lançamentos já existem', 'info');
            }
        },

        setupSyncListeners() {
            const connectBtn = document.getElementById('btn-connect-sheets');
            const syncBtn = document.getElementById('btn-sync-sheets');
            const dashSyncBtn = document.getElementById('btn-dashboard-sync');
            const apiInput = document.getElementById('api-url-input');
            const statusText = document.getElementById('sync-status-text');

            // Restore saved API URL
            if (apiInput && DataManager.getApiUrl()) {
                apiInput.value = DataManager.getApiUrl();
                if (syncBtn) syncBtn.disabled = false;
                if (statusText) {
                    const lastSync = DataManager.getLastSync();
                    statusText.textContent = lastSync 
                        ? '✅ Conectado — Última sync: ' + new Date(lastSync).toLocaleString('pt-BR')
                        : '✅ Conectado — Nunca sincronizado';
                    statusText.style.color = '#10b981';
                }
            }

            // Connect button
            if (connectBtn) {
                connectBtn.addEventListener('click', async () => {
                    const url = apiInput ? apiInput.value.trim() : '';
                    if (!url) {
                        showToast('Cole a URL do Apps Script', 'warning');
                        return;
                    }
                    connectBtn.textContent = '⏳ Conectando...';
                    connectBtn.disabled = true;

                    try {
                        const response = await fetch(url + '?action=ping');
                        const result = await response.json();
                        if (result.status === 'ok') {
                            DataManager.setApiUrl(url);
                            if (syncBtn) syncBtn.disabled = false;
                            if (statusText) {
                                statusText.textContent = '✅ Conectado com sucesso!';
                                statusText.style.color = '#10b981';
                            }
                            showToast('Conectado ao Google Sheets! ✓', 'success');
                            // Auto-sync on first connect
                            this.doSync();
                        } else {
                            throw new Error(result.error || 'Resposta inválida');
                        }
                    } catch (err) {
                        if (statusText) {
                            statusText.textContent = '❌ Erro: ' + err.message;
                            statusText.style.color = '#ef4444';
                        }
                        showToast('Erro ao conectar: ' + err.message, 'error');
                    } finally {
                        connectBtn.textContent = '🔗 Conectar';
                        connectBtn.disabled = false;
                    }
                });
            }

            // Sync buttons
            const doSyncClick = () => this.doSync();
            if (syncBtn) syncBtn.addEventListener('click', doSyncClick);
            if (dashSyncBtn) dashSyncBtn.addEventListener('click', doSyncClick);

            // Auto-sync on init if connected
            if (DataManager.isConnected()) {
                setTimeout(() => this.doSync(), 1000);
            }

            // Auto-sync when page becomes visible (Page Visibility API)
            this._lastSyncTime = Date.now();
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState !== 'visible') return;
                if (!DataManager.isConnected()) return;
                const elapsed = Date.now() - this._lastSyncTime;
                if (elapsed < 60000) return; // 60s debounce
                this._lastSyncTime = Date.now();
                console.log('🔄 Auto-sync: page became visible after ' + Math.round(elapsed / 1000) + 's');
                this.doSync();
            });
        },

        async doSync() {
            this._lastSyncTime = Date.now();
            const syncBtn = document.getElementById('btn-sync-sheets');
            const dashSyncBtn = document.getElementById('btn-dashboard-sync');
            const statusText = document.getElementById('sync-status-text');

            if (syncBtn) { syncBtn.textContent = '⏳ Sincronizando...'; syncBtn.disabled = true; }
            if (dashSyncBtn) { dashSyncBtn.textContent = '⏳'; dashSyncBtn.disabled = true; }

            const result = await DataManager.syncFromSheets();

            if (result.success) {
                showToast('Dados sincronizados! ✓', 'success');
                if (statusText) {
                    statusText.textContent = '✅ Sincronizado — ' + new Date().toLocaleString('pt-BR');
                    statusText.style.color = '#10b981';
                }
                this.renderTab(this.currentTab);
            } else {
                showToast('Erro na sincronização: ' + result.error, 'error');
                if (statusText) {
                    statusText.textContent = '❌ Erro: ' + result.error;
                    statusText.style.color = '#ef4444';
                }
            }

            if (syncBtn) { syncBtn.textContent = '🔄 Sincronizar Agora'; syncBtn.disabled = false; }
            if (dashSyncBtn) { dashSyncBtn.textContent = '🔄'; dashSyncBtn.disabled = false; }
        },

        closeAllModals() {
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => {
                modal.setAttribute('hidden', '');
                modal.classList.remove('active');
            });
        },

        // =====================================================================
        // UTILITY FUNCTIONS (Global)
        // =====================================================================

        // Refresh current view (call after data changes)
        refresh() {
            this.renderTab(this.currentTab);
            // Also refresh dashboard KPIs if not on dashboard
            if (this.currentTab !== 'dashboard' && window.DashboardManager) {
                // Queue a dashboard refresh for when user navigates back
                this._dashboardDirty = true;
            }
        }
    };

    // =========================================================================
    // GLOBAL ACCESS
    // =========================================================================
    window.App = App;

    // =========================================================================
    // INITIALIZE ON DOM READY
    // =========================================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => App.init());
    } else {
        App.init();
    }

})();
