// ========== УПРАВЛЕНИЕ ТОВАРАМИ ==========

let productImageFile = null;

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
    let toast = document.getElementById('customToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'customToast';
        toast.className = 'toast-notification';
        toast.innerHTML = '<i class="fas"></i><span id="toastMessage"></span>';
        document.body.appendChild(toast);
    }
    
    const icon = toast.querySelector('i');
    const msgSpan = document.getElementById('toastMessage');
    
    if (type === 'success') {
        icon.className = 'fas fa-check-circle';
        icon.style.color = '#22c55e';
    } else {
        icon.className = 'fas fa-exclamation-triangle';
        icon.style.color = '#ef4444';
    }
    
    msgSpan.innerText = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showCreateProductForm() {
    const form = document.getElementById('createProductForm');
    if (form) {
        const isVisible = form.style.display === 'block';
        form.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            form.scrollIntoView({ behavior: 'smooth' });
            loadKeywordsForProductSelect();
            setupImageUpload();
        }
    }
}

async function loadKeywordsForProductSelect() {
    const select = document.getElementById('productKeywordSelect');
    if (!select) return;
    
    try {
        const keywords = await API.getKeywords();
        select.innerHTML = '<option value="">Выберите сервис или ключевое слово</option>';
        keywords.forEach(kw => {
            select.innerHTML += `<option value="${escapeHtml(kw.id)}">${escapeHtml(kw.name)} - ${escapeHtml(kw.type || 'Стандарт')}</option>`;
        });
    } catch(e) {
        console.error('Ошибка загрузки ключевых слов:', e);
    }
}

function setupImageUpload() {
    const uploadArea = document.getElementById('imageUploadArea');
    const fileInput = document.getElementById('productImageInput');
    
    if (!uploadArea || !fileInput) return;
    
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#3b82f6';
        uploadArea.style.background = 'rgba(59, 130, 246, 0.05)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#2a2a2a';
        uploadArea.style.background = '#0a0a0a';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#2a2a2a';
        uploadArea.style.background = '#0a0a0a';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageFile(file);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageFile(e.target.files[0]);
        }
    });
}

function handleImageFile(file) {
    if (file.size > 5 * 1024 * 1024) {
        showToast('Изображение не должно превышать 5МБ', 'error');
        return;
    }
    
    productImageFile = file;
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewGrid = document.getElementById('imagePreviewGrid');
        previewGrid.innerHTML = `
            <div class="image-preview-item">
                <img src="${e.target.result}" alt="preview">
                <div class="remove-image" onclick="removeProductImage()"><i class="fas fa-times"></i></div>
            </div>
        `;
        document.getElementById('productImageUrl').value = e.target.result;
    };
    reader.readAsDataURL(file);
}

function removeProductImage() {
    productImageFile = null;
    document.getElementById('imagePreviewGrid').innerHTML = '';
    document.getElementById('productImageUrl').value = '';
}

function cancelCreateProduct() {
    document.getElementById('createProductForm').style.display = 'none';
    document.getElementById('productCategory').value = '';
    document.getElementById('productKeywordSelect').value = '';
    document.getElementById('productTitle').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productDiscount').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productInstructions').value = '';
    document.getElementById('productContact').value = '';
    document.getElementById('productTitleCounter').innerText = '0/100';
    document.getElementById('productDescCounter').innerText = '0/1000';
    document.querySelector('input[name="productType"][value="monthly"]').checked = true;
    removeProductImage();
}

