// global-fix.js - ВЕРСИЯ С ОТЛАДКОЙ

(function() {
    console.log('🌍 GLOBAL FIX - загрузка...');

    window.productsArray = [];

    window.loadProducts = async function() {
        console.log('🔄 loadProducts: запрос к API...');
        try {
            const response = await fetch('/api/products?_=' + Date.now());
            if (!response.ok) throw new Error('Ошибка загрузки товаров');
            const products = await response.json();
            window.productsArray = products;
            console.log(`✅ Загружено ${products.length} товаров`);
            
            const grid = document.getElementById('productsGrid');
            if (grid) {
                if (!products.length) {
                    grid.innerHTML = '<div class="empty-state">Нет товаров</div>';
                } else {
                    grid.innerHTML = products.map(p => `
                        <div class="product-card" onclick="window.openProductDetailById('${p.id}')">
                            <div class="card-image">
                                <img src="${p.image_url || 'https://picsum.photos/id/42/400/300'}" 
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
                }
            }
            return products;
        } catch(e) { 
            console.error('❌ loadProducts error:', e);
            return []; 
        }
    };

    window.loadGameBlocks = async function() {
        console.log('🔄 loadGameBlocks: запрос к API...');
        
        const wrapper = document.getElementById('gamesScrollWrapper');
        console.log('🔍 gamesScrollWrapper найден:', wrapper ? 'ДА' : 'НЕТ');
        
        if (!wrapper) {
            console.error('❌ gamesScrollWrapper НЕ СУЩЕСТВУЕТ!');
            return [];
        }
        
        try {
            const response = await fetch('/api/game-blocks?_=' + Date.now());
            if (!response.ok) throw new Error('Ошибка загрузки игр');
            let blocks = await response.json();
            console.log(`✅ Загружено ${blocks.length} блоков игр с сервера:`, blocks);
            
            if (!blocks.length) {
                wrapper.innerHTML = '<div class="empty-state">⚠️ Нет блоков игр. Добавьте через админ-панель!</div>';
                return [];
            }
            
            // Фильтруем блоки без фото
            const validBlocks = blocks.filter(b => b.image_url);
            console.log(`📸 Блоков с фото: ${validBlocks.length} из ${blocks.length}`);
            
            if (validBlocks.length === 0) {
                wrapper.innerHTML = '<div class="empty-state">⚠️ У блоков игр нет фото! Добавьте URL фото в админ-панели.</div>';
                return blocks;
            }
            
            wrapper.innerHTML = `
                <div class="horizontal-scroll-container">
                    ${blocks.map(block => {
                        const imgUrl = block.image_url || 'https://picsum.photos/id/42/400/500';
                        return `
                            <div class="vertical-card" onclick="openKeywordPage('${escapeHtml(block.name)}')">
                                <div class="vertical-card-inner">
                                    <img class="vertical-card-img" 
                                         src="${escapeHtml(imgUrl)}" 
                                         alt="${escapeHtml(block.name)}"
                                         onerror="this.src='https://picsum.photos/id/42/400/500'">
                                    <div class="vertical-card-title">
                                        <span>${escapeHtml(block.name)}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            console.log('✅ Блоки игр отображены');
            return blocks;
        } catch(e) { 
            console.error('loadGameBlocks error:', e);
            wrapper.innerHTML = '<div class="empty-state">❌ Ошибка загрузки игр</div>';
            return []; 
        }
    };

    window.loadAppBlocks = async function() {
        console.log('🔄 loadAppBlocks: запрос к API...');
        
        const wrapper = document.getElementById('appsScrollWrapper');
        console.log('🔍 appsScrollWrapper найден:', wrapper ? 'ДА' : 'НЕТ');
        
        if (!wrapper) {
            console.error('❌ appsScrollWrapper НЕ СУЩЕСТВУЕТ!');
            return [];
        }
        
        try {
            const response = await fetch('/api/app-blocks?_=' + Date.now());
            if (!response.ok) throw new Error('Ошибка загрузки приложений');
            let blocks = await response.json();
            console.log(`✅ Загружено ${blocks.length} блоков приложений с сервера:`, blocks);
            
            if (!blocks.length) {
                wrapper.innerHTML = '<div class="empty-state">⚠️ Нет блоков приложений. Добавьте через админ-панель!</div>';
                return [];
            }
            
            const validBlocks = blocks.filter(b => b.image_url);
            console.log(`📸 Блоков с фото: ${validBlocks.length} из ${blocks.length}`);
            
            if (validBlocks.length === 0) {
                wrapper.innerHTML = '<div class="empty-state">⚠️ У блоков приложений нет фото! Добавьте URL фото в админ-панели.</div>';
                return blocks;
            }
            
            wrapper.innerHTML = `
                <div class="horizontal-scroll-container">
                    ${blocks.map(block => {
                        const imgUrl = block.image_url || 'https://picsum.photos/id/42/400/500';
                        return `
                            <div class="vertical-card" onclick="openKeywordPage('${escapeHtml(block.name)}')">
                                <div class="vertical-card-inner">
                                    <img class="vertical-card-img" 
                                         src="${escapeHtml(imgUrl)}" 
                                         alt="${escapeHtml(block.name)}"
                                         onerror="this.src='https://picsum.photos/id/42/400/500'">
                                    <div class="vertical-card-title">
                                        <span>${escapeHtml(block.name)}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            console.log('✅ Блоки приложений отображены');
            return blocks;
        } catch(e) { 
            console.error('loadAppBlocks error:', e);
            wrapper.innerHTML = '<div class="empty-state">❌ Ошибка загрузки приложений</div>';
            return []; 
        }
    };

    window.openKeywordPage = async function(keyword) {
        console.log('🔍 Открываем категорию:', keyword);
        try {
            const response = await fetch('/api/products?_=' + Date.now());
            const products = await response.json();
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
            else if (typeof window.showPage === 'function') window.showPage("keywordPage");
        } catch(e) {
            console.error('openKeywordPage error:', e);
        }
    };

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
    }

    async function init() {
        console.log('🚀 GLOBAL FIX инициализация...');
        
        await window.loadProducts();
        await window.loadGameBlocks();
        await window.loadAppBlocks();
        
        console.log('✅ Глобальная инициализация завершена');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }
})();