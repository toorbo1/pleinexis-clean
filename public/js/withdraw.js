// ========== СТРАНИЦА ВЫВОДА СРЕДСТВ (ОБНОВЛЕННАЯ) ==========

// Глобальные переменные
let currentUser = localStorage.getItem('apex_user') || 'Гость';
let userProfile = JSON.parse(localStorage.getItem('apex_profile') || '{"balance": 0}');
let currentBalance = userProfile.balance || 0;

// Методы вывода
const withdrawMethods = [
    { id: 'card', name: 'Банковская карта', icon: 'fas fa-credit-card', iconClass: 'card', placeholder: 'Номер карты (16 цифр)', commission: 0.02, minAmount: 100, detailsLabel: 'Номер карты' },
    { id: 'qiwi', name: 'QIWI Кошелёк', icon: 'fab fa-qiwi', iconClass: 'qiwi', placeholder: 'Номер телефона QIWI', commission: 0.01, minAmount: 100, detailsLabel: 'QIWI номер' },
    { id: 'crypto', name: 'Криптовалюта (USDT)', icon: 'fab fa-bitcoin', iconClass: 'crypto', placeholder: 'Адрес USDT (TRC20/ERC20)', commission: 0.03, minAmount: 500, detailsLabel: 'USDT адрес' }
];

let selectedMethod = withdrawMethods[0];

