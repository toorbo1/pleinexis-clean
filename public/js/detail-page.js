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

// ========== ПОХОЖИЕ ТОВАРЫ ==========
async function loadSimilarProducts(keyword, currentProductId) {
    try {
        const response = await fetch('/api/products?_=' + Date.now());
        if (!response.ok) return [];
        const products = await response.json();
        
        // Фильтруем товары с таким же ключевым словом, исключая текущий
        const similar = products.filter(p => 
            p.keyword && p.keyword === keyword && 
            p.id !== currentProductId
        ).slice(0, 6); // Показываем до 6 товаров
        
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
        } else {
            const discountNum = parseFloat(String(discount).replace(/[^0-9.-]/g, ''));
            if (!isNaN(priceNum) && !isNaN(discountNum) && discountNum > 0) {
                const oldPrice = priceNum + discountNum;
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
                ${discountPercent ? `<div class="detail-discount-badge"> -${discountPercent}%</div>` : ''}
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
                </div>
                
                <div class="detail-buttons-row">
                    <button class="buy-button-inline" onclick="buyProduct('${id}')">
                        <i class="fas fa-shopping-cart"></i> Купить
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
        
        <!-- ОПИСАНИЕ ТОВАРА -->
        <div class="seller-description-block">
            <div class="block-title">
                <i class="fas fa-align-left"></i> Описание товара
            </div>
            <div class="seller-contact-text">${formatDescription(description)}</div>
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
                <span class="similar-products-badge">по категории "${escapeHtml(product.keyword || 'Без категории')}"</span>
            </div>
            <div class="similar-products-grid">
                ${similarProducts.map(p => {
                    let similarDiscountPercent = '';
                    const pPriceNum = parseFloat(String(p.price).replace(/[^0-9.-]/g, ''));
                    if (p.discount) {
                        if (String(p.discount).includes('%')) {
                            similarDiscountPercent = String(p.discount).replace('%', '');
                        } else {
                            const discountNum = parseFloat(String(p.discount).replace(/[^0-9.-]/g, ''));
                            if (!isNaN(pPriceNum) && !isNaN(discountNum) && discountNum > 0) {
                                similarDiscountPercent = Math.round((discountNum / (pPriceNum + discountNum)) * 100);
                            }
                        }
                    }
                    return `
                    <div class="similar-product-card" onclick="window.openProductDetailById('${p.id}')">
                        <div class="similar-product-image-wrapper">
                            <img class="similar-product-image" src="${p.image_url || 'https://picsum.photos/id/42/400/300'}" 
                                 alt="${escapeHtml(p.title)}"
                                 onerror="this.src='https://picsum.photos/id/42/400/300'">
                            ${similarDiscountPercent ? `<span class="similar-product-discount">-${similarDiscountPercent}%</span>` : ''}
                        </div>
                        <div class="similar-product-body">
                            <div class="similar-product-title">${escapeHtml(p.title.substring(0, 50))}</div>
                            <div class="similar-product-price">${escapeHtml(p.price)}</div>
                            <div class="similar-product-seller">${escapeHtml(p.seller || 'Продавец')}</div>
                        </div>
                    </div>
                `}).join('')}
            </div>
            <div class="similar-products-footer">
                <button class="view-all-similar-btn" onclick="openKeywordPage('${escapeHtml(product.keyword || '')}')">
                    <i class="fas fa-eye"></i> Смотреть все товары в категории
                </button>
            </div>
        </div>
        ` : `
        <div class="similar-products-empty">
            <i class="fas fa-box-open"></i>
            <p>Нет похожих товаров в категории "${escapeHtml(product.keyword || 'Без категории')}"</p>
            <button class="view-all-similar-btn" onclick="openKeywordPage('${escapeHtml(product.keyword || '')}')">
                <i class="fas fa-search"></i> Посмотреть все товары
            </button>
        </div>
        `}
        
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

// Функция открытия чата с привязкой к сделке
function openChatForDeal(dealId, sellerUsername, productTitle) {
    // Используем существующую систему диалогов из chats.js
    let dialogs = JSON.parse(localStorage.getItem('apex_dialogs') || '[]');
    const currentUser = localStorage.getItem('apex_user');
    
    let dialog = dialogs.find(d => d.name === sellerUsername);
    if (!dialog) {
        dialog = {
            id: Date.now().toString(),
            name: sellerUsername,
            avatar: '👤',
            messages: [],
            dealId: dealId,
            productTitle: productTitle
        };
        dialogs.push(dialog);
    } else {
        dialog.dealId = dealId;
        dialog.productTitle = productTitle;
    }
    
    // Добавляем системное сообщение о сделке
    dialog.messages.push({
        user: 'System',
        text: `🔒 Сделка #${dealId} на товар "${productTitle}" создана. Ожидайте выполнения.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toISOString(),
        system: true
    });
    
    localStorage.setItem('apex_dialogs', JSON.stringify(dialogs));
    
    // Обновляем диалоги в памяти чатов
    if (typeof window.refreshDialogs === 'function') {
        window.refreshDialogs();
    }
    
    // Переключаемся на чат
    if (typeof window.showPage === 'function') {
        window.showPage('chat');
        setTimeout(() => {
            if (typeof openChatWithDialog === 'function') {
                openChatWithDialog(dialog.id);
            }
        }, 100);
    }
}

