# 🚀 Быстрый старт PumpFun Trader

## Предварительные требования

- Docker и Docker Compose
- Node.js 20+ и pnpm (для разработки)
- API ключ от PumpPortal
- jq (для работы со скриптами)

## Быстрый запуск

### 1. Настройка окружения

```bash
# Скопируйте пример конфигурации
cp .env.example .env

# Отредактируйте .env файл и добавьте ваш API ключ
nano .env
```

### 2. Запуск сервисов

```bash
# Запуск всех сервисов (PostgreSQL, Redis, PumpFun Trader)
./scripts/start-trader.sh start-services

# Или через Docker Compose напрямую
docker-compose up -d
```

### 3. Проверка статуса

```bash
# Проверка здоровья сервиса
./scripts/start-trader.sh health

# Статус трейдера
./scripts/start-trader.sh status
```

### 4. Запуск торговли

```bash
# Запуск автоматической торговли
./scripts/start-trader.sh start-trading

# Мониторинг в реальном времени
./scripts/start-trader.sh monitor
```

## Основные команды

### Управление сервисами

```bash
./scripts/start-trader.sh start-services    # Запуск всех сервисов
./scripts/start-trader.sh stop-services     # Остановка всех сервисов
./scripts/start-trader.sh restart-services  # Перезапуск сервисов
./scripts/start-trader.sh logs             # Просмотр логов
```

### Управление торговлей

```bash
./scripts/start-trader.sh start-trading    # Запуск торговли
./scripts/start-trader.sh stop-trading     # Остановка торговли
./scripts/start-trader.sh close-all        # Закрытие всех позиций
```

### Мониторинг

```bash
./scripts/start-trader.sh status          # Статус трейдера
./scripts/start-trader.sh positions       # Открытые позиции
./scripts/start-trader.sh stats           # Статистика торговли
./scripts/start-trader.sh monitor         # Мониторинг в реальном времени
```

## Настройка стратегии

### Через API

```bash
# Получить текущие настройки
curl http://localhost:3000/trader/strategy

# Обновить настройки
curl -X PUT http://localhost:3000/trader/strategy \
  -H "Content-Type: application/json" \
  -d '{
    "buyAmount": 0.05,
    "stopLoss": 15,
    "takeProfit": 100,
    "maxPositions": 3
  }'
```

### Основные параметры

- `buyAmount`: Размер покупки в SOL (по умолчанию 0.1)
- `stopLoss`: Стоп-лосс в процентах (по умолчанию 20%)
- `takeProfit`: Тейк-профит в процентах (по умолчанию 50%)
- `maxPositions`: Максимальное количество позиций (по умолчанию 5)
- `minMarketCap`: Минимальная капитализация токена (по умолчанию $10,000)
- `maxMarketCap`: Максимальная капитализация токена (по умолчанию $1,000,000)

## Безопасность

⚠️ **ВАЖНО**: Трейдер работает с реальными деньгами!

- Начните с малых сумм для тестирования
- Регулярно проверяйте открытые позиции
- Настройте адекватные стоп-лоссы
- Мониторьте логи на предмет ошибок

## Мониторинг

### Веб-интерфейсы

- Трейдер API: http://localhost:3000
- Проверка здоровья: http://localhost:3000/health

### Логи

```bash
# Просмотр логов в реальном времени
docker logs -f pumpfun-trader

# Фильтрация логов трейдера
docker logs pumpfun-trader 2>&1 | grep "PumpFunTraderService"
```

## Примеры использования

### Базовая настройка для консервативной торговли

```bash
curl -X PUT http://localhost:3000/trader/strategy \
  -H "Content-Type: application/json" \
  -d '{
    "buyAmount": 0.02,
    "stopLoss": 10,
    "takeProfit": 30,
    "maxPositions": 2,
    "minMarketCap": 50000,
    "maxMarketCap": 500000
  }'
```

### Агрессивная настройка

```bash
curl -X PUT http://localhost:3000/trader/strategy \
  -H "Content-Type: application/json" \
  -d '{
    "buyAmount": 0.1,
    "stopLoss": 25,
    "takeProfit": 100,
    "maxPositions": 5,
    "minMarketCap": 5000,
    "maxMarketCap": 2000000
  }'
```

### Анализ конкретного токена

```bash
# Замените MINT_ADDRESS на реальный адрес токена
curl http://localhost:3000/trader/analyze/MINT_ADDRESS
```

### Принудительная покупка/продажа

```bash
# Принудительная покупка
curl -X POST http://localhost:3000/trader/buy/MINT_ADDRESS

# Принудительная продажа
curl -X POST http://localhost:3000/trader/sell/MINT_ADDRESS
```

## Устранение неполадок

### Сервис не запускается

1. Проверьте логи: `docker logs pumpfun-trader`
2. Убедитесь, что PostgreSQL и Redis запущены
3. Проверьте настройки в .env файле

### Трейдер не торгует

1. Убедитесь, что торговля запущена: `./scripts/start-trader.sh status`
2. Проверьте API ключ PumpPortal
3. Убедитесь, что есть подходящие токены для торговли

### Ошибки подключения к базе данных

1. Проверьте статус PostgreSQL: `docker ps`
2. Проверьте настройки подключения в .env
3. Перезапустите сервисы: `./scripts/start-trader.sh restart-services`

## Поддержка

Для получения помощи:

1. Проверьте логи сервиса
2. Убедитесь, что все зависимости установлены
3. Проверьте настройки в .env файле
4. Создайте issue в репозитории проекта

## Остановка

```bash
# Остановка торговли (позиции остаются открытыми)
./scripts/start-trader.sh stop-trading

# Закрытие всех позиций и остановка торговли
./scripts/start-trader.sh close-all
./scripts/start-trader.sh stop-trading

# Полная остановка всех сервисов
./scripts/start-trader.sh stop-services
```
