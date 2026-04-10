// admin.js - ПОЛНАЯ АДМИН-ПАНЕЛЬ С СИНХРОНИЗАЦИЕЙ С СЕРВЕРОМ

let keywords = [];
let gameBlocks = [];
let appBlocks = [];
let admins = [];
let pendingProducts = [];
let adminCurrentDialogId = null;
let adminDialogs = [];

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
        loadAdmins(),
        loadAdminDialogs()
    ]);
    renderGamesBlocks();
    renderAppsBlocks();
    renderAdminsList();
    renderAdminDialogsList();
    setupAdminChatListeners();
    renderAdminNavButtons();
    updateAdminStats();
}

// ==================== 1. КЛЮЧЕВЫЕ СЛОВА (СЕРВЕР) ====================

async function loadKeywords() {
    try {
        const response = await fetch('/api/keywords');
        if (!response.ok) throw new Error('Ошибка загрузки');
        keywords = await response.json();
        renderKeywords();
        updateKeywordSelects();
        console.log('✅ Ключевые слова загружены:', keywords.length);
    } catch(e) {
        console.error('Ошибка загрузки ключевых слов:', e);
        keywords = [];
    }
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

function updateKeywordSelects() {
    // Обновляем все выпадающие списки
    const selects = ['postKeyword', 'productKeywordSelect', 'newGameKeyword', 'newAppKeyword'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Выберите категорию</option>';
            keywords.forEach(k => {
                select.innerHTML += `<option value="${escapeHtml(k.id)}">${escapeHtml(k.name)} - ${escapeHtml(k.type || 'Стандарт')}</option>`;
            });
        }
    });
}
// ==================== БЛОКИ ИГР (CRUD) ====================

app.get('/api/game-blocks', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM game_blocks ORDER BY sort_order');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/game-blocks', async (req, res) => {
    try {
        const { id, name, keyword_id, icon, image_url, sort_order } = req.body;
        await pool.query(
            `INSERT INTO game_blocks (id, name, keyword_id, icon, image_url, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, name, keyword_id, icon, image_url, sort_order]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/game-blocks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, keyword_id, icon, image_url, sort_order } = req.body;
        await pool.query(
            `UPDATE game_blocks SET name = COALESCE($1, name), keyword_id = COALESCE($2, keyword_id),
             icon = COALESCE($3, icon), image_url = COALESCE($4, image_url), sort_order = COALESCE($5, sort_order)
             WHERE id = $6`,
            [name, keyword_id, icon, image_url, sort_order, id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/game-blocks/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM game_blocks WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== БЛОКИ ПРИЛОЖЕНИЙ (CRUD) ====================

app.get('/api/app-blocks', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM app_blocks ORDER BY sort_order');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/app-blocks', async (req, res) => {
    try {
        const { id, name, keyword_id, icon, image_url, sort_order } = req.body;
        await pool.query(
            `INSERT INTO app_blocks (id, name, keyword_id, icon, image_url, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, name, keyword_id, icon, image_url, sort_order]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/app-blocks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, keyword_id, icon, image_url, sort_order } = req.body;
        await pool.query(
            `UPDATE app_blocks SET name = COALESCE($1, name), keyword_id = COALESCE($2, keyword_id),
             icon = COALESCE($3, icon), image_url = COALESCE($4, image_url), sort_order = COALESCE($5, sort_order)
             WHERE id = $6`,
            [name, keyword_id, icon, image_url, sort_order, id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/app-blocks/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM app_blocks WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message }); 
    }
});
// ==================== 2. БЛОКИ ИГР (СЕРВЕР) ====================
    
async function loadGameBlocks() {
    try {
        const response = await fetch('/api/game-blocks');
        if (!response.ok) throw new Error('Ошибка загрузки');
        gameBlocks = await response.json();
        renderGamesBlocks();
        renderHomeGameBlocks();
        console.log('✅ Блоки игр загружены:', gameBlocks.length);
    } catch(e) {
        console.error('Ошибка загрузки игр:', e);
        gameBlocks = [];
    }
}

async function addGameBlock() {
    const name = document.getElementById("newGameName")?.value.trim();
    const keywordId = document.getElementById("newGameKeyword")?.value;
    const icon = document.getElementById("newGameIcon")?.value;
    const imageUrl = document.getElementById("newGameImageUrl")?.value.trim();
    
    if (!name) {
        showToast("Введите название блока", "error");
        return;
    }
    
    try {
        const response = await fetch('/api/game-blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: Date.now().toString(),
                name: name,
                keyword_id: keywordId || null,
                icon: icon || "fas fa-gamepad",
                image_url: imageUrl || null,
                sort_order: gameBlocks.length + 1
            })
        });
        if (!response.ok) throw new Error('Ошибка создания');
        
        await loadGameBlocks();
        
        document.getElementById("newGameName").value = "";
        document.getElementById("newGameKeyword").value = "";
        document.getElementById("newGameIcon").value = "fas fa-gamepad";
        document.getElementById("newGameImageUrl").value = "";
        
        showToast("✅ Блок игры добавлен!", "success");
    } catch(e) {
        showToast("❌ Ошибка: " + e.message, "error");
    }
}