async function createNewProduct() {
    console.log('🔵 Создание товара...');
    
    const category = document.getElementById('productCategory')?.value;
    const keywordId = document.getElementById('productKeywordSelect')?.value;
    const title = document.getElementById('productTitle')?.value.trim();
    const price = document.getElementById('productPrice')?.value.trim();
    const discount = document.getElementById('productDiscount')?.value.trim();
    const description = document.getElementById('productDescription')?.value.trim();
    const instructions = document.getElementById('productInstructions')?.value.trim();
    const contact = document.getElementById('productContact')?.value.trim();
    const productType = document.querySelector('input[name="productType"]:checked')?.value || 'monthly';
    const imageUrl = document.getElementById('productImageUrl')?.value;
    
    // Валидация
    if (!category) { showToast('Выберите категорию товара', 'error'); return; }
    if (!keywordId) { showToast('Выберите сервис или ключевое слово', 'error'); return; }
    if (!title) { showToast('Введите название товара', 'error'); return; }
    if (title.length < 3) { showToast('Название должно быть не менее 3 символов', 'error'); return; }
    if (!price) { showToast('Введите цену товара', 'error'); return; }
    if (!description) { showToast('Введите описание товара', 'error'); return; }
    
    // Получаем имя ключевого слова
    let keywordName = '';
    try {
        const keywords = await API.getKeywords();
        const selected = keywords.find(k => k.id === keywordId);
        if (selected) keywordName = selected.name;
    } catch(e) { console.error(e); }
    
    // Формируем полное описание
    let fullDescription = description;
    if (instructions) fullDescription += '\n\n📖 Инструкция по активации:\n' + instructions;
    fullDescription += '\n\nМоментальная выдача. Гарантия качества.';
    
    // Обработка скидки
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
    
    const productData = {
        title,
        price: finalPrice,
        seller: currentUser,
        keyword: keywordName,
        image_url: imageUrl || 'https://picsum.photos/id/42/400/200',
        description: fullDescription,
        discount: discountText,
        original_price: originalPrice,
        contact: contact || '',
        type: productType
    };
    
    try {
        const result = await API.createPendingProduct(productData);
        showToast('✅ Товар отправлен на модерацию!', 'success');
        cancelCreateProduct();
        await renderUserProductsList();
    } catch(error) {
        showToast('❌ Ошибка: ' + error.message, 'error');
    }
}

async function renderUserProductsList() {
    const container = document.getElementById('userProductsList');
    if (!container) return;
    
    const currentUser = localStorage.getItem('apex_user') || 'Гость';
    try {
        const allProducts = await API.getProducts();
        const userProducts = allProducts.filter(p => p.seller === currentUser);
        
        const totalSpan = document.getElementById('userProductsTotalCount');
        if (totalSpan) totalSpan.innerText = `Всего: ${userProducts.length}`;
        
        if (userProducts.length === 0) {
            container.innerHTML = `
                <div class="empty-products-state">
                    <i class="fas fa-box-open"></i>
                    <p>У вас пока нет товаров</p>
                    <p style="font-size: 0.8rem; margin-top: 8px;">Нажмите "Добавить товар", чтобы выставить подписку или цифровой товар на продажу</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = userProducts.map(product => `
            <div class="product-item-card">
                <img class="product-item-img" src="${escapeHtml(product.image_url || 'https://picsum.photos/id/42/60/60')}" alt="${escapeHtml(product.title)}" onclick="window.openProductDetailById('${product.id}')" style="cursor: pointer;">
                <div class="product-item-info" onclick="window.openProductDetailById('${product.id}')" style="cursor: pointer;">
                    <div class="product-item-title">${escapeHtml(product.title)}</div>
                    <div class="product-item-price">${escapeHtml(product.price)}</div>
                    <div class="product-item-keyword">${escapeHtml(product.keyword || 'Без категории')}</div>
                </div>
                <div class="product-item-actions">
                    <button class="delete-product-btn" onclick="deleteUserProduct('${product.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
        
    } catch(e) {
        console.error(e);
        container.innerHTML = '<div class="empty-products-state">Ошибка загрузки товаров</div>';
    }
}

async function deleteUserProduct(productId) {
    if (!confirm('Удалить этот товар?')) return;
    try {
        await API.deleteProduct(productId);
        showToast('✅ Товар удалён', 'success');
        await renderUserProductsList();
        if (typeof window.loadProducts === 'function') await window.loadProducts();
    } catch(e) {
        showToast('❌ Ошибка: ' + e.message, 'error');
    }
}

// Экспорт
window.showCreateProductForm = showCreateProductForm;
window.cancelCreateProduct = cancelCreateProduct;
window.createNewProduct = createNewProduct;
window.deleteUserProduct = deleteUserProduct;
window.renderUserProductsList = renderUserProductsList;
window.removeProductImage = removeProductImage;

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    console.log('products-manage.js загружен');
    renderUserProductsList();
    loadKeywordsForProductSelect();
    setupImageUpload();
    
    // Счётчики
    const titleInput = document.getElementById('productTitle');
    const descInput = document.getElementById('productDescription');
    
    if (titleInput) {
        titleInput.addEventListener('input', function() {
            const len = this.value.length;
            const counter = document.getElementById('productTitleCounter');
            if (counter) counter.innerText = `${len}/100`;
            if (len > 100) this.value = this.value.slice(0, 100);
        });
    }
    
    if (descInput) {
        descInput.addEventListener('input', function() {
            const len = this.value.length;
            const counter = document.getElementById('productDescCounter');
            if (counter) counter.innerText = `${len}/1000`;
            if (len > 1000) this.value = this.value.slice(0, 1000);
        });
    }
});