// admin.js - ПОЛНАЯ АДМИН-ПАНЕЛЬ (С КЛЮЧЕВЫМИ СЛОВАМИ)

let keywords = [];
let gameBlocks = [];
let appBlocks = [];
let admins = [];
let pendingProducts = [];
let adminCurrentDialogId = null;
let adminDialogs = [];

const ADMIN_PASSWORD = "admin123";

// Обновляем функцию initAdmin, чтобы она загружала данные с сервера
async function initAdmin() {
    console.log("initAdmin started");
    await loadKeywords();
    await loadPendingProducts();
    await loadAdminProducts();
    loadGameBlocks();
    loadAppBlocks();
    loadAdmins();
    loadAdminDialogs();
    renderGamesBlocks();
    renderAppsBlocks();
    renderAdminsList();
    renderAdminDialogsList();
    setupAdminChatListeners();
    renderAdminNavButtons();
    updateAdminStats();
}
function updateAdminStats() {
  const products = JSON.parse(localStorage.getItem("apex_products") || "[]");
  const productsCount = document.getElementById("adminProductsCount");
  if (productsCount) productsCount.innerText = products.length;
  
  const pendingCount = document.getElementById("adminPendingCount");
  if (pendingCount) pendingCount.innerText = pendingProducts.length;
  
  const adminsCount = document.getElementById("adminAdminsCount");
  if (adminsCount) adminsCount.innerText = admins.length;
  
  const dialogsCount = document.getElementById("adminDialogsCount");
  if (dialogsCount) dialogsCount.innerText = adminDialogs.length;
}

// ==================== 1. НАЙМ АДМИНОВ ====================

function loadAdmins() {
  const stored = localStorage.getItem("apex_admins");
  if (stored) {
    admins = JSON.parse(stored);
  } else {
    admins = [
      { id: "admin_1", username: "Admin", isOwner: true, hiredBy: "system", hiredAt: new Date().toISOString() }
    ];
    localStorage.setItem("apex_admins", JSON.stringify(admins));
  }
}

