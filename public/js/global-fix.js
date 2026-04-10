// global-fix.js - ПОЛНАЯ СИНХРОНИЗАЦИЯ С СЕРВЕРОМ
(function() {
    console.log('🌍 GLOBAL FIX - загрузка...');

    // Загрузка товаров
    window.loadProducts = async function() {
        try {
            const products = await API.getProducts();
            window.productsArray = products;
            const grid = document.getElementById('productsGrid');
            if (grid) {
                if (!products.length) grid.innerHTML = '<div class="empty-state">Нет товаров</div>';
                else {
                    grid.innerHTML = products.map(p => `
                        <div class="product-card" onclick="window.openProductDetailById('${p.id}')">
                            <div class="card-image">
                                <img src="${escapeHtml(p.image_url || 'https://picsum.photos/id/42/400/300')}" onerror="this.src='https://picsum.photos/id/42/400/300'">
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
        } catch(e) { console.error(e); return []; }
    };

    // Загрузка игр (горизонтальные блоки)
    window.loadGameBlocks = async function() {
        try {
            const blocks = await API.getGameBlocks();
            const wrapper = document.getElementById('gamesScrollWrapper');
            if (wrapper) {
                if (!blocks.length) wrapper.innerHTML = '<div class="empty-state">Нет игр</div>';
                else {
                    wrapper.innerHTML = blocks.map(block => `
                        <div class="game-card" onclick="openKeywordPage('${escapeHtml(block.name)}')">
                            <div class="game-icon">
                                ${block.image_url ? `<img src="${escapeHtml(block.image_url)}">` : `<i class="${block.icon || 'fas fa-gamepad'}"></i>`}
                            </div>
                            <div class="game-name">${escapeHtml(block.name)}</div>
                        </div>
                    `).join('');
                }
            }
            return blocks;
        } catch(e) { console.error(e); return []; }
    };

    // Загрузка приложений (горизонтальные блоки)
    window.loadAppBlocks = async function() {
        try {
            const blocks = await API.getAppBlocks();
            const wrapper = document.getElementById('appsScrollWrapper');
            if (wrapper) {
                if (!blocks.length) wrapper.innerHTML = '<div class="empty-state">Нет приложений</div>';
                else {
                    wrapper.innerHTML = blocks.map(block => `
                        <div class="game-card" onclick="openKeywordPage('${escapeHtml(block.name)}')">
                            <div class="game-icon">
                                ${block.image_url ? `<img src="${escapeHtml(block.image_url)}">` : `<i class="${block.icon || 'fab fa-android'}"></i>`}
                            </div>
                            <div class="game-name">${escapeHtml(block.name)}</div>
                        </div>
                    `).join('');
                }
            }
            return blocks;
        } catch(e) { console.error(e); return []; }
    };

    window.openProductDetailById = async function(id) {
        try {
            const p = await API.getProduct(id);
            alert(`📦 ${p.title}\n💰 ${p.price}\n👤 ${p.seller}\n\n${p.description || ''}`);
        } catch(e) { alert('Товар не найден'); }
    };

    window.openKeywordPage = async function(keyword) {
        const products = await API.getProducts();
        const filtered = products.filter(p => p.keyword && p.keyword.toLowerCase().includes(keyword.toLowerCase()));
        const container = document.getElementById("keywordProductsGrid");
        const title = document.getElementById("keywordPageTitle");
        if (title) title.innerText = keyword;
        if (container) {
            if (!filtered.length) container.innerHTML = '<div class="empty-state">Нет товаров</div>';
            else {
                container.innerHTML = filtered.map(p => `
                    <div class="product-card" onclick="window.openProductDetailById('${p.id}')">
                        <div class="card-image"><img src="${p.image_url || 'https://picsum.photos/id/42/400/300'}" onerror="this.src='https://picsum.photos/id/42/400/300'"></div>
                        <div class="card-body"><div class="current-price">${escapeHtml(p.price)}</div><h3 class="product-title">${escapeHtml(p.title.substring(0,50))}</h3></div>
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
        await Promise.all([window.loadProducts(), window.loadGameBlocks(), window.loadAppBlocks()]);
        console.log('✅ Глобальная инициализация завершена');
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();