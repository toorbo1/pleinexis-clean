// ========== НОВЫЙ ДИЗАЙН ПРОФИЛЯ (ФИКС ДЛЯ РАЗНЫХ АККАУНТОВ) ==========

(function() {
  // Функция для получения имени пользователя
  function getCurrentUser() {
    return localStorage.getItem('apex_user') || 'Гость';
  }

  // Ключи для хранения с учетом пользователя
  function getUserKey(baseKey) {
    return baseKey + '_' + getCurrentUser();
  }

  let profileHeroBg = localStorage.getItem(getUserKey('profileHeroBg')) || null;
  let profileAvatarBg = localStorage.getItem(getUserKey('profileAvatarBg')) || null;
  
  // Фоновые пресеты для hero-секции
  const heroBgPresets = [
    { name: 'Тёмный градиент', style: 'linear-gradient(135deg, #11131f, #0a0c16)' },
    { name: 'Космос', style: 'radial-gradient(circle at 30% 20%, #0f0c29, #24243e, #302b63)' },
    { name: 'Магма', style: 'linear-gradient(145deg, #2b0f1c, #5e2a3e, #1a0a12)' },
    { name: 'Океан', style: 'linear-gradient(125deg, #001f3f, #0a2f44, #004d66)' },
    { name: 'Фиолетовая дымка', style: 'linear-gradient(115deg, #1e1a3a, #2b2d5c, #1a1b3a)' },
    { name: 'Зелёные джунгли', style: 'linear-gradient(145deg, #0f2b1f, #1c4a2e, #0a2a1a)' },
    { name: 'Закат', style: 'linear-gradient(105deg, #2c1a2e, #803d3d, #b9734b)' },
    { name: 'Синий металлик', style: 'linear-gradient(95deg, #0a192f, #0f2c4e, #1c4e70)' }
  ];
  
  // Пресеты для аватара
  const avatarBgPresets = [
    { name: 'Градиент 1', style: 'linear-gradient(135deg, #667eea, #764ba2)' },
    { name: 'Градиент 2', style: 'linear-gradient(135deg, #f093fb, #f5576c)' },
    { name: 'Градиент 3', style: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
    { name: 'Градиент 4', style: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
    { name: 'Градиент 5', style: 'linear-gradient(135deg, #fa709a, #fee140)' },
    { name: 'Космос', style: 'radial-gradient(circle, #1a0f2e, #1e1b4b)' },
    { name: 'Неон', style: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)' }
  ];
  
  function initNewProfile() {
    // Обновляем ссылки на текущие сохраненные значения
    profileHeroBg = localStorage.getItem(getUserKey('profileHeroBg')) || null;
    profileAvatarBg = localStorage.getItem(getUserKey('profileAvatarBg')) || null;

    const heroSection = document.getElementById('profileHeroSection');
    if (heroSection && profileHeroBg) {
      heroSection.style.background = profileHeroBg;
      heroSection.style.backgroundSize = 'cover';
      heroSection.style.backgroundPosition = 'center';
    } else if (heroSection) {
      // Сбрасываем на дефолтный, если нет сохраненного
      heroSection.style.background = 'linear-gradient(135deg, #11131f, #0a0c16)';
    }
    
    const avatarCircle = document.getElementById('profileAvatarCircle');
    if (avatarCircle && profileAvatarBg) {
      avatarCircle.style.backgroundImage = profileAvatarBg;
      avatarCircle.style.backgroundSize = 'cover';
      avatarCircle.style.backgroundPosition = 'center';
      avatarCircle.classList.add('has-bg');
    } else if (avatarCircle) {
      // Сбрасываем аватар
      avatarCircle.style.backgroundImage = '';
      avatarCircle.style.background = '';
      avatarCircle.classList.remove('has-bg');
      const span = avatarCircle.querySelector('span');
      if (span) {
        span.style.display = 'flex';
        span.innerText = getCurrentUser().charAt(0).toUpperCase();
      }
    }
    
    setupHeroBgButton();
    setupAvatarChangeButton();
    setupBalanceClick();
    setupReviewsClick();
    setupShopWindowButton();
    
    rebuildHeroLayout();
    resetProfileStats();
    showAdminButtonInProfile();
    addLogoutButton();
  }
  
  // ========== КНОПКА ВЫХОДА ИЗ АККАУНТА ==========
  function addLogoutButton() {
    if (document.getElementById('logoutProfileBtn')) return;
    
    const paymentMethods = document.querySelector('.profile-payment-methods');
    if (!paymentMethods) return;
    
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logoutProfileBtn';
    logoutBtn.className = 'shop-window-btn';
    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Выйти из аккаунта';
    logoutBtn.style.background = 'linear-gradient(105deg, #ef4444, #dc2626)';
    logoutBtn.style.marginTop = '16px';
    
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (confirm('Вы уверены, что хотите выйти из аккаунта?')) {
        localStorage.removeItem('apex_user');
        localStorage.removeItem('apex_user_id');
        localStorage.removeItem('apex_user_email');
        localStorage.removeItem('apex_user_picture');
        // Не удаляем настройки профиля, они привязаны к старому ключу и не помешают новому
        window.location.reload();
      }
    });
    
    paymentMethods.insertAdjacentElement('afterend', logoutBtn);
  }
  
function showAdminButtonInProfile() {
    const adminBtn = document.getElementById('adminProfileBtn');
    if (!adminBtn) return;
    
    const currentUser = getCurrentUser();
    
    // Проверяем, является ли пользователь админом
    let admins = [];
    try {
        admins = JSON.parse(localStorage.getItem('apex_admins') || '[]');
    } catch(e) {
        admins = [];
    }
    const isAdmin = admins.some(a => a.username === currentUser);
    
    // ВСЕГДА показываем кнопку
    adminBtn.style.display = 'flex';
    
    if (isAdmin) {
        adminBtn.innerHTML = '<i class="fas fa-user-shield"></i> Админ-панель';
        adminBtn.style.background = 'linear-gradient(105deg, #ef4444, #dc2626)';
    } else {
        adminBtn.innerHTML = '<i class="fas fa-lock"></i> Войти в админ-панель';
        adminBtn.style.background = 'linear-gradient(105deg, #f59e0b, #d97706)';
    }
    
    // ВАЖНО: Полностью удаляем и пересоздаем кнопку, чтобы убрать все старые обработчики
    const newBtn = document.createElement('button');
    newBtn.id = 'adminProfileBtn';
    newBtn.className = 'shop-window-btn';
    newBtn.innerHTML = adminBtn.innerHTML;
    newBtn.style.cssText = adminBtn.style.cssText;
    
    // Заменяем старую кнопку на новую
    adminBtn.parentNode.replaceChild(newBtn, adminBtn);
    
    // Вешаем НОВЫЙ обработчик
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation(); // Останавливаем все другие обработчики
        
        console.log('🖱️ АДМИН-КНОПКА: Клик обработан');
        
        const currentUser = getCurrentUser();
        let admins = JSON.parse(localStorage.getItem('apex_admins') || '[]');
        const isAdmin = admins.some(a => a.username === currentUser);
        
        if (isAdmin) {
            // Уже админ - сразу открываем панель
            console.log('✅ Открываем админ-панель');
            if (typeof window.showPage === 'function') {
                window.showPage('admin');
            }
            setTimeout(() => {
                if (typeof window.initAdmin === 'function') {
                    window.initAdmin();
                }
            }, 100);
        } else {
            // Не админ - запрашиваем пароль
            const password = prompt("🔐 Введите пароль администратора:");
            if (password === "admin123") {
                // Добавляем в админы
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
                
                // Открываем админку
                if (typeof window.showPage === 'function') {
                    window.showPage('admin');
                }
                setTimeout(() => {
                    if (typeof window.initAdmin === 'function') {
                        window.initAdmin();
                    }
                }, 100);
                
                showToast('✅ Доступ к админ-панели получен!', 'success');
            } else {
                showToast('❌ Неверный пароль!', 'error');
            }
        }
    });
    
    console.log('✅ Кнопка админ-панели настроена, isAdmin:', isAdmin);
}

