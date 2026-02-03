# 🎯 INÍCIO RÁPIDO - Dashboard WhatsApp

## ⚡ Teste Local (5 minutos)

### 1. Configure o banco de dados

Copie e configure o arquivo de ambiente:

```bash
cd dashboard-whatsapp
copy .env.example .env
```

Edite o `.env` e coloque suas credenciais do PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=seu_banco
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
PORT=3000
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Inicie o servidor

```bash
npm start
```

### 4. Acesse o dashboard

Abra o navegador em: **http://localhost:3000**

---

## 🚀 Deploy na VPS Hostinger

Siga o guia completo: **[DEPLOY_HOSTINGER.md](DEPLOY_HOSTINGER.md)**

Resumo rápido:

1. **Conecte na VPS:**
   ```bash
   ssh usuario@seu-ip-vps
   ```

2. **Instale Node.js e PM2:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

3. **Faça upload dos arquivos** (via FTP/SFTP ou SCP)

4. **Configure e inicie:**
   ```bash
   cd /home/usuario/dashboard-whatsapp
   npm install --production
   nano .env  # Configure o banco de dados
   pm2 start server.js --name dashboard-whatsapp
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx** (opcional):
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/dashboard
   sudo ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **Acesse:** `http://seu-dominio.com`

---

## 📊 Funcionalidades

✅ **Dashboard em tempo real** com estatísticas  
✅ **Gráficos interativos** (Chart.js)  
✅ **Filtros avançados** (status, tipo, etapa)  
✅ **Busca por telefone/nome**  
✅ **Visualização detalhada** de cada registro  
✅ **Design responsivo** e moderno (Dark Mode)  
✅ **Atualização automática** de dados  

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start

# Ver logs (PM2)
pm2 logs dashboard-whatsapp

# Reiniciar (PM2)
pm2 restart dashboard-whatsapp

# Status (PM2)
pm2 status
```

---

## 📁 Estrutura do Projeto

```
dashboard-whatsapp/
├── server.js              # Servidor Express + API
├── package.json           # Dependências
├── .env.example          # Exemplo de configuração
├── ecosystem.config.js   # Configuração PM2
├── nginx.conf            # Configuração Nginx
├── deploy-vps.sh         # Script de deploy automatizado
├── public/
│   ├── index.html        # Interface do dashboard
│   ├── styles.css        # Estilos (Dark Mode)
│   └── app.js            # Lógica do frontend
├── README.md             # Documentação completa
├── DEPLOY_HOSTINGER.md   # Guia de deploy VPS
└── INICIO_RAPIDO.md      # Este arquivo
```

---

## 🎨 Preview

O dashboard possui:

- **4 Cards de Estatísticas** (Total, Pendentes, Em Atendimento, Concluídos)
- **Gráficos de Barras** (Por Tipo e Por Etapa)
- **Gráfico de Linha** (Timeline 30 dias)
- **Filtros Dinâmicos**
- **Tabela de Registros** com busca
- **Modal de Detalhes** para cada registro

---

## ❓ Precisa de Ajuda?

1. **Erro de conexão com PostgreSQL:**
   - Verifique as credenciais no `.env`
   - Confirme que o PostgreSQL está rodando
   - Teste a conexão: `psql -h localhost -U seu_usuario -d seu_banco`

2. **Porta 3000 já em uso:**
   - Mude a porta no `.env`
   - Ou mate o processo: `npx kill-port 3000`

3. **Aplicação não inicia:**
   - Verifique os logs: `pm2 logs` ou console
   - Confirme que todas as dependências foram instaladas

---

**Pronto para começar! 🚀**
