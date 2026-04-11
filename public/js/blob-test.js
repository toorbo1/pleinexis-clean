// ТЕСТОВЫЙ СКРИПТ ДЛЯ ПРОВЕРКИ АНИМАЦИИ
(function() {
    console.log('🔥 ТЕСТОВЫЙ BLOB СКРИПТ ЗАПУЩЕН');
    
    const blob = document.getElementById('mainBlob');
    const container = document.getElementById('navContainer');
    const buttons = document.querySelectorAll('.nav-item');
    
    if (!blob) {
        console.error('❌ BLOB НЕ НАЙДЕН!');
        return;
    }
    if (!container) {
        console.error('❌ CONTAINER НЕ НАЙДЕН!');
        return;
    }
    
    console.log('✅ Blob найден:', blob);
    console.log('✅ Container найден:', container);
    console.log('✅ Кнопок:', buttons.length);
    
    // УСТАНАВЛИВАЕМ НАЧАЛЬНУЮ ПОЗИЦИЮ
    function setBlobPosition(tabId) {
        const btn = document.querySelector(`.nav-item[data-nav="${tabId}"]`);
        if (!btn) return;
        
        const containerRect = container.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        
        const left = btnRect.left - containerRect.left;
        const width = btnRect.width;
        
        console.log(`📍 Установка позиции для "${tabId}": left=${left}px, width=${width}px`);
        
        blob.style.transition = 'left 0.3s ease, width 0.3s ease';
        blob.style.left = left + 'px';
        blob.style.width = width + 'px';
    }
    
    // ВЕШАЕМ ОБРАБОТЧИКИ
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const tabId = this.getAttribute('data-nav');
            console.log('🖱️ КЛИК ПО:', tabId);
            
            // Убираем active у всех
            buttons.forEach(b => b.classList.remove('active'));
            // Добавляем active текущей
            this.classList.add('active');
            
            // ДВИГАЕМ КАПЛЮ
            setBlobPosition(tabId);
            
            // Переключаем страницу
            if (typeof window.showPage === 'function') {
                window.showPage(tabId);
            }
        });
    });
    
    // УСТАНАВЛИВАЕМ НАЧАЛЬНУЮ ПОЗИЦИЮ
    setTimeout(() => {
        setBlobPosition('home');
        console.log('✅ НАЧАЛЬНАЯ ПОЗИЦИЯ УСТАНОВЛЕНА');
    }, 100);
    
    // ОБРАБОТЧИК РЕСАЙЗА
    window.addEventListener('resize', () => {
        const activeBtn = document.querySelector('.nav-item.active');
        if (activeBtn) {
            const tabId = activeBtn.getAttribute('data-nav');
            setBlobPosition(tabId);
        }
    });
    
})();