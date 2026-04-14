// ========== ПОЛНАЯ ИНТЕГРАЦИЯ АВТОРИЗАЦИИ С СЕРВЕРОМ ==========

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.currentUser = null;
        
        // ID приложений (ЗАМЕНИТЕ НА СВОИ!)
        this.GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
        this.VK_APP_ID = 12345678; // ID приложения VK
        
        this.init();
    }

    async init() {
        await this.loadExternalScripts();
        this.setupEventListeners();
        
        if (this.token) {
            await this.fetchCurrentUser();
        }
        this.updateUI();
        console.log('✅ AuthManager инициализирован');
    }

    // Загрузка внешних скриптов для соцсетей
    async loadExternalScripts() {
        // Google
        if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
            const gScript = document.createElement('script');
            gScript.src = 'https://accounts.google.com/gsi/client';
            gScript.async = true;
            gScript.defer = true;
            document.head.appendChild(gScript);
        }

        // VK
        if (!document.querySelector('script[src*="vk.com/js/api/openapi"]')) {
            const vkScript = document.createElement('script');
            vkScript.src = 'https://vk.com/js/api/openapi.js?169';
            vkScript.async = true;
            vkScript.defer = true;
            document.head.appendChild(vkScript);
        }
    }

    // Получение текущего пользователя с сервера
    async fetchCurrentUser() {
        if (!this.token) return null;
        try {
            const response = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (response.ok) {
                this.currentUser = await response.json();
                this.updateUI();
                return this.currentUser;
            } else {
                this.logout(false); // Тихо разлогиниваем если токен протух
            }
        } catch (error) {
            console.error('Fetch user error:', error);
        }
        return null;
    }

    // Регистрация Email/Password
    async register(email, username, password) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username, password })
            });
            
            const data = await response.json();
            if (response.ok) {
                this.setSession(data);
                this.showToast('Регистрация успешна!', 'success');
                this.closeAuthModal();
                return true;
            } else {
                this.showToast(data.error || 'Ошибка регистрации', 'error');
                return false;
            }
        } catch (error) {
            this.showToast('Ошибка соединения', 'error');
            return false;
        }
    }

    // Вход Email/Password
    async login(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            if (response.ok) {
                this.setSession(data);
                this.showToast(`Добро пожаловать, ${data.user.username}!`, 'success');
                this.closeAuthModal();
                return true;
            } else {
                this.showToast(data.error || 'Неверный email или пароль', 'error');
                return false;
            }
        } catch (error) {
            this.showToast('Ошибка соединения', 'error');
            return false;
        }
    }

    // Вход через Google
    async loginWithGoogle() {
        if (!window.google) {
            this.showToast('Сервисы Google загружаются...', 'info');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        window.google?.accounts.id.initialize({
            client_id: this.GOOGLE_CLIENT_ID,
            callback: async (response) => {
                try {
                    const res = await fetch('/api/auth/google', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ credential: response.credential })
                    });
                    
                    const data = await res.json();
                    if (res.ok) {
                        this.setSession(data);
                        this.showToast(`Добро пожаловать, ${data.user.username}!`, 'success');
                        this.closeAuthModal();
                    } else {
                        this.showToast(data.error || 'Ошибка входа через Google', 'error');
                    }
                } catch (error) {
                    this.showToast('Ошибка соединения', 'error');
                }
            }
        });
        
        window.google?.accounts.id.prompt();
    }

    // Вход через VK
    async loginWithVK() {
        if (!window.VK) {
            this.showToast('Сервисы VK загружаются...', 'info');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        window.VK.init({ apiId: this.VK_APP_ID });
        
        window.VK.Auth.login(async (response) => {
            if (response.session) {
                const vkId = response.session.mid;
                
                // Получаем данные пользователя VK
                window.VK.Api.call('users.get', {
                    user_ids: vkId,
                    fields: 'photo_200',
                    v: '5.131'
                }, async (userData) => {
                    if (userData.response) {
                        const user = userData.response[0];
                        try {
                            const res = await fetch('/api/auth/vk', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    vkId: vkId,
                                    username: `${user.first_name} ${user.last_name}`,
                                    avatarUrl: user.photo_200
                                })
                            });
                            
                            const data = await res.json();
                            if (res.ok) {
                                this.setSession(data);
                                this.showToast(`Добро пожаловать, ${data.user.username}!`, 'success');
                                this.closeAuthModal();
                            } else {
                                this.showToast(data.error || 'Ошибка входа через VK', 'error');
                            }
                        } catch (error) {
                            this.showToast('Ошибка соединения', 'error');
                        }
                    }
                });
            }
        }, 2); // 2 - запрос доступа к email (хотя в текущем бэке email не обязателен для VK)
    }

    // Установка сессии
    setSession(data) {
        this.token = data.token;
        this.currentUser = data.user;
        localStorage.setItem('auth_token', this.token);
        localStorage.setItem('apex_user', data.user.username);
        localStorage.setItem('apex_user_id', data.user.id);
        localStorage.setItem('apex_user_email', data.user.email);
        if (data.user.avatar_url) {
            localStorage.setItem('apex_user_picture', data.user.avatar_url);
        }
        this.updateUI();
    }

    // Выход
    async logout(showMessage = true) {
        if (this.token) {
            try {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
            } catch (e) {}
        }
        
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('apex_user');
        localStorage.removeItem('apex_user_id');
        localStorage.removeItem('apex_user_email');
        localStorage.removeItem('apex_user_picture');
        
        this.updateUI();
        if (showMessage) this.showToast('Вы вышли из аккаунта', 'success');
    }

    // Обновление интерфейса
    updateUI() {
        const isLoggedIn = !!this.currentUser;
        
        const loginBtn = document.getElementById('loginBtn');
        const userMenu = document.getElementById('userMenu');
        const usernameDisplay = document.getElementById('usernameDisplay');
        const userAvatar = document.getElementById('userAvatar');
        const profileUsername = document.getElementById('profileUsername');
        const avatarCircle = document.getElementById('profileAvatarCircle');

        if (loginBtn) loginBtn.style.display = isLoggedIn ? 'none' : 'flex';
        if (userMenu) userMenu.style.display = isLoggedIn ? 'flex' : 'none';
        
        if (this.currentUser) {
            if (usernameDisplay) usernameDisplay.textContent = this.currentUser.username;
            if (profileUsername) profileUsername.textContent = this.currentUser.username;
            
            if (this.currentUser.avatar_url) {
                if (userAvatar) { userAvatar.src = this.currentUser.avatar_url; userAvatar.style.display = 'block'; }
                if (avatarCircle) {
                    avatarCircle.style.backgroundImage = `url(${this.currentUser.avatar_url})`;
                    avatarCircle.style.backgroundSize = 'cover';
                    avatarCircle.classList.add('has-bg');
                }
            }
        } else {
            if (profileUsername) profileUsername.textContent = 'Гость';
            if (avatarCircle) {
                avatarCircle.style.backgroundImage = '';
                avatarCircle.classList.remove('has-bg');
            }
        }

        // Триггерим обновление профиля
        if (isLoggedIn && typeof window.loadUserProductsInProfile === 'function') {
            window.loadUserProductsInProfile();
        }
    }

    // Модальное окно
    showAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.classList.add('active');
            this.switchAuthTab('login');
        }
    }

    closeAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) modal.classList.remove('active');
    }

    switchAuthTab(tab) {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const loginTab = document.getElementById('loginTab');
        const registerTab = document.getElementById('registerTab');
        
        if (tab === 'login') {
            if (loginForm) loginForm.style.display = 'block';
            if (registerForm) registerForm.style.display = 'none';
            if (loginTab) loginTab.classList.add('active');
            if (registerTab) registerTab.classList.remove('active');
        } else {
            if (loginForm) loginForm.style.display = 'none';
            if (registerForm) registerForm.style.display = 'block';
            if (loginTab) loginTab.classList.remove('active');
            if (registerTab) registerTab.classList.add('active');
        }
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Кнопка входа в хедере
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showAuthModal());
        }

        // Кнопка выхода
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Кнопка выхода в профиле
        const profileLogoutBtn = document.getElementById('profileLogoutBtn');
        if (profileLogoutBtn) {
            profileLogoutBtn.addEventListener('click', () => this.logout());
        }

        // Табы
        document.getElementById('loginTab')?.addEventListener('click', () => this.switchAuthTab('login'));
        document.getElementById('registerTab')?.addEventListener('click', () => this.switchAuthTab('register'));

        // Формы
        document.getElementById('loginFormElement')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            await this.login(email, password);
        });

        document.getElementById('registerFormElement')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value;
            const username = document.getElementById('registerUsername').value;
            const password = document.getElementById('registerPassword').value;
            const confirm = document.getElementById('registerConfirmPassword').value;
            
            if (password !== confirm) {
                this.showToast('Пароли не совпадают', 'error');
                return;
            }
            await this.register(email, username, password);
        });

        // Соцсети
        document.getElementById('googleLoginBtn')?.addEventListener('click', () => this.loginWithGoogle());
        document.getElementById('vkLoginBtn')?.addEventListener('click', () => this.loginWithVK());
        
        // Закрытие модалки по клику вне
        const modal = document.getElementById('authModal');
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) this.closeAuthModal();
        });
        document.querySelector('#authModal .close-modal')?.addEventListener('click', () => this.closeAuthModal());
    }

    // Уведомления
    showToast(message, type = 'success') {
        // Используем существующую функцию showToast если она есть, или создаем новую
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
            return;
        }
        
        let toast = document.querySelector('.toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast-notification';
            document.body.appendChild(toast);
        }
        
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
        toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
        toast.className = `toast-notification ${type} show`;
        
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

