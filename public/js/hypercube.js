// Анимированный логотип вместо 3D куба
(function() {
  // Ждем полной загрузки DOM
  function initLogo() {
    console.log("Initializing Animated Logo...");
    
    // Находим контейнер
    const container = document.getElementById('cubeContainer');
    if (!container) {
      console.error("Container #cubeContainer not found!");
      return;
    }

    console.log("Container found, creating logo...");

    // Очищаем контейнер
    container.innerHTML = '';

    // Добавляем стили для анимаций
    if (!document.getElementById('logo-animations-style')) {
      const style = document.createElement('style');
      style.id = 'logo-animations-style';
      style.textContent = `
        @keyframes logoIntro {
          0% {
            opacity: 0;
            transform: scale(0.7) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes iconFloat {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
          100% {
            transform: translateY(0px);
          }
        }

        @keyframes glowPulse {
          0% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.2);
          }
          100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
        }

        @keyframes metalFlow {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }

        @keyframes particleFloat {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 0.8;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0);
          }
        }

        @keyframes subtitleFade {
          0% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.5;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Создаем структуру логотипа
    container.innerHTML = `
      <div class="hero-logo" style="
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        position: relative;
        opacity: 0;
        transform: scale(0.9);
        animation: logoIntro 0.8s ease forwards;
      ">
        <div class="icon-wrapper" style="
          position: relative;
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div class="icon" style="
            font-size: 55px;
            filter: drop-shadow(0 5px 15px rgba(59, 130, 246, 0.5));
            animation: iconFloat 3s ease-in-out infinite;
            position: relative;
            z-index: 2;
          "></div>
          <div class="icon-glow" style="
            position: absolute;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.4), transparent);
            border-radius: 50%;
            animation: glowPulse 2s ease-in-out infinite;
            z-index: 1;
          "></div>
          <div class="icon-particles" style="
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
          ">
            <span style="position: absolute; width: 4px; height: 4px; background: #3b82f6; border-radius: 50%; opacity: 0; animation: particleFloat 2s ease-in-out infinite; top: 10%; left: 80%; animation-delay: 0s;"></span>
            <span style="position: absolute; width: 4px; height: 4px; background: #3b82f6; border-radius: 50%; opacity: 0; animation: particleFloat 2s ease-in-out infinite; top: 20%; left: 15%; animation-delay: 0.3s;"></span>
            <span style="position: absolute; width: 4px; height: 4px; background: #3b82f6; border-radius: 50%; opacity: 0; animation: particleFloat 2s ease-in-out infinite; top: 70%; left: 85%; animation-delay: 0.6s;"></span>
            <span style="position: absolute; width: 4px; height: 4px; background: #3b82f6; border-radius: 50%; opacity: 0; animation: particleFloat 2s ease-in-out infinite; top: 85%; left: 20%; animation-delay: 0.9s;"></span>
            <span style="position: absolute; width: 4px; height: 4px; background: #3b82f6; border-radius: 50%; opacity: 0; animation: particleFloat 2s ease-in-out infinite; top: 40%; left: 5%; animation-delay: 1.2s;"></span>
            <span style="position: absolute; width: 4px; height: 4px; background: #3b82f6; border-radius: 50%; opacity: 0; animation: particleFloat 2s ease-in-out infinite; top: 60%; left: 95%; animation-delay: 1.5s;"></span>
            <span style="position: absolute; width: 4px; height: 4px; background: #3b82f6; border-radius: 50%; opacity: 0; animation: particleFloat 2s ease-in-out infinite; top: 15%; left: 50%; animation-delay: 1.8s;"></span>
            <span style="position: absolute; width: 4px; height: 4px; background: #3b82f6; border-radius: 50%; opacity: 0; animation: particleFloat 2s ease-in-out infinite; top: 85%; left: 60%; animation-delay: 2.1s;"></span>
          </div>
        </div>
        <div class="logo-text" style="
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 2px;
          background: linear-gradient(135deg, #e2e8f0, #94a3b8, #e2e8f0);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: metalFlow 3s linear infinite;
          position: relative;
          text-align: center;
        ">Плейнексис</div>
        <div class="logo-subtitle" style="
          font-size: 9px;
          color: #5e6f8d;
          letter-spacing: 1px;
          text-transform: uppercase;
          opacity: 0.7;
          animation: subtitleFade 2s ease-in-out infinite;
        ">Цифровой маркетплейс</div>
      </div>
    `;

    console.log("Animated Logo created successfully!");
  }

  // Запускаем инициализацию после полной загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLogo);
  } else {
    initLogo();
  }
})();