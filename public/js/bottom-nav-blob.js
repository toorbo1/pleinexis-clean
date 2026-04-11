// ========== НИЖНЯЯ ПАНЕЛЬ С LIQUID BLOB ЭФФЕКТОМ ==========
// Полностью рабочая версия с анимацией

(function() {
    console.log('💧 BLOB NAVIGATION STARTING...');
    
    let navItems = null;
    let mainBlob = null;
    let container = null;
    let currentTab = 'home';
    let isAnimating = false;
    let animTimer = null;

    // Минималистичные SVG иконки
    const icons = {
        home: `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
        chat: `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
        'products-manage': `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
        profile: `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
    };

    const tabConfig = {
        home: { icon: icons.home, label: 'Главная' },
        chat: { icon: icons.chat, label: 'Чаты' },
        'products-manage': { icon: icons['products-manage'], label: 'Товары' },
        profile: { icon: icons.profile, label: 'Профиль' }
    };

    // Функция получения позиции кнопки
    function getButtonPos(tabId) {
        const btn = document.querySelector(`.nav-item[data-nav="${tabId}"]`);
        if (!btn || !container) {
            console.warn(`Кнопка ${tabId} или контейнер не найдены`);
            return null;
        }
        
        const containerRect = container.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        
        return {
            left: btnRect.left - containerRect.left,
            width: btnRect.width,
            center: (btnRect.left - containerRect.left) + btnRect.width / 2
        };
    }

    // Анимация перехода капли
    function animateToTab(newTabId) {
        console.log(`💧 Анимация: ${currentTab} -> ${newTabId}`);
        
        if (isAnimating) {
            console.log('⏳ Анимация уже идет, пропускаем');
            return;
        }
        if (currentTab === newTabId) {
            console.log('📍 Вкладка уже активна');
            return;
        }
        
        const fromPos = getButtonPos(currentTab);
        const toPos = getButtonPos(newTabId);
        
        if (!fromPos || !toPos) {
            console.error('❌ Не удалось получить позиции кнопок');
            // Принудительно пробуем переместить
            if (mainBlob && toPos) {
                mainBlob.style.left = toPos.left + 'px';
                mainBlob.style.width = toPos.width + 'px';
            }
            updateActiveClass(newTabId);
            currentTab = newTabId;
            return;
        }
        
        isAnimating = true;
        
        // ПРИМЕНЯЕМ АНИМАЦИЮ
        mainBlob.style.transition = 'left 0.35s cubic-bezier(0.2, 0.9, 0.4, 1.1), width 0.35s cubic-bezier(0.2, 0.9, 0.4, 1.1)';
        mainBlob.style.left = toPos.left + 'px';
        mainBlob.style.width = toPos.width + 'px';
        
        if (animTimer) clearTimeout(animTimer);
        animTimer = setTimeout(() => {
            updateActiveClass(newTabId);
            currentTab = newTabId;
            isAnimating = false;
            animTimer = null;
            console.log('✅ Анимация завершена');
        }, 350);
    }
    
    function updateActiveClass(activeTabId) {
        navItems.forEach(item => {
            const tab = item.getAttribute('data-nav');
            if (tab === activeTabId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Переключение страницы
    function switchToPage(pageId) {
        console.log('📄 Переключение на страницу:', pageId);
        if (typeof window.showPage === 'function') {
            window.showPage(pageId);
        } else if (typeof window.navigate === 'function') {
            window.navigate(pageId);
        } else {
            console.error('❌ Функция навигации не найдена');
        }
    }

    // Инициализация
    function initBlobNavigation() {
        console.log('🔧 Инициализация blob навигации...');
        
        navItems = document.querySelectorAll('.nav-item');
        mainBlob = document.getElementById('mainBlob');
        container = document.getElementById('navContainer');
        
        if (!mainBlob || !container) {
            console.error('❌ mainBlob или navContainer не найдены!');
            console.log('mainBlob:', mainBlob);
            console.log('container:', container);
            return;
        }
        
        console.log('✅ Элементы найдены');
        
        // Устанавливаем иконки
        navItems.forEach(item => {
            const tabId = item.getAttribute('data-nav');
            const iconContainer = item.querySelector('.nav-icon');
            if (iconContainer && tabConfig[tabId]) {
                iconContainer.innerHTML = tabConfig[tabId].icon;
            }
        });
        
        // НАЧАЛЬНАЯ ПОЗИЦИЯ КАПЛИ
        const homePos = getButtonPos('home');
        if (homePos) {
            mainBlob.style.transition = 'none';
            mainBlob.style.left = homePos.left + 'px';
            mainBlob.style.width = homePos.width + 'px';
            console.log('📍 Начальная позиция установлена:', homePos);
        }
        
        // Определяем активную вкладку
        const activeBtn = document.querySelector('.nav-item.active');
        if (activeBtn) {
            currentTab = activeBtn.getAttribute('data-nav') || 'home';
        } else {
            document.querySelector('.nav-item[data-nav="home"]')?.classList.add('active');
            currentTab = 'home';
        }
        
        // ВЕШАЕМ ОБРАБОТЧИКИ
        navItems.forEach(item => {
            // Удаляем старые обработчики
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            newItem.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tabId = newItem.getAttribute('data-nav');
                console.log('🖱️ Клик по кнопке:', tabId);
                
                if (tabId) {
                    animateToTab(tabId);
                    switchToPage(tabId);
                }
            });
        });
        
        navItems = document.querySelectorAll('.nav-item');
        
        // Обработчик ресайза
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
                    console.log('📐 Позиция обновлена после ресайза');
                }
            }, 100);
        });
        
        console.log('✅ BLOB NAVIGATION ГОТОВА!');
    }
    
    // Экспорт
    window.initBlobNavigation = initBlobNavigation;
    
    // АВТОЗАПУСК
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBlobNavigation);
    } else {
        // Даем время DOM полностью отрисоваться
        setTimeout(initBlobNavigation, 100);
    }
    
})();