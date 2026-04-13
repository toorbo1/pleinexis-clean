// ========== СТРАНИЦА ВЫВОДА СРЕДСТВ ==========

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

// Функция инициализации (ГЛОБАЛЬНАЯ)
window.initWithdrawPage = function() {
    console.log('🔄 Инициализация страницы вывода');
    
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
    
    // Обновляем данные пользователя
    const profile = JSON.parse(localStorage.getItem('apex_profile') || '{"balance": 0}');
    currentBalance = profile.balance || 0;
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
            alert(`Минимальная сумма: ${selectedMethod.minAmount} ₽`);
            return;
        }
        if (amount > currentBalance) {
            alert(`Недостаточно средств. Доступно: ${currentBalance.toFixed(2)} ₽`);
            return;
        }
        if (!details) {
            alert('Введите реквизиты');
            return;
        }
        
        const commission = amount * selectedMethod.commission;
        const total = amount + commission;
        
        // Сохраняем заявку
        const requests = JSON.parse(localStorage.getItem('apex_withdraw_requests') || '[]');
        requests.push({
            id: Date.now(),
            date: new Date().toLocaleString(),
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
        
        alert(`✅ Заявка на вывод ${amount} ₽ создана!`);
        
        if (withdrawAmountInput) withdrawAmountInput.value = '';
        if (withdrawDetailsInput) withdrawDetailsInput.value = '';
        updateCommission();
        validateWithdraw();
    }
    
    // Настройка пресетов
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.onclick = () => {
            if (withdrawAmountInput) withdrawAmountInput.value = btn.getAttribute('data-amount');
            updateCommission();
            validateWithdraw();
        };
    });
    
    // Слушатели
    if (withdrawAmountInput) withdrawAmountInput.oninput = () => { updateCommission(); validateWithdraw(); };
    if (withdrawDetailsInput) withdrawDetailsInput.oninput = validateWithdraw;
    if (submitBtn) submitBtn.onclick = requestWithdraw;
    
    renderMethods();
    updateCommission();
    validateWithdraw();
    
    console.log('✅ Страница вывода инициализирована');
};

// Принудительно вызываем, если страница уже видна
setTimeout(() => {
    const withdrawPage = document.getElementById('withdrawPage');
    if (withdrawPage && (withdrawPage.classList.contains('active') || withdrawPage.style.display === 'block')) {
        console.log('📄 Страница вывода уже видна, инициализируем');
        window.initWithdrawPage();
    }
}, 200);

console.log('✅ withdraw.js загружен');