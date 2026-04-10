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
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || `HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API error ${url}:`, error);
            throw error;
        }
    },
    
    // ========== ТОВАРЫ ==========
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
    
    // ========== ТОВАРЫ НА МОДЕРАЦИИ ==========
    async getPendingProducts() {
        return await this.request('/api/pending-products');
    },
    
    async createPendingProduct(product) {
        console.log('📤 Отправка товара на модерацию:', product);
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
    
    // ========== КЛЮЧЕВЫЕ СЛОВА ==========
    async getKeywords() {
        return await this.request('/api/keywords');
    },
    
    async createKeyword(keyword) {
        return await this.request('/api/keywords', {
            method: 'POST',
            body: JSON.stringify(keyword)
        });
    },
    
    async updateKeyword(id, data) {
        return await this.request(`/api/keywords/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    async deleteKeyword(id) {
        return await this.request(`/api/keywords/${id}`, {
            method: 'DELETE'
        });
    },
    
    // ========== БЛОКИ ИГР ==========
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
    
    // ========== БЛОКИ ПРИЛОЖЕНИЙ ==========
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
    
    // ========== АДМИНИСТРАТОРЫ ==========
    async getAdmins() {
        return await this.request('/api/admins');
    },
    
    async createAdmin(admin) {
        return await this.request('/api/admins', {
            method: 'POST',
            body: JSON.stringify(admin)
        });
    },
    
    async deleteAdmin(id) {
        return await this.request(`/api/admins/${id}`, {
            method: 'DELETE'
        });
    },
    
    // ========== ТЕСТ ==========
    async test() {
        return await this.request('/api/test');
    }
};

window.API = API;
console.log('✅ API client loaded');