function setupShopWindowButton() {
    const shopBtn = document.querySelector('#connectShopBtn');
    if (!shopBtn) return;
    
    const newBtn = shopBtn.cloneNode(true);
    shopBtn.parentNode.replaceChild(newBtn, shopBtn);
    
    newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const user = getCurrentUser();
        const sellers = JSON.parse(localStorage.getItem('apex_verified_sellers') || '[]');
        const application = JSON.parse(localStorage.getItem(`shop_application_${user}`) || 'null');
        
        if (sellers.includes(user)) {
            if (typeof showPage === 'function') showPage('products-manage');
            return;
        }
        
        if (application && application.status === 'pending') {
            if (typeof showPage === 'function') showPage('shopConnectPage');
            return;
        }
        
        if (typeof showPage === 'function') {
            showPage('shopConnectPage');
            if (typeof initShopConnectPage === 'function') setTimeout(initShopConnectPage, 50);
        }
    });
}
  
  function resetProfileStats() {
    if (window.userProfile) {
      const products = JSON.parse(localStorage.getItem('apex_products') || '[]');
      const userProducts = products.filter(p => p.seller === getCurrentUser());
      
      window.userProfile.productsCount = userProducts.length;
      window.userProfile.purchasesCount = 0;
      window.userProfile.salesCount = 0;
      window.userProfile.activeOrders = userProducts.filter(p => p.status !== 'completed').length;
      window.userProfile.completedOrders = userProducts.filter(p => p.status === 'completed').length;
      window.userProfile.balance = 0;
      window.userProfile.rating = 5.0;
      window.userProfile.reviewsCount = 0;
      localStorage.setItem("apex_profile", JSON.stringify(window.userProfile));
    }
    
    updateNewProfileStats(window.userProfile || {
      productsCount: 0, purchasesCount: 0, salesCount: 0, activeOrders: 0, completedOrders: 0, balance: 0,
      joinedDate: "января 2026", reviewsCount: 0
    });
  }
  
  function rebuildHeroLayout() {
    const heroSection = document.getElementById('profileHeroSection');
    if (!heroSection || heroSection.querySelector('.hero-content')) return;
    
    const avatarHtml = heroSection.querySelector('.avatar-centered')?.outerHTML || '';
    const infoHtml = heroSection.querySelector('.hero-info')?.outerHTML || '';
    
    const newContent = document.createElement('div');
    newContent.className = 'hero-content';
    newContent.innerHTML = avatarHtml + infoHtml;
    
    const oldAvatar = heroSection.querySelector('.avatar-centered');
    const oldInfo = heroSection.querySelector('.hero-info');
    if (oldAvatar && oldInfo) {
      heroSection.removeChild(oldAvatar);
      heroSection.removeChild(oldInfo);
      heroSection.insertBefore(newContent, heroSection.firstChild);
    }
  }
  
  function setupHeroBgButton() {
    const changeBtn = document.getElementById('changeHeroBgBtn');
    if (!changeBtn) return;
    const newBtn = changeBtn.cloneNode(true);
    changeBtn.parentNode.replaceChild(newBtn, changeBtn);
    newBtn.addEventListener('click', () => openHeroBgModal());
  }
  
  function openHeroBgModal() {
    let modal = document.getElementById('profileHeroBgModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'profileHeroBgModal';
      modal.className = 'profile-modal';
      modal.innerHTML = `
        <div class="profile-modal-card">
          <h4>🎨 Фон вокруг аватара</h4>
          <div class="bg-options" id="heroBgOptions"></div>
          <div class="modal-actions">
            <button class="modal-btn danger" id="removeHeroBgBtn">🗑️ Удалить фон</button>
            <button class="modal-btn" id="closeHeroBgModal">Закрыть</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      const container = modal.querySelector('#heroBgOptions');
      heroBgPresets.forEach(preset => {
        const option = document.createElement('div');
        option.className = 'bg-option';
        option.style.background = preset.style;
        option.title = preset.name;
        option.addEventListener('click', () => {
          const heroSection = document.getElementById('profileHeroSection');
          if (heroSection) {
            heroSection.style.background = preset.style;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
            localStorage.setItem(getUserKey('profileHeroBg'), preset.style);
          }
          modal.classList.remove('active');
        });
        container.appendChild(option);
      });
      
      modal.querySelector('#removeHeroBgBtn').addEventListener('click', () => {
        const heroSection = document.getElementById('profileHeroSection');
        if (heroSection) {
          heroSection.style.background = 'linear-gradient(135deg, #11131f, #0a0c16)';
          localStorage.removeItem(getUserKey('profileHeroBg'));
        }
        modal.classList.remove('active');
      });
      
      modal.querySelector('#closeHeroBgModal').addEventListener('click', () => modal.classList.remove('active'));
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
    }
    modal.classList.add('active');
  }
  
  function setupAvatarChangeButton() {
    const avatarWrapper = document.querySelector('.avatar-wrapper');
    if (!avatarWrapper) return;
    
    if (!avatarWrapper.querySelector('.change-avatar-btn')) {
      const changeBtn = document.createElement('div');
      changeBtn.className = 'change-avatar-btn';
      changeBtn.innerHTML = '<i class="fas fa-camera"></i>';
      changeBtn.title = 'Сменить аватар';
      avatarWrapper.appendChild(changeBtn);
      changeBtn.addEventListener('click', openAvatarBgModal);
    }
  }
  
  function openAvatarBgModal() {
    let modal = document.getElementById('profileAvatarBgModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'profileAvatarBgModal';
      modal.className = 'profile-modal';
      modal.innerHTML = `
        <div class="profile-modal-card">
          <h4>🎨 Аватар</h4>
          <div class="bg-options" id="avatarBgOptions"></div>
          <div class="modal-actions">
            <button class="modal-btn danger" id="removeAvatarBgBtn">🗑️ Сбросить</button>
            <button class="modal-btn" id="closeAvatarBgModal">Закрыть</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      const container = modal.querySelector('#avatarBgOptions');
      avatarBgPresets.forEach(preset => {
        const option = document.createElement('div');
        option.className = 'bg-option';
        option.style.background = preset.style;
        option.title = preset.name;
        option.addEventListener('click', () => {
          const avatarCircle = document.getElementById('profileAvatarCircle');
          if (avatarCircle) {
            avatarCircle.style.backgroundImage = preset.style;
            avatarCircle.style.backgroundSize = 'cover';
            avatarCircle.style.backgroundPosition = 'center';
            avatarCircle.classList.add('has-bg');
            localStorage.setItem(getUserKey('profileAvatarBg'), preset.style);
          }
          modal.classList.remove('active');
        });
        container.appendChild(option);
      });
      
      modal.querySelector('#removeAvatarBgBtn').addEventListener('click', () => {
        const avatarCircle = document.getElementById('profileAvatarCircle');
        if (avatarCircle) {
          avatarCircle.style.backgroundImage = '';
          avatarCircle.style.background = '';
          avatarCircle.classList.remove('has-bg');
          localStorage.removeItem(getUserKey('profileAvatarBg'));
        }
        modal.classList.remove('active');
      });
      
      modal.querySelector('#closeAvatarBgModal').addEventListener('click', () => modal.classList.remove('active'));
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
    }
    modal.classList.add('active');
  }
  
