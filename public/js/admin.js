// admin.js - ИСПРАВЛЕННАЯ ВЕРСИЯ (только ключевые разделы)

let keywords = [];
let gameBlocks = [];
let appBlocks = [];
let admins = [];
let pendingProducts = [];
let adminCurrentDialogId = null;
let adminDialogs = [];

const ADMIN_PASSWORD = "admin123";

// Обновляем функцию initAdmin
async function initAdmin() {
    console.log("initAdmin started");
    await loadKeywords();
    await loadPendingProducts();
    await loadAdminProducts();
    await loadGameBlocks();
    await loadAppBlocks();
    await loadAdmins();
    await loadAdminDialogs();
    await renderGamesBlocks();
    await renderAppsBlocks();
    renderAdminsList();
    renderAdminDialogsList();
    setupAdminChatListeners();
    renderAdminNavButtons();
    updateAdminStats();
}

// ========== КЛЮЧЕВЫЕ СЛОВА (ИСПРАВЛЕННЫЕ) ==========

async function loadKeywords() {
    try {
        const response = await fetch('/api/keywords');
        if (!response.ok) throw new Error('Ошибка загрузки ключевых слов');
        keywords = await response.json();
        console.log('✅ Ключевые слова загружены:', keywords.length);
        renderKeywordsList(); // Исправлено: вызываем правильную функцию
        updateKeywordSelect();
        updateGameKeywordSelect();
        updateAppKeywordSelect();
    } catch(e) {
        console.error('Ошибка загрузки ключевых слов:', e);
        keywords = [];
    }
}

