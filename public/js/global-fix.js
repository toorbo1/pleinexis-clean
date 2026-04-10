// global-fix.js - ПОЛНОСТЬЮ ПЕРЕРАБОТАННАЯ ВЕРСИЯ
// Блоки игр и приложений: вертикальные карточки 4:5, текст на фото, горизонтальный скролл

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

    // ========== ИГРЫ - ВЕРТИКАЛЬНЫЕ КАРТОЧКИ 4:5 ==========
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
                    // Горизонтальный скролл с карточками 4:5
                    wrapper.innerHTML = `
                        <div class="horizontal-scroll-container">
                            ${blocks.map(block => `
                                <div class="vertical-card" onclick="openKeywordPage('${escapeHtml(block.name)}')">
                                    <div class="vertical-card-inner">
                                        <img class="vertical-card-img" 
                                             src="${escapeHtml(block.image_url || 'https://picsum.photos/id/42/400/500')}" 
                                             alt="${escapeHtml(block.name)}"
                                             onerror="this.src='https://picsum.photos/id/42/400/500'">
                                        <div class="vertical-card-title">
                                            <span>${escapeHtml(block.name)}</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                    
                    // Добавляем обработчики скролла для кнопок
                    setupScrollButtons('games');
                }
            }
            window.gameBlocks = blocks;
            return blocks;
        } catch(e) { 
            console.error('loadGameBlocks error:', e); 
            return []; 
        }
    };

    // ========== ПРИЛОЖЕНИЯ - ВЕРТИКАЛЬНЫЕ КАРТОЧКИ 4:5 ==========
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
                    wrapper.innerHTML = `
                        <div class="horizontal-scroll-container">
                            ${blocks.map(block => `
                                <div class="vertical-card" onclick="openKeywordPage('${escapeHtml(block.name)}')">
                                    <div class="vertical-card-inner">
                                        <img class="vertical-card-img" 
                                             src="${escapeHtml(block.image_url || 'https://picsum.photos/id/42/400/500')}" 
                                             alt="${escapeHtml(block.name)}"
                                             onerror="this.src='https://picsum.photos/id/42/400/500'">
                                        <div class="vertical-card-title">
                                            <span>${escapeHtml(block.name)}</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                    
                    setupScrollButtons('apps');
                }
            }
            window.appBlocks = blocks;
            return blocks;
        } catch(e) { 
            console.error('loadAppBlocks error:', e); 
            return []; 
        }
    };
    
    // Настройка кнопок скролла
    function setupScrollButtons(type) {
        setTimeout(() => {
            const container = document.getElementById(`${type}ScrollContainer`);
            const leftBtn = document.querySelector(`#${type}ScrollContainer + .scroll-buttons .scroll-left, .games-header:has(+ #${type}ScrollContainer) .scroll-btn:first-child`);
            const rightBtn = document.querySelector(`#${type}ScrollContainer + .scroll-buttons .scroll-right, .games-header:has(+ #${type}ScrollContainer) .scroll-btn:last-child`);
            
            // Ищем кнопки в games-header
            const header = document.querySelector(`.games-header:has(+ #${type}ScrollContainer)`);
            if (header) {
                const btns = header.querySelectorAll('.scroll-btn');
                if (btns[0] && !btns[0].hasAttribute('data-scroll-attached')) {
                    btns[0].setAttribute('data-scroll-attached', 'true');
                    btns[0].onclick = () => scrollHorizontal(container, 'left');
                    if (btns[1]) {
                        btns[1].setAttribute('data-scroll-attached', 'true');
                        btns[1].onclick = () => scrollHorizontal(container, 'right');
                    }
                }
            }
        }, 50);
    }
    
    function scrollHorizontal(container, direction) {
        if (!container) return;
        const scrollAmount = 280;
        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    }

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