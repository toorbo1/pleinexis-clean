// ========== СТРАНИЦА ПОПОЛНЕНИЯ БАЛАНСА ==========

let selectedAmount = 500;
let selectedMethod = 'card';

// Инициализация страницы
function initTopupPage() {
    console.log('💰 Инициализация страницы пополнения');
    
    // Обновляем отображение баланса
    updateBalanceDisplay();
    
    // Настройка выбора суммы
    setupAmountSelection();
    
    // Настройка выбора способа оплаты
    setupPaymentMethodSelection();
    
    // Настройка своей суммы
    setupCustomAmount();
    
    // Настройка кнопки пополнения
    setupSubmitButton();
}

// Обновление отображения баланса
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

// Выбор суммы из пресетов
function setupAmountSelection() {
    const amountCards = document.querySelectorAll('.amount-card');
    const customInput = document.getElementById('customAmountInput');
    
    amountCards.forEach(card => {
        card.addEventListener('click', () => {
            // Убираем selected у всех карточек
            amountCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            
            // Получаем сумму
            const amount = parseInt(card.dataset.amount);
            selectedAmount = amount;
            
            // Очищаем поле своей суммы
            if (customInput) {
                customInput.value = '';
            }
            
            console.log('💰 Выбрана сумма:', selectedAmount);
        });
    });
    
    // По умолчанию выбираем 500 ₽
    const defaultCard = document.querySelector('[data-amount="500"]');
    if (defaultCard) {
        defaultCard.classList.add('selected');
        selectedAmount = 500;
    }
}

// Выбор способа оплаты
function setupPaymentMethodSelection() {
    const methods = document.querySelectorAll('.payment-method');
    
    methods.forEach(method => {
        method.addEventListener('click', () => {
            methods.forEach(m => m.classList.remove('selected'));
            method.classList.add('selected');
            selectedMethod = method.dataset.method;
            console.log('💳 Выбран способ оплаты:', selectedMethod);
        });
    });
}

// Своя сумма
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
                    // Убираем selected у пресетов
                    amountCards.forEach(c => c.classList.remove('selected'));
                }
            }
        });
        
        customInput.addEventListener('blur', () => {
            let value = customInput.value.replace(/[^0-9]/g, '');
            if (value) {
                let amount = parseInt(value);
                if (amount < 100) {
                    amount = 100;
                    customInput.value = 100;
                }
                selectedAmount = amount;
            }
        });
    }
}

// Кнопка пополнения
function setupSubmitButton() {
    const submitBtn = document.getElementById('topupSubmitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', processTopup);
    }
}

// Обработка пополнения
async function processTopup() {
    const token = localStorage.getItem('auth_token');
    const currentUser = localStorage.getItem('apex_user');
    
    if (!token || !currentUser || currentUser === 'Гость') {
        showTopupToast('Для пополнения необходимо войти в аккаунт', 'error');
        setTimeout(() => {
            if (typeof window.auth !== 'undefined' && window.auth.showAuthModal) {
                window.auth.showAuthModal('login');
            }
        }, 1500);
        return;
    }
    
    if (selectedAmount < 100) {
        showTopupToast('Минимальная сумма пополнения 100 ₽', 'error');
        return;
    }
    
    // Показываем загрузку
    const submitBtn = document.getElementById('topupSubmitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обработка...';
    submitBtn.disabled = true;
    
    try {
        // Отправляем запрос на сервер
        const response = await fetch('/api/user/topup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                amount: selectedAmount,
                method: selectedMethod
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Обновляем локальный профиль
            const profile = JSON.parse(localStorage.getItem('apex_profile') || '{}');
            profile.balance = data.balance;
            localStorage.setItem('apex_profile', JSON.stringify(profile));
            
            // Обновляем отображение
            updateBalanceDisplay();
            
            showTopupToast(`✅ Баланс пополнен на ${selectedAmount} ₽`, 'success');
            
            // Очищаем выбор
            document.querySelectorAll('.amount-card').forEach(c => c.classList.remove('selected'));
            document.querySelector('[data-amount="500"]')?.classList.add('selected');
            selectedAmount = 500;
            const customInput = document.getElementById('customAmountInput');
            if (customInput) customInput.value = '';
            
            // Обновляем профиль на главной если открыт
            if (typeof window.updateProfileInfo === 'function') {
                window.updateProfileInfo();
            }
        } else {
            showTopupToast(data.error || 'Ошибка пополнения', 'error');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showTopupToast('Ошибка соединения с сервером', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Показать уведомление
function showTopupToast(message, type = 'success') {
    let toast = document.getElementById('topupToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'topupToast';
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    toast.className = `toast-notification ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Экспорт
window.initTopupPage = initTopupPage;
window.processTopup = processTopup;

// Автоинициализация при открытии страницы
document.addEventListener('DOMContentLoaded', () => {
    const topupPage = document.getElementById('topupPage');
    if (topupPage) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.classList.contains('active')) {
                    initTopupPage();
                }
            });
        });
        observer.observe(topupPage, { attributes: true, attributeFilter: ['class'] });
    }
});