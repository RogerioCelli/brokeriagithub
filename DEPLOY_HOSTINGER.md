# 🚀 Deploy Dashboard WhatsApp - VPS Hostinger
# IP: 72.61.51.143 | Hostname: srv1124953.hstgr.cloud

## ✅ INFORMAÇÕES DA VPS
- **IP:** 72.61.51.143
- **Hostname:** srv1124953.hstgr.cloud
- **Sistema:** Ubuntu
- **PostgreSQL:** Instalado na mesma VPS

---

## 🔌 PASSO 1: Conectar via SSH

### No PowerShell do Windows:

```powershell
ssh root@72.61.51.143
```

Ou usando o hostname:

```powershell
ssh root@srv1124953.hstgr.cloud
```

**Digite a senha quando solicitado.**

Se aparecer uma mensagem sobre fingerprint, digite: `yes`

---

## 🛠️ PASSO 2: Instalar Node.js na VPS

**Depois de conectado via SSH, cole estes comandos um por vez:**

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version

# Instalar PM2 (gerenciador de processos)
sudo npm install -g pm2
```

---

## 📦 PASSO 3: Fazer Upload dos Arquivos

### Opção A: Via FileZilla (Recomendado)

1. **Baixe:** https://filezilla-project.org/
2. **Configure:**
   - Host: `sftp://72.61.51.143`
   - Usuário: `root` (ou seu usuário SSH)
   - Senha: sua senha SSH
   - Porta: `22`
3. **Conecte** e faça upload da pasta `dashboard-whatsapp` para `/root/`

### Opção B: Via SCP (Linha de Comando)

**No PowerShell do Windows:**

```powershell
cd e:\Projetos\Antigravity
scp -r dashboard-whatsapp root@72.61.51.143:/root/
```

Digite a senha quando solicitado.

---

## ⚙️ PASSO 4: Configurar na VPS

**De volta no SSH da VPS:**

```bash
# Navegar para a pasta
cd /root/dashboard-whatsapp

# Instalar dependências
npm install --production

# Criar arquivo .env
nano .env
```

**Cole este conteúdo no .env (EDITE as credenciais do PostgreSQL):**

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=SEU_BANCO_POSTGRES
DB_USER=SEU_USUARIO_POSTGRES
DB_PASSWORD=SUA_SENHA_POSTGRES
PORT=3000
NODE_ENV=production
```

**Para salvar:** Pressione `Ctrl+X`, depois `Y`, depois `Enter`

---

## � PASSO 4.1: Descobrir Credenciais do PostgreSQL (se não souber)

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Conectar como postgres
sudo -u postgres psql

# Listar bancos de dados
\l

# Listar usuários
\du

# Ver a tabela que precisamos
\c nome_do_banco
\dt

# Sair
\q
```

**Anote:**
- Nome do banco que tem a tabela `brokeria_registros_brokeria`
- Usuário do PostgreSQL
- Senha (se não souber, pode criar um novo usuário)

---

## �🚀 PASSO 5: Iniciar o Servidor

```bash
# Voltar para a pasta do projeto
cd /root/dashboard-whatsapp

# Iniciar com PM2
pm2 start server.js --name dashboard-whatsapp

# Salvar configuração
pm2 save

# Configurar para iniciar no boot
pm2 startup
```

**IMPORTANTE:** Vai aparecer um comando para executar, copie e execute ele!

**Verificar se está rodando:**

```bash
pm2 status
pm2 logs dashboard-whatsapp
```

---

## 🌐 PASSO 6: Configurar Nginx

```bash
# Instalar Nginx
sudo apt install nginx -y

# Criar configuração
sudo nano /etc/nginx/sites-available/dashboard
```

**Cole esta configuração:**

```nginx
server {
    listen 80;
    server_name 72.61.51.143 srv1124953.hstgr.cloud;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Salvar:** `Ctrl+X` → `Y` → `Enter`

**Ativar e reiniciar:**

```bash
sudo ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔥 PASSO 7: Configurar Firewall

```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

**Se perguntar se quer continuar, digite:** `y`

---

## ✅ PASSO 8: Testar!

**Acesse no navegador:**

- **Com Nginx:** http://72.61.51.143
- **Ou:** http://srv1124953.hstgr.cloud
- **Sem Nginx:** http://72.61.51.143:3000

---

## 🔧 Comandos Úteis

```bash
# Ver logs em tempo real
pm2 logs dashboard-whatsapp

# Reiniciar aplicação
pm2 restart dashboard-whatsapp

# Parar aplicação
pm2 stop dashboard-whatsapp

# Ver status
pm2 status

# Ver uso de recursos
pm2 monit
```

---

## 🐛 Troubleshooting

### Erro: "Erro ao conectar ao PostgreSQL"

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Ver logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Erro: "Porta 3000 já em uso"

```bash
# Ver o que está usando a porta
sudo lsof -i :3000

# Matar processo
sudo kill -9 PID_DO_PROCESSO
```

### Erro: "npm: command not found"

```bash
# Reinstalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## 📞 Suporte

Se tiver algum erro, me envie:
1. O comando que executou
2. A mensagem de erro completa
3. O resultado de: `pm2 logs dashboard-whatsapp`

---

**Boa sorte! 🚀**
