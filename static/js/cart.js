document.addEventListener('DOMContentLoaded', () => {
  const cartModal = document.getElementById('cartModal');
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');
  const clearCartBtn = document.getElementById('clearCartBtn');
  const overlay = document.getElementById('overlay');
  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  // Функция обновления корзины
  function updateCart() {
    console.log('Обновляем корзину:', cart);
    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        console.warn(`Некорректный элемент корзины на индексе ${index}:`, item);
        return;
      }

      const itemTotal = item.price || 0;
      total += itemTotal;

      const cartItem = document.createElement('div');
      cartItem.className = 'cart-item';
      cartItem.innerHTML = `
        <span>ID: ${item.id || 'Нет ID'}, ${item.pizza || 'Без названия'} - ${itemTotal} ₽</span>
        <span>${item.ingredients && item.ingredients.length > 0 ? item.ingredients.map(i => i.name).join(', ') : 'Без ингредиентов'}</span>
        <button data-index="${index}">Удалить</button>
      `;
      cartItems.appendChild(cartItem);

      cartItem.querySelector('button').addEventListener('click', () => {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCart();
      });
    });

    cartTotal.textContent = `Итого: ${total} ₽`;
  }

  // Добавление в корзину
  window.addToCart = function(cartItem) {
    console.log('Получен cartItem:', cartItem);
    if (!cartItem || typeof cartItem !== 'object' || !cartItem.pizza || cartItem.price === undefined) {
      console.error('Некорректный элемент корзины:', cartItem);
      return;
    }
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

  // Очистка корзины
  clearCartBtn.addEventListener('click', () => {
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
  });

  // Инициализация
  updateCart();
});