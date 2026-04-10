// ============================================
// FIXED PRODUCTS.JS - ПОЛНОСТЬЮ РАБОЧАЯ ВЕРСИЯ
// ============================================

let productsArray = [];

// ОСНОВНАЯ ФУНКЦИЯ ЗАГРУЗКИ ТОВАРОВ
window.loadProducts = async function() {
    console.log('🔄 Загрузка товаров с сервера...');
    
    try {
        const products = await API.getProducts();
        productsArray = products;
        
        // Сохраняем в localStorage (только для резерва)
        localStorage.setItem('apex_products', JSON.stringify(products));
        
        // ОТОБРАЖАЕМ ТОВАРЫ
        const container = document.getElementById('productsGrid');
        if (!container) {
            console.error('productsGrid не найден');
            return;
        }
        
        if (products.length === 0) {
            container.innerHTML = '<div class="empty-state">Нет товаров</div>';
        } else {
            let html = '';
            products.forEach(product => {
                html += `
                    <div class="product-card" onclick="window.openProductDetailById('${product.id}')">
                        <div class="card-image">
                            <img src="${product.image_url || 'https://picsum.photos/id/42/400/300'}" 
                                 alt="${product.title.replace(/"/g, '&quot;')}"
                                 loading="lazy"
                                 onerror="this.src='https://picsum.photos/id/42/400/300'">
                            ${product.discount ? `<span class="discount-badge">🔥 ${product.discount}</span>` : ''}
                        </div>
                        <div class="card-body">
                            <div class="price-wrapper">
                                <span class="current-price">${product.price}</span>
                                ${product.original_price ? `<span class="old-price">${product.original_price}</span>` : ''}
                            </div>
                            <h3 class="product-title">${product.title.substring(0, 60)}</h3>
                            <div class="rating">
                                <span class="stars">★★★★★</span>
                                <span class="reviews-count">${product.sales || 0} отзывов</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
        
        // Обновляем счетчик
        const countSpan = document.getElementById('productCountStat');
        if (countSpan) countSpan.innerText = products.length;
        
        console.log(`✅ Отображено ${products.length} товаров`);
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        const stored = localStorage.getItem('apex_products');
        if (stored) {
            productsArray = JSON.parse(stored);
        }
    }
};

// ФИЛЬТРАЦИЯ ТОВАРОВ
window.filterProducts = function() {
    const term = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const filtered = productsArray.filter(p => 
        p.title.toLowerCase().includes(term) || 
        (p.keyword && p.keyword.toLowerCase().includes(term))
    );
    
    const container = document.getElementById('productsGrid');
    if (!container) return;
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">Ничего не найдено</div>';
    } else {
        let html = '';
        filtered.forEach(product => {
            html += `
                <div class="product-card" onclick="window.openProductDetailById('${product.id}')">
                    <div class="card-image">
                        <img src="${product.image_url || 'https://picsum.photos/id/42/400/300'}" 
                             onerror="this.src='https://picsum.photos/id/42/400/300'">
                    </div>
                    <div class="card-body">
                        <div class="current-price">${product.price}</div>
                        <h3 class="product-title">${product.title.substring(0, 50)}</h3>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }
};

// ОТКРЫТИЕ ДЕТАЛЕЙ ТОВАРА
window.openProductDetailById = async function(productId) {
    console.log('🔍 Открываем товар:', productId);
    
    // Всегда берем свежие данные с сервера
    const products = await API.getProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        alert('Товар не найден');
        return;
    }
    
    // Показываем информацию
    alert(`📦 ${product.title}\n💰 ${product.price}\n👤 ${product.seller}\n\n📝 ${product.description?.substring(0, 200)}...`);
};

// СОЗДАНИЕ ТОВАРА (ДЛЯ СТРАНИЦЫ ТОВАРОВ)
window.createNewProduct = async function() {
    console.log('🆕 Создание товара');
    
    const title = document.getElementById('productTitle')?.value;
    const price = document.getElementById('productPrice')?.value;
    const description = document.getElementById('productDescription')?.value;
    const imageUrl = document.getElementById('productImageUrl')?.value;
    
    if (!title || !price) {
        alert('Заполните название и цену');
        return;
    }
    
    const currentUser = localStorage.getItem('apex_user') || 'Гость';
    
    const newProduct = {
        title: title,
        price: price,
        seller: currentUser,
        keyword: 'Общее',
        image_url: imageUrl || 'https://picsum.photos/id/42/400/200',
        description: description || 'Новый товар'
    };
    
    try {
        await API.createProduct(newProduct);
        alert('✅ Товар создан!');
        
        // Очищаем форму
        ['productTitle', 'productPrice', 'productDescription', 'productImageUrl'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        
        // Обновляем список
        await loadProducts();
        
        // Закрываем форму если открыта
        const form = document.getElementById('createProductForm');
        if (form) form.style.display = 'none';
        
    } catch(e) {
        alert('Ошибка: ' + e.message);
    }
};

// УДАЛЕНИЕ ТОВАРА
window.deleteUserProduct = async function(productId) {
    if (!confirm('Удалить товар?')) return;
    try {
        await API.deleteProduct(productId);
        alert('✅ Товар удален');
        await loadProducts();
        if (typeof renderUserProductsList === 'function') {
            await renderUserProductsList();
        }
    } catch(e) {
        alert('Ошибка: ' + e.message);
    }
};

// ЗАГРУЗКА ПРИ СТАРТЕ
document.addEventListener('DOMContentLoaded', async function() {
    console.log('products-fixed.js загружен');
    await loadProducts();
});

console.log('✅ products-fixed.js готов');