function setupBalanceClick() {
    const balanceCard = document.querySelector('.profile-balance-card');
    if (!balanceCard) return;
    
    const newBalanceCard = balanceCard.cloneNode(true);
    balanceCard.parentNode.replaceChild(newBalanceCard, balanceCard);
    
    newBalanceCard.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('💰 Клик по балансу, открываем страницу вывода');
        
        // Показываем страницу вывода
        if (typeof window.showPage === 'function') {
            window.showPage('withdrawPage');
        }
        
        // Инициализируем страницу вывода после того, как она отобразится
        setTimeout(function() {
            if (typeof window.initWithdrawPage === 'function') {
                window.initWithdrawPage();
                console.log('✅ withdrawPage инициализирована');
            } else {
                console.error('❌ initWithdrawPage не найдена');
            }
        }, 100);
    });
}


  function setupReviewsClick() {
    const reviewsLink = document.getElementById('profileReviewsLink');
    if (!reviewsLink) return;
    
    const newLink = reviewsLink.cloneNode(true);
    reviewsLink.parentNode.replaceChild(newLink, reviewsLink);
    
    newLink.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (typeof window.showPage === 'function') {
        if (typeof window.initReviewsPage === 'function') setTimeout(() => window.initReviewsPage(), 50);
        window.showPage('reviewsPage');
      }
    });
  }
  
  function updateNewProfileStats(profileData) {
    const productsCountEl = document.getElementById('profileProductsCount');
    const purchasesCountEl = document.getElementById('profilePurchasesCount');
    const salesCountEl = document.getElementById('profileSalesCount');
    const activeCountEl = document.getElementById('activeCount');
    const completedCountEl = document.getElementById('completedCount');
    const balanceEl = document.getElementById('profileBalance');
    const usernameEl = document.getElementById('profileUsername');
    const joinedEl = document.getElementById('profileJoined');
    
    if (productsCountEl) productsCountEl.innerText = profileData.productsCount || 0;
    if (purchasesCountEl) purchasesCountEl.innerText = profileData.purchasesCount || 0;
    if (salesCountEl) salesCountEl.innerText = profileData.salesCount || 0;
    if (activeCountEl) activeCountEl.innerText = profileData.activeOrders || 0;
    if (completedCountEl) completedCountEl.innerText = profileData.completedOrders || 0;
    if (balanceEl) balanceEl.innerText = (profileData.balance || 0).toFixed(2) + ' ₽';
    if (usernameEl) usernameEl.innerText = getCurrentUser();
    if (joinedEl && profileData.joinedDate) joinedEl.innerText = `на Плейнексис с ${profileData.joinedDate}`;
    
    const avatarSpan = document.querySelector('#profileAvatarCircle span');
    if (avatarSpan) {
      avatarSpan.innerText = getCurrentUser().charAt(0).toUpperCase();
    }
  }

  // Экспорт
  window.initNewProfile = initNewProfile;
  window.updateNewProfileStats = updateNewProfileStats;
  
  // Запуск
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('profileHeroSection')) setTimeout(initNewProfile, 100);
    });
  } else {
    if (document.getElementById('profileHeroSection')) setTimeout(initNewProfile, 100);
  }
})();