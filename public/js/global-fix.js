// ============================================
// GLOBAL FIX - ПОЛНОСТЬЮ С СЕРВЕРОМ
// ============================================

(function() {
    console.log('🌍 GLOBAL FIX - загрузка...');

    // Глобальный массив товаров
    window.productsArray = [];

    // Вспомогательная функция для экранирования HTML
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    // Загрузка товаров с сервера
    window.loadProducts = async function() {
        console.log('🔄 Загрузка товаров с сервера...');
        try {
            const response = await fetch('/api/products');
            if (!response.ok) throw new Error('Ошибка загрузки товаров');
            const products = await response.json();
            window.productsArray = products;
            
            console.log('✅ Получено товаров:', products.length);
            
            // Отображаем товары на главной странице
            const grid = document.getElementById('productsGrid');
            if (grid) {
                if (products.length === 0) {
                    grid.innerHTML = '<div class="empty-state">Нет товаров</div>';
                } else {
                    grid.innerHTML = products.map(p => `
                        <div class="product-card" onclick="window.openProductDetailById('${p.id}')">
                            <div class="card-image">
                                <img src="${escapeHtml(p.image_url || 'https://picsum.photos/id/42/400/300')}" 
                                     onerror="this.src='https://picsum.photos/id/42/400/300'">
                                ${p.discount ? `<span class="discount-badge">🔥 ${escapeHtml(p.discount)}</span>` : ''}
                            </div>
                            <div class="card-body">
                                <div class="current-price">${escapeHtml(p.price)}</div>
                                <h3 class="product-title">${escapeHtml(p.title.substring(0, 50))}</h3>
                            </div>
                        </div>
                    `).join('');
                }
            }
            
            // Обновляем счетчик
            const countSpan = document.getElementById('productCountStat');
            if (countSpan) countSpan.innerText = products.length;
            
            return products;
        } catch(e) {
            console.error('loadProducts error:', e);
            return [];
        }
    };

    // Загрузка ключевых слов с сервера
    window.loadKeywordsGlobal = async function() {
        try {
            const response = await fetch('/api/keywords');
            if (!response.ok) throw new Error('Ошибка загрузки ключевых слов');
            const keywords = await response.json();
            window.keywords = keywords;
            
            console.log('✅ Получено ключевых слов:', keywords.length);
            
            // Обновляем все выпадающие списки
            const selects = ['postKeyword', 'productKeywordSelect', 'newGameKeyword', 'newAppKeyword'];
            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (select) {
                    select.innerHTML = '<option value="">Выберите категорию</option>';
                    keywords.forEach(k => {
                        select.innerHTML += `<option value="${escapeHtml(k.id)}">${escapeHtml(k.name)} - ${escapeHtml(k.type || 'Стандарт')}</option>`;
                    });
                }
            });
            
            return keywords;
        } catch(e) {
            console.error('loadKeywordsGlobal error:', e);
            return [];
        }
    };

    // Открытие деталей товара (через API, чтобы всегда свежие данные)
    window.openProductDetailById = async function(productId) {
        try {
            const response = await fetch(`/api/products/${productId}`);
            if (!response.ok) throw new Error('Товар не найден');
            const product = await response.json();
            
            alert(`📦 ${product.title}\n💰 ${product.price}\n👤 ${product.seller}\n\n${product.description || ''}`);
        } catch(e) {
            console.error(e);
            alert('Товар не найден');
        }
    };

    // Инициализация приложения
    async function init() {
        await window.loadKeywordsGlobal();
        await window.loadProducts();
        console.log('✅ Глобальная инициализация завершена');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();