// admin.js - ПОЛНАЯ АДМИН-ПАНЕЛЬ С СИНХРОНИЗАЦИЕЙ С СЕРВЕРОМ

let keywords = [];
let gameBlocks = [];
let appBlocks = [];
let admins = [];
let pendingProducts = [];

const ADMIN_PASSWORD = "admin123";

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
async function initAdmin() {
    console.log("initAdmin started");
    await Promise.all([
        loadKeywords(),
        loadPendingProducts(),
        loadAdminProducts(),
        loadGameBlocks(),
        loadAppBlocks(),
        loadAdmins()
    ]);
    renderGamesBlocks();
    renderAppsBlocks();
    renderAdminsList();
    renderAdminNavButtons();
    updateAdminStats();
    setupEventListeners();
}

// ==================== ЗАГРУЗКА ДАННЫХ ====================
async function loadKeywords() {
    try {
        keywords = await API.getKeywords();
        renderKeywords();
        updateKeywordSelects();
    } catch(e) { console.error(e); keywords = []; }
}

async function loadGameBlocks() {
    try {
        gameBlocks = await API.getGameBlocks();
        renderGamesBlocks();
        renderHomeGameBlocks();
    } catch(e) { console.error(e); gameBlocks = []; }
}

async function loadAppBlocks() {
    try {
        appBlocks = await API.getAppBlocks();
        renderAppsBlocks();
        renderHomeAppBlocks();
    } catch(e) { console.error(e); appBlocks = []; }
}

async function loadPendingProducts() {
    try {
        pendingProducts = await API.getPendingProducts();
        renderPendingProductsList();
        updateAdminStats();
    } catch(e) { console.error(e); pendingProducts = []; }
}

async function loadAdminProducts() {
    try {
        const products = await API.getProducts();
        const container = document.getElementById("adminProductsList");
        if (container) {
            if (products.length === 0) container.innerHTML = "<div>Нет товаров</div>";
            else {
                container.innerHTML = products.map(p => `
                    <div class="admin-product-item">
                        <div class="admin-product-info">
                            <div class="admin-product-title">${escapeHtml(p.title)}</div>
                            <div class="admin-product-price">${escapeHtml(p.price)}</div>
                            <div class="admin-product-seller">${escapeHtml(p.seller)}</div>
                        </div>
                        <div class="admin-product-actions">
                            <button class="admin-delete-btn" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `).join('');
            }
        }
        document.getElementById("adminProductsCount").innerText = products.length;
    } catch(e) { console.error(e); }
}

async function loadAdmins() {
    try {
        admins = await API.getAdmins();
        renderAdminsList();
    } catch(e) { console.error(e); admins = []; }
}

