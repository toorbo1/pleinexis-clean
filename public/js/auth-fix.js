// ========== ПРОСТАЯ И НАДЁЖНАЯ АВТОРИЗАЦИЯ ==========

(function() {
    'use strict';
    
    console.log('🔥 AUTH SYSTEM STARTED');
    
    // ========== ДАННЫЕ ПОЛЬЗОВАТЕЛЕЙ ==========
    let currentUser = localStorage.getItem('apex_user') || null;
    
    // Создаём тестового пользователя если нет
    function ensureTestUser() {
        let users = JSON.parse(localStorage.getItem('apex_users') || '[]');
        if (users.length === 0) {
            users.push({
                id: 'user_1',
                email: 'test@test.com',
                username: 'Тестовый',
                password: btoa('123456'),
                balance: 1000,
                joinedDate: new Date().toISOString()
            });
            localStorage.setItem('apex_users', JSON.stringify(users));
        }
    }
    ensureTestUser();
    
    // ========== СОЗДАНИЕ МОДАЛЬНОГО ОКНА ==========
    function createAuthModal() {
        if (document.getElementById('authModalFixed')) return;
        
        const modal = document.createElement('div');
        modal.id = 'authModalFixed';
        modal.innerHTML = `
            <div class="auth-modal-overlay">
                <div class="auth-modal-container">
                    <div class="auth-modal-header">
                        <div class="auth-logo">
                            <i class="fas fa-crown"></i>
                            <span>Плейнексис</span>
                        </div>
                        <button class="auth-close-btn" id="closeAuthModalBtn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="auth-tabs">
                        <button class="auth-tab-btn active" data-tab="login">🔐 Вход</button>
                        <button class="auth-tab-btn" data-tab="register">📝 Регистрация</button>
                    </div>
                    
                    <!-- Форма входа -->
                    <div id="authLoginPanel" class="auth-panel active">
                        <div class="auth-social">
                            <button class="social-btn google" id="googleLoginFixed">
                                <i class="fab fa-google"></i> Google
                            </button>
                            <button class="social-btn vk" id="vkLoginFixed">
                                <i class="fab fa-vk"></i> VK
                            </button>
                        </div>
                        <div class="auth-divider">или</div>
                        <input type="email" id="loginEmailFixed" class="auth-input" placeholder="Email" autocomplete="email">
                        <input type="password" id="loginPasswordFixed" class="auth-input" placeholder="Пароль" autocomplete="current-password">
                        <button class="auth-submit-btn" id="submitLoginFixed">Войти</button>
                    </div>
                    
                    <!-- Форма регистрации -->
                    <div id="authRegisterPanel" class="auth-panel">
                        <div class="auth-social">
                            <button class="social-btn google" id="googleRegisterFixed">
                                <i class="fab fa-google"></i> Google
                            </button>
                            <button class="social-btn vk" id="vkRegisterFixed">
                                <i class="fab fa-vk"></i> VK
                            </button>
                        </div>
                        <div class="auth-divider">или</div>
                        <input type="email" id="registerEmailFixed" class="auth-input" placeholder="Email" autocomplete="email">
                        <input type="text" id="registerUsernameFixed" class="auth-input" placeholder="Имя пользователя">
                        <input type="password" id="registerPasswordFixed" class="auth-input" placeholder="Пароль (мин. 6 символов)">
                        <input type="password" id="registerConfirmFixed" class="auth-input" placeholder="Подтвердите пароль">
                        <button class="auth-submit-btn" id="submitRegisterFixed">Зарегистрироваться</button>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем стили
        const styles = document.createElement('style');
        styles.textContent = `
            #authModalFixed {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: none;
                font-family: 'Inter', sans-serif;
            }
            .auth-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(12px);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .auth-modal-container {
                background: linear-gradient(145deg, #0f1322, #0a0d18);
                border-radius: 32px;
                padding: 32px;
                width: 90%;
                max-width: 400px;
                border: 1px solid rgba(59, 130, 246, 0.3);
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                animation: modalFadeIn 0.3s ease;
            }
            @keyframes modalFadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
            .auth-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
            }
            .auth-logo {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 1.3rem;
                font-weight: 700;
            }
            .auth-logo i { color: #fbbf24; }
            .auth-logo span {
                background: linear-gradient(135deg, #fff, #a78bfa);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
            }
            .auth-close-btn {
                background: rgba(255,255,255,0.05);
                border: none;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                color: #94a3b8;
                cursor: pointer;
                font-size: 1rem;
            }
            .auth-close-btn:hover { background: rgba(239,68,68,0.2); color: #f87171; }
            .auth-tabs {
                display: flex;
                gap: 10px;
                margin-bottom: 24px;
                background: rgba(255,255,255,0.03);
                padding: 4px;
                border-radius: 40px;
            }
            .auth-tab-btn {
                flex: 1;
                padding: 12px;
                background: transparent;
                border: none;
                border-radius: 40px;
                color: #94a3b8;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            .auth-tab-btn.active {
                background: linear-gradient(135deg, #3b82f6, #2563eb);
                color: white;
            }
            .auth-panel { display: none; }
            .auth-panel.active { display: block; }
            .auth-social {
                display: flex;
                gap: 12px;
                margin-bottom: 20px;
            }
            .social-btn {
                flex: 1;
                padding: 12px;
                border: none;
                border-radius: 40px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            .social-btn.google { background: #fff; color: #1a1a2e; }
            .social-btn.google:hover { background: #f0f0f0; transform: translateY(-2px); }
            .social-btn.vk { background: #0077ff; color: white; }
            .social-btn.vk:hover { background: #0066dd; transform: translateY(-2px); }
            .auth-divider {
                text-align: center;
                color: #4a5568;
                font-size: 0.8rem;
                margin: 20px 0;
                position: relative;
            }
            .auth-divider::before,
            .auth-divider::after {
                content: '';
                position: absolute;
                top: 50%;
                width: calc(50% - 30px);
                height: 1px;
                background: rgba(255,255,255,0.1);
            }
            .auth-divider::before { left: 0; }
            .auth-divider::after { right: 0; }
            .auth-input {
                width: 100%;
                padding: 14px 16px;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 40px;
                color: white;
                font-size: 0.9rem;
                margin-bottom: 12px;
                outline: none;
                box-sizing: border-box;
            }
            .auth-input:focus {
                border-color: #3b82f6;
                background: rgba(59,130,246,0.05);
            }
            .auth-submit-btn {
                width: 100%;
                padding: 14px;
                background: linear-gradient(135deg, #3b82f6, #2563eb);
                border: none;
                border-radius: 40px;
                color: white;
                font-weight: 700;
                font-size: 1rem;
                cursor: pointer;
                margin-top: 12px;
            }
            .auth-submit-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(59,130,246,0.4);
            }
        `;
        document.head.appendChild(styles);
        document.body.appendChild(modal);
        
        return modal;
    }
    
    // ========== ФУНКЦИИ АВТОРИЗАЦИИ ==========
    function showAuthModal() {
        const modal = document.getElementById('authModalFixed') || createAuthModal();
        modal.style.display = 'block';
        
        // Настройка табов
        const tabs = modal.querySelectorAll('.auth-tab-btn');
        const panels = modal.querySelectorAll('.auth-panel');
        
        tabs.forEach(tab => {
            const newTab = tab.cloneNode(true);
            tab.parentNode.replaceChild(newTab, tab);
            newTab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                newTab.classList.add('active');
                const tabId = newTab.getAttribute('data-tab');
                panels.forEach(panel => panel.classList.remove('active'));
                if (tabId === 'login') {
                    modal.querySelector('#authLoginPanel').classList.add('active');
                } else {
                    modal.querySelector('#authRegisterPanel').classList.add('active');
                }
            });
        });
        
        // Закрытие
        const closeBtn = modal.querySelector('#closeAuthModalBtn');
        if (closeBtn) {
            const newClose = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newClose, closeBtn);
            newClose.addEventListener('click', () => modal.style.display = 'none');
        }
        
        modal.querySelector('.auth-modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) modal.style.display = 'none';
        });
        
        // Логин
        const loginBtn = modal.querySelector('#submitLoginFixed');
        if (loginBtn) {
            const newLogin = loginBtn.cloneNode(true);
            loginBtn.parentNode.replaceChild(newLogin, loginBtn);
            newLogin.addEventListener('click', () => {
                const email = modal.querySelector('#loginEmailFixed').value.trim();
                const password = modal.querySelector('#loginPasswordFixed').value;
                
                const users = JSON.parse(localStorage.getItem('apex_users') || '[]');
                const user = users.find(u => u.email === email && u.password === btoa(password));
                
                if (user) {
                    localStorage.setItem('apex_user', user.username);
                    localStorage.setItem('apex_user_id', user.id);
                    localStorage.setItem('apex_user_email', user.email);
                    showToast('✅ Добро пожаловать, ' + user.username + '!');
                    modal.style.display = 'none';
                    setTimeout(() => window.location.reload(), 500);
                } else {
                    alert('❌ Неверный email или пароль\n\nТестовый аккаунт: test@test.com / 123456');
                }
            });
        }
        
        // Регистрация
        const registerBtn = modal.querySelector('#submitRegisterFixed');
        if (registerBtn) {
            const newRegister = registerBtn.cloneNode(true);
            registerBtn.parentNode.replaceChild(newRegister, registerBtn);
            newRegister.addEventListener('click', () => {
                const email = modal.querySelector('#registerEmailFixed').value.trim();
                const username = modal.querySelector('#registerUsernameFixed').value.trim();
                const password = modal.querySelector('#registerPasswordFixed').value;
                const confirm = modal.querySelector('#registerConfirmFixed').value;
                
                if (!email || !username || !password) {
                    alert('❌ Заполните все поля');
                    return;
                }
                if (password !== confirm) {
                    alert('❌ Пароли не совпадают');
                    return;
                }
                if (password.length < 6) {
                    alert('❌ Пароль должен быть не менее 6 символов');
                    return;
                }
                
                const users = JSON.parse(localStorage.getItem('apex_users') || '[]');
                if (users.find(u => u.email === email)) {
                    alert('❌ Пользователь с таким email уже существует');
                    return;
                }
                
                const newUser = {
                    id: 'user_' + Date.now(),
                    email: email,
                    username: username,
                    password: btoa(password),
                    balance: 0,
                    joinedDate: new Date().toISOString()
                };
                users.push(newUser);
                localStorage.setItem('apex_users', JSON.stringify(users));
                localStorage.setItem('apex_user', username);
                localStorage.setItem('apex_user_id', newUser.id);
                localStorage.setItem('apex_user_email', email);
                
                showToast('✅ Регистрация успешна!');
                modal.style.display = 'none';
                setTimeout(() => window.location.reload(), 500);
            });
        }
        
        // Соцсети (демо)
        const googleBtns = modal.querySelectorAll('#googleLoginFixed, #googleRegisterFixed');
        googleBtns.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', () => alert('🔐 Вход через Google (демо-режим)'));
        });
        
        const vkBtns = modal.querySelectorAll('#vkLoginFixed, #vkRegisterFixed');
        vkBtns.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', () => alert('🔐 Вход через VK (демо-режим)'));
        });
    }
    
    function showToast(message) {
        let toast = document.querySelector('.custom-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'custom-toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                background: #1a1a2e;
                backdrop-filter: blur(12px);
                padding: 12px 24px;
                border-radius: 60px;
                color: white;
                z-index: 10001;
                font-size: 0.9rem;
                border: 1px solid #3b82f6;
                box-shadow: 0 8px 25px rgba(0,0,0,0.4);
                white-space: nowrap;
            `;
            document.body.appendChild(toast);
        }
        toast.innerHTML = `<i class="fas fa-check-circle" style="color: #22c55e; margin-right: 8px;"></i>${message}`;
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 3000);
    }
    
    // ========== ПЕРЕХВАТ КЛИКОВ ПО ГОСТЕВЫМ КНОПКАМ ==========
    function bindAllGuestButtons() {
        console.log('🔍 Привязка гостевых кнопок...');
        
        // Все возможные селекторы гостевых кнопок
        const selectors = [
            '.guest-login-btn',
            '.guest-register-btn', 
            '.welcome-login-btn',
            '[onclick*="showAuthModal"]',
            'button:contains("Войти")',
            'button:contains("Зарегистрироваться")'
        ];
        
        // Находим все кнопки на странице
        const allButtons = document.querySelectorAll('button, .guest-login-btn, .guest-register-btn');
        
        allButtons.forEach(btn => {
            const text = btn.textContent || '';
            const isGuestBtn = text.includes('Войти') || 
                              text.includes('Регистрация') ||
                              text.includes('Зарегистрироваться') ||
                              btn.classList.contains('guest-login-btn') ||
                              btn.classList.contains('guest-register-btn') ||
                              btn.classList.contains('welcome-login-btn');
            
            if (isGuestBtn) {
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ КЛИК ПО ГОСТЕВОЙ КНОПКЕ:', text);
                    showAuthModal();
                });
            }
        });
        
        // Кнопка входа в хедере
        const headerLoginBtn = document.getElementById('loginBtn');
        if (headerLoginBtn) {
            const newBtn = headerLoginBtn.cloneNode(true);
            headerLoginBtn.parentNode.replaceChild(newBtn, headerLoginBtn);
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showAuthModal();
            });
        }
    }
    
    // ========== ЗАМЕНА ГОСТЕВЫХ ЭКРАНОВ ==========
    function replaceGuestScreens() {
        const isLoggedIn = !!localStorage.getItem('apex_user');
        if (isLoggedIn) return;
        
        // Заменяем содержимое защищённых страниц
        const protectedPages = ['chat', 'products-manage', 'profile'];
        
        protectedPages.forEach(pageId => {
            const page = document.getElementById(pageId);
            if (!page) return;
            
            // Проверяем, не заменён ли уже
            if (page.querySelector('.guest-screen-replacement')) return;
            
            // Сохраняем оригинал если нужно
            if (!page.dataset.originalContent) {
                page.dataset.originalContent = page.innerHTML;
            }
            
            page.innerHTML = `
                <div class="guest-screen-replacement" style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 70vh;
                    text-align: center;
                    padding: 40px 20px;
                ">
                    <div style="
                        width: 100px;
                        height: 100px;
                        margin-bottom: 24px;
                    ">
                        <i class="fas ${pageId === 'chat' ? 'fa-comments' : (pageId === 'products-manage' ? 'fa-tags' : 'fa-user-circle')}" 
                           style="font-size: 70px; background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; background-clip: text; color: transparent;"></i>
                    </div>
                    <h3 style="font-size: 1.6rem; font-weight: 700; margin-bottom: 12px; background: linear-gradient(135deg, #fff, #c4b5fd); -webkit-background-clip: text; background-clip: text; color: transparent;">
                        ${pageId === 'chat' ? 'Чат с продавцами' : (pageId === 'products-manage' ? 'Ваши товары' : 'Ваш профиль')}
                    </h3>
                    <p style="color: #94a3b8; max-width: 380px; margin-bottom: 24px;">
                        ${pageId === 'chat' ? 'Войдите чтобы общаться с продавцами и получать поддержку 24/7' : 
                          (pageId === 'products-manage' ? 'Войдите чтобы создавать товары, отслеживать продажи и зарабатывать' :
                           'Войдите чтобы управлять балансом, отслеживать покупки и получать бонусы')}
                    </p>
                    <button class="guest-action-btn" style="
                        padding: 14px 32px;
                        border-radius: 40px;
                        font-weight: 600;
                        font-size: 1rem;
                        cursor: pointer;
                        background: linear-gradient(135deg, #3b82f6, #2563eb);
                        color: white;
                        border: none;
                        box-shadow: 0 8px 20px rgba(59,130,246,0.3);
                    ">
                        <i class="fas fa-sign-in-alt"></i> Войти или зарегистрироваться
                    </button>
                </div>
            `;
            
            // Добавляем обработчик на кнопку
            const actionBtn = page.querySelector('.guest-action-btn');
            if (actionBtn) {
                actionBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    showAuthModal();
                });
            }
        });
    }
    
    // ========== ОБНОВЛЕНИЕ UI ПОСЛЕ ВХОДА ==========
    function updateUIAfterLogin() {
        const username = localStorage.getItem('apex_user');
        if (!username) return;
        
        // Обновляем профиль
        const profileName = document.getElementById('profileUsername');
        if (profileName) profileName.textContent = username;
        
        // Обновляем аватар
        const avatarSpan = document.getElementById('avatarInitial');
        if (avatarSpan) avatarSpan.textContent = username.charAt(0).toUpperCase();
        
        // Показываем меню пользователя
        const loginBtn = document.getElementById('loginBtn');
        const userMenu = document.getElementById('userMenu');
        const usernameDisplay = document.getElementById('usernameDisplay');
        
        if (loginBtn) loginBtn.style.display = 'none';
        if (userMenu) userMenu.style.display = 'flex';
        if (usernameDisplay) usernameDisplay.textContent = username;
        
        // Восстанавливаем оригинальное содержимое страниц
        const pages = ['chat', 'products-manage', 'profile'];
        pages.forEach(pageId => {
            const page = document.getElementById(pageId);
            if (page && page.dataset.originalContent && page.querySelector('.guest-screen-replacement')) {
                page.innerHTML = page.dataset.originalContent;
                delete page.dataset.originalContent;
            }
        });
        
        // Загружаем данные пользователя
        if (typeof window.loadUserProducts === 'function') window.loadUserProducts();
        if (typeof window.loadUserProductsInProfile === 'function') window.loadUserProductsInProfile();
    }
    
    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function init() {
        console.log('🚀 AUTH SYSTEM INIT');
        
        // Обновляем UI если уже залогинены
        if (localStorage.getItem('apex_user')) {
            updateUIAfterLogin();
        } else {
            replaceGuestScreens();
        }
        
        // Привязываем кнопки
        bindAllGuestButtons();
        
        // Наблюдаем за изменениями DOM
        const observer = new MutationObserver(() => {
            bindAllGuestButtons();
            if (!localStorage.getItem('apex_user')) {
                replaceGuestScreens();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Кнопка выхода
        const logoutBtns = document.querySelectorAll('#logoutBtn, #profileLogoutBtn');
        logoutBtns.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', () => {
                localStorage.removeItem('apex_user');
                localStorage.removeItem('apex_user_id');
                localStorage.removeItem('apex_user_email');
                window.location.reload();
            });
        });
        
        console.log('✅ AUTH SYSTEM READY');
    }
    
    // Запускаем после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Глобальные функции
    window.showAuthModal = showAuthModal;
    window.updateUIAfterLogin = updateUIAfterLogin;
})();