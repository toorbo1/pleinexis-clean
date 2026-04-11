// ========== ФИНАЛЬНАЯ ВЕРСИЯ АНИМАЦИИ КАПЛИ (ИСПРАВЛЕННАЯ) ==========
(function() {
    console.log('💧 BLOB СКРИПТ ЗАПУЩЕН (исправленная версия)');
    
    let blob = null;
    let container = null;
    let buttons = [];
    let initTimer = null;
    
    function waitForElements() {
        blob = document.getElementById('mainBlob');
        container = document.getElementById('navContainer');
        buttons = document.querySelectorAll('.nav-item');
        
        if (!blob || !container || buttons.length === 0) {
            console.log('⏳ Ждем элементы...');
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
        
        // Ждем пока размеры станут корректными
        if (btnRect.width === 0 || containerRect.width === 0) {
            console.warn('⚠️ Ширина 0, ждем...');
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
            // Пробуем еще раз через 50ms
            setTimeout(() => {
                const retryPos = getButtonPosition(btn);
                if (retryPos) {
                    blob.style.transition = 'left 0.3s ease, width 0.3s ease';
                    blob.style.left = retryPos.left + 'px';
                    blob.style.width = retryPos.width + 'px';
                }
            }, 50);
            return false;
        }
        
        blob.style.transition = 'left 0.3s ease, width 0.3s ease';
        blob.style.left = pos.left + 'px';
        blob.style.width = pos.width + 'px';
        
        return true;
    }
    
    function setInitialPosition() {
        const activeBtn = document.querySelector('.nav-item.active') || buttons[0];
        
        // Пробуем несколько раз с задержкой
        const trySet = (attempts = 0) => {
            const pos = getButtonPosition(activeBtn);
            if (pos) {
                blob.style.transition = 'none';
                blob.style.left = pos.left + 'px';
                blob.style.width = pos.width + 'px';
                blob.offsetHeight; // reflow
                console.log('📍 Начальная позиция установлена');
                return true;
            } else if (attempts < 5) {
                setTimeout(() => trySet(attempts + 1), 100);
            }
            return false;
        };
        
        trySet();
    }
    
    function init() {
        setInitialPosition();
        
        // Вешаем обработчики на кнопки
        buttons.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const tabId = this.getAttribute('data-nav');
                console.log('🖱️ Клик по:', tabId);
                
                document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                moveBlobToButton(this);
                
                if (typeof window.showPage === 'function') {
                    window.showPage(tabId);
                }
            });
        });
        
        buttons = document.querySelectorAll('.nav-item');
        
        // Ресайз с debounce
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
                    }
                }
                resizeTimer = null;
            }, 100);
        });
        
        console.log('✅ BLOB НАВИГАЦИЯ ГОТОВА!');
    }
    
    setTimeout(waitForElements, 200);
    
})();