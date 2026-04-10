// ========== ЗАГРУЗКА АВАТАРА И ФОНА ИЗ ГАЛЕРЕИ ==========

(function() {
  // Функция для загрузки изображения из файла
  function uploadImageFromFile(file, type) {
    if (!file) return;
    
    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      showToast('Пожалуйста, выберите изображение', 'error');
      return;
    }
    
    // Проверка размера (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Изображение не должно превышать 5MB', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const imageUrl = e.target.result;
      
      if (type === 'avatar') {
        // Сохраняем аватар
        const avatarCircle = document.getElementById('profileAvatarCircle');
        if (avatarCircle) {
          avatarCircle.style.backgroundImage = `url(${imageUrl})`;
          avatarCircle.style.backgroundSize = 'cover';
          avatarCircle.style.backgroundPosition = 'center';
          avatarCircle.style.backgroundRepeat = 'no-repeat';
          avatarCircle.classList.add('has-bg');
          // Скрываем текст внутри
          const span = avatarCircle.querySelector('span');
          if (span) span.style.display = 'none';
          // Сохраняем в localStorage как base64
          localStorage.setItem('profileAvatarImage', imageUrl);
          localStorage.removeItem('profileAvatarBg'); // убираем градиентный фон
        }
      } else if (type === 'hero') {
        // Сохраняем фон hero секции
        const heroSection = document.getElementById('profileHeroSection');
        if (heroSection) {
          heroSection.style.backgroundImage = `url(${imageUrl})`;
          heroSection.style.backgroundSize = 'cover';
          heroSection.style.backgroundPosition = 'center';
          heroSection.style.backgroundRepeat = 'no-repeat';
          // Сохраняем в localStorage
          localStorage.setItem('profileHeroImage', imageUrl);
          localStorage.removeItem('profileHeroBg');
        }
      }
      
      showToast(`${type === 'avatar' ? 'Аватар' : 'Фон'} успешно обновлен!`, 'success');
    };
    
    reader.onerror = function() {
      showToast('Ошибка при загрузке изображения', 'error');
    };
    
    reader.readAsDataURL(file);
  }
  
  // Функция для создания модального окна выбора файла
  function createFilePickerModal(type, title) {
    let modal = document.getElementById(`${type}FilePickerModal`);
    if (modal) {
      modal.classList.add('active');
      return;
    }
    
    modal = document.createElement('div');
    modal.id = `${type}FilePickerModal`;
    modal.className = 'profile-modal';
    modal.innerHTML = `
      <div class="profile-modal-card" style="max-width: 350px;">
        <h4>${title}</h4>
        <div style="margin: 20px 0;">
          <div class="file-upload-area" style="
            border: 2px dashed #3b82f6;
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
          ">
            <i class="fas fa-cloud-upload-alt" style="font-size: 48px; color: #3b82f6; margin-bottom: 12px; display: block;"></i>
            <p style="color: #8f8f9e;">Нажмите или перетащите изображение</p>
            <p style="font-size: 0.7rem; color: #5f5f6b; margin-top: 8px;">JPG, PNG, GIF, WEBP до 5MB</p>
            <input type="file" id="${type}FileInput" accept="image/jpeg,image/png,image/gif,image/webp" style="display: none;">
          </div>
        </div>
        <div class="modal-actions">
          <button class="modal-btn" id="close${type}PickerModal">Отмена</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    const uploadArea = modal.querySelector('.file-upload-area');
    const fileInput = modal.querySelector(`#${type}FileInput`);
    
    // Клик по области для выбора файла
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // Обработка drag & drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#22c55e';
      uploadArea.style.background = 'rgba(34, 197, 94, 0.1)';
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#3b82f6';
      uploadArea.style.background = 'transparent';
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#3b82f6';
      uploadArea.style.background = 'transparent';
      const file = e.dataTransfer.files[0];
      if (file) {
        uploadImageFromFile(file, type);
        modal.classList.remove('active');
      }
    });
    
    // Выбор файла через input
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        uploadImageFromFile(file, type);
        modal.classList.remove('active');
      }
    });
    
    modal.querySelector(`#close${type}PickerModal`).addEventListener('click', () => {
      modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
    
    modal.classList.add('active');
  }
  
  // Модифицируем функцию setupAvatarChangeButton для добавления загрузки из файла
  const originalSetupAvatarChangeButton = window.setupAvatarChangeButton;
  
  function enhancedSetupAvatarChangeButton() {
    const avatarWrapper = document.querySelector('.avatar-wrapper');
    if (!avatarWrapper) return;
    
    if (!avatarWrapper.querySelector('.change-avatar-btn')) {
      const changeBtn = document.createElement('div');
      changeBtn.className = 'change-avatar-btn';
      changeBtn.innerHTML = '<i class="fas fa-camera"></i>';
      changeBtn.title = 'Сменить аватар';
      avatarWrapper.appendChild(changeBtn);
      
      // Создаем меню выбора
      changeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showAvatarOptions();
      });
    }
  }
  
  function showAvatarOptions() {
    let modal = document.getElementById('avatarOptionsModal');
    if (modal) {
      modal.classList.add('active');
      return;
    }
    
    modal = document.createElement('div');
    modal.id = 'avatarOptionsModal';
    modal.className = 'profile-modal';
    modal.innerHTML = `
      <div class="profile-modal-card" style="max-width: 320px;">
        <h4>Выберите аватар</h4>
        <div style="display: flex; flex-direction: column; gap: 12px; margin: 20px 0;">
          <button class="modal-btn" id="uploadAvatarBtn" style="background: #3b82f6;">
            <i class="fas fa-image"></i> Загрузить из галереи
          </button>
          <button class="modal-btn" id="gradientAvatarBtn" style="background: linear-gradient(135deg, #667eea, #764ba2);">
            <i class="fas fa-palette"></i> Выбрать градиент
          </button>
          <button class="modal-btn danger" id="resetAvatarBtn" style="background: #3a3c4a;">
            <i class="fas fa-trash"></i> Сбросить аватар
          </button>
        </div>
        <div class="modal-actions">
          <button class="modal-btn" id="closeAvatarOptionsModal">Закрыть</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    modal.querySelector('#uploadAvatarBtn').addEventListener('click', () => {
      modal.classList.remove('active');
      createFilePickerModal('avatar', 'Загрузить аватар');
    });
    
    modal.querySelector('#gradientAvatarBtn').addEventListener('click', () => {
      modal.classList.remove('active');
      openAvatarBgModal();
    });
    
    modal.querySelector('#resetAvatarBtn').addEventListener('click', () => {
      const avatarCircle = document.getElementById('profileAvatarCircle');
      if (avatarCircle) {
        avatarCircle.style.backgroundImage = '';
        avatarCircle.style.background = '';
        avatarCircle.classList.remove('has-bg');
        const span = avatarCircle.querySelector('span');
        if (span) span.style.display = 'flex';
        localStorage.removeItem('profileAvatarImage');
        localStorage.removeItem('profileAvatarBg');
      }
      modal.classList.remove('active');
      showToast('Аватар сброшен', 'success');
    });
    
    modal.querySelector('#closeAvatarOptionsModal').addEventListener('click', () => {
      modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
    
    modal.classList.add('active');
  }
  
  function showHeroOptions() {
    let modal = document.getElementById('heroOptionsModal');
    if (modal) {
      modal.classList.add('active');
      return;
    }
    
    modal = document.createElement('div');
    modal.id = 'heroOptionsModal';
    modal.className = 'profile-modal';
    modal.innerHTML = `
      <div class="profile-modal-card" style="max-width: 320px;">
        <h4>Выберите фон</h4>
        <div style="display: flex; flex-direction: column; gap: 12px; margin: 20px 0;">
          <button class="modal-btn" id="uploadHeroBtn" style="background: #3b82f6;">
            <i class="fas fa-image"></i> Загрузить из галереи
          </button>
          <button class="modal-btn" id="gradientHeroBtn" style="background: linear-gradient(135deg, #667eea, #764ba2);">
            <i class="fas fa-palette"></i> Выбрать градиент
          </button>
          <button class="modal-btn danger" id="resetHeroBtn" style="background: #3a3c4a;">
            <i class="fas fa-trash"></i> Сбросить фон
          </button>
        </div>
        <div class="modal-actions">
          <button class="modal-btn" id="closeHeroOptionsModal">Закрыть</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    modal.querySelector('#uploadHeroBtn').addEventListener('click', () => {
      modal.classList.remove('active');
      createFilePickerModal('hero', 'Загрузить фон');
    });
    
    modal.querySelector('#gradientHeroBtn').addEventListener('click', () => {
      modal.classList.remove('active');
      openHeroBgModal();
    });
    
    modal.querySelector('#resetHeroBtn').addEventListener('click', () => {
      const heroSection = document.getElementById('profileHeroSection');
      if (heroSection) {
        heroSection.style.backgroundImage = '';
        heroSection.style.background = 'linear-gradient(135deg, #11131f, #0a0c16)';
        localStorage.removeItem('profileHeroImage');
        localStorage.removeItem('profileHeroBg');
      }
      modal.classList.remove('active');
      showToast('Фон сброшен', 'success');
    });
    
    modal.querySelector('#closeHeroOptionsModal').addEventListener('click', () => {
      modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
    
    modal.classList.add('active');
  }
  
  // Переопределяем setupHeroBgButton
  function enhancedSetupHeroBgButton() {
    const changeBtn = document.getElementById('changeHeroBgBtn');
    if (!changeBtn) return;
    
    const newBtn = changeBtn.cloneNode(true);
    changeBtn.parentNode.replaceChild(newBtn, changeBtn);
    
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showHeroOptions();
    });
  }
  
  // Загрузка сохраненных изображений
  function loadSavedImages() {
    const savedAvatar = localStorage.getItem('profileAvatarImage');
    if (savedAvatar) {
      const avatarCircle = document.getElementById('profileAvatarCircle');
      if (avatarCircle) {
        avatarCircle.style.backgroundImage = `url(${savedAvatar})`;
        avatarCircle.style.backgroundSize = 'cover';
        avatarCircle.style.backgroundPosition = 'center';
        avatarCircle.classList.add('has-bg');
        const span = avatarCircle.querySelector('span');
        if (span) span.style.display = 'none';
      }
    }
    
    const savedHero = localStorage.getItem('profileHeroImage');
    if (savedHero) {
      const heroSection = document.getElementById('profileHeroSection');
      if (heroSection) {
        heroSection.style.backgroundImage = `url(${savedHero})`;
        heroSection.style.backgroundSize = 'cover';
        heroSection.style.backgroundPosition = 'center';
      }
    }
  }
  
  // Toast уведомление
  function showToast(message, type = 'success') {
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }
    
    toast.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
      <span>${message}</span>
    `;
    toast.className = `toast-notification ${type} show`;
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
  
  // Экспорт функций
  window.setupAvatarChangeButton = enhancedSetupAvatarChangeButton;
  window.setupHeroBgButton = enhancedSetupHeroBgButton;
  window.loadSavedImages = loadSavedImages;
  window.showToast = showToast;
  window.openAvatarBgModal = openAvatarBgModal;
  window.openHeroBgModal = openHeroBgModal;
  
  // Загружаем сохраненные изображения при инициализации
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSavedImages);
  } else {
    loadSavedImages();
  }
})();