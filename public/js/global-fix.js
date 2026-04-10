// global-fix.js - ПРИНУДИТЕЛЬНОЕ ОТОБРАЖЕНИЕ БЛОКОВ

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

    // ========== ИГРЫ - ПРИНУДИТЕЛЬНЫЕ ТЕСТОВЫЕ ДАННЫЕ ==========
    window.loadGameBlocks = async function() {
        console.log('🔄 loadGameBlocks: принудительное отображение...');
        
        const wrapper = document.getElementById('gamesScrollWrapper');
        console.log('🔍 gamesScrollWrapper найден:', !!wrapper);
        
        if (!wrapper) {
            console.error('❌ gamesScrollWrapper НЕ СУЩЕСТВУЕТ!');
            return [];
        }
        
        // ПРИНУДИТЕЛЬНЫЕ ТЕСТОВЫЕ ДАННЫЕ
        const testBlocks = [
            { id: '1', name: 'Steam', image_url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg' },
            { id: '2', name: 'Discord', image_url: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0b5061df29d55a92d945_full_logo_blue_RGB.png' },
            { id: '3', name: 'Roblox', image_url: 'https://tr.rbxcdn.com/30DAY-Avatar-Headshot-1F28A6A3B7A7E6D7B3C5E8F1A2B3C4D5-Png/150/150/AvatarHeadshot/0' },
            { id: '4', name: 'Valorant', image_url: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt3f2c0e8a5d5f5b5a/5eaa8c5e5f5b5a5f5b5a5f5b/valorant-logo.png' },
            { id: '5', name: 'Minecraft', image_url: 'https://www.minecraft.net/content/dam/minecraft/common/logos/minecraft-logo.png' },
            { id: '6', name: 'CS2', image_url: 'https://cdn.cloudflare.steamstatic.com/apps/csgo/images/csgo_react/social/cs2.jpg' }
        ];
        
        wrapper.innerHTML = `
            <div class="horizontal-scroll-container">
                ${testBlocks.map(block => `
                    <div class="vertical-card" onclick="openKeywordPage('${escapeHtml(block.name)}')">
                        <div class="vertical-card-inner">
                            <img class="vertical-card-img" 
                                 src="${escapeHtml(block.image_url)}" 
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
        console.log('✅ Блоки игр принудительно отображены');
        
        return testBlocks;
    };

    // ========== ПРИЛОЖЕНИЯ - ПРИНУДИТЕЛЬНЫЕ ТЕСТОВЫЕ ДАННЫЕ ==========
    window.loadAppBlocks = async function() {
        console.log('🔄 loadAppBlocks: принудительное отображение...');
        
        const wrapper = document.getElementById('appsScrollWrapper');
        console.log('🔍 appsScrollWrapper найден:', !!wrapper);
        
        if (!wrapper) {
            console.error('❌ appsScrollWrapper НЕ СУЩЕСТВУЕТ!');
            return [];
        }
        
        // ПРИНУДИТЕЛЬНЫЕ ТЕСТОВЫЕ ДАННЫЕ
        const testBlocks = [
            { id: '1', name: 'Telegram', image_url: 'https://telegram.org/img/t_logo.png' },
            { id: '2', name: 'WhatsApp', image_url: 'https://static.whatsapp.net/rsrc.php/v3/yk/r/RUO4nC8eZ9T.png' },
            { id: '3', name: 'Instagram', image_url: 'https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png' },
            { id: '4', name: 'TikTok', image_url: 'https://www.tiktok.com/favicon.ico' },
            { id: '5', name: 'YouTube', image_url: 'https://www.youtube.com/s/desktop/0146b6d5/img/favicon_144x144.png' },
            { id: '6', name: 'Spotify', image_url: 'https://www.scdn.co/i/_global/favicon.png' }
        ];
        
        wrapper.innerHTML = `
            <div class="horizontal-scroll-container">
                ${testBlocks.map(block => `
                    <div class="vertical-card" onclick="openKeywordPage('${escapeHtml(block.name)}')">
                        <div class="vertical-card-inner">
                            <img class="vertical-card-img" 
                                 src="${escapeHtml(block.image_url)}" 
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
        console.log('✅ Блоки приложений принудительно отображены');
        
        return testBlocks;
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