// ========== API КЛИЕНТ ==========
const API = {
    async request(url, options = {}) {
        try {
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
            console.error(`API error ${url}:`, error);
            throw error;
        }
    },
    
    // Товары
    async getProducts() {
        return await this.request('/api/products');
    },
    
    async getProduct(id) {
        return await this.request(`/api/products/${id}`);
    },
    
    async createProduct(product) {
        return await this.request('/api/products', {
            method: 'POST',
            body: JSON.stringify(product)
        });
    },
    
    async updateProduct(id, product) {
        return await this.request(`/api/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(product)
        });
    },
    
    async deleteProduct(id) {
        return await this.request(`/api/products/${id}`, {
            method: 'DELETE'
        });
    },
    
    // Товары на модерации
    async getPendingProducts() {
        return await this.request('/api/pending-products');
    },
    
async createPendingProduct(product) {
    return await this.request('/api/pending-products', {
        method: 'POST',
        body: JSON.stringify(product)
    });
},
    
    async approveProduct(id) {
        return await this.request(`/api/approve-product/${id}`, {
            method: 'POST'
        });
    },
    
    async rejectProduct(id) {
        return await this.request(`/api/pending-products/${id}`, {
            method: 'DELETE'
        });
    },
    
    // Ключевые слова
    async getKeywords() {
        return await this.request('/api/keywords');
    },
    
    async createKeyword(keyword) {
        return await this.request('/api/keywords', {
            method: 'POST',
            body: JSON.stringify(keyword)
        });
    },
    
    async deleteKeyword(id) {
        return await this.request(`/api/keywords/${id}`, {
            method: 'DELETE'
        });
    },
    
    // Блоки игр
    async getGameBlocks() {
        return await this.request('/api/game-blocks');
    },
    
    async createGameBlock(block) {
        return await this.request('/api/game-blocks', {
            method: 'POST',
            body: JSON.stringify(block)
        });
    },
    
    async updateGameBlock(id, block) {
        return await this.request(`/api/game-blocks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(block)
        });
    },
    
    async deleteGameBlock(id) {
        return await this.request(`/api/game-blocks/${id}`, {
            method: 'DELETE'
        });
    },
    
    // Блоки приложений
    async getAppBlocks() {
        return await this.request('/api/app-blocks');
    },
    
    async createAppBlock(block) {
        return await this.request('/api/app-blocks', {
            method: 'POST',
            body: JSON.stringify(block)
        });
    },
    
    async updateAppBlock(id, block) {
        return await this.request(`/api/app-blocks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(block)
        });
    },
    
    async deleteAppBlock(id) {
        return await this.request(`/api/app-blocks/${id}`, {
            method: 'DELETE'
        });
    },
    
    // Администраторы
    async getAdmins() {
        return await this.request('/api/admins');
    },
    
    // Тест
    async test() {
        return await this.request('/api/test');
    }
};

window.API = API;
console.log('✅ API client loaded');