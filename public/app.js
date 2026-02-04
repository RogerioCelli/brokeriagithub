// API Base URL
const API_URL = window.location.origin;

// Estado global
let allRecords = [];
let filteredRecords = [];
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        showApp();
        initializeApp();
    } else {
        showLogin();
    }
    setupEventListeners();
});

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    document.body.classList.add('login-page');
}

function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.body.classList.remove('login-page');

    // Atualizar UI do usuário
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('userName').textContent = user.nome || user.username;
        document.getElementById('userRole').textContent = user.role === 'admin' ? 'Administrador' : 'Usuário';
    }
}

async function initializeApp() {
    await loadDashboardStats();
    await loadRecentRecords();
    await loadChartData();
    await loadTimelineChart();
    populateFilterOptions();
}

function setupEventListeners() {
    // Login Form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        initializeApp();
    });

    // Apply filters
    document.getElementById('applyFilters').addEventListener('click', applyFilters);

    // Search input
    document.getElementById('searchInput').addEventListener('input', handleSearch);

    // Modal close
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', closeModal);
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');

    errorEl.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Autenticando...';

    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showApp();
            initializeApp();
        } else {
            errorEl.textContent = data.error || 'Erro ao realizar login';
        }
    } catch (error) {
        console.error('Erro no login:', error);
        errorEl.textContent = 'Erro de conexão com o servidor';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Entrar';
    }
}

function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    authToken = null;
    showLogin();
}

// Wrapper para fetch com autenticação
async function authenticatedFetch(url, options = {}) {
    if (!authToken) {
        handleLogout();
        return;
    }

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${authToken}`
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
        handleLogout();
        throw new Error('Sessão expirada');
    }

    return response;
}

// ========== DASHBOARD STATS ==========
async function loadDashboardStats() {
    try {
        const response = await authenticatedFetch(`${API_URL}/api/dashboard/stats`);
        const stats = await response.json();

        document.getElementById('totalRegistros').textContent = stats.total_registros || 0;
        document.getElementById('totalPendentes').textContent = stats.pendentes || 0;
        document.getElementById('totalEmAtendimento').textContent = stats.em_atendimento || 0;
        document.getElementById('totalConcluidos').textContent = stats.concluidos || 0;
        document.getElementById('badgeHoje').textContent = `${stats.hoje || 0} hoje`;

    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        showError('Erro ao carregar estatísticas');
    }
}

// ========== RECORDS TABLE ==========
async function loadRecentRecords(limit = 50) {
    try {
        const response = await authenticatedFetch(`${API_URL}/api/registros/recentes?limit=${limit}`);
        allRecords = await response.json();
        filteredRecords = [...allRecords];
        renderRecordsTable(filteredRecords);
    } catch (error) {
        console.error('Erro ao carregar registros:', error);
        showError('Erro ao carregar registros');
    }
}

function renderRecordsTable(records) {
    const tbody = document.getElementById('recordsTableBody');

    if (records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">
                    Nenhum registro encontrado
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = records.map(record => `
        <tr>
            <td>#${record.id_atendimento}</td>
            <td>${formatDateTime(record.data_contato)}</td>
            <td>${escapeHtml(record.nome_whatsapp || 'N/A')}</td>
            <td>${formatPhone(record.telefone)}</td>
            <td>
                <span class="badge-seguro badge-seguro-${(record.tipo_seguro || 'NAO_IDENTIFICADO').toLowerCase()}">
                    ${getInsuranceIcon(record.tipo_seguro)} ${escapeHtml(record.tipo_seguro || 'NAO_IDENTIFICADO')}
                </span>
            </td>
            <td>${escapeHtml(record.tipo_solicitacao || 'N/A')}</td>
            <td>
                <span class="status-badge-table status-${record.status_atendimento}">
                    ${formatStatus(record.status_atendimento)}
                </span>
            </td>
            <td>${escapeHtml(record.etapa_funil || 'N/A')}</td>
            <td>${record.qtde_mensagens || 0}</td>
            <td>
                <button class="btn-view" onclick="viewRecord(${record.id_atendimento})">
                    Ver Chat
                </button>
            </td>
        </tr>
    `).join('');
}

// ========== CHARTS ==========
async function loadChartData() {
    await Promise.all([
        loadTiposChart(),
        loadEtapasChart()
    ]);
}

async function loadTiposChart() {
    try {
        const response = await authenticatedFetch(`${API_URL}/api/registros/por-tipo`);
        const data = await response.json();

        const container = document.getElementById('chartTipos');

        if (data.length === 0) {
            container.innerHTML = '<div class="loading">Sem dados disponíveis</div>';
            return;
        }

        container.innerHTML = data.map(item => {
            const percentage = (item.pendentes / item.total * 100).toFixed(1);
            return `
                <div style="margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">
                            ${escapeHtml(item.tipo_solicitacao || 'Não especificado')}
                        </span>
                        <span style="font-size: 0.875rem; color: var(--text-secondary);">
                            ${item.total} (${item.pendentes} pendentes)
                        </span>
                    </div>
                    <div style="background: var(--bg-tertiary); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, var(--primary-500), var(--primary-600)); height: 100%; width: ${percentage}%; transition: width 0.5s ease;"></div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Erro ao carregar gráfico de tipos:', error);
    }
}

