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

// ========== СОЗДАНИЕ ТАБЛИЦ ==========
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
        console.log('✅ Таблица products создана');

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
        console.log('✅ Таблица pending_products создана');

        // Таблица ключевых слов
        await pool.query(`
            CREATE TABLE IF NOT EXISTS keywords (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT
            )
        `);
        console.log('✅ Таблица keywords создана');

        // Таблица игр
        await pool.query(`
            CREATE TABLE IF NOT EXISTS game_blocks (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                keyword_id TEXT,
                icon TEXT,
                image_url TEXT,
                sort_order INTEGER DEFAULT 0
            )
        `);
        console.log('✅ Таблица game_blocks создана');

        // Таблица приложений
        await pool.query(`
            CREATE TABLE IF NOT EXISTS app_blocks (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                keyword_id TEXT,
                icon TEXT,
                image_url TEXT,
                sort_order INTEGER DEFAULT 0
            )
        `);
        console.log('✅ Таблица app_blocks создана');

        // Таблица администраторов
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                is_owner BOOLEAN DEFAULT FALSE,
                hired_by TEXT,
                hired_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Таблица admins создана');

        // Добавляем начальные данные
        const keywordsCount = await pool.query('SELECT COUNT(*) FROM keywords');
        if (parseInt(keywordsCount.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO keywords (id, name, type) VALUES
                ('1', 'Steam', 'Premium'),
                ('2', 'Discord', 'Nitro'),
                ('3', 'Netflix', '4K')
            `);
            console.log('✅ Начальные ключевые слова добавлены');
        }

        const gamesCount = await pool.query('SELECT COUNT(*) FROM game_blocks');
        if (parseInt(gamesCount.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO game_blocks (id, name, icon, sort_order) VALUES
                ('1', 'Roblox', 'fab fa-fort-awesome', 1),
                ('2', 'Valorant', 'fas fa-crosshairs', 2),
                ('3', 'Minecraft', 'fas fa-cube', 3)
            `);
            console.log('✅ Начальные игры добавлены');
        }

        const adminsCount = await pool.query('SELECT COUNT(*) FROM admins');
        if (parseInt(adminsCount.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO admins (id, username, is_owner, hired_by) VALUES
                ('1', 'Admin', TRUE, 'system')
            `);
            console.log('✅ Начальный администратор добавлен');
        }

        console.log('✅ Все таблицы созданы!');
    } catch (error) {
        console.error('❌ Ошибка создания таблиц:', error.message);
    }
}

// ==================== API ЭНДПОИНТЫ ====================

app.get('/api/products', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Товар не найден' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const product = { id: Date.now().toString(), ...req.body, sales: 0, created_at: new Date() };
        await pool.query(
            `INSERT INTO products (id, title, price, seller, keyword, image_url, description, discount, original_price, type, contact, sales, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [product.id, product.title, product.price, product.seller, product.keyword, product.image_url, 
             product.description, product.discount, product.original_price, product.type, product.contact, product.sales, product.created_at]
        );
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/pending-products', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM pending_products ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/pending-products', async (req, res) => {
    try {
        const product = { id: Date.now().toString(), ...req.body, created_at: new Date() };
        await pool.query(
            `INSERT INTO pending_products (id, title, price, seller, keyword, image_url, description, discount, original_price, type, contact, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [product.id, product.title, product.price, product.seller, product.keyword, product.image_url, 
             product.description, product.discount, product.original_price, product.type, product.contact, product.created_at]
        );
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/pending-products/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM pending_products WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/approve-product/:id', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM pending_products WHERE id = $1', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Товар не найден' });
        
        const product = rows[0];
        await pool.query(
            `INSERT INTO products (id, title, price, seller, keyword, image_url, description, discount, original_price, type, contact, sales, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [product.id, product.title, product.price, product.seller, product.keyword, product.image_url, 
             product.description, product.discount, product.original_price, product.type, product.contact, 0, product.created_at]
        );
        await pool.query('DELETE FROM pending_products WHERE id = $1', [req.params.id]);
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/keywords', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM keywords ORDER BY name');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/keywords', async (req, res) => {
    try {
        const keyword = { id: Date.now().toString(), ...req.body };
        await pool.query('INSERT INTO keywords (id, name, type) VALUES ($1, $2, $3)', 
            [keyword.id, keyword.name, keyword.type || 'Стандарт']);
        res.json(keyword);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/keywords/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM keywords WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/game-blocks', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM game_blocks ORDER BY sort_order');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/app-blocks', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM app_blocks ORDER BY sort_order');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admins', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM admins ORDER BY hired_at');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/test', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', database: 'PostgreSQL подключена ✅' });
    } catch (error) {
        res.json({ status: 'error', database: 'PostgreSQL НЕ подключена ❌', error: error.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========== ЗАПУСК ==========
const PORT = process.env.PORT || 3000;

async function startServer() {
    await initTables();
    app.listen(PORT, () => {
        console.log(`🚀 Сервер запущен на порту ${PORT}`);
        console.log(`📍 http://localhost:${PORT}`);
    });
}

startServer();