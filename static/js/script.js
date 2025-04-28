document.addEventListener('DOMContentLoaded', () => {
  const pizzaContainer = document.getElementById('pizzaContainer');
  const modal = document.getElementById('pizzaModal');
  const closeModal = document.querySelector('.modal .close');
  const API_BASE_URL = 'http://localhost:8000';
  const PIZZAS_ENDPOINT = '/pizzas';
  const INGREDIENTS_ENDPOINT = '/ingredients';
  const PIZZA_API_URL = API_BASE_URL + PIZZAS_ENDPOINT;
  const INGREDIENTS_API_URL = API_BASE_URL + INGREDIENTS_ENDPOINT;

  let ingredients = [];
  let selectedPizza = null;
  let selectedSize = 30; // По умолчанию 30 см
  let selectedDough = 'traditional'; // По умолчанию традиционное тесто
  let totalPrice = 0;

  // Проверка на наличие необходимых элементов
  if (!pizzaContainer) {
    console.error('Элемент с id="pizzaContainer" не найден');
    return;
  }
  if (!modal) {
    console.error('Элемент с id="pizzaModal" не найден');
    return;
  }
  if (!closeModal) {
    console.error('Элемент с классом ".modal .close" не найден');
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
      totalPrice = pizza.price; // Инициализируем цену
      openModal(pizza);
    });
  
    return card;
  }

  // Функция для открытия модального окна
  function openModal(pizza) {
    const modalPizzaName = document.getElementById('modalPizzaName');
    const modalPizzaDescription = document.getElementById('modalPizzaDescription');
    const modalPizzaImage = document.getElementById('modalPizzaImage');
    const ingredientsList = document.getElementById('ingredientsList');

    if (!modalPizzaName || !modalPizzaDescription || !modalPizzaImage || !ingredientsList) {
      console.error('Не найдены элементы модального окна (modalPizzaName, modalPizzaDescription, modalPizzaImage, ingredientsList)');
      return;
    }

    modalPizzaName.textContent = pizza.name;
    modalPizzaDescription.textContent = pizza.description;
    modalPizzaImage.src = pizza.photo || '';
    updatePrice();

    ingredientsList.innerHTML = '';

    ingredients.forEach(ingredient => {
      const ingredientDiv = document.createElement('div');
      ingredientDiv.className = 'ingredient-item';
      ingredientDiv.innerHTML = `
        <img src="${ingredient.photo}" alt="${ingredient.name}">
        <span>${ingredient.name}</span>
        <span>${ingredient.price} ₽</span>
        <input type="checkbox" data-price="${ingredient.price}" data-id="${ingredient.id}">
      `;
      ingredientDiv.querySelector('input').addEventListener('change', updatePrice);
      ingredientsList.appendChild(ingredientDiv);
    });

    modal.style.display = 'block';
  }

  // Функция для обновления цены
  function updatePrice() {
    if (!selectedPizza) return;

    let price = selectedPizza.price;

    // Учитываем размер
    if (selectedSize === 25) price -= 100; // Пример: -100 ₽ за 25 см
    if (selectedSize === 35) price += 100; // Пример: +100 ₽ за 35 см

   

    // Учитываем дополнительные ингредиенты
    const selectedIngredients = document.querySelectorAll('.ingredient-item input:checked');
    selectedIngredients.forEach(ingredient => {
      price += parseInt(ingredient.dataset.price);
    });

    totalPrice = price;
    const modalPizzaPrice = document.getElementById('modalPizzaPrice');
    if (modalPizzaPrice) {
      modalPizzaPrice.textContent = totalPrice;
    }
  }

  // Обработчик закрытия модального окна
  closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Закрытие модального окна при клике вне его
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
});