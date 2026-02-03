#!/bin/bash

# ========================================
# Script de Deploy para VPS Hostinger
# Dashboard WhatsApp - BrokerIA
# ========================================

echo "🚀 Iniciando deploy do Dashboard WhatsApp..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações (EDITE AQUI)
VPS_USER="seu_usuario"
VPS_HOST="seu_ip_ou_dominio"
VPS_PATH="/home/seu_usuario/dashboard-whatsapp"
DOMAIN="seu-dominio.com"

echo -e "${YELLOW}Configurações:${NC}"
echo "VPS: $VPS_USER@$VPS_HOST"
echo "Caminho: $VPS_PATH"
echo "Domínio: $DOMAIN"
echo ""

# Confirmar
read -p "As configurações estão corretas? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]
then
    echo -e "${RED}Deploy cancelado.${NC}"
    exit 1
fi

# 1. Fazer upload dos arquivos
echo -e "${YELLOW}📦 Fazendo upload dos arquivos...${NC}"
rsync -avz --exclude 'node_modules' --exclude '.env' --exclude '.git' \
    ./ $VPS_USER@$VPS_HOST:$VPS_PATH/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Upload concluído!${NC}"
else
    echo -e "${RED}❌ Erro no upload!${NC}"
    exit 1
fi

# 2. Executar comandos na VPS
echo -e "${YELLOW}🔧 Configurando na VPS...${NC}"
ssh $VPS_USER@$VPS_HOST << 'ENDSSH'

# Navegar para o diretório
cd $VPS_PATH

# Instalar dependências
echo "📦 Instalando dependências..."
npm install --production

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null
then
    echo "📦 Instalando PM2..."
    sudo npm install -g pm2
fi

# Parar processo anterior (se existir)
pm2 stop dashboard-whatsapp 2>/dev/null || true
pm2 delete dashboard-whatsapp 2>/dev/null || true

# Iniciar com PM2
echo "🚀 Iniciando aplicação com PM2..."
pm2 start server.js --name dashboard-whatsapp
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup | tail -n 1 | bash

echo "✅ Aplicação iniciada com sucesso!"
pm2 status

ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
    echo ""
    echo -e "${YELLOW}📝 Próximos passos:${NC}"
    echo "1. Configure o arquivo .env na VPS:"
    echo "   ssh $VPS_USER@$VPS_HOST"
    echo "   cd $VPS_PATH"
    echo "   nano .env"
    echo ""
    echo "2. Configure o Nginx (se ainda não configurado)"
    echo "3. Acesse: http://$DOMAIN"
else
    echo -e "${RED}❌ Erro no deploy!${NC}"
    exit 1
fi
