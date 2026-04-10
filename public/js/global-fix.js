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
                if (!products.length) {
                    grid.innerHTML = '<div class="empty-state">Нет товаров</div>';
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
                }
            }
            const countSpan = document.getElementById('productCountStat');
            if (countSpan) countSpan.innerText = products.length;
            return products;
        } catch(e) { 
            console.error('loadProducts error:', e); 
            return []; 
        }
    };

    // Загрузка игр - ГОРИЗОНТАЛЬНЫЙ СКРОЛЛ
    window.loadGameBlocks = async function() {
        try {
            const blocks = await API.getGameBlocks();
            const wrapper = document.getElementById('gamesScrollWrapper');
            if (wrapper) {
                if (!blocks.length) {
                    wrapper.innerHTML = '<div class="empty-state">Нет игр</div>';
                } else {
                    // Разделяем на два ряда для лучшего отображения
                    const mid = Math.ceil(blocks.length / 2);
                    const firstRow = blocks.slice(0, mid);
                    const secondRow = blocks.slice(mid);
                    
                    wrapper.innerHTML = `
                        <div class="games-row">
                            ${firstRow.map(block => `
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
                            `).join('')}
                        </div>
                        <div class="games-row-second">
                            ${secondRow.map(block => `
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
                            `).join('')}
                        </div>
                    `;
                }
            }
            return blocks;
        } catch(e) { 
            console.error('loadGameBlocks error:', e); 
            return []; 
        }
    };

    // Загрузка приложений - ГОРИЗОНТАЛЬНЫЙ СКРОЛЛ
    window.loadAppBlocks = async function() {
        try {
            const blocks = await API.getAppBlocks();
            const wrapper = document.getElementById('appsScrollWrapper');
            if (wrapper) {
                if (!blocks.length) {
                    wrapper.innerHTML = '<div class="empty-state">Нет приложений</div>';
                } else {
                    const mid = Math.ceil(blocks.length / 2);
                    const firstRow = blocks.slice(0, mid);
                    const secondRow = blocks.slice(mid);
                    
                    wrapper.innerHTML = `
                        <div class="games-row">
                            ${firstRow.map(block => `
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
                            `).join('')}
                        </div>
                        <div class="games-row-second">
                            ${secondRow.map(block => `
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
                            `).join('')}
                        </div>
                    `;
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