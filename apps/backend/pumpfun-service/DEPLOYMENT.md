# Развертывание PumpPortal Service

## 🚀 Быстрый старт

### 1. Локальная разработка

```bash
# Переход в директорию сервиса
cd apps/backend/pumpportal-service

# Установка зависимостей
pnpm install

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env файл

# Запуск в режиме разработки
pnpm run start:dev
```

### 2. Docker Compose (Рекомендуется)

```bash
# Создайте .env файл с вашими настройками
echo "PUMPPORTAL_API_KEY=your-api-key-here" > .env

# Запуск всей инфраструктуры
docker-compose up -d

# Просмотр логов
docker-compose logs -f pumpportal-service

# Остановка
docker-compose down
```

## ⚙️ Конфигурация

### Обязательные переменные окружения:

```env
# PumpPortal API (обязательно для торговли)
PUMPPORTAL_API_KEY=your-api-key-here

# База данных
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=pumpportal_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Получение API ключа PumpPortal:

1. Перейдите на https://pumpportal.fun/
2. Создайте Lightning Wallet & API Key
3. **ВАЖНО:** Сохраните приватный ключ кошелька в безопасном месте
4. Скопируйте API ключ в переменную `PUMPPORTAL_API_KEY`

## 🗄️ База данных

### PostgreSQL Setup:

```bash
# Создание базы данных
createdb pumpportal_db

# Или через psql
psql -U postgres -c "CREATE DATABASE pumpportal_db;"
```

Миграции выполняются автоматически при запуске сервиса (в режиме разработки).

### Redis Setup:

```bash
# Установка Redis (Ubuntu/Debian)
sudo apt update
sudo apt install redis-server

# Запуск Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Проверка
redis-cli ping
```

## 🔧 Команды разработки

```bash
# Разработка с hot reload
pnpm run start:dev

# Сборка
pnpm run build

# Продакшн
pnpm run start:prod

# Тесты
pnpm run test

# Линтинг
pnpm run lint

# Форматирование
pnpm run format
```

## 🐳 Docker

### Сборка образа:

```bash
docker build -t pumpportal-service .
```

### Запуск контейнера:

```bash
docker run -d \
  --name pumpportal-service \
  -p 3003:3003 \
  -e PUMPPORTAL_API_KEY=your-api-key \
  -e DATABASE_HOST=host.docker.internal \
  -e REDIS_HOST=host.docker.internal \
  pumpportal-service
```

## 🌐 Доступные сервисы

После запуска через Docker Compose:

- **PumpPortal Service**: http://localhost:3003
- **Health Check**: http://localhost:3003/health
- **pgAdmin**: http://localhost:8080 (admin@pumpportal.local / admin)
- **Redis Commander**: http://localhost:8081

## 📊 Мониторинг

### Health Checks:

```bash
# Базовая проверка
curl http://localhost:3003/health

# Детальная информация
curl http://localhost:3003/health/detailed
```

### Логи:

```bash
# Docker Compose
docker-compose logs -f pumpportal-service

# Docker
docker logs -f pumpportal-service

# PM2 (если используется)
pm2 logs pumpportal-service
```

## 🔒 Безопасность

### Рекомендации:

1. **Никогда не коммитьте .env файлы**
2. **Используйте сильные пароли для БД**
3. **Ограничьте доступ к Redis**
4. **Настройте firewall для продакшн**
5. **Регулярно обновляйте зависимости**

### Переменные для продакшн:

```env
NODE_ENV=production
DATABASE_SSL=true
REDIS_PASSWORD=strong-password
RATE_LIMIT_ENABLED=true
CORS_ORIGIN=https://yourdomain.com
```

## 🚀 Продакшн развертывание

### 1. Подготовка сервера:

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Развертывание:

```bash
# Клонирование репозитория
git clone <your-repo-url>
cd trader/apps/backend/pumpportal-service

# Настройка переменных окружения
cp .env.example .env
nano .env  # Отредактируйте настройки

# Запуск
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Настройка Nginx (опционально):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /pumpportal {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🧪 Тестирование

### Запуск тестового клиента:

```bash
# Установка зависимостей для примера
cd examples
npm install axios socket.io-client

# Запуск тестового клиента
node client-example.js
```

### API тесты:

```bash
# Проверка здоровья
curl http://localhost:3003/health

# Получение токенов
curl http://localhost:3003/trading/tokens?limit=5

# Получение сделок
curl http://localhost:3003/trading/trades?limit=10
```

## 🔧 Устранение неполадок

### Частые проблемы:

1. **Сервис не запускается:**

   - Проверьте доступность PostgreSQL и Redis
   - Убедитесь что порт 3003 свободен
   - Проверьте переменные окружения

2. **WebSocket не подключается:**

   - Проверьте настройки CORS
   - Убедитесь что firewall не блокирует соединения

3. **Ошибки базы данных:**

   - Проверьте подключение к PostgreSQL
   - Убедитесь что база данных создана
   - Проверьте права пользователя

4. **Ошибки PumpPortal API:**
   - Проверьте API ключ
   - Убедитесь что кошелек пополнен (для Lightning API)
   - Проверьте лимиты API

### Логи и отладка:

```bash
# Включение debug логов
export DEBUG=pumpportal:*

# Проверка подключения к БД
docker-compose exec postgres psql -U postgres -d pumpportal_db -c "\dt"

# Проверка Redis
docker-compose exec redis redis-cli ping

# Мониторинг ресурсов
docker stats
```

## 📞 Поддержка

- **Документация**: README.md
- **Issues**: GitHub Issues
- **Telegram**: @pumpportal_support
- **Email**: support@yourproject.com

---

**⚠️ Важно**: Всегда тестируйте на тестовой среде перед развертыванием в продакшн!
