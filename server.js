const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'brokeria-secret-key-2024';

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Teste de conexão
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Erro ao conectar ao PostgreSQL:', err);
    } else {
        console.log('✅ Conectado ao PostgreSQL:', res.rows[0].now);
    }
});

// Middleware de Autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Acesso negado' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
        req.user = user;
        next();
    });
};

// Criar admin inicial se não existir
const setupAdmin = async () => {
    try {
        const check = await pool.query('SELECT id FROM public.brokeria_users WHERE username = $1', ['admin']);

        if (check.rows.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash('brokeria2025', salt);
            await pool.query(
                'INSERT INTO public.brokeria_users (username, password_hash, nome, role) VALUES ($1, $2, $3, $4)',
                ['admin', hash, 'Administrador', 'admin']
            );
            console.log('✅ Admin inicial criado: admin / brokeria2025');
        } else {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash('brokeria2025', salt);
            await pool.query(
                'UPDATE public.brokeria_users SET password_hash = $1 WHERE username = $2',
                [hash, 'admin']
            );
            console.log('✅ Senha do admin atualizada para: brokeria2025');
        }
    } catch (err) {
        console.error('Erro ao configurar admin:', err);
    }
};
setupAdmin();

// ========== ROTAS DE AUTENTICAÇÃO ==========

// Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const query = 'SELECT * FROM public.brokeria_users WHERE username = $1';
        const result = await pool.query(query, [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Usuário ou senha incorretos' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Usuário ou senha incorretos' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, nome: user.nome },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                username: user.username,
                nome: user.nome,
                role: user.role
            }
        });

    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ error: 'Erro ao processar login' });
    }
});

