// chats.js - ПОЛНАЯ РАБОЧАЯ ВЕРСИЯ С ФИКСАМИ ДИАЛОГОВ

let dialogs = [];
let currentUser = null;
let currentDialogId = null;

function initChats() {
    console.log('initChats START');
    currentUser = localStorage.getItem("apex_user") || "Гость";
    
    const savedDialogs = localStorage.getItem("apex_dialogs");
    if (savedDialogs) {
        dialogs = JSON.parse(savedDialogs);
    } else {
        dialogs = [{
            id: "support",
            name: "Поддержка",
            avatar: "🎧",
            messages: [{
                user: "Support",
                text: "✨ Добро пожаловать в службу поддержки!\n\nНапишите ваш вопрос, и я отвечу! 💬",
                time: getCurrentTime(),
                timestamp: new Date().toISOString()
            }]
        }];
        saveDialogs();
    }
    
    showChatList();
    renderDialogsList();
    
    // Настраиваем кнопку "Назад"
    const backBtn = document.getElementById("backToChatListBtn");
    if (backBtn) {
        const newBtn = backBtn.cloneNode(true);
        backBtn.parentNode.replaceChild(newBtn, backBtn);
        newBtn.addEventListener("click", function(e) {
            e.preventDefault();
            closeChatWindow();
        });
    }
    
    console.log('initChats END');
}

function getCurrentTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function saveDialogs() {
    localStorage.setItem("apex_dialogs", JSON.stringify(dialogs));
}

function refreshDialogs() {
    const saved = localStorage.getItem("apex_dialogs");
    if (saved) {
        dialogs = JSON.parse(saved);
        renderDialogsList();
    }
}

function showChatList() {
    const sidebar = document.getElementById("chatsSidebar");
    const chatWindow = document.getElementById("chatWindow");
    
    if (sidebar) {
        sidebar.style.display = "flex";
        sidebar.classList.remove("hide");
    }
    if (chatWindow) {
        chatWindow.style.display = "none";
        chatWindow.classList.remove("active");
    }
    currentDialogId = null;
}

function closeChatWindow() {
    const sidebar = document.getElementById("chatsSidebar");
    const chatWindow = document.getElementById("chatWindow");
    
    if (sidebar) {
        sidebar.classList.remove('hide');
    }
    if (chatWindow) {
        chatWindow.style.display = "none";
        chatWindow.classList.remove("active");
    }
    currentDialogId = null;
}

async function openChatWithDialog(dialogId) {
    // Обновляем диалоги из localStorage перед открытием
    refreshDialogs();
    
    const dialog = dialogs.find(d => d.id === dialogId);
    if (!dialog) {
        console.warn(`Диалог ${dialogId} не найден`);
        return;
    }
    
    // Обновляем хедер чата
    const avatarEl = document.getElementById("chatPartnerAvatar");
    const nameEl = document.getElementById("chatPartnerName");
    const statusEl = document.getElementById("chatPartnerStatus");
    
    if (avatarEl) avatarEl.innerHTML = dialog.avatar || "💬";
    if (nameEl) nameEl.textContent = dialog.name;
    if (statusEl) {
        statusEl.innerHTML = dialog.id === "support" 
            ? '<span class="status-online"></span> онлайн 24/7'
            : '<span class="status-online"></span> в сети';
    }
    
    // Показываем окно чата, скрываем список
    const sidebar = document.getElementById("chatsSidebar");
    const chatWindow = document.getElementById("chatWindow");
    
    if (sidebar) {
        sidebar.classList.add('hide');
    }
    if (chatWindow) {
        chatWindow.style.display = "flex";
        chatWindow.classList.add("active");
    }
    
    currentDialogId = dialogId;
    renderMessages(dialogId);
    
    // Если есть привязка к сделке – показываем кнопки
    if (dialog.dealId) {
        const deal = await loadDealInfo(dialog.dealId);
        renderDealActions(dialogId, deal);
    }
}

