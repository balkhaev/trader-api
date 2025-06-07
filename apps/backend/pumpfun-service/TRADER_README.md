# PumpFun Trader Service

Автоматический торговый сервис для PumpFun токенов, интегрированный с PumpPortal API.

## Функции

### 🤖 Автоматическая торговля

- Сканирование новых токенов в реальном времени
- Анализ токенов по настраиваемым критериям
- Автоматическое выполнение покупок и продаж
- Управление рисками с помощью стоп-лосс и тейк-профит

### 📊 Стратегии торговли

- **Momentum Scanner**: поиск токенов с растущей ценой и объемом
- Настраиваемые параметры фильтрации
- Управление максимальным количеством позиций
- Контроль размера позиций

### 💾 Управление данными

- Сохранение всех позиций в PostgreSQL
- Отслеживание статистики торговли
- Восстановление открытых позиций при перезапуске
- Подробная история торгов

## API Эндпоинты

### Управление трейдером

#### `GET /trader/status`

Получение текущего статуса трейдера

```json
{
  "success": true,
  "data": {
    "isTrading": true,
    "openPositions": 3,
    "watchedTokens": 15,
    "strategy": {...},
    "uptime": 3600
  }
}
```

#### `POST /trader/start`

Запуск трейдера

```json
{
  "success": true,
  "message": "Трейдер успешно запущен"
}
```

#### `POST /trader/stop`

Остановка трейдера

```json
{
  "success": true,
  "message": "Трейдер успешно остановлен"
}
```

### Управление позициями

#### `GET /trader/positions`

Получение всех открытых позиций

```json
{
  "success": true,
  "data": [
    {
      "id": "signature...",
      "mint": "token_mint_address",
      "entryPrice": 0.000045,
      "amount": 2222.22,
      "solInvested": 0.1,
      "timestamp": "2024-01-15T10:30:00Z",
      "status": "open"
    }
  ],
  "count": 1
}
```

#### `GET /trader/positions/:mint`

Получение детальной информации о позиции

```json
{
  "success": true,
  "data": {
    "id": "signature...",
    "mint": "token_mint_address",
    "entryPrice": 0.000045,
    "amount": 2222.22,
    "solInvested": 0.1,
    "timestamp": "2024-01-15T10:30:00Z",
    "status": "open"
  }
}
```

#### `POST /trader/positions/close-all`

Закрытие всех открытых позиций

```json
{
  "success": true,
  "message": "Все позиции успешно закрыты"
}
```

### Ручная торговля

#### `POST /trader/buy/:mint`

Принудительная покупка токена

```json
{
  "success": true,
  "message": "Покупка выполнена успешно",
  "data": {
    "signature": "transaction_signature"
  }
}
```

#### `POST /trader/sell/:mint`

Принудительная продажа токена

```json
{
  "success": true,
  "message": "Продажа выполнена успешно",
  "data": {
    "signature": "transaction_signature"
  }
}
```

### Стратегии

#### `GET /trader/strategy`

Получение текущих настроек стратегии

```json
{
  "success": true,
  "data": {
    "name": "Momentum Scanner",
    "enabled": true,
    "minMarketCap": 10000,
    "maxMarketCap": 1000000,
    "minVolume24h": 5000,
    "maxAge": 30,
    "buyAmount": 0.1,
    "stopLoss": 20,
    "takeProfit": 50,
    "maxPositions": 5,
    "slippage": 5,
    "priorityFee": 0.001
  }
}
```

#### `PUT /trader/strategy`

Обновление настроек стратегии

```json
{
  "buyAmount": 0.2,
  "stopLoss": 15,
  "takeProfit": 100,
  "maxPositions": 3
}
```

### Аналитика

#### `GET /trader/stats`

Получение статистики торговли

```json
{
  "success": true,
  "data": {
    "totalTrades": 25,
    "winTrades": 15,
    "loseTrades": 10,
    "totalPnl": 0.5,
    "winRate": 60,
    "avgWin": 0.05,
    "avgLoss": -0.02,
    "maxDrawdown": 0.1,
    "totalVolume": 2.5
  }
}
```

#### `GET /trader/analyze/:mint`

Анализ конкретного токена

