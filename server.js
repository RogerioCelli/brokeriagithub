const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

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

// ========== ROTAS DA API ==========

// 1. Dashboard - Estatísticas gerais
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const query = `
      SELECT 
        COUNT(*) as total_registros,
        COUNT(CASE WHEN status_atendimento = 'PENDENTE' THEN 1 END) as pendentes,
        COUNT(CASE WHEN status_atendimento = 'EM_ATENDIMENTO' THEN 1 END) as em_atendimento,
        COUNT(CASE WHEN status_atendimento = 'CONCLUIDO' THEN 1 END) as concluidos,
        COUNT(DISTINCT telefone) as clientes_unicos,
        COUNT(CASE WHEN DATE(data_contato) = CURRENT_DATE THEN 1 END) as hoje
      FROM public.brokeria_registros_brokeria
      WHERE data_contato > NOW() - INTERVAL '30 days'
    `;
        const result = await pool.query(query);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao buscar estatísticas:', err);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

// 2. Registros recentes
app.get('/api/registros/recentes', async (req, res) => {
    try {
        const limit = req.query.limit || 20;
        const query = `
      SELECT 
        id_atendimento,
        telefone,
        nome_whatsapp,
        tipo_solicitacao,
        status_atendimento,
        qtde_mensagens,
        etapa_funil,
        data_contato,
        SUBSTRING(mensagem_inicial, 1, 150) as mensagem_resumo
      FROM public.brokeria_registros_brokeria
      ORDER BY data_contato DESC
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
app.get('/api/registros/por-tipo', async (req, res) => {
    try {
        const query = `
      SELECT 
        tipo_solicitacao,
        COUNT(*) as total,
        COUNT(CASE WHEN status_atendimento = 'PENDENTE' THEN 1 END) as pendentes
      FROM public.brokeria_registros_brokeria
      WHERE data_contato > NOW() - INTERVAL '30 days'
      GROUP BY tipo_solicitacao
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
app.get('/api/registros/por-etapa', async (req, res) => {
    try {
        const query = `
      SELECT 
        etapa_funil,
        COUNT(*) as total,
        AVG(qtde_mensagens) as media_mensagens
      FROM public.brokeria_registros_brokeria
      WHERE data_contato > NOW() - INTERVAL '30 days'
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
app.get('/api/registros/por-dia', async (req, res) => {
    try {
        const query = `
      SELECT 
        DATE(data_contato) as data,
        COUNT(*) as total_registros,
        COUNT(DISTINCT telefone) as clientes_unicos
      FROM public.brokeria_registros_brokeria
      WHERE data_contato > NOW() - INTERVAL '30 days'
      GROUP BY DATE(data_contato)
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
app.get('/api/registros/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
      SELECT *
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
app.get('/api/registros/telefone/:telefone', async (req, res) => {
    try {
        const { telefone } = req.params;
        const query = `
      SELECT *
      FROM public.brokeria_registros_brokeria
      WHERE telefone = $1
      ORDER BY data_contato DESC
    `;
        const result = await pool.query(query, [telefone]);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar por telefone:', err);
        res.status(500).json({ error: 'Erro ao buscar registros' });
    }
});

// 8. Filtrar registros
app.get('/api/registros/filtrar', async (req, res) => {
    try {
        const { status, tipo, etapa, dataInicio, dataFim } = req.query;

        let query = `
      SELECT 
        id_atendimento,
        telefone,
        nome_whatsapp,
        tipo_solicitacao,
        status_atendimento,
        qtde_mensagens,
        etapa_funil,
        data_contato,
        SUBSTRING(mensagem_inicial, 1, 150) as mensagem_resumo
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
            query += ` AND tipo_solicitacao = $${paramCount}`;
            params.push(tipo);
            paramCount++;
        }

        if (etapa) {
            query += ` AND etapa_funil = $${paramCount}`;
            params.push(etapa);
            paramCount++;
        }

        if (dataInicio) {
            query += ` AND data_contato >= $${paramCount}`;
            params.push(dataInicio);
            paramCount++;
        }

        if (dataFim) {
            query += ` AND data_contato <= $${paramCount}`;
            params.push(dataFim);
            paramCount++;
        }

        query += ` ORDER BY data_contato DESC LIMIT 100`;

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
