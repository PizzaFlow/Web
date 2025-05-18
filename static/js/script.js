document.addEventListener('DOMContentLoaded', () => {
  const api = new ApiClient(); // Создаём экземпляр ApiClient
  const pizzaContainer = document.getElementById('pizzaContainer');
  const pizzaModal = document.getElementById('pizzaModal');
  const closePizzaModal = pizzaModal.querySelector('.close');
  const API_BASE_URL = 'http://localhost:8000';
  const PIZZAS_ENDPOINT = '/pizzas';
  const PIZZA_API_URL = API_BASE_URL + PIZZAS_ENDPOINT;
  const INGREDIENTS_ENDPOINT = '/ingredients';
  const INGREDIENTS_API_URL = API_BASE_URL + INGREDIENTS_ENDPOINT;
  const FAVORITES_ENDPOINT = '/users/favorite-pizzas';
  const FAVORITES_API_URL = API_BASE_URL + FAVORITES_ENDPOINT;

  let selectedPizza = null;
  let totalPrice = 0;
  let cart = [];
  let basePrice = 0;
  let selectedIngredients = new Set();
  let ingredients = [];
  let favoritePizzas = new Set();

  if (!pizzaContainer || !pizzaModal || !closePizzaModal) {
    console.error('Не найдены необходимые элементы DOM');
    return;
  }

  Promise.all([
    fetch(PIZZA_API_URL), // Эти запросы не требуют авторизации
    fetch(INGREDIENTS_API_URL),
    api.request(FAVORITES_ENDPOINT) // Используем ApiClient для запроса с токеном
      .catch(error => {
        console.warn(`Не удалось загрузить любимые пиццы: ${error.message}. Используется пустой список.`);
        return []; // Возвращаем пустой массив в случае ошибки
      })
  ])
    .then(async ([pizzaResponse, ingredientsResponse, favorites]) => {
      if (!pizzaResponse.ok) throw new Error(`Ошибка загрузки пицц: ${pizzaResponse.status} ${pizzaResponse.statusText}`);
      if (!ingredientsResponse.ok) throw new Error(`Ошибка загрузки ингредиентов: ${ingredientsResponse.status} ${ingredientsResponse.statusText}`);

      const [pizzas, ingr] = await Promise.all([
        pizzaResponse.json(),
        ingredientsResponse.json()
      ]);

      ingredients = ingr;
      favorites.forEach(pizza => favoritePizzas.add(pizza.id));
      pizzas.forEach((pizza, index) => {
        const card = createPizzaCard(pizza);
        card.style.animationDelay = `${index * 0.1}s`; // Анимация появления с задержкой
        pizzaContainer.appendChild(card);
      });
    })
    .catch(error => {
      console.error('Ошибка:', error);
      pizzaContainer.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-circle error-icon"></i><h3>Ошибка</h3><p>Не удалось загрузить меню. Подробности: ${error.message}</p></div>`;
    });

  function createPizzaCard(pizza) {
    const card = document.createElement('div');
    card.className = 'pizza-card';
    // Добавляем категорию для фильтрации (примерно определяем по названию/описанию)
    let category = 'all';
    if (pizza.name.toLowerCase().includes('острая') || pizza.description.toLowerCase().includes('острая')) {
      category = 'spicy';
    } else if (pizza.name.toLowerCase().includes('вегетарианская') || pizza.description.toLowerCase().includes('вегетарианская')) {
      category = 'vegetarian';
    } else {
      category = 'classic';
    }
    card.setAttribute('data-category', category);

    const image = pizza.photo 
      ? `<img src="${pizza.photo}" alt="${pizza.name}">` 
      : '<div class="no-image"><i class="fas fa-pizza-slice"></i> Нет фото</div>';

    const isFavorite = favoritePizzas.has(pizza.id);
    card.innerHTML = `
      <div class="pizza-image">
        ${image}
        <button class="favorite-button ${isFavorite ? 'favorited' : ''}" data-pizza-id="${pizza.id}">
          <i class="far fa-heart"></i>
        </button>
      </div>
      <div class="pizza-info">
        <h3>${pizza.name}</h3>
        <p class="pizza-description">${pizza.description}</p>
      </div>
      <div class="pizza-footer">
        <span class="pizza-price">от ${pizza.price} ₽</span>
        <button class="add-button">Выбрать</button>
      </div>
    `;

    card.querySelector('.add-button').addEventListener('click', () => {
      selectedPizza = pizza;
      basePrice = pizza.price;
      selectedIngredients.clear();
      pizza.ingredients.forEach(ingredient => selectedIngredients.add(ingredient.id));
      updatePrice();
      openPizzaModal(pizza);
    });

    const favoriteBtn = card.querySelector('.favorite-button');
    favoriteBtn.addEventListener('click', () => toggleFavorite(pizza.id, favoriteBtn));

    return card;
  }

  function toggleFavorite(pizzaId, button) {
    const isFavorite = favoritePizzas.has(pizzaId);
    const method = isFavorite ? 'DELETE' : 'POST';
    const endpoint = `${FAVORITES_ENDPOINT}/${pizzaId}`;

    api.request(endpoint, method) // Используем ApiClient для запроса с токеном
      .then(() => {
        if (isFavorite) {
          favoritePizzas.delete(pizzaId);
          button.classList.remove('favorited');
        } else {
          favoritePizzas.add(pizzaId);
          button.classList.add('favorited');
        }
      })
      .catch(error => {
        console.error('Ошибка:', error);
        alert(`Не удалось изменить статус избранного. Подробности: ${error.message}. Убедитесь, что вы авторизованы.`);
      });
  }

  function openPizzaModal(pizza) {
    const modalPizzaName = document.getElementById('modalPizzaName');
    const modalPizzaDescription = document.getElementById('modalPizzaDescription');
    const modalPizzaImage = document.getElementById('modalPizzaImage');
    const modalPizzaIngredients = document.getElementById('modalPizzaIngredients');
    const modalPizzaPrice = document.getElementById('modalPizzaPrice');
    const addToCartBtn = document.getElementById('addToCartBtn');
    const favoriteModalBtn = document.getElementById('favoriteModalBtn');

    if (!modalPizzaName || !modalPizzaDescription || !modalPizzaImage || !modalPizzaIngredients || !modalPizzaPrice || !addToCartBtn || !favoriteModalBtn) {
      console.error('Не найдены элементы модального окна пиццы');
      return;
    }

    modalPizzaName.textContent = pizza.name;
    modalPizzaDescription.textContent = pizza.description || "Классическая пицца с свежими томатами, моцареллой и базиликом для простого, но вкусного вкуса.";
    modalPizzaImage.src = pizza.photo || '/static/images/default-pizza.jpg';
    
    modalPizzaIngredients.innerHTML = '';
    const pizzaIngredients = pizza.ingredients || [];
    ingredients.forEach(ingredient => {
      const ingredientDiv = document.createElement('div');
      ingredientDiv.className = 'ingredient-item';
      const isDefault = pizzaIngredients.some(i => i.id === ingredient.id);
      if (isDefault) ingredientDiv.classList.add('default-ingredient');
      if (selectedIngredients.has(ingredient.id)) ingredientDiv.classList.add('selected');
      ingredientDiv.innerHTML = `
        <img src="${ingredient.photo}" alt="${ingredient.name}">
        <div class="ingredient-info">
          <span>${ingredient.name}</span>
          <span class="ingredient-price">${ingredient.price} ₽</span>
        </div>
      `;
      ingredientDiv.addEventListener('click', () => {
        if (selectedIngredients.has(ingredient.id)) {
          selectedIngredients.delete(ingredient.id);
          ingredientDiv.classList.remove('selected');
        } else {
          selectedIngredients.add(ingredient.id);
          ingredientDiv.classList.add('selected');
        }
        updatePrice();
      });
      modalPizzaIngredients.appendChild(ingredientDiv);
    });

    modalPizzaPrice.textContent = `${totalPrice} ₽`;

    const isFavorite = favoritePizzas.has(pizza.id);
    if (isFavorite) favoriteModalBtn.classList.add('favorited');
    favoriteModalBtn.addEventListener('click', () => toggleFavorite(pizza.id, favoriteModalBtn), { once: true });

    addToCartBtn.addEventListener('click', () => {
      pizzaModal.classList.remove('open');
      document.getElementById('overlay').style.display = 'none';
      document.body.style.overflow = 'auto';
      addToCart();
    }, { once: true });

    pizzaModal.classList.add('open');
    document.getElementById('overlay').style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  function addToCart() {
    if (!selectedPizza) {
      console.error('Пицца не выбрана');
      return;
    }

    const cartItem = {
      id: selectedPizza.id,
      pizza: selectedPizza.name,
      photo: selectedPizza.photo || '/static/images/default-pizza.jpg',
      ingredients: Array.from(selectedIngredients).map(id => {
        const ingredient = selectedPizza.ingredients.find(i => i.id === id) || ingredients.find(i => i.id === id);
        return ingredient ? { id: ingredient.id, name: ingredient.name, price: ingredient.price } : null;
      }).filter(item => item !== null),
      price: totalPrice
    };

    window.addToCart(cartItem);
  }

  function updatePrice() {
    if (!selectedPizza) return;

    totalPrice = basePrice;
    const defaultIngredients = selectedPizza.ingredients.map(i => i.id);

    selectedIngredients.forEach(ingredientId => {
      const ingredient = selectedPizza.ingredients.find(i => i.id === ingredientId) || ingredients.find(i => i.id === ingredientId);
      if (ingredient && !defaultIngredients.includes(ingredientId)) {
        totalPrice += ingredient.price;
      }
    });

    defaultIngredients.forEach(ingredientId => {
      if (!selectedIngredients.has(ingredientId)) {
        const ingredient = selectedPizza.ingredients.find(i => i.id === ingredientId);
        if (ingredient) {
          totalPrice -= ingredient.price;
        }
      }
    });

    const modalPizzaPrice = document.getElementById('modalPizzaPrice');
    if (modalPizzaPrice) modalPizzaPrice.textContent = `${totalPrice} ₽`;
  }

  closePizzaModal.addEventListener('click', () => {
    pizzaModal.classList.remove('open');
    document.getElementById('overlay').style.display = 'none';
    document.body.style.overflow = 'auto';
  });

  window.addEventListener('click', (event) => {
    if (event.target === pizzaModal) {
      pizzaModal.classList.remove('open');
      document.getElementById('overlay').style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });
});