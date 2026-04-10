// ============================================
// GLOBAL FIX - ЗАГРУЗКА ДАННЫХ С СЕРВЕРА
// ============================================

(function() {
    console.log('🌍 GLOBAL FIX - загрузка...');

    window.productsArray = [];

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
            const products = await API.getProducts();
            window.productsArray = products;
            
            console.log('✅ Получено товаров:', products.length);
            
            // Отображаем товары на главной
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

    // Загрузка блоков игр с сервера
    window.loadGameBlocks = async function() {
        try {
            const blocks = await API.getGameBlocks();
            const wrapper = document.getElementById('gamesScrollWrapper');
            if (wrapper && blocks.length > 0) {
                wrapper.innerHTML = blocks.map(block => `
                    <div class="game-card" onclick="openKeywordPage('${escapeHtml(block.name)}')">
                        <div class="game-icon">
                            ${block.image_url ? 
                                `<img src="${escapeHtml(block.image_url)}" alt="${escapeHtml(block.name)}">` : 
                                `<i class="${block.icon || 'fas fa-gamepad'}"></i>`
                            }
                        </div>
                        <div class="game-name">${escapeHtml(block.name)}</div>
                    </div>
                `).join('');
            }
            return blocks;
        } catch(e) {
            console.error('loadGameBlocks error:', e);
            return [];
        }
    };

    // Загрузка блоков приложений с сервера
    window.loadAppBlocks = async function() {
        try {
            const blocks = await API.getAppBlocks();
            const wrapper = document.getElementById('appsScrollWrapper');
            if (wrapper && blocks.length > 0) {
                wrapper.innerHTML = blocks.map(block => `
                    <div class="game-card" onclick="openKeywordPage('${escapeHtml(block.name)}')">
                        <div class="game-icon">
                            ${block.image_url ? 
                                `<img src="${escapeHtml(block.image_url)}" alt="${escapeHtml(block.name)}">` : 
                                `<i class="${block.icon || 'fab fa-android'}"></i>`
                            }
                        </div>
                        <div class="game-name">${escapeHtml(block.name)}</div>
                    </div>
                `).join('');
            }
            return blocks;
        } catch(e) {
            console.error('loadAppBlocks error:', e);
            return [];
        }
    };

    // Открытие деталей товара
    window.openProductDetailById = async function(productId) {
        try {
            const product = await API.getProduct(productId);
            alert(`📦 ${product.title}\n💰 ${product.price}\n👤 ${product.seller}\n\n${product.description || ''}`);
        } catch(e) {
            console.error(e);
            alert('Товар не найден');
        }
    };

    // Функция для поиска по ключевому слову
    window.openKeywordPage = async function(keyword) {
        const products = await API.getProducts();
        const filteredProducts = products.filter(p => 
            p.keyword && p.keyword.toLowerCase().includes(keyword.toLowerCase())
        );
        
        const container = document.getElementById("keywordProductsGrid");
        const title = document.getElementById("keywordPageTitle");
        
        if (title) title.innerText = keyword;
        
        if (container) {
            if (filteredProducts.length === 0) {
                container.innerHTML = "<div class='empty-state'><i class='fas fa-box-open'></i><p>Нет товаров по этой категории</p></div>";
            } else {
                container.innerHTML = filteredProducts.map(prod => `
                    <div class="product-card" onclick="window.openProductDetailById('${prod.id}')">
                        <div class="card-image">
                            <img src="${escapeHtml(prod.image_url || 'https://picsum.photos/id/42/400/300')}" 
                                 onerror="this.src='https://picsum.photos/id/42/400/300'">
                        </div>
                        <div class="card-body">
                            <div class="current-price">${escapeHtml(prod.price)}</div>
                            <h3 class="product-title">${escapeHtml(prod.title.substring(0, 50))}</h3>
                        </div>
                    </div>
                `).join('');
            }
        }
        
        if (typeof showPage === 'function') {
            showPage("keywordPage");
        }
    };

    // Инициализация
    async function init() {
        await Promise.all([
            window.loadProducts(),
            window.loadGameBlocks(),
            window.loadAppBlocks()
        ]);
        console.log('✅ Глобальная инициализация завершена');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();