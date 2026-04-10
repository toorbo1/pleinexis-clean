// slider.js - исправленная версия со скрытым скроллом и плавной прокруткой

// Глобальные переменные
let currentSlide = 0;
let slideInterval;
const slides = document.querySelectorAll('.slide-img');
const sliderImages = document.getElementById('sliderImages');
const totalSlides = slides.length;

// Заменяем стандартные изображения
if (slides.length >= 3) {
  slides[0].src = "https://picsum.photos/id/106/800/300";
  slides[1].src = "https://picsum.photos/id/20/800/300";
  slides[2].src = "https://picsum.photos/id/104/800/300";
}

function updateSlider() {
  if (sliderImages) {
    sliderImages.style.transform = `translateX(-${currentSlide * 100}%)`;
  }
  document.querySelectorAll('.dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });
}

function createDots() {
  const container = document.getElementById('sliderDots');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('div');
    dot.classList.add('dot');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => {
      currentSlide = i;
      updateSlider();
      resetInterval();
    });
    container.appendChild(dot);
  }
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % totalSlides;
  updateSlider();
}

function resetInterval() {
  clearInterval(slideInterval);
  slideInterval = setInterval(nextSlide, 4000);
}

createDots();
slideInterval = setInterval(nextSlide, 4000);

// ========== МИНИ-СЛАЙДЕРЫ С КНОПКАМИ УПРАВЛЕНИЯ ==========

let sliders = [];

function initMiniSliders() {
  const slidersConfig = [
    { id: 0, imagesId: 'slider0Images', dotsId: 'slider0Dots', totalSlides: 4 },
    { id: 1, imagesId: 'slider1Images', dotsId: 'slider1Dots', totalSlides: 4 },
    { id: 2, imagesId: 'slider2Images', dotsId: 'slider2Dots', totalSlides: 4 },
    { id: 3, imagesId: 'slider3Images', dotsId: 'slider3Dots', totalSlides: 4 }
  ];
  
  slidersConfig.forEach(config => {
    initSlider(config.id, config.imagesId, config.dotsId, config.totalSlides);
  });
}

function initSlider(sliderId, imagesId, dotsId, totalSlides) {
  let currentSlide = 0;
  let slideInterval;
  const sliderImages = document.getElementById(imagesId);
  const dotsContainer = document.getElementById(dotsId);
  
  if (!sliderImages || !dotsContainer) return;
  
  // Создаем точки
  dotsContainer.innerHTML = '';
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('div');
    dot.classList.add('mini-dot');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => {
      currentSlide = i;
      updateSlider();
      resetInterval();
    });
    dotsContainer.appendChild(dot);
  }
  
  function updateSlider() {
    sliderImages.style.transform = `translateX(-${currentSlide * 100}%)`;
    const dots = dotsContainer.querySelectorAll('.mini-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
    });
  }
  
  function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateSlider();
  }
  
  function prevSlide() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateSlider();
  }
  
  function resetInterval() {
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 4000);
  }
  
  // Добавляем обработчики для кнопок
  const prevBtn = document.querySelector(`.slider-nav-btn.prev[data-slider="${sliderId}"]`);
  const nextBtn = document.querySelector(`.slider-nav-btn.next[data-slider="${sliderId}"]`);
  
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      prevSlide();
      resetInterval();
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      nextSlide();
      resetInterval();
    });
  }
  
  // Автоматическая прокрутка
  resetInterval();
  
  // Пауза при наведении
  const container = document.querySelector(`.slider-card:has([data-slider="${sliderId}"])`);
  if (container) {
    container.addEventListener('mouseenter', () => {
      clearInterval(slideInterval);
    });
    container.addEventListener('mouseleave', () => {
      slideInterval = setInterval(nextSlide, 4000);
    });
  }
}

// Функция для плавной прокрутки главного слайдера
function scrollHeroSlider(direction) {
  const wrapper = document.getElementById('heroSlidersWrapper');
  if (!wrapper) return;
  
  const scrollAmount = 320;
  if (direction === 'left') {
    wrapper.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  } else {
    wrapper.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
}

// ========== ДОБАВЛЯЕМ ПОДДЕРЖКУ МЫШИНОЙ ПРОКРУТКИ ==========
function initMouseScroll() {
  const wrapper = document.getElementById('heroSlidersWrapper');
  if (!wrapper) return;
  
  let isDown = false;
  let startX;
  let scrollLeft;
  
  // Отключаем выделение текста при перетаскивании
  wrapper.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - wrapper.offsetLeft;
    scrollLeft = wrapper.scrollLeft;
    wrapper.style.cursor = 'grabbing';
  });
  
  wrapper.addEventListener('mouseleave', () => {
    isDown = false;
    wrapper.style.cursor = 'grab';
  });
  
  wrapper.addEventListener('mouseup', () => {
    isDown = false;
    wrapper.style.cursor = 'grab';
  });
  
  wrapper.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - wrapper.offsetLeft;
    const walk = (x - startX) * 1.5;
    wrapper.scrollLeft = scrollLeft - walk;
  });
  
  wrapper.style.cursor = 'grab';
}

// Запускаем инициализацию
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(initMiniSliders, 100);
  setTimeout(initMouseScroll, 100);
  
  // Настраиваем кнопки скролла для главного слайдера
  const scrollLeftBtn = document.getElementById('scrollLeftBtn');
  const scrollRightBtn = document.getElementById('scrollRightBtn');
  
  if (scrollLeftBtn) {
    // Удаляем старый обработчик и добавляем новый
    const newLeftBtn = scrollLeftBtn.cloneNode(true);
    scrollLeftBtn.parentNode.replaceChild(newLeftBtn, scrollLeftBtn);
    newLeftBtn.addEventListener('click', () => scrollHeroSlider('left'));
  }
  if (scrollRightBtn) {
    const newRightBtn = scrollRightBtn.cloneNode(true);
    scrollRightBtn.parentNode.replaceChild(newRightBtn, scrollRightBtn);
    newRightBtn.addEventListener('click', () => scrollHeroSlider('right'));
  }
});

// Фикс изображений в слайдерах
function fixSliderImages() {
  const images = document.querySelectorAll('.mini-slide-img, .slide-img');
  images.forEach(img => {
    img.style.objectFit = 'cover';
    img.style.aspectRatio = '16/9';
    img.style.width = '100%';
    img.style.height = '100%';
  });
}

setTimeout(fixSliderImages, 100);
setInterval(fixSliderImages, 500);