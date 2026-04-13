// detail-page.js - ПОЛНОСТЬЮ ПЕРЕРАБОТАННАЯ ВЕРСИЯ

// Открытие страницы с деталями товара
window.openProductDetailById = async function(productId) {
    console.log('🔍 Открываем детали товара:', productId);
    
    try {
        const response = await fetch(`/api/products/${productId}?_=${Date.now()}`);
        if (!response.ok) throw new Error('Товар не найден');
        const product = await response.json();
        
        await renderDetailPage(product);
        
        const detailPage = document.getElementById('detailPage');
        if (detailPage) {
            detailPage.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
    } catch (error) {
        console.error('Ошибка загрузки товара:', error);
        showToast('Товар не найден', 'error');
    }
};

// Закрытие страницы деталей
window.closeDetail = function() {
    const detailPage = document.getElementById('detailPage');
    if (detailPage) {
        detailPage.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// Загрузка похожих товаров
async function loadSimilarProducts(keyword, currentProductId) {
    try {
        const response = await fetch('/api/products?_=' + Date.now());
        const products = await response.json();
        
        const similar = products.filter(p => 
            p.keyword === keyword && 
            p.id !== currentProductId
        ).slice(0, 4);
        
        return similar;
    } catch (error) {
        console.error('Ошибка загрузки похожих товаров:', error);
        return [];
    }
}

// Основная функция рендеринга
async function renderDetailPage(product) {
    const container = document.getElementById('detailContent');
    if (!container) return;
    
    // Загружаем похожие товары
    const similarProducts = await loadSimilarProducts(product.keyword, product.id);
    
    // Безопасное экранирование
    const id = product.id;
    const title = escapeHtml(product.title || 'Без названия');
    const price = product.price || '0 ₽';
    const seller = escapeHtml(product.seller || 'Продавец');
    const description = product.description || 'Нет описания';
    const imageUrl = product.image_url || 'https://picsum.photos/id/42/500/375';
    const discount = product.discount;
    const originalPrice = product.original_price;
    const sales = product.sales || 0;
    const contact = product.contact || '';
    const rating = product.rating || 5.0;
    
    // Обработка скидки
    let discountPercent = '';
    let formattedOriginalPrice = '';
    let formattedCurrentPrice = price;
    const priceNum = parseFloat(String(price).replace(/[^0-9.-]/g, ''));
    
    if (originalPrice) {
        const origNum = parseFloat(String(originalPrice).replace(/[^0-9.-]/g, ''));
        if (!isNaN(origNum) && !isNaN(priceNum) && origNum > 0) {
            discountPercent = Math.round(((origNum - priceNum) / origNum) * 100);
            formattedOriginalPrice = originalPrice;
            formattedCurrentPrice = price;
        }
    } else if (discount) {
        if (String(discount).includes('%')) {
            discountPercent = String(discount).replace('%', '');
            if (!isNaN(priceNum) && discountPercent > 0) {
                const oldPrice = priceNum / (1 - discountPercent / 100);
                formattedOriginalPrice = Math.round(oldPrice) + ' ₽';
                formattedCurrentPrice = price;
            }
        } else {
            const discountNum = parseFloat(String(discount).replace(/[^0-9.-]/g, ''));
            if (!isNaN(priceNum) && !isNaN(discountNum) && discountNum > 0) {
                const oldPrice = priceNum + discountNum;
                formattedOriginalPrice = Math.round(oldPrice) + ' ₽';
                formattedCurrentPrice = price;
                discountPercent = Math.round((discountNum / oldPrice) * 100);
            }
        }
    }
    
    // Генерация звёзд
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
    
    // Рендеринг
    container.innerHTML = `
        <!-- Кнопка назад -->
        <div style="margin-bottom: 20px;">
            <button onclick="window.closeDetail()" style="background: none; border: none; color: var(--text-muted); font-size: 1rem; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-arrow-left"></i> Назад
            </button>
        </div>
        
        <!-- Блок: Фото + информация -->
        <div class="detail-top-row">
            <div class="detail-image-col">
                <img class="product-detail-image" 
                     src="${escapeHtml(imageUrl)}" 
                     alt="${title}"
                     onerror="this.src='https://picsum.photos/id/42/500/375'">
            </div>
            
            <div class="detail-info-col">
                <div class="active-badge">
                    <span class="active-dot"></span> Активный товар
                </div>
                
                <h1 class="product-detail-name">${title}</h1>
                
                <div class="product-detail-price">
                    ${formattedOriginalPrice ? `<span class="old-price">${formattedOriginalPrice}</span>` : ''}
                    <span class="current-price">${formattedCurrentPrice}</span>
                    ${discountPercent ? `<span class="discount-badge">-${discountPercent}%</span>` : ''}
                </div>
                
                <div class="detail-buttons-row">
                    <button class="buy-button-inline" onclick="buyProduct('${id}')">
                        <i class="fas fa-shopping-cart"></i> Купить
                    </button>
                    <button class="chat-button-inline" onclick="contactSeller('${escapeHtml(seller)}')">
                        <i class="fas fa-comment"></i> Связаться
                    </button>
                </div>
                
                <div class="seller-info-block">
                    <div class="seller-name-large">
                        <i class="fas fa-store"></i> ${seller}
                    </div>
                    <div class="seller-rating">
                        <div class="stars">${starsHtml}</div>
                        <span class="rating-value">${rating.toFixed(1)}</span>
                        <span class="reviews-count">${sales} отзывов</span>
                    </div>
                </div>
            </div>
        </div>
        
        ${contact ? `
        <div class="kpp-block">
            <div style="font-size:0.7rem; color:#8f8f9e; margin-bottom:8px;">📞 Контакт продавца</div>
            <div class="kpp-number">${escapeHtml(contact)}</div>
        </div>
        ` : ''}
        
        <!-- ОПИСАНИЕ ТОВАРА (без фона) -->
        <div class="seller-description-block">
            <div class="block-title">
                <i class="fas fa-align-left"></i> Описание товара
            </div>
            <div class="seller-contact-text" style="white-space: pre-wrap; word-wrap: break-word;">${formatDescription(description)}</div>
        </div>
        
        <!-- ГАРАНТИИ -->
        <div class="guarantee-block">
            <div class="guarantee-title">
                <i class="fas fa-shield-alt"></i> Гарантии продавца
            </div>
            <div class="guarantee-items">
                <div class="guarantee-item"><i class="fas fa-check-circle"></i> Моментальная выдача товара</div>
                <div class="guarantee-item"><i class="fas fa-check-circle"></i> Гарантия возврата средств</div>
                <div class="guarantee-item"><i class="fas fa-check-circle"></i> Техническая поддержка 24/7</div>
                <div class="guarantee-item"><i class="fas fa-check-circle"></i> Только официальные ключи</div>
            </div>
        </div>
        
        <!-- ОТЗЫВЫ -->
        <div class="reviews-section">
            <div class="reviews-section-header">
                <h3><i class="fas fa-star" style="color: #fbbf24;"></i> Отзывы покупателей</h3>
                <span class="reviews-count-badge">${sales} отзывов</span>
            </div>
            <div class="reviews-list">
                ${generateReviews(sales)}
            </div>
        </div>
        
        <!-- ПОХОЖИЕ ТОВАРЫ -->
        ${similarProducts.length > 0 ? `
        <div class="similar-products-section">
            <div class="similar-products-header">
                <h3><i class="fas fa-tag"></i> Похожие товары</h3>
                <span class="reviews-count-badge">с ключевым словом "${escapeHtml(product.keyword || '')}"</span>
            </div>
            <div class="similar-products-grid">
                ${similarProducts.map(p => `
                    <div class="similar-product-card" onclick="window.openProductDetailById('${p.id}')">
                        <img class="similar-product-image" src="${p.image_url || 'https://picsum.photos/id/42/400/300'}" 
                             alt="${escapeHtml(p.title)}"
                             onerror="this.src='https://picsum.photos/id/42/400/300'">
                        <div class="similar-product-body">
                            <div class="similar-product-title">${escapeHtml(p.title.substring(0, 40))}</div>
                            <div class="similar-product-price">${escapeHtml(p.price)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <!-- Футер ссылки -->
        <div class="footer-links">
            <a href="#" onclick="showInfo('about')">О нас</a>
            <a href="#" onclick="showInfo('privacy')">Политика</a>
            <a href="#" onclick="showInfo('contacts')">Контакты</a>
            <a href="#" onclick="showInfo('discounts')">Скидки</a>
        </div>
    `;
}

// Генерация отзывов
function generateReviews(salesCount) {
    if (salesCount === 0 || salesCount < 1) {
        return '<div class="review-item" style="text-align:center; color:#8f8f9e; padding: 30px;">✨ Нет отзывов. Будьте первым, кто оставит отзыв!</div>';
    }
    
    const reviews = [];
    const reviewCount = Math.min(salesCount, 3);
    
    for (let i = 0; i < reviewCount; i++) {
        const date = new Date(Date.now() - (i * 86400000 * 3)).toLocaleDateString('ru-RU');
        reviews.push(`
            <div class="review-item">
                <div class="review-header">
                    <span class="review-author">Покупатель ${Math.floor(Math.random() * 1000)}</span>
                    <span class="review-stars">★★★★★</span>
                    <span class="review-date">${date}</span>
                </div>
                <div class="review-text">Отличный товар! Всё работает, продавец отзывчивый. Рекомендую! ✅</div>
            </div>
        `);
    }
    
    return reviews.join('');
}

// Форматирование описания
function formatDescription(text) {
    if (!text) return 'Нет описания';
    return text.replace(/\n/g, '<br>').replace(/\\n/g, '<br>');
}

// Покупка товара
window.buyProduct = async function(productId) {
    let currentUser = localStorage.getItem('apex_user') || 'Гость';
    
    if (currentUser === 'Гость') {
        if (confirm('Для покупки необходимо представиться. Введите ваш никнейм?')) {
            const name = prompt('Введите ваш никнейм:');
            if (name && name.trim()) {
                localStorage.setItem('apex_user', name.trim());
                currentUser = name.trim();
                buyProduct(productId);
            }
        }
        return;
    }
    
    try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) throw new Error('Товар не найден');
        const product = await response.json();
        
        alert(`✅ Заказ оформлен!\n\n📦 Товар: ${product.title}\n💰 Сумма: ${product.price}\n👤 Продавец: ${product.seller}\n\n📝 Продавец свяжется с вами в ближайшее время.\n\n💬 Вы можете написать продавцу в чат.`);
        
        sendPurchaseNotification(product.seller, product.title, currentUser);
        closeDetail();
        
    } catch (error) {
        showToast('Ошибка при оформлении заказа', 'error');
    }
};

// Уведомление продавцу
function sendPurchaseNotification(sellerName, productTitle, buyerName) {
    let dialogs = JSON.parse(localStorage.getItem('apex_dialogs') || '[]');
    let sellerDialog = dialogs.find(d => d.name === sellerName);
    
    if (!sellerDialog) {
        sellerDialog = {
            id: Date.now().toString(),
            name: sellerName,
            avatar: '👤',
            messages: []
        };
        dialogs.push(sellerDialog);
    }
    
    sellerDialog.messages.push({
        user: buyerName,
        text: `🛒 Здравствуйте! Я купил товар "${productTitle}". Ожидаю получение.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toISOString()
    });
    
    localStorage.setItem('apex_dialogs', JSON.stringify(dialogs));
    
    if (typeof renderDialogsList === 'function') {
        renderDialogsList();
    }
    
    showToast(`✅ Уведомление отправлено продавцу ${sellerName}`, 'success');
}

// Связь с продавцом
window.contactSeller = function(sellerName) {
    let dialogs = JSON.parse(localStorage.getItem('apex_dialogs') || '[]');
    let existingDialog = dialogs.find(d => d.name === sellerName);
    
    if (!existingDialog) {
        existingDialog = {
            id: Date.now().toString(),
            name: sellerName,
            avatar: '👤',
            messages: []
        };
        dialogs.push(existingDialog);
        localStorage.setItem('apex_dialogs', JSON.stringify(dialogs));
    }
    
    closeDetail();
    
    setTimeout(() => {
        if (typeof navigate === 'function') {
            navigate('chat');
        } else if (typeof showPage === 'function') {
            showPage('chat');
        }
        
        setTimeout(() => {
            if (typeof openChatWithDialog === 'function') {
                openChatWithDialog(existingDialog.id);
            }
        }, 150);
    }, 100);
};

// Показать уведомление
function showToast(message, type = 'success') {
    let toast = document.getElementById('detailToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'detailToast';
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    toast.className = `toast-notification ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Экранирование HTML
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Инициализация обработчиков
document.addEventListener('DOMContentLoaded', function() {
    const detailPage = document.getElementById('detailPage');
    if (detailPage) {
        detailPage.addEventListener('click', function(e) {
            if (e.target === detailPage) {
                closeDetail();
            }
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && detailPage.classList.contains('active')) {
                closeDetail();
            }
        });
    }
});

console.log('✅ detail-page.js загружен (обновленная версия)');