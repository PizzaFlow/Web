const api = new ApiClient();
const orderError = document.getElementById('orderError');
const addressSelect = document.getElementById('addressSelect');
const deliveryTimeSelect = document.getElementById('deliveryTimeSelect');
const cartItems = document.getElementById('cartItems');
const totalPrice = document.getElementById('totalPrice');
const submitOrderBtn = document.getElementById('submitOrderBtn');
const addAddressBtn = document.getElementById('addAddressBtn');

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

// Загрузка адресов
api.request('/users/address')
  .then(addresses => {
    if (addresses.length === 0) {
      addressSelect.innerHTML = '<option value="">Нет доступных адресов</option>';
      return;
    }
    addresses.forEach(address => {
      const option = document.createElement('option');
      option.value = address.id;
      option.textContent = `${address.city}, ул. ${address.street}, д. ${address.house}, кв. ${address.apartment}`;
      addressSelect.appendChild(option);
    });
  })
  .catch(error => {
    console.error('Ошибка загрузки адресов:', error);
    orderError.textContent = 'Не удалось загрузить адреса. Попробуйте позже.';
    orderError.style.display = 'block';
  });

// Загрузка времён доставки
api.request('/orders/delivery-times')
  .then(data => {
    data.delivery_times.forEach(time => {
      const option = document.createElement('option');
      option.value = time;
      option.textContent = time;
      deliveryTimeSelect.appendChild(option);
    });
  })
  .catch(error => {
    console.error('Ошибка загрузки времён доставки:', error);
    orderError.textContent = 'Не удалось загрузить времена доставки. Попробуйте позже.';
    orderError.style.display = 'block';
  });

// Загрузка корзины
const cart = JSON.parse(localStorage.getItem('cart')) || [];
if (cart.length === 0) {
  cartItems.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-shopping-cart empty-icon"></i>
      <h3>Корзина пуста</h3>
      <p>Добавьте пиццы в корзину, чтобы оформить заказ.</p>
      <button class="primary-button" onclick="window.location.href='pizzas.html'">
        <i class="fas fa-pizza-slice"></i> Перейти к пиццам
      </button>
    </div>
  `;
  submitOrderBtn.disabled = true;
} else {
  let total = 0;
  cart.forEach(item => {
    const itemPrice = (item.price || 0) * (item.quantity || 1);
    total += itemPrice;
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    const image = item.photo ? `<img src="${item.photo}" alt="${item.pizza}" loading="lazy">` : '<div class="no-image"><i class="fas fa-image"></i> Нет фото</div>';
    cartItem.innerHTML = `
      ${image}
      <div class="cart-item-details">
        <h4>${item.pizza}</h4>
        <div class="ingredients">
          ${item.ingredients && item.ingredients.length > 0 ? item.ingredients.map(ing => `<span>${ing.name}</span>`).join(', ') : 'Без ингредиентов'}
        </div>
        <div class="quantity">Количество: ${item.quantity || 1}</div>
        <div class="price">${itemPrice} ₽</div>
      </div>
    `;
    cartItems.appendChild(cartItem);
  });
  totalPrice.innerHTML = `<strong>Итого:</strong> ${total} ₽`;
}

// Переход к добавлению адреса
addAddressBtn.addEventListener('click', () => {
  window.location.href = 'addresses.html';
});

// Оформление заказа
submitOrderBtn.addEventListener('click', () => {
  const addressId = addressSelect.value;
  let deliveryTime = deliveryTimeSelect.value;
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

  if (!addressId) {
    orderError.textContent = 'Пожалуйста, выберите адрес доставки.';
    orderError.style.display = 'block';
    return;
  }
  if (!deliveryTime) {
    orderError.textContent = 'Пожалуйста, выберите время доставки.';
    orderError.style.display = 'block';
    return;
  }

  // Преобразуем deliveryTime из формата "HH:MM-HH:MM" в "HH:MM"
  // Берём только начало диапазона (например, "19:00-19:30" → "19:00")
  deliveryTime = deliveryTime.split('-')[0];

  // Проверяем, что время соответствует формату HH:MM
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(deliveryTime)) {
    orderError.textContent = 'Неверный формат времени доставки. Ожидается формат HH:MM (например, 14:30).';
    orderError.style.display = 'block';
    return;
  }

  // Преобразуем корзину в формат, ожидаемый API
  const orderPizzas = [];
  cart.forEach(item => {
    for (let i = 0; i < (item.quantity || 1); i++) {
      orderPizzas.push({
        pizza_id: item.id,
        ingredients: (item.ingredients || []).map(ing => ({
          ingredient_id: ing.id,
          is_added: true, // Все ингредиенты в корзине считаются добавленными
          count: 1 // Предполагаем, что count = 1 для каждого ингредиента
        }))
      });
    }
  });

  const orderData = {
    address_id: parseInt(addressId),
    pizzas: orderPizzas,
    delivery_time: deliveryTime,
    payment_method: paymentMethod
  };

  console.log('Отправляемые данные заказа:', orderData);

  api.request('/orders/', 'POST', orderData)
    .then(() => {
      localStorage.removeItem('cart');
      orderError.textContent = 'Заказ успешно оформлен!';
      orderError.className = 'error success';
      orderError.style.display = 'block';
      setTimeout(() => {
        window.location.href = 'orders.html';
      }, 2000);
    })
    .catch(error => {
      console.error('Ошибка оформления заказа:', error);
      orderError.textContent = 'Не удалось оформить заказ. Попробуйте позже.';
      orderError.style.display = 'block';
    });
});