// Функция отображения ключевых слов (была renderKeywords, переименована)
function renderKeywordsList() {
    const container = document.getElementById("keywordsList");
    if (!container) return;
    
    if (!keywords || keywords.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет ключевых слов</div>';
        return;
    }
    
    container.innerHTML = keywords.map(k => `
        <div class="keyword-item">
            <div class="keyword-info">
                <span class="keyword-name">${escapeHtml(k.name)}</span>
                <span class="keyword-type">${escapeHtml(k.type || 'Стандарт')}</span>
            </div>
            <div class="keyword-actions">
                <button class="delete-keyword-btn" onclick="deleteKeyword('${k.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function addKeyword() {
    const name = document.getElementById("newKeywordName")?.value.trim();
    const type = document.getElementById("newKeywordType")?.value.trim();
    
    if (!name) {
        showToast("Введите название ключевого слова", "error");
        return;
    }
    
    try {
        const response = await fetch('/api/keywords', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, type: type || "Стандарт" })
        });
        if (!response.ok) throw new Error('Ошибка создания');
        
        await loadKeywords();
        document.getElementById("newKeywordName").value = "";
        document.getElementById("newKeywordType").value = "";
        showToast(`✅ Ключевое слово "${name}" добавлено!`, "success");
    } catch(e) {
        showToast("❌ Ошибка: " + e.message, "error");
    }
}

async function deleteKeyword(keywordId) {
    if (!confirm("Удалить это ключевое слово?")) return;
    try {
        const response = await fetch(`/api/keywords/${keywordId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Ошибка удаления');
        await loadKeywords();
        showToast("✅ Ключевое слово удалено", "success");
    } catch(e) {
        showToast("❌ Ошибка: " + e.message, "error");
    }
}

function updateKeywordSelect() {
    const select = document.getElementById("postKeyword");
    if (!select) return;
    
    select.innerHTML = '<option value="">Выберите ключевое слово/категорию</option>';
    keywords.forEach(k => {
        select.innerHTML += `<option value="${escapeHtml(k.id)}">${escapeHtml(k.name)} - ${escapeHtml(k.type || 'Стандарт')}</option>`;
    });
}

function updateGameKeywordSelect() {
    const select = document.getElementById("newGameKeyword");
    if (!select) return;
    
    select.innerHTML = '<option value="">Без привязки к ключевому слову</option>';
    keywords.forEach(k => {
        select.innerHTML += `<option value="${escapeHtml(k.id)}">${escapeHtml(k.name)} - ${escapeHtml(k.type || 'Стандарт')}</option>`;
    });
}

function updateAppKeywordSelect() {
    const select = document.getElementById("newAppKeyword");
    if (!select) return;
    
    select.innerHTML = '<option value="">Без привязки к ключевому слову</option>';
    keywords.forEach(k => {
        select.innerHTML += `<option value="${escapeHtml(k.id)}">${escapeHtml(k.name)} - ${escapeHtml(k.type || 'Стандарт')}</option>`;
    });
}

// ========== ОСТАЛЬНЫЕ ФУНКЦИИ (без изменений, кроме вызовов) ==========

async function loadPendingProducts() {
    try {
        const response = await fetch('/api/pending-products');
        if (!response.ok) throw new Error('Ошибка загрузки');
        pendingProducts = await response.json();
        renderPendingProductsList();
        updateAdminStats();
    } catch(e) {
        console.error('Ошибка загрузки pending:', e);
        pendingProducts = [];
    }
}

function renderPendingProductsList() {
    const container = document.getElementById("pendingProductsList");
    if (!container) return;
    
    if (pendingProducts.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i> Нет товаров на модерации</div>';
        return;
    }
    
    container.innerHTML = pendingProducts.map(product => `
        <div class="pending-product-item">
            <div class="pending-product-img">
                <img src="${escapeHtml(product.image_url || 'https://picsum.photos/id/42/50/50')}" alt="">
            </div>
            <div class="pending-product-info">
                <div class="pending-product-title">${escapeHtml(product.title)}</div>
                <div class="pending-product-price">${escapeHtml(product.price)}</div>
                <div class="pending-product-seller">Продавец: ${escapeHtml(product.seller)}</div>
                <div class="pending-product-date">Создан: ${new Date(product.created_at).toLocaleString()}</div>
            </div>
            <div class="pending-product-actions">
                <button class="approve-product-btn" onclick="approveProduct('${product.id}')">
                    <i class="fas fa-check"></i> Одобрить
                </button>
                <button class="reject-product-btn" onclick="rejectProduct('${product.id}')">
                    <i class="fas fa-times"></i> Отклонить
                </button>
            </div>
        </div>
    `).join('');
}

async function approveProduct(productId) {
    try {
        const response = await fetch(`/api/approve-product/${productId}`, { method: 'POST' });
        if (!response.ok) throw new Error('Ошибка одобрения');
        
        await loadPendingProducts();
        await loadAdminProducts();
        if (typeof window.loadProducts === 'function') await window.loadProducts();
        showToast("✅ Товар одобрен и опубликован", "success");
    } catch(e) {
        showToast("❌ Ошибка: " + e.message, "error");
    }
}

async function rejectProduct(productId) {
    if (!confirm("Отклонить товар?")) return;
    try {
        const response = await fetch(`/api/pending-products/${productId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Ошибка отклонения');
        
        await loadPendingProducts();
        showToast("❌ Товар отклонён", "warning");
    } catch(e) {
        showToast("❌ Ошибка: " + e.message, "error");
    }
}

// ========== ТОВАРЫ ==========

async function loadAdminProducts() {
    const container = document.getElementById("adminProductsList");
    if (!container) return;
    
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Ошибка загрузки');
        const products = await response.json();
        
        if (products.length === 0) {
            container.innerHTML = "<div style='color: var(--text-muted); text-align: center; padding: 20px;'>Нет товаров</div>";
        } else {
            container.innerHTML = products.map(p => `
                <div class="admin-product-item">
                    <div class="admin-product-info">
                        <div class="admin-product-title">${escapeHtml(p.title)}</div>
                        <div class="admin-product-price">${escapeHtml(p.price)}</div>
                        <div class="admin-product-keyword">${escapeHtml(p.keyword || 'Без категории')}</div>
                        <div class="admin-product-seller">Продавец: ${escapeHtml(p.seller)}</div>
                    </div>
                    <div class="admin-product-actions">
                        <button class="admin-edit-btn" onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i></button>
                        <button class="admin-delete-btn" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('');
        }
        
        const countSpan = document.getElementById("adminProductsCount");
        if (countSpan) countSpan.innerText = products.length;
    } catch(e) {
        console.error('Ошибка загрузки товаров:', e);
        container.innerHTML = "<div style='color: red;'>Ошибка загрузки</div>";
    }
}

async function createAdminProduct() {
    const keywordId = document.getElementById("postKeyword")?.value;
    const title = document.getElementById("postTitle")?.value.trim();
    const price = document.getElementById("postPrice")?.value.trim();
    const discount = document.getElementById("postDiscount")?.value.trim();
    const description = document.getElementById("postDescription")?.value.trim();
    const imageUrl = document.getElementById("postImageUrl")?.value.trim();
    const seller = document.getElementById("postSeller")?.value.trim() || localStorage.getItem("apex_user") || "Admin";
    
    if (!keywordId || !title || !price) {
        showToast("Заполните ключевое слово, название и цену", "error");
        return;
    }
    
    let keywordName = "Без категории";
    const kw = keywords.find(k => k.id === keywordId);
    if (kw) keywordName = kw.name;
    
    const productData = {
        title: title,
        price: price,
        seller: seller,
        keyword: keywordName,
        image_url: imageUrl || "https://picsum.photos/id/42/400/200",
        description: description || "Новый товар от администратора",
        discount: discount || null
    };
    
    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        if (!response.ok) throw new Error('Ошибка создания');
        
        showToast("✅ Товар создан и сразу опубликован", "success");
        
        document.getElementById("postTitle").value = "";
        document.getElementById("postPrice").value = "";
        document.getElementById("postDiscount").value = "";
        document.getElementById("postDescription").value = "";
        document.getElementById("postImageUrl").value = "";
        document.getElementById("postSeller").value = "";
        document.getElementById("postKeyword").value = "";
        
        await loadAdminProducts();
        if (typeof window.loadProducts === 'function') await window.loadProducts();
    } catch(e) {
        showToast("❌ Ошибка: " + e.message, "error");
    }
}

