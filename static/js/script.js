document.addEventListener('DOMContentLoaded', () => {
  const pizzaContainer = document.getElementById('pizzaContainer');
  const pizzaModal = document.getElementById('pizzaModal');
  const ingredientsModal = document.getElementById('ingredientsModal');
  const closePizzaModal = pizzaModal.querySelector('.close');
  const closeIngredientsModal = ingredientsModal.querySelector('.close');
  const API_BASE_URL = 'http://localhost:8000';
  const PIZZAS_ENDPOINT = '/pizzas';
  const INGREDIENTS_ENDPOINT = '/ingredients';
  const PIZZA_API_URL = API_BASE_URL + PIZZAS_ENDPOINT;
  const INGREDIENTS_API_URL = API_BASE_URL + INGREDIENTS_ENDPOINT;

  let ingredients = [];
  let selectedPizza = null;
  let selectedSize = 30;
  let selectedDough = 'traditional';
  let totalPrice = 0;
  let selectedIngredients = [];
  let cart = []; // Временная корзина в памяти

  // Проверка на наличие необходимых элементов
  if (!pizzaContainer || !pizzaModal || !ingredientsModal || !closePizzaModal || !closeIngredientsModal) {
    console.error('Не найдены необходимые элементы DOM');
    return;
  }

  // Загрузка пицц
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

  // Загрузка ингредиентов
  fetch(INGREDIENTS_API_URL)
    .then(response => {
      if (!response.ok) throw new Error('Ошибка загрузки данных об ингредиентах');
      return response.json();
    })
    .then(data => {
      ingredients = data;
      console.log('Ингредиенты загружены:', ingredients);
    })
    .catch(error => {
      console.error('Ошибка загрузки ингредиентов:', error);
    });

  // Функция для создания карточки пиццы
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
      totalPrice = pizza.price;
      selectedIngredients = [];
      openPizzaModal(pizza);
    });
  
    return card;
  }

  // Функция для открытия модального окна пиццы
  function openPizzaModal(pizza) {
    const modalPizzaName = document.getElementById('modalPizzaName');
    const modalPizzaDescription = document.getElementById('modalPizzaDescription');
    const modalPizzaImage = document.getElementById('modalPizzaImage');
    const modalPizzaPrice = document.getElementById('modalPizzaPrice');
    const selectIngredientsBtn = document.getElementById('selectIngredientsBtn');

    if (!modalPizzaName || !modalPizzaDescription || !modalPizzaImage || !modalPizzaPrice || !selectIngredientsBtn) {
      console.error('Не найдены элементы модального окна пиццы');
      return;
    }

    modalPizzaName.textContent = pizza.name;
    modalPizzaDescription.textContent = pizza.description;
    modalPizzaImage.src = pizza.photo || '';
    updatePrice();

    selectIngredientsBtn.addEventListener('click', () => {
      openIngredientsModal();
    }, { once: true });

    pizzaModal.style.display = 'block';
  }

  // Функция для открытия модального окна ингредиентов
  function openIngredientsModal() {
    const ingredientsList = document.getElementById('ingredientsList');
    const saveIngredientsBtn = document.getElementById('saveIngredientsBtn');

    if (!ingredientsList || !saveIngredientsBtn) {
      console.error('Не найдены элементы модального окна ингредиентов');
      return;
    }

    ingredientsList.innerHTML = '';

    ingredients.forEach(ingredient => {
      const ingredientDiv = document.createElement('div');
      ingredientDiv.className = 'ingredient-item';
      ingredientDiv.innerHTML = `
        <img src="${ingredient.photo}" alt="${ingredient.name}">
        <span>${ingredient.name}</span>
        <span>${ingredient.price} ₽</span>
        <input type="checkbox" data-price="${ingredient.price}" data-id="${ingredient.id}" ${selectedIngredients.some(i => i.id === ingredient.id) ? 'checked' : ''}>
      `;
      ingredientDiv.querySelector('input').addEventListener('change', () => {
        updateSelectedIngredients();
        updatePrice();
      });
      ingredientsList.appendChild(ingredientDiv);
    });

    saveIngredientsBtn.addEventListener('click', () => {
      // Закрываем оба модальных окна
      ingredientsModal.style.display = 'none';
      pizzaModal.style.display = 'none';
      // Добавляем пиццу в корзину
      addToCart();
    }, { once: true });

    ingredientsModal.style.display = 'block';
  }

  // Функция для обновления выбранных ингредиентов
  function updateSelectedIngredients() {
    selectedIngredients = Array.from(document.querySelectorAll('.ingredient-item input:checked')).map(input => ({
      id: input.dataset.id,
      price: parseInt(input.dataset.price)
    }));
  }

  // Функция для обновления цены
  function updatePrice() {
    if (!selectedPizza) return;

    let price = selectedPizza.price;

    if (selectedSize === 25) price -= 100;
    if (selectedSize === 35) price += 100;

    selectedIngredients.forEach(ingredient => {
      price += ingredient.price;
    });

    totalPrice = price;
    const modalPizzaPrice = document.getElementById('modalPizzaPrice');
    if (modalPizzaPrice) {
      modalPizzaPrice.textContent = `${totalPrice} ₽`;
    }
  }

  // Функция для добавления в корзину
  function addToCart() {
    const cartItem = {
      pizza: selectedPizza.name,
      price: totalPrice,
      ingredients: selectedIngredients.map(ing => ({
        name: ingredients.find(i => i.id === ing.id).name,
        price: ing.price
      })),
      size: selectedSize,
      dough: selectedDough
    };
    cart.push(cartItem);
    console.log('Добавлено в корзину:', cartItem);
    alert(`Пицца "${selectedPizza.name}" добавлена в корзину за ${totalPrice} ₽!`);
  }

  // Обработчик закрытия модального окна пиццы
  closePizzaModal.addEventListener('click', () => {
    pizzaModal.style.display = 'none';
  });

  // Обработчик закрытия модального окна ингредиентов
  closeIngredientsModal.addEventListener('click', () => {
    ingredientsModal.style.display = 'none';
  });

  // Закрытие модальных окон при клике вне их
  window.addEventListener('click', (event) => {
    if (event.target === pizzaModal) {
      pizzaModal.style.display = 'none';
    }
    if (event.target === ingredientsModal) {
      ingredientsModal.style.display = 'none';
    }
  });
});