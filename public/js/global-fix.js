// global-fix.js - МАКСИМАЛЬНО ПРОСТАЯ ВЕРСИЯ

(function() {
    console.log('🌍 GLOBAL FIX - загрузка...');

    window.loadProducts = async function() {
        console.log('🔄 loadProducts...');
        try {
            const response = await fetch('/api/products?_=' + Date.now());
            const products = await response.json();
            console.log(`✅ Товаров: ${products.length}`);
            const grid = document.getElementById('productsGrid');
            if (grid && products.length) {
                grid.innerHTML = products.map(p => `
                    <div class="product-card" onclick="window.openProductDetailById('${p.id}')">
                        <div class="card-image"><img src="${p.image_url || 'https://picsum.photos/id/42/400/300'}"></div>
                        <div class="card-body"><div class="current-price">${p.price}</div><h3>${p.title}</h3></div>
                    </div>
                `).join('');
            }
        } catch(e) { console.error(e); }
    };

    // ПРОСТАЯ ВЕРСИЯ БЕЗ ПРОВЕРОК
    window.loadGameBlocks = async function() {
        console.log('🔄 loadGameBlocks...');
        const wrapper = document.getElementById('gamesScrollWrapper');
        console.log('gamesScrollWrapper найден:', !!wrapper);
        
        if (!wrapper) {
            console.error('❌ gamesScrollWrapper НЕТ В DOM!');
            return;
        }
        
        // ВСТАВЛЯЕМ ПРЯМО HTML ДЛЯ ТЕСТА
        wrapper.innerHTML = `
            <div style="display: flex; gap: 16px; overflow-x: auto; padding: 10px;">
                <div style="min-width: 140px; background: #1a1a2e; border-radius: 16px; overflow: hidden;">
                    <img src="https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg" style="width: 100%; aspect-ratio: 4/5; object-fit: cover;">
                    <div style="padding: 10px; text-align: center; background: linear-gradient(to top, black, transparent); margin-top: -40px; position: relative; color: white;">Steam</div>
                </div>
                <div style="min-width: 140px; background: #1a1a2e; border-radius: 16px; overflow: hidden;">
                    <img src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0b5061df29d55a92d945_full_logo_blue_RGB.png" style="width: 100%; aspect-ratio: 4/5; object-fit: cover;">
                    <div style="padding: 10px; text-align: center; background: linear-gradient(to top, black, transparent); margin-top: -40px; position: relative; color: white;">Discord</div>
                </div>
                <div style="min-width: 140px; background: #1a1a2e; border-radius: 16px; overflow: hidden;">
                    <img src="https://tr.rbxcdn.com/30DAY-Avatar-Headshot-1F28A6A3B7A7E6D7B3C5E8F1A2B3C4D5-Png/150/150/AvatarHeadshot/0" style="width: 100%; aspect-ratio: 4/5; object-fit: cover;">
                    <div style="padding: 10px; text-align: center; background: linear-gradient(to top, black, transparent); margin-top: -40px; position: relative; color: white;">Roblox</div>
                </div>
            </div>
        `;
        console.log('✅ ТЕСТОВЫЕ БЛОКИ ИГР ВСТАВЛЕНЫ');
    };

    window.loadAppBlocks = async function() {
        console.log('🔄 loadAppBlocks...');
        const wrapper = document.getElementById('appsScrollWrapper');
        console.log('appsScrollWrapper найден:', !!wrapper);
        
        if (!wrapper) {
            console.error('❌ appsScrollWrapper НЕТ В DOM!');
            return;
        }
        
        wrapper.innerHTML = `
            <div style="display: flex; gap: 16px; overflow-x: auto; padding: 10px;">
                <div style="min-width: 140px; background: #1a1a2e; border-radius: 16px; overflow: hidden;">
                    <img src="https://telegram.org/img/t_logo.png" style="width: 100%; aspect-ratio: 4/5; object-fit: cover;">
                    <div style="padding: 10px; text-align: center; background: linear-gradient(to top, black, transparent); margin-top: -40px; position: relative; color: white;">Telegram</div>
                </div>
                <div style="min-width: 140px; background: #1a1a2e; border-radius: 16px; overflow: hidden;">
                    <img src="https://static.whatsapp.net/rsrc.php/v3/yk/r/RUO4nC8eZ9T.png" style="width: 100%; aspect-ratio: 4/5; object-fit: cover;">
                    <div style="padding: 10px; text-align: center; background: linear-gradient(to top, black, transparent); margin-top: -40px; position: relative; color: white;">WhatsApp</div>
                </div>
                <div style="min-width: 140px; background: #1a1a2e; border-radius: 16px; overflow: hidden;">
                    <img src="https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png" style="width: 100%; aspect-ratio: 4/5; object-fit: cover;">
                    <div style="padding: 10px; text-align: center; background: linear-gradient(to top, black, transparent); margin-top: -40px; position: relative; color: white;">Instagram</div>
                </div>
            </div>
        `;
        console.log('✅ ТЕСТОВЫЕ БЛОКИ ПРИЛОЖЕНИЙ ВСТАВЛЕНЫ');
    };

    window.openKeywordPage = function(keyword) {
        alert('Открываем: ' + keyword);
    };

    async function init() {
        console.log('🚀 ИНИЦИАЛИЗАЦИЯ...');
        await window.loadProducts();
        await window.loadGameBlocks();
        await window.loadAppBlocks();
        console.log('✅ ГОТОВО');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }
})();