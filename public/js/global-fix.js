// global-fix.js - ПОЛНАЯ СИНХРОНИЗАЦИЯ С СЕРВЕРОМ
(function() {
    console.log('🌍 GLOBAL FIX - загрузка...');

    // Загрузка товаров - ПРЯМО ИЗ API
    window.loadProducts = async function() {
        try {
            console.log('🔄 loadProducts: запрос к API...');
            const products = await API.getProducts();
            window.productsArray = products;
            
            // Сохраняем в localStorage как резервную копию
            localStorage.setItem('apex_products_backup', JSON.stringify(products));
            
            const grid = document.getElementById('productsGrid');
            if (grid) {
                if (!products.length) {
                    grid.innerHTML = '<div class="empty-state">Нет товаров</div>';
                    console.log('⚠️ Товаров не найдено');
                } else {
                    grid.innerHTML = products.map(p => `
                        <div class="product-card" onclick="window.openProductDetailById('${p.id}')">
                            <div class="card-image">
                                <img src="${escapeHtml(p.image_url || 'https://picsum.photos/id/42/400/300')}" 
                                     onerror="this.src='https://picsum.photos/id/42/400/300'"
                                     loading="lazy">
                                ${p.discount ? `<span class="discount-badge">🔥 ${escapeHtml(p.discount)}</span>` : ''}
                            </div>
                            <div class="card-body">
                                <div class="current-price">${escapeHtml(p.price)}</div>
                                <h3 class="product-title">${escapeHtml(p.title.substring(0, 50))}</h3>
                            </div>
                        </div>
                    `).join('');
                    console.log(`✅ Отображено ${products.length} товаров`);
                }
            }
            
            const countSpan = document.getElementById('productCountStat');
            if (countSpan) countSpan.innerText = products.length;
            
            return products;
        } catch(e) { 
            console.error('❌ loadProducts error:', e);
            // Fallback на резервную копию
            const backup = localStorage.getItem('apex_products_backup');
            if (backup) {
                const products = JSON.parse(backup);
                window.productsArray = products;
                const grid = document.getElementById('productsGrid');
                if (grid && products.length) {
                    grid.innerHTML = products.map(p => `
                        <div class="product-card" onclick="window.openProductDetailById('${p.id}')">
                            <div class="card-image">
                                <img src="${escapeHtml(p.image_url || 'https://picsum.photos/id/42/400/300')}" 
                                     onerror="this.src='https://picsum.photos/id/42/400/300'">
                            </div>
                            <div class="card-body">
                                <div class="current-price">${escapeHtml(p.price)}</div>
                                <h3 class="product-title">${escapeHtml(p.title.substring(0, 50))}</h3>
                            </div>
                        </div>
                    `).join('');
                }
            }
            return []; 
        }
    };

    // Загрузка игр
    window.loadGameBlocks = async function() {
        try {
            const blocks = await API.getGameBlocks();
            const wrapper = document.getElementById('gamesScrollWrapper');
            if (wrapper) {
                if (!blocks.length) {
                    wrapper.innerHTML = '<div class="empty-state">Нет игр</div>';
                } else {
                    wrapper.innerHTML = blocks.map(block => `
                        <div class="game-card" onclick="openKeywordPage('${escapeHtml(block.name)}')">
                            <div class="game-icon">
                                ${block.image_url ? 
                                    `<img src="${escapeHtml(block.image_url)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                                     <i class="${block.icon || 'fas fa-gamepad'}" style="display: none;"></i>` : 
                                    `<i class="${block.icon || 'fas fa-gamepad'}"></i>`
                                }
                            </div>
                            <div class="game-name">${escapeHtml(block.name)}</div>
                        </div>
                    `).join('');
                }
            }
            return blocks;
        } catch(e) { 
            console.error('loadGameBlocks error:', e); 
            return []; 
        }
    };

    // Загрузка приложений
    window.loadAppBlocks = async function() {
        try {
            const blocks = await API.getAppBlocks();
            const wrapper = document.getElementById('appsScrollWrapper');
            if (wrapper) {
                if (!blocks.length) {
                    wrapper.innerHTML = '<div class="empty-state">Нет приложений</div>';
                } else {
                    wrapper.innerHTML = blocks.map(block => `
                        <div class="game-card" onclick="openKeywordPage('${escapeHtml(block.name)}')">
                            <div class="game-icon">
                                ${block.image_url ? 
                                    `<img src="${escapeHtml(block.image_url)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                                     <i class="${block.icon || 'fab fa-android'}" style="display: none;"></i>` : 
                                    `<i class="${block.icon || 'fab fa-android'}"></i>`
                                }
                            </div>
                            <div class="game-name">${escapeHtml(block.name)}</div>
                        </div>
                    `).join('');
                }
            }
            return blocks;
        } catch(e) { 
            console.error('loadAppBlocks error:', e); 
            return []; 
        }
    };

    // Открытие деталей товара
    window.openProductDetailById = async function(id) {
        try {
            const p = await API.getProduct(id);
            if (!p) {
                alert('Товар не найден');
                return;
            }
            alert(`📦 ${p.title}\n💰 ${p.price}\n👤 ${p.seller}\n\n${p.description || 'Нет описания'}`);
        } catch(e) { 
            alert('Товар не найден'); 
        }
    };

    // Открытие страницы по ключевому слову
    window.openKeywordPage = async function(keyword) {
        const products = await API.getProducts();
        const filtered = products.filter(p => p.keyword && p.keyword.toLowerCase().includes(keyword.toLowerCase()));
        const container = document.getElementById("keywordProductsGrid");
        const title = document.getElementById("keywordPageTitle");
        if (title) title.innerText = keyword;
        if (container) {
            if (!filtered.length) {
                container.innerHTML = '<div class="empty-state">Нет товаров</div>';
            } else {
                container.innerHTML = filtered.map(p => `
                    <div class="product-card" onclick="window.openProductDetailById('${p.id}')">
                        <div class="card-image">
                            <img src="${p.image_url || 'https://picsum.photos/id/42/400/300'}" 
                                 onerror="this.src='https://picsum.photos/id/42/400/300'">
                        </div>
                        <div class="card-body">
                            <div class="current-price">${escapeHtml(p.price)}</div>
                            <h3 class="product-title">${escapeHtml(p.title.substring(0, 50))}</h3>
                        </div>
                    </div>
                `).join('');
            }
        }
        if (typeof showPage === 'function') showPage("keywordPage");
    };

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m] || m));
    }

    async function init() {
        console.log('🚀 GLOBAL FIX инициализация...');
        
        // Проверяем соединение с API
        try {
            const test = await API.test();
            console.log('✅ API соединение:', test);
        } catch(e) {
            console.error('❌ API недоступен:', e);
        }
        
        // Загружаем все данные
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