// ========== ПОДКЛЮЧЕНИЕ ВИТРИНЫ — ПОЛНЫЙ РАБОЧИЙ КОД ==========

let shopDocuments = [];

function initShopConnectPage() {
  console.log('🔄 Инициализация страницы подключения витрины');
  
  const user = localStorage.getItem('apex_user') || 'Гость';
  
  // Предзаполняем название
  const shopNameInput = document.getElementById('shopName');
  if (shopNameInput) {
    shopNameInput.value = `Магазин ${user}`;
  }
  
  // Проверяем статус существующей заявки
  const application = JSON.parse(localStorage.getItem(`shop_application_${user}`) || 'null');
  if (application) {
    showApplicationStatus(application);
  }
  
  // Настройка загрузки документов
  setupDocumentsUpload();
  
  // Сбрасываем массив документов
  shopDocuments = [];
  renderDocumentsPreview();
}

function setupDocumentsUpload() {
  const uploadArea = document.getElementById('documentsUploadArea');
  const fileInput = document.getElementById('documentsInput');
  
  console.log('📎 Настройка загрузки документов');
  console.log('uploadArea:', uploadArea);
  console.log('fileInput:', fileInput);
  
  if (!uploadArea || !fileInput) {
    console.error('❌ Элементы загрузки не найдены!');
    return;
  }
  
  // Клик по области
  uploadArea.addEventListener('click', function(e) {
    console.log('🖱️ Клик по области загрузки');
    fileInput.click();
  });
  
  // Drag & Drop
  uploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    uploadArea.style.borderColor = '#3b82f6';
    uploadArea.style.background = 'rgba(59, 130, 246, 0.1)';
  });
  
  uploadArea.addEventListener('dragleave', function(e) {
    e.preventDefault();
    uploadArea.style.borderColor = 'rgba(59, 130, 246, 0.3)';
    uploadArea.style.background = 'rgba(0, 0, 0, 0.2)';
  });
  
  uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    uploadArea.style.borderColor = 'rgba(59, 130, 246, 0.3)';
    uploadArea.style.background = 'rgba(0, 0, 0, 0.2)';
    
    const files = Array.from(e.dataTransfer.files);
    console.log('📁 Файлы через drop:', files.length);
    addDocuments(files);
  });
  
  // Выбор файлов через input
  fileInput.addEventListener('change', function(e) {
    console.log('📁 Файлы через input:', e.target.files.length);
    addDocuments(Array.from(e.target.files));
    fileInput.value = ''; // Очищаем чтобы можно было выбрать тот же файл повторно
  });
  
  console.log('✅ Загрузка документов настроена');
}

function addDocuments(files) {
  console.log('➕ Добавление документов:', files.length);
  
  for (const file of files) {
    // Проверка размера
    if (file.size > 10 * 1024 * 1024) {
      showToast(`Файл "${file.name}" превышает 10 МБ`, 'error');
      continue;
    }
    
    // Проверка дубликатов
    if (shopDocuments.some(doc => doc.name === file.name && doc.size === file.size)) {
      showToast(`Файл "${file.name}" уже добавлен`, 'error');
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
      console.log('✅ Документ добавлен:', file.name);
      renderDocumentsPreview();
    };
    reader.readAsDataURL(file);
  }
}

function renderDocumentsPreview() {
  const container = document.getElementById('documentsPreview');
  if (!container) {
    console.error('❌ Контейнер documentsPreview не найден');
    return;
  }
  
  console.log('🖼️ Рендер превью, документов:', shopDocuments.length);
  
  if (shopDocuments.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = shopDocuments.map((doc, index) => `
    <div class="document-preview-item">
      ${doc.type.startsWith('image/') ? 
        `<img src="${doc.data}" alt="${escapeHtml(doc.name)}" style="width: 100%; height: 100%; object-fit: cover;">` : 
        `<div class="file-icon">
          <i class="fas fa-file-pdf"></i>
          <span>${escapeHtml(doc.name.substring(0, 15))}</span>
        </div>`
      }
      <div class="remove-document" onclick="removeDocument(${index})">
        <i class="fas fa-times"></i>
      </div>
    </div>
  `).join('');
}

function removeDocument(index) {
  console.log('🗑️ Удаление документа, индекс:', index);
  shopDocuments.splice(index, 1);
  renderDocumentsPreview();
}

function submitShopApplication() {
  console.log('📤 Отправка заявки...');
  
  const shopName = document.getElementById('shopName')?.value.trim();
  const shopType = document.getElementById('shopType')?.value;
  const shopPhone = document.getElementById('shopPhone')?.value.trim();
  const shopEmail = document.getElementById('shopEmail')?.value.trim();
  const shopDescription = document.getElementById('shopDescription')?.value.trim();
  const agreement = document.getElementById('shopAgreement')?.checked;
  
  // Валидация
  if (!shopName) {
    showToast('Введите название магазина', 'error');
    return;
  }
  
  if (!shopType) {
    showToast('Выберите тип деятельности', 'error');
    return;
  }
  
  if (!shopPhone) {
    showToast('Введите контактный телефон', 'error');
    return;
  }
  
  if (shopDocuments.length === 0) {
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
  
  console.log('✅ Заявка сохранена:', application);
  
  // Показываем статус
  showApplicationStatus(application);
  
  showToast('✅ Заявка отправлена на проверку!', 'success');
}

function showApplicationStatus(application) {
  const formCard = document.getElementById('shopFormCard');
  const infoCard = document.querySelector('.shop-info-card');
  const statusCard = document.getElementById('shopStatusCard');
  
  if (formCard) formCard.style.display = 'none';
  if (infoCard) infoCard.style.display = 'none';
  if (statusCard) {
    statusCard.style.display = 'block';
    
    const statusIcon = statusCard.querySelector('.status-icon');
    const statusTitle = document.getElementById('statusTitle');
    const statusText = document.getElementById('statusText');
    
    if (statusIcon) {
      statusIcon.className = 'status-icon ' + application.status;
      
      if (application.status === 'pending') {
        statusIcon.innerHTML = '<i class="fas fa-clock"></i>';
      } else if (application.status === 'approved') {
        statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
      } else {
        statusIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
      }
    }
    
    if (statusTitle) {
      if (application.status === 'pending') {
        statusTitle.textContent = 'Заявка на рассмотрении';
      } else if (application.status === 'approved') {
        statusTitle.textContent = 'Витрина подключена!';
      } else {
        statusTitle.textContent = 'Заявка отклонена';
      }
    }
    
    if (statusText) {
      if (application.status === 'pending') {
        statusText.textContent = 'Ваша заявка отправлена и ожидает проверки администратором. Обычно это занимает до 24 часов.';
      } else if (application.status === 'approved') {
        statusText.textContent = 'Поздравляем! Ваша витрина одобрена. Теперь вы можете добавлять товары.';
      } else {
        statusText.textContent = application.rejectReason || 'К сожалению, ваша заявка была отклонена.';
      }
    }
  }
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
  
  const icon = type === 'success' ? 'check-circle' : 'exclamation-triangle';
  toast.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
  toast.classList.add('show', type);
  
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Экспорт
window.initShopConnectPage = initShopConnectPage;
window.removeDocument = removeDocument;
window.submitShopApplication = submitShopApplication;

console.log('✅ shop-connect.js загружен');