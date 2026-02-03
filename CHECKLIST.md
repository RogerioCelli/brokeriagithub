# ✅ CHECKLIST - Configuração do Dashboard

## ✔️ Já Feito:
- [x] Node.js instalado (v24.13.0)
- [x] Projeto criado em `e:\Projetos\Antigravity\dashboard-whatsapp`
- [x] Arquivo `.env` criado

---

## 📝 PRÓXIMOS PASSOS:

### 1️⃣ Editar o arquivo .env

**Abra o arquivo:** `e:\Projetos\Antigravity\dashboard-whatsapp\.env`

**Edite estas linhas com seus dados do PostgreSQL:**

```env
DB_HOST=localhost          # ou IP do servidor PostgreSQL
DB_PORT=5432              # porta do PostgreSQL
DB_NAME=SEU_BANCO_AQUI    # ⚠️ EDITE AQUI
DB_USER=SEU_USUARIO_AQUI  # ⚠️ EDITE AQUI
DB_PASSWORD=SUA_SENHA_AQUI # ⚠️ EDITE AQUI
PORT=3000
```

**Salve o arquivo!**

---

### 2️⃣ Abrir um NOVO terminal PowerShell

1. Pressione **Win + X**
2. Escolha **"Terminal"** ou **"Windows PowerShell"**
3. Navegue até a pasta:

```powershell
cd e:\Projetos\Antigravity\dashboard-whatsapp
```

---

### 3️⃣ Verificar se o Node.js está funcionando

```powershell
node --version
npm --version
```

**Deve aparecer:**
- Node: v24.13.0
- npm: 10.x.x

---

### 4️⃣ Instalar as dependências

```powershell
npm install
```

Aguarde a instalação (pode demorar 1-2 minutos).

---

### 5️⃣ Iniciar o servidor

```powershell
npm start
```

**Deve aparecer:**
```
✅ Conectado ao PostgreSQL: ...
🚀 Servidor rodando em http://localhost:3000
```

---

### 6️⃣ Acessar o Dashboard

Abra o navegador em: **http://localhost:3000**

---

## 🐛 Problemas Comuns

### ❌ "npm não é reconhecido"
**Solução:** Feche e abra um novo terminal

### ❌ "Erro ao conectar ao PostgreSQL"
**Solução:** Verifique:
1. PostgreSQL está rodando
2. Credenciais no `.env` estão corretas
3. Banco de dados existe
4. Tabela `brokeria_registros_brokeria` existe

### ❌ "Porta 3000 já em uso"
**Solução:** Mude a porta no `.env`:
```env
PORT=3001
```

---

## 📞 Comandos Úteis

```powershell
# Ver se o PostgreSQL está rodando (Windows)
Get-Service -Name postgresql*

# Matar processo na porta 3000
npx kill-port 3000

# Reinstalar dependências
rm -r node_modules
npm install
```

---

## 🚀 Deploy na VPS Hostinger

Depois de testar localmente, siga o guia:
**`DEPLOY_HOSTINGER.md`**

---

**Boa sorte! 🎉**