// Инициализация
window.auth = new AuthManager();

// Для совместимости с admin.js
window.isUserAdmin = function(username) {
    const admins = JSON.parse(localStorage.getItem('apex_admins') || '[]');
    return admins.some(a => a.username === username);
};

window.enterAdminPanel = function() {
    const currentUser = window.auth.currentUser?.username || localStorage.getItem('apex_user') || 'Гость';
    
    if (window.isUserAdmin(currentUser)) {
        if (typeof window.showPage === 'function') window.showPage('admin');
        setTimeout(() => { if (typeof window.initAdmin === 'function') window.initAdmin(); }, 100);
        return true;
    } else {
        const password = prompt("Введите пароль администратора:");
        if (password === 'admin123') {
            let admins = JSON.parse(localStorage.getItem('apex_admins') || '[]');
            if (!admins.some(a => a.username === currentUser)) {
                admins.push({ id: 'admin_' + Date.now(), username: currentUser, isOwner: false, hiredBy: 'system', hiredAt: new Date().toISOString() });
                localStorage.setItem('apex_admins', JSON.stringify(admins));
            }
            if (typeof window.showPage === 'function') window.showPage('admin');
            setTimeout(() => { if (typeof window.initAdmin === 'function') window.initAdmin(); }, 100);
            window.showToast('✅ Доступ к админ-панели получен!', 'success');
            return true;
        } else {
            window.showToast('❌ Неверный пароль!', 'error');
            return false;
        }
    }
};