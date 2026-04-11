// slider.js - ИДЕАЛЬНО ПЛАВНАЯ КАРУСЕЛЬ НА CSS АНИМАЦИИ

(function() {
  console.log('🚀 Карусель запускается...');
  
  const track = document.getElementById('carouselTrack');
  const container = document.getElementById('carouselContainer');
  
  if (!track || !container) {
    console.error('❌ Элементы не найдены');
    return;
  }
  
  // Получаем оригинальные слайды
  const originalSlides = Array.from(document.querySelectorAll('.carousel-slide'));
  
  if (originalSlides.length === 0) {
    console.error('❌ Слайды не найдены');
    return;
  }
  
  console.log(`✅ Слайдов: ${originalSlides.length}`);
  
  // Клонируем для бесконечности (3 копии)
  track.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    originalSlides.forEach(slide => {
      track.appendChild(slide.cloneNode(true));
    });
  }
  
  const allSlides = Array.from(document.querySelectorAll('.carousel-slide'));
  console.log(`✅ Всего слайдов: ${allSlides.length}`);
  
  // Размеры
  let slideWidth = originalSlides[0].offsetWidth;
  let gap = 16;
  let slideFullWidth = slideWidth + gap;
  let setWidth = originalSlides.length * slideFullWidth;
  
  // Начальная позиция
  let position = setWidth;
  
  // Скорость в пикселях в секунду
  const SPEED_PER_SECOND = 100;
  let lastTimestamp = 0;
  let animationId = null;
  
  // Функция обновления позиции
  function updatePosition() {
    track.style.transform = `translateX(${-position}px)`;
  }
  
  // Функция подсветки центрального слайда
  function highlightCenter() {
    const containerRect = container.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    
    let closestSlide = null;
    let minDistance = Infinity;
    
    allSlides.forEach(slide => {
      const rect = slide.getBoundingClientRect();
      const slideCenterX = rect.left + rect.width / 2;
      const distance = Math.abs(centerX - slideCenterX);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestSlide = slide;
      }
    });
    
    if (closestSlide) {
      allSlides.forEach(s => s.classList.remove('active'));
      closestSlide.classList.add('active');
    }
  }
  
  // Функция проверки бесконечности
  function checkBounds() {
    if (position >= setWidth * 2) {
      position = position - setWidth;
      updatePosition();
    }
  }
  
  // Функция анимации с учётом времени
  function animate(timestamp) {
    if (lastTimestamp === 0) {
      lastTimestamp = timestamp;
      animationId = requestAnimationFrame(animate);
      return;
    }
    
    // Вычисляем, сколько времени прошло
    const deltaTime = timestamp - lastTimestamp;
    
    // Двигаем позицию в зависимости от прошедшего времени
    const deltaPosition = (SPEED_PER_SECOND * deltaTime) / 1000;
    position += deltaPosition;
    
    // Проверяем бесконечность
    checkBounds();
    
    // Обновляем позицию
    updatePosition();
    
    // Подсвечиваем центральный слайд
    highlightCenter();
    
    // Запоминаем время
    lastTimestamp = timestamp;
    
    // Продолжаем анимацию
    animationId = requestAnimationFrame(animate);
  }
  
  // Устанавливаем начальную позицию
  updatePosition();
  
  // Подсвечиваем центральный слайд
  setTimeout(highlightCenter, 50);
  
  // Запускаем анимацию
  animationId = requestAnimationFrame(animate);
  
  // Пересчёт при ресайзе
  window.addEventListener('resize', () => {
    // Сохраняем относительную позицию
    const ratio = position / setWidth;
    
    // Пересчитываем размеры
    slideWidth = originalSlides[0].offsetWidth;
    slideFullWidth = slideWidth + gap;
    setWidth = originalSlides.length * slideFullWidth;
    
    // Восстанавливаем позицию
    position = ratio * setWidth;
    
    updatePosition();
    highlightCenter();
  });
  
  console.log('✅ Карусель работает идеально плавно!');
  
})();

function initMiniSliders() {}
window.initMiniSliders = initMiniSliders;