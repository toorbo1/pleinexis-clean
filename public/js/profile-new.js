// ===== PROFILE PAGE - FULLY FUNCTIONAL =====

(function() {
  'use strict';
  
  console.log('🔥 Cyber-Premium Profile JS загружен');
  
// ===== ДАННЫЕ ПОЛЬЗОВАТЕЛЯ =====
let currentUser = localStorage.getItem('apex_user') || 'Гость';
let userProfile = JSON.parse(localStorage.getItem('apex_profile') || '{}');

// Инициализация профиля по умолчанию - ВСЕ ПО НУЛЯМ
if (!userProfile.username) {
  userProfile = {
    id: 'user_' + Date.now(),
    username: currentUser,
    balance: 0,           // 0 рублей
    rating: 0,            // 0 рейтинг
    reviewsCount: 0,      // 0 отзывов
    productsCount: 0,     // 0 товаров
    purchasesCount: 0,    // 0 покупок
    salesCount: 0,        // 0 продаж
    activeOrders: 0,      // 0 активных
    completedOrders: 0,   // 0 завершённых
    joinedDate: new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
    verified: false,      // не верифицирован
    avatarUrl: null
  };
  localStorage.setItem('apex_profile', JSON.stringify(userProfile));
}
  
  // ===== ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ =====
  function initProfilePage() {
    console.log('🔄 Инициализация профиля...');
    updateBalance();
    updateStats();
    updateTabs();
    loadUserProducts();
    setupEventListeners();
    setupAdminButton();
    setupShopButton();

    // Привязываем обработчик к кнопке "+" на балансе
    const topupBtn = document.getElementById('quickTopupBtn');
    if (topupBtn) {
        const newBtn = topupBtn.cloneNode(true);
        topupBtn.parentNode.replaceChild(newBtn, topupBtn);
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const modal = document.getElementById('quickTopupModal');
            if (modal) {
                modal.style.display = 'flex';
            } else {
                console.error('❌ Модальное окно quickTopupModal не найдено!');
            }
        });
        console.log('✅ Обработчик на кнопку + привязан');
    } else {
        console.warn('⚠️ Кнопка quickTopupBtn не найдена при инициализации профиля');
    }

    console.log('✅ Профиль инициализирован');
}
  // ===== ОБНОВЛЕНИЕ ИНФОРМАЦИИ ПРОФИЛЯ =====
  function updateProfileInfo() {
    const usernameEl = document.getElementById('profileUsername');
    const avatarCircle = document.getElementById('profileAvatarCircle');
    const avatarSpan = document.getElementById('avatarInitial');
    const ratingValue = document.getElementById('profileRatingValue');
    const reviewsLink = document.getElementById('profileReviewsLink');
    const joinedEl = document.getElementById('profileJoined');
    const verifiedBadge = document.getElementById('verifiedBadge');
    
    if (usernameEl) {
      usernameEl.textContent = userProfile.username || currentUser;
    }
    
    if (avatarSpan) {
      avatarSpan.textContent = (userProfile.username || currentUser).charAt(0).toUpperCase();
    }
    
    // Аватар из Google/VK или сохранённый
    const savedAvatar = localStorage.getItem('apex_user_picture') || localStorage.getItem('profileAvatarImage');
    if (savedAvatar && avatarCircle) {
      avatarCircle.style.backgroundImage = `url(${savedAvatar})`;
      avatarCircle.style.backgroundSize = 'cover';
      avatarCircle.style.backgroundPosition = 'center';
      if (avatarSpan) avatarSpan.style.display = 'none';
    }
    
    if (ratingValue) {
      ratingValue.textContent = (userProfile.rating || 5.0).toFixed(1);
    }
    
    if (reviewsLink) {
      const count = userProfile.reviewsCount || 0;
      reviewsLink.textContent = `${count} ${getReviewWord(count)}`;
    }
    
    if (joinedEl) {
      joinedEl.innerHTML = `<i class="far fa-calendar"></i> на платформе с ${userProfile.joinedDate || 'января 2024'}`;
    }
    
    if (verifiedBadge) {
      verifiedBadge.style.display = userProfile.verified ? 'inline-flex' : 'none';
    }
    
    updateStars(userProfile.rating || 5.0);
  }
  
  function updateStars(rating) {
    const starsContainer = document.querySelector('.stars');
    if (!starsContainer) return;
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    
    let html = '';
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        html += '<i class="fas fa-star"></i>';
      } else if (i === fullStars && hasHalfStar) {
        html += '<i class="fas fa-star-half-alt"></i>';
      } else {
        html += '<i class="far fa-star"></i>';
      }
    }
    starsContainer.innerHTML = html;
  }
  
  function getReviewWord(count) {
    if (count % 10 === 1 && count % 100 !== 11) return 'отзыв';
    if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'отзыва';
    return 'отзывов';
  }
  
  // ===== ОБНОВЛЕНИЕ БАЛАНСА =====
  function updateBalance() {
    const balanceEl = document.getElementById('profileBalance');
    if (balanceEl) {
      const balance = userProfile.balance || 0;
      balanceEl.textContent = formatBalance(balance);
    }
  }
  
  function formatBalance(amount) {
    if (amount >= 1000) {
      return (amount / 1000).toFixed(1) + 'K ₽';
    }
    return amount + ' ₽';
  }
  
  // ===== ОБНОВЛЕНИЕ СТАТИСТИКИ =====
  function updateStats() {
    const productsCount = document.getElementById('profileProductsCount');
    const purchasesCount = document.getElementById('profilePurchasesCount');
    const salesCount = document.getElementById('profileSalesCount');
    
    if (productsCount) productsCount.textContent = userProfile.productsCount || 0;
    if (purchasesCount) purchasesCount.textContent = userProfile.purchasesCount || 0;
    if (salesCount) salesCount.textContent = userProfile.salesCount || 0;
  }
  
  function updateTabs() {
    const activeCount = document.getElementById('activeCount');
    const completedCount = document.getElementById('completedCount');
    
    if (activeCount) activeCount.textContent = userProfile.activeOrders || 0;
    if (completedCount) completedCount.textContent = userProfile.completedOrders || 0;
  }
  
  // ===== ЗАГРУЗКА ТОВАРОВ ПОЛЬЗОВАТЕЛЯ =====
  async function loadUserProducts() {
    const container = document.getElementById('profileProductsList');
    if (!container) return;
    
    try {
      let products = [];
      try {
        const response = await fetch('/api/products?_=' + Date.now());
        if (response.ok) {
          products = await response.json();
        }
      } catch (e) {
        products = JSON.parse(localStorage.getItem('apex_products') || '[]');
      }
      
      const userProducts = products.filter(p => p.seller === currentUser);
      
      userProfile.productsCount = userProducts.length;
      localStorage.setItem('apex_profile', JSON.stringify(userProfile));
      updateStats();
      
      if (userProducts.length === 0) {
        showEmptyState(container);
        return;
      }
      
      container.innerHTML = userProducts.slice(0, 10).map(product => `
        <div class="product-item" onclick="window.openProductDetailById('${product.id}')">
          <img class="product-img" src="${product.image_url || 'https://picsum.photos/id/42/100/100'}" alt="${escapeHtml(product.title)}" onerror="this.src='https://picsum.photos/id/42/100/100'">
          <div class="product-info">
            <div class="product-title">${escapeHtml(product.title)}</div>
            <div class="product-price">${escapeHtml(product.price)}</div>
            <span class="product-status"><i class="fas fa-check-circle"></i> Активный</span>
          </div>
          <div class="product-actions">
            <button class="product-btn" onclick="event.stopPropagation(); window.editProduct('${product.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="product-btn" onclick="event.stopPropagation(); window.deleteProduct('${product.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `).join('');
      
    } catch (e) {
      console.error('Ошибка загрузки товаров:', e);
      showEmptyState(container);
    }
  }
  
  function showEmptyState(container) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="18" y="12" width="84" height="70" rx="16" fill="url(#emptyGrad)" stroke="#8b5cf6" stroke-width="1.8" stroke-opacity="0.5"/>
            <rect x="28" y="90" width="64" height="8" rx="4" fill="#8b5cf6" opacity="0.5"/>
            <rect x="38" y="104" width="44" height="6" rx="3" fill="#3b82f6" opacity="0.4"/>
            <defs>
              <linearGradient id="emptyGrad" x1="0" y1="0" x2="1" y2="1">
                <stop stop-color="#8b5cf6" stop-opacity="0.15"/>
                <stop offset="1" stop-color="#3b82f6" stop-opacity="0.05"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h3 class="empty-title">Ваша витрина пуста</h3>
        <p class="empty-desc">Начните зарабатывать на продаже игровых ключей и подписок. Ваши товары увидят тысячи геймеров.</p>
        <button class="btn-primary" onclick="window.showCreateProductForm()">
          <i class="fas fa-plus"></i> Выставить товар
        </button>
      </div>
    `;
  }
  
  // ===== НАСТРОЙКА ОБРАБОТЧИКОВ =====
  function setupEventListeners() {
    const balanceCard = document.querySelector('.balance-card');
    if (balanceCard) {
      balanceCard.addEventListener('click', function() {
        if (typeof window.showPage === 'function') {
          window.showPage('withdrawPage');
        } else {
          showToast('💰 Страница вывода средств', 'info');
        }
      });
    }
    
    const reviewsLink = document.getElementById('profileReviewsLink');
    if (reviewsLink) {
      reviewsLink.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof window.showPage === 'function') {
          window.showPage('reviewsPage');
        } else {
          showToast('📝 Страница отзывов', 'info');
        }
      });
    }
    
    const tabBtns = document.querySelectorAll('.profile-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        tabBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const tab = this.getAttribute('data-tab');
        filterProducts(tab);
      });
    });
    
    const logoutBtn = document.getElementById('profileLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
    }
  }
  
  function filterProducts(tab) {
    console.log('🔄 Фильтрация товаров:', tab);
    loadUserProducts();
  }
  
  // ===== КНОПКА АДМИН-ПАНЕЛИ =====
  function setupAdminButton() {
    const adminBtn = document.getElementById('adminProfileBtn');
    if (!adminBtn) return;
    
    let admins = [];
    try {
      admins = JSON.parse(localStorage.getItem('apex_admins') || '[]');
    } catch (e) {
      admins = [];
    }
    
    const isAdmin = admins.some(a => a.username === currentUser);
    
    if (isAdmin) {
      adminBtn.innerHTML = '<i class="fas fa-user-shield"></i> Админ-панель';
      adminBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
    } else {
      adminBtn.innerHTML = '<i class="fas fa-lock"></i> Войти в админ-панель';
    }
    
    const newBtn = adminBtn.cloneNode(true);
    adminBtn.parentNode.replaceChild(newBtn, adminBtn);
    
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      let admins = JSON.parse(localStorage.getItem('apex_admins') || '[]');
      const isAdminNow = admins.some(a => a.username === currentUser);
      
      if (isAdminNow) {
        openAdminPanel();
      } else {
        const password = prompt('🔐 Введите пароль администратора:');
        if (password === 'admin123') {
          if (!admins.some(a => a.username === currentUser)) {
            admins.push({
              id: 'admin_' + Date.now(),
              username: currentUser,
              isOwner: false,
              hiredBy: 'system',
              hiredAt: new Date().toISOString()
            });
            localStorage.setItem('apex_admins', JSON.stringify(admins));
          }
          openAdminPanel();
          showToast('✅ Доступ к админ-панели получен!', 'success');
          setTimeout(() => {
            newBtn.innerHTML = '<i class="fas fa-user-shield"></i> Админ-панель';
            newBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
          }, 100);
        } else {
          showToast('❌ Неверный пароль!', 'error');
        }
      }
    });
  }
  
  function openAdminPanel() {
    if (typeof window.showPage === 'function') {
      window.showPage('admin');
      setTimeout(() => {
        if (typeof window.initAdmin === 'function') {
          window.initAdmin();
        }
      }, 100);
    } else {
      showToast('🛡️ Админ-панель', 'info');
    }
  }
  
  // ===== КНОПКА ПОДКЛЮЧЕНИЯ ВИТРИНЫ =====
function setupShopButton() {
    const shopBtn = document.getElementById('connectShopBtn');
    if (!shopBtn) return;
    
    const newBtn = shopBtn.cloneNode(true);
    shopBtn.parentNode.replaceChild(newBtn, shopBtn);
    
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🛒 КЛИК ПО КНОПКЕ ВИТРИНЫ');
        
        const user = localStorage.getItem('apex_user') || 'Гость';
        const sellers = JSON.parse(localStorage.getItem('apex_verified_sellers') || '[]');
        const application = JSON.parse(localStorage.getItem(`shop_application_${user}`) || 'null');
        
        if (sellers.includes(user)) {
            if (typeof window.showPage === 'function') window.showPage('products-manage');
            return;
        }
        
        if (application && application.status === 'pending') {
            if (typeof window.showPage === 'function') {
                window.showPage('shopConnectPage');
                setTimeout(() => {
                    if (typeof window.initShopConnectPage === 'function') {
                        window.initShopConnectPage();
                    }
                }, 50);
            }
            return;
        }
        
        if (typeof window.showPage === 'function') {
            window.showPage('shopConnectPage');
            setTimeout(() => {
                if (typeof window.initShopConnectPage === 'function') {
                    window.initShopConnectPage();
                }
            }, 50);
        }
    });
}
  
  function logout() {
    if (confirm('Вы уверены, что хотите выйти из аккаунта?')) {
      localStorage.removeItem('apex_user');
      localStorage.removeItem('apex_user_id');
      localStorage.removeItem('apex_user_email');
      localStorage.removeItem('apex_user_picture');
      window.location.reload();
    }
  }
  
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  
  function showToast(message, type = 'success') {
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }
    const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle');
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    toast.classList.add('show', type);
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
  
  // ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ =====
  window.editProduct = function(productId) {
    console.log('✏️ Редактирование товара:', productId);
    if (typeof window.showPage === 'function') {
      window.showPage('products-manage');
    }
    showToast('✏️ Редактирование товара', 'info');
  };
  
  window.deleteProduct = async function(productId) {
    if (!confirm('Удалить этот товар?')) return;
    try {
      const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Ошибка удаления');
      showToast('✅ Товар удалён', 'success');
      loadUserProducts();
      if (typeof window.loadProducts === 'function') {
        await window.loadProducts();
      }
    } catch (e) {
      let products = JSON.parse(localStorage.getItem('apex_products') || '[]');
      products = products.filter(p => p.id !== productId);
      localStorage.setItem('apex_products', JSON.stringify(products));
      showToast('✅ Товар удалён (локально)', 'success');
      loadUserProducts();
    }
  };
  
  window.showCreateProductForm = function() {
    if (typeof window.showPage === 'function') {
      window.showPage('products-manage');
      setTimeout(() => {
        if (typeof window.showCreateProductForm === 'function') {
          window.showCreateProductForm();
        }
      }, 100);
    } else {
      showToast('📦 Создание товара', 'info');
    }
  };
  
  window.initProfilePage = initProfilePage;
  window.updateProfileInfo = updateProfileInfo;
  window.loadUserProducts = loadUserProducts;
  
  // Автозапуск
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.target.id === 'profile' && mutation.target.classList.contains('active')) {
        setTimeout(initProfilePage, 50);
      }
    });
  });
  
  const profilePage = document.getElementById('profile');
  if (profilePage) {
    observer.observe(profilePage, { attributes: true, attributeFilter: ['class'] });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      if (profilePage && profilePage.classList.contains('active')) {
        initProfilePage();
      }
    });
  } else {
    if (profilePage && profilePage.classList.contains('active')) {
      setTimeout(initProfilePage, 50);
    }
  }
  
})();
// Принудительная инициализация при загрузке страницы
(function forceInit() {
  const profilePage = document.getElementById('profile');
  if (profilePage) {
    // Ждём 500мс после загрузки DOM и принудительно запускаем
    setTimeout(() => {
      console.log('🔥 FORCE INIT PROFILE');
      if (typeof window.initProfilePage === 'function') {
        window.initProfilePage();
      }
    }, 500);
  }
})();

// Функция пополнения баланса
async function topUpBalance(amount) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        showToast('Необходимо войти в аккаунт', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/user/topup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ amount })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Обновляем локальный профиль
            userProfile.balance = data.balance;
            localStorage.setItem('apex_profile', JSON.stringify(userProfile));
            
            // Обновляем отображение
            updateBalance();
            
            showToast(data.message, 'success');
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Ошибка соединения', 'error');
    }
}

// Добавить кнопку пополнения в профиль
function addTopUpButton() {
  const balanceCard = document.querySelector('.balance-card');
if (balanceCard) {
    balanceCard.addEventListener('click', function(e) {
        // Если клик был по кнопке пополнения - не переходим
        if (e.target.closest('#topUpBtn')) return;
        
        if (typeof window.showPage === 'function') {
            window.showPage('topupPage');
        }
    });
}}

// Добавить кнопку быстрого пополнения
function addTopUpButton() {
    const balanceCard = document.querySelector('.balance-card');
    if (!balanceCard) return;
    if (document.getElementById('topUpBtn')) return;
    
    const topUpBtn = document.createElement('button');
    topUpBtn.id = 'topUpBtn';
    topUpBtn.innerHTML = '<i class="fas fa-plus-circle"></i>';
    topUpBtn.title = 'Пополнить баланс';
    topUpBtn.style.cssText = `
        position: absolute;
        right: 60px;
        top: 50%;
        transform: translateY(-50%);
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #22c55e, #16a34a);
        border: none;
        border-radius: 50%;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
    `;
    
    topUpBtn.addEventListener('mouseenter', () => {
        topUpBtn.style.transform = 'translateY(-50%) scale(1.1)';
    });
    topUpBtn.addEventListener('mouseleave', () => {
        topUpBtn.style.transform = 'translateY(-50%) scale(1)';
    });
    
    topUpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof window.showPage === 'function') {
            window.showPage('topupPage');
        }
    });
    
    balanceCard.style.position = 'relative';
    balanceCard.appendChild(topUpBtn);
}

// Модальное окно пополнения
function showTopUpModal() {
    const amounts = [100, 500, 1000, 5000];
    
    const modal = document.createElement('div');
    modal.className = 'modal-glass';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 350px;">
            <h3 style="margin-bottom: 20px; color: white;">
                <i class="fas fa-wallet" style="color: #22c55e;"></i> Пополнение баланса
            </h3>
            <p style="color: #94a3b8; margin-bottom: 20px; font-size: 0.9rem;">
                Выберите сумму пополнения:
            </p>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px;">
                ${amounts.map(amt => `
                    <button class="amount-option" data-amount="${amt}" style="
                        padding: 16px;
                        background: rgba(255,255,255,0.05);
                        border: 1px solid rgba(59,130,246,0.3);
                        border-radius: 16px;
                        color: white;
                        font-size: 1.2rem;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">${amt} ₽</button>
                `).join('')}
            </div>
            <div style="display: flex; gap: 12px;">
                <button class="btn-secondary" onclick="this.closest('.modal-glass').remove()" style="flex: 1;">
                    Отмена
                </button>
            </div>
            <p style="color: #6b7280; font-size: 0.7rem; text-align: center; margin-top: 16px;">
                <i class="fas fa-shield-alt"></i> Тестовое пополнение (демо)
            </p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обработчики для кнопок сумм
    modal.querySelectorAll('.amount-option').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'rgba(34, 197, 94, 0.2)';
            btn.style.borderColor = '#22c55e';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'rgba(255,255,255,0.05)';
            btn.style.borderColor = 'rgba(59,130,246,0.3)';
        });
        btn.addEventListener('click', async () => {
            const amount = parseInt(btn.dataset.amount);
            modal.remove();
            await topUpBalance(amount);
        });
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Экспорт
window.topUpBalance = topUpBalance;
window.showTopUpModal = showTopUpModal;