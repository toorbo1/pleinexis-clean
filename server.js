const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const compression = require('compression');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();

// JWT секрет (в продакшене должен быть в переменных окружения)
const JWT_SECRET = process.env.JWT_SECRET || 'pleinexis_super_secret_key_2024';
const SALT_ROUNDS = 12;

// ========== НАСТРОЙКИ ==========
app.use(compression({ level: 6, threshold: 1024 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Статика с кэшированием
app.use(express.static('public', {
    maxAge: '1y',
    immutable: true,
    etag: true,
    lastModified: false
}));

// HTML не кэшируем
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
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// ========== КЭШ В ПАМЯТИ ==========
const cache = {
    products: { data: null, timestamp: 0 },
    gameBlocks: { data: null, timestamp: 0 },
    appBlocks: { data: null, timestamp: 0 },
    keywords: { data: null, timestamp: 0 }
};

const CACHE_TTL = 5000;

function getCachedData(key, fetchFn) {
    const cached = cache[key];
    if (cached.data && Date.now() - cached.timestamp < CACHE_TTL) {
        return Promise.resolve(cached.data);
    }
    return fetchFn().then(data => {
        cache[key] = { data, timestamp: Date.now() };
        return data;
    });
}

function invalidateCache(key) {
    if (cache[key]) cache[key].timestamp = 0;
}

// ========== СОЗДАНИЕ ВСЕХ ТАБЛИЦ ==========
async function ensureTables() {
    const client = await pool.connect();
    try {
        console.log('🔄 Проверка и создание таблиц...');
        
        // Таблица пользователей (с хешами паролей)
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE,
                username TEXT NOT NULL,
                password_hash TEXT,
                auth_provider TEXT DEFAULT 'local',
                provider_id TEXT,
                avatar_url TEXT,
                balance INTEGER DEFAULT 0,
                rating REAL DEFAULT 5.0,
                reviews_count INTEGER DEFAULT 0,
                sales_count INTEGER DEFAULT 0,
                purchases_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                last_login TIMESTAMP DEFAULT NOW(),
                is_verified BOOLEAN DEFAULT FALSE,
                verification_token TEXT,
                reset_token TEXT,
                reset_token_expires TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_provider ON users(auth_provider, provider_id);
        `);
        
        // Таблица сессий
        await client.query(`
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                token TEXT UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                user_agent TEXT,
                ip_address TEXT
            );
            
            CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
            CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
        `);
        
        // Остальные таблицы (как в вашем оригинале)
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
            )
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS sellers (
                user_id TEXT PRIMARY KEY,
                shop_name TEXT,
                approved_at TIMESTAMP DEFAULT NOW()
            )
        `);
        
        // Начальные данные
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

// ========== ФУНКЦИИ АВТОРИЗАЦИИ ==========

// Генерация токена
function generateToken() {
    return crypto.randomBytes(64).toString('hex');
}

// Создание JWT
function createJWT(userId, username) {
    return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });
}

// Проверка JWT middleware
async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Проверяем сессию в БД
        const result = await pool.query(
            'SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()',
            [token]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Сессия истекла' });
        }
        
        req.userId = decoded.userId;
        req.username = decoded.username;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Недействительный токен' });
    }
}

// ========== API АВТОРИЗАЦИИ ==========

