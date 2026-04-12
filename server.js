const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const compression = require('compression'); // <-- Добавлено сжатие

const app = express();

// ========== НАСТРАИВАЕМ СЖАТИЕ И КЭШИРОВАНИЕ ==========
app.use(compression({
    level: 6, // Баланс между сжатием и скоростью
    threshold: 1024 // Сжимать ответы больше 1KB
}));

// Увеличиваем лимиты для больших изображений
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ========== АГРЕССИВНОЕ КЭШИРОВАНИЕ СТАТИКИ ==========
app.use(express.static('public', {
    maxAge: '1y', // Кэшировать на год
    immutable: true, // Файлы не меняются
    etag: true,
    lastModified: false
}));

// Отдельная обработка для HTML, чтобы он не кэшировался слишком агрессивно
app.use((req, res, next) => {
    if (req.url === '/' || req.url.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});

// ========== ПОДКЛЮЧЕНИЕ К POSTGRESQL ==========
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // Настройки пула для ускорения
    max: 10, // Максимальное количество клиентов
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// ========== КЭШ В ПАМЯТИ ДЛЯ ЧАСТО ЗАПРАШИВАЕМЫХ ДАННЫХ ==========
const cache = {
    products: { data: null, timestamp: 0 },
    gameBlocks: { data: null, timestamp: 0 },
    appBlocks: { data: null, timestamp: 0 },
    keywords: { data: null, timestamp: 0 }
};

const CACHE_TTL = 5000; // 5 секунд для данных

function getCachedData(key, fetchFn) {
    const cached = cache[key];
    if (cached.data && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`⚡ КЭШ: ${key} (пропуск запроса к БД)`);
        return Promise.resolve(cached.data);
    }
    return fetchFn().then(data => {
        cache[key] = { data, timestamp: Date.now() };
        return data;
    });
}

function invalidateCache(key) {
    if (cache[key]) {
        cache[key].timestamp = 0;
        console.log(`🔄 Кэш сброшен: ${key}`);
    }
}

