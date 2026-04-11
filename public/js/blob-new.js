// ========== ПРОСТАЯ АНИМАЦИЯ КАПЛИ ==========
(function() {
    console.log('💧 ЗАПУСК НОВОГО СКРИПТА КАПЛИ');
    
    const blob = document.getElementById('mainBlob');
    const container = document.getElementById('navContainer');
    const buttons = document.querySelectorAll('.nav-item');
    
    if (!blob || !container) {
        console.error('❌ Элементы не найдены!');
        return;
    }
    
    console.log('✅ Blob:', blob);
    console.log('✅ Container:', container);
    console.log('✅ Buttons:', buttons.length);
    
    // Функция перемещения капли
    function moveBlob(btn) {
        const containerRect = container.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        
        const left = btnRect.left - containerRect.left;
        const width = btnRect.width;
        
        console.log(`📐 Перемещение: left=${left}px, width=${width}px`);
        
        // Устанавливаем transition
        blob.style.transition = 'left 0.35s cubic-bezier(0.2, 0.9, 0.4, 1.1), width 0.35s cubic-bezier(0.2, 0.9, 0.4, 1.1)';
        
        // Двигаем
        blob.style.left = left + 'px';
        blob.style.width = width + 'px';
    }
    
    // Инициализация
    function init() {
        // Находим активную кнопку
        const activeBtn = document.querySelector('.nav-item.active') || buttons[0];
        
        // Устанавливаем начальную позицию БЕЗ анимации
        const containerRect = container.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();
        
        blob.style.transition = 'none';
        blob.style.left = (btnRect.left - containerRect.left) + 'px';
        blob.style.width = btnRect.width + 'px';
        
        console.log('📍 Начальная позиция установлена');
        
        // Вешаем обработчики на кнопки
        buttons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                const tabId = this.getAttribute('data-nav');
                console.log('🖱️ Клик:', tabId);
                
                // Меняем активный класс
                buttons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Двигаем каплю
                moveBlob(this);
                
                // Переключаем страницу
                if (typeof window.showPage === 'function') {
                    window.showPage(tabId);
                }
            });
        });
        
        // Ресайз
        window.addEventListener('resize', () => {
            const currentActive = document.querySelector('.nav-item.active');
            if (currentActive) {
                const rect = currentActive.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                
                blob.style.transition = 'none';
                blob.style.left = (rect.left - containerRect.left) + 'px';
                blob.style.width = rect.width + 'px';
            }
        });
    }
    
    // Запускаем с небольшой задержкой
    setTimeout(init, 100);
    
})();