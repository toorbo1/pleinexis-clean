const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// ========== ПОДКЛЮЧЕНИЕ К POSTGRESQL ==========
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Создание таблиц при запуске
async function initTables() {
    try {
        // Таблица товаров
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                price TEXT NOT NULL,
                seller TEXT NOT NULL,
                keyword TEXT,
                image_url TEXT,
                description TEXT,
                discount TEXT,
                original_price TEXT,
                type TEXT,
                contact TEXT,
                sales INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Таблица товаров на модерации
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pending_products (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                price TEXT NOT NULL,
                seller TEXT NOT NULL,
                keyword TEXT,
                image_url TEXT,
                description TEXT,
                discount TEXT,
                original_price TEXT,
                type TEXT,
                contact TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Таблица ключевых слов
        await pool.query(`
            CREATE TABLE IF NOT EXISTS keywords (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT
            )
        `);

        // Добавляем начальные ключевые слова, если таблица пуста
        const { rows } = await pool.query('SELECT COUNT(*) FROM keywords');
        if (parseInt(rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO keywords (id, name, type) VALUES
                ('1', 'Steam', 'Premium'),
                ('2', 'Discord', 'Nitro'),
                ('3', 'Netflix', '4K'),
                ('4', 'Spotify', 'Premium'),
                ('5', 'YouTube', 'Premium'),
                ('6', 'Telegram', 'Premium'),
                ('7', 'TikTok', 'Premium'),
                ('8', 'Instagram', 'Business')
            `);
            console.log('✅ Начальные ключевые слова добавлены');
        }

        console.log('✅ Все таблицы созданы');
    } catch (error) {
        console.error('Ошибка создания таблиц:', error.message);
    }
}

initTables();

// ==================== ТОВАРЫ ====================

// Получить все товары
app.get('/api/products', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM products ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error('GET /api/products error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Получить один товар
app.get('/api/products/:id', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM products WHERE id = $1',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Товар не найден' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('GET /api/products/:id error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Создать товар
app.post('/api/products', async (req, res) => {
    try {
        const product = {
            id: Date.now().toString(),
            ...req.body,
            created_at: new Date()
        };
        
        await pool.query(
            `INSERT INTO products (id, title, price, seller, keyword, image_url, description, discount, original_price, type, contact, sales, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
                product.id, product.title, product.price, product.seller,
                product.keyword, product.image_url, product.description,
                product.discount, product.original_price, product.type,
                product.contact, 0, product.created_at
            ]
        );
        
        res.json(product);
    } catch (error) {
        console.error('POST /api/products error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Удалить товар
app.delete('/api/products/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/products/:id error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==================== ТОВАРЫ НА МОДЕРАЦИИ ====================

app.get('/api/pending-products', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM pending_products ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error('GET /api/pending-products error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/pending-products', async (req, res) => {
    try {
        const product = {
            id: Date.now().toString(),
            ...req.body,
            created_at: new Date()
        };
        
        await pool.query(
            `INSERT INTO pending_products (id, title, price, seller, keyword, image_url, description, discount, original_price, type, contact, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
                product.id, product.title, product.price, product.seller,
                product.keyword, product.image_url, product.description,
                product.discount, product.original_price, product.type,
                product.contact, product.created_at
            ]
        );
        
        res.json(product);
    } catch (error) {
        console.error('POST /api/pending-products error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/pending-products/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM pending_products WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/pending-products/:id error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/approve-product/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Получаем из pending
        const { rows } = await pool.query(
            'SELECT * FROM pending_products WHERE id = $1',
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Товар не найден' });
        }
        
        const product = rows[0];
        
        // Добавляем в products
        await pool.query(
            `INSERT INTO products (id, title, price, seller, keyword, image_url, description, discount, original_price, type, contact, sales, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
                product.id, product.title, product.price, product.seller,
                product.keyword, product.image_url, product.description,
                product.discount, product.original_price, product.type,
                product.contact, 0, product.created_at
            ]
        );
        
        // Удаляем из pending
        await pool.query('DELETE FROM pending_products WHERE id = $1', [id]);
        
        res.json(product);
    } catch (error) {
        console.error('POST /api/approve-product/:id error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==================== КЛЮЧЕВЫЕ СЛОВА ====================

app.get('/api/keywords', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM keywords ORDER BY name');
        res.json(rows);
    } catch (error) {
        console.error('GET /api/keywords error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/keywords', async (req, res) => {
    try {
        const keyword = {
            id: Date.now().toString(),
            ...req.body
        };
        
        await pool.query(
            'INSERT INTO keywords (id, name, type) VALUES ($1, $2, $3)',
            [keyword.id, keyword.name, keyword.type || 'Стандарт']
        );
        
        res.json(keyword);
    } catch (error) {
        console.error('POST /api/keywords error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/keywords/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM keywords WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/keywords/:id error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==================== ТЕСТОВЫЙ ЭНДПОИНТ ====================
app.get('/api/test', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ 
            status: 'ok', 
            database: 'PostgreSQL подключена ✅',
            message: 'Сервер работает!'
        });
    } catch (error) {
        res.json({ 
            status: 'error', 
            database: 'PostgreSQL НЕ подключена ❌',
            error: error.message
        });
    }
});

// ==================== ФРОНТЕНД ====================
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== ЗАПУСК ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { 
    console.log(`🚀 Сервер запущен на порту ${PORT}`); 
    console.log(`📍 http://localhost:${PORT}`);
});