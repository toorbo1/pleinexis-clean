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
    
    // Инициализируем профиль
    if (typeof initProfile === 'function') {
        initProfile();
    }
    
    console.log('✅ Auth initialized, user:', username);
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

// Экспорт
window.initAuth = initAuth;

// Автозапуск
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}