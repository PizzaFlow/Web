class ApiClient {
    constructor(baseURL = 'http://localhost:8000') {
      this.baseURL = baseURL;
      this.token = localStorage.getItem('authToken') || null;
      this.pizzas = [];
      this.ingredients = [];
      this.favoritePizzas = [];
      this.pizzaIngredients = [];
      this.addresses = [];
      this.orders = [];
      this.selectedAddress = null;
      this.currentOrder = null;
      this.currentUser = null;
      this.fetchAddresses(); // Инициализация адресов, как в Swift
    }
  
    // Вспомогательный метод для выполнения запросов
    async request(endpoint, method = 'GET', body = null, headers = {}) {
      const url = `${this.baseURL}${endpoint}`;
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : null,
      };
  
      if (this.token) {
        options.headers['Authorization'] = `Bearer ${this.token}`;
      }
  
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`Ошибка сервера: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error(`Ошибка при запросе к ${url}:`, error);
        throw error;
      }
    }
  
    // Перемещение пиццы в начало списка
    movePizzaToTop(pizza) {
      this.pizzas = this.pizzas.filter(p => p.id !== pizza.id);
      this.pizzas.unshift(pizza);
    }
  
    // Перемещение пиццы из избранного в основной список
    movePizzaToMainList(pizza) {
      this.favoritePizzas = this.favoritePizzas.filter(p => p.id !== pizza.id);
      this.pizzas.push(pizza);
    }
  
    // Получение списка пицц
    async fetchPizzas() {
      console.log("🔄 Вызван fetchPizzas()");
      const data = await this.request('/pizzas');
      this.pizzas = data;
      console.log(`✅ Загружено ${this.pizzas.length} пицц`);
      return data;
    }
  
    // Получение списка заказов
    async fetchOrders() {
      if (!this.token) throw new Error('Токен отсутствует');
      const data = await this.request('/users/orders/');
      this.orders = data;
      return data;
    }
  
    // Получение списка адресов
    async fetchAddresses() {
      if (!this.token) return;
      const data = await this.request('/users/address/');
      this.addresses = data;
      if (!this.selectedAddress && data.length > 0) {
        this.selectedAddress = data[0];
      }
      console.log("Полученные адреса:", data);
      return data;
    }
  
    // Добавление нового адреса
    async addAddress(city, street, house, apartment, callback) {
      if (!this.token) {
        callback(false, "Нет токена");
        return;
      }
      const addressData = { city, street, house, apartment };
      try {
        await this.request('/users/address/', 'POST', addressData);
        console.log("✅ Адрес успешно добавлен!");
        await this.fetchAddresses();
        callback(true, null);
      } catch (error) {
        callback(false, error.message);
      }
    }
  
    // Удаление адреса
    async deleteAddress(addressID) {
      if (!this.token) throw new Error('Токен отсутствует');
      await this.request(`/users/address/${addressID}`, 'DELETE');
      this.addresses = this.addresses.filter(addr => addr.id !== addressID);
      console.log("✅ Адрес успешно удалён!");
    }
  
    // Создание заказа
    async createOrder(orderData) {
      if (!this.token) throw new Error('Токен отсутствует');
      const data = await this.request('/orders/', 'POST', orderData);
      this.currentOrder = data;
      return data;
    }
  
    // Получение списка ингредиентов
    async fetchAllIngredients() {
      const data = await this.request('/ingredients');
      this.ingredients = data;
      return data;
    }
  
    // Получение избранных пицц
    async fetchFavoritePizzas(callback) {
      if (!this.token) {
        callback(false, "Токен отсутствует");
        return;
      }
      try {
        const data = await this.request('/users/favorite-pizzas/');
        this.favoritePizzas = data;
        callback(true, null);
      } catch (error) {
        callback(false, error.message);
      }
    }
  
    // Получение времени доставки
    async fetchDeliveryTimes() {
      if (!this.token) throw new Error('Токен отсутствует');
      return await this.request('/orders/delivery-times/');
    }
  
    // Добавление пиццы в избранное
    async addPizzaToFavorites(pizzaID, callback) {
      if (!this.token) throw new Error('Токен отсутствует');
      await this.request(`/users/favorite-pizzas/${pizzaID}`, 'POST');
      this.fetchFavoritePizzas(callback);
    }
  
    // Удаление пиццы из избранного
    async removePizzaFromFavorites(pizzaID, callback) {
      if (!this.token) throw new Error('Токен отсутствует');
      await this.request(`/users/favorite-pizzas/${pizzaID}`, 'DELETE');
      callback(true, null);
    }
  
    // Регистрация пользователя
    async register(email, password, callback) {
      try {
        await this.request('/auth/register', 'POST', { email, password });
        this.currentUser = { id: 0, username: "", phone_number: "", email: "" };
        callback(true, null);
      } catch (error) {
        callback(false, error.message);
      }
    }
  
    // Обновление профиля пользователя
    async updateUserProfile({ username, phoneNumber, currentPassword, newPassword }) {
      if (!this.token) throw new Error('Токен отсутствует');
      const requestBody = {};
      if (username) requestBody.username = username;
      if (phoneNumber) requestBody.phone_number = phoneNumber;
      if (newPassword) {
        requestBody.current_password = currentPassword;
        requestBody.new_password = newPassword;
      }
      const data = await this.request('/users/me', 'PATCH', requestBody);
      this.currentUser = data;
      return data;
    }
  
    // Получение текущего пользователя
    async fetchCurrentUser(callback) {
      if (!this.token) {
        callback(new Error('Токен отсутствует'));
        return;
      }
      try {
        const data = await this.request('/users/me');
        this.currentUser = data;
        callback(null, data);
      } catch (error) {
        callback(error);
      }
    }
  
    // Вход в систему
    async login(email, password, callback) {
      try {
        const data = await this.request('/auth/login', 'POST', { email, password });
        this.token = data.access_token;
        localStorage.setItem('authToken', this.token);
        await this.fetchCurrentUser((err, user) => {
          if (err) callback(false, err.message);
          else callback(true, null);
        });
      } catch (error) {
        callback(false, error.message);
      }
    }
  
    // Выход из системы
    logout() {
      this.token = null;
      this.currentUser = null;
      localStorage.removeItem('authToken');
    }
  
    // Проверка пароля
    async verifyPassword(password) {
      if (!this.token) throw new Error('Токен отсутствует');
      const data = await this.request('/auth/verify-password', 'POST', { password });
      return data.isValid;
    }
  }
  
  // Пример использования
  const api = new ApiClient();
  api.fetchPizzas().then(() => console.log(api.pizzas));
  api.login('user@example.com', 'password', (success, error) => {
    console.log(success ? 'Успешный вход' : `Ошибка: ${error}`);
  });