async function loadEtapasChart() {
    try {
        const response = await authenticatedFetch(`${API_URL}/api/registros/por-etapa`);
        const data = await response.json();

        const container = document.getElementById('chartEtapas');

        if (data.length === 0) {
            container.innerHTML = '<div class="loading">Sem dados disponíveis</div>';
            return;
        }

        const maxTotal = Math.max(...data.map(item => item.total));

        container.innerHTML = data.map(item => {
            const percentage = (item.total / maxTotal * 100).toFixed(1);
            const avgMsgs = parseFloat(item.media_mensagens || 0).toFixed(1);
            return `
                <div style="margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">
                            ${escapeHtml(item.etapa_funil || 'Não especificado')}
                        </span>
                        <span style="font-size: 0.875rem; color: var(--text-secondary);">
                            ${item.total} (${avgMsgs} msgs/média)
                        </span>
                    </div>
                    <div style="background: var(--bg-tertiary); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, var(--info-500), var(--info-600)); height: 100%; width: ${percentage}%; transition: width 0.5s ease;"></div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Erro ao carregar gráfico de etapas:', error);
    }
}

// ========== TIMELINE CHART ==========
let timelineChartInstance = null;

async function loadTimelineChart() {
    try {
        const response = await authenticatedFetch(`${API_URL}/api/registros/por-dia`);
        const data = await response.json();

        const ctx = document.getElementById('timelineChart').getContext('2d');

        if (timelineChartInstance) {
            timelineChartInstance.destroy();
        }

        timelineChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(item => formatDate(item.data)),
                datasets: [
                    {
                        label: 'Total de Registros',
                        data: data.map(item => item.total_registros),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                    },
                    {
                        label: 'Clientes Únicos',
                        data: data.map(item => item.clientes_unicos),
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 3,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: 'rgb(209, 213, 219)',
                            font: {
                                family: 'Inter',
                                size: 12,
                                weight: 600
                            },
                            padding: 15,
                            usePointStyle: true,
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(31, 41, 55, 0.95)',
                        titleColor: 'rgb(249, 250, 251)',
                        bodyColor: 'rgb(209, 213, 219)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: true,
                        callbacks: {
                            title: (context) => {
                                return `Data: ${context[0].label}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false,
                        },
                        ticks: {
                            color: 'rgb(156, 163, 175)',
                            font: {
                                family: 'Inter',
                                size: 11
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false,
                        },
                        ticks: {
                            color: 'rgb(156, 163, 175)',
                            font: {
                                family: 'Inter',
                                size: 11
                            },
                            precision: 0
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Erro ao carregar gráfico de timeline:', error);
    }
}

// ========== FILTERS ==========
async function populateFilterOptions() {
    try {
        // Tipos de solicitação
        const tiposResponse = await authenticatedFetch(`${API_URL}/api/registros/por-tipo`);
        const tipos = await tiposResponse.json();

        const tipoSelect = document.getElementById('filterTipo');
        tipos.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.tipo_solicitacao;
            option.textContent = tipo.tipo_solicitacao || 'Não especificado';
            tipoSelect.appendChild(option);
        });

        // Etapas do funil
        const etapasResponse = await authenticatedFetch(`${API_URL}/api/registros/por-etapa`);
        const etapas = await etapasResponse.json();

        const etapaSelect = document.getElementById('filterEtapa');
        etapas.forEach(etapa => {
            const option = document.createElement('option');
            option.value = etapa.etapa_funil;
            option.textContent = etapa.etapa_funil || 'Não especificado';
            etapaSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Erro ao popular filtros:', error);
    }
}

async function applyFilters() {
    const status = document.getElementById('filterStatus').value;
    const seguro = document.getElementById('filterSeguro').value;
    const tipo = document.getElementById('filterTipo').value;
    const etapa = document.getElementById('filterEtapa').value;

    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (seguro) params.append('seguro', seguro);
    if (tipo) params.append('tipo', tipo);
    if (etapa) params.append('etapa', etapa);

    try {
        const response = await authenticatedFetch(`${API_URL}/api/registros/filtrar?${params.toString()}`);
        filteredRecords = await response.json();
        renderRecordsTable(filteredRecords);
    } catch (error) {
        console.error('Erro ao aplicar filtros:', error);
        showError('Erro ao aplicar filtros');
    }
}

// ========== SEARCH ==========
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();

    if (!searchTerm) {
        renderRecordsTable(filteredRecords);
        return;
    }

    const searchResults = filteredRecords.filter(record => {
        return (
            record.telefone?.toLowerCase().includes(searchTerm) ||
            record.nome_whatsapp?.toLowerCase().includes(searchTerm) ||
            record.tipo_solicitacao?.toLowerCase().includes(searchTerm) ||
            record.tipo_seguro?.toLowerCase().includes(searchTerm)
        );
    });

    renderRecordsTable(searchResults);
}

// ========== MODAL ==========
async function viewRecord(id) {
    const modal = document.getElementById('recordModal');
    const modalBody = document.getElementById('modalBody');

    modal.classList.add('active');
    modalBody.innerHTML = '<div class="loading">Carregando...</div>';

    try {
        const response = await authenticatedFetch(`${API_URL}/api/registros/${id}`);
        const record = await response.json();

        modalBody.innerHTML = `
            <div class="modal-details">
                <div class="details-grid">
                    <div class="detail-item">
                        <span class="detail-label">Cliente</span>
                        <div class="detail-value">${escapeHtml(record.nome_whatsapp || 'N/A')}</div>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">WhatsApp</span>
                        <div class="detail-value">${formatPhone(record.telefone)}</div>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Seguro</span>
                        <div class="detail-value">
                            <span class="badge-seguro badge-seguro-${(record.tipo_seguro || 'NAO_IDENTIFICADO').toLowerCase()}">
                                ${getInsuranceIcon(record.tipo_seguro)} ${escapeHtml(record.tipo_seguro || 'NAO_IDENTIFICADO')}
                            </span>
                        </div>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Assunto</span>
                        <div class="detail-value">${escapeHtml(record.tipo_solicitacao || 'N/A')}</div>
                    </div>
                </div>

                <div class="detail-item full-width" style="margin-top: 2rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <span class="detail-label">Histórico Completo da Sessão</span>
                        <span class="badge-total-msgs">${record.qtde_mensagens || 0} interações</span>
                    </div>
                    <div class="chat-history-container">
                        ${formatChatHistory(record.mensagem_inicial || 'N/A')}
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        modalBody.innerHTML = '<div style="color: var(--danger-400); text-align: center;">Erro ao carregar detalhes do registro</div>';
    }
}

function formatChatHistory(text) {
    if (!text || text === 'N/A') return '<div class="chat-message-system">Nenhum histórico disponível</div>';

    // Escapa HTML para segurança e converte quebras de linha
    const escaped = escapeHtml(text);

    // Divide por linhas e tenta identificar quem mandou
    return escaped.split('\n').map(line => {
        if (!line.trim()) return '';

        let msgClass = 'chat-message-info';
        if (line.includes('BrokerIA:')) {
            msgClass = 'chat-message-ai';
        } else if (line.match(/\[.*\]/)) {
            msgClass = 'chat-message-user';
        }

        return `<div class="chat-line ${msgClass}">${line}</div>`;
    }).join('');
}

function getInsuranceIcon(type) {
    const icons = {
        'AUTOMOVEL': '🚗',
        'RESIDENCIAL': '🏠',
        'VIDA': '👨‍👩‍👧‍👦',
        'SAUDE': '🏥',
        'EMPRESARIAL': '🏢',
        'NAO_IDENTIFICADO': '🛡️'
    };
    return icons[type] || '🛡️';
}


function closeModal() {
    document.getElementById('recordModal').classList.remove('active');
}

// ========== UTILITY FUNCTIONS ==========
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
    });
}

function formatPhone(phone) {
    if (!phone) return 'N/A';
    // Formato: (XX) XXXXX-XXXX
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13) {
        return `+ ${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)} -${cleaned.slice(9)} `;
    }
    return phone;
}

function formatStatus(status) {
    const statusMap = {
        'PENDENTE': 'Pendente',
        'EM_ATENDIMENTO': 'Em Atendimento',
        'CONCLUIDO': 'Concluído',
        'CANCELADO': 'Cancelado'
    };
    return statusMap[status] || status;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    console.error(message);
    // Você pode adicionar uma notificação toast aqui
}
