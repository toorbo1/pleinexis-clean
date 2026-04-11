// ========== СТРАНИЦА ОТЗЫВОВ ==========

let reviews = [];
let filteredReviews = [];
let currentFilter = 'all';
let currentSort = 'newest';
let selectedRating = 0;
let reviewPhotos = [];
let currentPage = 1;
const REVIEWS_PER_PAGE = 10;

// Данные для просмотра фото
let currentPhotoViewer = {
  photos: [],
  currentIndex: 0
};

// ========== ИНИЦИАЛИЗАЦИЯ ==========

function initReviewsPage() {
  loadReviewsFromStorage();
  setupEventListeners();
  loadProductsForSelect();
}

function loadReviewsFromStorage() {
  const stored = localStorage.getItem('apex_reviews');
  if (stored) {
    reviews = JSON.parse(stored);
  } else {
    // Демо-отзывы
    reviews = generateDemoReviews();
    localStorage.setItem('apex_reviews', JSON.stringify(reviews));
  }
  
  applyFiltersAndSort();
}

function generateDemoReviews() {
  const demoNames = ['Александр', 'Мария', 'Дмитрий', 'Елена', 'Игорь', 'Анна', 'Сергей', 'Ольга', 'Максим', 'Татьяна'];
  const demoTemplates = [
    'Отличный сервис! Всё работает быстро, поддержка отвечает моментально.',
    'Покупал подписку Discord Nitro. Активировалась сразу, без проблем.',
    'Лучший маркетплейс цифровых товаров. Цены приятные, выбор большой.',
    'Продавец вежливый, товар соответствует описанию. Рекомендую!',
    'Пользуюсь уже несколько месяцев. Всё устраивает, удобный интерфейс.',
    'Быстрая доставка, приятные цены. Буду заказывать ещё!',
    'Сначала были сомнения, но всё прошло гладко. Спасибо!',
    'Отличная площадка для покупки игр и подписок. 5 звёзд!'
  ];
  
  const reviews = [];
  
  for (let i = 0; i < 15; i++) {
    const rating = Math.floor(Math.random() * 3) + 3; // 3-5 звёзд
    const daysAgo = Math.floor(Math.random() * 60);
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    
    reviews.push({
      id: 'demo_' + i + '_' + Date.now(),
      rating: rating,
      author: demoNames[Math.floor(Math.random() * demoNames.length)],
      text: demoTemplates[Math.floor(Math.random() * demoTemplates.length)],
      pros: 'Быстро, удобно, надёжно',
      cons: Math.random() > 0.7 ? 'Хотелось бы больше способов оплаты' : '',
      date: date.toISOString(),
      verified: Math.random() > 0.3,
      productName: Math.random() > 0.5 ? 'Discord Nitro' : '',
      likes: Math.floor(Math.random() * 20),
      liked: false,
      photos: [],
      reply: Math.random() > 0.6 ? {
        text: 'Спасибо за отзыв! Будем рады видеть вас снова!',
        date: new Date(date.getTime() + 86400000).toISOString()
      } : null
    });
  }
  
  return reviews;
}

function setupEventListeners() {
  // Фильтры
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      currentPage = 1;
      applyFiltersAndSort();
    });
  });
  
  // Сортировка
  const sortSelect = document.getElementById('reviewsSortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      currentPage = 1;
      applyFiltersAndSort();
    });
  }
  
  // Звёзды в модалке
  setupStarRating();
  
  // Загрузка фото
  setupPhotoUpload();
  
  // Счётчик символов
  const reviewText = document.getElementById('reviewText');
  if (reviewText) {
    reviewText.addEventListener('input', function() {
      const len = this.value.length;
      document.getElementById('reviewCharCounter').textContent = `${len}/500`;
    });
  }
  
  // Кнопка "Показать ещё"
  const loadMoreBtn = document.getElementById('loadMoreReviewsBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      currentPage++;
      renderReviews(true);
    });
  }
}

// ========== ФИЛЬТРАЦИЯ И СОРТИРОВКА ==========

