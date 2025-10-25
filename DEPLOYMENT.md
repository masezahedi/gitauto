# 🚀 راهنمای Deployment روی Ubuntu

## سریع‌ترین روش (5 دقیقه)

### 1️⃣ SSH به سرور

```bash
ssh root@your_server_ip
```

### 2️⃣ یک دستور برای همه چیز

```bash
git clone https://github.com/YOUR_USERNAME/github-automation.git
cd github-automation
chmod +x deploy.sh
./deploy.sh
```

**یکی دو دقیقه منتظر:**
- ✅ PostgreSQL + Redis
- ✅ Node.js + NPM
- ✅ Frontend Build (React + Vite)
- ✅ Backend (Express)
- ✅ PM2 + Nginx
- ✅ تمام چیز آپ و بالا!

**سرور آدرس:** `http://your_server_ip`

---

## بعد از Deployment

### 1. GitHub OAuth Setup

```bash
nano /opt/github-automation/.env
```

**این‌ها را تکمیل کن:**
```
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_CALLBACK_URL=http://your_server_ip/api/auth/github/callback
JWT_SECRET=your_random_secret
```

### 2. Restart سرور

```bash
pm2 restart github-automation
```

### 3. لاگ‌ها

```bash
pm2 logs github-automation
```

---

## موارد مانوال (اگر Script کار نکرد)

### Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres psql -d github_automation -f src/server/database.sql
```

### Redis
```bash
sudo apt install -y redis-server
sudo systemctl start redis-server
```

### PM2
```bash
sudo npm install -g pm2
cd /opt/github-automation
pm2 start src/server/server.js --name "github-automation"
pm2 startup
pm2 save
```

### Nginx
```bash
sudo apt install -y nginx
# کپی کن config از repo و enable کن
sudo systemctl start nginx
```

---

## مفید دستورات

```bash
# Status
pm2 status

# Restart
pm2 restart github-automation

# Stop
pm2 stop github-automation

# Logs
pm2 logs github-automation

# PostgreSQL
sudo -u postgres psql -d github_automation

# Redis
redis-cli

# Nginx Test
sudo nginx -t

# Nginx Restart
sudo systemctl restart nginx
```

---

## بدون Docker، بدون پیچیدگی ✅
