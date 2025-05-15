document.addEventListener('DOMContentLoaded', () => {
  const pizzaContainer = document.getElementById('pizzaContainer');
  const pizzaModal = document.getElementById('pizzaModal');
  const closePizzaModal = pizzaModal.querySelector('.close');
  const API_BASE_URL = 'http://localhost:8000';
  const PIZZAS_ENDPOINT = '/pizzas';
  const PIZZA_API_URL = API_BASE_URL + PIZZAS_ENDPOINT;

  let selectedPizza = null;
  let totalPrice = 0;
  let cart = [];

  if (!pizzaContainer || !pizzaModal || !closePizzaModal) {
    console.error('Не найдены необходимые элементы DOM');
    return;
  }

  fetch(PIZZA_API_URL)
    .then(response => {
      if (!response.ok) throw new Error('Ошибка загрузки данных о пиццах');
      return response.json();
    })
    .then(pizzas => {
      pizzas.forEach(pizza => {
        pizzaContainer.appendChild(createPizzaCard(pizza));
      });
    })
    .catch(error => {
      console.error('Ошибка:', error);
      pizzaContainer.innerHTML = `<p class="error">Не удалось загрузить меню. Попробуйте позже.</p>`;
    });

  function createPizzaCard(pizza) {
    const card = document.createElement('div');
    card.className = 'pizza-card';
    
    const image = pizza.photo 
      ? `<img src="${pizza.photo}" alt="${pizza.name}">` 
      : '<div class="no-image">Нет фото</div>';
  
    card.innerHTML = `
      <div class="pizza-card-content">
        ${image}
        <h3>${pizza.name}</h3>
        <div class="description">${pizza.description}</div>
        <div class="price">от ${pizza.price} ₽</div>
      </div>
      <button>Выбрать</button>
    `;

    card.querySelector('button').addEventListener('click', () => {
      selectedPizza = pizza;
      updatePrice();
      openPizzaModal(pizza);
    });
  
    return card;
  }

  function openPizzaModal(pizza) {
    const modalPizzaName = document.getElementById('modalPizzaName');
    const modalPizzaDescription = document.getElementById('modalPizzaDescription');
    const modalPizzaImage = document.getElementById('modalPizzaImage');
    const modalPizzaIngredients = document.getElementById('modalPizzaIngredients');
    const modalPizzaPrice = document.getElementById('modalPizzaPrice');
    const addToCartBtn = document.getElementById('addToCartBtn');

    if (!modalPizzaName || !modalPizzaDescription || !modalPizzaImage || !modalPizzaIngredients || !modalPizzaPrice || !addToCartBtn) {
      console.error('Не найдены элементы модального окна пиццы');
      return;
    }

    modalPizzaName.textContent = pizza.name;
    modalPizzaDescription.textContent = pizza.description;
    modalPizzaImage.src = pizza.photo || '';
    
    modalPizzaIngredients.innerHTML = '';
    (pizza.ingredients || []).forEach(ingredient => {
      const ingredientDiv = document.createElement('div');
      ingredientDiv.className = 'ingredient-item default-ingredient';
      ingredientDiv.innerHTML = `
        <img src="${ingredient.photo}" alt="${ingredient.name}">
        <div class="ingredient-info">
          <span>${ingredient.name}</span>
          <span class="ingredient-price">${ingredient.price} ₽</span>
        </div>
      `;
      modalPizzaIngredients.appendChild(ingredientDiv);
    });

    modalPizzaPrice.textContent = `${totalPrice} ₽`;

    addToCartBtn.addEventListener('click', () => {
      pizzaModal.style.display = 'none';
      addToCart();
    }, { once: true });

    pizzaModal.style.display = 'block';
  }

  function addToCart() {
    if (!selectedPizza) {
      console.error('Пицца не выбрана');
      return;
    }

    console.log('Добавляем в корзину:', selectedPizza, totalPrice);

    const cartItem = {
      id: selectedPizza.id,
      pizza: selectedPizza.name,
      ingredients: selectedPizza.ingredients,
      price: totalPrice
    };

    console.log('Создан cartItem:', cartItem);
    window.addToCart(cartItem);
  }

  function updatePrice() {
    if (!selectedPizza) return;

    let price = selectedPizza.price;
    (selectedPizza.ingredients || []).forEach(ingredient => {
      price += ingredient.price;
    });

    totalPrice = price;
  }

  closePizzaModal.addEventListener('click', () => {
    pizzaModal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target === pizzaModal) {
      pizzaModal.style.display = 'none';
    }
  });
});