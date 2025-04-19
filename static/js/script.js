document.addEventListener('DOMContentLoaded', () => {
    const pizzaContainer = document.getElementById('pizzaContainer');
    const API_BASE_URL = 'http://localhost:8000'; // Базовая часть URL
    const PIZZAS_ENDPOINT = '/pizzas'; // Эндпоинт
    const API_URL = 'http://localhost:8000/pizzas'; // Полный URL
  
    fetch(API_URL)
      .then(response => {
        if (!response.ok) throw new Error('Ошибка загрузки данных');
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
  });
  
  // Функция createPizzaCard остаётся без изменений
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
  
    return card;
  }