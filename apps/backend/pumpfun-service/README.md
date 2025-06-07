# PumpPortal Integration Service

Полный сервис интеграции с [PumpPortal API](https://pumpportal.fun/) для работы с Pump.fun и Raydium DEX на блокчейне Solana.

## 🚀 Возможности

### 🔥 Lightning Transaction API

- Быстрые сделки buy/sell через PumpPortal
- Автоматическое управление кошельком
- Оптимизированная скорость исполнения
- Поддержка Jito bundles

### 🛠️ Local Transaction API

- Создание транзакций для локального подписания
- Полный контроль над приватными ключами
- Кастомный RPC endpoint
- Безопасность и прозрачность

### 📡 Real-time Data Streaming

- WebSocket подключение к PumpPortal
- События создания новых токенов
- Live торговые данные
- Миграции в Raydium
- Отслеживание конкретных аккаунтов

### 💾 Данные и Аналитика

- Сохранение данных в PostgreSQL
- Статистика токенов и трейдеров
- Анализ рисков новых токенов
- История торгов и цен
- Топ холдеры и объемы

## 📋 Требования

- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- API ключ PumpPortal (для торговли)

## 🛠️ Установка

1. **Клонирование и установка зависимостей:**

```bash
cd apps/backend/pumpportal-service
npm install
```

2. **Настройка переменных окружения:**

```bash
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

3. **Настройка базы данных:**

```bash
# Создайте базу данных PostgreSQL
createdb pumpportal_db

# Миграции выполнятся автоматически при запуске
```

4. **Запуск сервиса:**

```bash
# Разработка
npm run start:dev

# Продакшн
npm run build
npm run start:prod
```

## ⚙️ Конфигурация

### Основные переменные окружения:

```env
# PumpPortal API
PUMPPORTAL_API_KEY=your-api-key-here
PUMPPORTAL_BASE_URL=https://pumpportal.fun/api
PUMPPORTAL_WS_URL=wss://pumpportal.fun/api/data

# База данных
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=pumpportal_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Сервер
PORT=3003
NODE_ENV=development

# Lightning Wallet (опционально)
LIGHTNING_WALLET_PUBLIC_KEY=
LIGHTNING_WALLET_PRIVATE_KEY=

# Solana RPC
SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
SOLANA_COMMITMENT=confirmed
```

## 📚 API Endpoints

### 🔥 Торговля

#### Lightning Trade (Быстрая торговля)

```http
POST /trading/lightning
Content-Type: application/json

{
  "action": "buy",
  "mint": "HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC",
  "amount": 0.1,
  "denominatedInSol": true,
  "slippage": 10,
  "priorityFee": 0.00005,
  "pool": "auto"
}
```

#### Local Transaction (Локальная транзакция)

```http
POST /trading/local
Content-Type: application/json

{
  "publicKey": "YourWalletPublicKey...",
  "action": "sell",
  "mint": "HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC",
  "amount": 1000000,
  "denominatedInSol": false,
  "slippage": 5,
  "priorityFee": 0.00001,
  "pool": "pump"
}
```

### 📊 Данные

#### Получить информацию о токене

```http
GET /trading/tokens/{mint}
```

#### Статистика токена

```http
GET /trading/tokens/{mint}/stats
```

#### Список токенов

```http
GET /trading/tokens?limit=10&offset=0
```

#### Последние сделки

```http
GET /trading/trades?mint={mint}&limit=20
```

### 🏥 Мониторинг

#### Статус сервиса

```http
GET /health
```

#### Детальная информация

```http
GET /health/detailed
```

## 🔌 WebSocket API

Подключение к: `ws://localhost:3003/pumpportal`

### События подписки:

#### Подписка на новые токены

```javascript
socket.emit('subscribe', {
  method: 'subscribeNewToken',
});
```

#### Подписка на сделки токена

```javascript
socket.emit('subscribe', {
  method: 'subscribeTokenTrade',
  keys: ['HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC'],
});
```

#### Подписка на сделки аккаунта

```javascript
socket.emit('subscribe', {
  method: 'subscribeAccountTrade',
  keys: ['AArPXm8JatJiuyEffuC1un2Sc835SULa4uQqDcaGpAjV'],
});
```

#### Подписка на миграции

```javascript
socket.emit('subscribe', {
  method: 'subscribeMigration',
});
```

### Получаемые события:

- `connected` - Подключение установлено
- `tokenCreated` - Создан новый токен
- `tokenTrade` - Торговая сделка
- `accountTrade` - Сделка аккаунта
- `migration` - Миграция в Raydium
- `tokenStatsUpdated` - Обновление статистики

## 🔧 Примеры использования

### JavaScript/Node.js

```javascript
const axios = require('axios');
const io = require('socket.io-client');

// REST API
async function buyToken() {
  const response = await axios.post('http://localhost:3003/trading/lightning', {
    action: 'buy',
    mint: 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC',
    amount: 0.1,
    denominatedInSol: true,
    slippage: 10,
    priorityFee: 0.00005,
    pool: 'auto',
  });

  console.log('Результат покупки:', response.data);
}

// WebSocket
const socket = io('http://localhost:3003/pumpportal');

socket.on('connected', (data) => {
  console.log('Подключен:', data);

  // Подписка на новые токены
  socket.emit('subscribe', {
    method: 'subscribeNewToken',
  });
});

socket.on('tokenCreated', (data) => {
  console.log('Новый токен:', data);
});
```

### Python

```python
import requests
import socketio

# REST API
def buy_token():
    response = requests.post('http://localhost:3003/trading/lightning', json={
        'action': 'buy',
        'mint': 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC',
        'amount': 0.1,
        'denominatedInSol': True,
        'slippage': 10,
        'priorityFee': 0.00005,
        'pool': 'auto'
    })
    print('Результат покупки:', response.json())

# WebSocket
sio = socketio.Client()

@sio.event
def connected(data):
    print('Подключен:', data)
    sio.emit('subscribe', {
        'method': 'subscribeNewToken'
    })

@sio.event
def tokenCreated(data):
    print('Новый токен:', data)

sio.connect('http://localhost:3003/pumpportal')
```

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PumpPortal    │    │  PumpPortal     │    │   Your App      │
│   REST API      │◄──►│    Service      │◄──►│   (Client)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  PostgreSQL     │
                    │   Database      │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │     Redis       │
                    │   (Queues)      │
                    └─────────────────┘
```

### Компоненты:

- **PumpPortalService** - Основная логика интеграции
- **TradingController** - REST API для торговли
- **PumpPortalGateway** - WebSocket Gateway
- **TokenProcessor** - Обработка событий токенов
- **Entities** - Модели данных (Token, Trade)

## 🔍 Логирование и Мониторинг

Сервис предоставляет подробное логирование всех операций:

- Торговые операции
- WebSocket события
- Ошибки и предупреждения
- Статистика производительности

Endpoints для мониторинга:

- `/health` - Базовый статус
- `/health/detailed` - Детальная информация

## 🛡️ Безопасность

- Валидация всех входящих данных
- Rate limiting для API
- Безопасное хранение API ключей
- Поддержка локальных транзакций для полного контроля

## 🤝 Поддержка

Для вопросов и поддержки:

- Telegram: [PumpPortal Support](https://t.me/pumpportal)
- GitHub Issues
- Email: support@yourproject.com

## 📄 Лицензия

MIT License

---

**⚠️ Важно:** Торговля криптовалютами сопряжена с высокими рисками. Используйте сервис ответственно и только с теми средствами, потерю которых вы можете себе позволить.
