// detail-page.js - ПОЛНОСТЬЮ РАБОЧАЯ ВЕРСИЯ ДЛЯ ВАШЕГО CSS

// Открытие страницы с деталями товара
window.openProductDetailById = async function(productId) {
    console.log('🔍 Открываем детали товара:', productId);
    
    try {
        // Загружаем свежие данные с сервера
        const response = await fetch(`/api/products/${productId}?_=${Date.now()}`);
        if (!response.ok) throw new Error('Товар не найден');
        const product = await response.json();
        
        console.log('✅ Товар загружен:', product);
        
        // Заполняем страницу деталей
        renderDetailPage(product);
        
        // Показываем страницу деталей
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

// Основная функция рендеринга
function renderDetailPage(product) {
    const container = document.getElementById('detailContent');
    if (!container) return;
    
    // Безопасное экранирование
    const id = product.id;
    const title = escapeHtml(product.title || 'Без названия');
    const price = escapeHtml(product.price || '0 ₽');
    const seller = escapeHtml(product.seller || 'Продавец');
    const description = product.description || 'Нет описания';
    const imageUrl = product.image_url || 'https://picsum.photos/id/42/500/375';
    const discount = product.discount;
    const originalPrice = product.original_price;
    const sales = product.sales || 0;
    const contact = product.contact || '';
    const createdAt = product.created_at ? new Date(product.created_at).toLocaleDateString('ru-RU') : 'Недавно';
    
    // Формируем HTML в соответствии с вашим CSS
    container.innerHTML = `
        <div class="detail-top-row">
            <!-- Фото товара слева -->
            <div class="detail-image-col">
                <img class="product-detail-image" 
                     src="${escapeHtml(imageUrl)}" 
                     alt="${title}"
                     onerror="this.src='https://picsum.photos/id/42/500/375'">
                ${discount ? `<div style="margin-top: 12px; background: rgba(239,68,68,0.2); color:#ef4444; padding: 6px 12px; border-radius: 20px; text-align: center; font-size:0.8rem;">- Скидка ${escapeHtml(discount)}</div>` : ''}
            </div>
            
            <!-- Информация справа -->
            <div class="detail-info-col">
                <div class="active-badge">
                    <span class="active-dot"></span> Активный товар
                </div>
                
                <h1 class="product-detail-name">${title}</h1>
                
                <div class="product-detail-price">
                    ${originalPrice ? `<span style="text-decoration: line-through; font-size:1rem; color:#8f8f9e; margin-right:12px;">${escapeHtml(originalPrice)}</span>` : ''}
                    ${price}
                </div>
                
                <!-- Кнопки вертикально на мобилке, горизонтально на ПК -->
                <div class="detail-buttons-row">
                    <button class="buy-button-inline" onclick="buyProduct('${id}')">
                        <i class="fas fa-shopping-cart"></i> Купить сейчас
                    </button>
                    <button class="buy-button-inline" onclick="contactSeller('${escapeHtml(seller)}')" style="background: rgba(59,130,246,0.2); backdrop-filter: blur(10px);">
                        <i class="fas fa-comment"></i> Связаться с продавцом
                    </button>
                </div>
                
                <!-- Информация о продавце -->
                <div class="seller-info-block">
                    <div class="seller-name-large">
                        <i class="fas fa-store"></i> ${seller}
                    </div>
                    <div class="seller-rating">
                        <span class="stars">★★★★★</span>
                        <span class="rating-value">5.0</span>
                        <span class="reviews-count">${sales} отзывов</span>
                    </div>
                </div>
                
                <!-- Статистика -->
                <div class="stats-row">
                    <div class="stat-cell">
                        <div class="stat-number">${sales}</div>
                        <div class="stat-label">продаж</div>
                    </div>
                    <div class="stat-cell">
                        <div class="stat-number">100%</div>
                        <div class="stat-label">гарантия</div>
                    </div>
                    <div class="stat-cell">
                        <div class="stat-number">мгновенно</div>
                        <div class="stat-label">доставка</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Блок с контактом продавца (KPP) -->
        ${contact ? `
        <div class="kpp-block">
            <div style="font-size:0.7rem; color:#8f8f9e; margin-bottom:8px;">📞 Контакт продавца</div>
            <div class="kpp-number">${escapeHtml(contact)}</div>
        </div>
        ` : ''}
        
        <!-- Блок описания товара -->
        <div class="seller-description-block">
            <div style="font-weight:600; margin-bottom:10px; display:flex; align-items:center; gap:8px;">
                <i class="fas fa-align-left"></i> Описание товара
            </div>
            <div class="seller-contact-text">${formatDescription(description)}</div>
        </div>
        
        <!-- Табы -->
        <div class="tabs-container">
            <button class="tab-btn active" onclick="switchTab('desc')">📝 Описание</button>
            <button class="tab-btn" onclick="switchTab('reviews')">⭐ Отзывы (${sales})</button>
            <button class="tab-btn" onclick="switchTab('guarantee')">🛡️ Гарантия</button>
        </div>
        
        <!-- Панель: Описание -->
        <div id="tabDesc" class="tab-pane active">
            <div class="seller-contact-text">${formatDescription(description)}</div>
        </div>
        
        <!-- Панель: Отзывы -->
        <div id="tabReviews" class="tab-pane">
            <div class="reviews-list">
                ${generateReviews(sales)}
            </div>
        </div>
        
        <!-- Панель: Гарантия -->
        <div id="tabGuarantee" class="tab-pane">
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
        </div>
        
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
    if (salesCount === 0) {
        return '<div class="review-item" style="text-align:center; color:#8f8f9e;">Нет отзывов. Будьте первым!</div>';
    }
    
    const reviews = [];
    const reviewCount = Math.min(salesCount, 5);
    
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

// Переключение табов
window.switchTab = function(tabName) {
    // Скрываем все панели
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Убираем активный класс со всех кнопок
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показываем выбранную панель
    const activePane = document.getElementById(`tab${tabName === 'desc' ? 'Desc' : tabName === 'reviews' ? 'Reviews' : 'Guarantee'}`);
    if (activePane) activePane.classList.add('active');
    
    // Активируем нажатую кнопку
    const clickedBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => 
        btn.textContent.includes(tabName === 'desc' ? 'Описание' : tabName === 'reviews' ? 'Отзывы' : 'Гарантия')
    );
    if (clickedBtn) clickedBtn.classList.add('active');
};

// Форматирование описания
function formatDescription(text) {
    if (!text) return 'Нет описания';
    // Заменяем переносы строк на <br>
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
                window.currentUser = currentUser;
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
        
        // Отправляем уведомление продавцу
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
        // Закрытие по клику на фон
        detailPage.addEventListener('click', function(e) {
            if (e.target === detailPage) {
                closeDetail();
            }
        });
        
        // Закрытие по Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && detailPage.classList.contains('active')) {
                closeDetail();
            }
        });
    }
});

console.log('✅ detail-page.js загружен');