// В функции buyProduct после успешного ответа от /api/deals вызываем openChatForDeal
window.buyProduct = async function(productId) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        if (typeof window.auth !== 'undefined' && window.auth.showAuthModal) {
            window.auth.showAuthModal('login');
        } else {
            alert('Для покупки необходимо войти в аккаунт');
        }
        return;
    }
    try {
        // 1. Проверить баланс пользователя
        const meRes = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (!meRes.ok) throw new Error('Не авторизован');
        const user = await meRes.json();
        
        // Получить цену товара
        const prodRes = await fetch(`/api/products/${productId}`);
        const product = await prodRes.json();
        const price = parseInt(product.price.replace(/[^0-9]/g, ''));
        
        if (user.balance < price) {
            if (confirm('Недостаточно средств. Перейти в профиль для пополнения?')) {
                window.showPage('profile');
            }
            return;
        }

        // 2. Создать сделку
        const dealRes = await fetch('/api/deals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({ productId })
        });
        if (!dealRes.ok) {
            const err = await dealRes.json();
            throw new Error(err.error || 'Ошибка создания сделки');
        }
        const deal = await dealRes.json();

        // 3. Создать/открыть чат с продавцом
        const sellerUsername = product.seller; // предполагаем, что seller - username
        openChatForDeal(deal.dealId, sellerUsername, product.title);

        // 4. Увеличить счётчик покупок
        await incrementPurchasesCount();

        // 5. Показать уведомление и закрыть детальную страницу
        showToast('Сделка создана! Перейдите в чат для обсуждения.', 'success');
        closeDetail();
        
    } catch (error) {
        showToast(error.message, 'error');
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
// В конец функции buyProduct, после успешного создания сделки
async function incrementPurchasesCount() {
    const profile = JSON.parse(localStorage.getItem('apex_profile') || '{}');
    profile.purchasesCount = (profile.purchasesCount || 0) + 1;
    localStorage.setItem('apex_profile', JSON.stringify(profile));
    
    // Обновляем отображение в профиле
    if (typeof window.updateProfileStats === 'function') {
        window.updateProfileStats();
    }
    
    // Отправляем на сервер
    try {
        await fetch('/api/user/stats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({ purchasesCount: profile.purchasesCount })
        });
    } catch (e) {
        console.error('Ошибка обновления статистики:', e);
    }
}

// Вызвать в buyProduct после успешного ответа от /api/deals


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

// Открытие страницы с ключевым словом
window.openKeywordPage = function(keyword) {
    closeDetail();
    setTimeout(() => {
        if (typeof window.showPage === 'function') {
            window.showPage('home');
            setTimeout(() => {
                if (typeof window.openKeywordPage === 'function') {
                    window.openKeywordPage(keyword);
                }
            }, 100);
        }
    }, 100);
};

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

console.log('✅ detail-page.js загружен (обновленная версия с похожими товарами)');