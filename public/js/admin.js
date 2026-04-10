// admin.js - ПРОСТЕЙШАЯ ВЕРСИЯ ДЛЯ ТЕСТА

let keywords = [];
let gameBlocks = [];
let appBlocks = [];
let pendingProducts = [];

const ADMIN_PASSWORD = "admin123";

// ========== ГЛАВНАЯ ИНИЦИАЛИЗАЦИЯ ==========
async function initAdmin() {
    console.log("🔵 INIT ADMIN STARTED");
    
    // Загружаем ключевые слова
    try {
        const res = await fetch('/api/keywords');
        keywords = await res.json();
        console.log("✅ Загружено ключевых слов:", keywords.length);
        renderKeywords();
    } catch(e) { console.error("Ошибка загрузки ключевых слов:", e); }
    
    // Загружаем товары на модерации
    try {
        const res = await fetch('/api/pending-products');
        pendingProducts = await res.json();
        console.log("✅ Загружено товаров на модерации:", pendingProducts.length);
        renderPendingProducts();
    } catch(e) { console.error("Ошибка загрузки pending:", e); }
    
    // Загружаем блоки игр
    try {
        const res = await fetch('/api/game-blocks');
        gameBlocks = await res.json();
        console.log("✅ Загружено блоков игр:", gameBlocks.length);
        renderGameBlocksList();
    } catch(e) { console.error("Ошибка загрузки игр:", e); }
    
    // Загружаем блоки приложений
    try {
        const res = await fetch('/api/app-blocks');
        appBlocks = await res.json();
        console.log("✅ Загружено блоков приложений:", appBlocks.length);
        renderAppBlocksList();
    } catch(e) { console.error("Ошибка загрузки приложений:", e); }
    
    // Загружаем товары для админки
    try {
        const res = await fetch('/api/products');
        const products = await res.json();
        console.log("✅ Загружено товаров:", products.length);
        renderAdminProducts(products);
        const countSpan = document.getElementById("adminProductsCount");
        if (countSpan) countSpan.innerText = products.length;
    } catch(e) { console.error("Ошибка загрузки товаров:", e); }
    
    // Показываем секции
    showAdminSection('adminMainSection');
    renderAdminNavButtons();
    
    console.log("🔵 INIT ADMIN FINISHED");
}

// ========== ОТОБРАЖЕНИЕ КЛЮЧЕВЫХ СЛОВ ==========
function renderKeywords() {
    const container = document.getElementById("keywordsList");
    if (!container) return;
    if (!keywords.length) {
        container.innerHTML = '<div class="empty-state">Нет ключевых слов</div>';
        return;
    }
    container.innerHTML = keywords.map(k => `
        <div class="keyword-item">
            <div class="keyword-info">
                <span class="keyword-name">${escapeHtml(k.name)}</span>
                <span class="keyword-type">${escapeHtml(k.type)}</span>
            </div>
            <div class="keyword-actions">
                <button class="delete-keyword-btn" onclick="deleteKeyword('${k.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

// ========== ДОБАВЛЕНИЕ КЛЮЧЕВОГО СЛОВА ==========
async function addKeyword() {
    const name = document.getElementById("newKeywordName")?.value.trim();
    const type = document.getElementById("newKeywordType")?.value.trim();
    if (!name) { alert("Введите название"); return; }
    
    try {
        const res = await fetch('/api/keywords', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, type: type || "Стандарт" })
        });
        if (!res.ok) throw new Error('Ошибка');
        const result = await res.json();
        console.log("Ключевое слово добавлено:", result);
        
        // Перезагружаем
        const reloadRes = await fetch('/api/keywords');
        keywords = await reloadRes.json();
        renderKeywords();
        
        document.getElementById("newKeywordName").value = "";
        document.getElementById("newKeywordType").value = "";
        alert("✅ Ключевое слово добавлено!");
    } catch(e) { alert("Ошибка: " + e.message); }
}

// ========== УДАЛЕНИЕ КЛЮЧЕВОГО СЛОВА ==========
async function deleteKeyword(id) {
    if (!confirm("Удалить?")) return;
    try {
        const res = await fetch(`/api/keywords/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Ошибка');
        
        const reloadRes = await fetch('/api/keywords');
        keywords = await reloadRes.json();
        renderKeywords();
        alert("✅ Удалено!");
    } catch(e) { alert("Ошибка: " + e.message); }
}