// Регистрация по email/паролю
app.post('/api/auth/register', async (req, res) => {
    const { email, username, password } = req.body;
    
    if (!email || !username || !password) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Неверный формат email' });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Проверка существующего пользователя
        const existing = await client.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );
        
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Пользователь с таким email или именем уже существует' });
        }
        
        // Хеширование пароля
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const userId = crypto.randomBytes(16).toString('hex');
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        // Создание пользователя
        await client.query(
            `INSERT INTO users (id, email, username, password_hash, verification_token, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [userId, email, username, passwordHash, verificationToken]
        );
        
        // Создание сессии
        const sessionToken = generateToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        
        await client.query(
            `INSERT INTO sessions (id, user_id, token, expires_at)
             VALUES ($1, $2, $3, $4)`,
            [crypto.randomBytes(16).toString('hex'), userId, sessionToken, expiresAt]
        );
        
        await client.query('COMMIT');
        
        const jwtToken = createJWT(userId, username);
        
        res.json({
            success: true,
            token: jwtToken,
            sessionToken: sessionToken,
            user: {
                id: userId,
                username: username,
                email: email,
                balance: 0,
                rating: 5.0
            }
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Ошибка регистрации' });
    } finally {
        client.release();
    }
});

// Вход по email/паролю
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    
    const client = await pool.connect();
    
    try {
        // Поиск пользователя
        const result = await client.query(
            'SELECT * FROM users WHERE email = $1 AND auth_provider = $2',
            [email, 'local']
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }
        
        const user = result.rows[0];
        
        // Проверка пароля
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }
        
        // Обновляем время последнего входа
        await client.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
        );
        
        // Создаем новую сессию
        const sessionToken = generateToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        
        await client.query(
            `INSERT INTO sessions (id, user_id, token, expires_at)
             VALUES ($1, $2, $3, $4)`,
            [crypto.randomBytes(16).toString('hex'), user.id, sessionToken, expiresAt]
        );
        
        const jwtToken = createJWT(user.id, user.username);
        
        res.json({
            success: true,
            token: jwtToken,
            sessionToken: sessionToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar_url: user.avatar_url,
                balance: user.balance,
                rating: user.rating,
                reviews_count: user.reviews_count
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Ошибка входа' });
    } finally {
        client.release();
    }
});

// Google OAuth вход/регистрация
app.post('/api/auth/google', async (req, res) => {
    const { credential, clientId } = req.body;
    
    if (!credential) {
        return res.status(400).json({ error: 'Нет данных от Google' });
    }
    
    try {
        // Декодируем JWT от Google
        const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());
        
        const email = payload.email;
        const username = payload.name;
        const googleId = payload.sub;
        const avatarUrl = payload.picture;
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Ищем существующего пользователя
            let result = await client.query(
                'SELECT * FROM users WHERE email = $1 OR (auth_provider = $2 AND provider_id = $3)',
                [email, 'google', googleId]
            );
            
            let user;
            
            if (result.rows.length === 0) {
                // Создаем нового пользователя
                const userId = crypto.randomBytes(16).toString('hex');
                await client.query(
                    `INSERT INTO users (id, email, username, auth_provider, provider_id, avatar_url, created_at, is_verified)
                     VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)`,
                    [userId, email, username, 'google', googleId, avatarUrl, true]
                );
                
                user = { id: userId, username, email, avatar_url: avatarUrl, balance: 0 };
            } else {
                user = result.rows[0];
                // Обновляем аватар если изменился
                if (avatarUrl && user.avatar_url !== avatarUrl) {
                    await client.query(
                        'UPDATE users SET avatar_url = $1, last_login = NOW() WHERE id = $2',
                        [avatarUrl, user.id]
                    );
                } else {
                    await client.query(
                        'UPDATE users SET last_login = NOW() WHERE id = $1',
                        [user.id]
                    );
                }
            }
            
            // Создаем сессию
            const sessionToken = generateToken();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            
            await client.query(
                `INSERT INTO sessions (id, user_id, token, expires_at)
                 VALUES ($1, $2, $3, $4)`,
                [crypto.randomBytes(16).toString('hex'), user.id, sessionToken, expiresAt]
            );
            
            await client.query('COMMIT');
            
            const jwtToken = createJWT(user.id, user.username);
            
            res.json({
                success: true,
                token: jwtToken,
                sessionToken: sessionToken,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    avatar_url: user.avatar_url,
                    balance: user.balance || 0,
                    rating: user.rating || 5.0
                }
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: 'Ошибка авторизации через Google' });
    }
});

// VK OAuth вход/регистрация
app.post('/api/auth/vk', async (req, res) => {
    const { vkId, email, username, avatarUrl } = req.body;
    
    if (!vkId) {
        return res.status(400).json({ error: 'Нет данных от VK' });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Ищем существующего пользователя
        let result = await client.query(
            'SELECT * FROM users WHERE (auth_provider = $1 AND provider_id = $2) OR email = $3',
            ['vk', vkId.toString(), email || null]
        );
        
        let user;
        
        if (result.rows.length === 0) {
            // Создаем нового пользователя
            const userId = crypto.randomBytes(16).toString('hex');
            const finalUsername = username || `user_${vkId}`;
            const finalEmail = email || `${vkId}@vk.user`;
            
            await client.query(
                `INSERT INTO users (id, email, username, auth_provider, provider_id, avatar_url, created_at, is_verified)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)`,
                [userId, finalEmail, finalUsername, 'vk', vkId.toString(), avatarUrl || null, true]
            );
            
            user = { id: userId, username: finalUsername, email: finalEmail, avatar_url: avatarUrl, balance: 0 };
        } else {
            user = result.rows[0];
            await client.query(
                'UPDATE users SET last_login = NOW() WHERE id = $1',
                [user.id]
            );
        }
        
        // Создаем сессию
        const sessionToken = generateToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        
        await client.query(
            `INSERT INTO sessions (id, user_id, token, expires_at)
             VALUES ($1, $2, $3, $4)`,
            [crypto.randomBytes(16).toString('hex'), user.id, sessionToken, expiresAt]
        );
        
        await client.query('COMMIT');
        
        const jwtToken = createJWT(user.id, user.username);
        
        res.json({
            success: true,
            token: jwtToken,
            sessionToken: sessionToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar_url: user.avatar_url,
                balance: user.balance || 0,
                rating: user.rating || 5.0
            }
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('VK auth error:', error);
        res.status(500).json({ error: 'Ошибка авторизации через VK' });
    } finally {
        client.release();
    }
});

// Проверка текущего пользователя
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, avatar_url, balance, rating, reviews_count, sales_count, purchases_count FROM users WHERE id = $1',
            [req.userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Выход
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    try {
        await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Сброс пароля - запрос
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Email обязателен' });
    }
    
    try {
        const result = await pool.query(
            'SELECT id FROM users WHERE email = $1 AND auth_provider = $2',
            [email, 'local']
        );
        
        if (result.rows.length > 0) {
            const resetToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 1);
            
            await pool.query(
                'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
                [resetToken, expiresAt, result.rows[0].id]
            );
            
            // Здесь должен быть email с ссылкой для сброса
            console.log(`Reset token for ${email}: ${resetToken}`);
        }
        
        // Всегда возвращаем успех для безопасности
        res.json({ success: true, message: 'Если email существует, инструкции отправлены' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Сброс пароля - подтверждение
app.post('/api/auth/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Неверные данные' });
    }
    
    try {
        const result = await pool.query(
            'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
            [token]
        );
        
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Недействительная или истекшая ссылка' });
        }
        
        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        
        await pool.query(
            'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
            [passwordHash, result.rows[0].id]
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== ОСТАЛЬНЫЕ API (как в вашем оригинале) ==========

// Товары
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

// Ожидающие товары
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

// Блоки игр
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

// Блоки приложений
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

// Ключевые слова
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

// Заявки на витрину
app.get('/api/shop-applications', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM shop_applications ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/shop-applications', async (req, res) => {
    try {
        const { id, userId, shopName, shopType, phone, email, description, documents, status } = req.body;
        await pool.query(
            `INSERT INTO shop_applications (id, user_id, shop_name, shop_type, phone, email, description, documents, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
            [id, userId, shopName, shopType, phone, email, description, JSON.stringify(documents), status || 'pending']
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/shop-applications/:id/approve', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { rows } = await client.query('SELECT * FROM shop_applications WHERE id = $1', [req.params.id]);
        if (rows.length === 0) throw new Error('Заявка не найдена');
        
        const app = rows[0];
        
        await client.query(
            'UPDATE shop_applications SET status = $1, updated_at = NOW() WHERE id = $2',
            ['approved', req.params.id]
        );
        
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

// Администраторы
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

// Тест
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
    console.log('🚀 Запуск сервера Плейнексис...');
    await ensureTables();
    app.listen(PORT, () => {
        console.log(`✅ HTTP сервер запущен на порту ${PORT}`);
        console.log(`⚡ Сжатие включено, кэш статики: 1 год, кэш API: ${CACHE_TTL/1000}с`);
        console.log(`🔐 JWT авторизация включена`);
    });
}

startServer();