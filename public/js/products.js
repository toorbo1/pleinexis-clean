// Управление товарами
let productsArray = [];

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function filterProducts() {
  const term = document.getElementById('searchInput')?.value.toLowerCase() || '';
  let filtered = productsArray.filter(p => 
    p.title.toLowerCase().includes(term) || 
    (p.keyword && p.keyword.toLowerCase().includes(term)) ||
    (p.type && p.type.toLowerCase().includes(term))
  );
  renderProductGrid(filtered);
}

// Функция для получения рейтинга продавца
function getProductRating(product) {
  let rating = product.rating || 4.5;
  if (typeof rating === 'string') rating = parseFloat(rating);
  if (isNaN(rating)) rating = 4.5;
  
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let starsHtml = '';
  
  for (let i = 0; i < fullStars; i++) {
    starsHtml += '★';
  }
  if (hasHalfStar) {
    starsHtml += '½';
  }
  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '☆';
  }
  
  let reviewsCount = product.sales || product.reviewsCount;
  if (!reviewsCount || reviewsCount === 0) {
    reviewsCount = Math.floor(Math.random() * 500) + 10;
  }
  
  return {
    starsHtml: starsHtml,
    rating: rating.toFixed(1),
    reviewsCount: reviewsCount
  };
}

// Функция форматирования цены со скидкой
function formatPriceWithDiscount(product) {
  if (product.discount && product.originalPrice) {
    let discountText = product.discount;
    if (discountText && !discountText.includes('%') && !isNaN(parseFloat(discountText))) {
      discountText = discountText + '%';
    }
    return {
      hasDiscount: true,
      currentPrice: product.price,
      oldPrice: product.originalPrice,
      discountText: discountText
    };
  }
  
  if (product.discount && typeof product.discount === 'string') {
    let discountText = product.discount;
    if (!discountText.includes('%') && !isNaN(parseFloat(discountText))) {
      discountText = discountText + '%';
    }
    return {
      hasDiscount: true,
      currentPrice: product.price,
      oldPrice: product.originalPrice || product.price,
      discountText: discountText
    };
  }
  
  return {
    hasDiscount: false,
    currentPrice: product.price,
    oldPrice: null,
    discountText: null
  };
}
async function renderProductGrid(products) {
    const container = document.getElementById("productsGrid");
    if (!container) return;
    
    // Если products не переданы, берем с сервера
    if (!products) {
        products = await API.getProducts();
    }
    
    if (products.length === 0) {
        container.innerHTML = "<div class='empty-state'><i class='fas fa-search'></i><p>Ничего не найдено</p></div>";
        updateProductCount(0);
        return;
    }
    
    let html = "";
    products.forEach(prod => {
        html += `
            <div class="product-card" onclick="window.openProductDetailById('${prod.id}')">
                <div class="card-image">
                    <img src="${escapeHtml(prod.image_url || 'https://picsum.photos/id/42/400/300')}" 
                         alt="${escapeHtml(prod.title)}"
                         loading="lazy"
                         onerror="this.src='https://picsum.photos/id/42/400/300'">
                    ${prod.discount ? `<span class="discount-badge">-${prod.discount}</span>` : ''}
                </div>
                <div class="card-body">
                    <div class="price-wrapper">
                        <span class="current-price">${escapeHtml(prod.price)}</span>
                        ${prod.original_price ? `<span class="old-price">${escapeHtml(prod.original_price)}</span>` : ''}
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
    updateProductCount(products.length);
}

function updateProductCount(count) {
  const span = document.getElementById("productCountStat");
  if (span) span.innerText = count;
}

// Загрузка ключевых слов для выпадающего списка
function loadKeywordsForSelect() {
  const select = document.getElementById("productKeyword");
  if (!select) return;
  
  const stored = localStorage.getItem("apex_keywords");
  let keywords = [];
  if (stored) {
    keywords = JSON.parse(stored);
  } else {
    keywords = [
      { id: "1", name: "Discord", type: "Nitro" },
      { id: "2", name: "Discord", type: "Turbo" },
      { id: "3", name: "Steam", type: "Premium" },
      { id: "4", name: "Netflix", type: "4K" },
      { id: "5", name: "Spotify", type: "Premium" }
    ];
  }
  
  select.innerHTML = '<option value="">Выберите ключевое слово/категорию</option>';
  keywords.forEach(k => {
    select.innerHTML += `<option value="${escapeHtml(k.id)}">${escapeHtml(k.name)} - ${escapeHtml(k.type)}</option>`;
  });
}

async function loadProducts() {
    console.log('Loading products from server...');
    try {
        const products = await API.getProducts();
        window.productsArray = products;
        localStorage.setItem('apex_products', JSON.stringify(products)); // резервная копия
        
        if (typeof filterProducts === 'function') {
            filterProducts();
        } else {
            renderProductGrid(products);
        }
        
        console.log(`✅ Загружено ${products.length} товаров с сервера`);
    } catch (error) {
        console.error('Error loading products:', error);
        // Fallback на localStorage
        const stored = localStorage.getItem("apex_products");
        if (stored) {
            window.productsArray = JSON.parse(stored);
            if (typeof filterProducts === 'function') filterProducts();
        }
    }
}


async function createNewProduct() {
    console.log('🔵 createNewProduct вызвана');
    
    const category = document.getElementById('productCategory')?.value;
    const keywordId = document.getElementById('productKeywordSelect')?.value;
    const title = document.getElementById('productTitle')?.value.trim();
    const price = document.getElementById('productPrice')?.value.trim();
    const discount = document.getElementById('productDiscount')?.value.trim();
    const description = document.getElementById('productDescription')?.value.trim();
    const instructions = document.getElementById('productInstructions')?.value.trim();
    const imageUrl = document.getElementById('productImageUrl')?.value;
    
    console.log('📝 Данные формы:', { category, keywordId, title, price });
    
    // Валидация
    if (!category) { showToast('Выберите категорию товара', 'error'); return; }
    if (!keywordId) { showToast('Выберите сервис или ключевое слово', 'error'); return; }
    if (!title) { showToast('Введите название товара', 'error'); return; }
    if (!price) { showToast('Введите цену товара', 'error'); return; }
    if (!description) { showToast('Введите описание товара', 'error'); return; }
    
    // Получаем имя ключевого слова
    let keywordName = '';
    try {
        const keywords = await API.getKeywords();
        const selectedKeyword = keywords.find(k => k.id === keywordId);
        if (selectedKeyword) {
            keywordName = selectedKeyword.name;
        }
    } catch(e) {
        console.error('Error getting keyword:', e);
    }
    
    // Формируем описание
    let fullDescription = description;
    if (instructions) {
        fullDescription += '\n\n📖 Инструкция по активации:\n' + instructions;
    }
    fullDescription += '\n\nМоментальная выдача. Гарантия качества.';
    
    // Цена со скидкой
    let finalPrice = price;
    let originalPrice = null;
    let discountText = discount || null;
    
    if (discount) {
        const discountValue = parseFloat(discount);
        const priceValue = parseFloat(price.replace(/[^0-9.-]/g, ''));
        if (!isNaN(priceValue) && !isNaN(discountValue)) {
            if (discount.includes('%')) {
                finalPrice = Math.round(priceValue * (1 - discountValue / 100)) + ' ₽';
                originalPrice = price;
            } else {
                finalPrice = (priceValue - discountValue) + ' ₽';
                originalPrice = price;
            }
        }
    }
    
    const currentUser = localStorage.getItem('apex_user') || 'Гость';
    
    const newProduct = {
        title: title,
        price: finalPrice,
        seller: currentUser,
        keyword: keywordName,
        image_url: imageUrl || "https://picsum.photos/id/42/400/200",
        description: fullDescription,
        discount: discountText,
        originalPrice: originalPrice
    };
    

}


async function deleteUserProduct(productId) {
    if (confirm('Удалить этот товар?')) {
        try {
            await API.deleteProduct(productId);
            showToast('✅ Товар удален', 'success');
            
            // Перезагружаем списки
            await loadProducts();
            
            if (typeof renderUserProductsList === 'function') {
                renderUserProductsList();
            }
            
        } catch (error) {
            console.error('Ошибка удаления:', error);
            showToast('❌ Ошибка при удалении', 'error');
        }
    }
}


function openProductDetailById(productId) {
  // Прокручиваем страницу вверх перед открытием деталей
  window.scrollTo(0, 0);
  
  const p = productsArray.find(prod => prod.id === productId);
  if (!p) {
    console.error("Товар не найден", productId);
    alert("Товар не найден");
    return;
  }

  const detailContainer = document.getElementById("detailContent");
  if (!detailContainer) return;

  const kppNumber = Math.floor(10000 + Math.random() * 90000);
  
  // Форматируем описание с сохранением переносов строк
  let formattedDescription = escapeHtml(p.fullDesc || "");
  // Заменяем переносы строк на <br>
  formattedDescription = formattedDescription.replace(/\n/g, '<br>');
  // Сохраняем пробелы
  formattedDescription = formattedDescription.replace(/  /g, ' &nbsp;');
  
  const reviewsHtml = `
    <div class="reviews-list">
      <div class="review-item">
        <div class="review-header">
          <span class="review-author">Максим</span>
          <span class="review-stars">★★★★★</span>
          <span class="review-date">15.03.2026</span>
        </div>
        <div class="review-text">Отличный продавец! Всё пришло мгновенно. Рекомендую!</div>
      </div>
      <div class="review-item">
        <div class="review-header">
          <span class="review-author">Алексей</span>
          <span class="review-stars">★★★★★</span>
          <span class="review-date">10.03.2026</span>
        </div>
        <div class="review-text">Быстро, качественно, на связи 24/7. Спасибо!</div>
      </div>
      <div class="review-item">
        <div class="review-header">
          <span class="review-author">Дмитрий</span>
          <span class="review-stars">★★★★★</span>
          <span class="review-date">05.03.2026</span>
        </div>
        <div class="review-text">Лучший магазин. Уже не первый раз беру.</div>
      </div>
    </div>
  `;

  detailContainer.innerHTML = `
    <div class="detail-top-row">
      <div class="detail-image-col">
        <img class="product-detail-image" src="${escapeHtml(p.imageUrl || 'https://picsum.photos/id/20/400/300')}" alt="товар" onerror="this.src='https://picsum.photos/id/20/400/300'">
      </div>
      <div class="detail-info-col">
        <div class="active-badge">
          <span class="active-dot"></span> Активный товар
        </div>
        <div class="product-detail-name">${escapeHtml(p.title)}</div>
        <div class="product-detail-price">${escapeHtml(p.price)}</div>
        <div class="detail-buttons-row">
          <button class="buy-button-inline" id="buyProductNowBtn">
            <i class="fas fa-shopping-cart"></i> Купить
          </button>
        </div>
      </div>
    </div>

    <div class="kpp-block">
      <div class="kpp-number">${kppNumber}</div>
    </div>

    <!-- ОПИСАНИЕ ТОВАРА СРАЗУ ПОСЛЕ KPP -->
    <div class="seller-description-block">
      ${formattedDescription}
    </div>

    <div class="seller-info-block">
      <div class="seller-name-large">${escapeHtml(p.seller)}</div>
      <div class="seller-rating">
        <span class="stars">★★★★★</span>
        <span class="rating-value">${p.rating}</span>
        <span class="reviews-count">${p.sales} отзывов</span>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-cell">
        <div class="stat-number">${p.sales.toLocaleString()}</div>
        <div class="stat-label">продаж</div>
      </div>
      <div class="stat-cell">
        <div class="stat-number">${p.positive || "98%"}</div>
        <div class="stat-label">положительных</div>
      </div>
      <div class="stat-cell">
        <div class="stat-number">${p.responseTime || "отвечает за 5 мин"}</div>
        <div class="stat-label"></div>
      </div>
    </div>

    <div class="guarantee-block">
      <div class="guarantee-title">
        <i class="fas fa-shield-alt"></i> Гарантия Покупателя
      </div>
      <div class="guarantee-items">
        <div class="guarantee-item"><i class="fas fa-check-circle"></i> Возврат средств, если вы не получили товар</div>
        <div class="guarantee-item"><i class="fas fa-check-circle"></i> Возврат средств, если товар не соответствует описанию</div>
        <div class="guarantee-item"><i class="fas fa-lock"></i> Безопасная оплата через защищенный шлюз</div>
        <div class="guarantee-item"><i class="fas fa-headset"></i> Круглосуточная поддержка</div>
        <div class="guarantee-item"><i class="fas fa-exchange-alt"></i> Обмен в течение 24 часов</div>
      </div>
    </div>

    <div class="tabs-container">

      <button class="tab-btn" data-tab="reviews">Отзывы (3)</button>
    </div>
    
    <div class="tab-pane active" id="tab-about">
      <div class="seller-contact-text">
        ${formattedDescription}
      </div>
    </div>
    
    <div class="tab-pane" id="tab-reviews">
      ${reviewsHtml}
    </div>

    <div class="footer-links">
      <a href="#">Политика конфиденциальности</a>
      <a href="#">Пользовательское соглашение</a>
      <a href="#">Условия продажи</a>
      <a href="#">Контакты</a>
    </div>
  `;

  const tabBtns = detailContainer.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      detailContainer.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
      document.getElementById(`tab-${tabId}`).classList.add('active');
    });
  });

  const buyBtn = document.getElementById('buyProductNowBtn');
  if (buyBtn) {
    buyBtn.onclick = () => {
      alert(`✅ Заказ оформлен!\nТовар: ${p.title}\nСумма: ${p.price}\nПродавец свяжется с вами в чате.`);
      closeDetail();
    };
  }

  document.getElementById("detailPage").classList.add("active");
  document.body.style.overflow = "hidden";
}

function openProductDetail(index) {
  if (productsArray[index]) {
    openProductDetailById(productsArray[index].id);
  } else {
    console.error("Неверный индекс товара");
  }
}

function closeDetail() {
  document.getElementById("detailPage").classList.remove("active");
  document.body.style.overflow = "auto";
}

function createNewProduct() {
  const keywordSelect = document.getElementById("productKeyword");
  const keywordId = keywordSelect?.value;
  const productType = document.getElementById("productType")?.value.trim();
  const title = document.getElementById("productTitleOld")?.value.trim();
  const price = document.getElementById("productPriceOld")?.value.trim();
  const description = document.getElementById("productDescriptionOld")?.value.trim();
  const imageUrl = document.getElementById("productImageUrlOld")?.value.trim();
  
  if (!title) {
    alert("Введите название товара");
    return;
  }
  if (!price) {
    alert("Введите цену");
    return;
  }
  
  let keywordName = "";
  if (keywordId) {
    const stored = localStorage.getItem("apex_keywords");
    if (stored) {
      const keywords = JSON.parse(stored);
      const selected = keywords.find(k => k.id === keywordId);
      if (selected) {
        keywordName = selected.name;
      }
    }
  }
  
  const newId = crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random();
  // Сохраняем описание с переносами строк и добавляем гарантию в конце
  const fullDescription = (description || "Новый товар от пользователя") + "\n\nМоментальная выдача. Гарантия качества.";
  
  productsArray.unshift({ 
    id: newId,
    title: title, 
    price: price, 
    seller: window.currentUser || "User", 
    rating: 5.0, 
    sales: 0, 
    fullDesc: fullDescription,
    positive: "100%",
    responseTime: "отвечает быстро",
    imageUrl: imageUrl || "https://picsum.photos/id/42/400/300",
    keyword: keywordName || "Без категории",
    type: productType || "Стандарт"
  });
  
  localStorage.setItem("apex_products", JSON.stringify(productsArray));
  filterProducts();
  closeModal();
  
  if (keywordSelect) keywordSelect.value = "";
  document.getElementById("productType").value = "";
  document.getElementById("productTitleOld").value = "";
  document.getElementById("productPriceOld").value = "";
  document.getElementById("productDescriptionOld").value = "";
  document.getElementById("productImageUrlOld").value = "";
  
  alert("✅ Товар успешно создан!");
}

function openModal() {
  const modal = document.getElementById("modalOverlay");
  if (modal) {
    modal.classList.add("active");
    loadKeywordsForSelect();
  }
}

function closeModal() {
  const modal = document.getElementById("modalOverlay");
  if (modal) modal.classList.remove("active");
}

function getUserProducts() {
  const userProducts = productsArray.filter(p => p.seller === window.currentUser);
  return userProducts;
}

function updateUserProductsCount() {
  const userProductsCount = getUserProducts().length;
  if (window.updateProfileStats) {
    window.updateProfileStats(userProductsCount, undefined, undefined);
  }
}

function searchByGame(gameName) {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = gameName;
    filterProducts();
  }
  const productsHeader = document.querySelector('.products-header');
  if (productsHeader) {
    productsHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function scrollGames(direction) {
  const container = document.getElementById('gamesScrollContainer');
  if (!container) return;
  const scrollAmount = 250;
  if (direction === 'left') {
    container.scrollLeft -= scrollAmount;
  } else {
    container.scrollLeft += scrollAmount;
  }
}

function openKeywordPageByBlock(blockId) {
  const gameBlocks = JSON.parse(localStorage.getItem("apex_game_blocks") || "[]");
  const block = gameBlocks.find(b => b.id === blockId);
  if (!block) return;
  
  if (block.keywordId) {
    const keywords = JSON.parse(localStorage.getItem("apex_keywords") || "[]");
    const keyword = keywords.find(k => k.id === block.keywordId);
    if (keyword) {
      openKeywordPage(keyword.name);
      return;
    }
  }
  openKeywordPage(block.name);
}

function openKeywordPage(keyword) {
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
        const priceInfo = formatPriceWithDiscount(prod);
        const ratingInfo = getProductRating(prod);
        let discountText = priceInfo.discountText || "";
        
        html += `
          <div class="product-card" onclick="window.openProductDetailById('${prod.id}')">
            <div class="card-image">
              <img src="${escapeHtml(prod.imageUrl || 'https://picsum.photos/id/42/400/300')}" 
                   alt="${escapeHtml(prod.title)}"
                   loading="lazy"
                   onerror="this.src='https://picsum.photos/id/42/400/300'">
              ${priceInfo.hasDiscount ? `<span class="discount-badge">🔥 ${discountText}</span>` : ''}
            </div>
            <div class="card-body">
              <div class="price-wrapper">
                <span class="current-price">${escapeHtml(priceInfo.currentPrice)}</span>
                ${priceInfo.hasDiscount ? `<span class="old-price">${escapeHtml(priceInfo.oldPrice)}</span>` : ''}
              </div>
              <h3 class="product-title">${escapeHtml(prod.title)}</h3>
              <div class="rating">
                <span class="stars">${ratingInfo.starsHtml}</span>
                <span class="reviews-count">${ratingInfo.reviewsCount} отзывов</span>
              </div>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
    }
  }
  
  navigate("keywordPage");
}

