// global-fix.js - ИСПРАВЛЕННАЯ ВЕРСИЯ С ОТЛАДКОЙ

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
            
            const countSpan = document.getElementById('productCountStat');
            if (countSpan) countSpan.innerText = products.length;
            
            return products;
        } catch(e) { 
            console.error('❌ loadProducts error:', e);
            return []; 
        }
    };

    // ========== ИГРЫ ==========
    window.loadGameBlocks = async function() {
        console.log('🔄 loadGameBlocks: запрос к API...');
        try {
            const response = await fetch('/api/game-blocks?_=' + Date.now());
            if (!response.ok) throw new Error('Ошибка загрузки игр');
            let blocks = await response.json();
            console.log(`✅ Загружено ${blocks.length} блоков игр`);
            console.log('📋 Данные блоков игр:', blocks);
            
            const wrapper = document.getElementById('gamesScrollWrapper');
            console.log('🔍 gamesScrollWrapper найден:', !!wrapper);
            
            if (wrapper) {
                if (!blocks.length) {
                    wrapper.innerHTML = '<div class="empty-state">Нет игр</div>';
                    console.log('⚠️ Нет блоков игр');
                } else {
                    // Проверяем, есть ли у блоков image_url
                    const blocksWithImage = blocks.filter(b => b.image_url);
                    console.log(`📸 Блоков с фото: ${blocksWithImage.length} из ${blocks.length}`);
                    
                    if (blocksWithImage.length === 0) {
                        wrapper.innerHTML = '<div class="empty-state">⚠️ У блоков игр нет фото! Добавьте URL фото в админ-панели.</div>';
                    } else {
                        wrapper.innerHTML = `
                            <div class="horizontal-scroll-container">
                                ${blocks.map(block => {
                                    // Используем заглушку если нет фото
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
                    }
                }
            } else {
                console.error('❌ gamesScrollWrapper НЕ НАЙДЕН в DOM!');
            }
            
            window.gameBlocks = blocks;
            return blocks;
        } catch(e) { 
            console.error('loadGameBlocks error:', e); 
            return []; 
        }
    };

    // ========== ПРИЛОЖЕНИЯ ==========
    window.loadAppBlocks = async function() {
        console.log('🔄 loadAppBlocks: запрос к API...');
        try {
            const response = await fetch('/api/app-blocks?_=' + Date.now());
            if (!response.ok) throw new Error('Ошибка загрузки приложений');
            let blocks = await response.json();
            console.log(`✅ Загружено ${blocks.length} блоков приложений`);
            console.log('📋 Данные блоков приложений:', blocks);
            
            const wrapper = document.getElementById('appsScrollWrapper');
            console.log('🔍 appsScrollWrapper найден:', !!wrapper);
            
            if (wrapper) {
                if (!blocks.length) {
                    wrapper.innerHTML = '<div class="empty-state">Нет приложений</div>';
                    console.log('⚠️ Нет блоков приложений');
                } else {
                    const blocksWithImage = blocks.filter(b => b.image_url);
                    console.log(`📸 Блоков с фото: ${blocksWithImage.length} из ${blocks.length}`);
                    
                    if (blocksWithImage.length === 0) {
                        wrapper.innerHTML = '<div class="empty-state">⚠️ У блоков приложений нет фото! Добавьте URL фото в админ-панели.</div>';
                    } else {
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
                    }
                }
            } else {
                console.error('❌ appsScrollWrapper НЕ НАЙДЕН в DOM!');
            }
            
            window.appBlocks = blocks;
            return blocks;
        } catch(e) { 
            console.error('loadAppBlocks error:', e); 
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
        
        try {
            const testResponse = await fetch('/api/test');
            const testData = await testResponse.json();
            console.log('✅ API test:', testData);
        } catch(e) {
            console.error('❌ API недоступен:', e);
        }
        
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