// ==================== ОТРИСОВКА ====================
function renderKeywords() {
    const container = document.getElementById("keywordsList");
    if (!container) return;
    if (keywords.length === 0) { container.innerHTML = '<div class="empty-state">Нет ключевых слов</div>'; return; }
    container.innerHTML = keywords.map(k => `
        <div class="keyword-item">
            <div class="keyword-info">
                <span class="keyword-name">${escapeHtml(k.name)}</span>
                <span class="keyword-type">${escapeHtml(k.type || 'Стандарт')}</span>
            </div>
            <div class="keyword-actions">
                <button class="delete-keyword-btn" onclick="deleteKeyword('${k.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function renderGamesBlocks() {
    const container = document.getElementById("gamesBlocksList");
    if (!container) return;
    if (gameBlocks.length === 0) { container.innerHTML = "<div>Нет блоков игр</div>"; return; }
    container.innerHTML = gameBlocks.map(block => `
        <div class="game-block-item">
            <div class="game-block-info">
                <div class="game-block-icon">
                    ${block.image_url ? `<img src="${escapeHtml(block.image_url)}">` : `<i class="${block.icon}"></i>`}
                </div>
                <div>
                    <div class="game-block-name">${escapeHtml(block.name)}</div>
                    <div class="game-block-keyword">${block.keyword_id ? '🔗 Привязан' : '📌 Без привязки'}</div>
                </div>
            </div>
            <div class="game-block-actions">
                <button class="edit-game-btn" onclick="editGameBlock('${block.id}')"><i class="fas fa-edit"></i></button>
                <button class="delete-game-btn" onclick="deleteGameBlock('${block.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function renderAppsBlocks() {
    const container = document.getElementById("appsBlocksList");
    if (!container) return;
    if (appBlocks.length === 0) { container.innerHTML = "<div>Нет блоков приложений</div>"; return; }
    container.innerHTML = appBlocks.map(block => `
        <div class="game-block-item">
            <div class="game-block-info">
                <div class="game-block-icon">
                    ${block.image_url ? `<img src="${escapeHtml(block.image_url)}">` : `<i class="${block.icon}"></i>`}
                </div>
                <div>
                    <div class="game-block-name">${escapeHtml(block.name)}</div>
                    <div class="game-block-keyword">${block.keyword_id ? '🔗 Привязан' : '📌 Без привязки'}</div>
                </div>
            </div>
            <div class="game-block-actions">
                <button class="edit-game-btn" onclick="editAppBlock('${block.id}')"><i class="fas fa-edit"></i></button>
                <button class="delete-game-btn" onclick="deleteAppBlock('${block.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function renderHomeGameBlocks() {
    const container = document.getElementById("gamesScrollWrapper");
    if (!container) return;
    if (gameBlocks.length === 0) { container.innerHTML = '<div>Нет блоков</div>'; return; }
    container.innerHTML = gameBlocks.map(block => {
        let keywordName = block.name;
        if (block.keyword_id) {
            const kw = keywords.find(k => k.id === block.keyword_id);
            if (kw) keywordName = kw.name;
        }
        return `
            <div class="game-card" onclick="openKeywordPage('${escapeHtml(keywordName)}')">
                <div class="game-icon">
                    ${block.image_url ? `<img src="${escapeHtml(block.image_url)}">` : `<i class="${block.icon}"></i>`}
                </div>
                <div class="game-name">${escapeHtml(block.name)}</div>
            </div>
        `;
    }).join('');
}

function renderHomeAppBlocks() {
    const container = document.getElementById("appsScrollWrapper");
    if (!container) return;
    if (appBlocks.length === 0) { container.innerHTML = '<div>Нет блоков</div>'; return; }
    container.innerHTML = appBlocks.map(block => {
        let keywordName = block.name;
        if (block.keyword_id) {
            const kw = keywords.find(k => k.id === block.keyword_id);
            if (kw) keywordName = kw.name;
        }
        return `
            <div class="game-card" onclick="openKeywordPage('${escapeHtml(keywordName)}')">
                <div class="game-icon">
                    ${block.image_url ? `<img src="${escapeHtml(block.image_url)}">` : `<i class="${block.icon}"></i>`}
                </div>
                <div class="game-name">${escapeHtml(block.name)}</div>
            </div>
        `;
    }).join('');
}

function renderPendingProductsList() {
    const container = document.getElementById("pendingProductsList");
    if (!container) return;
    if (pendingProducts.length === 0) { container.innerHTML = '<div class="empty-state">Нет товаров на модерации</div>'; return; }
    container.innerHTML = pendingProducts.map(p => `
        <div class="pending-product-item">
            <div class="pending-product-info">
                <div class="pending-product-title">${escapeHtml(p.title)}</div>
                <div class="pending-product-price">${escapeHtml(p.price)}</div>
                <div class="pending-product-seller">${escapeHtml(p.seller)}</div>
            </div>
            <div class="pending-product-actions">
                <button class="approve-product-btn" onclick="approveProduct('${p.id}')"><i class="fas fa-check"></i> Одобрить</button>
                <button class="reject-product-btn" onclick="rejectProduct('${p.id}')"><i class="fas fa-times"></i> Отклонить</button>
            </div>
        </div>
    `).join('');
}

function renderAdminsList() {
    const container = document.getElementById("adminsList");
    if (!container) return;
    if (admins.length === 0) { container.innerHTML = '<div class="empty-state">Нет администраторов</div>'; return; }
    container.innerHTML = admins.map(admin => `
        <div class="admin-user-item">
            <div class="admin-user-info">
                <div class="admin-user-avatar"><i class="fas fa-user-shield"></i></div>
                <div>
                    <div class="admin-user-name">
                        ${escapeHtml(admin.username)}
                        ${admin.is_owner ? '<span class="owner-badge">👑 Владелец</span>' : '<span class="admin-badge">Админ</span>'}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function updateAdminStats() {
    const productsCount = document.getElementById("adminProductsCount");
    const pendingCount = document.getElementById("adminPendingCount");
    const adminsCount = document.getElementById("adminAdminsCount");
    if (productsCount) productsCount.innerText = "загрузка...";
    if (pendingCount) pendingCount.innerText = pendingProducts.length;
    if (adminsCount) adminsCount.innerText = admins.length;
}

// ==================== ОПЕРАЦИИ С КЛЮЧЕВЫМИ СЛОВАМИ ====================
async function addKeyword() {
    const name = document.getElementById("newKeywordName")?.value.trim();
    const type = document.getElementById("newKeywordType")?.value.trim();
    if (!name) { showToast("Введите название", "error"); return; }
    try {
        await API.createKeyword({ name, type: type || "Стандарт" });
        await loadKeywords();
        document.getElementById("newKeywordName").value = "";
        document.getElementById("newKeywordType").value = "";
        showToast(`✅ Ключевое слово "${name}" добавлено`, "success");
    } catch(e) { showToast("Ошибка: " + e.message, "error"); }
}

async function deleteKeyword(id) {
    if (!confirm("Удалить ключевое слово?")) return;
    try {
        await API.deleteKeyword(id);
        await loadKeywords();
        showToast("✅ Ключевое слово удалено", "success");
    } catch(e) { showToast("Ошибка: " + e.message, "error"); }
}

// ==================== ОПЕРАЦИИ С БЛОКАМИ ИГР ====================
async function addGameBlock() {
    const name = document.getElementById("newGameName")?.value.trim();
    const keywordId = document.getElementById("newGameKeyword")?.value;
    const icon = document.getElementById("newGameIcon")?.value;
    const imageUrl = document.getElementById("newGameImageUrl")?.value.trim();
    if (!name) { showToast("Введите название", "error"); return; }
    try {
        await API.createGameBlock({
            id: Date.now().toString(),
            name,
            keyword_id: keywordId || null,
            icon: icon || "fas fa-gamepad",
            image_url: imageUrl || null,
            sort_order: gameBlocks.length + 1
        });
        await loadGameBlocks();
        document.getElementById("newGameName").value = "";
        document.getElementById("newGameKeyword").value = "";
        document.getElementById("newGameImageUrl").value = "";
        showToast("✅ Блок игры добавлен", "success");
    } catch(e) { showToast("Ошибка: " + e.message, "error"); }
}

async function deleteGameBlock(id) {
    if (!confirm("Удалить блок?")) return;
    try {
        await API.deleteGameBlock(id);
        await loadGameBlocks();
        showToast("✅ Блок удален", "success");
    } catch(e) { showToast("Ошибка: " + e.message, "error"); }
}

async function editGameBlock(id) {
    const block = gameBlocks.find(b => b.id === id);
    if (!block) return;
    const newName = prompt("Новое название:", block.name);
    if (!newName) return;
    try {
        await API.updateGameBlock(id, { name: newName.trim() });
        await loadGameBlocks();
        showToast("✅ Блок обновлен", "success");
    } catch(e) { showToast("Ошибка: " + e.message, "error"); }
}

// ==================== ОПЕРАЦИИ С БЛОКАМИ ПРИЛОЖЕНИЙ ====================
async function addAppBlock() {
    const name = document.getElementById("newAppName")?.value.trim();
    const keywordId = document.getElementById("newAppKeyword")?.value;
    const icon = document.getElementById("newAppIcon")?.value;
    const imageUrl = document.getElementById("newAppImageUrl")?.value.trim();
    if (!name) { showToast("Введите название", "error"); return; }
    try {
        await API.createAppBlock({
            id: Date.now().toString(),
            name,
            keyword_id: keywordId || null,
            icon: icon || "fab fa-android",
            image_url: imageUrl || null,
            sort_order: appBlocks.length + 1
        });
        await loadAppBlocks();
        document.getElementById("newAppName").value = "";
        document.getElementById("newAppKeyword").value = "";
        document.getElementById("newAppImageUrl").value = "";
        showToast("✅ Блок приложения добавлен", "success");
    } catch(e) { showToast("Ошибка: " + e.message, "error"); }
}

async function deleteAppBlock(id) {
    if (!confirm("Удалить блок?")) return;
    try {
        await API.deleteAppBlock(id);
        await loadAppBlocks();
        showToast("✅ Блок удален", "success");
    } catch(e) { showToast("Ошибка: " + e.message, "error"); }
}

async function editAppBlock(id) {
    const block = appBlocks.find(b => b.id === id);
    if (!block) return;
    const newName = prompt("Новое название:", block.name);
    if (!newName) return;
    try {
        await API.updateAppBlock(id, { name: newName.trim() });
        await loadAppBlocks();
        showToast("✅ Блок обновлен", "success");
    } catch(e) { showToast("Ошибка: " + e.message, "error"); }
}

// ==================== МОДЕРАЦИЯ ТОВАРОВ ====================
async function approveProduct(id) {
    try {
        await API.approveProduct(id);
        await loadPendingProducts();
        await loadAdminProducts();
        if (typeof window.loadProducts === 'function') await window.loadProducts();
        showToast("✅ Товар одобрен", "success");
    } catch(e) { showToast("Ошибка: " + e.message, "error"); }
}

async function rejectProduct(id) {
    if (!confirm("Отклонить товар?")) return;
    try {
        await API.rejectProduct(id);
        await loadPendingProducts();
        showToast("❌ Товар отклонен", "success");
    } catch(e) { showToast("Ошибка: " + e.message, "error"); }
}

// ==================== УПРАВЛЕНИЕ ТОВАРАМИ (АДМИН) ====================
async function createAdminProduct() {
    const keywordId = document.getElementById("postKeyword")?.value;
    const title = document.getElementById("postTitle")?.value.trim();
    const price = document.getElementById("postPrice")?.value.trim();
    const discount = document.getElementById("postDiscount")?.value.trim();
    const description = document.getElementById("postDescription")?.value.trim();
    const imageUrl = document.getElementById("postImageUrl")?.value.trim();
    const seller = document.getElementById("postSeller")?.value.trim() || "Admin";
    if (!keywordId || !title || !price) { showToast("Заполните обязательные поля", "error"); return; }
    let keywordName = "Без категории";
    const kw = keywords.find(k => k.id === keywordId);
    if (kw) keywordName = kw.name;
    try {
        await API.createProduct({
            title, price, seller, keyword: keywordName,
            image_url: imageUrl || "https://picsum.photos/id/42/400/200",
            description: description || "Новый товар", discount: discount || null
        });
        showToast("✅ Товар создан", "success");
        document.getElementById("postTitle").value = "";
        document.getElementById("postPrice").value = "";
        document.getElementById("postDiscount").value = "";
        document.getElementById("postDescription").value = "";
        document.getElementById("postImageUrl").value = "";
        await loadAdminProducts();
        if (typeof window.loadProducts === 'function') await window.loadProducts();
    } catch(e) { showToast("Ошибка: " + e.message, "error"); }
}

async function deleteProduct(id) {
    if (!confirm("Удалить товар?")) return;
    try {
        await API.deleteProduct(id);
        await loadAdminProducts();
        if (typeof window.loadProducts === 'function') await window.loadProducts();
        showToast("✅ Товар удален", "success");
    } catch(e) { showToast("Ошибка: " + e.message, "error"); }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function updateKeywordSelects() {
    const selects = ['postKeyword', 'productKeywordSelect', 'newGameKeyword', 'newAppKeyword'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '<option value="">Выберите категорию</option>';
            keywords.forEach(k => {
                select.innerHTML += `<option value="${escapeHtml(k.id)}">${escapeHtml(k.name)} - ${escapeHtml(k.type)}</option>`;
            });
        }
    });
}

function renderAdminNavButtons() {
    const container = document.getElementById("adminNavButtons");
    if (!container) return;
    const sections = [
        { id: "adminMainSection", name: "📊 Главная", icon: "fa-tachometer-alt" },
        { id: "adminAdminsSection", name: "👥 Администраторы", icon: "fa-users" },
        { id: "adminKeywordsSection", name: "🏷️ Ключевые слова", icon: "fa-tags" },
        { id: "adminModerationSection", name: "📝 Модерация", icon: "fa-clipboard-list" },
        { id: "adminProductsSection", name: "📦 Товары", icon: "fa-box" },
        { id: "adminGamesSection", name: "🎮 Игры", icon: "fa-gamepad" },
        { id: "adminAppsSection", name: "📱 Приложения", icon: "fa-mobile-alt" }
    ];
    container.innerHTML = sections.map(s => `
        <button class="admin-nav-btn" onclick="showAdminSection('${s.id}')">
            <i class="fas ${s.icon}"></i> <span>${s.name}</span>
        </button>
    `).join('');
}

function showAdminSection(sectionId) {
    const sections = ["adminMainSection","adminAdminsSection","adminKeywordsSection","adminModerationSection","adminProductsSection","adminGamesSection","adminAppsSection"];
    sections.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = "none"; });
    const target = document.getElementById(sectionId);
    if (target) target.style.display = "block";
    document.querySelectorAll('.admin-nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = Array.from(document.querySelectorAll('.admin-nav-btn')).find(btn => btn.getAttribute('onclick')?.includes(sectionId));
    if (activeBtn) activeBtn.classList.add('active');
}

function setupEventListeners() {
    const sendBtn = document.getElementById("sendAdminChatMsgBtn");
    if (sendBtn) sendBtn.onclick = () => { /* чат */ };
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m] || m));
}

