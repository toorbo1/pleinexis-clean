// ============ ВРЕМЕННЫЙ FIX ДЛЯ АВТОРИЗАЦИИ ==========

window.currentUser = null;

async function initAuth() {
    let username = localStorage.getItem("apex_user");
    
    if (!username || username === "null" || username === "undefined") {
        username = prompt("Добро пожаловать! Введите ваш никнейм:") || "Гость";
        localStorage.setItem("apex_user", username);
    }
    
    window.currentUser = username;
    
    // Обновляем UI
    const usernameEl = document.getElementById("profileUsername");
    if (usernameEl) usernameEl.innerText = username;
    
    // ===== ФИКС: Сбрасываем старый дизайн аватара при смене пользователя =====
    const avatarCircle = document.getElementById('profileAvatarCircle');
    if (avatarCircle) {
        // Сбрасываем фоновое изображение и градиент
        avatarCircle.style.backgroundImage = '';
        avatarCircle.style.background = '';
        avatarCircle.classList.remove('has-bg');
        
        // Показываем текстовую заглушку с первой буквой имени
        const span = avatarCircle.querySelector('span');
        if (span) {
            span.style.display = 'flex';
            span.innerText = username.charAt(0).toUpperCase();
        }
    }
    
    // Сбрасываем фон hero-секции к дефолтному
    const heroSection = document.getElementById('profileHeroSection');
    if (heroSection) {
        heroSection.style.background = 'linear-gradient(135deg, #11131f, #0a0c16)';
        heroSection.style.backgroundImage = '';
        heroSection.style.backgroundSize = '';
        heroSection.style.backgroundPosition = '';
    }
    // ===== КОНЕЦ ФИКСА =====
    
    // Инициализируем профиль
    if (typeof initProfile === 'function') {
        initProfile();
    }
    
    // Инициализируем новый профиль (если есть функция)
    if (typeof initNewProfile === 'function') {
        setTimeout(() => {
            initNewProfile();
        }, 100);
    }
    
    console.log('✅ Auth initialized, user:', username);
}

// Выход из аккаунта
function logout() {
    if (confirm('Вы уверены, что хотите выйти из аккаунта?')) {
        // Очищаем только данные сессии, но НЕ настройки профиля
        // (настройки профиля привязаны к имени пользователя через getUserKey)
        localStorage.removeItem('apex_user');
        localStorage.removeItem('apex_user_id');
        localStorage.removeItem('apex_user_email');
        localStorage.removeItem('apex_user_picture');
        
        // Перезагружаем страницу для полного сброса состояния
        window.location.reload();
    }
}

// Функция для получения имени текущего пользователя
function getCurrentUser() {
    return localStorage.getItem('apex_user') || 'Гость';
}

// Функция для создания ключа, привязанного к пользователю
function getUserKey(baseKey) {
    return baseKey + '_' + getCurrentUser();
}

// Заглушки для отсутствующих функций
window.openAvatarBgModal = function() {
    console.log('openAvatarBgModal - заглушка');
    alert('Выбор градиента для аватара будет доступен позже');
};

window.openHeroBgModal = function() {
    console.log('openHeroBgModal - заглушка');
    alert('Выбор градиента для фона будет доступен позже'); 
};

// Смена пользователя (для отладки)
window.switchUser = function() {
    const newUsername = prompt("Введите имя нового пользователя:") || "Гость";
    localStorage.setItem('apex_user', newUsername);
    window.location.reload();
};

// Экспорт функций в глобальную область
window.initAuth = initAuth;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.getUserKey = getUserKey;

// Автозапуск при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}

// Добавляем кнопку выхода в профиль при каждой загрузке страницы профиля
document.addEventListener('DOMContentLoaded', function() {
    // Ждем немного, чтобы DOM точно был готов
    setTimeout(function() {
        // Проверяем, есть ли уже кнопка выхода
        if (!document.getElementById('logoutProfileBtn')) {
            const paymentMethods = document.querySelector('.profile-payment-methods');
            if (paymentMethods) {
                const logoutBtn = document.createElement('button');
                logoutBtn.id = 'logoutProfileBtn';
                logoutBtn.className = 'shop-window-btn';
                logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Выйти из аккаунта';
                logoutBtn.style.background = 'linear-gradient(105deg, #ef4444, #dc2626)';
                logoutBtn.style.marginTop = '16px';
                logoutBtn.style.width = '100%';
                
                logoutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    logout();
                });
                
                paymentMethods.insertAdjacentElement('afterend', logoutBtn);
            }
        }
        
        // Добавляем кнопку смены пользователя (для отладки, можно скрыть)
        if (!document.getElementById('switchUserBtn') && window.location.hostname === 'localhost') {
            const profileContainer = document.querySelector('.profile-new-container');
            if (profileContainer) {
                const switchBtn = document.createElement('button');
                switchBtn.id = 'switchUserBtn';
                switchBtn.className = 'shop-window-btn';
                switchBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Сменить пользователя (отладка)';
                switchBtn.style.background = 'linear-gradient(105deg, #6b7280, #4b5563)';
                switchBtn.style.marginTop = '8px';
                switchBtn.style.fontSize = '0.8rem';
                
                switchBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    switchUser();
                });
                
                const logoutBtn = document.getElementById('logoutProfileBtn');
                if (logoutBtn) {
                    logoutBtn.insertAdjacentElement('afterend', switchBtn);
                }
            }
        }
    }, 500);
});

console.log('✅ auth-fix.js загружен (с фиксом для разных аккаунтов)');