#!/bin/bash

# GitHub Automation - Ubuntu Deployment Script
# یک دستور برای بالا آوردن تمام سیستم

set -e

echo "🚀 شروع deployment..."

# رنگ‌های output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ===== 1. System Updates =====
echo -e "${YELLOW}1. بروزرسانی سیستم...${NC}"
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget git build-essential

# ===== 2. Node.js و NPM =====
echo -e "${YELLOW}2. نصب Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# ===== 3. PostgreSQL =====
echo -e "${YELLOW}3. نصب PostgreSQL...${NC}"
sudo apt install -y postgresql postgresql-contrib

# شروع PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# ===== 4. Redis =====
echo -e "${YELLOW}4. نصب Redis...${NC}"
sudo apt install -y redis-server

# شروع Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# ===== 5. Git Clone یا Pull =====
echo -e "${YELLOW}5. دانلود پروژه...${NC}"
PROJECT_DIR="/opt/github-automation"

if [ ! -d "$PROJECT_DIR" ]; then
    sudo git clone <YOUR_REPO_URL> $PROJECT_DIR
else
    cd $PROJECT_DIR
    sudo git pull
fi

sudo chown -R $USER:$USER $PROJECT_DIR
cd $PROJECT_DIR

# ===== 6. NPM Dependencies =====
echo -e "${YELLOW}6. نصب dependencies...${NC}"
npm install

# ===== 6.5. Build Frontend =====
echo -e "${YELLOW}6.5. ساخت Frontend...${NC}"
npm run build

# ===== 7. Environment Setup =====
echo -e "${YELLOW}7. تنظیم .env...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}   ⚠️  فایل .env ایجاد شد - لطفاً مقادیر را تکمیل کنید:${NC}"
    echo "   nano $PROJECT_DIR/.env"
fi

# ===== 8. Database Setup =====
echo -e "${YELLOW}8. تنظیم Database...${NC}"
sudo -u postgres psql -c "CREATE DATABASE github_automation;" 2>/dev/null || true

# اتصال به database و اجرای schema
PGPASSWORD="" psql -U postgres -d github_automation -f src/server/database.sql 2>/dev/null || \
sudo -u postgres psql -d github_automation -f src/server/database.sql

# ===== 9. PM2 Setup =====
echo -e "${YELLOW}9. تنظیم PM2...${NC}"
sudo npm install -g pm2

# حذف process قدیمی (اگر موجود باشد)
pm2 delete github-automation 2>/dev/null || true

# شروع application
pm2 start npm --name "github-automation" -- start
pm2 startup
pm2 save

# ===== 10. Nginx Reverse Proxy =====
echo -e "${YELLOW}10. تنظیم Nginx...${NC}"
sudo apt install -y nginx

# حذف config پیشفرض
sudo rm -f /etc/nginx/sites-enabled/default

# ایجاد config جدید
sudo tee /etc/nginx/sites-available/github-automation > /dev/null <<EOF
upstream backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name _;
    client_max_body_size 50M;

    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_cache_bypass \$http_upgrade;
    }

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

# فعال‌کردن config
sudo ln -sf /etc/nginx/sites-available/github-automation /etc/nginx/sites-enabled/

# تست و شروع Nginx
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx

# ===== 11. Firewall =====
echo -e "${YELLOW}11. تنظیم Firewall...${NC}"
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "y" | sudo ufw enable

# ===== Complete =====
echo -e "${GREEN}"
echo "✅ Deployment تکمیل شد!"
echo ""
echo "📊 وضعیت سیستم:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Server Address: http://$(hostname -I | awk '{print $1}')"
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"
echo ""
echo "📋 Services:"
pm2 status
echo ""
echo "🗄️  PostgreSQL: $(sudo systemctl is-active postgresql)"
echo "🔴 Redis: $(sudo systemctl is-active redis-server)"
echo "🌐 Nginx: $(sudo systemctl is-active nginx)"
echo ""
echo "⚙️  ادامه کار:"
echo "1. .env را ویرایش کن: nano $PROJECT_DIR/.env"
echo "2. سرور را restart کن: pm2 restart github-automation"
echo "3. لاگ‌ها را ببین: pm2 logs github-automation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"
