// ========== ПОЛНАЯ СИСТЕМА АВТОРИЗАЦИИ (РАБОЧАЯ ВЕРСИЯ) ==========

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.currentUser = null;
        this.modalAutoShown = false;
        
        // ID приложений (ЗАМЕНИТЕ НА СВОИ!)
        this.GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
        this.VK_APP_ID = 12345678;
        
        this.init();
    }

    async init() {
        await this.loadExternalScripts();
        this.injectAuthModal();
        this.setupEventListeners();
        
        if (this.token) {
            await this.fetchCurrentUser();
        }
        
        this.updateUI();
        this.checkGuestPages();
        
        setTimeout(() => {
            if (!this.currentUser && !this.modalAutoShown) {
                this.showAuthModal('register');
                this.modalAutoShown = true;
            }
        }, 1000);
        
        console.log('✅ AuthManager инициализирован');
    }

    injectAuthModal() {
        if (document.getElementById('authModal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'authModal';
        modal.className = 'modal-glass';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-modal-header">
                    <div class="auth-logo">
                        <i class="fas fa-crown"></i>
                        <span>Плейнексис</span>
                    </div>
                    <button class="auth-close-btn" id="authModalCloseBtn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="auth-tabs">
                    <button class="auth-tab" id="loginTab">
                        <i class="fas fa-sign-in-alt"></i> Вход
                    </button>
                    <button class="auth-tab active" id="registerTab">
                        <i class="fas fa-user-plus"></i> Регистрация
                    </button>
                </div>
                
                <!-- Форма входа -->
                <div id="loginForm" class="auth-form">
                    <div class="auth-social-buttons">
                        <button class="auth-social-btn google" id="googleLoginBtn2">
                            <i class="fab fa-google"></i>
                            <span>Google</span>
                        </button>
                        <button class="auth-social-btn vk" id="vkLoginBtn2">
                            <i class="fab fa-vk"></i>
                            <span>VK</span>
                        </button>
                    </div>
                    
                    <div class="auth-divider">
                        <span>или</span>
                    </div>
                    
                    <form id="loginFormElement">
                        <div class="auth-input-group">
                            <i class="fas fa-envelope"></i>
                            <input type="email" id="loginEmail" placeholder="Email" required>
                        </div>
                        <div class="auth-input-group">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="loginPassword" placeholder="Пароль" required>
                        </div>
                        <button type="submit" class="auth-submit-btn">
                            <i class="fas fa-sign-in-alt"></i> Войти
                        </button>
                    </form>
                    
                    <p class="auth-footer-text">
                        Нет аккаунта? 
                        <a href="#" id="switchToRegister">Зарегистрироваться</a>
                    </p>
                </div>
                
                <!-- Форма регистрации -->
                <div id="registerForm" class="auth-form active">
                    <div class="auth-welcome-text">
                        <i class="fas fa-hand-wave"></i>
                        <span>Присоединяйся к нам!</span>
                    </div>
                    
                    <div class="auth-social-buttons">
                        <button class="auth-social-btn google" id="googleRegisterBtn2">
                            <i class="fab fa-google"></i>
                            <span>Google</span>
                        </button>
                        <button class="auth-social-btn vk" id="vkRegisterBtn2">
                            <i class="fab fa-vk"></i>
                            <span>VK</span>
                        </button>
                    </div>
                    
                    <div class="auth-divider">
                        <span>или</span>
                    </div>
                    
                    <form id="registerFormElement">
                        <div class="auth-input-group">
                            <i class="fas fa-envelope"></i>
                            <input type="email" id="registerEmail" placeholder="Email" required>
                        </div>
                        <div class="auth-input-group">
                            <i class="fas fa-user"></i>
                            <input type="text" id="registerUsername" placeholder="Имя пользователя" required>
                        </div>
                        <div class="auth-input-group">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="registerPassword" placeholder="Пароль (мин. 6 символов)" required>
                        </div>
                        <div class="auth-input-group">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="registerConfirmPassword" placeholder="Подтвердите пароль" required>
                        </div>
                        <button type="submit" class="auth-submit-btn">
                            <i class="fas fa-user-plus"></i> Зарегистрироваться
                        </button>
                    </form>
                    
                    <p class="auth-footer-text">
                        Уже есть аккаунт? 
                        <a href="#" id="switchToLogin">Войти</a>
                    </p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        if (!document.getElementById('auth-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'auth-modal-styles';
            styles.textContent = `
                .modal-glass {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(12px);
                    display: none;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    padding: 16px;
                }
                
                .modal-glass.active {
                    display: flex;
                    animation: modalFadeIn 0.2s ease;
                }
                
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .auth-modal-content {
                    background: linear-gradient(145deg, #0f1322, #0a0d18);
                    border-radius: 32px;
                    padding: 28px;
                    width: 100%;
                    max-width: 420px;
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                }
                
                .auth-modal-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 24px;
                }
                
                .auth-logo {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 1.3rem;
                    font-weight: 700;
                }
                
                .auth-logo i {
                    color: #fbbf24;
                    font-size: 1.5rem;
                }
                
                .auth-logo span {
                    background: linear-gradient(135deg, #fff, #a78bfa);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }
                
                .auth-close-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: none;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    color: #94a3b8;
                    font-size: 1.1rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                
                .auth-close-btn:hover {
                    background: rgba(239, 68, 68, 0.2);
                    color: #f87171;
                }
                
                .auth-welcome-text {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    margin-bottom: 20px;
                    padding: 12px;
                    background: rgba(59, 130, 246, 0.1);
                    border-radius: 40px;
                    color: white;
                    font-weight: 600;
                    border: 1px solid rgba(59, 130, 246, 0.2);
                }
                
                .auth-welcome-text i {
                    color: #fbbf24;
                    font-size: 1.2rem;
                    animation: wave 1s ease infinite;
                }
                
                @keyframes wave {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-15deg); }
                    75% { transform: rotate(15deg); }
                }
                
                .auth-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 24px;
                    background: rgba(255, 255, 255, 0.03);
                    padding: 4px;
                    border-radius: 40px;
                }
                
                .auth-tab {
                    flex: 1;
                    padding: 12px;
                    background: transparent;
                    border: none;
                    border-radius: 40px;
                    color: #94a3b8;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                }
                
                .auth-tab:hover {
                    color: #cbd5e1;
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .auth-tab.active {
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: white;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }
                
                .auth-form {
                    display: none;
                }
                
                .auth-form.active {
                    display: block;
                }
                
                .auth-social-buttons {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 20px;
                }
                
                .auth-social-btn {
                    flex: 1;
                    padding: 12px;
                    border: none;
                    border-radius: 40px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                }
                
                .auth-social-btn.google {
                    background: #fff;
                    color: #1a1a2e;
                }
                
                .auth-social-btn.google:hover {
                    background: #f0f0f0;
                    transform: translateY(-2px);
                }
                
                .auth-social-btn.vk {
                    background: #0077ff;
                    color: white;
                }
                
                .auth-social-btn.vk:hover {
                    background: #0066dd;
                    transform: translateY(-2px);
                }
                
                .auth-divider {
                    display: flex;
                    align-items: center;
                    text-align: center;
                    color: #4a5568;
                    font-size: 0.8rem;
                    margin: 20px 0;
                }
                
                .auth-divider::before,
                .auth-divider::after {
                    content: '';
                    flex: 1;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .auth-divider span {
                    padding: 0 12px;
                }
                
                .auth-input-group {
                    display: flex;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 40px;
                    padding: 4px 4px 4px 16px;
                    margin-bottom: 12px;
                    transition: all 0.2s ease;
                }
                
                .auth-input-group:focus-within {
                    border-color: #3b82f6;
                    background: rgba(59, 130, 246, 0.05);
                }
                
                .auth-input-group i {
                    color: #5f6b8a;
                    font-size: 0.9rem;
                    width: 20px;
                }
                
                .auth-input-group input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    padding: 12px 8px;
                    color: white;
                    font-size: 0.9rem;
                    outline: none;
                }
                
                .auth-input-group input::placeholder {
                    color: #4a5568;
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
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    margin-top: 20px;
                    transition: all 0.3s ease;
                    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
                }
                
                .auth-submit-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 30px rgba(59, 130, 246, 0.4);
                }
                
                .auth-footer-text {
                    text-align: center;
                    margin-top: 20px;
                    color: #6b7a9e;
                    font-size: 0.85rem;
                }
                
                .auth-footer-text a {
                    color: #60a5fa;
                    text-decoration: none;
                    font-weight: 600;
                    cursor: pointer;
                }
                
                .auth-footer-text a:hover {
                    color: #93c5fd;
                    text-decoration: underline;
                }
                
                /* Гостевые экраны */
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
                    background: radial-gradient(circle at 50% 40%, rgba(59, 130, 246, 0.08), transparent 70%);
                    z-index: 100;
                    min-height: 70vh;
                }
                
                .guest-screen-icon {
                    width: 100px;
                    height: 100px;
                    margin-bottom: 24px;
                }
                
                .guest-screen-icon i {
                    font-size: 70px;
                    background: linear-gradient(135deg, #60a5fa, #a78bfa);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    filter: drop-shadow(0 0 30px rgba(96, 165, 250, 0.4));
                    animation: iconFloat 3s ease-in-out infinite;
                }
                
                @keyframes iconFloat {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                
                .guest-screen h3 {
                    font-size: 1.6rem;
                    font-weight: 700;
                    margin-bottom: 12px;
                    background: linear-gradient(135deg, #fff, #c4b5fd);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }
                
                .guest-screen p {
                    color: #94a3b8;
                    font-size: 0.95rem;
                    max-width: 380px;
                    margin-bottom: 24px;
                    line-height: 1.5;
                }
                
                .guest-login-btn {
                    padding: 14px 32px;
                    border-radius: 40px;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: white;
                    border: none;
                    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
                    transition: all 0.3s ease;
                }
                
                .guest-login-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 30px rgba(59, 130, 246, 0.4);
                }
                
                @media (max-width: 480px) {
                    .auth-modal-content {
                        padding: 20px;
                        border-radius: 24px;
                    }
                    
                    .auth-social-buttons {
                        flex-direction: column;
                    }
                    
                    .guest-screen h3 {
                        font-size: 1.3rem;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Перепривязываем обработчики после создания модалки
        setTimeout(() => this.setupEventListeners(), 50);
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
                this.showToast('Регистрация успешна! Добро пожаловать!', 'success');
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
        
        this.modalAutoShown = false;
        
        setTimeout(() => {
            if (!this.currentUser && !this.modalAutoShown) {
                this.showAuthModal('register');
                this.modalAutoShown = true;
            }
        }, 500);
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

    checkGuestPages() {
        const isLoggedIn = !!this.currentUser;
        
        if (!isLoggedIn) {
            this.showGuestScreens();
        } else {
            this.hideGuestScreens();
        }
    }

    showGuestScreens() {
        const self = this;
        
        // Сохраняем оригинальное содержимое и заменяем на гостевой экран
        this.replacePageContent('chat', this.createGuestChatScreen());
        this.replacePageContent('products-manage', this.createGuestProductsScreen());
        this.replacePageContent('profile', this.createGuestProfileScreen());
        
        // Привязываем обработчики к кнопкам - ВАЖНО!
        setTimeout(() => {
            document.querySelectorAll('.guest-login-btn').forEach(btn => {
                // Удаляем старые обработчики
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                
                // Добавляем новый обработчик
                newBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Кнопка "Войти или зарегистрироваться" нажата!');
                    self.showAuthModal('register');
                });
            });
            
            console.log('✅ Обработчики для гостевых кнопок привязаны');
        }, 100);
    }

    hideGuestScreens() {
        ['chat', 'products-manage', 'profile'].forEach(pageId => {
            const page = document.getElementById(pageId);
            if (page && page.dataset.originalContent) {
                page.innerHTML = page.dataset.originalContent;
                delete page.dataset.originalContent;
            }
        });
    }

    replacePageContent(pageId, guestContent) {
        const page = document.getElementById(pageId);
        if (!page) return;
        
        // Сохраняем оригинальное содержимое только один раз
        if (!page.dataset.originalContent) {
            page.dataset.originalContent = page.innerHTML;
        }
        
        page.innerHTML = guestContent;
    }

    createGuestChatScreen() {
        return `
            <div class="guest-screen">
                <div class="guest-screen-icon">
                    <i class="fas fa-comments"></i>
                </div>
                <h3>Чат с продавцами и поддержкой</h3>
                <p>Войдите в аккаунт чтобы общаться с продавцами и получать поддержку 24/7</p>
                <button class="guest-login-btn">
                    <i class="fas fa-sign-in-alt"></i> Войти или зарегистрироваться
                </button>
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
                <p>Войдите чтобы создавать товары, отслеживать продажи и зарабатывать</p>
                <button class="guest-login-btn">
                    <i class="fas fa-sign-in-alt"></i> Войти или зарегистрироваться
                </button>
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
                <p>Войдите чтобы управлять балансом, отслеживать покупки и получать бонусы</p>
                <button class="guest-login-btn">
                    <i class="fas fa-sign-in-alt"></i> Войти или зарегистрироваться
                </button>
            </div>
        `;
    }

    showAuthModal(tab = 'register') {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.classList.add('active');
            this.switchAuthTab(tab);
            console.log('🔓 Модальное окно открыто, вкладка:', tab);
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
            if (loginForm) loginForm.classList.add('active');
            if (registerForm) registerForm.classList.remove('active');
            if (loginTab) loginTab.classList.add('active');
            if (registerTab) registerTab.classList.remove('active');
        } else {
            if (loginForm) loginForm.classList.remove('active');
            if (registerForm) registerForm.classList.add('active');
            if (loginTab) loginTab.classList.remove('active');
            if (registerTab) registerTab.classList.add('active');
        }
    }

    setupEventListeners() {
        // Кнопка входа в хедере
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            const newBtn = loginBtn.cloneNode(true);
            loginBtn.parentNode.replaceChild(newBtn, loginBtn);
            newBtn.addEventListener('click', () => this.showAuthModal('register'));
        }

        // Кнопка выхода
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            const newBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);
            newBtn.addEventListener('click', () => this.logout());
        }
        
        const profileLogoutBtn = document.getElementById('profileLogoutBtn');
        if (profileLogoutBtn) {
            const newBtn = profileLogoutBtn.cloneNode(true);
            profileLogoutBtn.parentNode.replaceChild(newBtn, profileLogoutBtn);
            newBtn.addEventListener('click', () => this.logout());
        }

        // Табы
        document.getElementById('loginTab')?.addEventListener('click', () => this.switchAuthTab('login'));
        document.getElementById('registerTab')?.addEventListener('click', () => this.switchAuthTab('register'));
        
        document.getElementById('switchToRegister')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchAuthTab('register');
        });
        
        document.getElementById('switchToLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchAuthTab('login');
        });

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
            if (password.length < 6) {
                this.showToast('Пароль должен быть не менее 6 символов', 'error');
                return;
            }
            await this.register(email, username, password);
        });

        // Соцсети
        document.getElementById('googleLoginBtn2')?.addEventListener('click', () => this.loginWithGoogle());
        document.getElementById('googleRegisterBtn2')?.addEventListener('click', () => this.loginWithGoogle());
        document.getElementById('vkLoginBtn2')?.addEventListener('click', () => this.loginWithVK());
        document.getElementById('vkRegisterBtn2')?.addEventListener('click', () => this.loginWithVK());
        
        // Закрытие модалки
        const modal = document.getElementById('authModal');
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) this.closeAuthModal();
        });
        
        document.getElementById('authModalCloseBtn')?.addEventListener('click', () => this.closeAuthModal());

        // Перехват навигации
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
        
        const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle');
        toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
        toast.className = `toast-notification ${type} show`;
        
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

// Инициализация
window.auth = new AuthManager();

// Совместимость с admin.js
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