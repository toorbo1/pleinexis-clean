// ========== СТРАНИЦА ПОПОЛНЕНИЯ БАЛАНСА ==========

let selectedAmount = 500;
let selectedMethod = 'card';

function initTopupPage() {
    console.log('💰 Инициализация страницы пополнения');
    updateBalanceDisplay();
    setupAmountSelection();
    setupPaymentMethodSelection();
    setupCustomAmount();
    setupSubmitButton();
}

function updateBalanceDisplay() {
    const profile = JSON.parse(localStorage.getItem('apex_profile') || '{"balance": 0}');
    const balanceEl = document.getElementById('topupBalanceAmount');
    if (balanceEl) {
        balanceEl.textContent = formatBalance(profile.balance || 0);
    }
}

function formatBalance(amount) {
    return amount.toLocaleString('ru-RU') + ' ₽';
}

function setupAmountSelection() {
    const amountCards = document.querySelectorAll('.amount-card');
    const customInput = document.getElementById('customAmountInput');
    
    amountCards.forEach(card => {
        card.addEventListener('click', () => {
            amountCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedAmount = parseInt(card.dataset.amount);
            if (customInput) customInput.value = '';
        });
    });
    
    const defaultCard = document.querySelector('[data-amount="500"]');
    if (defaultCard) {
        defaultCard.classList.add('selected');
        selectedAmount = 500;
    }
}

function setupPaymentMethodSelection() {
    const methods = document.querySelectorAll('.payment-method');
    methods.forEach(method => {
        method.addEventListener('click', () => {
            methods.forEach(m => m.classList.remove('selected'));
            method.classList.add('selected');
            selectedMethod = method.dataset.method;
        });
    });
}

function setupCustomAmount() {
    const customInput = document.getElementById('customAmountInput');
    const amountCards = document.querySelectorAll('.amount-card');
    
    if (customInput) {
        customInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^0-9]/g, '');
            if (value) {
                const amount = parseInt(value);
                if (amount >= 100) {
                    selectedAmount = amount;
                    amountCards.forEach(c => c.classList.remove('selected'));
                }
            }
        });
    }
}

function setupSubmitButton() {
    const submitBtn = document.getElementById('topupSubmitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', processTopup);
    }
}

async function processTopup() {
    const token = localStorage.getItem('auth_token');
    const currentUser = localStorage.getItem('apex_user');
    
    if (!token || !currentUser || currentUser === 'Гость') {
        alert('Для пополнения необходимо войти в аккаунт');
        return;
    }
    
    if (selectedAmount < 100) {
        alert('Минимальная сумма пополнения 100 ₽');
        return;
    }
    
    const submitBtn = document.getElementById('topupSubmitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обработка...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/api/user/topup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ amount: selectedAmount, method: selectedMethod })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const profile = JSON.parse(localStorage.getItem('apex_profile') || '{}');
            profile.balance = data.balance;
            localStorage.setItem('apex_profile', JSON.stringify(profile));
            updateBalanceDisplay();
            alert(`✅ Баланс пополнен на ${selectedAmount} ₽`);
        } else {
            alert(data.error || 'Ошибка пополнения');
        }
    } catch (error) {
        alert('Ошибка соединения с сервером');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

window.initTopupPage = initTopupPage;
window.processTopup = processTopup;