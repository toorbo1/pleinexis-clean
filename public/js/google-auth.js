// ========== АВТОРИЗАЦИЯ ЧЕРЕЗ GOOGLE ==========

(function() {
  // Конфигурация Google OAuth
  // ВАЖНО: Замените на свои реальные Client ID после создания проекта в Google Cloud Console
  const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
  
  // Загружаем Google API скрипт
  function loadGoogleScript() {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  // Инициализация Google One Tap
  async function initGoogleOneTap() {
    try {
      await loadGoogleScript();
      
      // Проверяем, есть ли уже залогиненный пользователь
      const currentUser = localStorage.getItem('apex_user');
      if (currentUser && currentUser !== 'Гость') {
        return; // Уже залогинены
      }
      
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin'
      });
      
      // Показываем One Tap только на главной странице
      const activePage = document.querySelector('.page.active');
      if (activePage && activePage.id === 'home') {
        window.google?.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            console.log('One Tap not displayed:', notification.getNotDisplayedReason());
          }
        });
      }
    } catch (error) {
      console.error('Google One Tap initialization error:', error);
    }
  }
  
  // Обработка ответа от Google
  async function handleGoogleCredentialResponse(response) {
    try {
      // Декодируем JWT токен
      const credential = response.credential;
      const payload = parseJwt(credential);
      
      const userData = {
        id: payload.sub,
        email: payload.email,
        username: payload.name,
        givenName: payload.given_name,
        familyName: payload.family_name,
        picture: payload.picture,
        emailVerified: payload.email_verified
      };
      
      console.log('Google user data:', userData);
      
      // Сохраняем пользователя
      await saveOrUpdateUser(userData);
      
      // Обновляем UI
      updateUIAfterLogin(userData);
      
      showToast(`Добро пожаловать, ${userData.username}!`, 'success');
      
    } catch (error) {
      console.error('Google auth error:', error);
      showToast('Ошибка при входе через Google', 'error');
    }
  }
  
  // Декодирование JWT
  function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  }
  
  // Сохранение или обновление пользователя
  async function saveOrUpdateUser(userData) {
    // Отправляем на сервер
    try {
      const response = await fetch('/api/users/google-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        const serverUser = await response.json();
        localStorage.setItem('apex_user', serverUser.username);
        localStorage.setItem('apex_user_id', serverUser.id);
        localStorage.setItem('apex_user_email', userData.email);
        localStorage.setItem('apex_user_picture', userData.picture);
        
        // Сохраняем профиль
        window.userProfile = {
          id: serverUser.id,
          username: serverUser.username,
          email: userData.email,
          avatarUrl: userData.picture,
          balance: serverUser.balance || 0,
          productsCount: 0,
          purchasesCount: 0,
          salesCount: 0,
          activeOrders: 0,
          completedOrders: 0,
          rating: 5.0,
          reviewsCount: 0,
          joinedDate: new Date().toISOString().split('T')[0]
        };
        localStorage.setItem('apex_profile', JSON.stringify(window.userProfile));
        
        return serverUser;
      }
    } catch (error) {
      console.error('Server save error:', error);
    }
    
    // Fallback для локального сохранения (если сервер недоступен)
    let users = JSON.parse(localStorage.getItem('apex_users') || '[]');
    let existingUser = users.find(u => u.email === userData.email);
    
    if (!existingUser) {
      existingUser = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        picture: userData.picture,
        balance: 0,
        joinedDate: new Date().toISOString()
      };
      users.push(existingUser);
      localStorage.setItem('apex_users', JSON.stringify(users));
    }
    
    localStorage.setItem('apex_user', existingUser.username);
    localStorage.setItem('apex_user_id', existingUser.id);
    localStorage.setItem('apex_user_email', existingUser.email);
    localStorage.setItem('apex_user_picture', existingUser.picture);
    
    return existingUser;
  }
  
  // Обновление UI после входа
  function updateUIAfterLogin(userData) {
    // Обновляем имя в профиле
    const usernameEl = document.getElementById('profileUsername');
    if (usernameEl) usernameEl.innerText = userData.username;
    
    // Обновляем аватар, если есть картинка
    if (userData.picture) {
      const avatarCircle = document.getElementById('profileAvatarCircle');
      if (avatarCircle) {
        avatarCircle.style.backgroundImage = `url(${userData.picture})`;
        avatarCircle.style.backgroundSize = 'cover';
        avatarCircle.style.backgroundPosition = 'center';
        avatarCircle.classList.add('has-bg');
        const span = avatarCircle.querySelector('span');
        if (span) span.style.display = 'none';
        localStorage.setItem('profileAvatarImage', userData.picture);
      }
    }
    
    // Обновляем инициал в аватаре если нет картинки
    if (!userData.picture) {
      const avatarSpan = document.querySelector('#profileAvatarCircle span');
      if (avatarSpan) {
        avatarSpan.innerText = userData.username.charAt(0).toUpperCase();
        avatarSpan.style.display = 'flex';
      }
    }
    
    // Обновляем статистику
    if (typeof updateNewProfileStats === 'function' && window.userProfile) {
      updateNewProfileStats(window.userProfile);
    }
    
    // Перезагружаем товары пользователя
    if (typeof loadUserProductsInProfile === 'function') {
      loadUserProductsInProfile();
    }
  }
  
  // Кнопка входа через Google (для страницы входа, если она есть)
  function renderGoogleButton(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    loadGoogleScript().then(() => {
      window.google?.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: container.offsetWidth
      });
      
      window.google?.accounts.id.prompt();
    });
  }
  
  // Выход из аккаунта
  function logout() {
    // Очищаем localStorage
    localStorage.removeItem('apex_user');
    localStorage.removeItem('apex_user_id');
    localStorage.removeItem('apex_user_email');
    localStorage.removeItem('apex_user_picture');
    localStorage.removeItem('apex_profile');
    
    // Сбрасываем аватар
    const avatarCircle = document.getElementById('profileAvatarCircle');
    if (avatarCircle) {
      avatarCircle.style.backgroundImage = '';
      avatarCircle.style.background = '';
      avatarCircle.classList.remove('has-bg');
      const span = avatarCircle.querySelector('span');
      if (span) {
        span.style.display = 'flex';
        span.innerText = 'Г';
      }
    }
    
    // Сбрасываем имя
    const usernameEl = document.getElementById('profileUsername');
    if (usernameEl) usernameEl.innerText = 'Гость';
    
    // Сбрасываем статистику
    if (typeof resetProfileStats === 'function') {
      resetProfileStats();
    }
    
    showToast('Вы вышли из аккаунта', 'success');
    
    // Перезагружаем страницу для полного сброса
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  }
  
  // Показываем кнопку выхода в профиле
  function addLogoutButton() {
    const profileContainer = document.querySelector('.profile-new-container');
    if (!profileContainer) return;
    
    // Проверяем, есть ли уже кнопка выхода
    if (document.querySelector('.logout-btn')) return;
    
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'logout-btn';
    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Выйти';
    logoutBtn.style.cssText = `
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
      padding: 12px 20px;
      border-radius: 40px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 20px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    `;
    
    logoutBtn.addEventListener('mouseenter', () => {
      logoutBtn.style.background = '#ef4444';
      logoutBtn.style.color = 'white';
    });
    
    logoutBtn.addEventListener('mouseleave', () => {
      logoutBtn.style.background = 'rgba(239, 68, 68, 0.2)';
      logoutBtn.style.color = '#ef4444';
    });
    
    logoutBtn.addEventListener('click', logout);
    
    // Добавляем после payment методов
    const paymentMethods = document.querySelector('.profile-payment-methods');
    if (paymentMethods) {
      paymentMethods.after(logoutBtn);
    } else {
      profileContainer.appendChild(logoutBtn);
    }
  }
  
  // Инициализация Google Auth
  async function initGoogleAuth() {
    if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
      console.warn('Google Client ID не настроен. Замените YOUR_GOOGLE_CLIENT_ID на реальный ID из Google Cloud Console');
      return;
    }
    
    await initGoogleOneTap();
    addLogoutButton();
  }
  
  // Toast уведомление
  function showToast(message, type = 'success') {
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }
    
    toast.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
      <span>${message}</span>
    `;
    toast.className = `toast-notification ${type} show`;
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
  
  // Экспорт функций
  window.initGoogleAuth = initGoogleAuth;
  window.renderGoogleButton = renderGoogleButton;
  window.logout = logout;
  
  // Автоматическая инициализация
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGoogleAuth);
  } else {
    initGoogleAuth();
  }
})();