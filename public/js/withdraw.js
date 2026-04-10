// ========== СТРАНИЦА ВЫВОДА СРЕДСТВ ==========

(function() {
  // Получаем данные пользователя
  let currentUser = localStorage.getItem('apex_user') || 'Гость';
  let userProfile = JSON.parse(localStorage.getItem('apex_profile') || '{"balance": 0, "joinedDate": "января 2026", "productsCount": 0, "purchasesCount": 0, "salesCount": 0, "activeOrders": 0, "completedOrders": 0, "rating": 5.0, "reviewsCount": 0}');
  
  // Методы вывода
  const withdrawMethods = [
    { id: 'card', name: 'Банковская карта', icon: 'fas fa-credit-card', iconClass: 'card', placeholder: 'Номер карты (16 цифр)', commission: 0.02, minAmount: 100, detailsLabel: 'Номер карты' },
    { id: 'qiwi', name: 'QIWI Кошелёк', icon: 'fab fa-qiwi', iconClass: 'qiwi', placeholder: 'Номер телефона QIWI', commission: 0.01, minAmount: 100, detailsLabel: 'QIWI номер' },
    { id: 'crypto', name: 'Криптовалюта (USDT)', icon: 'fab fa-bitcoin', iconClass: 'crypto', placeholder: 'Адрес USDT (TRC20/ERC20)', commission: 0.03, minAmount: 500, detailsLabel: 'USDT адрес' },
    { id: 'phone', name: 'Мобильный телефон', icon: 'fas fa-mobile-alt', iconClass: 'phone', placeholder: 'Номер телефона', commission: 0.05, minAmount: 100, detailsLabel: 'Номер телефона' },
    { id: 'telegram', name: 'Telegram Stars', icon: 'fab fa-telegram', iconClass: 'telegram', placeholder: 'Ваш Telegram ID или @username', commission: 0.0, minAmount: 100, detailsLabel: 'Telegram ID' }
  ];
  
  let selectedMethod = withdrawMethods[0];
  let currentBalance = userProfile.balance || 0;
  
  // DOM элементы
  const balanceEl = document.getElementById('withdrawBalanceAmount');
  const methodsContainer = document.getElementById('methodsList');
  const withdrawDetailsInput = document.getElementById('withdrawDetails');
  const withdrawAmountInput = document.getElementById('withdrawAmount');
  const commissionValueSpan = document.getElementById('commissionValue');
  const totalWithdrawSpan = document.getElementById('totalWithdraw');
  const submitBtn = document.getElementById('submitWithdrawBtn');
  const detailsLabel = document.getElementById('detailsLabel');
  
  // Функция показа тоста
  function showToast(message, type = 'success') {
    let toast = document.getElementById('toastMessage');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toastMessage';
      toast.className = 'toast-notification';
      toast.innerHTML = '<i class="fas fa-check-circle"></i><span></span>';
      document.body.appendChild(toast);
    }
    const icon = toast.querySelector('i');
    const text = toast.querySelector('span');
    icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
    text.innerText = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
  
  // Обновление комиссии и итога
  function updateCommission() {
    let amount = parseFloat(withdrawAmountInput?.value);
    if (isNaN(amount) || amount <= 0) {
      if (commissionValueSpan) commissionValueSpan.innerText = '0 ₽';
      if (totalWithdrawSpan) totalWithdrawSpan.innerText = '0 ₽';
      return;
    }
    const commissionRate = selectedMethod.commission;
    const commissionAmount = amount * commissionRate;
    const total = amount + commissionAmount;
    if (commissionValueSpan) commissionValueSpan.innerText = commissionAmount.toFixed(2) + ' ₽';
    if (totalWithdrawSpan) totalWithdrawSpan.innerText = total.toFixed(2) + ' ₽';
  }
  
  // Рендер методов
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
        updateDetailsPlaceholder();
        updateCommission();
        if (withdrawDetailsInput) withdrawDetailsInput.value = '';
        validateWithdraw();
      });
      methodsContainer.appendChild(methodDiv);
    });
  }
  
  function updateDetailsPlaceholder() {
    if (detailsLabel) detailsLabel.innerText = selectedMethod.detailsLabel;
    if (withdrawDetailsInput) withdrawDetailsInput.placeholder = selectedMethod.placeholder;
  }
  
  // Обработка пресетов суммы
  function setupPresets() {
    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const amount = parseInt(btn.getAttribute('data-amount'));
        if (withdrawAmountInput) withdrawAmountInput.value = amount;
        updateCommission();
        validateWithdraw();
      });
    });
  }
  
  // Валидация и обновление кнопки
  function validateWithdraw() {
    const amount = parseFloat(withdrawAmountInput?.value);
    const details = withdrawDetailsInput?.value.trim();
    const isValidAmount = !isNaN(amount) && amount >= selectedMethod.minAmount && amount <= currentBalance;
    const isValidDetails = details && details.length >= 3;
    if (submitBtn) submitBtn.disabled = !(isValidAmount && isValidDetails);
    return isValidAmount && isValidDetails;
  }
  
  // Основная функция вывода
  function requestWithdraw() {
    const amount = parseFloat(withdrawAmountInput?.value);
    const details = withdrawDetailsInput?.value.trim();
    const totalWithCommission = amount + (amount * selectedMethod.commission);
    
    if (isNaN(amount) || amount < selectedMethod.minAmount) {
      showToast(`Минимальная сумма вывода ${selectedMethod.minAmount} ₽`, 'error');
      return;
    }
    if (amount > currentBalance) {
      showToast(`Недостаточно средств. Доступно: ${currentBalance.toFixed(2)} ₽`, 'error');
      return;
    }
    if (!details) {
      showToast('Введите реквизиты для вывода', 'error');
      return;
    }
    
    // Создаём заявку на вывод
    const withdrawRequest = {
      id: Date.now(),
      userId: currentUser,
      method: selectedMethod.name,
      methodId: selectedMethod.id,
      amount: amount,
      commission: amount * selectedMethod.commission,
      total: totalWithCommission,
      details: details,
      status: 'pending',
      date: new Date().toISOString(),
      dateFormatted: new Date().toLocaleString()
    };
    
    // Сохраняем заявку
    let withdrawRequests = JSON.parse(localStorage.getItem('apex_withdraw_requests') || '[]');
    withdrawRequests.push(withdrawRequest);
    localStorage.setItem('apex_withdraw_requests', JSON.stringify(withdrawRequests));
    
    // Списываем баланс
    const newBalance = currentBalance - totalWithCommission;
    userProfile.balance = newBalance;
    localStorage.setItem('apex_profile', JSON.stringify(userProfile));
    
    currentBalance = newBalance;
    if (balanceEl) balanceEl.innerText = currentBalance.toFixed(2) + ' ₽';
    
    // Очищаем поля
    if (withdrawAmountInput) withdrawAmountInput.value = '';
    if (withdrawDetailsInput) withdrawDetailsInput.value = '';
    updateCommission();
    validateWithdraw();
    
    showToast(`Заявка на вывод ${amount.toFixed(2)} ₽ создана! Статус: обработка`, 'success');
    
    // Обновляем UI
    if (typeof window.updateProfileUI === 'function') {
      window.updateProfileUI();
    }
    if (typeof window.updateNewProfileStats === 'function' && window.userProfile) {
      window.userProfile.balance = newBalance;
      window.updateNewProfileStats(window.userProfile);
    }
  }
  
  // Инициализация страницы вывода
  function initWithdrawPage() {
    currentBalance = userProfile.balance || 0;
    if (balanceEl) balanceEl.innerText = currentBalance.toFixed(2) + ' ₽';
    renderMethods();
    updateDetailsPlaceholder();
    setupPresets();
    updateCommission();
    validateWithdraw();
    
    if (submitBtn) {
      submitBtn.addEventListener('click', requestWithdraw);
    }
  }
  
  // Слушаем обновления баланса
  window.addEventListener('storage', (e) => {
    if (e.key === 'apex_profile') {
      const newProfile = JSON.parse(e.newValue || '{"balance":0}');
      currentBalance = newProfile.balance || 0;
      userProfile = newProfile;
      if (balanceEl) balanceEl.innerText = currentBalance.toFixed(2) + ' ₽';
      validateWithdraw();
      updateCommission();
    }
  });
  
  // Экспортируем
  window.initWithdrawPage = initWithdrawPage;
  
  // Автозапуск если страница активна
  if (document.getElementById('withdrawPage') && document.getElementById('withdrawPage').classList.contains('active')) {
    initWithdrawPage();
  }
})();