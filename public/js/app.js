// app.js - ПОЛНАЯ РАБОЧАЯ ВЕРСИЯ

// ========== ГЛОБАЛЬНАЯ НАВИГАЦИЯ ==========
window.showPage = function(pageId) {
    console.log('📄 showPage called:', pageId);
    
    // Скрываем ВСЕ страницы
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    
    // Показываем нужную страницу
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.style.display = 'block';
        targetPage.classList.add('active');
        console.log('✅ Page shown:', pageId);
    } else {
        console.error('❌ Page not found:', pageId);
    }
    
    // Прокрутка вверх
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Обновляем активные кнопки в нижней навигации
    updateActiveNavButton(pageId);
};

window.navigate = window.showPage;

// ========== ОБНОВЛЕНИЕ АКТИВНОЙ КНОПКИ ==========
function updateActiveNavButton(pageId) {
    // Обновляем нижнюю навигацию
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const navPage = item.getAttribute('data-nav');
        if (navPage === pageId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Обновляем десктопную навигацию
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const navPage = link.getAttribute('data-nav');
        if (navPage === pageId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// ========== ИНИЦИАЛИЗАЦИЯ НАВИГАЦИИ ==========
function initNavigation() {
    console.log('🔵 initNavigation started');
    
    // Нижняя навигация
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(btn => {
        // Удаляем старые обработчики
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const pageId = newBtn.getAttribute('data-nav');
            if (pageId) {
                console.log('🖱️ Nav button clicked:', pageId);
                window.showPage(pageId);
            }
        });
    });
    
    // Десктопная навигация
    const desktopNav = document.querySelectorAll('.nav-link');
    desktopNav.forEach(link => {
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
        
        newLink.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = newLink.getAttribute('data-nav');
            if (pageId) {
                console.log('🖱️ Desktop nav clicked:', pageId);
                window.showPage(pageId);
            }
        });
    });
    
    console.log('✅ Navigation initialized');
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
window.goBack = function() {
    window.showPage('home');
};

window.scrollGames = function(direction) {
    const container = document.getElementById('gamesScrollContainer');
    if (!container) return;
    const scrollAmount = 250;
    container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
};

window.scrollApps = function(direction) {
    const container = document.getElementById('appsScrollContainer');
    if (!container) return;
    const scrollAmount = 250;
    container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
};

window.showInfo = function(type) {
    const messages = {
        about: '📖 О нас\n\nПлейнексис — цифровой маркетплейс для покупки и продажи подписок, цифровых товаров и услуг.',
        privacy: '🔒 Политика конфиденциальности\n\nМы не передаём ваши данные третьим лицам.',
        info: 'ℹ️ Информация о проекте\n\nВерсия: 2.0',
        discounts: '🏷️ Скидки и акции\n\nПодпишитесь на наш Telegram!',
        interesting: '✨ Интересное\n\nСкоро: программа лояльности!',
        contacts: '📞 Контакты\n\nПоддержка: @pleinexis_support'
    };
    alert(messages[type] || 'Информация');
};

// ========== ФИЛЬТРАЦИЯ ТОВАРОВ ==========
window.filterProducts = function() {
    const term = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const globalTerm = document.getElementById('globalSearchInput')?.value.toLowerCase() || '';
    const searchTerm = term || globalTerm;
    
    if (!window.productsArray) return;
    
    const filtered = window.productsArray.filter(p => 
        p.title.toLowerCase().includes(searchTerm) || 
        (p.keyword && p.keyword.toLowerCase().includes(searchTerm))
    );
    
    const container = document.getElementById('productsGrid');
    if (!container) return;
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">Ничего не найдено</div>';
    } else {
        container.innerHTML = filtered.map(p => `
            <div class="product-card" onclick="window.openProductDetailById('${p.id}')">
                <div class="card-image">
                    <img src="${p.image_url || 'https://picsum.photos/id/42/400/300'}" 
                         onerror="this.src='https://picsum.photos/id/42/400/300'"
                         loading="lazy">
                    ${p.discount ? `<span class="discount-badge">🔥 ${p.discount}</span>` : ''}
                </div>
                <div class="card-body">
                    <div class="current-price">${escapeHtml(p.price)}</div>
                    <h3 class="product-title">${escapeHtml(p.title.substring(0, 50))}</h3>
                </div>
            </div>
        `).join('');
    }
};

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

// ========== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ==========
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 APP.JS - загрузка приложения');
    
    // Инициализация навигации
    initNavigation();
    
    // Инициализация авторизации
    if (typeof initAuth === 'function') {
        await initAuth();
    }
    
    // Загрузка данных с сервера
    if (typeof window.loadProducts === 'function') {
        await window.loadProducts();
    }
    if (typeof window.loadGameBlocks === 'function') {
        await window.loadGameBlocks();
    }
    if (typeof window.loadAppBlocks === 'function') {
        await window.loadAppBlocks();
    }
    
    // Настройка поиска
    const globalSearchInput = document.getElementById('globalSearchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    if (globalSearchInput) {
        globalSearchInput.addEventListener('input', function(e) {
            const mainSearchInput = document.getElementById('searchInput');
            if (mainSearchInput) {
                mainSearchInput.value = e.target.value;
            }
            if (typeof window.filterProducts === 'function') {
                window.filterProducts();
            }
            if (clearSearchBtn) {
                clearSearchBtn.style.display = e.target.value.length > 0 ? 'flex' : 'none';
            }
        });
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            if (globalSearchInput) {
                globalSearchInput.value = '';
                const mainSearchInput = document.getElementById('searchInput');
                if (mainSearchInput) mainSearchInput.value = '';
                if (typeof window.filterProducts === 'function') window.filterProducts();
                clearSearchBtn.style.display = 'none';
            }
        });
    }
    
    // Показываем главную страницу
    window.showPage('home');
    
    console.log('✅ APP.JS - инициализация завершена');
});