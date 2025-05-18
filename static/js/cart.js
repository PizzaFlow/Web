document.addEventListener('DOMContentLoaded', () => {
  const cartModal = document.getElementById('cartModal');
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');
  const cartCount = document.getElementById('cartCount');
  const cartTotalHeader = document.getElementById('cartTotalHeader');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const overlay = document.getElementById('overlay');
  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  // Функция обновления корзины
  function updateCart() {
    console.log('Обновляем корзину:', cart);
    cartItems.innerHTML = '';
    let total = 0;
    let itemCount = 0;

    cart.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        console.warn(`Некорректный элемент корзины на индексе ${index}:`, item);
        return;
      }

      const itemTotal = item.price || 0;
      const quantity = item.quantity || 1;
      total += itemTotal * quantity;
      itemCount += quantity;

      const cartItem = document.createElement('div');
      cartItem.className = 'cart-item';
      cartItem.innerHTML = `
        <div class="cart-item-image">
          <img src="${item.photo || '/static/images/default-pizza.jpg'}" alt="${item.pizza}">
        </div>
        <div class="cart-item-details">
          <span class="cart-item-name">${item.pizza || 'Без названия'}</span>
          <span class="cart-item-ingredients">${item.ingredients && item.ingredients.length > 0 ? item.ingredients.map(i => i.name).join(', ') : 'Без ингредиентов'}</span>
        </div>
        <span class="cart-item-price">${itemTotal * quantity} ₽</span>
        <div class="cart-item-actions">
          <div class="quantity-control">
            <button class="quantity-button decrement" data-index="${index}">-</button>
            <span class="quantity">${quantity}</span>
            <button class="quantity-button increment" data-index="${index}">+</button>
          </div>
          <button class="remove-button" data-index="${index}"><i class="fas fa-trash-alt"></i></button>
        </div>
      `;
      cartItems.appendChild(cartItem);

      // Уменьшение количества
      cartItem.querySelector('.decrement').addEventListener('click', () => {
        if (quantity > 1) {
          item.quantity -= 1;
        } else {
          cart.splice(index, 1);
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCart();
      });

      // Увеличение количества
      cartItem.querySelector('.increment').addEventListener('click', () => {
        item.quantity = (item.quantity || 1) + 1;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCart();
      });

      // Удаление товара
      cartItem.querySelector('.remove-button').addEventListener('click', () => {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCart();
      });
    });

    cartCount.textContent = `${itemCount} товара`;
    cartTotalHeader.textContent = `на ${total} ₽`;
    cartTotal.textContent = `${total} ₽`;

    // Отключаем кнопку, если корзина пуста
    checkoutBtn.disabled = itemCount === 0;
  }

  // Добавление в корзину
  window.addToCart = function(cartItem) {
    console.log('Получен cartItem:', cartItem);
    if (!cartItem || typeof cartItem !== 'object' || !cartItem.pizza || cartItem.price === undefined) {
      console.error('Некорректный элемент корзины:', cartItem);
      return;
    }
    cartItem.quantity = 1; // Добавляем количество по умолчанию
    cart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
    cartModal.classList.add('open');
    overlay.classList.add('active');
  };

  // Закрытие корзины
  cartModal.querySelector('.close').addEventListener('click', () => {
    cartModal.classList.remove('open');
    overlay.classList.remove('active');
  });

  window.addEventListener('click', (event) => {
    if (event.target === cartModal || event.target === overlay) {
      cartModal.classList.remove('open');
      overlay.classList.remove('active');
    }
  });

  // Кнопка "К оформлению заказа"
  checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Корзина пуста!');
      return;
    }
    // Убедимся, что данные корзины сохранены
    localStorage.setItem('cart', JSON.stringify(cart));
    window.location.href = 'makeorder.html';
  });

  // Инициализация
  updateCart();
});