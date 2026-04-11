// ============ ВРЕМЕННЫЙ FIX ДЛЯ АВТОРИЗАЦИИ ==========

window.currentUser = null;

async function initAuth() {
    let username = localStorage.getItem("apex_user");
    
    if (!username || username === "null" || username === "undefined") {
        username = prompt("Добро пожаловать! Введите ваш никнейм:") || "Гость";
        localStorage.setItem("apex_user", username);
    }
    
    window.currentUser = username;
    
    // Обновляем UI - только имя
    const usernameEl = document.getElementById("profileUsername");
    if (usernameEl) usernameEl.innerText = username;
    
    // НЕ СБРАСЫВАЕМ аватар здесь - это сделает profile-new.js при загрузке сохраненных данных
    
    console.log('✅ Auth initialized, user:', username);
}

// Выход из аккаунта
function logout() {
    if (confirm('Вы уверены, что хотите выйти из аккаунта?')) {
        // Очищаем только данные сессии
        localStorage.removeItem('apex_user');
        localStorage.removeItem('apex_user_id');
        localStorage.removeItem('apex_user_email');
        localStorage.removeItem('apex_user_picture');
        
        // Перезагружаем страницу
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

// Заглушки
window.openAvatarBgModal = function() {
    console.log('openAvatarBgModal - используем profile-new.js');
};
window.openHeroBgModal = function() {
    console.log('openHeroBgModal - используем profile-new.js');
};

// Экспорт
window.initAuth = initAuth;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.getUserKey = getUserKey;

// Автозапуск
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}

console.log('✅ auth-fix.js загружен');