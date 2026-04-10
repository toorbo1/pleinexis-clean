// typewriter.js - Цикличная анимация печатной машинки (без скачков)
(function() {
  const phrases = [
    "Привет! ;)",
    "Маркетплейс товаров",
    "Лучшие среди лучших",
    "Как дела? :)",
    "Покупай и продавай",
    "Присоединяйся к нам!"  
  ];
  
  let currentPhraseIndex = 0;
  let currentCharIndex = 0;
  let isDeleting = false;
  let typewriterElement = null;
  
  const TYPING_SPEED = 250;
  const DELETING_SPEED = 80;
  const PAUSE_BETWEEN_PHRASES = 2000;
  
  function initTypewriter() {
    typewriterElement = document.getElementById('typewriterText');
    if (!typewriterElement) {
      console.warn("Element with id 'typewriterText' not found");
      return;
    }
    
    // ФИКС: устанавливаем фиксированную минимальную высоту
    typewriterElement.style.minHeight = typewriterElement.offsetHeight + 'px';
    typewriterElement.style.display = 'inline-block';
    
    typewriterElement.innerHTML = '';
    typewriterElement.classList.add('typewriter-text');
    
    setTimeout(typewriterEffect, 200);
  }
  
  function typewriterEffect() {
    if (!typewriterElement) return;
    
    const currentPhrase = phrases[currentPhraseIndex];
    
    if (!isDeleting) {
      typewriterElement.innerHTML = currentPhrase.substring(0, currentCharIndex + 1);
      currentCharIndex++;
      
      if (currentCharIndex === currentPhrase.length) {
        isDeleting = true;
        setTimeout(typewriterEffect, PAUSE_BETWEEN_PHRASES);
        return;
      }
      
      setTimeout(typewriterEffect, TYPING_SPEED);
    } 
    else {
      // ФИКС: при удалении последнего символа не делаем элемент пустым
      if (currentCharIndex === 1) {
        typewriterElement.innerHTML = '&nbsp;'; // невидимый пробел вместо пустоты
        currentCharIndex = 0;
        isDeleting = false;
        currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
        setTimeout(typewriterEffect, TYPING_SPEED);
        return;
      }
      
      typewriterElement.innerHTML = currentPhrase.substring(0, currentCharIndex - 1);
      currentCharIndex--;
      
      setTimeout(typewriterEffect, DELETING_SPEED);
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTypewriter);
  } else {
    initTypewriter();
  }
})();