function applyFiltersAndSort() {
  // Фильтрация
  filteredReviews = [...reviews];
  
  if (currentFilter === 'with-photo') {
    filteredReviews = filteredReviews.filter(r => r.photos && r.photos.length > 0);
  } else if (currentFilter !== 'all') {
    const rating = parseInt(currentFilter);
    filteredReviews = filteredReviews.filter(r => r.rating === rating);
  }
  
  // Сортировка
  switch (currentSort) {
    case 'newest':
      filteredReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
      break;
    case 'oldest':
      filteredReviews.sort((a, b) => new Date(a.date) - new Date(b.date));
      break;
    case 'highest':
      filteredReviews.sort((a, b) => b.rating - a.rating);
      break;
    case 'lowest':
      filteredReviews.sort((a, b) => a.rating - b.rating);
      break;
    case 'popular':
      filteredReviews.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      break;
  }
  
  currentPage = 1;
  updateStats();
  renderReviews();
}

function updateStats() {
  if (reviews.length === 0) return;
  
  const total = reviews.length;
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / total;
  
  // Обновляем средний рейтинг
  document.getElementById('avgRatingDisplay').textContent = avgRating.toFixed(1);
  
  // Обновляем звёзды
  const fullStars = Math.floor(avgRating);
  const hasHalfStar = avgRating - fullStars >= 0.5;
  let starsHtml = '★'.repeat(fullStars) + (hasHalfStar ? '½' : '') + '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0));
  document.getElementById('avgStarsDisplay').innerHTML = starsHtml;
  
  // Обновляем количество
  const totalSpan = document.getElementById('totalReviewsDisplay');
  totalSpan.textContent = `на основе ${total} ${getReviewWord(total)}`;
  
  // Обновляем бары
  const distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
  reviews.forEach(r => distribution[r.rating]++);
  
  const barsContainer = document.getElementById('ratingBarsContainer');
  barsContainer.innerHTML = [5, 4, 3, 2, 1].map(rating => {
    const count = distribution[rating];
    const percent = total > 0 ? (count / total) * 100 : 0;
    return `
      <div class="rating-bar" data-rating="${rating}" style="cursor: pointer;" onclick="filterByRating(${rating})">
        <span>${rating} ★</span>
        <div class="bar-fill"><div class="bar-progress" style="width: ${percent}%"></div></div>
        <span>${count}</span>
      </div>
    `;
  }).join('');
}

function filterByRating(rating) {
  currentFilter = rating.toString();
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.filter === rating.toString()) {
      btn.classList.add('active');
    }
  });
  currentPage = 1;
  applyFiltersAndSort();
}

function getReviewWord(count) {
  if (count % 10 === 1 && count % 100 !== 11) return 'отзыв';
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'отзыва';
  return 'отзывов';
}

// ========== РЕНДЕРИНГ ОТЗЫВОВ ==========

function renderReviews(append = false) {
  const container = document.getElementById('reviewsList');
  const loadMoreBtn = document.getElementById('loadMoreReviewsBtn');
  
  const startIndex = append ? (currentPage - 1) * REVIEWS_PER_PAGE : 0;
  const endIndex = startIndex + REVIEWS_PER_PAGE;
  const pageReviews = filteredReviews.slice(startIndex, endIndex);
  
  if (!append) {
    if (filteredReviews.length === 0) {
      container.innerHTML = `
        <div class="empty-reviews">
          <i class="fas fa-star"></i>
          <p>Нет отзывов по выбранному фильтру</p>
          <button class="write-review-btn" style="max-width: 250px; margin: 0 auto;" onclick="openWriteReviewModal()">
            <i class="fas fa-pen"></i> Написать первый отзыв
          </button>
        </div>
      `;
      loadMoreBtn.style.display = 'none';
      return;
    }
    
    container.innerHTML = '';
  }
  
  pageReviews.forEach(review => {
    const reviewCard = createReviewCard(review);
    container.appendChild(reviewCard);
  });
  
  // Показываем/скрываем кнопку "Показать ещё"
  if (filteredReviews.length > endIndex) {
    loadMoreBtn.style.display = 'flex';
  } else {
    loadMoreBtn.style.display = 'none';
  }
}