function goBack() {
  navigate("home");
}

function initGlobalSearch() {
  const searchInput = document.getElementById('globalSearchInput');
  const mainSearchInput = document.getElementById('searchInput');
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      if (mainSearchInput) {
        mainSearchInput.value = term;
        filterProducts();
      }
    });
  }
}

// Обновляем инициализацию при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем товары с сервера
    loadProducts();
    
    // Остальная инициализация...
    if (typeof renderUserProductsList === 'function') {
        renderUserProductsList();
    }
    if (typeof loadKeywordsForProductSelect === 'function') {
        loadKeywordsForProductSelect();
    }
    if (typeof setupImageUpload === 'function') {
        setupImageUpload();
    }
    
  setTimeout(updateUserProductsCount, 100);
  initGlobalSearch();
});

// Фикс изображений на мобильных — cover (полное заполнение)
(function fixMobileImages() {
  function applyImageFix() {
    const productImages = document.querySelectorAll('.card-image img');
    productImages.forEach(img => {
      img.style.position = 'absolute';
      img.style.top = '50%';
      img.style.left = '50%';
      img.style.transform = 'translate(-50%, -50%)';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.objectPosition = 'center';
    });
    
    const detailImages = document.querySelectorAll('.product-detail-image');
    detailImages.forEach(img => {
      img.style.width = '100%';
      img.style.aspectRatio = '4/3';
      img.style.objectFit = 'cover';
      img.style.objectPosition = 'center';
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyImageFix);
  } else {
    applyImageFix();
  }
  
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyImageFix, 150);
  });
  
  const observer = new MutationObserver(function() {
    applyImageFix();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();

// Экспортируем функции
window.openKeywordPageByBlock = openKeywordPageByBlock;
window.openKeywordPage = openKeywordPage;
window.goBack = goBack;
window.searchByGame = searchByGame;
window.scrollGames = scrollGames;
window.openProductDetailById = openProductDetailById;
window.openProductDetail = openProductDetail;
window.closeDetail = closeDetail;
window.createNewProduct = createNewProduct;
window.openModal = openModal;
window.closeModal = closeModal;
window.filterProducts = filterProducts;