# اتوماسیون GitHub

یک پلتفرم قدرتمند برای اتوماسیون کار با GitHub به صورت فارسی

## ویژگی‌ها

- 🔐 لاگین امن با GitHub OAuth
- 📦 مدیریت مخازن GitHub
- ⏰ برنامه‌زمانی اتوماسیون با CRON
- 📊 پنل مدیریت برای ادمین
- 📋 ردیابی لاگ‌های اجرا
- 🚀 قابلیت اجرای تا 2000 کاربر همزمان

## نیازمندی‌ها

- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- Git

## نصب محلی (Windows)

### 1. پایگاه داده

```sql
psql -U postgres
CREATE DATABASE github_automation;
psql -U postgres -d github_automation -f src/server/database.sql
```

### 2. متغیرهای محیط

```bash
cp .env.example .env
```

سپس `.env` را ویرایش کنید:

```
DATABASE_URL=postgresql://user:password@localhost:5432/github_automation
REDIS_URL=redis://localhost:6379
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
JWT_SECRET=your_super_secret_key
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. نصب وابستگی‌ها

```bash
npm install
```

### 4. اجرا

ابتدا Redis و PostgreSQL را شروع کنید، سپس:

```bash
npm run dev
```

برای اجرای جداگانه:

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

آدرس‌ها:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## بستر‌پذیری (Ubuntu)

### 1. نصب وابستگی‌ها

```bash
sudo apt update
sudo apt install -y nodejs npm postgresql redis-server git
```

### 2. تنظیم پایگاه داده

```bash
sudo -u postgres psql
CREATE DATABASE github_automation;
\q

sudo -u postgres psql -d github_automation < src/server/database.sql
```

### 3. نصب پروژه

```bash
git clone <repo-url> /opt/github-automation
cd /opt/github-automation
npm install
npm run build
```

### 4. تنظیم متغیرهای محیط

```bash
cp .env.example .env
nano .env
# ویرایش مقادیر مناسب
```

### 5. سرویس Systemd

فایل `/etc/systemd/system/github-automation.service`:

```ini
[Unit]
Description=GitHub Automation Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/github-automation
ExecStart=/usr/bin/node src/server/server.js
Restart=on-failure
RestartSec=10
Environment="NODE_ENV=production"
Environment="PORT=3000"

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable github-automation
sudo systemctl start github-automation
```

### 6. Nginx Reverse Proxy

فایل `/etc/nginx/sites-available/github-automation`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/github-automation /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## GitHub OAuth Setup

1. رفتن به https://github.com/settings/developers
2. "New OAuth App" کلیک کنید
3. فرم را پر کنید:
   - Application name: GitHub Automation
   - Homepage URL: http://localhost:3000
   - Authorization callback URL: http://localhost:3000/api/auth/github/callback
4. Client ID و Client Secret را کپی کنید
5. در `.env` قرار دهید

## ساختار پروژه

```
.
├── src/
│   ├── server/          # Express backend
│   │   ├── controllers/ # Business logic
│   │   ├── routes/      # API routes
│   │   ├── jobs/        # Scheduler و Worker
│   │   └── utils/       # Database، Redis، Git operations
│   └── client/          # React frontend
│       ├── pages/
│       ├── components/
│       └── utils/
├── public/
├── .env.example
├── package.json
└── README.md
```

## API Endpoints

### Authentication
- `GET /api/auth/github/url` - دریافت URL لاگین GitHub
- `GET /api/auth/github/callback` - Callback OAuth
- `GET /api/auth/me` - اطلاعات کاربر فعلی

### Repositories
- `GET /api/repositories` - لیست مخازن کاربر
- `GET /api/repositories/github` - مخازن GitHub
- `POST /api/repositories` - اضافه کردن مخزن
- `DELETE /api/repositories/:id` - حذف مخزن

### Automations
- `POST /api/automations` - ایجاد اتوماسیون
- `GET /api/automations` - لیست اتوماسیون‌ها
- `PUT /api/automations/:id` - بروزرسانی
- `DELETE /api/automations/:id` - حذف
- `GET /api/automations/:id/logs` - لاگ‌های اجرا

### Admin
- `GET /api/admin/users` - لیست کاربران
- `GET /api/admin/automations` - تمام اتوماسیون‌ها
- `GET /api/admin/logs` - تمام لاگ‌ها
- `GET /api/admin/stats` - آمار سیستم

## نکات مهم

- **امنیت**: access token‌های GitHub در پایگاه داده ذخیره می‌شوند، از رمزنگاری استفاده کنید
- **Scheduler**: برای بیش از 2000 کاربر، استفاده از BullMQ در Redis ضروری است
- **Timezone**: فعلاً timezone سرور استفاده می‌شود
- **Admin Access**: کاربر اول به طور خودکار admin است

## مشکل‌شناسی

### Redis connection refused
```bash
redis-server
```

### Database connection error
PostgreSQL راه افتاده است، connection string در `.env` درست است

### GitHub OAuth fails
Client ID و Secret را بررسی کنید
