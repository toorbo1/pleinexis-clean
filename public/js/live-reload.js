// public/js/live-reload.js
(function() {
    // Не подключаемся в админке или если уже есть соединение
    if (window.__liveReloadActive) return;
    window.__liveReloadActive = true;

    console.log('🔄 Live Reload: попытка подключения...');

    // Используем wss если страница загружена по https, иначе ws
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    function connect() {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('🟢 Live Reload подключён. Ожидание обновлений...');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'RELOAD') {
                    console.log('🔄 Live Reload: получена команда обновления!');
                    // Небольшая задержка, чтобы сервер успел обработать очередь
                    setTimeout(() => {
                        window.location.reload();
                    }, 100);
                }
            } catch (e) {
                // Игнорируем другие сообщения
            }
        };

        ws.onclose = () => {
            console.log('🔴 Live Reload отключён. Переподключение через 5 сек...');
            setTimeout(connect, 5000);
        };

        ws.onerror = (err) => {
            // Ошибки WebSocket - это нормально при локальной разработке или если Railway не поддерживает
            // Не засоряем консоль пользователя
        };
    }

    // Запускаем соединение после загрузки страницы
    if (document.readyState === 'complete') {
        connect();
    } else {
        window.addEventListener('load', connect);
    }
})();