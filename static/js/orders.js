const api = new ApiClient();
const ordersContainer = document.getElementById('ordersContainer');

// Функция переключения темы
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeButtonIcon(newTheme);
}

function updateThemeButtonIcon(theme) {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  themeToggleBtn.innerHTML = theme === 'dark' ? '<i class="fas fa-moon"></i> Тема' : '<i class="fas fa-sun"></i> Тема';
}

// Инициализация темы
const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeButtonIcon(savedTheme);

document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

// Проверка авторизации
api.fetchCurrentUser((err, user) => {
  if (err || !user) {
    window.location.href = 'login.html';
    return;
  }
  document.getElementById('profileBtn').innerHTML = '<i class="fas fa-user"></i> Профиль';
  document.getElementById('profileBtn').className = 'profile-button';
  document.getElementById('profileBtn').addEventListener('click', () => {
    window.location.href = 'profile.html';
  });
});

document.getElementById('cartBtn').addEventListener('click', () => {
  window.location.href = 'index.html#cart';
});

// Загрузка заказов
api.request('/users/orders')
  .then(orders => {
    if (orders.length === 0) {
      ordersContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-box-open empty-icon"></i>
          <h3>Нет заказов</h3>
          <p>Вы пока не сделали ни одного заказа.</p>
          <button class="primary-button" onclick="window.location.href='pizzas.html'">
            <i class="fas fa-pizza-slice"></i> Перейти к пиццам
          </button>
        </div>
      `;
      return;
    }
    orders.forEach((order, index) => {
      const orderCard = document.createElement('div');
      orderCard.className = 'order-card';
      orderCard.style.animationDelay = `${index * 0.1}s`;
      const createdAt = new Date(order.created_at).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      orderCard.innerHTML = `
        <div class="order-header">
          <h3>Заказ #${order.id}</h3>
          <span class="status status-${order.status.toLowerCase()}">${order.status}</span>
        </div>
        <div class="order-details">
          <p><strong>Дата:</strong> ${createdAt}</p>
          <p><strong>Адрес:</strong> ${order.address.city}, ул. ${order.address.street}, д. ${order.address.house}, кв. ${order.address.apartment}</p>
          <p><strong>Время доставки:</strong> ${order.delivery_time}</p>
          <p><strong>Способ оплаты:</strong> ${order.payment_method}</p>
        </div>
        <div class="order-pizzas">
          ${order.pizzas.map(pizza => `
            <div class="order-pizza">
              ${pizza.pizza.photo ? `<img src="${pizza.pizza.photo}" alt="${pizza.pizza.name}" loading="lazy">` : '<div class="no-image"><i class="fas fa-image"></i> Нет фото</div>'}
              <div class="pizza-details">
                <h4>${pizza.pizza.name}</h4>
                <div class="ingredients">
                  ${pizza.ingredients.map(ing => `
                    <span>${ing.is_added ? '+' : '-'} ${ing.count}x ${ing.ingredient.name} (${ing.ingredient.price} ₽)</span>
                  `).join(', ')}
                </div>
                <div class="price">${pizza.custom_price} ₽</div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="order-total">
          <strong>Итого:</strong> ${order.price} ₽
        </div>
      `;
      ordersContainer.appendChild(orderCard);
    });
  })
  .catch(error => {
    console.error('Ошибка загрузки заказов:', error);
    ordersContainer.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle error-icon"></i>
        <h3>Не удалось загрузить заказы</h3>
        <p>Попробуйте обновить страницу или войти снова.</p>
        <button class="primary-button" onclick="window.location.reload()">
          <i class="fas fa-sync-alt"></i> Обновить
        </button>
      </div>
    `;
  });