function saveAdmins() {
  localStorage.setItem("apex_admins", JSON.stringify(admins));
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
            ${admin.isOwner ? '<span class="owner-badge">👑 Владелец</span>' : '<span class="admin-badge">Админ</span>'}
          </div>
          <div class="admin-user-date">Назначен: ${new Date(admin.hiredAt).toLocaleDateString()}</div>
          ${admin.hiredBy && !admin.isOwner ? `<div class="admin-user-hiredby">Назначен: ${escapeHtml(admin.hiredBy)}</div>` : ''}
        </div>
      </div>
      ${!admin.isOwner ? `
        <div class="admin-user-actions">
          <button class="delete-admin-btn" onclick="fireAdmin('${admin.id}')">
            <i class="fas fa-user-minus"></i> Уволить
          </button>
        </div>
      ` : ''}
    </div>
  `).join('');
}

function hireAdmin() {
  const username = document.getElementById("newAdminUsername")?.value.trim();
  if (!username) {
    showToast("Введите никнейм пользователя", "error");
    return;
  }
  
  if (admins.find(a => a.username === username)) {
    showToast("Этот пользователь уже является администратором", "error");
    return;
  }
  
  const currentAdmin = admins.find(a => a.username === (localStorage.getItem("apex_user") || "Admin"));
  const newAdmin = {
    id: "admin_" + Date.now(),
    username: username,
    isOwner: false,
    hiredBy: currentAdmin?.username || "System",
    hiredAt: new Date().toISOString()
  };
  
  admins.push(newAdmin);
  saveAdmins();
  renderAdminsList();
  updateAdminStats();
  
  document.getElementById("newAdminUsername").value = "";
  showToast(`✅ ${username} назначен администратором!`, "success");
}

function fireAdmin(adminId) {
  const admin = admins.find(a => a.id === adminId);
  if (!admin) return;
  
  const currentUser = localStorage.getItem("apex_user") || "Admin";
  const currentAdmin = admins.find(a => a.username === currentUser);
  
  if (!currentAdmin || (!currentAdmin.isOwner && currentAdmin.username !== admin.hiredBy)) {
    showToast("У вас нет прав для увольнения этого администратора", "error");
    return;
  }
  
  if (confirm(`Уволить администратора ${admin.username}?`)) {
    admins = admins.filter(a => a.id !== adminId);
    saveAdmins();
    renderAdminsList();
    updateAdminStats();
    showToast(`✅ ${admin.username} уволен`, "success");
  }
}

function isUserAdmin(username) {
  return admins.some(a => a.username === username);
}

// ==================== 2. МОДЕРАЦИЯ ТОВАРОВ ====================

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

function savePendingProducts() {
  localStorage.setItem("apex_pending_products", JSON.stringify(pendingProducts));
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
        <img src="${escapeHtml(product.imageUrl || 'https://picsum.photos/id/42/50/50')}" alt="">
      </div>
      <div class="pending-product-info">
        <div class="pending-product-title">${escapeHtml(product.title)}</div>
        <div class="pending-product-price">${escapeHtml(product.price)}</div>
        <div class="pending-product-seller">Продавец: ${escapeHtml(product.seller)}</div>
        <div class="pending-product-date">Создан: ${new Date(product.createdAt).toLocaleString()}</div>
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

function sendModerationNotification(sellerName, productTitle, approved, reason = "") {
  let dialog = adminDialogs.find(d => d.userName === sellerName);
  
  if (!dialog) {
    dialog = {
      id: "admin_dialog_" + Date.now(),
      userName: sellerName,
      userId: sellerName,
      messages: [],
      lastMessageTime: new Date().toISOString()
    };
    adminDialogs.unshift(dialog);
  }
  
  const messageText = approved 
    ? `✅ Ваш товар "${productTitle}" прошел модерацию и опубликован!`
    : `❌ Ваш товар "${productTitle}" отклонен модерацией.${reason ? `\nПричина: ${reason}` : ""}\nВы можете отредактировать товар и отправить на повторную модерацию.`;
  
  dialog.messages.push({
    sender: "support",
    text: messageText,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: new Date().toISOString()
  });
  dialog.lastMessageTime = new Date().toISOString();
  
  saveAdminDialogs();
  renderAdminDialogsList();
}

// ==================== 3. РЕДАКТИРОВАНИЕ СЛАЙДЕРОВ ====================

function openSliderEditor() {
  const modal = document.getElementById("sliderEditorModal");
  if (modal) {
    renderSliderEditorContent();
    modal.classList.add("active");
  }
}

function closeSliderEditor() {
  const modal = document.getElementById("sliderEditorModal");
  if (modal) modal.classList.remove("active");
}

function renderSliderEditorContent() {
  const container = document.getElementById("sliderEditorContent");
  if (!container) return;
  
  const sliders = document.querySelectorAll('.mini-slider');
  const slidesData = [];
  
  sliders.forEach((slider, index) => {
    const images = slider.querySelectorAll('.mini-slide-img');
    const imageUrls = Array.from(images).map(img => img.src);
    slidesData.push({
      index: index,
      images: imageUrls
    });
  });
  
  if (slidesData.length === 0) {
    container.innerHTML = '<div class="empty-state">Слайды не найдены</div>';
    return;
  }
  
  container.innerHTML = slidesData.map(slide => `
    <div class="slider-editor-card">
      <div class="slider-editor-header">
        <h4>Слайд ${slide.index + 1}</h4>
        <button class="add-slide-image-btn" onclick="addSlideImage(${slide.index})">
          <i class="fas fa-plus"></i> Добавить изображение
        </button>
      </div>
      <div class="slider-editor-images" id="sliderEditorImages_${slide.index}">
        ${slide.images.map((img, imgIndex) => `
          <div class="slider-image-item">
            <img src="${escapeHtml(img)}" alt="slide ${imgIndex + 1}">
            <div class="slider-image-actions">
              <input type="text" class="image-url-input" value="${escapeHtml(img)}" 
                     onchange="updateSlideImage(${slide.index}, ${imgIndex}, this.value)">
              <button class="remove-image-btn" onclick="removeSlideImage(${slide.index}, ${imgIndex})">
                <i class="fas fa-trash"></i>
              </button>
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
    const imagesContainer = slider.querySelector('.mini-slider-images');
    const newImg = document.createElement('img');
    newImg.className = 'mini-slide-img';
    newImg.src = newUrl;
    newImg.alt = `slide ${imagesContainer.children.length + 1}`;
    imagesContainer.appendChild(newImg);
    
    const dotsContainer = slider.querySelector('.mini-slider-dots');
    if (dotsContainer) {
      const newDot = document.createElement('div');
      newDot.className = 'mini-dot';
      dotsContainer.appendChild(newDot);
    }
    
    if (typeof initMiniSliders === 'function') {
      initMiniSliders();
    }
  }
  
  renderSliderEditorContent();
  showToast("Изображение добавлено!", "success");
}

function updateSlideImage(sliderIndex, imageIndex, newUrl) {
  if (!newUrl) return;
  
  const slider = document.querySelector(`.mini-slider[data-slider="${sliderIndex}"]`);
  if (slider) {
    const images = slider.querySelectorAll('.mini-slide-img');
    if (images[imageIndex]) {
      images[imageIndex].src = newUrl;
    }
  }
  
  showToast("Изображение обновлено!", "success");
}

function removeSlideImage(sliderIndex, imageIndex) {
  if (confirm("Удалить это изображение?")) {
    const slider = document.querySelector(`.mini-slider[data-slider="${sliderIndex}"]`);
    if (slider) {
      const images = slider.querySelectorAll('.mini-slide-img');
      const dots = slider.querySelectorAll('.mini-dot');
      
      if (images[imageIndex]) {
        images[imageIndex].remove();
        if (dots[imageIndex]) dots[imageIndex].remove();
      }
      
      if (typeof initMiniSliders === 'function') {
        initMiniSliders();
      }
    }
    
    renderSliderEditorContent();
    showToast("Изображение удалено!", "success");
  }
}

// ==================== 4. ЧАТ ПОДДЕРЖКИ ====================

function loadAdminDialogs() {
  const stored = localStorage.getItem("apex_admin_dialogs");
  if (stored) {
    adminDialogs = JSON.parse(stored);
  } else {
    adminDialogs = [
      {
        id: "admin_dialog_1",
        userName: "Гость",
        userId: "guest",
        messages: [
          {
            sender: "guest",
            text: "Здравствуйте! У меня проблема с оплатой",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date(Date.now() - 3600000).toISOString()
          }
        ],
        lastMessageTime: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    saveAdminDialogs();
  }
  renderAdminDialogsList();
  updateAdminStats();
}

function saveAdminDialogs() {
  localStorage.setItem("apex_admin_dialogs", JSON.stringify(adminDialogs));
}

function renderAdminDialogsList(searchTerm = '') {
  const container = document.getElementById("adminDialogsList");
  if (!container) return;
  
  let filtered = adminDialogs;
  if (searchTerm) {
    filtered = adminDialogs.filter(d => d.userName.toLowerCase().includes(searchTerm.toLowerCase()));
  }
  
  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-dialogs"><i class="fas fa-comments"></i><p>Нет диалогов</p></div>';
    return;
  }
  
  container.innerHTML = filtered.map(dialog => {
    const lastMsg = dialog.messages[dialog.messages.length - 1];
    const preview = lastMsg ? (lastMsg.sender === "support" ? "Поддержка: " + lastMsg.text : lastMsg.text) : "Нет сообщений";
    const shortPreview = preview.length > 40 ? preview.substring(0, 40) + '...' : preview;
    const hasUnread = dialog.messages.some(m => m.sender !== "support" && !m.read);
    
    return `
      <div class="admin-dialog-item ${adminCurrentDialogId === dialog.id ? 'active' : ''}" 
           onclick="openAdminDialog('${dialog.id}')">
        <div class="admin-dialog-avatar">
          <i class="fas fa-user-circle"></i>
          ${hasUnread ? '<span class="unread-badge"></span>' : ''}
        </div>
        <div class="admin-dialog-info">
          <div class="admin-dialog-name">${escapeHtml(dialog.userName)}</div>
          <div class="admin-dialog-preview">${escapeHtml(shortPreview)}</div>
        </div>
        <div class="admin-dialog-time">
          ${lastMsg ? lastMsg.time : ''}
        </div>
      </div>
    `;
  }).join('');
}

function openAdminDialog(dialogId) {
  const dialog = adminDialogs.find(d => d.id === dialogId);
  if (!dialog) return;
  
  adminCurrentDialogId = dialogId;
  
  dialog.messages.forEach(m => {
    if (m.sender !== "support") m.read = true;
  });
  saveAdminDialogs();
  
  const sidebar = document.getElementById("adminChatSidebar");
  const chatWindow = document.getElementById("adminChatWindow");
  
  if (sidebar) sidebar.classList.add("hide");
  if (chatWindow) {
    chatWindow.style.display = "flex";
    chatWindow.classList.add("active");
  }
  
  const partnerName = document.getElementById("adminChatPartnerName");
  if (partnerName) partnerName.textContent = dialog.userName;
  
  renderAdminMessages(dialogId);
  renderAdminDialogsList();
}

function closeAdminChat() {
  const sidebar = document.getElementById("adminChatSidebar");
  const chatWindow = document.getElementById("adminChatWindow");
  
  if (sidebar) sidebar.classList.remove("hide");
  if (chatWindow) {
    chatWindow.style.display = "none";
    chatWindow.classList.remove("active");
  }
  adminCurrentDialogId = null;
}

function renderAdminMessages(dialogId) {
  const dialog = adminDialogs.find(d => d.id === dialogId);
  const area = document.getElementById("adminChatMessagesArea");
  if (!area || !dialog) return;
  
  if (dialog.messages.length === 0) {
    area.innerHTML = '<div class="empty-messages"><i class="fas fa-comment-dots"></i><p>Нет сообщений</p></div>';
    return;
  }
  
  let html = '';
  let lastDate = null;
  
  dialog.messages.forEach((msg) => {
    const isOut = msg.sender === "support";
    const msgDate = new Date(msg.timestamp);
    const today = new Date();
    const isToday = msgDate.toDateString() === today.toDateString();
    
    if (lastDate !== msgDate.toDateString()) {
      lastDate = msgDate.toDateString();
      const dateStr = isToday ? 'Сегодня' : msgDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
      html += `<div class="date-divider"><span>${dateStr}</span></div>`;
    }
    
    let messageText = escapeHtml(msg.text);
    messageText = messageText.replace(/\n/g, '<br>');
    
    html += `
      <div class="message-group ${isOut ? 'outgoing' : 'incoming'}">
        <div class="message-content">
          <div class="message-bubble ${isOut ? 'out' : 'in'}">
            ${messageText}
          </div>
          <div class="message-time">${msg.time}</div>
        </div>
      </div>
    `;
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
  
  const now = new Date();
  const newMsg = {
    sender: "support",
    text: text,
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: now.toISOString()
  };
  
  adminDialogs[dialogIndex].messages.push(newMsg);
  adminDialogs[dialogIndex].lastMessageTime = now.toISOString();
  saveAdminDialogs();
  
  renderAdminMessages(adminCurrentDialogId);
  renderAdminDialogsList();
  input.value = "";
  
  syncMessageToUserChat(adminDialogs[dialogIndex].userName, text);
}

function syncMessageToUserChat(userName, messageText) {
  let dialogs = JSON.parse(localStorage.getItem("apex_dialogs") || "[]");
  let userDialog = dialogs.find(d => d.name === userName);
  
  if (!userDialog) {
    userDialog = {
      id: "user_" + Date.now(),
      name: userName,
      avatar: "👤",
      messages: []
    };
    dialogs.push(userDialog);
  }
  
  userDialog.messages.push({
    user: "Support",
    text: messageText,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: new Date().toISOString()
  });
  
  localStorage.setItem("apex_dialogs", JSON.stringify(dialogs));
}

function setupAdminChatListeners() {
  const sendBtn = document.getElementById("sendAdminChatMsgBtn");
  const msgInput = document.getElementById("adminChatMessageInput");
  const searchInput = document.getElementById("adminChatSearchInput");
  const backBtn = document.getElementById("backToAdminChatListBtn");
  
  if (sendBtn) {
    const newBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newBtn, sendBtn);
    newBtn.onclick = sendAdminMessage;
  }
  
  if (msgInput) {
    msgInput.onkeypress = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendAdminMessage();
      }
    };
  }
  
  if (searchInput) {
    searchInput.oninput = (e) => {
      renderAdminDialogsList(e.target.value);
    };
  }
  
  if (backBtn) {
    const newBackBtn = backBtn.cloneNode(true);
    backBtn.parentNode.replaceChild(newBackBtn, backBtn);
    newBackBtn.onclick = closeAdminChat;
  }
}

// ==================== 5. КНОПОЧНАЯ НАВИГАЦИЯ ====================

function renderAdminNavButtons() {
  const container = document.getElementById("adminNavButtons");
  if (!container) return;
  
  const sections = [
    { id: "adminMainSection", name: "📊 Главная", icon: "fa-tachometer-alt" },
    { id: "adminAdminsSection", name: "👥 Администраторы", icon: "fa-users" },
    { id: "adminKeywordsSection", name: "🏷️ Ключевые слова", icon: "fa-tags" }, // <-- ДОБАВЛЕНО
    { id: "adminModerationSection", name: "📝 Модерация", icon: "fa-clipboard-list" },
    { id: "adminSlidersSection", name: "🖼️ Слайдеры", icon: "fa-images" },
    { id: "adminChatSection", name: "💬 Чат поддержки", icon: "fa-headset" },
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
    "adminModerationSection", "adminSlidersSection", "adminChatSection", 
    "adminProductsSection", "adminGamesSection", "adminAppsSection"
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

// ==================== 6. БЛОКИ ИГР И ПРИЛОЖЕНИЙ ====================

function loadGameBlocks() {
  const stored = localStorage.getItem("apex_game_blocks");
  if (stored) {
    gameBlocks = JSON.parse(stored);
  } else {
    gameBlocks = [
      { id: "1", name: "Другие игры", keywordId: "", icon: "fas fa-gamepad", imageUrl: "" },
      { id: "2", name: "Roblox", keywordId: "", icon: "fab fa-fort-awesome", imageUrl: "" },
      { id: "3", name: "Valorant", keywordId: "", icon: "fas fa-crosshairs", imageUrl: "" },
      { id: "4", name: "Minecraft", keywordId: "", icon: "fas fa-cube", imageUrl: "" },
      { id: "5", name: "Counter-Strike", keywordId: "", icon: "fas fa-skull", imageUrl: "" },
      { id: "6", name: "Arena Breakout", keywordId: "", icon: "fas fa-crosshairs", imageUrl: "" },
      { id: "7", name: "Rust", keywordId: "", icon: "fas fa-tree", imageUrl: "" },
      { id: "8", name: "PUBG", keywordId: "", icon: "fas fa-plane", imageUrl: "" },
      { id: "9", name: "Crimson Desert", keywordId: "", icon: "fas fa-dragon", imageUrl: "" },
      { id: "10", name: "Танки", keywordId: "", icon: "fas fa-tank", imageUrl: "" }
    ];
    localStorage.setItem("apex_game_blocks", JSON.stringify(gameBlocks));
  }
  renderGamesBlocks();
  renderHomeGameBlocks();
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
          ${block.imageUrl ? 
            `<img src="${escapeHtml(block.imageUrl)}" alt="${escapeHtml(block.name)}">` : 
            `<i class="${block.icon}"></i>`
          }
        </div>
        <div>
          <div class="game-block-name">${escapeHtml(block.name)}</div>
          <div class="game-block-keyword">${block.keywordId ? '🔗 Привязан к ключевому слову' : '📌 Без привязки'}</div>
          ${block.imageUrl ? `<div class="game-block-keyword">📷 Фото установлено</div>` : ''}
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
  
  const midIndex = Math.ceil(gameBlocks.length / 2);
  const firstRow = gameBlocks.slice(0, midIndex);
  const secondRow = gameBlocks.slice(midIndex);
  
  const firstRowHtml = firstRow.map(block => {
    let keywordName = block.name;
    let hasKeyword = false;
    if (block.keywordId && block.keywordId !== "") {
      const kw = keywords.find(k => k.id === block.keywordId);
      if (kw) {
        keywordName = kw.name;
        hasKeyword = true;
      }
    }
    return `
      <div class="game-card" onclick="openKeywordPage('${escapeHtml(keywordName)}')">
        <div class="game-icon">
          ${block.imageUrl ? 
            `<img src="${escapeHtml(block.imageUrl)}" alt="${escapeHtml(block.name)}">` : 
            `<i class="${block.icon}"></i>`
          }
        </div>
        <div class="game-name">${escapeHtml(block.name)}</div>
        ${hasKeyword ? `<div class="game-keyword-badge">🔗 ${escapeHtml(keywordName)}</div>` : ''}
      </div>
    `;
  }).join('');
  
  const secondRowHtml = secondRow.map(block => {
    let keywordName = block.name;
    let hasKeyword = false;
    if (block.keywordId && block.keywordId !== "") {
      const kw = keywords.find(k => k.id === block.keywordId);
      if (kw) {
        keywordName = kw.name;
        hasKeyword = true;
      }
    }
    return `
      <div class="game-card" onclick="openKeywordPage('${escapeHtml(keywordName)}')">
        <div class="game-icon">
          ${block.imageUrl ? 
            `<img src="${escapeHtml(block.imageUrl)}" alt="${escapeHtml(block.name)}">` : 
            `<i class="${block.icon}"></i>`
          }
        </div>
        <div class="game-name">${escapeHtml(block.name)}</div>
        ${hasKeyword ? `<div class="game-keyword-badge">🔗 ${escapeHtml(keywordName)}</div>` : ''}
      </div>
    `;
  }).join('');
  
  container.innerHTML = `
    <div class="games-row">${firstRowHtml}</div>
    <div class="games-row-second">${secondRowHtml}</div>
  `;
}

function addGameBlock() {
  const name = document.getElementById("newGameName")?.value.trim();
  const keywordId = document.getElementById("newGameKeyword")?.value;
  const icon = document.getElementById("newGameIcon")?.value;
  const imageUrl = document.getElementById("newGameImageUrl")?.value.trim();
  
  if (!name) {
    alert("Введите название блока");
    return;
  }
  
  const newBlock = {
    id: Date.now().toString(),
    name: name,
    keywordId: keywordId || "",
    icon: icon || "fas fa-gamepad",
    imageUrl: imageUrl || ""
  };
  
  gameBlocks.push(newBlock);
  localStorage.setItem("apex_game_blocks", JSON.stringify(gameBlocks));
  renderGamesBlocks();
  renderHomeGameBlocks();
  updateGameKeywordSelect();
  
  document.getElementById("newGameName").value = "";
  document.getElementById("newGameKeyword").value = "";
  document.getElementById("newGameIcon").value = "fas fa-gamepad";
  document.getElementById("newGameImageUrl").value = "";
  
  showToast("✅ Блок игры добавлен!", "success");
}

function deleteGameBlock(id) {
  if (confirm("Удалить этот блок?")) {
    gameBlocks = gameBlocks.filter(b => b.id !== id);
    localStorage.setItem("apex_game_blocks", JSON.stringify(gameBlocks));
    renderGamesBlocks();
    renderHomeGameBlocks();
    showToast("✅ Блок удален", "success");
  }
}

function editGameBlock(id) {
  const block = gameBlocks.find(b => b.id === id);
  if (!block) return;
  
  const newName = prompt("Введите новое название:", block.name);
  if (newName && newName.trim()) {
    block.name = newName.trim();
    
    const newImageUrl = prompt("Введите URL нового фото (оставьте пустым для использования иконки):", block.imageUrl || "");
    if (newImageUrl !== null) {
      block.imageUrl = newImageUrl.trim();
    }
    
    localStorage.setItem("apex_game_blocks", JSON.stringify(gameBlocks));
    renderGamesBlocks();
    renderHomeGameBlocks();
    showToast("✅ Блок обновлен!", "success");
  }
}

function loadAppBlocks() {
  const stored = localStorage.getItem("apex_app_blocks");
  if (stored) {
    appBlocks = JSON.parse(stored);
  } else {
    appBlocks = [
      { id: "app1", name: "Telegram", keywordId: "", icon: "fab fa-telegram", imageUrl: "" },
      { id: "app2", name: "WhatsApp", keywordId: "", icon: "fab fa-whatsapp", imageUrl: "" },
      { id: "app3", name: "Instagram", keywordId: "", icon: "fab fa-instagram", imageUrl: "" },
      { id: "app4", name: "TikTok", keywordId: "", icon: "fab fa-tiktok", imageUrl: "" },
      { id: "app5", name: "YouTube", keywordId: "", icon: "fab fa-youtube", imageUrl: "" },
      { id: "app6", name: "Spotify", keywordId: "", icon: "fab fa-spotify", imageUrl: "" },
      { id: "app7", name: "Netflix", keywordId: "", icon: "fas fa-tv", imageUrl: "" },
      { id: "app8", name: "Discord", keywordId: "", icon: "fab fa-discord", imageUrl: "" }
    ];
    localStorage.setItem("apex_app_blocks", JSON.stringify(appBlocks));
  }
  renderAppsBlocks();
  renderHomeAppBlocks();
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
          ${block.imageUrl ? 
            `<img src="${escapeHtml(block.imageUrl)}" alt="${escapeHtml(block.name)}">` : 
            `<i class="${block.icon}"></i>`
          }
        </div>
        <div>
          <div class="game-block-name">${escapeHtml(block.name)}</div>
          <div class="game-block-keyword">${block.keywordId ? '🔗 Привязан к ключевому слову' : '📌 Без привязки'}</div>
          ${block.imageUrl ? `<div class="game-block-keyword">📷 Фото установлено</div>` : ''}
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
  
  const midIndex = Math.ceil(appBlocks.length / 2);
  const firstRow = appBlocks.slice(0, midIndex);
  const secondRow = appBlocks.slice(midIndex);
  
  const firstRowHtml = firstRow.map(block => {
    let keywordName = block.name;
    let hasKeyword = false;
    if (block.keywordId && block.keywordId !== "") {
      const kw = keywords.find(k => k.id === block.keywordId);
      if (kw) {
        keywordName = kw.name;
        hasKeyword = true;
      }
    }
    return `
      <div class="game-card" onclick="openKeywordPage('${escapeHtml(keywordName)}')">
        <div class="game-icon">
          ${block.imageUrl ? 
            `<img src="${escapeHtml(block.imageUrl)}" alt="${escapeHtml(block.name)}">` : 
            `<i class="${block.icon}"></i>`
          }
        </div>
        <div class="game-name">${escapeHtml(block.name)}</div>
        ${hasKeyword ? `<div class="game-keyword-badge">🔗 ${escapeHtml(keywordName)}</div>` : ''}
      </div>
    `;
  }).join('');
  
  const secondRowHtml = secondRow.map(block => {
    let keywordName = block.name;
    let hasKeyword = false;
    if (block.keywordId && block.keywordId !== "") {
      const kw = keywords.find(k => k.id === block.keywordId);
      if (kw) {
        keywordName = kw.name;
        hasKeyword = true;
      }
    }
    return `
      <div class="game-card" onclick="openKeywordPage('${escapeHtml(keywordName)}')">
        <div class="game-icon">
          ${block.imageUrl ? 
            `<img src="${escapeHtml(block.imageUrl)}" alt="${escapeHtml(block.name)}">` : 
            `<i class="${block.icon}"></i>`
          }
        </div>
        <div class="game-name">${escapeHtml(block.name)}</div>
        ${hasKeyword ? `<div class="game-keyword-badge">🔗 ${escapeHtml(keywordName)}</div>` : ''}
      </div>
    `;
  }).join('');
  
  container.innerHTML = `
    <div class="games-row">${firstRowHtml}</div>
    <div class="games-row-second">${secondRowHtml}</div>
  `;
}

function addAppBlock() {
  const name = document.getElementById("newAppName")?.value.trim();
  const keywordId = document.getElementById("newAppKeyword")?.value;
  const icon = document.getElementById("newAppIcon")?.value;
  const imageUrl = document.getElementById("newAppImageUrl")?.value.trim();
  
  if (!name) {
    alert("Введите название приложения");
    return;
  }
  
  const newBlock = {
    id: "app_" + Date.now().toString(),
    name: name,
    keywordId: keywordId || "",
    icon: icon || "fab fa-android",
    imageUrl: imageUrl || ""
  };
  
  appBlocks.push(newBlock);
  localStorage.setItem("apex_app_blocks", JSON.stringify(appBlocks));
  renderAppsBlocks();
  renderHomeAppBlocks();
  updateAppKeywordSelect();
  
  document.getElementById("newAppName").value = "";
  document.getElementById("newAppKeyword").value = "";
  document.getElementById("newAppIcon").value = "fab fa-android";
  document.getElementById("newAppImageUrl").value = "";
  
  showToast("✅ Блок приложения добавлен!", "success");
}

function deleteAppBlock(id) {
  if (confirm("Удалить этот блок?")) {
    appBlocks = appBlocks.filter(b => b.id !== id);
    localStorage.setItem("apex_app_blocks", JSON.stringify(appBlocks));
    renderAppsBlocks();
    renderHomeAppBlocks();
    showToast("✅ Блок удален", "success");
  }
}

function editAppBlock(id) {
  const block = appBlocks.find(b => b.id === id);
  if (!block) return;
  
  const newName = prompt("Введите новое название:", block.name);
  if (newName && newName.trim()) {
    block.name = newName.trim();
    
    const newImageUrl = prompt("Введите URL нового фото (оставьте пустым для использования иконки):", block.imageUrl || "");
    if (newImageUrl !== null) {
      block.imageUrl = newImageUrl.trim();
    }
    
    localStorage.setItem("apex_app_blocks", JSON.stringify(appBlocks));
    renderAppsBlocks();
    renderHomeAppBlocks();
    showToast("✅ Блок обновлен!", "success");
  }
}

// ==================== КЛЮЧЕВЫЕ СЛОВА (СИНХРОНИЗАЦИЯ С СЕРВЕРОМ) ====================

async function loadKeywords() {
    try {
        const response = await fetch('/api/keywords');
        if (!response.ok) throw new Error('Ошибка загрузки ключевых слов');
        keywords = await response.json();
        renderKeywords();
        updateKeywordSelect();
        updateGameKeywordSelect();
        updateAppKeywordSelect();
        console.log('✅ Ключевые слова загружены:', keywords.length);
    } catch(e) {
        console.error('Ошибка загрузки ключевых слов:', e);
        keywords = [];
    }
}

async function addKeyword() {
    const name = document.getElementById("newKeywordName")?.value.trim();
    const type = document.getElementById("newKeywordType")?.value.trim();
    
    if (!name) {
        showToast("Введите название ключевого слова", "error");
        return;
    }
    
    try {
        const newKeyword = await API.createKeyword({
            name: name,
            type: type || "Стандарт"
        });
        
        // Обновляем локальный массив
        window.keywords = await API.getKeywords();
        
        renderKeywords();
        updateKeywordSelect();
        updateGameKeywordSelect();
        updateAppKeywordSelect();
        
        document.getElementById("newKeywordName").value = "";
        document.getElementById("newKeywordType").value = "";
        
        showToast(`✅ Ключевое слово "${name}" добавлено!`, "success");
        
    } catch (error) {
        console.error('Error adding keyword:', error);
        showToast("❌ Ошибка при добавлении: " + error.message, "error");
    }
}

async function deleteKeyword(keywordId) {
    if (confirm("Удалить это ключевое слово? Все товары с ним останутся, но категория пропадёт.")) {
        try {
            await API.deleteKeyword(keywordId);
            window.keywords = await API.getKeywords();
            renderKeywords();
            updateKeywordSelect();
            updateGameKeywordSelect();
            updateAppKeywordSelect();
            showToast("✅ Ключевое слово удалено", "success");
        } catch (error) {
            console.error('Error deleting keyword:', error);
            showToast("❌ Ошибка при удалении: " + error.message, "error");
        }
    }
}

// function renderKeywords() {
//     const container = document.getElementById("keywordsList");
//     if (!container) return;
    
//     const keywords = window.keywords || [];
    
//     if (keywords.length === 0) {
//         container.innerHTML = '<div class="empty-state">Нет ключевых слов</div>';
//         return;
//     }
    
//     container.innerHTML = keywords.map(k => `
//         <div class="keyword-item">
//             <div class="keyword-info">
//                 <span class="keyword-name">${escapeHtml(k.name)}</span>
//                 <span class="keyword-type">${escapeHtml(k.type)}</span>
//             </div>
//             <div class="keyword-actions">
//                 <button class="delete-keyword-btn" onclick="deleteKeyword('${k.id}')">
//                     <i class="fas fa-trash"></i>
//                 </button>
//             </div>
//         </div>
//     `).join('');
// }

function updateKeywordSelect() {
    const select = document.getElementById("postKeyword");
    if (!select) return;
    
    const keywords = window.keywords || [];
    
    select.innerHTML = '<option value="">Выберите ключевое слово/категорию</option>';
    keywords.forEach(k => {
        select.innerHTML += `<option value="${escapeHtml(k.id)}">${escapeHtml(k.name)} - ${escapeHtml(k.type)}</option>`;
    });
}

function updateGameKeywordSelect() {
    const select = document.getElementById("newGameKeyword");
    if (!select) return;
    
    const keywords = window.keywords || [];
    
    select.innerHTML = '<option value="">Без привязки к ключевому слову</option>';
    keywords.forEach(k => {
        select.innerHTML += `<option value="${escapeHtml(k.id)}">${escapeHtml(k.name)} - ${escapeHtml(k.type)}</option>`;
    });
}

function updateAppKeywordSelect() {
    const select = document.getElementById("newAppKeyword");
    if (!select) return;
    
    const keywords = window.keywords || [];
    
    select.innerHTML = '<option value="">Без привязки к ключевому слову</option>';
    keywords.forEach(k => {
        select.innerHTML += `<option value="${escapeHtml(k.id)}">${escapeHtml(k.name)} - ${escapeHtml(k.type)}</option>`;
    });
}

async function updateAdminStats() {
    try {
        const products = await API.getProducts();
        const productsCount = document.getElementById("adminProductsCount");
        if (productsCount) productsCount.innerText = products.length;
    } catch(e) {
        console.error('Stats update error:', e);
    }
    
    const pendingCount = document.getElementById("adminPendingCount");
    if (pendingCount) pendingCount.innerText = pendingProducts.length;
    
    const adminsCount = document.getElementById("adminAdminsCount");
    if (adminsCount) adminsCount.innerText = admins.length;
    
    const dialogsCount = document.getElementById("adminDialogsCount");
    if (dialogsCount) dialogsCount.innerText = adminDialogs.length;
}

// function saveKeywords() {
//   localStorage.setItem("apex_keywords", JSON.stringify(keywords));
// }

// function renderKeywords() {
//   const container = document.getElementById("keywordsList");
//   if (!container) return;
  
//   if (keywords.length === 0) {
//     container.innerHTML = '<div class="empty-state">Нет ключевых слов</div>';
//     return;
//   }
  
//   container.innerHTML = keywords.map(k => `
//     <div class="keyword-item">
//       <div class="keyword-info">
//         <span class="keyword-name">${escapeHtml(k.name)}</span>
//         <span class="keyword-type">${escapeHtml(k.type)}</span>
//       </div>
//       <div class="keyword-actions">
//         <button class="edit-keyword-btn" onclick="editKeyword('${k.id}')">
//           <i class="fas fa-edit"></i>
//         </button>
//         <button class="delete-keyword-btn" onclick="deleteKeyword('${k.id}')">
//           <i class="fas fa-trash"></i>
//         </button>
//       </div>
//     </div>
//   `).join('');
// }

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

function editKeyword(keywordId) {
  const keyword = keywords.find(k => k.id === keywordId);
  if (!keyword) return;
  
  const newName = prompt("Введите новое название:", keyword.name);
  if (newName && newName.trim()) {
    keyword.name = newName.trim();
  }
  
  const newType = prompt("Введите новый тип:", keyword.type);
  if (newType !== null) {
    keyword.type = newType.trim() || "Стандарт";
  }
  
  // saveKeywords();
  renderKeywords();
  updateKeywordSelect();
  updateGameKeywordSelect();
  updateAppKeywordSelect();
  
  showToast(`✅ Ключевое слово обновлено!`, "success");
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
    select.innerHTML += `<option value="${escapeHtml(k.id)}">${escapeHtml(k.name)} - ${escapeHtml(k.type)}</option>`;
  });
}

function updateGameKeywordSelect() {
  const select = document.getElementById("newGameKeyword");
  if (!select) return;
  
  select.innerHTML = '<option value="">Без привязки к ключевому слову</option>';
  keywords.forEach(k => {
    select.innerHTML += `<option value="${escapeHtml(k.id)}">${escapeHtml(k.name)} - ${escapeHtml(k.type)}</option>`;
  });
}

function updateAppKeywordSelect() {
  const select = document.getElementById("newAppKeyword");
  if (!select) return;
  
  select.innerHTML = '<option value="">Без привязки к ключевому слову</option>';
  keywords.forEach(k => {
    select.innerHTML += `<option value="${escapeHtml(k.id)}">${escapeHtml(k.name)} - ${escapeHtml(k.type)}</option>`;
  });
}

// ==================== 8. УПРАВЛЕНИЕ ТОВАРАМИ ====================

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
// Очистка формы
function clearProductForm() {
    document.getElementById("postKeyword").value = "";
    document.getElementById("postType").value = "";
    document.getElementById("postTitle").value = "";
    document.getElementById("postPrice").value = "";
    document.getElementById("postDiscount").value = "";
    document.getElementById("postDescription").value = "";
    document.getElementById("postImageUrl").value = "";
    document.getElementById("postSeller").value = "";
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
function editProduct(productId) {
    // Сначала получаем товары с сервера
    API.getProducts().then(products => {
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            alert("Товар не найден");
            return;
        }
        
        // Заполняем форму
        document.getElementById("postTitle").value = product.title;
        document.getElementById("postPrice").value = product.price;
        document.getElementById("postDiscount").value = product.discount || "";
        document.getElementById("postDescription").value = product.fullDesc || product.description || "";
        document.getElementById("postImageUrl").value = product.image_url || "";
        document.getElementById("postSeller").value = product.seller || "";
        
        // Находим ключевое слово по имени
        if (product.keyword) {
            API.getKeywords().then(keywords => {
                const kw = keywords.find(k => k.name === product.keyword);
                if (kw) {
                    document.getElementById("postKeyword").value = kw.id;
                }
            });
        }
        
        // Удаляем старый товар
        deleteProduct(productId).then(() => {
            document.querySelector(".admin-card")?.scrollIntoView({ behavior: "smooth" });
            showToast("Редактирование: заполните форму и нажмите 'Опубликовать товар'", "info");
        });
    });
}

// ==================== 9. ОТКРЫТИЕ СТРАНИЦЫ ПО КЛЮЧЕВОМУ СЛОВУ ====================

function openKeywordPage(keyword) {
  console.log("openKeywordPage called with:", keyword);
  const products = JSON.parse(localStorage.getItem("apex_products") || "[]");
  const filteredProducts = products.filter(p => 
    p.keyword && p.keyword.toLowerCase().includes(keyword.toLowerCase())
  );
  
  const container = document.getElementById("keywordProductsGrid");
  const title = document.getElementById("keywordPageTitle");
  
  if (title) title.innerText = keyword;
  
  if (container) {
    if (filteredProducts.length === 0) {
      container.innerHTML = "<div class='empty-state'><i class='fas fa-box-open'></i><p>Нет товаров по этой категории</p></div>";
    } else {
      let html = "";
      filteredProducts.forEach(prod => {
        html += `
          <div class="product-card" onclick="window.openProductDetailById('${prod.id}')">
            <div class="card-image">
              <img src="${escapeHtml(prod.imageUrl || 'https://picsum.photos/id/42/400/300')}" 
                   alt="${escapeHtml(prod.title)}"
                   loading="lazy"
                   onerror="this.src='https://picsum.photos/id/42/400/300'">
              ${prod.discount ? `<span class="discount-badge">🔥 ${prod.discount}</span>` : ''}
            </div>
            <div class="card-body">
              <div class="price-wrapper">
                <span class="current-price">${escapeHtml(prod.price)}</span>
                ${prod.originalPrice ? `<span class="old-price">${escapeHtml(prod.originalPrice)}</span>` : ''}
              </div>
              <h3 class="product-title">${escapeHtml(prod.title)}</h3>
              <div class="rating">
                <span class="stars">★★★★★</span>
                <span class="reviews-count">${prod.sales || 0} отзывов</span>
              </div>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
    }
  }
  
  if (typeof navigate === 'function') {
    navigate("keywordPage");
  } else if (typeof showPage === 'function') {
    showPage("keywordPage");
  }
}

// ==================== 10. ВХОД В АДМИНКУ ====================

function toggleAdminPanel() {
  const currentUser = localStorage.getItem("apex_user") || "Гость";
  
  if (!isUserAdmin(currentUser)) {
    const password = prompt("Введите пароль администратора:");
    if (password === ADMIN_PASSWORD) {
      if (!admins.find(a => a.username === currentUser)) {
        admins.push({
          id: "admin_" + Date.now(),
          username: currentUser,
          isOwner: admins.length === 0,
          hiredBy: "system",
          hiredAt: new Date().toISOString()
        });
        saveAdmins();
      }
      showAdminUI();
    } else {
      alert("Неверный пароль!");
    }
  } else {
    if (typeof navigate === 'function') {
      navigate("admin");
    } else if (typeof showPage === 'function') {
      showPage("admin");
    }
  }
}

function showAdminUI() {
  const adminBtn = document.getElementById("adminToggleBtn");
  if (adminBtn) {
    adminBtn.style.background = "var(--accent-primary)";
    adminBtn.innerHTML = '<i class="fas fa-user-shield"></i>';
  }
  
  const bottomNav = document.getElementById("bottomNav");
  if (bottomNav && !document.getElementById("adminNavBtn")) {
    const adminNavBtn = document.createElement("button");
    adminNavBtn.className = "nav-item";
    adminNavBtn.id = "adminNavBtn";
    adminNavBtn.setAttribute("data-nav", "admin");
    adminNavBtn.innerHTML = '<div class="nav-icon"></div><div class="nav-label">Админ</div>';
    
    const navContainer = document.getElementById("navContainer");
    if (navContainer) {
      navContainer.appendChild(adminNavBtn);
    }
    
    if (window.initBlobNavigation) window.initBlobNavigation();
    alert("Добро пожаловать в админ-панель!");
    initAdmin();
  }
}

// ==================== 11. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

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

// ==================== 12. ЭКСПОРТ ФУНКЦИЙ ====================

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
window.openKeywordPage = openKeywordPage;
window.addKeyword = addKeyword;        // <-- ДОБАВЛЕНО
window.editKeyword = editKeyword;      // <-- ДОБАВЛЕНО
window.deleteKeyword = deleteKeyword;  // <-- ДОБАВЛЕНО

document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, initializing admin...");
  initAdmin();
});