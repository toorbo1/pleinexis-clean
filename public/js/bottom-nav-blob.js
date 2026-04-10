// ========== НИЖНЯЯ ПАНЕЛЬ С LIQUID BLOB ЭФФЕКТОМ ==========
// Черная капля - без анимаций и эффектов при наведении

(function() {
    let navItems = null;
    let mainBlob = null;
    let container = null;
    let currentTab = 'home';
    let isAnimating = false;
    let animTimer = null;

    // Минималистичные SVG иконки (только для кнопок)
    const icons = {
        home: `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
        chat: `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
        'products-manage': `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
        profile: `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
    };

    // Конфигурация вкладок
    const tabConfig = {
        home: { icon: icons.home, label: 'Главная' },
        chat: { icon: icons.chat, label: 'Чаты' },
        'products-manage': { icon: icons['products-manage'], label: 'Товары' },
        profile: { icon: icons.profile, label: 'Профиль' }
    };

    // Функция для получения позиции кнопки
    function getButtonPos(tabId) {
        const btn = document.querySelector(`.nav-item[data-nav="${tabId}"]`);
        if (!btn) return null;
        const containerRect = container.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        return {
            left: btnRect.left - containerRect.left,
            width: btnRect.width,
            center: (btnRect.left - containerRect.left) + btnRect.width / 2,
            top: btnRect.top - containerRect.top,
            height: btnRect.height
        };
    }

    // Убираем создание частиц (больше не нужны)
    function createParticles(x, y, count) {
        // Функция пустая - частицы отключены
        return;
    }

    // Анимация перехода - только left и width (без частиц)
    function animateToTab(newTabId) {
        if (isAnimating) return;
        if (currentTab === newTabId) return;
        
        isAnimating = true;
        
        const fromPos = getButtonPos(currentTab);
        const toPos = getButtonPos(newTabId);
        if (!fromPos || !toPos) {
            isAnimating = false;
            return;
        }
        
        // ТОЛЬКО left и width, НЕ ТРОГАЕМ bottom и height
        mainBlob.style.transition = 'left 0.35s cubic-bezier(0.2, 0.9, 0.4, 1.1), width 0.35s cubic-bezier(0.2, 0.9, 0.4, 1.1)';
        mainBlob.style.left = toPos.left + 'px';
        mainBlob.style.width = toPos.width + 'px';
        
        if (animTimer) clearTimeout(animTimer);
        animTimer = setTimeout(() => {
            // Убираем анимацию масштабирования
            if (navItems) {
                navItems.forEach(item => {
                    const tab = item.getAttribute('data-nav');
                    if (tab === newTabId) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            }
            
            currentTab = newTabId;
            isAnimating = false;
            animTimer = null;
        }, 350);
    }

    // Переключение страницы
    function switchToPage(pageId) {
        if (typeof window.navigate === 'function') {
            window.navigate(pageId);
        } else if (typeof window.showPage === 'function') {
            window.showPage(pageId);
        } else {
            console.warn('Navigation function not found');
        }
    }

    // Инициализация blob навигации
    function initBlobNavigation() {
        navItems = document.querySelectorAll('.nav-item');
        mainBlob = document.getElementById('mainBlob');
        container = document.getElementById('navContainer');
        
        if (!mainBlob || !container) {
            console.warn('Blob navigation elements not found');
            return;
        }
        
        // Устанавливаем SVG иконки для кнопок
        navItems.forEach(item => {
            const tabId = item.getAttribute('data-nav');
            const iconContainer = item.querySelector('.nav-icon');
            if (iconContainer && tabConfig[tabId]) {
                iconContainer.innerHTML = tabConfig[tabId].icon;
            }
        });
        
        // Устанавливаем начальную позицию блоба - ТОЛЬКО left и width
        const homePos = getButtonPos('home');
        if (homePos) {
            mainBlob.style.left = homePos.left + 'px';
            mainBlob.style.width = homePos.width + 'px';
        }
        
        // Устанавливаем активную кнопку
        const activeBtn = document.querySelector('.nav-item.active');
        if (activeBtn && activeBtn.getAttribute('data-nav')) {
            currentTab = activeBtn.getAttribute('data-nav');
        } else {
            const homeBtn = document.querySelector('.nav-item[data-nav="home"]');
            if (homeBtn) homeBtn.classList.add('active');
            currentTab = 'home';
        }
        
        // Добавляем обработчики
        navItems.forEach(item => {
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            // Используем click для всех устройств
            newItem.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tabId = newItem.getAttribute('data-nav');
                if (tabId) {
                    animateToTab(tabId);
                    switchToPage(tabId);
                }
            });
        });
        
        // Обновляем navItems
        navItems = document.querySelectorAll('.nav-item');
        
        // Обработчик ресайза - обновляем только left и width
        let resizeTimer;
        window.addEventListener('resize', () => {
            if (isAnimating) return;
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const pos = getButtonPos(currentTab);
                if (pos && mainBlob) {
                    mainBlob.style.transition = 'none';
                    mainBlob.style.left = pos.left + 'px';
                    mainBlob.style.width = pos.width + 'px';
                    void mainBlob.offsetHeight;
                }
            }, 100);
        });
        
        console.log('Blob navigation initialized (black blob, no animations)');
    }
    
    // Экспортируем функцию
    window.initBlobNavigation = initBlobNavigation;
    
    // Автоматическая инициализация
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBlobNavigation);
    } else {
        initBlobNavigation();
    }
})();