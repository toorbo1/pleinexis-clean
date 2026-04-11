const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();

// ========== УВЕЛИЧИВАЕМ ЛИМИТ ДЛЯ БОЛЬШИХ ИЗОБРАЖЕНИЙ ==========
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(express.static('public'));

// ========== ПОДКЛЮЧЕНИЕ К POSTGRESQL ==========
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ========== ГАРАНТИРОВАННОЕ СОЗДАНИЕ ВСЕХ ТАБЛИЦ ==========
async function ensureTables() {
    const client = await pool.connect();
    try {
        console.log('🔄 Проверка и создание таблиц...');
        
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
            )
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
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS app_blocks (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                keyword_id TEXT,
                icon TEXT,
                image_url TEXT,
                sort_order INTEGER DEFAULT 0
            )
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
        await client.query(`
            CREATE TABLE IF NOT EXISTS support_dialogs (
                id TEXT PRIMARY KEY,
                user_name TEXT NOT NULL,
                user_id TEXT,
                last_message_time TIMESTAMP DEFAULT NOW()
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                dialog_id TEXT NOT NULL,
                sender TEXT NOT NULL,
                text TEXT NOT NULL,
                time TEXT,
                timestamp TIMESTAMP DEFAULT NOW()
            )
        `);
        await client.query(`
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

        // Начальные данные (ключевые слова, игры, приложения, админ)
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

// ==================== API ЭНДПОИНТЫ ====================

// ----- ТОВАРЫ -----
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
        res.json({ success: true });
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

// ----- ТОВАРЫ НА МОДЕРАЦИИ -----
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
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ----- КЛЮЧЕВЫЕ СЛОВА -----
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
        const { name, type } = req.body;
        const id = Date.now().toString();
        await pool.query('INSERT INTO keywords (id, name, type) VALUES ($1, $2, $3)', [id, name, type || 'Стандарт']);
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
        res.json({ success: true });
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

// ----- ИГРЫ -----
app.get('/api/game-blocks', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM game_blocks ORDER BY sort_order');
        res.json(rows);
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
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/game-blocks/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM game_blocks WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ----- ПРИЛОЖЕНИЯ -----
app.get('/api/app-blocks', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM app_blocks ORDER BY sort_order');
        res.json(rows);
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
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/app-blocks/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM app_blocks WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ----- АДМИНИСТРАТОРЫ -----
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

app.delete('/api/admins/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM admins WHERE id = $1 AND is_owner = false', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ----- ТЕСТ -----
app.get('/api/test', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', database: 'PostgreSQL подключена ✅' });
    } catch (error) {
        res.json({ status: 'error', database: 'PostgreSQL НЕ подключена ❌', error: error.message });
    }
});

// ----- ФРОНТЕНД -----
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
    });
}

startServer();