// ========== ОТОБРАЖЕНИЕ ТОВАРОВ НА МОДЕРАЦИИ ==========
function renderPendingProducts() {
    const container = document.getElementById("pendingProductsList");
    if (!container) return;
    if (!pendingProducts.length) {
        container.innerHTML = '<div class="empty-state">Нет товаров на модерации</div>';
        return;
    }
    container.innerHTML = pendingProducts.map(p => `
        <div class="pending-product-item">
            <div class="pending-product-info">
                <div class="pending-product-title">${escapeHtml(p.title)}</div>
                <div class="pending-product-price">${escapeHtml(p.price)}</div>
                <div class="pending-product-seller">Продавец: ${escapeHtml(p.seller)}</div>
            </div>
            <div class="pending-product-actions">
                <button onclick="approveProduct('${p.id}')">✅ Одобрить</button>
                <button onclick="rejectProduct('${p.id}')">❌ Отклонить</button>
            </div>
        </div>
    `).join('');
}

async function approveProduct(id) {
    try {
        const res = await fetch(`/api/approve-product/${id}`, { method: 'POST' });
        if (!res.ok) throw new Error('Ошибка');
        
        // Обновляем списки
        const pendingRes = await fetch('/api/pending-products');
        pendingProducts = await pendingRes.json();
        renderPendingProducts();
        
        const productsRes = await fetch('/api/products');
        const products = await productsRes.json();
        renderAdminProducts(products);
        
        if (typeof window.loadProducts === 'function') await window.loadProducts();
        
        alert("✅ Товар одобрен!");
    } catch(e) { alert("Ошибка: " + e.message); }
}

async function rejectProduct(id) {
    if (!confirm("Отклонить?")) return;
    try {
        const res = await fetch(`/api/pending-products/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Ошибка');
        
        const reloadRes = await fetch('/api/pending-products');
        pendingProducts = await reloadRes.json();
        renderPendingProducts();
        alert("❌ Товар отклонен!");
    } catch(e) { alert("Ошибка: " + e.message); }
}

// ========== ОТОБРАЖЕНИЕ БЛОКОВ ИГР ==========
function renderGameBlocksList() {
    const container = document.getElementById("gamesBlocksList");
    if (!container) return;
    if (!gameBlocks.length) {
        container.innerHTML = "<div>Нет блоков игр</div>";
        return;
    }
    container.innerHTML = gameBlocks.map(b => `
        <div class="game-block-item">
            <div class="game-block-info">
                <div class="game-block-name">${escapeHtml(b.name)}</div>
            </div>
            <div class="game-block-actions">
                <button onclick="deleteGameBlock('${b.id}')"><i class="fas fa-trash"></i> Удалить</button>
            </div>
        </div>
    `).join('');
}

async function addGameBlock() {
    const name = document.getElementById("newGameName")?.value.trim();
    if (!name) { alert("Введите название"); return; }
    
    const newBlock = {
        id: Date.now().toString(),
        name: name,
        icon: "fas fa-gamepad",
        sort_order: gameBlocks.length
    };
    
    try {
        const res = await fetch('/api/game-blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBlock)
        });
        if (!res.ok) throw new Error('Ошибка');
        
        const reloadRes = await fetch('/api/game-blocks');
        gameBlocks = await reloadRes.json();
        renderGameBlocksList();
        
        document.getElementById("newGameName").value = "";
        alert("✅ Блок игры добавлен!");
    } catch(e) { alert("Ошибка: " + e.message); }
}

async function deleteGameBlock(id) {
    if (!confirm("Удалить блок?")) return;
    try {
        const res = await fetch(`/api/game-blocks/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Ошибка');
        
        const reloadRes = await fetch('/api/game-blocks');
        gameBlocks = await reloadRes.json();
        renderGameBlocksList();
        alert("✅ Блок удален!");
    } catch(e) { alert("Ошибка: " + e.message); }
}

// ========== ОТОБРАЖЕНИЕ БЛОКОВ ПРИЛОЖЕНИЙ ==========
function renderAppBlocksList() {
    const container = document.getElementById("appsBlocksList");
    if (!container) return;
    if (!appBlocks.length) {
        container.innerHTML = "<div>Нет блоков приложений</div>";
        return;
    }
    container.innerHTML = appBlocks.map(b => `
        <div class="game-block-item">
            <div class="game-block-info">
                <div class="game-block-name">${escapeHtml(b.name)}</div>
            </div>
            <div class="game-block-actions">
                <button onclick="deleteAppBlock('${b.id}')"><i class="fas fa-trash"></i> Удалить</button>
            </div>
        </div>
    `).join('');
}

async function addAppBlock() {
    const name = document.getElementById("newAppName")?.value.trim();
    if (!name) { alert("Введите название"); return; }
    
    const newBlock = {
        id: "app_" + Date.now(),
        name: name,
        icon: "fab fa-android",
        sort_order: appBlocks.length
    };
    
    try {
        const res = await fetch('/api/app-blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBlock)
        });
        if (!res.ok) throw new Error('Ошибка');
        
        const reloadRes = await fetch('/api/app-blocks');
        appBlocks = await reloadRes.json();
        renderAppBlocksList();
        
        document.getElementById("newAppName").value = "";
        alert("✅ Блок приложения добавлен!");
    } catch(e) { alert("Ошибка: " + e.message); }
}

