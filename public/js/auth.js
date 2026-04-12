// ========== ПОЛНАЯ СИСТЕМА АВТОРИЗАЦИИ ==========

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.currentUser = null;
        this.isInitialized = false;
    }

    // Инициализация
    async init() {
        if (this.token) {
            await this.fetchCurrentUser();
        }
        this.isInitialized = true;
        this.setupEventListeners();
        console.log('✅ AuthManager инициализирован');
    }

    // Получение текущего пользователя
    async fetchCurrentUser() {
        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                this.currentUser = await response.json();
                this.updateUI();
                return this.currentUser;
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Error fetching user:', error);
        }
        return null;
    }

    // Регистрация по email
    async register(email, username, password) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.token = data.token;
                localStorage.setItem('auth_token', this.token);
                this.currentUser = data.user;
                this.updateUI();
                this.showToast('Регистрация успешна! Добро пожаловать!', 'success');
                this.closeAuthModal();
                return true;
            } else {
                this.showToast(data.error || 'Ошибка регистрации', 'error');
                return false;
            }
        } catch (error) {
            console.error('Register error:', error);
            this.showToast('Ошибка соединения', 'error');
            return false;
        }
    }

    // Вход по email
    async login(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.token = data.token;
                localStorage.setItem('auth_token', this.token);
                this.currentUser = data.user;
                this.updateUI();
                this.showToast(`Добро пожаловать, ${data.user.username}!`, 'success');
                this.closeAuthModal();
                return true;
            } else {
                this.showToast(data.error || 'Неверный email или пароль', 'error');
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Ошибка соединения', 'error');
            return false;
        }
    }

    // Вход через Google
    async loginWithGoogle() {
        // Инициализируем Google Identity Services
        if (!window.google) {
            this.showToast('Загрузка Google сервисов...', 'info');
            await this.loadGoogleScript();
        }
        
        // Показываем One Tap UI
        window.google?.accounts.id.initialize({
            client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com', // Замените на свой
            callback: async (response) => {
                try {
                    const res = await fetch('/api/auth/google', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ credential: response.credential })
                    });
                    
                    const data = await res.json();
                    
                    if (res.ok) {
                        this.token = data.token;
                        localStorage.setItem('auth_token', this.token);
                        this.currentUser = data.user;
                        this.updateUI();
                        this.showToast(`Добро пожаловать, ${data.user.username}!`, 'success');
                        this.closeAuthModal();
                    } else {
                        this.showToast(data.error || 'Ошибка входа через Google', 'error');
                    }
                } catch (error) {
                    console.error('Google auth error:', error);
                    this.showToast('Ошибка соединения', 'error');
                }
            }
        });
        
        window.google?.accounts.id.prompt();
    }

    // Вход через VK
    async loginWithVK() {
        // Загружаем VK SDK
        if (!window.VK) {
            await this.loadVKScript();
        }
        
        // Инициализируем VK Mini Apps
        window.VK?.init({
            apiId: 12345678 // Замените на свой VK App ID
        });
        
        // Запрашиваем доступ
        window.VK?.Auth.login(async (response) => {
            if (response.session) {
                const vkId = response.session.user.id;
                const userInfo = await this.getVKUserInfo(vkId, response.session.access_token);
                
                try {
                    const res = await fetch('/api/auth/vk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            vkId: vkId,
                            email: userInfo.email || null,
                            username: `${userInfo.first_name} ${userInfo.last_name}`,
                            avatarUrl: userInfo.photo_200
                        })
                    });
                    
                    const data = await res.json();
                    
                    if (res.ok) {
                        this.token = data.token;
                        localStorage.setItem('auth_token', this.token);
                        this.currentUser = data.user;
                        this.updateUI();
                        this.showToast(`Добро пожаловать, ${data.user.username}!`, 'success');
                        this.closeAuthModal();
                    } else {
                        this.showToast(data.error || 'Ошибка входа через VK', 'error');
                    }
                } catch (error) {
                    console.error('VK auth error:', error);
                    this.showToast('Ошибка соединения', 'error');
                }
            }
        }, 2); // 2 - email permission
    }

    // Получение информации пользователя VK
    async getVKUserInfo(userId, accessToken) {
        return new Promise((resolve) => {
            window.VK?.Api.call('users.get', {
                user_ids: userId,
                fields: 'photo_200,email',
                access_token: accessToken,
                v: '5.131'
            }, (response) => {
                if (response.response && response.response.length) {
                    resolve(response.response[0]);
                } else {
                    resolve({ first_name: 'User', last_name: userId.toString() });
                }
            });
        });
    }

    // Выход
    async logout() {
        if (this.token) {
            try {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }
        
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('auth_token');
        this.updateUI();
        this.showToast('Вы вышли из аккаунта', 'success');
        
        // Перезагружаем страницу для сброса состояния
        setTimeout(() => window.location.reload(), 1000);
    }

    // Обновление UI
    updateUI() {
        const isLoggedIn = !!this.currentUser;
        
        // Обновляем кнопку входа/профиля
        const loginBtn = document.getElementById('loginBtn');
        const userMenu = document.getElementById('userMenu');
        const usernameSpan = document.getElementById('usernameDisplay');
        const avatarImg = document.getElementById('userAvatar');
        
        if (loginBtn) loginBtn.style.display = isLoggedIn ? 'none' : 'flex';
        if (userMenu) userMenu.style.display = isLoggedIn ? 'flex' : 'none';
        if (usernameSpan && this.currentUser) {
            usernameSpan.textContent = this.currentUser.username;
        }
        
        if (avatarImg && this.currentUser) {
            if (this.currentUser.avatar_url) {
                avatarImg.src = this.currentUser.avatar_url;
                avatarImg.style.display = 'block';
            } else {
                avatarImg.style.display = 'none';
            }
        }
        
        // Обновляем профиль
        const profileUsername = document.getElementById('profileUsername');
        const profileBalance = document.getElementById('profileBalance');
        const profileAvatar = document.getElementById('profileAvatarCircle');
        
        if (profileUsername && this.currentUser) {
            profileUsername.textContent = this.currentUser.username;
        }
        
        if (profileBalance && this.currentUser) {
            profileBalance.textContent = (this.currentUser.balance || 0).toFixed(2) + ' ₽';
        }
        
        if (profileAvatar && this.currentUser) {
            if (this.currentUser.avatar_url) {
                profileAvatar.style.backgroundImage = `url(${this.currentUser.avatar_url})`;
                profileAvatar.style.backgroundSize = 'cover';
                profileAvatar.classList.add('has-bg');
            }
        }
        
        // Сохраняем в localStorage для совместимости со старым кодом
        if (this.currentUser) {
            localStorage.setItem('apex_user', this.currentUser.username);
            localStorage.setItem('apex_user_id', this.currentUser.id);
            localStorage.setItem('apex_user_email', this.currentUser.email);
            if (this.currentUser.avatar_url) {
                localStorage.setItem('apex_user_picture', this.currentUser.avatar_url);
            }
        } else {
            localStorage.removeItem('apex_user');
            localStorage.removeItem('apex_user_id');
            localStorage.removeItem('apex_user_email');
            localStorage.removeItem('apex_user_picture');
        }
    }

    // Показать модальное окно авторизации
    showAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.classList.add('active');
            this.switchAuthTab('login');
        }
    }

    // Закрыть модальное окно
    closeAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) modal.classList.remove('active');
    }

    // Переключение между вкладками
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

    // Обработчики событий
    setupEventListeners() {
        // Кнопка входа
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showAuthModal());
        }
        
        // Кнопка выхода
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Закрытие модалки
        const closeBtn = document.querySelector('#authModal .close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeAuthModal());
        }
        
        // Переключение вкладок
        const loginTab = document.getElementById('loginTab');
        const registerTab = document.getElementById('registerTab');
        if (loginTab) loginTab.addEventListener('click', () => this.switchAuthTab('login'));
        if (registerTab) registerTab.addEventListener('click', () => this.switchAuthTab('register'));
        
        // Форма входа
        const loginForm = document.getElementById('loginFormElement');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                await this.login(email, password);
            });
        }
        
        // Форма регистрации
        const registerForm = document.getElementById('registerFormElement');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('registerEmail').value;
                const username = document.getElementById('registerUsername').value;
                const password = document.getElementById('registerPassword').value;
                const confirmPassword = document.getElementById('registerConfirmPassword').value;
                
                if (password !== confirmPassword) {
                    this.showToast('Пароли не совпадают', 'error');
                    return;
                }
                
                await this.register(email, username, password);
            });
        }
        
        // Кнопки соцсетей
        const googleBtn = document.getElementById('googleLoginBtn');
        const vkBtn = document.getElementById('vkLoginBtn');
        
        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.loginWithGoogle());
        }
        if (vkBtn) {
            vkBtn.addEventListener('click', () => this.loginWithVK());
        }
        
        // Клик вне модалки
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeAuthModal();
            });
        }
    }

    // Загрузка скриптов
    loadGoogleScript() {
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
    
    loadVKScript() {
        return new Promise((resolve, reject) => {
            if (document.querySelector('script[src*="vk.com/js/api/openapi"]')) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://vk.com/js/api/openapi.js?169';
            script.async = true;
            script.defer = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Уведомления
    showToast(message, type = 'success') {
        let toast = document.querySelector('.toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast-notification';
            document.body.appendChild(toast);
        }
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                     type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle';
        
        toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
        toast.className = `toast-notification ${type} show`;
        
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

// Глобальный экземпляр
window.auth = new AuthManager();

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.auth.init();
});

// Для совместимости со старым кодом
window.getCurrentUser = () => window.auth.currentUser;
window.isAuthenticated = () => !!window.auth.currentUser;
window.logout = () => window.auth.logout();