// ========== НОВЫЙ ДИЗАЙН ПРОФИЛЯ (адаптив под ПК) ==========

(function() {
  let profileHeroBg = localStorage.getItem('profileHeroBg') || null;
  let profileAvatarBg = localStorage.getItem('profileAvatarBg') || null;
  
  // Фоновые пресеты для hero-секции
  const heroBgPresets = [
    { name: 'Тёмный градиент', style: 'linear-gradient(135deg, #11131f, #0a0c16)' },
    { name: 'Космос', style: 'radial-gradient(circle at 30% 20%, #0f0c29, #24243e, #302b63)' },
    { name: 'Магма', style: 'linear-gradient(145deg, #2b0f1c, #5e2a3e, #1a0a12)' },
    { name: 'Океан', style: 'linear-gradient(125deg, #001f3f, #0a2f44, #004d66)' },
    { name: 'Фиолетовая дымка', style: 'linear-gradient(115deg, #1e1a3a, #2b2d5c, #1a1b3a)' },
    { name: 'Зелёные джунгли', style: 'linear-gradient(145deg, #0f2b1f, #1c4a2e, #0a2a1a)' },
    { name: 'Закат', style: 'linear-gradient(105deg, #2c1a2e, #803d3d, #b9734b)' },
    { name: 'Синий металлик', style: 'linear-gradient(95deg, #0a192f, #0f2c4e, #1c4e70)' }
  ];
  
  // Пресеты для аватара
  const avatarBgPresets = [
    { name: 'Градиент 1', style: 'linear-gradient(135deg, #667eea, #764ba2)' },
    { name: 'Градиент 2', style: 'linear-gradient(135deg, #f093fb, #f5576c)' },
    { name: 'Градиент 3', style: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
    { name: 'Градиент 4', style: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
    { name: 'Градиент 5', style: 'linear-gradient(135deg, #fa709a, #fee140)' },
    { name: 'Космос', style: 'radial-gradient(circle, #1a0f2e, #1e1b4b)' },
    { name: 'Неон', style: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)' }
  ];
  
  function initNewProfile() {
    const heroSection = document.getElementById('profileHeroSection');
    if (heroSection && profileHeroBg) {
      heroSection.style.background = profileHeroBg;
      heroSection.style.backgroundSize = 'cover';
      heroSection.style.backgroundPosition = 'center';
    }
    
    const avatarCircle = document.getElementById('profileAvatarCircle');
    if (avatarCircle && profileAvatarBg) {
      avatarCircle.style.backgroundImage = profileAvatarBg;
      avatarCircle.style.backgroundSize = 'cover';
      avatarCircle.style.backgroundPosition = 'center';
      avatarCircle.classList.add('has-bg');
    }
    
    setupHeroBgButton();
    setupAvatarChangeButton();
    setupBalanceClick();
    setupReviewsClick();
    setupShopWindowButton();
    
    // Перестраиваем HTML hero-секции под горизонтальный макет
    rebuildHeroLayout();
    
    // Сбрасываем статистику на нули
    resetProfileStats();
  }
  
  // Кнопка витрины
  function setupShopWindowButton() {
    const shopBtn = document.querySelector('.shop-window-btn');
    if (shopBtn) {
      shopBtn.addEventListener('click', () => {
        alert('🏪 Витрина магазина\n\nЗдесь будут отображаться ваши товары для покупателей.\nСкоро появится возможность настроить витрину!');
      });
    }
  }
  
  // Сброс статистики профиля
  function resetProfileStats() {
    if (window.userProfile) {
      const products = JSON.parse(localStorage.getItem('apex_products') || '[]');
      const userProducts = products.filter(p => p.seller === window.currentUser);
      
      window.userProfile.productsCount = userProducts.length;
      window.userProfile.purchasesCount = 0;
      window.userProfile.salesCount = 0;
      
      // Подсчет активных и завершенных товаров
      const activeProducts = userProducts.filter(p => p.status !== 'completed');
      const completedProducts = userProducts.filter(p => p.status === 'completed');
      
      window.userProfile.activeOrders = activeProducts.length;
      window.userProfile.completedOrders = completedProducts.length;
      window.userProfile.balance = 0;
      window.userProfile.rating = 5.0;
      window.userProfile.reviewsCount = 0;
      localStorage.setItem("apex_profile", JSON.stringify(window.userProfile));
    }
    
    updateNewProfileStats(window.userProfile || {
      productsCount: 0,
      purchasesCount: 0,
      salesCount: 0,
      activeOrders: 0,
      completedOrders: 0,
      balance: 0,
      joinedDate: "января 2026",
      reviewsCount: 0
    });
  }
  
  function rebuildHeroLayout() {
    const heroSection = document.getElementById('profileHeroSection');
    if (!heroSection) return;
    
    if (heroSection.querySelector('.hero-content')) return;
    
    const avatarHtml = heroSection.querySelector('.avatar-centered')?.outerHTML || '';
    const infoHtml = heroSection.querySelector('.hero-info')?.outerHTML || '';
    
    const newContent = document.createElement('div');
    newContent.className = 'hero-content';
    newContent.innerHTML = avatarHtml + infoHtml;
    
    const oldAvatar = heroSection.querySelector('.avatar-centered');
    const oldInfo = heroSection.querySelector('.hero-info');
    if (oldAvatar && oldInfo) {
      heroSection.removeChild(oldAvatar);
      heroSection.removeChild(oldInfo);
      heroSection.insertBefore(newContent, heroSection.firstChild);
    }
  }
  
  function setupHeroBgButton() {
    const changeBtn = document.getElementById('changeHeroBgBtn');
    if (!changeBtn) return;
    changeBtn.addEventListener('click', () => openHeroBgModal());
  }
  
  function openHeroBgModal() {
    let modal = document.getElementById('profileHeroBgModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'profileHeroBgModal';
      modal.className = 'profile-modal';
      modal.innerHTML = `
        <div class="profile-modal-card">
          <h4>🎨 Фон вокруг аватара</h4>
          <div class="bg-options" id="heroBgOptions"></div>
          <div class="modal-actions">
            <button class="modal-btn danger" id="removeHeroBgBtn">🗑️ Удалить фон</button>
            <button class="modal-btn" id="closeHeroBgModal">Закрыть</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      const container = modal.querySelector('#heroBgOptions');
      heroBgPresets.forEach(preset => {
        const option = document.createElement('div');
        option.className = 'bg-option';
        option.style.background = preset.style;
        option.title = preset.name;
        option.addEventListener('click', () => {
          const heroSection = document.getElementById('profileHeroSection');
          if (heroSection) {
            heroSection.style.background = preset.style;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
            localStorage.setItem('profileHeroBg', preset.style);
          }
          modal.classList.remove('active');
        });
        container.appendChild(option);
      });
      
      modal.querySelector('#removeHeroBgBtn').addEventListener('click', () => {
        const heroSection = document.getElementById('profileHeroSection');
        if (heroSection) {
          heroSection.style.background = 'linear-gradient(135deg, #11131f, #0a0c16)';
          localStorage.removeItem('profileHeroBg');
        }
        modal.classList.remove('active');
      });
      
      modal.querySelector('#closeHeroBgModal').addEventListener('click', () => {
        modal.classList.remove('active');
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }
    modal.classList.add('active');
  }
  
  function setupAvatarChangeButton() {
    const avatarWrapper = document.querySelector('.avatar-wrapper');
    if (!avatarWrapper) return;
    
    if (!avatarWrapper.querySelector('.change-avatar-btn')) {
      const changeBtn = document.createElement('div');
      changeBtn.className = 'change-avatar-btn';
      changeBtn.innerHTML = '<i class="fas fa-camera"></i>';
      changeBtn.title = 'Сменить аватар';
      avatarWrapper.appendChild(changeBtn);
      changeBtn.addEventListener('click', openAvatarBgModal);
    }
  }
  
  function openAvatarBgModal() {
    let modal = document.getElementById('profileAvatarBgModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'profileAvatarBgModal';
      modal.className = 'profile-modal';
      modal.innerHTML = `
        <div class="profile-modal-card">
          <h4>🎨 Аватар</h4>
          <div class="bg-options" id="avatarBgOptions"></div>
          <div class="modal-actions">
            <button class="modal-btn danger" id="removeAvatarBgBtn">🗑️ Сбросить</button>
            <button class="modal-btn" id="closeAvatarBgModal">Закрыть</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      const container = modal.querySelector('#avatarBgOptions');
      avatarBgPresets.forEach(preset => {
        const option = document.createElement('div');
        option.className = 'bg-option';
        option.style.background = preset.style;
        option.title = preset.name;
        option.addEventListener('click', () => {
          const avatarCircle = document.getElementById('profileAvatarCircle');
          if (avatarCircle) {
            avatarCircle.style.backgroundImage = preset.style;
            avatarCircle.style.backgroundSize = 'cover';
            avatarCircle.style.backgroundPosition = 'center';
            avatarCircle.classList.add('has-bg');
            localStorage.setItem('profileAvatarBg', preset.style);
          }
          modal.classList.remove('active');
        });
        container.appendChild(option);
      });
      
      modal.querySelector('#removeAvatarBgBtn').addEventListener('click', () => {
        const avatarCircle = document.getElementById('profileAvatarCircle');
        if (avatarCircle) {
          avatarCircle.style.backgroundImage = '';
          avatarCircle.style.background = '';
          avatarCircle.classList.remove('has-bg');
          localStorage.removeItem('profileAvatarBg');
        }
        modal.classList.remove('active');
      });
      
      modal.querySelector('#closeAvatarBgModal').addEventListener('click', () => {
        modal.classList.remove('active');
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }
    modal.classList.add('active');
  }
  
function setupBalanceClick() {
  const balanceCard = document.querySelector('.profile-balance-card');
  if (balanceCard) {
    // Удаляем старый обработчик, если есть
    const newBalanceCard = balanceCard.cloneNode(true);
    balanceCard.parentNode.replaceChild(newBalanceCard, balanceCard);
    
    newBalanceCard.addEventListener('click', () => {
      // Открываем страницу вывода средств
      if (typeof window.showPage === 'function') {
        // Убеждаемся что страница вывода существует
        let withdrawPage = document.getElementById('withdrawPage');
        if (!withdrawPage) {
          console.warn('Страница вывода не найдена в DOM');
          alert('Страница вывода временно недоступна');
          return;
        }
        window.showPage('withdrawPage');
        // Инициализируем страницу вывода
        if (typeof window.initWithdrawPage === 'function') {
          setTimeout(window.initWithdrawPage, 50);
        }
      } else {
        alert('💰 Баланс: ' + (window.userProfile?.balance?.toFixed(2) || '0') + ' ₽\nПополнение и вывод средств');
      }
    });
  }
}

  function setupReviewsClick() {
    const reviewsLink = document.getElementById('profileReviewsLink');
    if (reviewsLink) {
      reviewsLink.addEventListener('click', (e) => {
        e.preventDefault();
        alert('⭐ 0.0 · 0 отзывов\n\n📝 Отзывы отсутствуют');
      });
    }
  }
  
  function updateNewProfileStats(profileData) {
    const productsCountEl = document.getElementById('profileProductsCount');
    const purchasesCountEl = document.getElementById('profilePurchasesCount');
    const salesCountEl = document.getElementById('profileSalesCount');
    const activeCountEl = document.getElementById('activeCount');
    const completedCountEl = document.getElementById('completedCount');
    const balanceEl = document.getElementById('profileBalance');
    const usernameEl = document.getElementById('profileUsername');
    const joinedEl = document.getElementById('profileJoined');
    const reviewsCountEl = document.getElementById('profileReviewsLink');
    const ratingValueEl = document.querySelector('.hero-rating-value');
    const starsEl = document.querySelector('.hero-stars');
    
    if (productsCountEl) productsCountEl.innerText = profileData.productsCount || 0;
    if (purchasesCountEl) purchasesCountEl.innerText = profileData.purchasesCount || 0;
    if (salesCountEl) salesCountEl.innerText = profileData.salesCount || 0;
    if (activeCountEl) activeCountEl.innerText = profileData.activeOrders || 0;
    if (completedCountEl) completedCountEl.innerText = profileData.completedOrders || 0;
    if (balanceEl) balanceEl.innerText = (profileData.balance || 0).toFixed(2) + ' ₽';
    if (usernameEl && window.currentUser) usernameEl.innerText = window.currentUser;
    if (joinedEl && profileData.joinedDate) joinedEl.innerText = `на Плейнексис с ${profileData.joinedDate}`;
    if (reviewsCountEl) reviewsCountEl.innerText = (profileData.reviewsCount || 0) + ' отзыва';
    if (ratingValueEl) ratingValueEl.innerText = (profileData.rating || 0).toFixed(1);
    if (starsEl) starsEl.innerHTML = '★★★★★';
    
    const avatarSpan = document.querySelector('#profileAvatarCircle span');
    if (avatarSpan && window.currentUser) {
      avatarSpan.innerText = window.currentUser.charAt(0).toUpperCase();
    }
  }
  
  // Функция для подсчета активных и завершенных товаров
  function updateActiveCompletedCounts() {
    const products = JSON.parse(localStorage.getItem('apex_products') || '[]');
    const userProducts = products.filter(p => p.seller === window.currentUser);
    
    const activeProducts = userProducts.filter(p => p.status !== 'completed');
    const completedProducts = userProducts.filter(p => p.status === 'completed');
    
    const activeCountEl = document.getElementById('activeCount');
    const completedCountEl = document.getElementById('completedCount');
    
    if (activeCountEl) activeCountEl.innerText = activeProducts.length;
    if (completedCountEl) completedCountEl.innerText = completedProducts.length;
    
    if (window.userProfile) {
      window.userProfile.activeOrders = activeProducts.length;
      window.userProfile.completedOrders = completedProducts.length;
      localStorage.setItem("apex_profile", JSON.stringify(window.userProfile));
    }
  }
  
 async function loadUserProductsInProfile() {
    const container = document.getElementById('profileProductsList');
    if (!container) return;
    
    const currentUser = localStorage.getItem('apex_user') || 'Гость';
    // ⭐ БЕРЕМ С СЕРВЕРА ⭐
    const products = await API.getProducts();
    const userProducts = products.filter(p => p.seller === currentUser);
    
    // Обновляем счетчик товаров
    if (window.userProfile) {
        window.userProfile.productsCount = userProducts.length;
        localStorage.setItem("apex_profile", JSON.stringify(window.userProfile));
        if (typeof updateNewProfileStats === 'function') updateNewProfileStats(window.userProfile);
    }
    
    if (userProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-products">
                <i class="fas fa-box-open"></i>
                <p>Нет товаров</p>
                <button class="btn-glow sell-btn" onclick="window.openModal()">Выставить товар</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userProducts.map(product => `
        <div class="profile-product-item" style="position: relative; cursor: pointer;" onclick="window.openProductDetailById('${product.id}')">
            <img class="profile-product-img" src="${escapeHtml(product.image_url || 'https://picsum.photos/id/42/50/50')}" alt="${escapeHtml(product.title)}">
            <div class="profile-product-info">
                <div class="profile-product-title">${escapeHtml(product.title)}</div>
                <div class="profile-product-price">${escapeHtml(product.price)}</div>
                <div class="profile-product-status status-active">● Активен</div>
            </div>
        </div>
    `).join('');
}
  
  function loadActiveProducts() {
    const container = document.getElementById('profileProductsList');
    if (!container) return;
    const products = JSON.parse(localStorage.getItem('apex_products') || '[]');
    const userProducts = products.filter(p => p.seller === window.currentUser && p.status !== 'completed');
    
    updateActiveCompletedCounts();
    
    if (userProducts.length === 0) {
      container.innerHTML = `
        <div class="empty-products">
          <i class="fas fa-box-open"></i>
          <p>Нет активных товаров</p>
          <button class="btn-glow sell-btn" onclick="window.openModal()">Выставить товар</button>
        </div>
      `;
      return;
    }
    
    container.innerHTML = userProducts.map(product => `
      <div class="profile-product-item" style="position: relative;">
        <img class="profile-product-img" src="${escapeHtml(product.imageUrl || 'https://picsum.photos/id/42/50/50')}" alt="${escapeHtml(product.title)}" onclick="window.openProductDetailById('${product.id}')">
        <div class="profile-product-info" onclick="window.openProductDetailById('${product.id}')" style="cursor: pointer;">
          <div class="profile-product-title">${escapeHtml(product.title)}</div>
          <div class="profile-product-price">${escapeHtml(product.price)}</div>
          <div class="profile-product-status status-active">● Активен</div>
        </div>
        <button class="edit-product-btn" onclick="editProductFromProfile('${product.id}')">
          <i class="fas fa-edit"></i>
        </button>
      </div>
    `).join('');
  }
  
  function loadCompletedProducts() {
    const container = document.getElementById('profileProductsList');
    if (!container) return;
    const products = JSON.parse(localStorage.getItem('apex_products') || '[]');
    const userProducts = products.filter(p => p.seller === window.currentUser && p.status === 'completed');
    
    updateActiveCompletedCounts();
    
    if (userProducts.length === 0) {
      container.innerHTML = `
        <div class="empty-products">
          <i class="fas fa-check-circle"></i>
          <p>Нет завершенных товаров</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = userProducts.map(product => `
      <div class="profile-product-item" style="position: relative;">
        <img class="profile-product-img" src="${escapeHtml(product.imageUrl || 'https://picsum.photos/id/42/50/50')}" alt="${escapeHtml(product.title)}" onclick="window.openProductDetailById('${product.id}')">
        <div class="profile-product-info" onclick="window.openProductDetailById('${product.id}')" style="cursor: pointer;">
          <div class="profile-product-title">${escapeHtml(product.title)}</div>
          <div class="profile-product-price">${escapeHtml(product.price)}</div>
          <div class="profile-product-status status-completed">● Завершён</div>
        </div>
        <button class="edit-product-btn" onclick="editProductFromProfile('${product.id}')">
          <i class="fas fa-edit"></i>
        </button>
      </div>
    `).join('');
  }
  
  function editProductFromProfile(productId) {
    const products = JSON.parse(localStorage.getItem("apex_products") || "[]");
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      alert("Товар не найден");
      return;
    }
    
    if (product.seller !== window.currentUser) {
      alert("Вы можете редактировать только свои товары");
      return;
    }
    
    openEditProductModal(product);
  }
  
  function openEditProductModal(product) {
    let modal = document.getElementById('editProductModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'editProductModal';
      modal.className = 'profile-modal';
      modal.innerHTML = `
        <div class="profile-modal-card" style="max-width: 500px; width: 90%;">
          <h4>✏️ Редактировать товар</h4>
          <div style="margin-bottom: 12px;">
            <input type="text" id="editTitle" class="input-modern" placeholder="Название товара" style="width: 100%; margin-bottom: 10px;">
            <input type="text" id="editPrice" class="input-modern" placeholder="Цена" style="width: 100%; margin-bottom: 10px;">
            <input type="text" id="editDiscount" class="input-modern" placeholder="Скидка (например: 20% или 100)" style="width: 100%; margin-bottom: 10px;">
            <textarea id="editDescription" class="input-modern" rows="3" placeholder="Описание товара" style="width: 100%; margin-bottom: 10px;"></textarea>
            <input type="text" id="editImageUrl" class="input-modern" placeholder="URL фото" style="width: 100%; margin-bottom: 10px;">
            <select id="editKeyword" class="input-modern" style="width: 100%; margin-bottom: 10px;"></select>
          </div>
          <div class="modal-actions" style="display: flex; gap: 10px; justify-content: center;">
            <button class="modal-btn" id="saveEditBtn">💾 Сохранить</button>
            <button class="modal-btn danger" id="cancelEditBtn">Отмена</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      const keywordSelect = modal.querySelector('#editKeyword');
      const storedKeywords = localStorage.getItem("apex_keywords");
      let keywords = [];
      if (storedKeywords) {
        keywords = JSON.parse(storedKeywords);
      } else {
        keywords = [
          { id: "1", name: "Discord", type: "Nitro" },
          { id: "2", name: "Discord", type: "Turbo" },
          { id: "3", name: "Steam", type: "Premium" }
        ];
      }
      
      keywordSelect.innerHTML = '<option value="">Выберите категорию</option>';
      keywords.forEach(k => {
        keywordSelect.innerHTML += `<option value="${k.id}">${k.name} - ${k.type}</option>`;
      });
      
      modal.querySelector('#saveEditBtn').addEventListener('click', () => saveProductEdit(product.id));
      modal.querySelector('#cancelEditBtn').addEventListener('click', () => modal.classList.remove('active'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }
    
    document.getElementById('editTitle').value = product.title || '';
    document.getElementById('editPrice').value = product.price || '';
    document.getElementById('editDiscount').value = product.discount || '';
    document.getElementById('editDescription').value = (product.fullDesc || '').replace(' Моментальная выдача. Гарантия качества.', '');
    document.getElementById('editImageUrl').value = product.imageUrl || '';
    
    const keywordSelect = document.getElementById('editKeyword');
    if (product.keywordId) {
      keywordSelect.value = product.keywordId;
    } else {
      keywordSelect.value = '';
    }
    
    modal.classList.add('active');
  }
  
  function saveProductEdit(productId) {
    const newTitle = document.getElementById('editTitle').value.trim();
    const newPrice = document.getElementById('editPrice').value.trim();
    const newDiscount = document.getElementById('editDiscount').value.trim();
    const newDescription = document.getElementById('editDescription').value.trim();
    const newImageUrl = document.getElementById('editImageUrl').value.trim();
    const keywordId = document.getElementById('editKeyword').value;
    
    if (!newTitle) {
      alert("Введите название товара");
      return;
    }
    if (!newPrice) {
      alert("Введите цену");
      return;
    }
    
    let products = JSON.parse(localStorage.getItem("apex_products") || "[]");
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      alert("Товар не найден");
      document.getElementById('editProductModal').classList.remove('active');
      return;
    }
    
    let keywordName = "";
    if (keywordId) {
      const storedKeywords = localStorage.getItem("apex_keywords");
      if (storedKeywords) {
        const keywords = JSON.parse(storedKeywords);
        const selected = keywords.find(k => k.id === keywordId);
        if (selected) keywordName = selected.name;
      }
    }
    
    products[productIndex] = {
      ...products[productIndex],
      title: newTitle,
      price: newPrice,
      discount: newDiscount || null,
      fullDesc: newDescription ? `${newDescription} Моментальная выдача. Гарантия качества.` : products[productIndex].fullDesc,
      imageUrl: newImageUrl || products[productIndex].imageUrl,
      keywordId: keywordId || products[productIndex].keywordId,
      keyword: keywordName || products[productIndex].keyword
    };
    
    localStorage.setItem("apex_products", JSON.stringify(products));
    
    if (window.productsArray) {
      window.productsArray = products;
    }
    
    const modal = document.getElementById('editProductModal');
    if (modal) modal.classList.remove('active');
    
    loadUserProductsInProfile();
    
    const activeTab = document.querySelector('.profile-tab-btn.active');
    if (activeTab && activeTab.getAttribute('data-tab') === 'active') {
      loadActiveProducts();
    } else if (activeTab && activeTab.getAttribute('data-tab') === 'completed') {
      loadCompletedProducts();
    } else {
      loadUserProductsInProfile();
    }
    
    alert("✅ Товар успешно обновлен!");
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
  
  window.initNewProfile = initNewProfile;
  window.updateNewProfileStats = updateNewProfileStats;
  window.loadUserProductsInProfile = loadUserProductsInProfile;
  window.loadActiveProducts = loadActiveProducts;
  window.loadCompletedProducts = loadCompletedProducts;
  window.editProductFromProfile = editProductFromProfile;
  window.saveProductEdit = saveProductEdit;
  window.updateActiveCompletedCounts = updateActiveCompletedCounts;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('profileHeroSection')) {
        setTimeout(initNewProfile, 100);
      }
    });
  } else {
    if (document.getElementById('profileHeroSection')) {
      setTimeout(initNewProfile, 100);
    }
  }
})();