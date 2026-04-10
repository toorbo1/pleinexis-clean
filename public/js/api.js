// ========== API КЛИЕНТ ==========

const API = {
    async request(url, options = {}) {
        try {
            console.log(`🌐 API request: ${options.method || 'GET'} ${url}`);
            
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API error:`, error);
            throw error;
        }
    },
    
    // Получить все одобренные товары
    async getProducts() {
        try {
            const products = await this.request('/api/products');
            return Array.isArray(products) ? products : [];
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    },
    
    // Создать товар (админ - сразу, пользователь - на модерацию)
    async createProduct(product, isAdmin = false) {
        if (isAdmin) {
            return await this.request('/api/products', {
                method: 'POST',
                body: JSON.stringify(product)
            });
        } else {
            return await this.request('/api/pending-products', {
                method: 'POST',
                body: JSON.stringify(product)
            });
        }
    },
    
    // Удалить товар
    async deleteProduct(id) {
        return await this.request(`/api/products/${id}`, {
            method: 'DELETE'
        });
    },
    
    // Получить товары на модерации (только админ)
    async getPendingProducts() {
        try {
            return await this.request('/api/pending-products');
        } catch (error) {
            return [];
        }
    },
    
    // Одобрить товар (только админ)
    async approveProduct(id) {
        return await this.request(`/api/approve-product/${id}`, {
            method: 'POST'
        });
    },
    
    // Отклонить товар (только админ)
    async rejectProduct(id) {
        return await this.request(`/api/pending-products/${id}`, {
            method: 'DELETE'
        });
    },
    
    // Получить ключевые слова
    async getKeywords() {
        try {
            return await this.request('/api/keywords');
        } catch (error) {
            return [];
        }
    },
    
    // Создать ключевое слово
    async createKeyword(keyword) {
        return await this.request('/api/keywords', {
            method: 'POST',
            body: JSON.stringify(keyword)
        });
    },
    
    // Удалить ключевое слово
    async deleteKeyword(id) {
        return await this.request(`/api/keywords/${id}`, {
            method: 'DELETE'
        });
    },
    
    // Проверка соединения
    async testConnection() {
        try {
            return await this.request('/api/test-db');
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

window.API = API;
console.log('✅ API client loaded');