```json
{
  "success": true,
  "data": {
    "token": {
      "mint": "token_address",
      "name": "Token Name",
      "symbol": "TKN",
      "marketCap": 50000,
      "volume24h": 10000,
      "price": 0.0001
    },
    "analysis": {
      "shouldBuy": true,
      "recommendation": "BUY",
      "reasons": [
        "✅ Токен свежий: 15.2 минут",
        "✅ Подходящая капитализация: $50,000",
        "✅ Достаточный объем: $10,000"
      ]
    }
  }
}
```

## Настройки стратегии

### Основные параметры

| Параметр       | Описание                             | Значение по умолчанию |
| -------------- | ------------------------------------ | --------------------- |
| `minMarketCap` | Минимальная капитализация ($)        | 10,000                |
| `maxMarketCap` | Максимальная капитализация ($)       | 1,000,000             |
| `minVolume24h` | Минимальный объем торгов за 24ч ($)  | 5,000                 |
| `maxAge`       | Максимальный возраст токена (минуты) | 30                    |
| `buyAmount`    | Размер покупки (SOL)                 | 0.1                   |
| `stopLoss`     | Стоп-лосс (%)                        | 20                    |
| `takeProfit`   | Тейк-профит (%)                      | 50                    |
| `maxPositions` | Максимальное количество позиций      | 5                     |
| `slippage`     | Проскальзывание (%)                  | 5                     |
| `priorityFee`  | Приоритетная комиссия (SOL)          | 0.001                 |

### Логика анализа токенов

Трейдер анализирует каждый новый токен по следующим критериям:

1. **Возраст токена** - только свежие токены (до 30 минут)
2. **Капитализация** - в диапазоне от $10k до $1M
3. **Объем торгов** - минимум $5k за 24 часа
4. **Momentum** - положительный рост цены за 24 часа

## Безопасность

### Управление рисками

- Автоматические стоп-лоссы для каждой позиции
- Лимит на максимальное количество открытых позиций
- Контроль размера позиций
- Проверка ликвидности перед входом

### Мониторинг

- Постоянная проверка позиций каждые 30 секунд
- Логирование всех операций
- Уведомления о критических событиях
- Детальная статистика торговли

## Установка и запуск

### Переменные окружения

```env
# PumpPortal API
PUMPPORTAL_BASE_URL=https://api.pumpportal.com
PUMPPORTAL_WS_URL=wss://api.pumpportal.com/ws
PUMPPORTAL_API_KEY=your_api_key

# База данных
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=pumpportal_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

NODE_ENV=development
```

### Запуск

```bash
# Установка зависимостей
pnpm install

# Запуск в режиме разработки
pnpm run start:dev

# Запуск в продакшене
pnpm run start:prod
```

### Мониторинг

```bash
# Проверка статуса
curl http://localhost:3000/health

# Статус трейдера
curl http://localhost:3000/trader/status

# Открытые позиции
curl http://localhost:3000/trader/positions

# Статистика
curl http://localhost:3000/trader/stats
```

## Logs и отладка

Трейдер ведет подробные логи всех операций:

- **INFO**: Общая информация о работе
- **DEBUG**: Детальная информация для отладки
- **WARN**: Предупреждения о потенциальных проблемах
- **ERROR**: Ошибки выполнения операций

```bash
# Просмотр логов в реальном времени
docker logs -f pumpfun-service

# Фильтрация логов трейдера
docker logs pumpfun-service 2>&1 | grep "PumpFunTraderService"
```

## Примеры использования

### Базовая настройка трейдера

```bash
# Запуск трейдера
curl -X POST http://localhost:3000/trader/start

# Настройка стратегии
curl -X PUT http://localhost:3000/trader/strategy \
  -H "Content-Type: application/json" \
  -d '{
    "buyAmount": 0.05,
    "stopLoss": 15,
    "takeProfit": 75,
    "maxPositions": 3
  }'
```

### Мониторинг позиций

```bash
# Проверка открытых позиций
curl http://localhost:3000/trader/positions

# Анализ конкретного токена
curl http://localhost:3000/trader/analyze/So11111111111111111111111111111111111111112

# Принудительная продажа
curl -X POST http://localhost:3000/trader/sell/So11111111111111111111111111111111111111112
```

### Получение статистики

```bash
# Общая статистика
curl http://localhost:3000/trader/stats

# Статус системы
curl http://localhost:3000/trader/status
```

## Поддержка

Для получения поддержки или сообщения об ошибках создайте issue в репозитории проекта.

## Лицензия

UNLICENSED - только для внутреннего использования.
