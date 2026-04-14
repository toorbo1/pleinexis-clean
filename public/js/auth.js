// ========== ПОЛНАЯ ИНТЕГРАЦИЯ АВТОРИЗАЦИИ С СЕРВЕРОМ + ГОСТЕВЫЕ ЭКРАНЫ ==========

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.currentUser = null;
        
        // ID приложений (ЗАМЕНИТЕ НА СВОИ!)
        this.GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
        this.VK_APP_ID = 12345678;
        
        this.init();
    }

    async init() {
        await this.loadExternalScripts();
        this.setupEventListeners();
        
        if (this.token) {
            await this.fetchCurrentUser();
        }
        this.updateUI();
        this.checkGuestPages();
        console.log('✅ AuthManager инициализирован');
    }

    async loadExternalScripts() {
        if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
            const gScript = document.createElement('script');
            gScript.src = 'https://accounts.google.com/gsi/client';
            gScript.async = true;
            gScript.defer = true;
            document.head.appendChild(gScript);
        }

        if (!document.querySelector('script[src*="vk.com/js/api/openapi"]')) {
            const vkScript = document.createElement('script');
            vkScript.src = 'https://vk.com/js/api/openapi.js?169';
            vkScript.async = true;
            vkScript.defer = true;
            document.head.appendChild(vkScript);
        }
    }

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
                this.logout(false);
            }
        } catch (error) {
            console.error('Fetch user error:', error);
        }
        return null;
    }

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

    async loginWithVK() {
        if (!window.VK) {
            this.showToast('Сервисы VK загружаются...', 'info');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        window.VK.init({ apiId: this.VK_APP_ID });
        
        window.VK.Auth.login(async (response) => {
            if (response.session) {
                const vkId = response.session.mid;
                
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
        }, 2);
    }

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
        this.checkGuestPages();
    }

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
        this.checkGuestPages();
        if (showMessage) this.showToast('Вы вышли из аккаунта', 'success');
        
        // Показываем приветственное уведомление
        sessionStorage.removeItem('guest_welcome_shown');
        setTimeout(() => showGuestWelcome(), 500);
    }

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

        if (isLoggedIn && typeof window.loadUserProductsInProfile === 'function') {
            window.loadUserProductsInProfile();
        }
    }

    // Проверка и отображение гостевых экранов
    checkGuestPages() {
        const isLoggedIn = !!this.currentUser;
        
        if (!isLoggedIn) {
            this.showGuestScreens();
        } else {
            this.hideGuestScreens();
        }
    }

    showGuestScreens() {
        // Стили для гостевых экранов
        if (!document.getElementById('guest-screens-styles')) {
            const styles = document.createElement('style');
            styles.id = 'guest-screens-styles';
            styles.textContent = `
                .guest-screen {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                    text-align: center;
                    background: transparent;
                    z-index: 100;
                }
                
                .guest-screen-icon {
                    width: 120px;
                    height: 120px;
                    margin-bottom: 30px;
                    position: relative;
                }
                
                .guest-screen-icon svg {
                    width: 100%;
                    height: 100%;
                    filter: drop-shadow(0 0 30px rgba(59, 130, 246, 0.3));
                }
                
                .guest-screen-icon i {
                    font-size: 80px;
                    background: linear-gradient(135deg, #60a5fa, #a78bfa);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    filter: drop-shadow(0 0 30px rgba(96, 165, 250, 0.5));
                }
                
                .guest-screen h3 {
                    font-size: 1.8rem;
                    font-weight: 700;
                    margin-bottom: 16px;
                    background: linear-gradient(135deg, #fff, #c4b5fd);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }
                
                .guest-screen p {
                    color: #94a3b8;
                    font-size: 1rem;
                    max-width: 400px;
                    margin-bottom: 30px;
                    line-height: 1.6;
                }
                
                .guest-screen-features {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .guest-feature {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 15px 25px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 20px;
                    border: 1px solid rgba(59, 130, 246, 0.15);
                }
                
                .guest-feature i {
                    font-size: 24px;
                    color: #60a5fa;
                }
                
                .guest-feature span {
                    font-size: 0.85rem;
                    color: #cbd5e1;
                }
                
                .guest-screen-actions {
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                    justify-content: center;
                }
                
                .guest-login-btn, .guest-register-btn {
                    padding: 14px 30px;
                    border-radius: 40px;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.3s ease;
                    border: none;
                }
                
                .guest-login-btn {
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: white;
                    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
                }
                
                .guest-login-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 30px rgba(59, 130, 246, 0.4);
                }
                
                .guest-register-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    color: #cbd5e1;
                }
                
                .guest-register-btn:hover {
                    background: rgba(59, 130, 246, 0.1);
                    border-color: #60a5fa;
                    color: white;
                }
                
                @media (max-width: 600px) {
                    .guest-screen h3 {
                        font-size: 1.4rem;
                    }
                    .guest-screen p {
                        font-size: 0.9rem;
                    }
                    .guest-feature {
                        padding: 10px 15px;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        // Заменяем содержимое страниц
        this.replacePageContent('chat', this.createGuestChatScreen());
        this.replacePageContent('products-manage', this.createGuestProductsScreen());
        this.replacePageContent('profile', this.createGuestProfileScreen());
    }

    hideGuestScreens() {
        // Восстанавливаем оригинальное содержимое при необходимости
        ['chat', 'products-manage', 'profile'].forEach(pageId => {
            const page = document.getElementById(pageId);
            if (page && page.querySelector('.guest-screen')) {
                // При следующем открытии страницы она перезагрузится через обычные функции
                page.querySelector('.guest-screen')?.remove();
            }
        });
    }

    replacePageContent(pageId, guestContent) {
        const page = document.getElementById(pageId);
        if (!page) return;
        
        // Сохраняем оригинальное содержимое если ещё не сохранили
        if (!page.dataset.originalContent) {
            page.dataset.originalContent = page.innerHTML;
        }
        
        // Заменяем на гостевой экран
        page.innerHTML = guestContent;
        
        // Добавляем обработчики для кнопок
        page.querySelectorAll('.guest-login-btn, .guest-register-btn').forEach(btn => {
            btn.addEventListener('click', () => this.showAuthModal());
        });
    }

    createGuestChatScreen() {
        return `
            <div class="guest-screen">
                <div class="guest-screen-icon">
                    <i class="fas fa-comments"></i>
                </div>
                <h3>Чат с продавцами и поддержкой</h3>
                <p>Общайтесь напрямую с продавцами, получайте консультации и решайте вопросы в реальном времени</p>
                <div class="guest-screen-features">
                    <div class="guest-feature">
                        <i class="fas fa-headset"></i>
                        <span>Поддержка 24/7</span>
                    </div>
                    <div class="guest-feature">
                        <i class="fas fa-store"></i>
                        <span>Общение с продавцами</span>
                    </div>
                    <div class="guest-feature">
                        <i class="fas fa-history"></i>
                        <span>История диалогов</span>
                    </div>
                </div>
                <div class="guest-screen-actions">
                    <button class="guest-login-btn">
                        <i class="fas fa-sign-in-alt"></i> Войти и начать общение
                    </button>
                    <button class="guest-register-btn">
                        <i class="fas fa-user-plus"></i> Зарегистрироваться
                    </button>
                </div>
            </div>
        `;
    }

    createGuestProductsScreen() {
        return `
            <div class="guest-screen">
                <div class="guest-screen-icon">
                    <i class="fas fa-tags"></i>
                </div>
                <h3>Ваши товары и продажи</h3>
                <p>Создавайте и управляйте своими товарами, отслеживайте продажи и зарабатывайте на маркетплейсе</p>
                <div class="guest-screen-features">
                    <div class="guest-feature">
                        <i class="fas fa-plus-circle"></i>
                        <span>Добавление товаров</span>
                    </div>
                    <div class="guest-feature">
                        <i class="fas fa-chart-line"></i>
                        <span>Статистика продаж</span>
                    </div>
                    <div class="guest-feature">
                        <i class="fas fa-wallet"></i>
                        <span>Вывод средств</span>
                    </div>
                </div>
                <div class="guest-screen-actions">
                    <button class="guest-login-btn">
                        <i class="fas fa-sign-in-alt"></i> Войти и начать продавать
                    </button>
                    <button class="guest-register-btn">
                        <i class="fas fa-user-plus"></i> Стать продавцом
                    </button>
                </div>
            </div>
        `;
    }

    createGuestProfileScreen() {
        return `
            <div class="guest-screen">
                <div class="guest-screen-icon">
                    <i class="fas fa-user-circle"></i>
                </div>
                <h3>Ваш профиль</h3>
                <p>Отслеживайте покупки, управляйте балансом, получайте достижения и персональные скидки</p>
                <div class="guest-screen-features">
                    <div class="guest-feature">
                        <i class="fas fa-coins"></i>
                        <span>Баланс и бонусы</span>
                    </div>
                    <div class="guest-feature">
                        <i class="fas fa-trophy"></i>
                        <span>Достижения</span>
                    </div>
                    <div class="guest-feature">
                        <i class="fas fa-percent"></i>
                        <span>Персональные скидки</span>
                    </div>
                </div>
                <div class="guest-screen-actions">
                    <button class="guest-login-btn">
                        <i class="fas fa-sign-in-alt"></i> Войти в профиль
                    </button>
                    <button class="guest-register-btn">
                        <i class="fas fa-user-plus"></i> Создать аккаунт
                    </button>
                </div>
            </div>
        `;
    }

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

    setupEventListeners() {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showAuthModal());
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        const profileLogoutBtn = document.getElementById('profileLogoutBtn');
        if (profileLogoutBtn) {
            profileLogoutBtn.addEventListener('click', () => this.logout());
        }

        document.getElementById('loginTab')?.addEventListener('click', () => this.switchAuthTab('login'));
        document.getElementById('registerTab')?.addEventListener('click', () => this.switchAuthTab('register'));

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

        document.getElementById('googleLoginBtn')?.addEventListener('click', () => this.loginWithGoogle());
        document.getElementById('vkLoginBtn')?.addEventListener('click', () => this.loginWithVK());
        
        const modal = document.getElementById('authModal');
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) this.closeAuthModal();
        });
        document.querySelector('#authModal .close-modal')?.addEventListener('click', () => this.closeAuthModal());

        // Перехватываем навигацию для обновления гостевых экранов
        const originalShowPage = window.showPage;
        if (originalShowPage) {
            window.showPage = (pageId) => {
                originalShowPage(pageId);
                setTimeout(() => this.checkGuestPages(), 50);
            };
        }
    }

    showToast(message, type = 'success') {
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

// Приветственное уведомление для гостей
function showGuestWelcome() {
    const isLoggedIn = !!localStorage.getItem('auth_token');
    const hasSeenWelcome = sessionStorage.getItem('guest_welcome_shown');
    
    if (!isLoggedIn && !hasSeenWelcome) {
        sessionStorage.setItem('guest_welcome_shown', 'true');
        
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
                        from { opacity: 0; transform: translateX(-50%) translateY(30px); }
                        to { opacity: 1; transform: translateX(-50%) translateY(0); }
                    }
                    
                    @keyframes slideDownWelcome {
                        from { opacity: 1; transform: translateX(-50%) translateY(0); }
                        to { opacity: 0; transform: translateX(-50%) translateY(30px); }
                    }
                    
                    .welcome-content {
                        background: linear-gradient(135deg, #1a1f35 0%, #0f1322 100%);
                        border: 1px solid rgba(59, 130, 246, 0.4);
                        border-radius: 60px;
                        padding: 16px 20px;
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
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
                    
                    .welcome-text { flex: 1; }
                    .welcome-text h4 { margin: 0 0 5px 0; color: white; font-size: 1rem; font-weight: 700; }
                    .welcome-text p { margin: 0; color: #94a3b8; font-size: 0.8rem; }
                    
                    .welcome-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
                    
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
                    }
                    
                    .welcome-login-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
                    }
                    
                    .welcome-close-btn {
                        background: rgba(255, 255, 255, 0.1);
                        border: none;
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        color: #94a3b8;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .welcome-close-btn:hover {
                        background: rgba(239, 68, 68, 0.3);
                        color: #f87171;
                    }
                    
                    @media (max-width: 600px) {
                        .guest-welcome-notification { bottom: 90px; }
                        .welcome-content { flex-wrap: wrap; border-radius: 30px; padding: 15px; }
                        .welcome-text { min-width: 200px; }
                        .welcome-actions { width: 100%; justify-content: flex-end; margin-top: 5px; }
                        .welcome-login-btn { flex: 1; justify-content: center; }
                    }
                `;
                document.head.appendChild(styles);
            }
            
            setTimeout(() => {
                notification.style.animation = 'slideDownWelcome 0.3s ease forwards';
                setTimeout(() => notification.remove(), 300);
            }, 8000);
        }, 1500);
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

// Показываем приветствие при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showGuestWelcome);
} else {
    showGuestWelcome();
}