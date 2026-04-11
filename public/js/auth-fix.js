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
    
    // Инициализируем админов если их нет
    initDefaultAdmins();
    
    console.log('✅ Auth initialized, user:', username);
}

// Инициализация админов по умолчанию
function initDefaultAdmins() {
    let admins = JSON.parse(localStorage.getItem('apex_admins') || '[]');
    const currentUser = localStorage.getItem('apex_user') || 'Гость';
    
    // Если админов нет, создаем владельца
    if (admins.length === 0) {
        admins.push({
            id: 'admin_' + Date.now(),
            username: 'Admin',
            isOwner: true,
            hiredBy: 'system',
            hiredAt: new Date().toISOString()
        });
        localStorage.setItem('apex_admins', JSON.stringify(admins));
        console.log('✅ Создан владелец Admin');
    }
    
    // Если текущий пользователь Admin, но его нет в списке админов
    if (currentUser === 'Admin' && !admins.some(a => a.username === 'Admin')) {
        admins.push({
            id: 'admin_' + Date.now(),
            username: 'Admin',
            isOwner: true,
            hiredBy: 'system',
            hiredAt: new Date().toISOString()
        });
        localStorage.setItem('apex_admins', JSON.stringify(admins));
        console.log('✅ Admin добавлен в список админов');
    }
}

// Проверка, является ли пользователь админом
function isUserAdmin(username) {
    const admins = JSON.parse(localStorage.getItem('apex_admins') || '[]');
    return admins.some(a => a.username === username);
}

// Вход в админку (вызывается по кнопке)
function enterAdminPanel() {
    const currentUser = localStorage.getItem('apex_user') || 'Гость';
    
    if (isUserAdmin(currentUser)) {
        // Пользователь админ - открываем админ-панель
        if (typeof window.showPage === 'function') {
            window.showPage('admin');
        } else if (typeof showPage === 'function') {
            showPage('admin');
        }
        
        // Инициализируем админку если нужно
        setTimeout(() => {
            if (typeof window.initAdmin === 'function') {
                window.initAdmin();
            }
        }, 100);
        
        return true;
    } else {
        // Не админ - запрашиваем пароль
        const password = prompt("Введите пароль администратора:");
        const ADMIN_PASSWORD = "admin123";
        
        if (password === ADMIN_PASSWORD) {
            // Добавляем в админы
            let admins = JSON.parse(localStorage.getItem('apex_admins') || '[]');
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
            return true;
        } else {
            showToast('❌ Неверный пароль!', 'error');
            return false;
        }
    }
}

// Функция для показа уведомлений
function showToast(message, type = 'success') {
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
        toast = document.createElement('div');
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

// Выход из аккаунта
function logout() {
    if (confirm('Вы уверены, что хотите выйти из аккаунта?')) {
        localStorage.removeItem('apex_user');
        localStorage.removeItem('apex_user_id');
        localStorage.removeItem('apex_user_email');
        localStorage.removeItem('apex_user_picture');
        window.location.reload();
    }
}

// Функция для получения имени текущего пользователя
function getCurrentUser() {
    return localStorage.getItem('apex_user') || 'Гость';
}

// Экспорт
window.initAuth = initAuth;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.isUserAdmin = isUserAdmin;
window.enterAdminPanel = enterAdminPanel;
window.showToast = showToast;

// Автозапуск
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}

console.log('✅ auth-fix.js загружен');