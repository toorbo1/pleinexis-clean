// admin.js - ПОЛНАЯ АДМИН-ПАНЕЛЬ (РАБОЧАЯ ВЕРСИЯ С API)

let keywords = [];
let gameBlocks = [];
let appBlocks = [];
let admins = [];
let pendingProducts = [];
let adminCurrentDialogId = null;
let adminDialogs = [];

const ADMIN_PASSWORD = "admin123";

// ========== ИНИЦИАЛИЗАЦИЯ ==========
async function initAdmin() {
    console.log("initAdmin started");
    await loadKeywords();
    await loadPendingProducts();
    await loadAdminProducts();
    await loadGameBlocks();
    await loadAppBlocks();
    await loadAdmins();
    loadAdminDialogs();
    renderGamesBlocks();
    renderAppsBlocks();
    renderAdminsList();
    renderAdminDialogsList();
    setupAdminChatListeners();
    renderAdminNavButtons();
    updateAdminStats();
}

// ========== СТАТИСТИКА ==========
async function updateAdminStats() {
    try {
        const products = await API.getProducts();
        const productsCount = document.getElementById("adminProductsCount");
        if (productsCount) productsCount.innerText = products.length;
    } catch(e) { console.error(e); }
    
    const pendingCount = document.getElementById("adminPendingCount");
    if (pendingCount) pendingCount.innerText = pendingProducts.length;
    
    const adminsCount = document.getElementById("adminAdminsCount");
    if (adminsCount) adminsCount.innerText = admins.length;
    
    const dialogsCount = document.getElementById("adminDialogsCount");
    if (dialogsCount) dialogsCount.innerText = adminDialogs.length;
}

// ========== АДМИНИСТРАТОРЫ (ЧЕРЕЗ API) ==========
async function loadAdmins() {
    try {
        admins = await API.getAdmins();
        renderAdminsList();
    } catch(e) {
        console.error(e);
        admins = [];
    }
}

function renderAdminsList() {
    const container = document.getElementById("adminsList");
    if (!container) return;
    if (admins.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет администраторов</div>';
        return;
    }
    container.innerHTML = admins.map(admin => `
        <div class="admin-user-item">
            <div class="admin-user-info">
                <div class="admin-user-avatar"><i class="fas fa-user-shield"></i></div>
                <div>
                    <div class="admin-user-name">${escapeHtml(admin.username)}${admin.is_owner ? '<span class="owner-badge">👑 Владелец</span>' : '<span class="admin-badge">Админ</span>'}</div>
                    <div class="admin-user-date">Назначен: ${new Date(admin.hired_at).toLocaleDateString()}</div>
                </div>
            </div>
            ${!admin.is_owner ? `<div class="admin-user-actions"><button class="delete-admin-btn" onclick="fireAdmin('${admin.id}')"><i class="fas fa-user-minus"></i> Уволить</button></div>` : ''}
        </div>
    `).join('');
}

async function hireAdmin() {
    const username = document.getElementById("newAdminUsername")?.value.trim();
    if (!username) { showToast("Введите никнейм", "error"); return; }
    if (admins.find(a => a.username === username)) { showToast("Уже админ", "error"); return; }
    const currentAdmin = admins.find(a => a.username === (localStorage.getItem("apex_user") || "Admin"));
    const newAdmin = {
        id: "admin_" + Date.now(),
        username: username,
        is_owner: false,
        hired_by: currentAdmin?.username || "System",
        hired_at: new Date().toISOString()
    };
    try {
        await API.createAdmin(newAdmin);
        await loadAdmins();
        document.getElementById("newAdminUsername").value = "";
        showToast(`✅ ${username} назначен администратором!`, "success");
    } catch(e) { showToast("Ошибка: " + e.message, "error"); }
}

