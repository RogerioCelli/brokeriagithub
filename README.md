# Dashboard WhatsApp - BrokerIA

Dashboard moderno e responsivo para visualização de interações do WhatsApp registradas no PostgreSQL.

## 🚀 Funcionalidades

- ✅ **Dashboard em tempo real** com estatísticas gerais
- 📊 **Gráficos interativos** (Chart.js)
- 🔍 **Filtros avançados** por status, tipo e etapa
- 📱 **Design responsivo** e moderno (Dark Mode)
- 🔄 **Atualização automática** de dados
- 📋 **Tabela de registros** com busca e paginação
- 🎨 **Interface premium** com animações suaves

## 📋 Pré-requisitos

- Node.js 16+ 
- PostgreSQL 12+
- npm ou yarn

## 🛠️ Instalação Local

1. **Clone ou copie os arquivos do projeto**

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do PostgreSQL:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=seu_banco
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
PORT=3000
```

4. **Inicie o servidor:**
```bash
npm start
```

Para desenvolvimento com auto-reload:
```bash
npm run dev
```

5. **Acesse o dashboard:**
```
http://localhost:3000
```

## 🌐 Deploy na VPS Hostinger

### Opção 1: Deploy Manual

1. **Conecte-se à VPS via SSH:**
```bash
ssh usuario@seu-ip-vps
```

2. **Instale o Node.js (se não estiver instalado):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Instale o PM2 (gerenciador de processos):**
```bash
sudo npm install -g pm2
```

4. **Faça upload dos arquivos para a VPS:**
```bash
# No seu computador local
scp -r dashboard-whatsapp usuario@seu-ip-vps:/home/usuario/
```

Ou use FTP/SFTP com FileZilla.

5. **Na VPS, navegue até a pasta e instale as dependências:**
```bash
cd /home/usuario/dashboard-whatsapp
npm install --production
```

6. **Configure o arquivo .env:**
```bash
nano .env
```

7. **Inicie com PM2:**
```bash
pm2 start server.js --name dashboard-whatsapp
pm2 save
pm2 startup
```

8. **Configure o Nginx como proxy reverso:**
```bash
sudo nano /etc/nginx/sites-available/dashboard
```

Adicione:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

9. **Ative o site e reinicie o Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Opção 2: Deploy Automatizado

Execute o script de deploy:
```bash
chmod +x deploy-vps.sh
./deploy-vps.sh
```

## 📊 Estrutura do Banco de Dados

O dashboard espera a seguinte estrutura de tabela no PostgreSQL:

```sql
-- Tabela: brokeria_registros_brokeria
CREATE TABLE IF NOT EXISTS public.brokeria_registros_brokeria (
    id_atendimento SERIAL PRIMARY KEY,
    telefone VARCHAR(20) NOT NULL,
    nome_whatsapp VARCHAR(255),
    mensagem_inicial TEXT,
    tipo_solicitacao VARCHAR(100),
    session_id VARCHAR(255),
    origem VARCHAR(50) DEFAULT 'WHATSAPP',
    status_atendimento VARCHAR(50) DEFAULT 'PENDENTE',
    qtde_mensagens INTEGER DEFAULT 1,
    recebeu_arquivos BOOLEAN DEFAULT FALSE,
    tipos_documentos TEXT,
    etapa_funil VARCHAR(100),
    data_contato TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Comandos PM2 Úteis

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs dashboard-whatsapp

# Reiniciar
pm2 restart dashboard-whatsapp

# Parar
pm2 stop dashboard-whatsapp

# Remover
pm2 delete dashboard-whatsapp
```

## 🔒 Segurança

Para produção, considere:

1. **Usar HTTPS** (Let's Encrypt):
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

2. **Configurar firewall:**
```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

3. **Usar variáveis de ambiente seguras** (nunca commite o .env)

## 📝 API Endpoints

- `GET /api/dashboard/stats` - Estatísticas gerais
- `GET /api/registros/recentes` - Registros recentes
- `GET /api/registros/por-tipo` - Agrupado por tipo
- `GET /api/registros/por-etapa` - Agrupado por etapa
- `GET /api/registros/por-dia` - Timeline dos últimos 30 dias
- `GET /api/registros/:id` - Detalhes de um registro
- `GET /api/registros/telefone/:telefone` - Buscar por telefone
- `GET /api/registros/filtrar` - Filtrar registros

## 🎨 Personalização

Para personalizar cores e estilos, edite:
- `public/styles.css` - Variáveis CSS no `:root`

## 📱 Suporte

Para problemas ou dúvidas, verifique:
1. Logs do PM2: `pm2 logs`
2. Logs do Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Conexão com PostgreSQL

## 📄 Licença

MIT License
