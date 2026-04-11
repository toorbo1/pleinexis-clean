// ========== ОТЗЫВЫ И ПОДКЛЮЧЕНИЕ ВИТРИНЫ ==========

let shopDocuments = [];
let selectedRating = 0;
let reviewPhotoFile = null;

// ========== СТРАНИЦА ОТЗЫВОВ ==========

function loadReviews() {
  const reviews = JSON.parse(localStorage.getItem('apex_reviews') || '[]');
  const container = document.getElementById('reviewsList');
  
  if (!container) return;
  
  if (reviews.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-star" style="font-size: 3rem; opacity: 0.3;"></i>
        <p>Пока нет отзывов</p>
        <p style="font-size: 0.8rem; margin-top: 8px;">Будьте первым, кто оставит отзыв!</p>
      </div>
    `;
    return;
  }
  
  // Сортировка по дате (новые сверху)
  reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  container.innerHTML = reviews.map(review => `
    <div class="review-card">
      <div class="review-header">
        <div class="review-avatar">
          ${review.author.charAt(0).toUpperCase()}
        </div>
        <div class="review-info">
          <div class="review-author">${escapeHtml(review.author)}</div>
          <div class="review-meta">
            <span class="review-stars-small">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
            <span class="review-date">${formatDate(review.date)}</span>
            ${review.verified ? '<span class="review-verified"><i class="fas fa-check-circle"></i> Проверенная покупка</span>' : ''}
          </div>
        </div>
      </div>
      <div class="review-content">${escapeHtml(review.text)}</div>
      ${review.photos && review.photos.length > 0 ? `
        <div class="review-photos">
          ${review.photos.map(photo => `
            <img src="${photo}" class="review-photo" onclick="window.open('${photo}', '_blank')">
          `).join('')}
        </div>
      ` : ''}
      <div class="review-actions">
        <button class="review-action-btn" onclick="likeReview('${review.id}')">
          <i class="far fa-heart"></i> ${review.likes || 0}
        </button>
        <button class="review-action-btn" onclick="replyToReview('${review.id}')">
          <i class="far fa-comment"></i> Ответить
        </button>
      </div>
    </div>
  `).join('');
  
  updateReviewsStats(reviews);
}

function updateReviewsStats(reviews) {
  if (reviews.length === 0) return;
  
  const total = reviews.length;
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / total;
  
  // Считаем распределение
  const distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
  reviews.forEach(r => distribution[r.rating]++);
  
  // Обновляем DOM
  const ratingLarge = document.querySelector('.reviews-rating-large');
  const totalSpan = document.querySelector('.reviews-total');
  
  if (ratingLarge) ratingLarge.textContent = avgRating.toFixed(1);
  if (totalSpan) totalSpan.textContent = `на основе ${total} ${getReviewWord(total)}`;
  
  // Обновляем прогресс-бары
  [5, 4, 3, 2, 1].forEach(rating => {
    const percent = (distribution[rating] / total) * 100;
    const bar = document.querySelector(`.rating-bar:nth-child(${6 - rating}) .bar-progress`);
    const percentSpan = document.querySelector(`.rating-bar:nth-child(${6 - rating}) span:last-child`);
    if (bar) bar.style.width = percent + '%';
    if (percentSpan) percentSpan.textContent = Math.round(percent) + '%';
  });
}

function getReviewWord(count) {
  if (count % 10 === 1 && count % 100 !== 11) return 'отзыва';
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'отзывов';
  return 'отзывов';
}

function openWriteReviewModal() {
  const modal = document.getElementById('writeReviewModal');
  if (modal) modal.classList.add('active');
  
  // Сброс формы
  selectedRating = 0;
  document.getElementById('reviewRating').value = '0';
  document.querySelectorAll('.stars-select i').forEach((star, index) => {
    star.className = 'far fa-star';
  });
  document.getElementById('reviewAuthor').value = localStorage.getItem('apex_user') || '';
  document.getElementById('reviewText').value = '';
  document.getElementById('reviewPhotoPreview').innerHTML = '';
  reviewPhotoFile = null;
  
  // Настройка звёзд
  setupStarRating();
}

function closeWriteReviewModal() {
  const modal = document.getElementById('writeReviewModal');
  if (modal) modal.classList.remove('active');
}

function setupStarRating() {
  const stars = document.querySelectorAll('.stars-select i');
  stars.forEach((star, index) => {
    star.addEventListener('click', () => {
      selectedRating = index + 1;
      document.getElementById('reviewRating').value = selectedRating;
      
      stars.forEach((s, i) => {
        if (i < selectedRating) {
          s.className = 'fas fa-star active';
        } else {
          s.className = 'far fa-star';
        }
      });
    });
    
    star.addEventListener('mouseenter', () => {
      const rating = index + 1;
      stars.forEach((s, i) => {
        if (i < rating) {
          s.className = 'fas fa-star';
        } else {
          s.className = 'far fa-star';
        }
      });
    });
  });
  
  const container = document.querySelector('.stars-select');
  if (container) {
    container.addEventListener('mouseleave', () => {
      stars.forEach((s, i) => {
        if (i < selectedRating) {
          s.className = 'fas fa-star active';
        } else {
          s.className = 'far fa-star';
        }
      });
    });
  }
}

function submitReview() {
  const rating = parseInt(document.getElementById('reviewRating').value);
  const author = document.getElementById('reviewAuthor').value.trim();
  const text = document.getElementById('reviewText').value.trim();
  
  if (rating === 0) {
    showToast('Пожалуйста, поставьте оценку', 'error');
    return;
  }
  
  if (!author) {
    showToast('Введите ваше имя', 'error');
    return;
  }
  
  if (!text || text.length < 10) {
    showToast('Отзыв должен содержать минимум 10 символов', 'error');
    return;
  }
  
  // Создаём отзыв
  const review = {
    id: Date.now().toString(),
    rating: rating,
    author: author,
    text: text,
    date: new Date().toISOString(),
    verified: Math.random() > 0.5, // Для демо
    likes: 0,
    photos: []
  };
  
  // Добавляем фото если есть
  if (reviewPhotoFile) {
    const reader = new FileReader();
    reader.onload = function(e) {
      review.photos = [e.target.result];
      saveReview(review);
    };
    reader.readAsDataURL(reviewPhotoFile);
  } else {
    saveReview(review);
  }
}

function saveReview(review) {
  const reviews = JSON.parse(localStorage.getItem('apex_reviews') || '[]');
  reviews.push(review);
  localStorage.setItem('apex_reviews', JSON.stringify(reviews));
  
  closeWriteReviewModal();
  loadReviews();
  showToast('Спасибо за отзыв!', 'success');
}

function likeReview(reviewId) {
  const reviews = JSON.parse(localStorage.getItem('apex_reviews') || '[]');
  const review = reviews.find(r => r.id === reviewId);
  if (review) {
    review.likes = (review.likes || 0) + 1;
    localStorage.setItem('apex_reviews', JSON.stringify(reviews));
    loadReviews();
  }
}

function replyToReview(reviewId) {
  showToast('Функция ответа на отзывы скоро появится', 'info');
}

// ========== ПОДКЛЮЧЕНИЕ ВИТРИНЫ ==========

function initShopConnectPage() {
  const user = localStorage.getItem('apex_user') || 'Гость';
  document.getElementById('shopName').value = `Магазин ${user}`;
  
  // Проверяем статус заявки
  const application = JSON.parse(localStorage.getItem(`shop_application_${user}`) || 'null');
  if (application) {
    showApplicationStatus(application);
  }
  
  // Настройка загрузки документов
  setupDocumentsUpload();
  
  // Счётчик символов
  const textarea = document.getElementById('shopDescription');
  if (textarea) {
    textarea.addEventListener('input', function() {
      // Лимит не нужен, но можно добавить
    });
  }
}

function setupDocumentsUpload() {
  const uploadArea = document.getElementById('documentsUploadArea');
  const fileInput = document.getElementById('documentsInput');
  
  if (!uploadArea || !fileInput) return;
  
  uploadArea.addEventListener('click', () => fileInput.click());
  
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#3b82f6';
  });
  
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#2a2a2a';
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#2a2a2a';
    const files = Array.from(e.dataTransfer.files);
    addDocuments(files);
  });
  
  fileInput.addEventListener('change', (e) => {
    addDocuments(Array.from(e.target.files));
    fileInput.value = '';
  });
}

function addDocuments(files) {
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) {
      showToast(`Файл "${file.name}" превышает 10 МБ`, 'error');
      continue;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      shopDocuments.push({
        name: file.name,
        type: file.type,
        data: e.target.result,
        size: file.size
      });
      renderDocumentsPreview();
    };
    reader.readAsDataURL(file);
  }
}

function renderDocumentsPreview() {
  const container = document.getElementById('documentsPreview');
  if (!container) return;
  
  container.innerHTML = shopDocuments.map((doc, index) => `
    <div class="document-preview-item">
      ${doc.type.startsWith('image/') ? 
        `<img src="${doc.data}" alt="${doc.name}">` : 
        `<div class="file-icon">
          <i class="fas fa-file-pdf"></i>
          <span>${doc.name.substring(0, 15)}</span>
        </div>`
      }
      <div class="remove-document" onclick="removeDocument(${index})">
        <i class="fas fa-times"></i>
      </div>
    </div>
  `).join('');
}

function removeDocument(index) {
  shopDocuments.splice(index, 1);
  renderDocumentsPreview();
}

function submitShopApplication() {
  const shopName = document.getElementById('shopName').value.trim();
  const shopType = document.getElementById('shopType').value;
  const shopPhone = document.getElementById('shopPhone').value.trim();
  const shopEmail = document.getElementById('shopEmail').value.trim();
  const shopDescription = document.getElementById('shopDescription').value.trim();
  const agreement = document.getElementById('shopAgreement').checked;
  
  if (!shopName) {
    showToast('Введите название магазина', 'error');
    return;
  }
  
  if (!shopType) {
    showToast('Выберите тип бизнеса', 'error');
    return;
  }
  
  if (!shopPhone) {
    showToast('Введите контактный телефон', 'error');
    return;
  }
  
  if (shopDocuments.length === 0 && shopType !== 'private') {
    showToast('Загрузите хотя бы один документ', 'error');
    return;
  }
  
  if (!agreement) {
    showToast('Необходимо подтвердить подлинность данных', 'error');
    return;
  }
  
  const user = localStorage.getItem('apex_user') || 'Гость';
  
  const application = {
    id: Date.now().toString(),
    userId: user,
    shopName: shopName,
    shopType: shopType,
    phone: shopPhone,
    email: shopEmail,
    description: shopDescription,
    documents: shopDocuments,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Сохраняем заявку пользователя
  localStorage.setItem(`shop_application_${user}`, JSON.stringify(application));
  
  // Добавляем в общий список заявок для админа
  const applications = JSON.parse(localStorage.getItem('apex_shop_applications') || '[]');
  applications.push(application);
  localStorage.setItem('apex_shop_applications', JSON.stringify(applications));
  
  // Показываем статус
  showApplicationStatus(application);
  
  showToast('Заявка отправлена на проверку!', 'success');
}

function showApplicationStatus(application) {
  const formCard = document.querySelector('.shop-form-card');
  const infoCard = document.querySelector('.shop-info-card');
  const statusCard = document.getElementById('shopStatusCard');
  
  if (formCard) formCard.style.display = 'none';
  if (infoCard) infoCard.style.display = 'none';
  if (statusCard) {
    statusCard.style.display = 'block';
    
    // Обновляем статус
    const statusIcon = statusCard.querySelector('.status-icon');
    const statusTitle = statusCard.querySelector('h3');
    const statusText = statusCard.querySelector('p');
    
    statusIcon.className = 'status-icon ' + application.status;
    
    if (application.status === 'pending') {
      statusIcon.innerHTML = '<i class="fas fa-clock"></i>';
      statusTitle.textContent = 'Заявка на рассмотрении';
      statusText.textContent = 'Ваша заявка отправлена и ожидает проверки администратором.';
    } else if (application.status === 'approved') {
      statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
      statusTitle.textContent = 'Витрина подключена!';
      statusText.textContent = 'Поздравляем! Ваша витрина одобрена. Теперь вы можете добавлять товары и посты.';
    } else if (application.status === 'rejected') {
      statusIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
      statusTitle.textContent = 'Заявка отклонена';
      statusText.textContent = application.rejectReason || 'К сожалению, ваша заявка была отклонена.';
    }
  }
}

// ========== АДМИНКА: ЗАЯВКИ НА ВИТРИНУ ==========

function loadShopApplications() {
  const applications = JSON.parse(localStorage.getItem('apex_shop_applications') || '[]');
  return applications;
}

function renderShopApplicationsInAdmin() {
  const container = document.getElementById('shopApplicationsList');
  if (!container) return;
  
  const applications = loadShopApplications();
  
  if (applications.length === 0) {
    container.innerHTML = '<div class="empty-state">Нет заявок на подключение витрины</div>';
    return;
  }
  
  container.innerHTML = applications.map(app => `
    <div class="shop-application-item">
      <div class="app-header">
        <span class="app-user">${escapeHtml(app.userId)}</span>
        <span class="app-status ${app.status}">${getStatusText(app.status)}</span>
      </div>
      <div class="app-info">
        <div><strong>Магазин:</strong> ${escapeHtml(app.shopName)}</div>
        <div><strong>Тип:</strong> ${getShopTypeText(app.shopType)}</div>
        <div><strong>Телефон:</strong> ${escapeHtml(app.phone)}</div>
        <div><strong>Email:</strong> ${escapeHtml(app.email || '—')}</div>
        <div><strong>Описание:</strong> ${escapeHtml(app.description || '—')}</div>
        <div><strong>Дата:</strong> ${new Date(app.createdAt).toLocaleString()}</div>
      </div>
      ${app.documents && app.documents.length > 0 ? `
        <div class="app-documents">
          <strong>Документы (${app.documents.length}):</strong>
          <div class="documents-grid">
            ${app.documents.map((doc, i) => `
              <div class="doc-item" onclick="window.open('${doc.data}', '_blank')">
                ${doc.type.startsWith('image/') ? 
                  `<img src="${doc.data}" alt="${doc.name}">` : 
                  `<div class="file-icon"><i class="fas fa-file-pdf"></i><span>PDF</span></div>`
                }
                <span>${doc.name.substring(0, 20)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      ${app.status === 'pending' ? `
        <div class="app-actions">
          <button class="approve-btn" onclick="approveShopApplication('${app.id}')">
            <i class="fas fa-check"></i> Одобрить
          </button>
          <button class="reject-btn" onclick="rejectShopApplication('${app.id}')">
            <i class="fas fa-times"></i> Отклонить
          </button>
        </div>
      ` : ''}
      ${app.status === 'rejected' && app.rejectReason ? `
        <div class="reject-reason">
          <strong>Причина отказа:</strong> ${escapeHtml(app.rejectReason)}
        </div>
      ` : ''}
    </div>
  `).join('');
}

function getStatusText(status) {
  const texts = {
    'pending': '⏳ На проверке',
    'approved': '✅ Одобрено',
    'rejected': '❌ Отклонено'
  };
  return texts[status] || status;
}

function getShopTypeText(type) {
  const texts = {
    'individual': 'Самозанятый / ИП',
    'company': 'Юридическое лицо',
    'private': 'Частное лицо'
  };
  return texts[type] || type;
}

function approveShopApplication(appId) {
  const applications = JSON.parse(localStorage.getItem('apex_shop_applications') || '[]');
  const appIndex = applications.findIndex(a => a.id === appId);
  
  if (appIndex === -1) return;
  
  applications[appIndex].status = 'approved';
  applications[appIndex].updatedAt = new Date().toISOString();
  localStorage.setItem('apex_shop_applications', JSON.stringify(applications));
  
  // Обновляем заявку пользователя
  const userApp = applications[appIndex];
  localStorage.setItem(`shop_application_${userApp.userId}`, JSON.stringify(userApp));
  
  // Добавляем пользователя в список продавцов
  const sellers = JSON.parse(localStorage.getItem('apex_verified_sellers') || '[]');
  if (!sellers.includes(userApp.userId)) {
    sellers.push(userApp.userId);
    localStorage.setItem('apex_verified_sellers', JSON.stringify(sellers));
  }
  
  // Отправляем уведомление
  sendShopNotification(userApp.userId, 'approved', 'Ваша заявка на подключение витрины одобрена!');
  
  renderShopApplicationsInAdmin();
  showToast('Заявка одобрена!', 'success');
}

function rejectShopApplication(appId) {
  const reason = prompt('Укажите причину отказа:');
  if (!reason) return;
  
  const applications = JSON.parse(localStorage.getItem('apex_shop_applications') || '[]');
  const appIndex = applications.findIndex(a => a.id === appId);
  
  if (appIndex === -1) return;
  
  applications[appIndex].status = 'rejected';
  applications[appIndex].rejectReason = reason;
  applications[appIndex].updatedAt = new Date().toISOString();
  localStorage.setItem('apex_shop_applications', JSON.stringify(applications));
  
  // Обновляем заявку пользователя
  const userApp = applications[appIndex];
  localStorage.setItem(`shop_application_${userApp.userId}`, JSON.stringify(userApp));
  
  // Отправляем уведомление
  sendShopNotification(userApp.userId, 'rejected', `Ваша заявка отклонена. Причина: ${reason}`);
  
  renderShopApplicationsInAdmin();
  showToast('Заявка отклонена', 'success');
}

function sendShopNotification(userId, status, message) {
  let dialogs = JSON.parse(localStorage.getItem('apex_dialogs') || '[]');
  let userDialog = dialogs.find(d => d.name === userId);
  
  if (!userDialog) {
    userDialog = {
      id: 'support',
      name: 'Поддержка',
      avatar: '🎧',
      messages: []
    };
    dialogs.push(userDialog);
  }
  
  userDialog.messages.push({
    user: 'Поддержка',
    text: message,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: new Date().toISOString()
  });
  
  localStorage.setItem('apex_dialogs', JSON.stringify(dialogs));
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Сегодня';
  if (days === 1) return 'Вчера';
  if (days < 7) return `${days} ${getDayWord(days)} назад`;
  return date.toLocaleDateString('ru-RU');
}

function getDayWord(days) {
  if (days === 1) return 'день';
  if (days >= 2 && days <= 4) return 'дня';
  return 'дней';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function showToast(message, type = 'success') {
  let toast = document.querySelector('.toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }
  
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i><span>${message}</span>`;
  toast.classList.add('show', type);
  
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', function() {
  // Загрузка отзывов при открытии страницы
  const reviewsPage = document.getElementById('reviewsPage');
  if (reviewsPage) {
    loadReviews();
  }
  
  // Настройка модалки отзыва
  const reviewText = document.getElementById('reviewText');
  if (reviewText) {
    reviewText.addEventListener('input', function() {
      const len = this.value.length;
      document.getElementById('reviewCharCounter').textContent = `${len}/500`;
      if (len > 500) this.value = this.value.slice(0, 500);
    });
  }
  
  // Загрузка фото для отзыва
  const photoUpload = document.getElementById('reviewPhotoUpload');
  const photoInput = document.getElementById('reviewPhotoInput');
  if (photoUpload && photoInput) {
    photoUpload.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', (e) => {
      if (e.target.files[0]) {
        reviewPhotoFile = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function(ev) {
          document.getElementById('reviewPhotoPreview').innerHTML = `
            <img src="${ev.target.result}" alt="preview">
          `;
        };
        reader.readAsDataURL(reviewPhotoFile);
      }
    });
  }
  
  // Кнопка витрины в профиле
  const shopBtn = document.querySelector('.shop-window-btn');
  if (shopBtn) {
    shopBtn.addEventListener('click', function() {
      const user = localStorage.getItem('apex_user') || 'Гость';
      const sellers = JSON.parse(localStorage.getItem('apex_verified_sellers') || '[]');
      
      if (sellers.includes(user)) {
        // Уже продавец - открываем управление товарами
        if (typeof showPage === 'function') {
          showPage('products-manage');
        }
      } else {
        // Не продавец - открываем страницу подключения
        if (typeof showPage === 'function') {
          showPage('shopConnectPage');
          initShopConnectPage();
        }
      }
    });
  }
  
  // Закрытие модалок по клику на фон
  document.querySelectorAll('.modal-glass').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('active');
      }
    });
  });
});

// Экспорт функций
window.loadReviews = loadReviews;
window.openWriteReviewModal = openWriteReviewModal;
window.closeWriteReviewModal = closeWriteReviewModal;
window.submitReview = submitReview;
window.likeReview = likeReview;
window.replyToReview = replyToReview;
window.removeDocument = removeDocument;
window.submitShopApplication = submitShopApplication;
window.initShopConnectPage = initShopConnectPage;
window.renderShopApplicationsInAdmin = renderShopApplicationsInAdmin;
window.approveShopApplication = approveShopApplication;
window.rejectShopApplication = rejectShopApplication;