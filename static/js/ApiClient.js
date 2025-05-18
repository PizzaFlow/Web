class ApiClient {
  constructor(baseURL = 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('authToken') || null;
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
      console.log(`Отправка запроса: ${method} ${url}`, options);
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка сервера: ${response.status}, Текст: ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        console.error('Возможная проблема с CORS или сервер недоступен:', url);
        throw new Error('Не удалось выполнить запрос. Проверьте, что сервер запущен и настроен CORS для http://127.0.0.1:5500');
      }
      console.error(`Ошибка при запросе к ${url}:`, error);
      throw error;
    }
  }

  // Регистрация пользователя
  async register(email, password, callback) {
    try {
      const data = await this.request('/auth/register', 'POST', { email, password });
      callback(true, null);
    } catch (error) {
      callback(false, error.message);
    }
  }

  // Вход в систему
  async login(email, password, callback) {
    try {
      const data = await this.request('/auth/login', 'POST', { email, password });
      this.token = data.access_token;
      localStorage.setItem('authToken', this.token);
      callback(true, null);
    } catch (error) {
      callback(false, error.message);
    }
  }

  // Выход из системы
  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Получение текущего пользователя
  async fetchCurrentUser(callback) {
    if (!this.token) {
      callback(new Error('Токен отсутствует'));
      return;
    }
    try {
      const data = await this.request('/users/me');
      callback(null, data); 
    } catch (error) {
      callback(error);
    }
  }

  // Обновление профиля пользователя
  async updateUserProfile({ username, password, phone_number }, callback) {
    if (!this.token) {
      callback(new Error('Токен отсутствует'));
      return;
    }
    const requestBody = {};
    if (username) requestBody.username = username;
    if (password) requestBody.password = password;
    if (phone_number) requestBody.phone_number = phone_number;
    try {
      const data = await this.request('/users/me', 'PATCH', requestBody);
      callback(null, data);
    } catch (error) {
      callback(error);
    }
  }
}