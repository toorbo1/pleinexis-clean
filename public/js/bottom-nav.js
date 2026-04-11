// ========== ФИНАЛЬНАЯ ВЕРСИЯ АНИМАЦИИ КАПЛИ ==========
(function() {
    console.log('💧 ФИНАЛЬНЫЙ BLOB СКРИПТ ЗАПУЩЕН');
    
    let blob = null;
    let container = null;
    let buttons = [];
    let currentTab = 'home';
    let initTimer = null;
    
    // Ждем полной загрузки всего
    function waitForElements() {
        blob = document.getElementById('mainBlob');
        container = document.getElementById('navContainer');
        buttons = document.querySelectorAll('.nav-item');
        
        if (!blob || !container || buttons.length === 0) {
            console.log('⏳ Элементы еще не готовы, ждем...');
            initTimer = setTimeout(waitForElements, 100);
            return;
        }
        
        console.log('✅ Все элементы найдены');
        init();
    }
    
    function getButtonPosition(btn) {
        if (!btn || !container) return null;
        
        const containerRect = container.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        
        // Проверяем, что размеры корректные
        if (btnRect.width === 0 || containerRect.width === 0) {
            console.warn('⚠️ Ширина 0, пропускаем');
            return null;
        }
        
        return {
            left: btnRect.left - containerRect.left,
            width: btnRect.width
        };
    }
    
    function moveBlobToButton(btn) {
        const pos = getButtonPosition(btn);
        if (!pos) {
            console.warn('❌ Не удалось получить позицию');
            return false;
        }
        
        console.log(`📐 Перемещение: left=${pos.left}px, width=${pos.width}px`);
        
        blob.style.transition = 'left 0.35s cubic-bezier(0.2, 0.9, 0.4, 1.1), width 0.35s cubic-bezier(0.2, 0.9, 0.4, 1.1)';
        blob.style.left = pos.left + 'px';
        blob.style.width = pos.width + 'px';
        
        return true;
    }
    
    function setInitialPosition() {
        const activeBtn = document.querySelector('.nav-item.active') || buttons[0];
        const pos = getButtonPosition(activeBtn);
        
        if (pos) {
            blob.style.transition = 'none';
            blob.style.left = pos.left + 'px';
            blob.style.width = pos.width + 'px';
            
            // Принудительно вызываем reflow
            blob.offsetHeight;
            
            console.log('📍 Начальная позиция установлена');
            return true;
        }
        return false;
    }
    
    function init() {
        // Пробуем установить начальную позицию
        if (!setInitialPosition()) {
            // Если не получилось, пробуем еще раз через 50ms
            setTimeout(() => {
                if (!setInitialPosition()) {
                    setTimeout(() => setInitialPosition(), 100);
                }
            }, 50);
        }
        
        // Вешаем обработчики на кнопки
        buttons.forEach(btn => {
            // Удаляем старые обработчики
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const tabId = this.getAttribute('data-nav');
                console.log('🖱️ Клик по:', tabId);
                
                // Обновляем активный класс
                document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Двигаем каплю
                moveBlobToButton(this);
                
                // Переключаем страницу
                if (typeof window.showPage === 'function') {
                    window.showPage(tabId);
                }
                
                currentTab = tabId;
            });
        });
        
        // Обновляем ссылки на кнопки
        buttons = document.querySelectorAll('.nav-item');
        
        // Ресайз с защитой от частых вызовов
        let resizeTimer = null;
        window.addEventListener('resize', () => {
            if (resizeTimer) clearTimeout(resizeTimer);
            
            resizeTimer = setTimeout(() => {
                const activeBtn = document.querySelector('.nav-item.active');
                if (activeBtn) {
                    const pos = getButtonPosition(activeBtn);
                    if (pos) {
                        blob.style.transition = 'none';
                        blob.style.left = pos.left + 'px';
                        blob.style.width = pos.width + 'px';
                        blob.offsetHeight; // reflow
                    }
                }
                resizeTimer = null;
            }, 100);
        });
        
        console.log('✅ BLOB НАВИГАЦИЯ ГОТОВА!');
    }
    
    // Запускаем с задержкой, чтобы DOM точно был готов
    setTimeout(waitForElements, 200);
    
})();