function createReviewCard(review) {
  const card = document.createElement('div');
  card.className = 'review-card';
  card.dataset.id = review.id;
  
  const date = new Date(review.date);
  const formattedDate = formatDate(date);
  
  card.innerHTML = `
    <div class="review-header">
      <div class="review-avatar">${review.author.charAt(0).toUpperCase()}</div>
      <div class="review-info">
        <div class="review-author-row">
          <span class="review-author">${escapeHtml(review.author)}</span>
          <div class="review-badges">
            ${review.verified ? '<span class="review-verified"><i class="fas fa-check-circle"></i> Проверенная покупка</span>' : ''}
            ${review.productName ? `<span class="review-product-badge"><i class="fas fa-box"></i> ${escapeHtml(review.productName)}</span>` : ''}
          </div>
        </div>
        <div class="review-meta">
          <span class="review-stars-small">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
          <span class="review-date">${formattedDate}</span>
        </div>
      </div>
    </div>
    
    ${(review.pros || review.cons) ? `
      <div class="review-pros-cons">
        ${review.pros ? `
          <div class="review-pros">
            <strong><i class="fas fa-plus-circle"></i> Достоинства</strong>
            <p>${escapeHtml(review.pros)}</p>
          </div>
        ` : ''}
        ${review.cons ? `
          <div class="review-cons">
            <strong><i class="fas fa-minus-circle"></i> Недостатки</strong>
            <p>${escapeHtml(review.cons)}</p>
          </div>
        ` : ''}
      </div>
    ` : ''}
    
    <div class="review-content">${escapeHtml(review.text).replace(/\n/g, '<br>')}</div>
    
    ${review.photos && review.photos.length > 0 ? `
      <div class="review-photos">
        ${review.photos.map((photo, index) => `
          <img src="${photo}" class="review-photo" onclick="openPhotoViewer('${review.id}', ${index})">
        `).join('')}
      </div>
    ` : ''}
    
    <div class="review-actions">
      <button class="review-action-btn ${review.liked ? 'liked' : ''}" onclick="likeReview('${review.id}')">
        <i class="${review.liked ? 'fas' : 'far'} fa-heart"></i> ${review.likes || 0}
      </button>
      <button class="review-action-btn" onclick="shareReview('${review.id}')">
        <i class="far fa-share-square"></i> Поделиться
      </button>
      <button class="review-action-btn" onclick="reportReview('${review.id}')">
        <i class="far fa-flag"></i> Пожаловаться
      </button>
    </div>
    
    ${review.reply ? `
      <div class="review-reply">
        <div class="reply-header">
          <i class="fas fa-reply"></i>
          <span>Ответ администрации</span>
        </div>
        <div class="reply-text">${escapeHtml(review.reply.text)}</div>
      </div>
    ` : ''}
  `;
  
  return card;
}

// ========== МОДАЛКА НАПИСАНИЯ ОТЗЫВА ==========

function openWriteReviewModal() {
  const modal = document.getElementById('writeReviewModal');
  if (modal) modal.classList.add('active');
  
  // Сброс формы
  selectedRating = 0;
  reviewPhotos = [];
  document.getElementById('reviewRating').value = '0';
  document.querySelectorAll('.stars-select i').forEach(star => {
    star.className = 'far fa-star';
  });
  
  const user = localStorage.getItem('apex_user') || '';
  document.getElementById('reviewAuthor').value = user;
  document.getElementById('reviewText').value = '';
  document.getElementById('reviewPros').value = '';
  document.getElementById('reviewCons').value = '';
  document.getElementById('reviewPhotoPreview').innerHTML = '';
  document.getElementById('reviewCharCounter').textContent = '0/500';
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
        s.className = i < selectedRating ? 'fas fa-star active' : 'far fa-star';
      });
    });
    
    star.addEventListener('mouseenter', () => {
      const rating = index + 1;
      stars.forEach((s, i) => {
        s.className = i < rating ? 'fas fa-star' : 'far fa-star';
      });
    });
  });
  
  const container = document.querySelector('.stars-select');
  if (container) {
    container.addEventListener('mouseleave', () => {
      stars.forEach((s, i) => {
        s.className = i < selectedRating ? 'fas fa-star active' : 'far fa-star';
      });
    });
  }
}

