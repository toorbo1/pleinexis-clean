// ========== СТРАНИЦА СОЗДАНИЯ ЗАДАНИЙ ==========

// Хранилище прикреплённых файлов
let attachedFiles = [];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  initCreateTaskPage();
});

function initCreateTaskPage() {
  // Инициализация счётчика символов
  const taskTitle = document.getElementById('taskTitle');
  const titleCounter = document.getElementById('titleCounter');
  
  if (taskTitle) {
    taskTitle.addEventListener('input', function() {
      const len = this.value.length;
      if (titleCounter) {
        titleCounter.textContent = `${len}/100`;
      }
      if (len > 100) {
        this.value = this.value.slice(0, 100);
        if (titleCounter) titleCounter.textContent = `100/100`;
      }
    });
  }
  
  // Инициализация загрузки файлов
  initFileUpload();
  
  // Восстановление сохранённых данных формы (если есть)
  loadDraftData();
  
  // Автосохранение черновика каждые 30 секунд
  setInterval(saveDraftData, 30000);
}

// Инициализация загрузки файлов
function initFileUpload() {
  const fileInput = document.getElementById('fileInput');
  const fileUploadArea = document.getElementById('fileUploadArea');
  
  if (!fileInput || !fileUploadArea) return;
  
  // Клик по области загрузки
  fileUploadArea.addEventListener('click', () => fileInput.click());
  
  // Drag & drop
  fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.style.borderColor = '#3b82f6';
    fileUploadArea.style.background = 'rgba(59, 130, 246, 0.05)';
  });
  
  fileUploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    fileUploadArea.style.borderColor = '#2a2a2a';
    fileUploadArea.style.background = '#0a0a0a';
  });
  
  fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.style.borderColor = '#2a2a2a';
    fileUploadArea.style.background = '#0a0a0a';
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  });
  
  fileInput.addEventListener('change', (e) => {
    addFiles(Array.from(e.target.files));
    fileInput.value = '';
  });
}

// Добавление файлов
function addFiles(files) {
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) {
      showToast(`Файл "${file.name}" превышает 10МБ`, 'error');
      continue;
    }
    
    // Проверяем дубликаты
    if (attachedFiles.some(f => f.name === file.name && f.size === file.size)) {
      showToast(`Файл "${file.name}" уже добавлен`, 'error');
      continue;
    }
    
    attachedFiles.push(file);
  }
  renderAttachments();
  saveDraftData();
}

// Удаление прикреплённого файла
function removeAttachment(index) {
  attachedFiles.splice(index, 1);
  renderAttachments();
  saveDraftData();
}

