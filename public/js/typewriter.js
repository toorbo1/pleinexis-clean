// typewriter.js - Цикличная анимация печатной машинки (без курсора)
(function() {
  // Массив фраз для циклического отображения
  const phrases = [
    "Привет!",
    "Как дела?",
    "Топ цены",
    "Дешевле некуда"
  ];
  
  let currentPhraseIndex = 0;     // Индекс текущей фразы
  let currentCharIndex = 0;       // Индекс текущего символа
  let isDeleting = false;          // Режим удаления
  let typewriterElement = null;     // Ссылка на DOM-элемент
  
  // Скорость (в миллисекундах)
  const TYPING_SPEED = 250;        // Скорость печати символа
  const DELETING_SPEED = 80;       // Скорость удаления символа
  const PAUSE_BETWEEN_PHRASES = 2000; // Пауза перед удалением/сменой фразы
  
  function initTypewriter() {
    typewriterElement = document.getElementById('typewriterText');
    if (!typewriterElement) {
      console.warn("Element with id 'typewriterText' not found");
      return;
    }
    
    // Очищаем содержимое и добавляем класс
    typewriterElement.innerHTML = '';
    typewriterElement.classList.add('typewriter-text');
    
    // Запускаем анимацию
    setTimeout(typewriterEffect, 200);
  }
  
  function typewriterEffect() {
    if (!typewriterElement) return;
    
    const currentPhrase = phrases[currentPhraseIndex];
    
    // РЕЖИМ ПЕЧАТИ
    if (!isDeleting) {
      // Добавляем следующий символ
      typewriterElement.innerHTML = currentPhrase.substring(0, currentCharIndex + 1);
      currentCharIndex++;
      
      // Если фраза полностью напечатана
      if (currentCharIndex === currentPhrase.length) {
        isDeleting = true;
        // Пауза перед началом удаления
        setTimeout(typewriterEffect, PAUSE_BETWEEN_PHRASES);
        return;
      }
      
      // Продолжаем печатать
      setTimeout(typewriterEffect, TYPING_SPEED);
    } 
    // РЕЖИМ УДАЛЕНИЯ
    else {
      // Удаляем последний символ
      typewriterElement.innerHTML = currentPhrase.substring(0, currentCharIndex - 1);
      currentCharIndex--;
      
      // Если фраза полностью удалена
      if (currentCharIndex === 0) {
        isDeleting = false;
        // Переключаемся на следующую фразу
        currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
        // Небольшая пауза перед печатью новой фразы
        setTimeout(typewriterEffect, TYPING_SPEED);
        return;
      }
      
      // Продолжаем удалять
      setTimeout(typewriterEffect, DELETING_SPEED);
    }
  }
  
  // Запускаем инициализацию после полной загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTypewriter);
  } else {
    initTypewriter();
  }
})();