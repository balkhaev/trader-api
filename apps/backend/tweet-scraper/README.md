# Social Scrapper API

API для скрапинга твитов из Twitter с использованием twikit.

## Установка и запуск

1. Установите зависимости:

```bash
pip install -r requirements.txt
```

2. Запустите сервер:

```bash
python main.py
```

API будет доступен по адресу: http://localhost:3003

## Эндпоинты

### Health Check

- **GET** `/health` - проверка статуса API

### Поиск твитов

- **GET** `/twitter/search` - поиск твитов по запросу
  - `query` (обязательный) - строка поиска
  - `limit` (опциональный, по умолчанию 100) - максимум твитов
  - `since` (опциональный) - дата начала (YYYY-MM-DD)
  - `until` (опциональный) - дата конца (YYYY-MM-DD)
  - `lang` (опциональный) - код языка (ru/en/...)

### Твиты пользователя

- **GET** `/twitter/user/{username}` - получение твитов пользователя
  - `username` (путь) - имя пользователя Twitter
  - `limit` (опциональный, по умолчанию 100) - максимум твитов

### Legacy endpoint

- **GET** `/twitter` - старый эндпоинт для обратной совместимости

## Примеры использования

```bash
# Поиск твитов
curl "http://localhost:3003/twitter/search?query=python&limit=10&lang=en"

# Твиты пользователя
curl "http://localhost:3003/twitter/user/elonmusk?limit=5"

# Health check
curl "http://localhost:3003/health"
```

## Тестирование

Запустите тестовый скрипт:

```bash
python test_api.py
```

## Конфигурация

Учетные данные Twitter настраиваются в файле `twitter_scraper.py`:

- USERNAME
- EMAIL
- PASSWORD

Аутентификация сохраняется в файле `cookies.json`.