// ========== ГАРАНТИРОВАННОЕ СОЗДАНИЕ ВСЕХ ТАБЛИЦ ==========
async function ensureTables() {
    const client = await pool.connect();
    try {
        console.log('🔄 Проверка и создание таблиц...');
        
        // Оптимизация: создаем индексы для ускорения поиска
        await client.query(`
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
            );
            
            CREATE INDEX IF NOT EXISTS idx_products_keyword ON products(keyword);
            CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller);
            CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
        `);
        
        await client.query(`
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
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS keywords (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT
            )
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS game_blocks (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                keyword_id TEXT,
                icon TEXT,
                image_url TEXT,
                sort_order INTEGER DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS idx_game_blocks_sort ON game_blocks(sort_order);
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS app_blocks (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                keyword_id TEXT,
                icon TEXT,
                image_url TEXT,
                sort_order INTEGER DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS idx_app_blocks_sort ON app_blocks(sort_order);
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                is_owner BOOLEAN DEFAULT FALSE,
                hired_by TEXT,
                hired_at TIMESTAMP DEFAULT NOW()
            )
        `);
        
        // Начальные данные (только если таблицы пусты)
        const keywordsCount = await client.query('SELECT COUNT(*) FROM keywords');
        if (parseInt(keywordsCount.rows[0].count) === 0) {
            await client.query(`
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
        }

        const gamesCount = await client.query('SELECT COUNT(*) FROM game_blocks');
        if (parseInt(gamesCount.rows[0].count) === 0) {
            await client.query(`
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
        }

        const appsCount = await client.query('SELECT COUNT(*) FROM app_blocks');
        if (parseInt(appsCount.rows[0].count) === 0) {
            await client.query(`
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
        }

        const adminsCount = await client.query('SELECT COUNT(*) FROM admins');
        if (parseInt(adminsCount.rows[0].count) === 0) {
            await client.query(`
                INSERT INTO admins (id, username, is_owner, hired_by) VALUES
                ('1', 'Admin', TRUE, 'system')
            `);
        }

        console.log('🎉 Все таблицы готовы!');
        return true;
    } catch (error) {
        console.error('❌ Ошибка создания таблиц:', error.message);
        return false;
    } finally {
        client.release();
    }
}

// ==================== API ЭНДПОИНТЫ С КЭШИРОВАНИЕМ ====================

// ----- ТОВАРЫ (с кэшированием) -----
app.get('/api/products', async (req, res) => {
    try {
        const products = await getCachedData('products', async () => {
            const { rows } = await pool.query('SELECT * FROM products ORDER BY created_at DESC LIMIT 100');
            return rows;
        });
        res.json(products);
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
        const product = {
            id: Date.now().toString(),
            ...req.body,
            sales: 0,
            created_at: new Date()
        };
        await pool.query(
            `INSERT INTO products (id, title, price, seller, keyword, image_url, description, discount, original_price, type, contact, sales, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [product.id, product.title, product.price, product.seller, product.keyword, 
             product.image_url, product.description, product.discount, product.original_price, 
             product.type, product.contact, product.sales, product.created_at]
        );
        invalidateCache('products');
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const fields = req.body;
        const keys = Object.keys(fields);
        if (keys.length === 0) return res.status(400).json({ error: 'Нет данных' });
        const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
        const values = [id, ...keys.map(k => fields[k])];
        await pool.query(`UPDATE products SET ${setClause} WHERE id = $1`, values);
        invalidateCache('products');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        invalidateCache('products');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ----- БЛОКИ ИГР (с кэшированием) -----
app.get('/api/game-blocks', async (req, res) => {
    try {
        const blocks = await getCachedData('gameBlocks', async () => {
            const { rows } = await pool.query('SELECT * FROM game_blocks ORDER BY sort_order');
            return rows;
        });
        res.json(blocks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/game-blocks', async (req, res) => {
    try {
        const { id, name, keyword_id, icon, image_url, sort_order } = req.body;
        await pool.query(
            `INSERT INTO game_blocks (id, name, keyword_id, icon, image_url, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, name, keyword_id || null, icon || 'fas fa-gamepad', image_url || null, sort_order || 0]
        );
        invalidateCache('gameBlocks');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/game-blocks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, keyword_id, icon, image_url, sort_order } = req.body;
        await pool.query(
            `UPDATE game_blocks SET name = COALESCE($1, name), keyword_id = COALESCE($2, keyword_id),
             icon = COALESCE($3, icon), image_url = COALESCE($4, image_url), sort_order = COALESCE($5, sort_order)
             WHERE id = $6`,
            [name, keyword_id, icon, image_url, sort_order, id]
        );
        invalidateCache('gameBlocks');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/game-blocks/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM game_blocks WHERE id = $1', [req.params.id]);
        invalidateCache('gameBlocks');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ----- БЛОКИ ПРИЛОЖЕНИЙ (с кэшированием) -----
app.get('/api/app-blocks', async (req, res) => {
    try {
        const blocks = await getCachedData('appBlocks', async () => {
            const { rows } = await pool.query('SELECT * FROM app_blocks ORDER BY sort_order');
            return rows;
        });
        res.json(blocks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/app-blocks', async (req, res) => {
    try {
        const { id, name, keyword_id, icon, image_url, sort_order } = req.body;
        await pool.query(
            `INSERT INTO app_blocks (id, name, keyword_id, icon, image_url, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, name, keyword_id || null, icon || 'fab fa-android', image_url || null, sort_order || 0]
        );
        invalidateCache('appBlocks');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/app-blocks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, keyword_id, icon, image_url, sort_order } = req.body;
        await pool.query(
            `UPDATE app_blocks SET name = COALESCE($1, name), keyword_id = COALESCE($2, keyword_id),
             icon = COALESCE($3, icon), image_url = COALESCE($4, image_url), sort_order = COALESCE($5, sort_order)
             WHERE id = $6`,
            [name, keyword_id, icon, image_url, sort_order, id]
        );
        invalidateCache('appBlocks');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/app-blocks/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM app_blocks WHERE id = $1', [req.params.id]);
        invalidateCache('appBlocks');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ----- КЛЮЧЕВЫЕ СЛОВА (с кэшированием) -----
app.get('/api/keywords', async (req, res) => {
    try {
        const keywords = await getCachedData('keywords', async () => {
            const { rows } = await pool.query('SELECT * FROM keywords ORDER BY name');
            return rows;
        });
        res.json(keywords);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/keywords', async (req, res) => {
    try {
        const { name, type } = req.body;
        const id = Date.now().toString();
        await pool.query('INSERT INTO keywords (id, name, type) VALUES ($1, $2, $3)', [id, name, type || 'Стандарт']);
        invalidateCache('keywords');
        res.json({ id, name, type: type || 'Стандарт' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/keywords/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type } = req.body;
        await pool.query(
            'UPDATE keywords SET name = COALESCE($1, name), type = COALESCE($2, type) WHERE id = $3',
            [name, type, id]
        );
        invalidateCache('keywords');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/keywords/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM keywords WHERE id = $1', [req.params.id]);
        invalidateCache('keywords');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ----- ОСТАЛЬНЫЕ API БЕЗ ИЗМЕНЕНИЙ (для краткости) -----
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
        const product = {
            id: Date.now().toString(),
            ...req.body,
            created_at: new Date()
        };
        await pool.query(
            `INSERT INTO pending_products (id, title, price, seller, keyword, image_url, description, discount, original_price, type, contact, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [product.id, product.title, product.price, product.seller, product.keyword,
             product.image_url, product.description, product.discount, product.original_price,
             product.type, product.contact, product.created_at]
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
        const { id } = req.params;
        const { rows } = await pool.query('SELECT * FROM pending_products WHERE id = $1', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Товар не найден' });
        const p = rows[0];
        await pool.query(
            `INSERT INTO products (id, title, price, seller, keyword, image_url, description, discount, original_price, type, contact, sales, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [p.id, p.title, p.price, p.seller, p.keyword, p.image_url, p.description,
             p.discount, p.original_price, p.type, p.contact, 0, p.created_at]
        );
        await pool.query('DELETE FROM pending_products WHERE id = $1', [id]);
        invalidateCache('products');
        res.json({ success: true });
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

app.post('/api/admins', async (req, res) => {
    try {
        const { id, username, is_owner, hired_by, hired_at } = req.body;
        await pool.query(
            `INSERT INTO admins (id, username, is_owner, hired_by, hired_at)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (username) DO NOTHING`,
            [id, username, is_owner || false, hired_by || 'system', hired_at || new Date().toISOString()]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ========== ЗАЯВКИ НА ВИТРИНУ ==========

// GET все заявки
app.get('/api/shop-applications', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT * FROM shop_applications 
            ORDER BY created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        // Если таблицы нет, создаём
        await ensureShopTables();
        const { rows } = await pool.query('SELECT * FROM shop_applications ORDER BY created_at DESC');
        res.json(rows);
    }
});

// POST новая заявка
app.post('/api/shop-applications', async (req, res) => {
    try {
        const { id, userId, shopName, shopType, phone, email, description, documents, status } = req.body;
        await pool.query(`
            INSERT INTO shop_applications (id, user_id, shop_name, shop_type, phone, email, description, documents, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        `, [id, userId, shopName, shopType, phone, email, description, JSON.stringify(documents), status || 'pending']);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST одобрить заявку
app.post('/api/shop-applications/:id/approve', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { rows } = await client.query('SELECT * FROM shop_applications WHERE id = $1', [req.params.id]);
        if (rows.length === 0) throw new Error('Заявка не найдена');
        
        const app = rows[0];
        
        // Обновляем статус заявки
        await client.query(
            'UPDATE shop_applications SET status = $1, updated_at = NOW() WHERE id = $2',
            ['approved', req.params.id]
        );
        
        // Добавляем пользователя в таблицу продавцов
        await client.query(`
            INSERT INTO sellers (user_id, shop_name, approved_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (user_id) DO UPDATE SET approved_at = NOW()
        `, [app.user_id, app.shop_name]);
        
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// POST отклонить заявку
app.post('/api/shop-applications/:id/reject', async (req, res) => {
    try {
        const { reason } = req.body;
        await pool.query(
            'UPDATE shop_applications SET status = $1, reject_reason = $2, updated_at = NOW() WHERE id = $3',
            ['rejected', reason, req.params.id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Функция создания таблиц для витрины
async function ensureShopTables() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS shop_applications (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                shop_name TEXT NOT NULL,
                shop_type TEXT,
                phone TEXT,
                email TEXT,
                description TEXT,
                documents JSONB,
                status TEXT DEFAULT 'pending',
                reject_reason TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
            
            CREATE TABLE IF NOT EXISTS sellers (
                user_id TEXT PRIMARY KEY,
                shop_name TEXT,
                approved_at TIMESTAMP DEFAULT NOW()
            );
            
            CREATE INDEX IF NOT EXISTS idx_shop_applications_status ON shop_applications(status);
            CREATE INDEX IF NOT EXISTS idx_shop_applications_user_id ON shop_applications(user_id);
        `);
        console.log('✅ Таблицы для витрины созданы');
    } finally {
        client.release();
    }
}
app.delete('/api/admins/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM admins WHERE id = $1 AND is_owner = false', [req.params.id]);
        res.json({ success: true });
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

// ==================== ЗАПУСК ====================
const PORT = process.env.PORT || 3000;

async function startServer() {
    console.log('🚀 Запуск сервера Плейнексис...');
    await ensureTables();
    app.listen(PORT, () => {
        console.log(`✅ HTTP сервер запущен на порту ${PORT}`);
        console.log(`⚡ Сжатие включено, кэш статики: 1 год, кэш API: ${CACHE_TTL/1000}с`);
    });
}

startServer();