function setupPhotoUpload() {
  const uploadArea = document.getElementById('reviewPhotoUpload');
  const fileInput = document.getElementById('reviewPhotoInput');
  
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
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    addReviewPhotos(files);
  });
  
  fileInput.addEventListener('change', (e) => {
    addReviewPhotos(Array.from(e.target.files));
    fileInput.value = '';
  });
}

function addReviewPhotos(files) {
  if (reviewPhotos.length >= 5) {
    showToast('Можно загрузить не более 5 фото', 'error');
    return;
  }
  
  const remaining = 5 - reviewPhotos.length;
  const filesToAdd = files.slice(0, remaining);
  
  filesToAdd.forEach(file => {
    if (file.size > 5 * 1024 * 1024) {
      showToast(`Файл "${file.name}" превышает 5 МБ`, 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      reviewPhotos.push(e.target.result);
      renderPhotoPreviews();
    };
    reader.readAsDataURL(file);
  });
}

function renderPhotoPreviews() {
  const container = document.getElementById('reviewPhotoPreview');
  container.innerHTML = reviewPhotos.map((photo, index) => `
    <div class="photo-preview-item">
      <img src="${photo}" alt="preview">
      <div class="remove-photo" onclick="removeReviewPhoto(${index})">
        <i class="fas fa-times"></i>
      </div>
    </div>
  `).join('');
}

function removeReviewPhoto(index) {
  reviewPhotos.splice(index, 1);
  renderPhotoPreviews();
}

async function loadProductsForSelect() {
  const select = document.getElementById('reviewProduct');
  if (!select) return;
  
  try {
    const response = await fetch('/api/products');
    const products = await response.json();
    
    products.slice(0, 20).forEach(product => {
      const option = document.createElement('option');
      option.value = product.id;
      option.textContent = product.title.substring(0, 50);
      select.appendChild(option);
    });
  } catch (e) {
    console.error('Ошибка загрузки товаров:', e);
  }
}

function submitReview() {
  const rating = parseInt(document.getElementById('reviewRating').value);
  const author = document.getElementById('reviewAuthor').value.trim();
  const text = document.getElementById('reviewText').value.trim();
  const pros = document.getElementById('reviewPros').value.trim();
  const cons = document.getElementById('reviewCons').value.trim();
  const productId = document.getElementById('reviewProduct').value;
  
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
  
  let productName = '';
  if (productId) {
    const select = document.getElementById('reviewProduct');
    productName = select.options[select.selectedIndex].text;
  }
  
  const review = {
    id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
    rating: rating,
    author: author,
    text: text,
    pros: pros,
    cons: cons,
    date: new Date().toISOString(),
    verified: Math.random() > 0.5,
    productId: productId || null,
    productName: productName,
    likes: 0,
    liked: false,
    photos: [...reviewPhotos],
    reply: null
  };
  
  reviews.unshift(review);
  localStorage.setItem('apex_reviews', JSON.stringify(reviews));
  
  closeWriteReviewModal();
  applyFiltersAndSort();
  showToast('Спасибо за отзыв! Он будет опубликован после проверки.', 'success');
}

// ========== ДЕЙСТВИЯ С ОТЗЫВАМИ ==========

function likeReview(reviewId) {
  const review = reviews.find(r => r.id === reviewId);
  if (review) {
    review.liked = !review.liked;
    review.likes = (review.likes || 0) + (review.liked ? 1 : -1);
    localStorage.setItem('apex_reviews', JSON.stringify(reviews));
    
    // Обновляем только эту карточку
    const card = document.querySelector(`.review-card[data-id="${reviewId}"]`);
    if (card) {
      const likeBtn = card.querySelector('.review-action-btn');
      const icon = likeBtn.querySelector('i');
      icon.className = review.liked ? 'fas fa-heart' : 'far fa-heart';
      likeBtn.classList.toggle('liked', review.liked);
      likeBtn.innerHTML = `<i class="${icon.className}"></i> ${review.likes}`;
    }
  }
}

function shareReview(reviewId) {
  const url = `${window.location.origin}${window.location.pathname}?review=${reviewId}`;
  
  if (navigator.share) {
    navigator.share({
      title: 'Отзыв на Плейнексис',
      text: 'Посмотрите этот отзыв на маркетплейсе Плейнексис!',
      url: url
    }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(url).then(() => {
      showToast('Ссылка скопирована!', 'success');
    }).catch(() => {
      prompt('Ссылка на отзыв:', url);
    });
  }
}

function reportReview(reviewId) {
  const reason = prompt('Укажите причину жалобы:');
  if (!reason) return;
  
  const reports = JSON.parse(localStorage.getItem('apex_review_reports') || '[]');
  reports.push({
    reviewId: reviewId,
    reason: reason,
    date: new Date().toISOString(),
    reportedBy: localStorage.getItem('apex_user') || 'Гость'
  });
  localStorage.setItem('apex_review_reports', JSON.stringify(reports));
  
  showToast('Жалоба отправлена на рассмотрение', 'success');
}

// ========== ПРОСМОТР ФОТО ==========

function openPhotoViewer(reviewId, startIndex) {
  const review = reviews.find(r => r.id === reviewId);
  if (!review || !review.photos) return;
  
  currentPhotoViewer = {
    photos: review.photos,
    currentIndex: startIndex
  };
  
  const modal = document.getElementById('photoViewerModal');
  const img = document.getElementById('viewerImage');
  
  if (modal && img) {
    img.src = review.photos[startIndex];
    updatePhotoCounter();
    modal.classList.add('active');
  }
}

function closePhotoViewer() {
  const modal = document.getElementById('photoViewerModal');
  if (modal) modal.classList.remove('active');
}

function prevPhoto() {
  if (currentPhotoViewer.photos.length === 0) return;
  
  currentPhotoViewer.currentIndex--;
  if (currentPhotoViewer.currentIndex < 0) {
    currentPhotoViewer.currentIndex = currentPhotoViewer.photos.length - 1;
  }
  
  document.getElementById('viewerImage').src = currentPhotoViewer.photos[currentPhotoViewer.currentIndex];
  updatePhotoCounter();
}

function nextPhoto() {
  if (currentPhotoViewer.photos.length === 0) return;
  
  currentPhotoViewer.currentIndex++;
  if (currentPhotoViewer.currentIndex >= currentPhotoViewer.photos.length) {
    currentPhotoViewer.currentIndex = 0;
  }
  
  document.getElementById('viewerImage').src = currentPhotoViewer.photos[currentPhotoViewer.currentIndex];
  updatePhotoCounter();
}

function updatePhotoCounter() {
  const counter = document.getElementById('photoCounter');
  if (counter) {
    counter.textContent = `${currentPhotoViewer.currentIndex + 1} / ${currentPhotoViewer.photos.length}`;
  }
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Сегодня';
  if (days === 1) return 'Вчера';
  if (days < 7) return `${days} ${getDayWord(days)} назад`;
  if (days < 30) return `${Math.floor(days / 7)} ${getWeekWord(Math.floor(days / 7))} назад`;
  
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getDayWord(days) {
  if (days === 1) return 'день';
  if (days >= 2 && days <= 4) return 'дня';
  return 'дней';
}

function getWeekWord(weeks) {
  if (weeks === 1) return 'неделю';
  if (weeks >= 2 && weeks <= 4) return 'недели';
  return 'недель';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

// ========== ЭКСПОРТ ==========

window.initReviewsPage = initReviewsPage;
window.openWriteReviewModal = openWriteReviewModal;
window.closeWriteReviewModal = closeWriteReviewModal;
window.submitReview = submitReview;
window.likeReview = likeReview;
window.shareReview = shareReview;
window.reportReview = reportReview;
window.filterByRating = filterByRating;
window.removeReviewPhoto = removeReviewPhoto;
window.openPhotoViewer = openPhotoViewer;
window.closePhotoViewer = closePhotoViewer;
window.prevPhoto = prevPhoto;
window.nextPhoto = nextPhoto;

// Автоинициализация
document.addEventListener('DOMContentLoaded', function() {
  
  // Инициализация при открытии страницы
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.target.id === 'reviewsPage' && mutation.target.classList.contains('active')) {
        initReviewsPage();
      }
    });
  });
  
  const reviewsPage = document.getElementById('reviewsPage');
  if (reviewsPage) {
    observer.observe(reviewsPage, { attributes: true, attributeFilter: ['class'] });
  }
  
  // Закрытие модалок по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeWriteReviewModal();
      closePhotoViewer();
    }
  });
});