async function deleteGameBlock(id) {
    if (!confirm("Удалить этот блок?")) return;
    try {
        const response = await fetch(`/api/game-blocks/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Ошибка удаления');
        await loadGameBlocks();
        showToast("✅ Блок удален", "success");
    } catch(e) {
        showToast("❌ Ошибка: " + e.message, "error");
    }
}

async function editGameBlock(id) {
    const block = gameBlocks.find(b => b.id === id);
    if (!block) return;
    
    const newName = prompt("Введите новое название:", block.name);
    if (newName && newName.trim()) {
        try {
            const response = await fetch(`/api/game-blocks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim() })
            });
            if (!response.ok) throw new Error('Ошибка обновления');
            await loadGameBlocks();
            showToast("✅ Блок обновлен!", "success");
        } catch(e) {
            showToast("❌ Ошибка: " + e.message, "error");
        }
    }
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
                    ${block.image_url ? 
                        `<img src="${escapeHtml(block.image_url)}" alt="${escapeHtml(block.name)}">` : 
                        `<i class="${block.icon}"></i>`
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
    
    container.innerHTML = gameBlocks.map(block => {
        let keywordName = block.name;
        if (block.keyword_id) {
            const kw = keywords.find(k => k.id === block.keyword_id);
            if (kw) keywordName = kw.name;
        }
        return `
            <div class="game-card" onclick="openKeywordPage('${escapeHtml(keywordName)}')">
                <div class="game-icon">
                    ${block.image_url ? 
                        `<img src="${escapeHtml(block.image_url)}" alt="${escapeHtml(block.name)}">` : 
                        `<i class="${block.icon}"></i>`
                    }
                </div>
                <div class="game-name">${escapeHtml(block.name)}</div>
            </div>
        `;
    }).join('');
}

// ==================== 3. БЛОКИ ПРИЛОЖЕНИЙ (СЕРВЕР) ====================

async function loadAppBlocks() {
    try {
        const response = await fetch('/api/app-blocks');
        if (!response.ok) throw new Error('Ошибка загрузки');
        appBlocks = await response.json();
        renderAppsBlocks();
        renderHomeAppBlocks();
        console.log('✅ Блоки приложений загружены:', appBlocks.length);
    } catch(e) {
        console.error('Ошибка загрузки приложений:', e);
        appBlocks = [];
    }
}

async function addAppBlock() {
    const name = document.getElementById("newAppName")?.value.trim();
    const keywordId = document.getElementById("newAppKeyword")?.value;
    const icon = document.getElementById("newAppIcon")?.value;
    const imageUrl = document.getElementById("newAppImageUrl")?.value.trim();
    
    if (!name) {
        showToast("Введите название приложения", "error");
        return;
    }
    
    try {
        const response = await fetch('/api/app-blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: Date.now().toString(),
                name: name,
                keyword_id: keywordId || null,
                icon: icon || "fab fa-android",
                image_url: imageUrl || null,
                sort_order: appBlocks.length + 1
            })
        });
        if (!response.ok) throw new Error('Ошибка создания');
        
        await loadAppBlocks();
        
        document.getElementById("newAppName").value = "";
        document.getElementById("newAppKeyword").value = "";
        document.getElementById("newAppIcon").value = "fab fa-android";
        document.getElementById("newAppImageUrl").value = "";
        
        showToast("✅ Блок приложения добавлен!", "success");
    } catch(e) {
        showToast("❌ Ошибка: " + e.message, "error");
    }
}

