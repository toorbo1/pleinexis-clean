// global-fix.js - ИСПРАВЛЕННАЯ ВЕРСИЯ (игры в 2 строки, приложения восстановлены)

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

    // ========== ИГРЫ - В 2 СТРОКИ ==========
    window.loadGameBlocks = async function() {
        console.log('🔄 loadGameBlocks: запрос к API...');
        try {
            const response = await fetch('/api/game-blocks?_=' + Date.now());
            if (!response.ok) throw new Error('Ошибка загрузки игр');
            let blocks = await response.json();
            console.log(`✅ Загружено ${blocks.length} блоков игр`);
            
            const wrapper = document.getElementById('gamesScrollWrapper');
            if (wrapper) {
                if (!blocks.length) {
                    wrapper.innerHTML = '<div class="empty-state">Нет игр</div>';
                } else {
                    // Разделяем на две строки
                    const midIndex = Math.ceil(blocks.length / 2);
                    const firstRow = blocks.slice(0, midIndex);
                    const secondRow = blocks.slice(midIndex);
                    
                    wrapper.innerHTML = `
                        <div class="games-row">
                            ${firstRow.map(block => `
                                <div class="game-card" onclick="openKeywordPage('${escapeHtml(block.name)}')">
                                    <div class="game-icon">
                                        ${block.image_url ? 
                                            `<img src="${escapeHtml(block.image_url)}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 16px;" 
                                                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                                             <i class="${block.icon || 'fas fa-gamepad'}" style="display: none; font-size: 32px;"></i>` : 
                                            `<i class="${block.icon || 'fas fa-gamepad'}" style="font-size: 32px;"></i>`
                                        }
                                    </div>
                                    <div class="game-name">${escapeHtml(block.name)}</div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="games-row-second">
                            ${secondRow.map(block => `
                                <div class="game-card" onclick="openKeywordPage('${escapeHtml(block.name)}')">
                                    <div class="game-icon">
                                        ${block.image_url ? 
                                            `<img src="${escapeHtml(block.image_url)}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 16px;" 
                                                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                                             <i class="${block.icon || 'fas fa-gamepad'}" style="display: none; font-size: 32px;"></i>` : 
                                            `<i class="${block.icon || 'fas fa-gamepad'}" style="font-size: 32px;"></i>`
                                        }
                                    </div>
                                    <div class="game-name">${escapeHtml(block.name)}</div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                    console.log('✅ Блоки игр отображены в 2 строки');
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

    // ========== ПРИЛОЖЕНИЯ - В 2 СТРОКИ ==========
    window.loadAppBlocks = async function() {
        console.log('🔄 loadAppBlocks: запрос к API...');
        try {
            const response = await fetch('/api/app-blocks?_=' + Date.now());
            if (!response.ok) throw new Error('Ошибка загрузки приложений');
            let blocks = await response.json();
            console.log(`✅ Загружено ${blocks.length} блоков приложений`);
            
            const wrapper = document.getElementById('appsScrollWrapper');
            if (wrapper) {
                if (!blocks.length) {
                    wrapper.innerHTML = '<div class="empty-state">Нет приложений</div>';
                } else {
                    // Разделяем на две строки
                    const midIndex = Math.ceil(blocks.length / 2);
                    const firstRow = blocks.slice(0, midIndex);
                    const secondRow = blocks.slice(midIndex);
                    
                    wrapper.innerHTML = `
                        <div class="games-row">
                            ${firstRow.map(block => `
                                <div class="game-card" onclick="openKeywordPage('${escapeHtml(block.name)}')">
                                    <div class="game-icon">
                                        ${block.image_url ? 
                                            `<img src="${escapeHtml(block.image_url)}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 16px;"
                                                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                                             <i class="${block.icon || 'fab fa-android'}" style="display: none; font-size: 32px;"></i>` : 
                                            `<i class="${block.icon || 'fab fa-android'}" style="font-size: 32px;"></i>`
                                        }
                                    </div>
                                    <div class="game-name">${escapeHtml(block.name)}</div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="games-row-second">
                            ${secondRow.map(block => `
                                <div class="game-card" onclick="openKeywordPage('${escapeHtml(block.name)}')">
                                    <div class="game-icon">
                                        ${block.image_url ? 
                                            `<img src="${escapeHtml(block.image_url)}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 16px;"
                                                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                                             <i class="${block.icon || 'fab fa-android'}" style="display: none; font-size: 32px;"></i>` : 
                                            `<i class="${block.icon || 'fab fa-android'}" style="font-size: 32px;"></i>`
                                        }
                                    </div>
                                    <div class="game-name">${escapeHtml(block.name)}</div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                    console.log('✅ Блоки приложений отображены в 2 строки');
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
        
        // Проверяем API
        try {
            const testResponse = await fetch('/api/test');
            const testData = await testResponse.json();
            console.log('✅ API test:', testData);
        } catch(e) {
            console.error('❌ API недоступен:', e);
            return;
        }
        
        // Загружаем данные
        await window.loadProducts();
        await window.loadGameBlocks();
        await window.loadAppBlocks();
        
        console.log('✅ Глобальная инициализация завершена');
    }
    
    // Запускаем после полной загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }
})();