function showToast(msg, type) {
    let toast = document.getElementById('adminToast');
    if (!toast) { toast = document.createElement('div'); toast.id = 'adminToast'; toast.className = 'toast-notification'; document.body.appendChild(toast); }
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i><span>${msg}</span>`;
    toast.className = `toast-notification ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function toggleAdminPanel() {
    const pwd = prompt("Введите пароль администратора:");
    if (pwd === ADMIN_PASSWORD) {
        if (typeof navigate === 'function') navigate("admin");
        else if (typeof showPage === 'function') showPage("admin");
        initAdmin();
    } else alert("Неверный пароль!");
}

// ==================== ЭКСПОРТ ====================
window.initAdmin = initAdmin;
window.addKeyword = addKeyword;
window.deleteKeyword = deleteKeyword;
window.addGameBlock = addGameBlock;
window.deleteGameBlock = deleteGameBlock;
window.editGameBlock = editGameBlock;
window.addAppBlock = addAppBlock;
window.deleteAppBlock = deleteAppBlock;
window.editAppBlock = editAppBlock;
window.createAdminProduct = createAdminProduct;
window.deleteProduct = deleteProduct;
window.approveProduct = approveProduct;
window.rejectProduct = rejectProduct;
window.showAdminSection = showAdminSection;
window.toggleAdminPanel = toggleAdminPanel;

document.addEventListener('DOMContentLoaded', () => { if (document.getElementById('admin')) initAdmin(); });