function renderDialogsList(searchTerm = '') {
    const container = document.getElementById("dialogsList");
    if (!container) return;
    
    if (!dialogs || dialogs.length === 0) {
        container.innerHTML = '<div class="empty-dialogs"><i class="fas fa-comments"></i><p>Нет диалогов</p></div>';
        return;
    }
    
    let filtered = dialogs;
    if (searchTerm) {
        filtered = dialogs.filter(d => d.name && d.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-dialogs"><i class="fas fa-search"></i><p>Ничего не найдено</p></div>';
        return;
    }
    
    container.innerHTML = filtered.map(dialog => {
        const lastMsg = dialog.messages && dialog.messages[dialog.messages.length - 1];
        let preview = '';
        let time = '';
        
        if (lastMsg) {
            preview = lastMsg.user === currentUser ? "Вы: " + lastMsg.text : lastMsg.text;
            time = lastMsg.time || '';
        } else {
            preview = 'Нет сообщений';
        }
        
        const shortPreview = preview.length > 45 ? preview.substring(0, 45) + '...' : preview;
        
        return `
            <div class="dialog-item" onclick="openChatWithDialog('${dialog.id}')">
                <div class="dialog-avatar">
                    ${dialog.avatar || '💬'}
                    ${dialog.id === "support" ? '<span class="online-indicator"></span>' : ''}
                </div>
                <div class="dialog-info">
                    <div class="dialog-name">
                        <span>${escapeHtml(dialog.name || 'Unknown')}</span>
                        <span class="dialog-date">${time}</span>
                    </div>
                    <div class="dialog-preview">${escapeHtml(shortPreview)}</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderMessages(dialogId) {
    const dialog = dialogs.find(d => d.id === dialogId);
    const area = document.getElementById("chatMessagesArea");
    if (!area || !dialog) return;
    
    if (dialog.messages.length === 0) {
        area.innerHTML = '<div class="empty-messages"><i class="fas fa-comment-dots"></i><p>Нет сообщений</p></div>';
        return;
    }
    
    let html = '';
    let lastDate = null;
    
    dialog.messages.forEach((msg) => {
        const isOut = msg.user === currentUser;
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

function sendChatMessage() {
    const input = document.getElementById("chatMessageInput");
    const text = input.value.trim();
    if (!text) return;
    
    if (!currentDialogId) {
        openChatWithDialog("support");
        setTimeout(() => sendChatMessage(), 100);
        return;
    }
    
    const dialogIndex = dialogs.findIndex(d => d.id === currentDialogId);
    if (dialogIndex === -1) return;
    
    const now = new Date();
    const newMsg = {
        user: currentUser,
        text: text,
        time: getCurrentTime(),
        timestamp: now.toISOString()
    };
    
    dialogs[dialogIndex].messages.push(newMsg);
    saveDialogs();
    
    renderMessages(currentDialogId);
    renderDialogsList();
    input.value = "";
    
    if (currentDialogId === "support") {
        setTimeout(() => autoReply(text), 1500);
    }
}

function autoReply(userMessage) {
    const dialogIndex = dialogs.findIndex(d => d.id === "support");
    if (dialogIndex === -1) return;
    
    let replyText = "Спасибо за обращение! 🙏 Наш специалист скоро свяжется с вами.";
    const lower = userMessage.toLowerCase();
    
    if (lower.includes("привет")) {
        replyText = "Здравствуйте! 👋 Чем могу помочь?";
    } else if (lower.includes("цена") || lower.includes("сколько")) {
        replyText = "💰 Все цены указаны на карточках товаров.";
    } else if (lower.includes("спасибо")) {
        replyText = "Пожалуйста! 😊 Обращайтесь ещё!";
    } else if (lower.includes("помощь")) {
        replyText = "Конечно помогу! 🔧 Опишите подробнее вашу проблему.";
    } else if (lower.includes("заказ")) {
        replyText = "📦 Проверяю ваш заказ... Обычно товар приходит мгновенно.";
    }
    
    dialogs[dialogIndex].messages.push({
        user: "Support",
        text: replyText,
        time: getCurrentTime(),
        timestamp: new Date().toISOString()
    });
    
    saveDialogs();
    
    if (currentDialogId === "support") {
        renderMessages("support");
    }
    renderDialogsList();
}

async function loadDealInfo(dealId) {
    try {
        const res = await fetch(`/api/deals/${dealId}`);
        return await res.json();
    } catch (e) {
        return null;
    }
}

function renderDealActions(dialogId, deal) {
    const currentUser = localStorage.getItem('apex_user');
    const actionsContainer = document.getElementById('chatDealActions');
    if (!actionsContainer) return;
    
    let html = '';
    if (deal.status === 'pending') {
        if (deal.seller_username === currentUser) {
            html = `
                <button class="deal-btn complete" onclick="sellerCompleteDeal('${deal.id}')">
                    ✅ Я выполнил работу
                </button>
                <button class="deal-btn cancel" onclick="cancelDeal('${deal.id}')">
                    ❌ Отменить заказ
                </button>
            `;
        } else if (deal.buyer_username === currentUser) {
            html = `<div class="deal-info">Ожидание выполнения продавцом...</div>`;
        }
    } else if (deal.status === 'seller_completed') {
        if (deal.buyer_username === currentUser) {
            html = `
                <button class="deal-btn confirm" onclick="buyerConfirmDeal('${deal.id}')">
                    ✅ Подтвердить получение
                </button>
            `;
        } else {
            html = `<div class="deal-info">Ожидание подтверждения покупателем</div>`;
        }
    } else if (deal.status === 'completed') {
        html = `<div class="deal-info completed">✅ Сделка завершена</div>`;
    } else if (deal.status === 'cancelled') {
        html = `<div class="deal-info cancelled">❌ Сделка отменена</div>`;
    }
    
    actionsContainer.innerHTML = html;
}

// Функции для кнопок сделок
window.sellerCompleteDeal = async (dealId) => {
    try {
        const res = await fetch(`/api/deals/${dealId}/seller-complete`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (!res.ok) throw new Error('Ошибка');
        showToast('Статус обновлён', 'success');
        refreshDialogs();
    } catch (e) {
        showToast(e.message, 'error');
    }
};

window.buyerConfirmDeal = async (dealId) => {
    try {
        const res = await fetch(`/api/deals/${dealId}/buyer-confirm`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (!res.ok) throw new Error('Ошибка');
        showToast('Сделка завершена!', 'success');
        refreshDialogs();
    } catch (e) {
        showToast(e.message, 'error');
    }
};

window.cancelDeal = async (dealId) => {
    if (!confirm('Отменить заказ? Деньги вернутся покупателю.')) return;
    try {
        const res = await fetch(`/api/deals/${dealId}/cancel`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (!res.ok) throw new Error('Ошибка');
        showToast('Сделка отменена', 'success');
        refreshDialogs();
    } catch (e) {
        showToast(e.message, 'error');
    }
};

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
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    toast.classList.add('show', type);
    setTimeout(() => toast.classList.remove('show'), 3000);
}

document.addEventListener('DOMContentLoaded', function() {
    initChats();
    
    const sendBtn = document.getElementById("sendChatMsgBtn");
    if (sendBtn) {
        sendBtn.onclick = sendChatMessage;
    }
    
    const msgInput = document.getElementById("chatMessageInput");
    if (msgInput) {
        msgInput.onkeypress = function(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                sendChatMessage();
            }
        };
    }
    
    const searchInput = document.getElementById("chatSearchInput");
    if (searchInput) {
        searchInput.oninput = function(e) {
            renderDialogsList(e.target.value);
        };
    }
});

window.initChats = initChats;
window.openChatWithDialog = openChatWithDialog;
window.closeChatWindow = closeChatWindow;
window.sendChatMessage = sendChatMessage;
window.refreshDialogs = refreshDialogs;