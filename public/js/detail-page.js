// detail-page.js - ПОЛНОСТЬЮ РАБОЧАЯ СТРАНИЦА ДЕТАЛЕЙ ТОВАРА

// Открытие страницы с деталями товара
window.openProductDetailById = async function(productId) {
    console.log('🔍 Открываем детали товара:', productId);
    
    try {
        // Загружаем свежие данные с сервера
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) throw new Error('Товар не найден');
        const product = await response.json();
        
        // Заполняем страницу деталей
        renderDetailPage(product);
        
        // Показываем страницу деталей
        const detailPage = document.getElementById('detailPage');
        if (detailPage) {
            detailPage.classList.add('active');
            document.body.style.overflow = 'hidden'; // Блокируем скролл фона
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
        document.body.style.overflow = ''; // Возвращаем скролл
    }
};

// Рендер страницы деталей
function renderDetailPage(product) {
    const container = document.getElementById('detailContent');
    if (!container) return;
    
    // Экранируем данные
    const title = escapeHtml(product.title || 'Без названия');
    const price = escapeHtml(product.price || '0 ₽');
    const seller = escapeHtml(product.seller || 'Продавец');
    const description = escapeHtml(product.description || 'Нет описания');
    const imageUrl = product.image_url || 'https://picsum.photos/id/42/400/400';
    const discount = product.discount;
    const originalPrice = product.original_price;
    const sales = product.sales || 0;
    const createdAt = product.created_at ? new Date(product.created_at).toLocaleDateString('ru-RU') : 'Недавно';
    
    // Формируем HTML
    container.innerHTML = `
        <div class="detail-card">
            <div class="detail-image">
                <img src="${escapeHtml(imageUrl)}" 
                     alt="${title}"
                     onerror="this.src='https://picsum.photos/id/42/400/400'">
                ${discount ? `<div class="detail-discount-badge">🔥 ${escapeHtml(discount)}</div>` : ''}
            </div>
            
            <div class="detail-info">
                <h1 class="detail-title">${title}</h1>
                
                <div class="detail-price-block">
                    ${originalPrice ? `<span class="detail-old-price">${escapeHtml(originalPrice)}</span>` : ''}
                    <span class="detail-current-price">${price}</span>
                </div>
                
                <div class="detail-meta">
                    <div class="detail-seller">
                        <i class="fas fa-store"></i> Продавец: <strong>${seller}</strong>
                    </div>
                    <div class="detail-sales">
                        <i class="fas fa-chart-line"></i> ${sales} продаж
                    </div>
                    <div class="detail-date">
                        <i class="fas fa-calendar-alt"></i> Добавлен: ${createdAt}
                    </div>
                </div>
                
                <div class="detail-description">
                    <h3><i class="fas fa-info-circle"></i> Описание</h3>
                    <div class="description-text">${formatDescription(description)}</div>
                </div>
                
                <div class="detail-actions">
                    <button class="buy-btn" onclick="buyProduct('${product.id}')">
                        <i class="fas fa-shopping-cart"></i> Купить сейчас
                    </button>
                    <button class="contact-seller-btn" onclick="contactSeller('${escapeHtml(seller)}')">
                        <i class="fas fa-comment"></i> Связаться с продавцом
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Форматирование описания (поддержка переносов строк)
function formatDescription(text) {
    if (!text) return 'Нет описания';
    // Заменяем переносы строк на <br>
    return text.replace(/\n/g, '<br>');
}

// Покупка товара
window.buyProduct = async function(productId) {
    const currentUser = localStorage.getItem('apex_user') || 'Гость';
    
    if (currentUser === 'Гость') {
        if (confirm('Для покупки необходимо представиться. Введите ваш никнейм?')) {
            const name = prompt('Введите ваш никнейм:');
            if (name) {
                localStorage.setItem('apex_user', name);
                window.currentUser = name;
                buyProduct(productId); // Повторяем попытку
            }
        }
        return;
    }
    
    try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) throw new Error('Товар не найден');
        const product = await response.json();
        
        // Здесь можно добавить логику покупки
        alert(`✅ Покупка товара "${product.title}"\n💰 Сумма: ${product.price}\n\n📦 Товар будет отправлен продавцом ${product.seller}\n\nСвяжитесь с продавцом для получения товара.`);
        
        // Отправляем уведомление продавцу в чат
        sendPurchaseNotification(product.seller, product.title, currentUser);
        
        closeDetail();
        
    } catch (error) {
        showToast('Ошибка при покупке', 'error');
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
    
    // Обновляем список чатов если страница открыта
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
    
    // Переключаемся на чат
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
        }, 100);
    }, 100);
};

// Функция showToast
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

// Добавляем обработчик для закрытия по клику на фон
document.addEventListener('DOMContentLoaded', function() {
    const detailPage = document.getElementById('detailPage');
    if (detailPage) {
        detailPage.addEventListener('click', function(e) {
            if (e.target === detailPage || e.target.classList.contains('detail-page')) {
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