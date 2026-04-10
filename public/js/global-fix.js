// global-fix.js - ПОЛНАЯ СИНХРОНИЗАЦИЯ С СЕРВЕРОМ
(function() {
    console.log('🌍 GLOBAL FIX - загрузка...');

    // Глобальная переменная для товаров
    window.productsArray = [];

    // ЗАГРУЗКА ТОВАРОВ С СЕРВЕРА (без кеша)
    window.loadProducts = async function() {
        console.log('🔄 loadProducts: запрос к API...');
        try {
            const response = await fetch('/api/products?_=' + Date.now());
            if (!response.ok) throw new Error('Ошибка загрузки товаров');
            const products = await response.json();
            window.productsArray = products;
            console.log(`✅ Загружено ${products.length} товаров с сервера`);
            
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

    // ЗАГРУЗКА ИГР С СЕРВЕРА (БЕЗ КЕША)
    window.loadGameBlocks = async function() {
        console.log('🔄 loadGameBlocks: запрос к API...');
        try {
            const response = await fetch('/api/game-blocks?_=' + Date.now());
            if (!response.ok) throw new Error('Ошибка загрузки игр');
            const blocks = await response.json();
            console.log(`✅ Загружено ${blocks.length} блоков игр`);
            
            const wrapper = document.getElementById('gamesScrollWrapper');
            if (wrapper) {
                if (!blocks.length) {
                    wrapper.innerHTML = '<div class="empty-state">Нет игр</div>';
                } else {
                    const midIndex = Math.ceil(blocks.length / 2);
                    const firstRow = blocks.slice(0, midIndex);
                    const secondRow = blocks.slice(midIndex);
                    
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
            
            // Сохраняем в глобальную переменную для других функций
            window.gameBlocks = blocks;
            return blocks;
        } catch(e) { 
            console.error('loadGameBlocks error:', e); 
            return []; 
        }
    };

    // ЗАГРУЗКА ПРИЛОЖЕНИЙ С СЕРВЕРА (БЕЗ КЕША)
    window.loadAppBlocks = async function() {
        console.log('🔄 loadAppBlocks: запрос к API...');
        try {
            const response = await fetch('/api/app-blocks?_=' + Date.now());
            if (!response.ok) throw new Error('Ошибка загрузки приложений');
            const blocks = await response.json();
            console.log(`✅ Загружено ${blocks.length} блоков приложений`);
            
            const wrapper = document.getElementById('appsScrollWrapper');
            if (wrapper) {
                if (!blocks.length) {
                    wrapper.innerHTML = '<div class="empty-state">Нет приложений</div>';
                } else {
                    const midIndex = Math.ceil(blocks.length / 2);
                    const firstRow = blocks.slice(0, midIndex);
                    const secondRow = blocks.slice(midIndex);
                    
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
            
            // Сохраняем в глобальную переменную для других функций
            window.appBlocks = blocks;
            return blocks;
        } catch(e) { 
            console.error('loadAppBlocks error:', e); 
            return []; 
        }
    };

    // // ОТКРЫТИЕ ДЕТАЛЕЙ ТОВАРА
    // window.openProductDetailById = async function(id) {
    //     console.log('🔍 Открываем товар:', id);
    //     try {
    //         const response = await fetch(`/api/products/${id}`);
    //         if (!response.ok) throw new Error('Товар не найден');
    //         const p = await response.json();
    //         alert(`📦 ${p.title}\n💰 ${p.price}\n👤 ${p.seller}\n\n📝 ${p.description || 'Нет описания'}`);
    //     } catch(e) { 
    //         alert('Товар не найден'); 
    //     }
    // };

    // ОТКРЫТИЕ СТРАНИЦЫ ПО КЛЮЧЕВОМУ СЛОВУ
    window.openKeywordPage = async function(keyword) {
        console.log('🔍 Открываем категорию:', keyword);
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
    };

    // ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ ДЛЯ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ
    window.refreshAllUsersData = function() {
        localStorage.setItem('force_refresh_blocks', Date.now().toString());
        setTimeout(() => {
            localStorage.removeItem('force_refresh_blocks');
        }, 100);
        showToast("✅ Данные обновлены для всех пользователей", "success");
    };

    // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
    }

    function showToast(message, type = 'success') {
        let toast = document.querySelector('.toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast-notification';
            document.body.appendChild(toast);
        }
        toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i><span>${message}</span>`;
        toast.className = `toast-notification ${type} show`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ПРОВЕРКА API
    async function testAPI() {
        try {
            const response = await fetch('/api/test');
            const data = await response.json();
            console.log('✅ API test:', data);
            return data;
        } catch(e) {
            console.error('❌ API недоступен:', e);
            return null;
        }
    }

    // ГЛАВНАЯ ИНИЦИАЛИЗАЦИЯ
    async function init() {
        console.log('🚀 GLOBAL FIX инициализация...');
        
        const apiStatus = await testAPI();
        if (!apiStatus || apiStatus.status !== 'ok') {
            console.error('❌ API не работает! Проверьте сервер.');
            return;
        }
        
        await Promise.all([
            window.loadProducts(), 
            window.loadGameBlocks(), 
            window.loadAppBlocks()
        ]);
        
        console.log('✅ Глобальная инициализация завершена');
    }
    
    // СЛУШАЕМ ОБНОВЛЕНИЯ ОТ ДРУГИХ ВКЛАДОК
    window.addEventListener('storage', (e) => {
        if (e.key === 'force_refresh_blocks') {
            console.log('🔄 Принудительное обновление блоков...');
            window.loadGameBlocks();
            window.loadAppBlocks();
            window.loadProducts();
            showToast('🔄 Данные обновлены администратором', 'info');
        }
    });
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();