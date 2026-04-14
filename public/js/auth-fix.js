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



// ========== ПРИВЕТСТВЕННОЕ УВЕДОМЛЕНИЕ ДЛЯ ГОСТЕЙ ==========

(function() {
    // Показываем уведомление только если пользователь не авторизован
    // и не видел его в этой сессии
    function showGuestWelcome() {
        const isLoggedIn = !!localStorage.getItem('auth_token');
        const hasSeenWelcome = sessionStorage.getItem('guest_welcome_shown');
        
        if (!isLoggedIn && !hasSeenWelcome) {
            // Отмечаем что показали
            sessionStorage.setItem('guest_welcome_shown', 'true');
            
            // Создаем красивое уведомление
            setTimeout(() => {
                const notification = document.createElement('div');
                notification.className = 'guest-welcome-notification';
                notification.innerHTML = `
                    <div class="welcome-content">
                        <div class="welcome-icon">
                            <i class="fas fa-hand-wave"></i>
                        </div>
                        <div class="welcome-text">
                            <h4>Добро пожаловать на Плейнексис! 👋</h4>
                            <p>Войдите или зарегистрируйтесь, чтобы получить доступ ко всем возможностям</p>
                        </div>
                        <div class="welcome-actions">
                            <button class="welcome-login-btn" onclick="document.getElementById('loginBtn')?.click()">
                                <i class="fas fa-sign-in-alt"></i> Войти
                            </button>
                            <button class="welcome-close-btn" onclick="this.closest('.guest-welcome-notification').remove()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `;
                document.body.appendChild(notification);
                
                // Добавляем стили
                if (!document.getElementById('guest-welcome-styles')) {
                    const styles = document.createElement('style');
                    styles.id = 'guest-welcome-styles';
                    styles.textContent = `
                        .guest-welcome-notification {
                            position: fixed;
                            bottom: 100px;
                            left: 50%;
                            transform: translateX(-50%);
                            z-index: 1500;
                            animation: slideUpWelcome 0.5s ease;
                            max-width: 500px;
                            width: 90%;
                        }
                        
                        @keyframes slideUpWelcome {
                            from {
                                opacity: 0;
                                transform: translateX(-50%) translateY(30px);
                            }
                            to {
                                opacity: 1;
                                transform: translateX(-50%) translateY(0);
                            }
                        }
                        
                        .welcome-content {
                            background: linear-gradient(135deg, #1a1f35 0%, #0f1322 100%);
                            border: 1px solid rgba(59, 130, 246, 0.4);
                            border-radius: 60px;
                            padding: 16px 20px;
                            display: flex;
                            align-items: center;
                            gap: 15px;
                            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.2) inset;
                            backdrop-filter: blur(20px);
                        }
                        
                        .welcome-icon {
                            width: 48px;
                            height: 48px;
                            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 22px;
                            color: white;
                            animation: wave 1s ease infinite;
                            flex-shrink: 0;
                        }
                        
                        @keyframes wave {
                            0%, 100% { transform: rotate(0deg); }
                            25% { transform: rotate(-15deg); }
                            75% { transform: rotate(15deg); }
                        }
                        
                        .welcome-text {
                            flex: 1;
                        }
                        
                        .welcome-text h4 {
                            margin: 0 0 5px 0;
                            color: white;
                            font-size: 1rem;
                            font-weight: 700;
                        }
                        
                        .welcome-text p {
                            margin: 0;
                            color: #94a3b8;
                            font-size: 0.8rem;
                            line-height: 1.4;
                        }
                        
                        .welcome-actions {
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            flex-shrink: 0;
                        }
                        
                        .welcome-login-btn {
                            background: linear-gradient(135deg, #3b82f6, #2563eb);
                            border: none;
                            padding: 10px 18px;
                            border-radius: 30px;
                            color: white;
                            font-weight: 600;
                            font-size: 0.8rem;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            transition: all 0.2s ease;
                            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                        }
                        
                        .welcome-login-btn:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
                            background: linear-gradient(135deg, #4f46e5, #3b82f6);
                        }
                        
                        .welcome-close-btn {
                            background: rgba(255, 255, 255, 0.1);
                            border: none;
                            width: 32px;
                            height: 32px;
                            border-radius: 50%;
                            color: #94a3b8;
                            font-size: 1rem;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.2s ease;
                        }
                        
                        .welcome-close-btn:hover {
                            background: rgba(239, 68, 68, 0.3);
                            color: #f87171;
                        }
                        
                        @media (max-width: 600px) {
                            .guest-welcome-notification {
                                bottom: 90px;
                            }
                            
                            .welcome-content {
                                flex-wrap: wrap;
                                border-radius: 30px;
                                padding: 15px;
                            }
                            
                            .welcome-text {
                                min-width: 200px;
                            }
                            
                            .welcome-actions {
                                width: 100%;
                                justify-content: flex-end;
                                margin-top: 5px;
                            }
                            
                            .welcome-login-btn {
                                flex: 1;
                                justify-content: center;
                            }
                        }
                        
                        @media (max-width: 400px) {
                            .welcome-icon {
                                width: 40px;
                                height: 40px;
                                font-size: 18px;
                            }
                            
                            .welcome-text h4 {
                                font-size: 0.9rem;
                            }
                            
                            .welcome-text p {
                                font-size: 0.75rem;
                            }
                        }
                    `;
                    document.head.appendChild(styles);
                }
                
                // Автоматически скрываем через 8 секунд
                setTimeout(() => {
                    notification.style.animation = 'slideDownWelcome 0.3s ease forwards';
                    setTimeout(() => notification.remove(), 300);
                }, 8000);
                
            }, 1500); // Показываем через 1.5 секунды после загрузки
        }
    }
    
    // Показываем при загрузке страницы
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showGuestWelcome);
    } else {
        showGuestWelcome();
    }
    
    // Также показываем при выходе из аккаунта
    const originalLogout = window.auth?.logout;
    if (originalLogout) {
        window.auth.logout = async function(showMessage = true) {
            await originalLogout.call(window.auth, showMessage);
            // Сбрасываем флаг чтобы показать уведомление снова
            sessionStorage.removeItem('guest_welcome_shown');
            setTimeout(() => showGuestWelcome(), 500);
        };
    }
})();