async function deleteAppBlock(id) {
    if (!confirm("Удалить блок?")) return;
    try {
        const res = await fetch(`/api/app-blocks/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Ошибка');
        
        const reloadRes = await fetch('/api/app-blocks');
        appBlocks = await reloadRes.json();
        renderAppBlocksList();
        alert("✅ Блок удален!");
    } catch(e) { alert("Ошибка: " + e.message); }
}

// ========== ОТОБРАЖЕНИЕ ТОВАРОВ ==========
function renderAdminProducts(products) {
    const container = document.getElementById("adminProductsList");
    if (!container) return;
    if (!products.length) {
        container.innerHTML = "<div>Нет товаров</div>";
        return;
    }
    container.innerHTML = products.map(p => `
        <div class="admin-product-item">
            <div class="admin-product-info">
                <div class="admin-product-title">${escapeHtml(p.title)}</div>
                <div class="admin-product-price">${escapeHtml(p.price)}</div>
            </div>
            <div class="admin-product-actions">
                <button onclick="deleteProductAdmin('${p.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

async function createAdminProduct() {
    const title = document.getElementById("postTitle")?.value.trim();
    const price = document.getElementById("postPrice")?.value.trim();
    const seller = document.getElementById("postSeller")?.value.trim() || "Admin";
    
    if (!title || !price) { alert("Заполните название и цену"); return; }
    
    const productData = {
        title: title,
        price: price,
        seller: seller,
        keyword: "Общее",
        image_url: "https://picsum.photos/id/42/400/200",
        description: "Новый товар"
    };
    
    try {
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        if (!res.ok) throw new Error('Ошибка');
        
        // Обновляем список
        const reloadRes = await fetch('/api/products');
        const products = await reloadRes.json();
        renderAdminProducts(products);
        
        document.getElementById("postTitle").value = "";
        document.getElementById("postPrice").value = "";
        document.getElementById("postSeller").value = "";
        alert("✅ Товар создан!");
    } catch(e) { alert("Ошибка: " + e.message); }
}

async function deleteProductAdmin(id) {
    if (!confirm("Удалить товар?")) return;
    try {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Ошибка');
        
        const reloadRes = await fetch('/api/products');
        const products = await reloadRes.json();
        renderAdminProducts(products);
        alert("✅ Товар удален!");
    } catch(e) { alert("Ошибка: " + e.message); }
}

// ========== НАВИГАЦИЯ ==========
function renderAdminNavButtons() {
    const container = document.getElementById("adminNavButtons");
    if (!container) return;
    container.innerHTML = `
        <button onclick="showAdminSection('adminMainSection')">📊 Главная</button>
        <button onclick="showAdminSection('adminKeywordsSection')">🏷️ Ключевые слова</button>
        <button onclick="showAdminSection('adminModerationSection')">📝 Модерация</button>
        <button onclick="showAdminSection('adminGamesSection')">🎮 Игры</button>
        <button onclick="showAdminSection('adminAppsSection')">📱 Приложения</button>
        <button onclick="showAdminSection('adminProductsSection')">📦 Товары</button>
    `;
}

function showAdminSection(sectionId) {
    const sections = ["adminMainSection", "adminKeywordsSection", "adminModerationSection", "adminGamesSection", "adminAppsSection", "adminProductsSection"];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
    const target = document.getElementById(sectionId);
    if (target) target.style.display = "block";
}

// ========== ВХОД В АДМИНКУ ==========
function toggleAdminPanel() {
    const password = prompt("Введите пароль:");
    if (password === ADMIN_PASSWORD) {
        showAdminUI();
    } else {
        alert("Неверный пароль!");
    }
}

function showAdminUI() {
    const adminBtn = document.getElementById("adminToggleBtn");
    if (adminBtn) {
        adminBtn.style.background = "#3b82f6";
    }
    if (typeof navigate === 'function') navigate("admin");
    else if (typeof showPage === 'function') showPage("admin");
    initAdmin();
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ==========
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

// ========== ЭКСПОРТ ==========
window.initAdmin = initAdmin;
window.toggleAdminPanel = toggleAdminPanel;
window.addKeyword = addKeyword;
window.deleteKeyword = deleteKeyword;
window.approveProduct = approveProduct;
window.rejectProduct = rejectProduct;
window.addGameBlock = addGameBlock;
window.deleteGameBlock = deleteGameBlock;
window.addAppBlock = addAppBlock;
window.deleteAppBlock = deleteAppBlock;
window.createAdminProduct = createAdminProduct;
window.deleteProductAdmin = deleteProductAdmin;
window.showAdminSection = showAdminSection;

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded");
    // Не вызываем initAdmin автоматически, только по кнопке
});