async function deleteProduct(productId) {
    if (!confirm("Удалить этот товар?")) return;
    try {
        const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Ошибка удаления');
        
        await loadAdminProducts();
        if (typeof window.loadProducts === 'function') await window.loadProducts();
        showToast("✅ Товар удалён", "success");
    } catch(e) {
        showToast("❌ Ошибка: " + e.message, "error");
    }
}

// ========== БЛОКИ ИГР ==========

async function loadGameBlocks() {
    try {
        const response = await fetch('/api/game-blocks');
        if (!response.ok) throw new Error('Ошибка загрузки');
        gameBlocks = await response.json();
        renderGamesBlocks();
        renderHomeGameBlocks();
    } catch(e) {
        console.error('Ошибка загрузки игр:', e);
        gameBlocks = [];
    }
}

async function renderGamesBlocks() {
    const container = document.getElementById("gamesBlocksList");
    if (!container) return;
    
    if (gameBlocks.length === 0) {
        container.innerHTML = "<div style='color: var(--text-muted);'>Нет блоков игр</div>";
        return;
    }
    
    container.innerHTML = gameBlocks.map(block => `
        <div class="game-block-item">
            <div class="game-block-info">
                <div class="game-block-icon">
                    ${block.image_url ? 
                        `<img src="${escapeHtml(block.image_url)}" alt="${escapeHtml(block.name)}">` : 
                        `<i class="${block.icon || 'fas fa-gamepad'}"></i>`
                    }
                </div>
                <div>
                    <div class="game-block-name">${escapeHtml(block.name)}</div>
                    <div class="game-block-keyword">${block.keyword_id ? '🔗 Привязан к ключевому слову' : '📌 Без привязки'}</div>
                </div>
            </div>
            <div class="game-block-actions">
                <button class="edit-game-btn" onclick="editGameBlock('${block.id}')"><i class="fas fa-edit"></i></button>
                <button class="delete-game-btn" onclick="deleteGameBlock('${block.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function renderHomeGameBlocks() {
    const container = document.getElementById("gamesScrollWrapper");
    if (!container) return;
    
    if (gameBlocks.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); padding: 20px;">Нет блоков</div>';
        return;
    }
    
    container.innerHTML = gameBlocks.map(block => `
        <div class="game-card" onclick="openKeywordPage('${escapeHtml(block.name)}')">
            <div class="game-icon">
                ${block.image_url ? 
                    `<img src="${escapeHtml(block.image_url)}" alt="${escapeHtml(block.name)}">` : 
                    `<i class="${block.icon || 'fas fa-gamepad'}"></i>`
                }
            </div>
            <div class="game-name">${escapeHtml(block.name)}</div>
        </div>
    `).join('');
}

async function deleteGameBlock(id) {
    if (confirm("Удалить этот блок?")) {
        try {
            await fetch(`/api/game-blocks/${id}`, { method: 'DELETE' });
            await loadGameBlocks();
            showToast("✅ Блок удален", "success");
        } catch(e) {
            showToast("❌ Ошибка: " + e.message, "error");
        }
    }
}

// ========== БЛОКИ ПРИЛОЖЕНИЙ ==========

async function loadAppBlocks() {
    try {
        const response = await fetch('/api/app-blocks');
        if (!response.ok) throw new Error('Ошибка загрузки');
        appBlocks = await response.json();
        renderAppsBlocks();
        renderHomeAppBlocks();
    } catch(e) {
        console.error('Ошибка загрузки приложений:', e);
        appBlocks = [];
    }
}

async function renderAppsBlocks() {
    const container = document.getElementById("appsBlocksList");
    if (!container) return;
    
    if (appBlocks.length === 0) {
        container.innerHTML = "<div style='color: var(--text-muted);'>Нет блоков приложений</div>";
        return;
    }
    
    container.innerHTML = appBlocks.map(block => `
        <div class="game-block-item">
            <div class="game-block-info">
                <div class="game-block-icon">
                    ${block.image_url ? 
                        `<img src="${escapeHtml(block.image_url)}" alt="${escapeHtml(block.name)}">` : 
                        `<i class="${block.icon || 'fab fa-android'}"></i>`
                    }
                </div>
                <div>
                    <div class="game-block-name">${escapeHtml(block.name)}</div>
                    <div class="game-block-keyword">${block.keyword_id ? '🔗 Привязан к ключевому слову' : '📌 Без привязки'}</div>
                </div>
            </div>
            <div class="game-block-actions">
                <button class="edit-game-btn" onclick="editAppBlock('${block.id}')"><i class="fas fa-edit"></i></button>
                <button class="delete-game-btn" onclick="deleteAppBlock('${block.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function renderHomeAppBlocks() {
    const container = document.getElementById("appsScrollWrapper");
    if (!container) return;
    
    if (appBlocks.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); padding: 20px;">Нет блоков</div>';
        return;
    }
    
    container.innerHTML = appBlocks.map(block => `
        <div class="game-card" onclick="openKeywordPage('${escapeHtml(block.name)}')">
            <div class="game-icon">
                ${block.image_url ? 
                    `<img src="${escapeHtml(block.image_url)}" alt="${escapeHtml(block.name)}">` : 
                    `<i class="${block.icon || 'fab fa-android'}"></i>`
                }
            </div>
            <div class="game-name">${escapeHtml(block.name)}</div>
        </div>
    `).join('');
}

async function deleteAppBlock(id) {
    if (confirm("Удалить этот блок?")) {
        try {
            await fetch(`/api/app-blocks/${id}`, { method: 'DELETE' });
            await loadAppBlocks();
            showToast("✅ Блок удален", "success");
        } catch(e) {
            showToast("❌ Ошибка: " + e.message, "error");
        }
    }
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function showToast(message, type = 'success') {
    let toast = document.getElementById('adminToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'adminToast';
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }
    
    const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle');
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    toast.className = `toast-notification ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ========== ЭКСПОРТ ==========

window.initAdmin = initAdmin;
window.loadKeywords = loadKeywords;
window.addKeyword = addKeyword;
window.deleteKeyword = deleteKeyword;
window.approveProduct = approveProduct;
window.rejectProduct = rejectProduct;
window.createAdminProduct = createAdminProduct;
window.deleteProduct = deleteProduct;
window.loadGameBlocks = loadGameBlocks;
window.loadAppBlocks = loadAppBlocks;
window.deleteGameBlock = deleteGameBlock;
window.deleteAppBlock = deleteAppBlock;
window.showToast = showToast;