async function fireAdmin(adminId) {
    const admin = admins.find(a => a.id === adminId);
    if (!admin) return;
    const currentUser = localStorage.getItem("apex_user") || "Admin";
    const currentAdmin = admins.find(a => a.username === currentUser);
    if (!currentAdmin || (!currentAdmin.is_owner && currentAdmin.username !== admin.hired_by)) {
        showToast("Нет прав для увольнения", "error");
        return;
    }
    if (confirm(`Уволить ${admin.username}?`)) {
        try {
            await API.deleteAdmin(adminId);
            await loadAdmins();
            showToast(`✅ ${admin.username} уволен`, "success");
        } catch(e) { showToast("Ошибка: " + e.message, "error"); }
    }
}

function isUserAdmin(username) {
    return admins.some(a => a.username === username);
}

// ========== МОДЕРАЦИЯ ТОВАРОВ ==========
async function loadPendingProducts() {
    try {
        pendingProducts = await API.getPendingProducts();
        renderPendingProductsList();
        updateAdminStats();
    } catch(e) { pendingProducts = []; }
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
            <div class="pending-product-img"><img src="${escapeHtml(product.image_url || 'https://picsum.photos/id/42/50/50')}" alt=""></div>
            <div class="pending-product-info">
                <div class="pending-product-title">${escapeHtml(product.title)}</div>
                <div class="pending-product-price">${escapeHtml(product.price)}</div>
                <div class="pending-product-seller">Продавец: ${escapeHtml(product.seller)}</div>
                <div class="pending-product-date">Создан: ${new Date(product.created_at).toLocaleString()}</div>
            </div>
            <div class="pending-product-actions">
                <button class="approve-product-btn" onclick="approveProduct('${product.id}')"><i class="fas fa-check"></i> Одобрить</button>
                <button class="reject-product-btn" onclick="rejectProduct('${product.id}')"><i class="fas fa-times"></i> Отклонить</button>
            </div>
        </div>
    `).join('');
}

async function approveProduct(productId) {
    try {
        await API.approveProduct(productId);
        await loadPendingProducts();
        await loadAdminProducts();
        if (typeof window.loadProducts === 'function') await window.loadProducts();
        showToast("✅ Товар одобрен и опубликован", "success");
    } catch(e) { showToast("❌ Ошибка: " + e.message, "error"); }
}

async function rejectProduct(productId) {
    if (!confirm("Отклонить товар?")) return;
    try {
        await API.rejectProduct(productId);
        await loadPendingProducts();
        showToast("❌ Товар отклонён", "warning");
    } catch(e) { showToast("❌ Ошибка: " + e.message, "error"); }
}

// ========== БЛОКИ ИГР (ЧЕРЕЗ API) ==========
async function loadGameBlocks() {
    try {
        gameBlocks = await API.getGameBlocks();
        renderGamesBlocks();
        if (typeof renderHomeGameBlocks === 'function') renderHomeGameBlocks();
        updateGameKeywordSelect();
    } catch(e) { console.error(e); gameBlocks = []; }
}

function renderGamesBlocks() {
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
                    ${block.image_url ? `<img src="${escapeHtml(block.image_url)}" alt="${escapeHtml(block.name)}">` : `<i class="${block.icon}"></i>`}
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

async function addGameBlock() {
    const name = document.getElementById("newGameName")?.value.trim();
    const keyword_id = document.getElementById("newGameKeyword")?.value || null;
    const icon = document.getElementById("newGameIcon")?.value || "fas fa-gamepad";
    const image_url = document.getElementById("newGameImageUrl")?.value.trim() || null;
    if (!name) { showToast("Введите название блока", "error"); return; }
    try {
        const newBlock = { id: Date.now().toString(), name, keyword_id, icon, image_url, sort_order: gameBlocks.length };
        await API.createGameBlock(newBlock);
        await loadGameBlocks();
        document.getElementById("newGameName").value = "";
        document.getElementById("newGameKeyword").value = "";
        document.getElementById("newGameIcon").value = "fas fa-gamepad";
        document.getElementById("newGameImageUrl").value = "";
        showToast("✅ Блок игры добавлен!", "success");
    } catch(e) { showToast("❌ Ошибка: " + e.message, "error"); }
}

async function deleteGameBlock(id) {
    if (!confirm("Удалить этот блок?")) return;
    try {
        await API.deleteGameBlock(id);
        await loadGameBlocks();
        showToast("✅ Блок удален", "success");
    } catch(e) { showToast("❌ Ошибка: " + e.message, "error"); }
}

async function editGameBlock(id) {
    const block = gameBlocks.find(b => b.id === id);
    if (!block) return;
    const newName = prompt("Введите новое название:", block.name);
    if (!newName || !newName.trim()) return;
    const newImageUrl = prompt("Введите URL нового фото:", block.image_url || "");
    try {
        await API.updateGameBlock(id, { name: newName.trim(), image_url: newImageUrl?.trim() || null });
        await loadGameBlocks();
        showToast("✅ Блок обновлен!", "success");
    } catch(e) { showToast("❌ Ошибка: " + e.message, "error"); }
}

// ========== БЛОКИ ПРИЛОЖЕНИЙ (ЧЕРЕЗ API) ==========
async function loadAppBlocks() {
    try {
        appBlocks = await API.getAppBlocks();
        renderAppsBlocks();
        if (typeof renderHomeAppBlocks === 'function') renderHomeAppBlocks();
        updateAppKeywordSelect();
    } catch(e) { console.error(e); appBlocks = []; }
}

function renderAppsBlocks() {
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
                    ${block.image_url ? `<img src="${escapeHtml(block.image_url)}" alt="${escapeHtml(block.name)}">` : `<i class="${block.icon}"></i>`}
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

async function addAppBlock() {
    const name = document.getElementById("newAppName")?.value.trim();
    const keyword_id = document.getElementById("newAppKeyword")?.value || null;
    const icon = document.getElementById("newAppIcon")?.value || "fab fa-android";
    const image_url = document.getElementById("newAppImageUrl")?.value.trim() || null;
    if (!name) { showToast("Введите название приложения", "error"); return; }
    try {
        const newBlock = { id: "app_" + Date.now(), name, keyword_id, icon, image_url, sort_order: appBlocks.length };
        await API.createAppBlock(newBlock);
        await loadAppBlocks();
        document.getElementById("newAppName").value = "";
        document.getElementById("newAppKeyword").value = "";
        document.getElementById("newAppIcon").value = "fab fa-android";
        document.getElementById("newAppImageUrl").value = "";
        showToast("✅ Блок приложения добавлен!", "success");
    } catch(e) { showToast("❌ Ошибка: " + e.message, "error"); }
}

async function deleteAppBlock(id) {
    if (!confirm("Удалить этот блок?")) return;
    try {
        await API.deleteAppBlock(id);
        await loadAppBlocks();
        showToast("✅ Блок удален", "success");
    } catch(e) { showToast("❌ Ошибка: " + e.message, "error"); }
}

async function editAppBlock(id) {
    const block = appBlocks.find(b => b.id === id);
    if (!block) return;
    const newName = prompt("Введите новое название:", block.name);
    if (!newName || !newName.trim()) return;
    const newImageUrl = prompt("Введите URL нового фото:", block.image_url || "");
    try {
        await API.updateAppBlock(id, { name: newName.trim(), image_url: newImageUrl?.trim() || null });
        await loadAppBlocks();
        showToast("✅ Блок обновлен!", "success");
    } catch(e) { showToast("❌ Ошибка: " + e.message, "error"); }
}

// ========== КЛЮЧЕВЫЕ СЛОВА (ЧЕРЕЗ API) ==========
async function loadKeywords() {
    try {
        keywords = await API.getKeywords();
        renderKeywords();
        updateKeywordSelect();
        updateGameKeywordSelect();
        updateAppKeywordSelect();
    } catch(e) { keywords = []; }
}

function renderKeywords() {
    const container = document.getElementById("keywordsList");
    if (!container) return;
    if (keywords.length === 0) {
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
                <button class="edit-keyword-btn" onclick="editKeyword('${k.id}')"><i class="fas fa-edit"></i></button>
                <button class="delete-keyword-btn" onclick="deleteKeyword('${k.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

async function addKeyword() {
    const name = document.getElementById("newKeywordName")?.value.trim();
    const type = document.getElementById("newKeywordType")?.value.trim();
    if (!name) { showToast("Введите название", "error"); return; }
    try {
        await API.createKeyword({ name, type: type || "Стандарт" });
        await loadKeywords();
        document.getElementById("newKeywordName").value = "";
        document.getElementById("newKeywordType").value = "";
        showToast(`✅ Ключевое слово "${name}" добавлено!`, "success");
    } catch(e) { showToast("❌ Ошибка: " + e.message, "error"); }
}

async function editKeyword(keywordId) {
    const keyword = keywords.find(k => k.id === keywordId);
    if (!keyword) return;
    const newName = prompt("Введите новое название:", keyword.name);
    if (!newName || !newName.trim()) return;
    const newType = prompt("Введите новый тип:", keyword.type);
    try {
        await API.updateKeyword(keywordId, { name: newName.trim(), type: (newType && newType.trim()) || "Стандарт" });
        await loadKeywords();
        showToast("✅ Ключевое слово обновлено!", "success");
    } catch(e) { showToast("❌ Ошибка: " + e.message, "error"); }
}

async function deleteKeyword(keywordId) {
    if (!confirm("Удалить ключевое слово?")) return;
    try {
        await API.deleteKeyword(keywordId);
        await loadKeywords();
        showToast("✅ Ключевое слово удалено", "success");
    } catch(e) { showToast("❌ Ошибка: " + e.message, "error"); }
}

function updateKeywordSelect() {
    const select = document.getElementById("postKeyword");
    if (!select) return;
    select.innerHTML = '<option value="">Выберите ключевое слово/категорию</option>';
    keywords.forEach(k => { select.innerHTML += `<option value="${escapeHtml(k.id)}">${escapeHtml(k.name)} - ${escapeHtml(k.type)}</option>`; });
}

function updateGameKeywordSelect() {
    const select = document.getElementById("newGameKeyword");
    if (!select) return;
    select.innerHTML = '<option value="">Без привязки</option>';
    keywords.forEach(k => { select.innerHTML += `<option value="${escapeHtml(k.id)}">${escapeHtml(k.name)} - ${escapeHtml(k.type)}</option>`; });
}

function updateAppKeywordSelect() {
    const select = document.getElementById("newAppKeyword");
    if (!select) return;
    select.innerHTML = '<option value="">Без привязки</option>';
    keywords.forEach(k => { select.innerHTML += `<option value="${escapeHtml(k.id)}">${escapeHtml(k.name)} - ${escapeHtml(k.type)}</option>`; });
}

// ========== УПРАВЛЕНИЕ ТОВАРАМИ (АДМИН) ==========
async function loadAdminProducts() {
    const container = document.getElementById("adminProductsList");
    if (!container) return;
    try {
        const products = await API.getProducts();
        if (products.length === 0) {
            container.innerHTML = "<div style='text-align:center;padding:20px;'>Нет товаров</div>";
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
    } catch(e) { console.error(e); }
}

async function createAdminProduct() {
    const keywordId = document.getElementById("postKeyword")?.value;
    const title = document.getElementById("postTitle")?.value.trim();
    const price = document.getElementById("postPrice")?.value.trim();
    const discount = document.getElementById("postDiscount")?.value.trim();
    const description = document.getElementById("postDescription")?.value.trim();
    const imageUrl = document.getElementById("postImageUrl")?.value.trim();
    const seller = document.getElementById("postSeller")?.value.trim() || localStorage.getItem("apex_user") || "Admin";
    if (!keywordId || !title || !price) { showToast("Заполните ключевое слово, название и цену", "error"); return; }
    let keywordName = "Без категории";
    const kw = keywords.find(k => k.id === keywordId);
    if (kw) keywordName = kw.name;
    const productData = { title, price, seller, keyword: keywordName, image_url: imageUrl || "https://picsum.photos/id/42/400/200", description: description || "Новый товар", discount: discount || null };
    try {
        await API.createProduct(productData);
        showToast("✅ Товар создан", "success");
        document.getElementById("postTitle").value = "";
        document.getElementById("postPrice").value = "";
        document.getElementById("postDiscount").value = "";
        document.getElementById("postDescription").value = "";
        document.getElementById("postImageUrl").value = "";
        document.getElementById("postSeller").value = "";
        document.getElementById("postKeyword").value = "";
        await loadAdminProducts();
        if (typeof window.loadProducts === 'function') await window.loadProducts();
    } catch(e) { showToast("❌ Ошибка: " + e.message, "error"); }
}

async function deleteProduct(productId) {
    if (!confirm("Удалить товар?")) return;
    try {
        await API.deleteProduct(productId);
        await loadAdminProducts();
        if (typeof window.loadProducts === 'function') await window.loadProducts();
        showToast("✅ Товар удалён", "success");
    } catch(e) { showToast("❌ Ошибка: " + e.message, "error"); }
}

async function editProduct(productId) {
    const products = await API.getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) { alert("Товар не найден"); return; }
    document.getElementById("postTitle").value = product.title;
    document.getElementById("postPrice").value = product.price;
    document.getElementById("postDiscount").value = product.discount || "";
    document.getElementById("postDescription").value = product.description || "";
    document.getElementById("postImageUrl").value = product.image_url || "";
    document.getElementById("postSeller").value = product.seller || "";
    if (product.keyword) {
        const kw = keywords.find(k => k.name === product.keyword);
        if (kw) document.getElementById("postKeyword").value = kw.id;
    }
    await deleteProduct(productId);
    document.querySelector(".admin-card")?.scrollIntoView({ behavior: "smooth" });
    showToast("Редактирование: заполните форму и нажмите 'Опубликовать товар'", "info");
}

// ========== СЛАЙДЕРЫ ==========
function openSliderEditor() {
    const modal = document.getElementById("sliderEditorModal");
    if (modal) { renderSliderEditorContent(); modal.classList.add("active"); }
}
function closeSliderEditor() { const modal = document.getElementById("sliderEditorModal"); if (modal) modal.classList.remove("active"); }

function renderSliderEditorContent() {
    const container = document.getElementById("sliderEditorContent");
    if (!container) return;
    const sliders = document.querySelectorAll('.mini-slider');
    const slidesData = [];
    sliders.forEach((slider, index) => {
        const images = slider.querySelectorAll('.mini-slide-img');
        slidesData.push({ index, images: Array.from(images).map(img => img.src) });
    });
    if (slidesData.length === 0) { container.innerHTML = '<div class="empty-state">Слайды не найдены</div>'; return; }
    container.innerHTML = slidesData.map(slide => `
        <div class="slider-editor-card">
            <div class="slider-editor-header"><h4>Слайд ${slide.index + 1}</h4><button class="add-slide-image-btn" onclick="addSlideImage(${slide.index})"><i class="fas fa-plus"></i> Добавить изображение</button></div>
            <div class="slider-editor-images" id="sliderEditorImages_${slide.index}">
                ${slide.images.map((img, imgIndex) => `
                    <div class="slider-image-item">
                        <img src="${escapeHtml(img)}">
                        <div class="slider-image-actions">
                            <input type="text" class="image-url-input" value="${escapeHtml(img)}" onchange="updateSlideImage(${slide.index}, ${imgIndex}, this.value)">
                            <button class="remove-image-btn" onclick="removeSlideImage(${slide.index}, ${imgIndex})"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function addSlideImage(sliderIndex) {
    const newUrl = prompt("Введите URL изображения:");
    if (!newUrl) return;
    const slider = document.querySelector(`.mini-slider[data-slider="${sliderIndex}"]`);
    if (slider) {
        slider.querySelector('.mini-slider-images').appendChild(Object.assign(document.createElement('img'), { className: 'mini-slide-img', src: newUrl }));
        const dots = slider.querySelector('.mini-slider-dots');
        if (dots) dots.appendChild(Object.assign(document.createElement('div'), { className: 'mini-dot' }));
        if (typeof initMiniSliders === 'function') initMiniSliders();
    }
    renderSliderEditorContent();
    showToast("Изображение добавлено!", "success");
}

function updateSlideImage(sliderIndex, imageIndex, newUrl) {
    if (!newUrl) return;
    const slider = document.querySelector(`.mini-slider[data-slider="${sliderIndex}"]`);
    if (slider) {
        const images = slider.querySelectorAll('.mini-slide-img');
        if (images[imageIndex]) images[imageIndex].src = newUrl;
    }
    showToast("Изображение обновлено!", "success");
}

function removeSlideImage(sliderIndex, imageIndex) {
    if (confirm("Удалить изображение?")) {
        const slider = document.querySelector(`.mini-slider[data-slider="${sliderIndex}"]`);
        if (slider) {
            const images = slider.querySelectorAll('.mini-slide-img');
            const dots = slider.querySelectorAll('.mini-dot');
            if (images[imageIndex]) images[imageIndex].remove();
            if (dots[imageIndex]) dots[imageIndex].remove();
            if (typeof initMiniSliders === 'function') initMiniSliders();
        }
        renderSliderEditorContent();
        showToast("Изображение удалено!", "success");
    }
}

// ========== ЧАТ ПОДДЕРЖКИ ==========
function loadAdminDialogs() {
    const stored = localStorage.getItem("apex_admin_dialogs");
    adminDialogs = stored ? JSON.parse(stored) : [];
    renderAdminDialogsList();
    updateAdminStats();
}
function saveAdminDialogs() { localStorage.setItem("apex_admin_dialogs", JSON.stringify(adminDialogs)); }

function renderAdminDialogsList(searchTerm = '') {
    const container = document.getElementById("adminDialogsList");
    if (!container) return;
    let filtered = searchTerm ? adminDialogs.filter(d => d.userName.toLowerCase().includes(searchTerm.toLowerCase())) : adminDialogs;
    if (filtered.length === 0) { container.innerHTML = '<div class="empty-dialogs"><i class="fas fa-comments"></i><p>Нет диалогов</p></div>'; return; }
    container.innerHTML = filtered.map(dialog => `
        <div class="admin-dialog-item ${adminCurrentDialogId === dialog.id ? 'active' : ''}" onclick="openAdminDialog('${dialog.id}')">
            <div class="admin-dialog-avatar"><i class="fas fa-user-circle"></i></div>
            <div class="admin-dialog-info"><div class="admin-dialog-name">${escapeHtml(dialog.userName)}</div><div class="admin-dialog-preview">${escapeHtml(dialog.messages[dialog.messages.length-1]?.text.substring(0,40) || '')}</div></div>
            <div class="admin-dialog-time">${dialog.messages[dialog.messages.length-1]?.time || ''}</div>
        </div>
    `).join('');
}

function openAdminDialog(dialogId) {
    const dialog = adminDialogs.find(d => d.id === dialogId);
    if (!dialog) return;
    adminCurrentDialogId = dialogId;
    const sidebar = document.getElementById("adminChatSidebar");
    const chatWindow = document.getElementById("adminChatWindow");
    if (sidebar) sidebar.classList.add("hide");
    if (chatWindow) { chatWindow.style.display = "flex"; chatWindow.classList.add("active"); }
    const partnerName = document.getElementById("adminChatPartnerName");
    if (partnerName) partnerName.textContent = dialog.userName;
    renderAdminMessages(dialogId);
    renderAdminDialogsList();
}

function closeAdminChat() {
    const sidebar = document.getElementById("adminChatSidebar");
    const chatWindow = document.getElementById("adminChatWindow");
    if (sidebar) sidebar.classList.remove("hide");
    if (chatWindow) { chatWindow.style.display = "none"; chatWindow.classList.remove("active"); }
    adminCurrentDialogId = null;
}

function renderAdminMessages(dialogId) {
    const dialog = adminDialogs.find(d => d.id === dialogId);
    const area = document.getElementById("adminChatMessagesArea");
    if (!area || !dialog) return;
    if (dialog.messages.length === 0) { area.innerHTML = '<div class="empty-messages">Нет сообщений</div>'; return; }
    let html = '', lastDate = null;
    dialog.messages.forEach(msg => {
        const isOut = msg.sender === "support";
        const msgDate = new Date(msg.timestamp);
        const isToday = msgDate.toDateString() === new Date().toDateString();
        if (lastDate !== msgDate.toDateString()) {
            lastDate = msgDate.toDateString();
            html += `<div class="date-divider"><span>${isToday ? 'Сегодня' : msgDate.toLocaleDateString('ru-RU')}</span></div>`;
        }
        html += `<div class="message-group ${isOut ? 'outgoing' : 'incoming'}"><div class="message-content"><div class="message-bubble ${isOut ? 'out' : 'in'}">${escapeHtml(msg.text).replace(/\n/g, '<br>')}</div><div class="message-time">${msg.time}</div></div></div>`;
    });
    area.innerHTML = html;
    area.scrollTop = area.scrollHeight;
}

function sendAdminMessage() {
    const input = document.getElementById("adminChatMessageInput");
    const text = input.value.trim();
    if (!text || !adminCurrentDialogId) return;
    const dialogIndex = adminDialogs.findIndex(d => d.id === adminCurrentDialogId);
    if (dialogIndex === -1) return;
    const newMsg = { sender: "support", text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), timestamp: new Date().toISOString() };
    adminDialogs[dialogIndex].messages.push(newMsg);
    adminDialogs[dialogIndex].lastMessageTime = new Date().toISOString();
    saveAdminDialogs();
    renderAdminMessages(adminCurrentDialogId);
    renderAdminDialogsList();
    input.value = "";
}

function setupAdminChatListeners() {
    const sendBtn = document.getElementById("sendAdminChatMsgBtn");
    const msgInput = document.getElementById("adminChatMessageInput");
    const searchInput = document.getElementById("adminChatSearchInput");
    const backBtn = document.getElementById("backToAdminChatListBtn");
    if (sendBtn) { const newBtn = sendBtn.cloneNode(true); sendBtn.parentNode.replaceChild(newBtn, sendBtn); newBtn.onclick = sendAdminMessage; }
    if (msgInput) { msgInput.onkeypress = (e) => { if (e.key === "Enter") { e.preventDefault(); sendAdminMessage(); } }; }
    if (searchInput) { searchInput.oninput = (e) => renderAdminDialogsList(e.target.value); }
    if (backBtn) { const newBackBtn = backBtn.cloneNode(true); backBtn.parentNode.replaceChild(newBackBtn, backBtn); newBackBtn.onclick = closeAdminChat; }
}

// ========== НАВИГАЦИЯ ПО АДМИНКЕ ==========
function renderAdminNavButtons() {
    const container = document.getElementById("adminNavButtons");
    if (!container) return;
    const sections = [
        { id: "adminMainSection", name: "📊 Главная", icon: "fa-tachometer-alt" },
        { id: "adminAdminsSection", name: "👥 Администраторы", icon: "fa-users" },
        { id: "adminKeywordsSection", name: "🏷️ Ключевые слова", icon: "fa-tags" },
        { id: "adminModerationSection", name: "📝 Модерация", icon: "fa-clipboard-list" },
        { id: "adminSlidersSection", name: "🖼️ Слайдеры", icon: "fa-images" },
        { id: "adminChatSection", name: "💬 Чат поддержки", icon: "fa-headset" },
        { id: "adminProductsSection", name: "📦 Товары", icon: "fa-box" },
        { id: "adminGamesSection", name: "🎮 Игры", icon: "fa-gamepad" },
        { id: "adminAppsSection", name: "📱 Приложения", icon: "fa-mobile-alt" }
    ];
    container.innerHTML = sections.map(s => `<button class="admin-nav-btn" onclick="showAdminSection('${s.id}')"><i class="fas ${s.icon}"></i> <span>${s.name}</span></button>`).join('');
}

function showAdminSection(sectionId) {
    const sections = ["adminMainSection", "adminAdminsSection", "adminKeywordsSection", "adminModerationSection", "adminSlidersSection", "adminChatSection", "adminProductsSection", "adminGamesSection", "adminAppsSection"];
    sections.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = "none"; });
    const target = document.getElementById(sectionId);
    if (target) target.style.display = "block";
    document.querySelectorAll('.admin-nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = Array.from(document.querySelectorAll('.admin-nav-btn')).find(btn => btn.getAttribute('onclick')?.includes(sectionId));
    if (activeBtn) activeBtn.classList.add('active');
}

// ========== ВХОД В АДМИНКУ ==========
function toggleAdminPanel() {
    const currentUser = localStorage.getItem("apex_user") || "Гость";
    if (!isUserAdmin(currentUser)) {
        const password = prompt("Введите пароль администратора:");
        if (password === ADMIN_PASSWORD) {
            if (!admins.find(a => a.username === currentUser)) {
                admins.push({ id: "admin_" + Date.now(), username: currentUser, is_owner: admins.length === 0, hired_by: "system", hired_at: new Date().toISOString() });
                saveAdmins();
            }
            showAdminUI();
        } else { alert("Неверный пароль!"); }
    } else {
        if (typeof navigate === 'function') navigate("admin");
        else if (typeof showPage === 'function') showPage("admin");
    }
}

function showAdminUI() {
    const adminBtn = document.getElementById("adminToggleBtn");
    if (adminBtn) { adminBtn.style.background = "var(--accent-primary)"; adminBtn.innerHTML = '<i class="fas fa-user-shield"></i>'; }
    const bottomNav = document.getElementById("bottomNav");
    if (bottomNav && !document.getElementById("adminNavBtn")) {
        const adminNavBtn = document.createElement("button");
        adminNavBtn.className = "nav-item";
        adminNavBtn.id = "adminNavBtn";
        adminNavBtn.setAttribute("data-nav", "admin");
        adminNavBtn.innerHTML = '<div class="nav-icon"></div><div class="nav-label">Админ</div>';
        const navContainer = document.getElementById("navContainer");
        if (navContainer) navContainer.appendChild(adminNavBtn);
        if (window.initBlobNavigation) window.initBlobNavigation();
        alert("Добро пожаловать в админ-панель!");
        initAdmin();
    }
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ==========
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
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
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ========== ЭКСПОРТ ==========
window.initAdmin = initAdmin;
window.hireAdmin = hireAdmin;
window.fireAdmin = fireAdmin;
window.approveProduct = approveProduct;
window.rejectProduct = rejectProduct;
window.openSliderEditor = openSliderEditor;
window.closeSliderEditor = closeSliderEditor;
window.addSlideImage = addSlideImage;
window.updateSlideImage = updateSlideImage;
window.removeSlideImage = removeSlideImage;
window.openAdminDialog = openAdminDialog;
window.closeAdminChat = closeAdminChat;
window.sendAdminMessage = sendAdminMessage;
window.showAdminSection = showAdminSection;
window.addGameBlock = addGameBlock;
window.deleteGameBlock = deleteGameBlock;
window.editGameBlock = editGameBlock;
window.addAppBlock = addAppBlock;
window.deleteAppBlock = deleteAppBlock;
window.editAppBlock = editAppBlock;
window.createAdminProduct = createAdminProduct;
window.deleteProduct = deleteProduct;
window.editProduct = editProduct;
window.toggleAdminPanel = toggleAdminPanel;
window.addKeyword = addKeyword;
window.editKeyword = editKeyword;
window.deleteKeyword = deleteKeyword;

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing admin...");
    initAdmin();
});