// Criar usuário (Apenas Admin)
app.post('/api/auth/register', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Apenas administradores podem criar novos usuários' });
    }

    const { username, password, nome, role } = req.body;

    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const query = 'INSERT INTO public.brokeria_users (username, password_hash, nome, role) VALUES ($1, $2, $3, $4) RETURNING id';
        const result = await pool.query(query, [username, password_hash, nome, role || 'user']);

        res.status(201).json({ message: 'Usuário criado com sucesso', id: result.rows[0].id });

    } catch (err) {
        console.error('Erro ao registrar usuário:', err);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

// ========== ROTAS DA API PROTEGIDAS ==========

// 1. Dashboard - Estatísticas gerais
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const query = `
      SELECT 
        COUNT(*) as total_registros,
        COUNT(CASE WHEN status_atendimento = 'PENDENTE' THEN 1 END) as pendentes,
        COUNT(CASE WHEN status_atendimento = 'EM_ATENDIMENTO' THEN 1 END) as em_atendimento,
        COUNT(CASE WHEN status_atendimento = 'CONCLUIDO' THEN 1 END) as concluidos,
        COUNT(DISTINCT telefone) as clientes_unicos,
        COUNT(CASE WHEN data_atendimento = CURRENT_DATE THEN 1 END) as hoje
      FROM public.brokeria_registros_brokeria
      WHERE data_atendimento > NOW() - INTERVAL '30 days'
    `;
        const result = await pool.query(query);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao buscar estatísticas:', err);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

// 2. Registros recentes
app.get('/api/registros/recentes', authenticateToken, async (req, res) => {
    try {
        const limit = req.query.limit || 20;
        const query = `
      SELECT 
        id_atendimento,
        telefone,
        nome_cliente as nome_whatsapp,
        tipo_seguro as tipo_solicitacao,
        status_atendimento,
        qtde_mensagens,
        etapa_funil,
        data_atendimento as data_contato,
        SUBSTRING(resumo_conversa, 1, 150) as mensagem_resumo
      FROM public.brokeria_registros_brokeria
      ORDER BY data_criacao_registro DESC
      LIMIT $1
    `;
        const result = await pool.query(query, [limit]);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar registros recentes:', err);
        res.status(500).json({ error: 'Erro ao buscar registros' });
    }
});

// 3. Registros por tipo de solicitação
app.get('/api/registros/por-tipo', authenticateToken, async (req, res) => {
    try {
        const query = `
      SELECT 
        tipo_seguro as tipo_solicitacao,
        COUNT(*) as total,
        COUNT(CASE WHEN status_atendimento = 'PENDENTE' THEN 1 END) as pendentes
      FROM public.brokeria_registros_brokeria
      WHERE data_atendimento > NOW() - INTERVAL '30 days'
      GROUP BY tipo_seguro
      ORDER BY total DESC
    `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar por tipo:', err);
        res.status(500).json({ error: 'Erro ao buscar dados' });
    }
});

// 4. Registros por etapa do funil
app.get('/api/registros/por-etapa', authenticateToken, async (req, res) => {
    try {
        const query = `
      SELECT 
        etapa_funil,
        COUNT(*) as total,
        AVG(qtde_mensagens) as media_mensagens
      FROM public.brokeria_registros_brokeria
      WHERE data_atendimento > NOW() - INTERVAL '30 days'
      GROUP BY etapa_funil
      ORDER BY total DESC
    `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar por etapa:', err);
        res.status(500).json({ error: 'Erro ao buscar dados' });
    }
});

// 5. Registros por dia (últimos 30 dias)
app.get('/api/registros/por-dia', authenticateToken, async (req, res) => {
    try {
        const query = `
      SELECT 
        data_atendimento as data,
        COUNT(*) as total_registros,
        COUNT(DISTINCT telefone) as clientes_unicos
      FROM public.brokeria_registros_brokeria
      WHERE data_atendimento > NOW() - INTERVAL '30 days'
      GROUP BY data_atendimento
      ORDER BY data ASC
    `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar por dia:', err);
        res.status(500).json({ error: 'Erro ao buscar dados' });
    }
});

// 6. Buscar registro específico
app.get('/api/registros/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
      SELECT *, 
             nome_cliente as nome_whatsapp, 
             tipo_seguro as tipo_solicitacao, 
             resumo_conversa as mensagem_inicial,
             data_atendimento as data_contato,
             id_conversa_whatsapp as session_id,
             origem_lead as origem
      FROM public.brokeria_registros_brokeria
      WHERE id_atendimento = $1
    `;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao buscar registro:', err);
        res.status(500).json({ error: 'Erro ao buscar registro' });
    }
});

// 7. Buscar por telefone
app.get('/api/registros/telefone/:telefone', authenticateToken, async (req, res) => {
    try {
        const { telefone } = req.params;
        const query = `
      SELECT *, 
             nome_cliente as nome_whatsapp, 
             tipo_seguro as tipo_solicitacao, 
             resumo_conversa as mensagem_inicial,
             data_atendimento as data_contato,
             id_conversa_whatsapp as session_id,
             origem_lead as origem
      FROM public.brokeria_registros_brokeria
      WHERE telefone = $1
      ORDER BY data_criacao_registro DESC
    `;
        const result = await pool.query(query, [telefone]);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar por telefone:', err);
        res.status(500).json({ error: 'Erro ao buscar registros' });
    }
});

// 8. Filtrar registros
app.get('/api/registros/filtrar', authenticateToken, async (req, res) => {
    try {
        const { status, tipo, etapa, dataInicio, dataFim } = req.query;

        let query = `
      SELECT 
        id_atendimento,
        telefone,
        nome_cliente as nome_whatsapp,
        tipo_seguro as tipo_solicitacao,
        status_atendimento,
        qtde_mensagens,
        etapa_funil,
        data_atendimento as data_contato,
        SUBSTRING(resumo_conversa, 1, 150) as mensagem_resumo
      FROM public.brokeria_registros_brokeria
      WHERE 1=1
    `;
        const params = [];
        let paramCount = 1;

        if (status) {
            query += ` AND status_atendimento = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        if (tipo) {
            query += ` AND tipo_seguro = $${paramCount}`;
            params.push(tipo);
            paramCount++;
        }

        if (etapa) {
            query += ` AND etapa_funil = $${paramCount}`;
            params.push(etapa);
            paramCount++;
        }

        if (dataInicio) {
            query += ` AND data_atendimento >= $${paramCount}`;
            params.push(dataInicio);
            paramCount++;
        }

        if (dataFim) {
            query += ` AND data_atendimento <= $${paramCount}`;
            params.push(dataFim);
            paramCount++;
        }

        query += ` ORDER BY data_atendimento DESC LIMIT 100`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao filtrar registros:', err);
        res.status(500).json({ error: 'Erro ao filtrar registros' });
    }
});

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
