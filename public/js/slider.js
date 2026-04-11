// infinite-slider.js - АБСОЛЮТНО НОВАЯ КАРУСЕЛЬ

(function() {
  console.log('🔥 НОВАЯ КАРУСЕЛЬ ЗАПУСКАЕТСЯ');
  
  const viewport = document.getElementById('infiniteViewport');
  const track = document.getElementById('infiniteTrack');
  
  if (!viewport || !track) {
    console.error('❌ Элементы карусели не найдены!');
    console.log('infiniteViewport:', viewport);
    console.log('infiniteTrack:', track);
    return;
  }
  
  console.log('✅ Элементы найдены');
  
  // Получаем оригинальные слайды
  const originalSlides = Array.from(document.querySelectorAll('.infinite-slide'));
  
  if (originalSlides.length === 0) {
    console.error('❌ Слайды не найдены!');
    return;
  }
  
  console.log(`✅ Слайдов: ${originalSlides.length}`);
  
  // Клонируем 3 раза
  track.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    originalSlides.forEach(slide => {
      track.appendChild(slide.cloneNode(true));
    });
  }
  
  const allSlides = Array.from(document.querySelectorAll('.infinite-slide'));
  console.log(`✅ Всего слайдов: ${allSlides.length}`);
  
  // Размеры
  const slideWidth = originalSlides[0].offsetWidth;
  const gap = 16;
  const slideFullWidth = slideWidth + gap;
  const setWidth = originalSlides.length * slideFullWidth;
  
  // Начальная позиция - второй набор
  let position = setWidth;
  const SPEED = 1.5;
  
  // Функция движения
  function moveCarousel() {
    position += SPEED;
    
    // Бесконечность
    if (position >= setWidth * 2) {
      position = position - setWidth;
    }
    
    track.style.transform = `translateX(${-position}px)`;
    
    // Подсветка центра
    const viewportRect = viewport.getBoundingClientRect();
    const centerX = viewportRect.left + viewportRect.width / 2;
    
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
    
    requestAnimationFrame(moveCarousel);
  }
  
  // Начальная установка
  track.style.transform = `translateX(${-position}px)`;
  
  // Запуск
  requestAnimationFrame(moveCarousel);
  
  console.log('✅ КАРУСЕЛЬ РАБОТАЕТ!');
  
})();

function initMiniSliders() {}
window.initMiniSliders = initMiniSliders;