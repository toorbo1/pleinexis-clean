// app.js - ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 APP.JS - загрузка приложения');
    
    // Инициализация авторизации
    if (typeof initAuth === 'function') {
        await initAuth();
    }
    
    // Загрузка всех данных с сервера
    if (typeof window.loadProducts === 'function') {
        await window.loadProducts();
    }
    if (typeof window.loadGameBlocks === 'function') {
        await window.loadGameBlocks();
    }
    if (typeof window.loadAppBlocks === 'function') {
        await window.loadAppBlocks();
    }
    
    // Инициализация навигации
    initNavigation();
    
    // Настройка поиска
    const globalSearchInput = document.getElementById('globalSearchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    if (globalSearchInput) {
        globalSearchInput.addEventListener('input', function(e) {
            const term = e.target.value;
            const mainSearchInput = document.getElementById('searchInput');
            if (mainSearchInput) {
                mainSearchInput.value = term;
                if (typeof filterProducts === 'function') filterProducts();
            }
            if (clearSearchBtn) {
                clearSearchBtn.style.display = term.length > 0 ? 'flex' : 'none';
            }
        });
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            if (globalSearchInput) {
                globalSearchInput.value = '';
                const mainSearchInput = document.getElementById('searchInput');
                if (mainSearchInput) {
                    mainSearchInput.value = '';
                    if (typeof filterProducts === 'function') filterProducts();
                }
                clearSearchBtn.style.display = 'none';
            }
        });
    }
    
    // Показываем главную страницу
    if (typeof showPage === 'function') {
        showPage('home');
    }
    
    console.log('✅ APP.JS - инициализация завершена');
});

// НАВИГАЦИЯ
function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-item');
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = btn.getAttribute('data-nav');
            if (pageId && typeof showPage === 'function') {
                showPage(pageId);
            }
        });
    });
}

function showPage(pageId) {
    console.log('Showing page:', pageId);
    
    // Скрываем все страницы
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    
    // Показываем нужную
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.style.display = 'block';
        targetPage.classList.add('active');
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.showPage = showPage;
window.navigate = showPage;