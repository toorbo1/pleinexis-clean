// auth.js - обновленная версия
window.currentUser = null;

async function initAuth() {
  let username = localStorage.getItem("apex_user");
  
  if (!username) {
    username = prompt("Добро пожаловать! Введите ваш никнейм:") || "Гость";
  }
  
  try {
    // Авторизация через API
    const user = await window.api.login(username);
    window.currentUser = user.username;
    localStorage.setItem("apex_user", user.username);
    localStorage.setItem("apex_user_id", user.id);
    
    // Обновляем профиль
    updateProfileUI(user);
    
    // Загружаем товары пользователя
    await loadUserProducts();
    
  } catch (error) {
    console.error('Auth error:', error);
    window.currentUser = username;
  }
}

function updateProfileUI(user) {
  const balanceEl = document.getElementById("profileBalance");
  if (balanceEl) balanceEl.innerText = (user.balance || 0).toFixed(2) + " ₽";
  
  const usernameEl = document.getElementById("profileUsername");
  if (usernameEl) usernameEl.innerText = user.username;
  
  const productsCountEl = document.getElementById("profileProductsCount");
  if (productsCountEl) productsCountEl.innerText = user.products_count || 0;
}

async function loadUserProducts() {
  const products = await window.api.getProducts();
  const userProducts = products.filter(p => p.seller === window.currentUser);
  
  const container = document.getElementById("profileProductsList");
  if (container && userProducts.length > 0) {
    container.innerHTML = userProducts.map(p => `
      <div class="profile-product-item" onclick="window.openProductDetailById('${p.id}')">
        <img src="${p.image_url}" alt="${p.title}">
        <div>${p.title}</div>
        <div>${p.price}</div>
      </div>
    `).join('');
  }
}

// Экспорт
window.initAuth = initAuth;
window.logout = () => {
  localStorage.clear();
  location.reload();
};