// Отображение прикреплённых файлов
function renderAttachments() {
  const attachmentsList = document.getElementById('attachmentsList');
  const previewGrid = document.getElementById('filePreviewGrid');
  
  if (!attachmentsList) return;
  
  if (attachedFiles.length === 0) {
    attachmentsList.innerHTML = '';
    if (previewGrid) previewGrid.innerHTML = '';
    return;
  }
  
  // Разделяем изображения и остальные файлы
  const imageFiles = attachedFiles.filter(f => f.type.startsWith('image/'));
  const otherFiles = attachedFiles.filter(f => !f.type.startsWith('image/'));
  
  // Превью изображений
  if (previewGrid) {
    previewGrid.innerHTML = imageFiles.map((file, idx) => {
      const url = URL.createObjectURL(file);
      const html = `
        <div class="file-preview-item">
          <img src="${url}" alt="${escapeHtml(file.name)}">
          <div class="remove-file" onclick="removeAttachment(${attachedFiles.indexOf(file)})">
            <i class="fas fa-times"></i>
          </div>
        </div>
      `;
      URL.revokeObjectURL(url);
      return html;
    }).join('');
  }
  
  // Список остальных файлов
  attachmentsList.innerHTML = otherFiles.map((file, idx) => {
    let icon = getFileIcon(file.type);
    return `
      <div class="attachment-item">
        <i class="${icon}"></i>
        <span class="attachment-name">${escapeHtml(file.name)}</span>
        <span class="attachment-size">${formatFileSize(file.size)}</span>
        <button class="remove-attachment" onclick="removeAttachment(${attachedFiles.indexOf(file)})">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;
  }).join('');
}

// Получение иконки для типа файла
function getFileIcon(fileType) {
  if (fileType.includes('pdf')) return 'fas fa-file-pdf';
  if (fileType.includes('word') || fileType.includes('document')) return 'fas fa-file-word';
  if (fileType.includes('text')) return 'fas fa-file-alt';
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) return 'fas fa-file-archive';
  return 'fas fa-file';
}

// Форматирование размера файла
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
  return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
}

// Экранирование HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Показать уведомление
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  const icon = toast.querySelector('i');
  const msgSpan = document.getElementById('toastMessage');
  
  toast.classList.remove('success', 'error');
  
  if (type === 'success') {
    if (icon) {
      icon.className = 'fas fa-check-circle';
      icon.style.color = '#22c55e';
    }
    toast.classList.add('success');
  } else {
    if (icon) {
      icon.className = 'fas fa-exclamation-triangle';
      icon.style.color = '#ef4444';
    }
    toast.classList.add('error');
  }
  
  if (msgSpan) msgSpan.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Сброс формы
function resetForm() {
  document.getElementById('taskTitle').value = '';
  document.getElementById('taskCategory').value = '';
  document.getElementById('taskBudget').value = '';
  document.getElementById('taskDeadline').value = '1_week';
  document.getElementById('taskDescription').value = '';
  document.getElementById('taskContact').value = '';
  document.getElementById('taskDifficulty').value = 'medium';
  
  const fixedRadio = document.querySelector('input[name="paymentType"][value="fixed"]');
  if (fixedRadio) fixedRadio.checked = true;
  
  attachedFiles = [];
  renderAttachments();
  
  const titleCounter = document.getElementById('titleCounter');
  if (titleCounter) titleCounter.textContent = '0/100';
  
  // Очищаем черновик
  localStorage.removeItem('task_draft');
  
  showToast('Форма очищена', 'success');
}

// Сохранение черновика
function saveDraftData() {
  const draft = {
    title: document.getElementById('taskTitle')?.value || '',
    category: document.getElementById('taskCategory')?.value || '',
    budget: document.getElementById('taskBudget')?.value || '',
    deadline: document.getElementById('taskDeadline')?.value || '1_week',
    description: document.getElementById('taskDescription')?.value || '',
    contact: document.getElementById('taskContact')?.value || '',
    difficulty: document.getElementById('taskDifficulty')?.value || 'medium',
    paymentType: document.querySelector('input[name="paymentType"]:checked')?.value || 'fixed',
    files: attachedFiles.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type
    }))
  };
  
  localStorage.setItem('task_draft', JSON.stringify(draft));
}

// Загрузка черновика
function loadDraftData() {
  const draftJson = localStorage.getItem('task_draft');
  if (!draftJson) return;
  
  try {
    const draft = JSON.parse(draftJson);
    
    if (draft.title) document.getElementById('taskTitle').value = draft.title;
    if (draft.category) document.getElementById('taskCategory').value = draft.category;
    if (draft.budget) document.getElementById('taskBudget').value = draft.budget;
    if (draft.deadline) document.getElementById('taskDeadline').value = draft.deadline;
    if (draft.description) document.getElementById('taskDescription').value = draft.description;
    if (draft.contact) document.getElementById('taskContact').value = draft.contact;
    if (draft.difficulty) document.getElementById('taskDifficulty').value = draft.difficulty;
    
    const paymentRadio = document.querySelector(`input[name="paymentType"][value="${draft.paymentType}"]`);
    if (paymentRadio) paymentRadio.checked = true;
    
    // Обновляем счётчик
    const titleCounter = document.getElementById('titleCounter');
    if (titleCounter && draft.title) {
      titleCounter.textContent = `${draft.title.length}/100`;
    }
    
    if (draft.files && draft.files.length > 0) {
      showToast('Загружен черновик с прикреплёнными файлами', 'success');
    }
  } catch (e) {
    console.error('Ошибка загрузки черновика:', e);
  }
}

// Создание задания
function createTask() {
  // Валидация
  const title = document.getElementById('taskTitle')?.value.trim();
  const category = document.getElementById('taskCategory')?.value;
  const budget = document.getElementById('taskBudget')?.value.trim();
  const description = document.getElementById('taskDescription')?.value.trim();
  
  if (!title) {
    showToast('Введите название задания', 'error');
    document.getElementById('taskTitle')?.focus();
    return;
  }
  
  if (!category) {
    showToast('Выберите категорию', 'error');
    return;
  }
  
  if (!budget) {
    showToast('Укажите бюджет', 'error');
    document.getElementById('taskBudget')?.focus();
    return;
  }
  
  if (parseFloat(budget) <= 0) {
    showToast('Бюджет должен быть больше 0', 'error');
    return;
  }
  
  if (!description) {
    showToast('Введите описание задания', 'error');
    document.getElementById('taskDescription')?.focus();
    return;
  }
  
  if (description.length < 20) {
    showToast('Описание должно быть не менее 20 символов', 'error');
    return;
  }
  
  // Собираем данные задания
  const paymentType = document.querySelector('input[name="paymentType"]:checked')?.value || 'fixed';
  const deadline = document.getElementById('taskDeadline')?.value;
  const difficulty = document.getElementById('taskDifficulty')?.value;
  const contact = document.getElementById('taskContact')?.value.trim();
  
  // Получаем текущего пользователя
  let currentUser = localStorage.getItem('apex_user') || 'Гость';
  let userId = localStorage.getItem('apex_user_id');
  
  if (!userId) {
    userId = 'user_' + Date.now();
    localStorage.setItem('apex_user_id', userId);
  }
  
  // Категории для отображения
  const categoryLabels = {
    'design': 'Дизайн и графика',
    'development': 'Разработка',
    'writing': 'Копирайтинг',
    'marketing': 'Маркетинг и SMM',
    'video': 'Видеомонтаж',
    'audio': 'Аудио и озвучка',
    'other': 'Другое'
  };
  
  const deadlineLabels = {
    '1_day': '1 день',
    '3_days': '3 дня',
    '1_week': '1 неделя',
    '2_weeks': '2 недели',
    '1_month': '1 месяц',
    'flexible': 'Гибкий срок'
  };
  
  const difficultyLabels = {
    'easy': 'Низкий',
    'medium': 'Средний',
    'hard': 'Высокий'
  };
  
  const taskData = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    title: title,
    category: category,
    categoryLabel: categoryLabels[category] || category,
    budget: parseFloat(budget),
    paymentType: paymentType,
    paymentTypeLabel: paymentType === 'fixed' ? 'Фиксированная' : (paymentType === 'hourly' ? 'Почасовая' : 'Договорная'),
    deadline: deadline,
    deadlineLabel: deadlineLabels[deadline] || deadline,
    description: description,
    difficulty: difficulty,
    difficultyLabel: difficultyLabels[difficulty] || difficulty,
    contact: contact || '',
    attachments: attachedFiles.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type
    })),
    author: currentUser,
    authorId: userId,
    createdAt: new Date().toISOString(),
    status: 'active',
    responses: 0,
    views: 0
  };
  
  // Сохраняем в localStorage
  let tasks = JSON.parse(localStorage.getItem('apex_tasks') || '[]');
  tasks.unshift(taskData);
  localStorage.setItem('apex_tasks', JSON.stringify(tasks));
  
  // Очищаем черновик
  localStorage.removeItem('task_draft');
  
  // Показываем успех
  showToast('✅ Задание успешно опубликовано!', 'success');
  
  // Сбрасываем форму
  resetForm();
  
  // Через 1.5 секунды перенаправляем
  setTimeout(() => {
    if (confirm('Задание опубликовано! Перейти на страницу всех заданий?')) {
      window.location.href = 'tasks.html';
    } else {
      goBack();
    }
  }, 1500);
}

// Возврат на предыдущую страницу
function goBack() {
  if (document.referrer && document.referrer.includes(window.location.host)) {
    window.history.back();
  } else {
    window.location.href = 'index.html';
  }
}

// Экспорт функций в глобальную область
window.removeAttachment = removeAttachment;
window.resetForm = resetForm;
window.createTask = createTask;
window.goBack = goBack;