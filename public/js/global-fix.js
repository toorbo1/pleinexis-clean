// global-fix.js - ВЕРСИЯ С ОТЛАДКОЙ

(function() {
    console.log('🌍 GLOBAL FIX - загрузка...');

    window.productsArray = [];

// Замените функцию loadProducts в global-fix.js на эту:

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
                grid.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>Нет товаров</p></div>';
            } else {
                grid.innerHTML = products.map(p => {
                    // Обработка скидки
                    let discountPercent = '';
                    let oldPriceHtml = '';
                    let currentPriceHtml = '';
                    let priceValue = p.price || '0 ₽';
                    
                    // Извлекаем числовое значение цены
                    const priceNum = parseFloat(String(priceValue).replace(/[^0-9.-]/g, ''));
                    
                    if (p.discount) {
                        if (String(p.discount).includes('%')) {
                            discountPercent = String(p.discount).replace('%', '');
                            // Вычисляем старую цену
                            const discountVal = parseFloat(discountPercent);
                            if (!isNaN(priceNum) && !isNaN(discountVal) && discountVal > 0) {
                                const oldPrice = priceNum / (1 - discountVal / 100);
                                oldPriceHtml = `<span class="old-price">${Math.round(oldPrice)} ₽</span>`;
                                currentPriceHtml = `<span class="current-price">${priceNum} ₽</span>`;
                            } else {
                                currentPriceHtml = `<span class="current-price">${priceValue}</span>`;
                            }
                        } else {
                            // Скидка в рублях
                            const discountNum = parseFloat(String(p.discount).replace(/[^0-9.-]/g, ''));
                            if (!isNaN(priceNum) && !isNaN(discountNum) && discountNum > 0) {
                                const oldPrice = priceNum + discountNum;
                                oldPriceHtml = `<span class="old-price">${Math.round(oldPrice)} ₽</span>`;
                                currentPriceHtml = `<span class="current-price">${priceNum} ₽</span>`;
                                discountPercent = Math.round((discountNum / oldPrice) * 100);
                            } else {
                                currentPriceHtml = `<span class="current-price">${priceValue}</span>`;
                            }
                        }
                    } else {
                        currentPriceHtml = `<span class="current-price no-discount">${priceValue}</span>`;
                    }
                    
                    // Рейтинг (случайный для демо, потом замените на реальный)
                    const rating = (p.rating || (3 + Math.random() * 2)).toFixed(1);
                    const reviewsCount = p.sales || Math.floor(Math.random() * 500) + 10;
                    
                    // Звёзды
                    const fullStars = Math.floor(rating);
                    const hasHalfStar = rating % 1 >= 0.5;
                    let starsHtml = '';
                    for (let i = 0; i < 5; i++) {
                        if (i < fullStars) {
                            starsHtml += '<i class="fas fa-star"></i>';
                        } else if (i === fullStars && hasHalfStar) {
                            starsHtml += '<i class="fas fa-star-half-alt"></i>';
                        } else {
                            starsHtml += '<i class="far fa-star"></i>';
                        }
                    }
                    
                    return `
                        <div class="product-card" onclick="window.openProductDetailById('${p.id}')">
                            <div class="card-image">
                                <img src="${p.image_url || 'https://picsum.photos/id/42/400/300'}" 
                                     onerror="this.src='https://picsum.photos/id/42/400/300'"
                                     loading="lazy"
                                     alt="${escapeHtml(p.title)}">
                                ${discountPercent ? `<span class="discount-badge">-${discountPercent}%</span>` : ''}
                            </div>
                            <div class="card-body">
                                <div class="price-wrapper">
                                    ${oldPriceHtml}
                                    ${currentPriceHtml}
                                </div>
                                <h3 class="product-title">${escapeHtml(p.title.substring(0, 60))}</h3>
                                <div class="rating">
                                    <div class="stars">${starsHtml}</div>
                                    <span class="rating-value">${rating}</span>
                                    <span class="reviews-count">(${reviewsCount} отзывов)</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
        return products;
    } catch(e) { 
        console.error('❌ loadProducts error:', e);
        return []; 
    }
};

window.renderHomeGameBlocks = async function() {
    const wrapper = document.getElementById('gamesScrollWrapper');
    if (!wrapper) {
        console.warn('gamesScrollWrapper не найден');
        return;
    }
    
    try {
        const res = await fetch('/api/game-blocks');
        const blocks = await res.json();
        
        wrapper.innerHTML = blocks.length ? `
            <div class="horizontal-scroll-container">
                ${blocks.map(b => `
                    <div class="vertical-card" onclick="openKeywordPage('${escapeHtml(b.name)}')">
                        <div class="vertical-card-inner">
                            <img class="vertical-card-img" src="${escapeHtml(b.image_url)}" 
                                 alt="${escapeHtml(b.name)}"
                                 onerror="this.src='https://picsum.photos/id/42/400/500'">
                            <div class="vertical-card-title">
                                <span>${escapeHtml(b.name)}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : '<div class="empty-state">Нет блоков игр</div>';
    } catch (e) {
        console.error('Ошибка загрузки игр:', e);
        wrapper.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
    }
};

window.renderHomeAppBlocks = async function() {
    const wrapper = document.getElementById('appsScrollWrapper');
    if (!wrapper) {
        console.warn('appsScrollWrapper не найден');
        return;
    }
    
    try {
        const res = await fetch('/api/app-blocks');
        const blocks = await res.json();
        
        wrapper.innerHTML = blocks.length ? `
            <div class="horizontal-scroll-container">
                ${blocks.map(b => `
                    <div class="vertical-card" onclick="openKeywordPage('${escapeHtml(b.name)}')">
                        <div class="vertical-card-inner">
                            <img class="vertical-card-img" src="${escapeHtml(b.image_url)}" 
                                 alt="${escapeHtml(b.name)}"
                                 onerror="this.src='https://picsum.photos/id/42/400/500'">
                            <div class="vertical-card-title">
                                <span>${escapeHtml(b.name)}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : '<div class="empty-state">Нет блоков приложений</div>';
    } catch (e) {
        console.error('Ошибка загрузки приложений:', e);
        wrapper.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
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
                container.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>Нет товаров в этой категории</p></div>';
            } else {
                container.innerHTML = filtered.map(p => {
                    // Обработка скидки (та же логика)
                    let discountPercent = '';
                    let oldPriceHtml = '';
                    let currentPriceHtml = '';
                    let priceValue = p.price || '0 ₽';
                    const priceNum = parseFloat(String(priceValue).replace(/[^0-9.-]/g, ''));
                    
                    if (p.discount) {
                        if (String(p.discount).includes('%')) {
                            discountPercent = String(p.discount).replace('%', '');
                            const discountVal = parseFloat(discountPercent);
                            if (!isNaN(priceNum) && !isNaN(discountVal) && discountVal > 0) {
                                const oldPrice = priceNum / (1 - discountVal / 100);
                                oldPriceHtml = `<span class="old-price">${Math.round(oldPrice)} ₽</span>`;
                                currentPriceHtml = `<span class="current-price">${priceNum} ₽</span>`;
                            } else {
                                currentPriceHtml = `<span class="current-price">${priceValue}</span>`;
                            }
                        } else {
                            const discountNum = parseFloat(String(p.discount).replace(/[^0-9.-]/g, ''));
                            if (!isNaN(priceNum) && !isNaN(discountNum) && discountNum > 0) {
                                const oldPrice = priceNum + discountNum;
                                oldPriceHtml = `<span class="old-price">${Math.round(oldPrice)} ₽</span>`;
                                currentPriceHtml = `<span class="current-price">${priceNum} ₽</span>`;
                                discountPercent = Math.round((discountNum / oldPrice) * 100);
                            } else {
                                currentPriceHtml = `<span class="current-price">${priceValue}</span>`;
                            }
                        }
                    } else {
                        currentPriceHtml = `<span class="current-price no-discount">${priceValue}</span>`;
                    }
                    
                    const rating = (p.rating || (3 + Math.random() * 2)).toFixed(1);
                    const reviewsCount = p.sales || Math.floor(Math.random() * 500) + 10;
                    
                    const fullStars = Math.floor(rating);
                    const hasHalfStar = rating % 1 >= 0.5;
                    let starsHtml = '';
                    for (let i = 0; i < 5; i++) {
                        if (i < fullStars) {
                            starsHtml += '<i class="fas fa-star"></i>';
                        } else if (i === fullStars && hasHalfStar) {
                            starsHtml += '<i class="fas fa-star-half-alt"></i>';
                        } else {
                            starsHtml += '<i class="far fa-star"></i>';
                        }
                    }
                    
                    return `
                        <div class="product-card" onclick="window.openProductDetailById('${p.id}')">
                            <div class="card-image">
                                <img src="${p.image_url || 'https://picsum.photos/id/42/400/300'}" 
                                     onerror="this.src='https://picsum.photos/id/42/400/300'"
                                     loading="lazy"
                                     alt="${escapeHtml(p.title)}">
                                ${discountPercent ? `<span class="discount-badge">-${discountPercent}%</span>` : ''}
                            </div>
                            <div class="card-body">
                                <div class="price-wrapper">
                                    ${oldPriceHtml}
                                    ${currentPriceHtml}
                                </div>
                                <h3 class="product-title">${escapeHtml(p.title.substring(0, 60))}</h3>
                                <div class="rating">
                                    <div class="stars">${starsHtml}</div>
                                    <span class="rating-value">${rating}</span>
                                    <span class="reviews-count">(${reviewsCount} отзывов)</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
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
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.renderHomeGameBlocks === 'function') {
        window.renderHomeGameBlocks();
        window.renderHomeAppBlocks();
    }
});