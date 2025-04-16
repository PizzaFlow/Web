class ApiClient {
    constructor() {
      this.baseURL = "http://localhost:8000";
      this.token = localStorage.getItem("authToken") || null;
      this.pizzas = [];
      this.ingredients = [];
      this.favoritePizzas = [];
      this.addresses = [];
      this.orders = [];
      this.selectedAddress = null;
      this.currentOrder = null;
      this.currentUser = null;
      
      if (this.token) {
        this.fetchAddresses();
      }
    }

    async _fetchData(url, method = 'GET', body = null) {
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
      
      const options = {
        method,
        headers,
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }
      
      try {
        const response = await fetch(`${this.baseURL}${url}`, options);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    }

    async fetchPizzas() {
      try {
        this.pizzas = await this._fetchData('/pizzas');
        console.log('Pizzas loaded:', this.pizzas.length);
        return this.pizzas;
      } catch (error) {
        console.error('Failed to fetch pizzas:', error);
        throw error;
      }
    }

    async fetchFavoritePizzas() {
      try {
        this.favoritePizzas = await this._fetchData('/users/favorite-pizzas/');
        return this.favoritePizzas;
      } catch (error) {
        console.error('Failed to fetch favorite pizzas:', error);
        throw error;
      }
    }
  
    async addPizzaToFavorites(pizzaId) {
      try {
        await this._fetchData(`/users/favorite-pizzas/${pizzaId}`, 'POST');
        await this.fetchFavoritePizzas(); 
        return true;
      } catch (error) {
        console.error('Failed to add pizza to favorites:', error);
        throw error;
      }
    }
  
    async removePizzaFromFavorites(pizzaId) {
      try {
        await this._fetchData(`/users/favorite-pizzas/${pizzaId}`, 'DELETE');
        await this.fetchFavoritePizzas();
        return true;
      } catch (error) {
        console.error('Failed to remove pizza from favorites:', error);
        throw error;
      }
    }

    async fetchAddresses() {
      try {
        this.addresses = await this._fetchData('/users/address/');
        if (!this.selectedAddress && this.addresses.length > 0) {
          this.selectedAddress = this.addresses[0];
        }
        return this.addresses;
      } catch (error) {
        console.error('Failed to fetch addresses:', error);
        throw error;
      }
    }
  
    async addAddress({ city, street, house, apartment }) {
      try {
        await this._fetchData('/users/address/', 'POST', {
          city, street, house, apartment
        });
        await this.fetchAddresses(); // Обновляем список адресов
        return true;
      } catch (error) {
        console.error('Failed to add address:', error);
        throw error;
      }
    }
  
    async deleteAddress(addressId) {
      try {
        await this._fetchData(`/users/address/${addressId}`, 'DELETE');
        this.addresses = this.addresses.filter(addr => addr.id !== addressId);
        return true;
      } catch (error) {
        console.error('Failed to delete address:', error);
        throw error;
      }
    }

    async fetchOrders() {
      try {
        this.orders = await this._fetchData('/users/orders/');
        return this.orders;
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        throw error;
      }
    }
  
    async createOrder(orderData) {
      try {
        const order = await this._fetchData('/orders/', 'POST', orderData);
        this.currentOrder = order;
        return order;
      } catch (error) {
        console.error('Failed to create order:', error);
        throw error;
      }
    }

    async login(email, password) {
      try {
        const response = await this._fetchData('/auth/login', 'POST', {
          email, password
        });
        
        this.token = response.access_token;
        localStorage.setItem('authToken', this.token);
        
        await this.fetchCurrentUser();
        return true;
      } catch (error) {
        console.error('Login failed:', error);
        this.token = null;
        localStorage.removeItem('authToken');
        throw error;
      }
    }
  
    async register(email, password) {
      try {
        await this._fetchData('/auth/register', 'POST', {
          email, password
        });
        return true;
      } catch (error) {
        console.error('Registration failed:', error);
        throw error;
      }
    }
  
    logout() {
      this.token = null;
      this.currentUser = null;
      localStorage.removeItem('authToken');
    }
  
    async fetchCurrentUser() {
      try {
        this.currentUser = await this._fetchData('/users/me');
        return this.currentUser;
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        this.currentUser = null;
        throw error;
      }
    }
  
    async updateUserProfile({ username, phoneNumber, currentPassword, newPassword }) {
      const updateData = {};
      
      if (username) updateData.username = username;
      if (phoneNumber) updateData.phone_number = phoneNumber;
      if (newPassword) {
        updateData.current_password = currentPassword;
        updateData.new_password = newPassword;
      }
      
      try {
        this.currentUser = await this._fetchData('/users/me', 'PATCH', updateData);
        return this.currentUser;
      } catch (error) {
        console.error('Failed to update user profile:', error);
        throw error;
      }
    }

    async fetchAllIngredients() {
      try {
        this.ingredients = await this._fetchData('/ingredients');
        return this.ingredients;
      } catch (error) {
        console.error('Failed to fetch ingredients:', error);
        throw error;
      }
    }
  
    async fetchDeliveryTimes() {
      try {
        const response = await this._fetchData('/orders/delivery-times/');
        return response.deliveryTimes.map(time => ({ timeRange: time, day: 'today' }));
      } catch (error) {
        console.error('Failed to fetch delivery times:', error);
        throw error;
      }
    }
  }
 
  export const apiClient = new ApiClient();