// Функция отправки уведомления пользователю в чат
function sendWithdrawNotificationToUser(username, amount, status, reason = '') {
    let dialogs = JSON.parse(localStorage.getItem('apex_dialogs') || '[]');
    
    // Ищем диалог с пользователем
    let userDialog = dialogs.find(d => d.name === username);
    
    if (!userDialog) {
        // Создаем новый диалог если нет
        userDialog = {
            id: 'user_' + Date.now() + '_' + username,
            name: username,
            avatar: '👤',
            messages: []
        };
        dialogs.push(userDialog);
    }
    
    let messageText = '';
    let messageTitle = '';
    
    if (status === 'approved') {
        messageTitle = '✅ Вывод средств одобрен';
        messageText = `Ваша заявка на вывод ${amount} ₽ одобрена и обработана. Средства отправлены на указанные реквизиты.\n\nОбычно зачисление занимает от 5 минут до 24 часов в зависимости от способа вывода.\n\nСпасибо, что выбираете Плейнексис! 💙`;
    } else {
        messageTitle = '❌ Вывод средств отклонён';
        messageText = `Ваша заявка на вывод ${amount} ₽ отклонена администратором.\n\nПричина: ${reason || 'Не указана'}\n\nВы можете создать новую заявку на вывод средств.`;
    }
    
    userDialog.messages.push({
        user: 'Support',
        text: `🔔 **${messageTitle}**\n\n${messageText}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toISOString()
    });
    
    localStorage.setItem('apex_dialogs', JSON.stringify(dialogs));
    
    // Если чат открыт у пользователя, обновляем
    if (typeof renderDialogsList === 'function') {
        renderDialogsList();
    }
}

// Функция загрузки заявок для админа
function loadWithdrawRequestsForAdmin() {
    const requests = JSON.parse(localStorage.getItem('apex_withdraw_requests') || '[]');
    return requests.filter(r => r.status === 'pending');
}

// Функция одобрения заявки (для админа)
function approveWithdrawRequest(requestId) {
    const requests = JSON.parse(localStorage.getItem('apex_withdraw_requests') || '[]');
    const requestIndex = requests.findIndex(r => r.id === requestId);
    
    if (requestIndex === -1) return;
    
    const request = requests[requestIndex];
    request.status = 'approved';
    request.processedAt = new Date().toISOString();
    
    localStorage.setItem('apex_withdraw_requests', JSON.stringify(requests));
    
    // Отправляем уведомление пользователю
    sendWithdrawNotificationToUser(request.userName, request.amount, 'approved');
    
    // Обновляем админ-панель
    if (typeof renderAdminWithdrawRequests === 'function') {
        renderAdminWithdrawRequests();
    }
    
    showToast('✅ Заявка одобрена! Уведомление отправлено пользователю.', 'success');
}

// Функция отклонения заявки (для админа)
function rejectWithdrawRequest(requestId) {
    const reason = prompt('Укажите причину отклонения заявки:', 'Недостаточно средств на балансе');
    if (!reason) return;
    
    const requests = JSON.parse(localStorage.getItem('apex_withdraw_requests') || '[]');
    const requestIndex = requests.findIndex(r => r.id === requestId);
    
    if (requestIndex === -1) return;
    
    const request = requests[requestIndex];
    request.status = 'rejected';
    request.rejectReason = reason;
    request.processedAt = new Date().toISOString();
    
    // Возвращаем деньги пользователю
    const profile = JSON.parse(localStorage.getItem('apex_profile') || '{"balance": 0}');
    profile.balance = (profile.balance || 0) + request.total;
    localStorage.setItem('apex_profile', JSON.stringify(profile));
    
    localStorage.setItem('apex_withdraw_requests', JSON.stringify(requests));
    
    // Отправляем уведомление пользователю
    sendWithdrawNotificationToUser(request.userName, request.amount, 'rejected', reason);
    
    // Обновляем админ-панель
    if (typeof renderAdminWithdrawRequests === 'function') {
        renderAdminWithdrawRequests();
    }
    
    showToast('❌ Заявка отклонена! Деньги возвращены на баланс пользователя.', 'warning');
}

// Функция рендеринга заявок для админа
function renderAdminWithdrawRequests() {
    const container = document.getElementById('adminWithdrawRequestsList');
    if (!container) return;
    
    const requests = JSON.parse(localStorage.getItem('apex_withdraw_requests') || '[]');
    const pendingRequests = requests.filter(r => r.status === 'pending');
    
    if (pendingRequests.length === 0) {
        container.innerHTML = `
            <div class="empty-withdraw-requests">
                <i class="fas fa-check-circle"></i>
                <p>Нет активных заявок на вывод</p>
                <p style="font-size: 0.8rem; margin-top: 8px;">Все заявки обработаны</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = pendingRequests.map(request => `
        <div class="withdraw-request-item">
            <div class="withdraw-request-header">
                <div class="withdraw-request-user">
                    <div class="withdraw-request-avatar">
                        ${request.userName.charAt(0).toUpperCase()}
                    </div>
                    <div class="withdraw-request-user-info">
                        <div class="user-name">${escapeHtml(request.userName)}</div>
                        <div class="request-date">${new Date(request.date).toLocaleString()}</div>
                    </div>
                </div>
                <div class="withdraw-request-status pending">
                    <i class="fas fa-clock"></i> Ожидает обработки
                </div>
            </div>
            
            <div class="withdraw-request-details">
                <div class="withdraw-detail-item">
                    <span class="detail-label">Способ вывода</span>
                    <span class="detail-value">${escapeHtml(request.method)}</span>
                </div>
                <div class="withdraw-detail-item">
                    <span class="detail-label">Сумма вывода</span>
                    <span class="detail-value amount">${request.amount} ₽</span>
                </div>
                <div class="withdraw-detail-item">
                    <span class="detail-label">Комиссия</span>
                    <span class="detail-value">${request.commission.toFixed(2)} ₽</span>
                </div>
                <div class="withdraw-detail-item">
                    <span class="detail-label">Итого списано</span>
                    <span class="detail-value">${request.total.toFixed(2)} ₽</span>
                </div>
                <div class="withdraw-detail-item">
                    <span class="detail-label">Реквизиты</span>
                    <span class="detail-value" style="font-size: 0.85rem; word-break: break-all;">${escapeHtml(request.details)}</span>
                </div>
            </div>
            
            <div class="withdraw-request-actions">
                <button class="withdraw-approve-btn" onclick="approveWithdrawRequest('${request.id}')">
                    <i class="fas fa-check-circle"></i> Переведено
                </button>
                <button class="withdraw-reject-btn" onclick="rejectWithdrawRequest('${request.id}')">
                    <i class="fas fa-times-circle"></i> Отмена
                </button>
            </div>
        </div>
    `).join('');
}

// Функция инициализации страницы вывода (для пользователя)
window.initWithdrawPage = function() {
    console.log('🔄 Инициализация страницы вывода');
    
    // Обновляем данные пользователя
    const profile = JSON.parse(localStorage.getItem('apex_profile') || '{"balance": 0}');
    currentBalance = profile.balance || 0;
    currentUser = localStorage.getItem('apex_user') || 'Гость';
    
    const balanceEl = document.getElementById('withdrawBalanceAmount');
    const methodsContainer = document.getElementById('methodsList');
    const withdrawDetailsInput = document.getElementById('withdrawDetails');
    const withdrawAmountInput = document.getElementById('withdrawAmount');
    const commissionValueSpan = document.getElementById('commissionValue');
    const totalWithdrawSpan = document.getElementById('totalWithdraw');
    const submitBtn = document.getElementById('submitWithdrawBtn');
    const detailsLabel = document.getElementById('detailsLabel');
    
    if (!methodsContainer) {
        console.error('❌ methodsList не найден');
        return;
    }
    
    if (balanceEl) balanceEl.innerText = currentBalance.toFixed(2) + ' ₽';
    
    // Рендерим методы
    function renderMethods() {
        if (!methodsContainer) return;
        methodsContainer.innerHTML = '';
        withdrawMethods.forEach(method => {
            const methodDiv = document.createElement('div');
            methodDiv.className = `method-item ${selectedMethod.id === method.id ? 'selected' : ''}`;
            methodDiv.innerHTML = `
                <div class="method-icon ${method.iconClass}">
                    <i class="${method.icon}"></i>
                </div>
                <div class="method-info">
                    <div class="method-name">${method.name}</div>
                    <div class="method-desc">Комиссия: ${(method.commission * 100).toFixed(0)}%</div>
                </div>
                <div class="method-commission">от ${method.minAmount}₽</div>
            `;
            methodDiv.addEventListener('click', () => {
                selectedMethod = method;
                renderMethods();
                if (detailsLabel) detailsLabel.innerText = method.detailsLabel;
                if (withdrawDetailsInput) withdrawDetailsInput.placeholder = method.placeholder;
                updateCommission();
                validateWithdraw();
            });
            methodsContainer.appendChild(methodDiv);
        });
    }
    
    function updateCommission() {
        const amount = parseFloat(withdrawAmountInput?.value);
        if (isNaN(amount) || amount <= 0) {
            if (commissionValueSpan) commissionValueSpan.innerText = '0 ₽';
            if (totalWithdrawSpan) totalWithdrawSpan.innerText = '0 ₽';
            return;
        }
        const commission = amount * selectedMethod.commission;
        const total = amount + commission;
        if (commissionValueSpan) commissionValueSpan.innerText = commission.toFixed(2) + ' ₽';
        if (totalWithdrawSpan) totalWithdrawSpan.innerText = total.toFixed(2) + ' ₽';
    }
    
    function validateWithdraw() {
        const amount = parseFloat(withdrawAmountInput?.value);
        const details = withdrawDetailsInput?.value.trim();
        const isValid = !isNaN(amount) && amount >= selectedMethod.minAmount && amount <= currentBalance && details && details.length >= 3;
        if (submitBtn) submitBtn.disabled = !isValid;
    }
    
    function requestWithdraw() {
        const amount = parseFloat(withdrawAmountInput?.value);
        const details = withdrawDetailsInput?.value.trim();
        
        if (isNaN(amount) || amount < selectedMethod.minAmount) {
            showToastWithdraw(`Минимальная сумма: ${selectedMethod.minAmount} ₽`, 'error');
            return;
        }
        if (amount > currentBalance) {
            showToastWithdraw(`Недостаточно средств. Доступно: ${currentBalance.toFixed(2)} ₽`, 'error');
            return;
        }
        if (!details) {
            showToastWithdraw('Введите реквизиты', 'error');
            return;
        }
        
        const commission = amount * selectedMethod.commission;
        const total = amount + commission;
        
        // Сохраняем заявку
        const requests = JSON.parse(localStorage.getItem('apex_withdraw_requests') || '[]');
        requests.push({
            id: Date.now(),
            date: new Date().toLocaleString(),
            userName: currentUser,
            method: selectedMethod.name,
            amount: amount,
            commission: commission,
            total: total,
            details: details,
            status: 'pending'
        });
        localStorage.setItem('apex_withdraw_requests', JSON.stringify(requests));
        
        // Списываем баланс
        const newBalance = currentBalance - total;
        const profile = JSON.parse(localStorage.getItem('apex_profile') || '{}');
        profile.balance = newBalance;
        localStorage.setItem('apex_profile', JSON.stringify(profile));
        
        currentBalance = newBalance;
        if (balanceEl) balanceEl.innerText = newBalance.toFixed(2) + ' ₽';
        
        showToastWithdraw(`✅ Заявка на вывод ${amount} ₽ создана! Ожидайте подтверждения администратора.`, 'success');
        
        if (withdrawAmountInput) withdrawAmountInput.value = '';
        if (withdrawDetailsInput) withdrawDetailsInput.value = '';
        updateCommission();
        validateWithdraw();
    }
    
    // Настройка пресетов
    document.querySelectorAll('.preset-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => {
            if (withdrawAmountInput) withdrawAmountInput.value = newBtn.getAttribute('data-amount');
            updateCommission();
            validateWithdraw();
        });
    });
    
    // Слушатели
    if (withdrawAmountInput) {
        withdrawAmountInput.oninput = () => { updateCommission(); validateWithdraw(); };
    }
    if (withdrawDetailsInput) {
        withdrawDetailsInput.oninput = validateWithdraw;
    }
    if (submitBtn) {
        const newSubmitBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
        newSubmitBtn.onclick = requestWithdraw;
    }
    
    renderMethods();
    updateCommission();
    validateWithdraw();
    
    console.log('✅ Страница вывода инициализирована');
};

// Локальный toast для страницы вывода
function showToastWithdraw(message, type = 'success') {
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }
    
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i><span>${message}</span>`;
    toast.classList.add('show', type);
    
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Функция для обновления админ-панели (добавить в админку)
function initAdminWithdrawSection() {
    renderAdminWithdrawRequests();
    
    // Обновляем каждые 10 секунд
    setInterval(renderAdminWithdrawRequests, 10000);
}

// Экспорт функций
window.approveWithdrawRequest = approveWithdrawRequest;
window.rejectWithdrawRequest = rejectWithdrawRequest;
window.renderAdminWithdrawRequests = renderAdminWithdrawRequests;
window.initAdminWithdrawSection = initAdminWithdrawSection;
window.sendWithdrawNotificationToUser = sendWithdrawNotificationToUser;

console.log('✅ withdraw.js загружен (полная версия с админ-панелью)');