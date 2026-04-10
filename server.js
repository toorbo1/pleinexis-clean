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

// ========== СОЗДАНИЕ ВСЕХ ТАБЛИЦ ==========
async function initTables() {
    try {
        // 1. Таблица товаров
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

        // 2. Таблица товаров на модерации
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

        // 3. Таблица ключевых слов
        await pool.query(`
            CREATE TABLE IF NOT EXISTS keywords (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT
            )
        `);
        console.log('✅ Таблица keywords создана');

        // 4. Таблица игр (game_blocks)
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

        // 5. Таблица приложений (app_blocks)
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

        // 6. Таблица администраторов
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

        // 7. Таблица диалогов поддержки
        await pool.query(`
            CREATE TABLE IF NOT EXISTS support_dialogs (
                id TEXT PRIMARY KEY,
                user_name TEXT NOT NULL,
                user_id TEXT,
                last_message_time TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Таблица support_dialogs создана');

        // 8. Таблица сообщений
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                dialog_id TEXT NOT NULL,
                sender TEXT NOT NULL,
                text TEXT NOT NULL,
                time TEXT,
                timestamp TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Таблица messages создана');

        // 9. Таблица заявок на вывод средств
        await pool.query(`
            CREATE TABLE IF NOT EXISTS withdraw_requests (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                method TEXT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                commission DECIMAL(10,2) DEFAULT 0,
                total DECIMAL(10,2) NOT NULL,
                details TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                date TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Таблица withdraw_requests создана');

        // ========== ДОБАВЛЕНИЕ НАЧАЛЬНЫХ ДАННЫХ ==========

        // Добавляем ключевые слова, если таблица пуста
        const keywordsCount = await pool.query('SELECT COUNT(*) FROM keywords');
        if (parseInt(keywordsCount.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO keywords (id, name, type) VALUES
                ('1', 'Steam', 'Premium'),
                ('2', 'Discord', 'Nitro'),
                ('3', 'Netflix', '4K'),
                ('4', 'Spotify', 'Premium'),
                ('5', 'YouTube', 'Premium'),
                ('6', 'Telegram', 'Premium'),
                ('7', 'TikTok', 'Premium'),
                ('8', 'Instagram', 'Business'),
                ('9', 'Roblox', 'Robux'),
                ('10', 'Valorant', 'VP')
            `);
            console.log('✅ Начальные ключевые слова добавлены');
        }

        // Добавляем игры, если таблица пуста
        const gamesCount = await pool.query('SELECT COUNT(*) FROM game_blocks');
        if (parseInt(gamesCount.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO game_blocks (id, name, icon, sort_order) VALUES
                ('1', 'Другие игры', 'fas fa-gamepad', 1),
                ('2', 'Roblox', 'fab fa-fort-awesome', 2),
                ('3', 'Valorant', 'fas fa-crosshairs', 3),
                ('4', 'Minecraft', 'fas fa-cube', 4),
                ('5', 'Counter-Strike', 'fas fa-skull', 5),
                ('6', 'Arena Breakout', 'fas fa-crosshairs', 6),
                ('7', 'Rust', 'fas fa-tree', 7),
                ('8', 'PUBG', 'fas fa-plane', 8),
                ('9', 'Crimson Desert', 'fas fa-dragon', 9),
                ('10', 'Танки', 'fas fa-tank', 10)
            `);
            console.log('✅ Начальные игры добавлены');
        }

        // Добавляем приложения, если таблица пуста
        const appsCount = await pool.query('SELECT COUNT(*) FROM app_blocks');
        if (parseInt(appsCount.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO app_blocks (id, name, icon, sort_order) VALUES
                ('1', 'Telegram', 'fab fa-telegram', 1),
                ('2', 'WhatsApp', 'fab fa-whatsapp', 2),
                ('3', 'Instagram', 'fab fa-instagram', 3),
                ('4', 'TikTok', 'fab fa-tiktok', 4),
                ('5', 'YouTube', 'fab fa-youtube', 5),
                ('6', 'Spotify', 'fab fa-spotify', 6),
                ('7', 'Netflix', 'fas fa-tv', 7),
                ('8', 'Discord', 'fab fa-discord', 8)
            `);
            console.log('✅ Начальные приложения добавлены');
        }

        // Добавляем администратора, если таблица пуста
        const adminsCount = await pool.query('SELECT COUNT(*) FROM admins');
        if (parseInt(adminsCount.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO admins (id, username, is_owner, hired_by) VALUES
                ('1', 'Admin', TRUE, 'system')
            `);
            console.log('✅ Начальный администратор добавлен');
        }

        console.log('✅ Все таблицы созданы и заполнены начальными данными!');
    } catch (error) {
        console.error('❌ Ошибка создания таблиц:', error.message);
    }
}

// Запускаем создание таблиц
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

// Создать товар (админ)
app.post('/api/products', async (req, res) => {
    try {
        const product = {
            id: Date.now().toString(),
            ...req.body,
            sales: 0,
            created_at: new Date()
        };
        
        await pool.query(
            `INSERT INTO products (id, title, price, seller, keyword, image_url, description, discount, original_price, type, contact, sales, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
                product.id, product.title, product.price, product.seller,
                product.keyword, product.image_url, product.description,
                product.discount, product.original_price, product.type,
                product.contact, product.sales, product.created_at
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

// Обновить товар
app.put('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const fields = req.body;
        const setClause = Object.keys(fields).map((key, i) => `${key} = $${i + 2}`).join(', ');
        const values = [id, ...Object.values(fields)];
        
        await pool.query(
            `UPDATE products SET ${setClause} WHERE id = $1`,
            values
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('PUT /api/products/:id error:', error.message);
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
        
        const { rows } = await pool.query(
            'SELECT * FROM pending_products WHERE id = $1',
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Товар не найден' });
        }
        
        const product = rows[0];
        
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

// ==================== ИГРЫ ====================

app.get('/api/game-blocks', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM game_blocks ORDER BY sort_order'
        );
        res.json(rows);
    } catch (error) {
        console.error('GET /api/game-blocks error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==================== ПРИЛОЖЕНИЯ ====================

app.get('/api/app-blocks', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM app_blocks ORDER BY sort_order'
        );
        res.json(rows);
    } catch (error) {
        console.error('GET /api/app-blocks error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==================== АДМИНЫ ====================

app.get('/api/admins', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM admins ORDER BY hired_at');
        res.json(rows);
    } catch (error) {
        console.error('GET /api/admins error:', error.message);
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