async function deleteAppBlock(id) {
    if (!confirm("Удалить этот блок?")) return;
    try {
        const response = await fetch(`/api/app-blocks/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Ошибка удаления');
        await loadAppBlocks();
        showToast("✅ Блок удален", "success");
    } catch(e) {
        showToast("❌ Ошибка: " + e.message, "error");
    }
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
                    ${block.image_url ? 
                        `<img src="${escapeHtml(block.image_url)}" alt="${escapeHtml(block.name)}">` : 
                        `<i class="${block.icon}"></i>`
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
    
    container.innerHTML = appBlocks.map(block => {
        let keywordName = block.name;
        if (block.keyword_id) {
            const kw = keywords.find(k => k.id === block.keyword_id);
            if (kw) keywordName = kw.name;
        }
        return `
            <div class="game-card" onclick="openKeywordPage('${escapeHtml(keywordName)}')">
                <div class="game-icon">
                    ${block.image_url ? 
                        `<img src="${escapeHtml(block.image_url)}" alt="${escapeHtml(block.name)}">` : 
                        `<i class="${block.icon}"></i>`
                    }
                </div>
                <div class="game-name">${escapeHtml(block.name)}</div>
            </div>
        `;
    }).join('');
}

// ==================== 4. ТОВАРЫ (СЕРВЕР) ====================

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
                        <div class="admin-product-seller">Продавец: ${escapeHtml(p.seller)}</div>
                    </div>
                    <div class="admin-product-actions">
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
        
        showToast("✅ Товар создан!", "success");
        
        document.getElementById("postTitle").value = "";
        document.getElementById("postPrice").value = "";
        document.getElementById("postDiscount").value = "";
        document.getElementById("postDescription").value = "";
        document.getElementById("postImageUrl").value = "";
        document.getElementById("postSeller").value = "";
        
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

// ==================== 5. ТОВАРЫ НА МОДЕРАЦИИ ====================

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
            <div class="pending-product-info">
                <div class="pending-product-title">${escapeHtml(product.title)}</div>
                <div class="pending-product-price">${escapeHtml(product.price)}</div>
                <div class="pending-product-seller">Продавец: ${escapeHtml(product.seller)}</div>
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

// ==================== 6. АДМИНИСТРАТОРЫ ====================

async function loadAdmins() {
    try {
        const response = await fetch('/api/admins');
        if (!response.ok) throw new Error('Ошибка загрузки');
        admins = await response.json();
        renderAdminsList();
    } catch(e) {
        console.error('Ошибка загрузки админов:', e);
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
                <div class="admin-user-avatar">
                    <i class="fas fa-user-shield"></i>
                </div>
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

// ==================== 7. ЧАТ ПОДДЕРЖКИ ====================

function loadAdminDialogs() {
    const stored = localStorage.getItem("apex_admin_dialogs");
    if (stored) {
        adminDialogs = JSON.parse(stored);
    } else {
        adminDialogs = [];
    }
    renderAdminDialogsList();
}

function renderAdminDialogsList(searchTerm = '') {
    const container = document.getElementById("adminDialogsList");
    if (!container) return;
    
    if (adminDialogs.length === 0) {
        container.innerHTML = '<div class="empty-dialogs"><i class="fas fa-comments"></i><p>Нет диалогов</p></div>';
        return;
    }
    
    container.innerHTML = adminDialogs.map(dialog => `
        <div class="admin-dialog-item" onclick="openAdminDialog('${dialog.id}')">
            <div class="admin-dialog-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="admin-dialog-info">
                <div class="admin-dialog-name">${escapeHtml(dialog.user_name)}</div>
            </div>
        </div>
    `).join('');
}

// ==================== 8. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function updateAdminStats() {
    const productsCount = document.getElementById("adminProductsCount");
    const pendingCount = document.getElementById("adminPendingCount");
    const adminsCount = document.getElementById("adminAdminsCount");
    
    if (productsCount) productsCount.innerText = "Загрузка...";
    if (pendingCount) pendingCount.innerText = pendingProducts.length;
    if (adminsCount) adminsCount.innerText = admins.length;
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
    
    container.innerHTML = sections.map(section => `
        <button class="admin-nav-btn" onclick="showAdminSection('${section.id}')">
            <i class="fas ${section.icon}"></i> <span>${section.name}</span>
        </button>
    `).join('');
}

function showAdminSection(sectionId) {
    const sections = [
        "adminMainSection", "adminAdminsSection", "adminKeywordsSection",
        "adminModerationSection", "adminProductsSection", 
        "adminGamesSection", "adminAppsSection"
    ];
    
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
    
    const target = document.getElementById(sectionId);
    if (target) target.style.display = "block";
    
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = Array.from(document.querySelectorAll('.admin-nav-btn')).find(
        btn => btn.getAttribute('onclick')?.includes(sectionId)
    );
    if (activeBtn) activeBtn.classList.add('active');
}

function setupAdminChatListeners() {
    const sendBtn = document.getElementById("sendAdminChatMsgBtn");
    if (sendBtn) {
        sendBtn.onclick = () => {
            const input = document.getElementById("adminChatMessageInput");
            if (input && input.value.trim()) {
                // Обработка отправки
                input.value = "";
            }
        };
    }
}

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
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    toast.className = `toast-notification ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function toggleAdminPanel() {
    const currentUser = localStorage.getItem("apex_user") || "Гость";
    const password = prompt("Введите пароль администратора:");
    if (password === ADMIN_PASSWORD) {
        showAdminUI();
    } else {
        alert("Неверный пароль!");
    }
}

function showAdminUI() {
    if (typeof navigate === 'function') {
        navigate("admin");
    } else if (typeof showPage === 'function') {
        showPage("admin");
    }
    initAdmin();
}

function openKeywordPage(keyword) {
    if (typeof window.openKeywordPage === 'function') {
        window.openKeywordPage(keyword);
    } else {
        alert(`Поиск товаров по категории: ${keyword}`);
    }
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
window.openKeywordPage = openKeywordPage;

// Автозапуск
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('admin')) {
        initAdmin();
    }
});