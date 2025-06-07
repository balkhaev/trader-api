# Digger - Криптовалютная торговая платформа

Комплексная платформа для анализа криптовалютных рынков с использованием AI и автоматизированной торговли.

## Архитектура

Платформа состоит из следующих микросервисов:

### Bybit Service

- **Порт**: 3005

### 📊 Tweet Analyzer (apps/backend/tweet-analyzer)

- **Порт**: 3004
- **Технологии**: NestJS, TypeScript, BullMQ, Redis
- **Функции**: Анализ твитов, генерация торговых рекомендаций, управление очередями
- **Интеграция**: Использует AI Service для анализа контента, встроенные очереди BullMQ для планирования задач
- **Очереди**: Анализ твитов, очистка данных, уведомления

### 📈 Freqtrade Manager (apps/backend/freqtrade-manager)

- **Порт**: 3003
- **Технологии**: Node.js
- **Функции**: Управление торговыми ботами Freqtrade

### 🤖 AI Service (apps/backend/ai-service)

- **Порт**: 3002
- **Технологии**: Python, FastAPI, CrewAI
- **Функции**: Анализ новостей и твитов с использованием AI агентов
- **API**: REST API для анализа тональности и значимости контента

### 🐦 Tweet Scraper (apps/backend/tweet-scraper)

- **Порт**: 3001
- **Технологии**: Node.js
- **Функции**: Сбор твитов из Twitter/X

### 🌐 Web Interface (apps/frontend/admin)

- **Порт**: 3000
- **Технологии**: Next.js, React
- **Функции**: Веб-интерфейс для управления платформой

### 🗄️ Redis

- **Порт**: 6379
- **Функции**: Хранилище для очередей Bull.js

## Быстрый старт

### Запуск через Docker Compose

```bash
# Клонирование репозитория
git clone <repository-url>
cd digger

# Создание файла переменных окружения
cp .env.example .env
# Отредактируйте .env файл с вашими API ключами

# Запуск всех сервисов
docker-compose up -d

# Проверка статуса
docker-compose ps
```

### Локальная разработка

#### Tweet Analyzer (с встроенными очередями)

```bash
cd apps/backend/tweet-analyzer
npm install
npm run dev
```

#### AI Service

```bash
cd apps/backend/ai-service
pip install -r requirements.txt
uvicorn src.ai_service.main:app --reload --port 8000
```

## API Endpoints

### Tweet Analyzer (http://localhost:3002)

- `GET /health` - Проверка здоровья (включая AI Service)
- `GET /ai-service/health` - Проверка AI Service
- `GET /analyze/search?query=bitcoin` - Анализ твитов по запросу
- `POST /analyze/tweet` - Анализ конкретного твита
- `GET /trading/recommendations?query=bitcoin` - Торговые рекомендации

#### Управление очередями:

- `GET /queue/health` - Проверка состояния очередей
- `POST /queue/jobs/tweet-analysis` - Добавить задачу анализа твитов
- `POST /queue/jobs/cleanup` - Добавить задачу очистки данных
- `POST /queue/jobs/notification` - Добавить задачу уведомления
- `GET /queue/stats` - Статистика очередей
- `POST /queue/scheduler/start` - Запуск планировщика
- `POST /queue/manual-analysis` - Ручной запуск анализа

### AI Service (http://localhost:8000)

- `GET /health` - Проверка здоровья сервиса
- `POST /analyze/tweet` - Анализ твита
- `POST /analyze/news` - Анализ новости
- `GET /` - Информация о сервисе

## Архитектура очередей

Tweet Analyzer использует встроенные очереди BullMQ:

```
┌─────────────────────────────────────┐    ┌─────────────┐
│         Tweet Analyzer              │───▶│    Redis    │
│  ┌─────────────┐ ┌─────────────┐    │    └─────────────┘
│  │   NestJS    │ │   BullMQ    │    │
│  │ Controllers │ │   Queues    │    │
│  └─────────────┘ └─────────────┘    │
└─────────────────────────────────────┘
                   │
                   ▼
           ┌──────────────┐
           │  AI Service  │
           └──────────────┘
```

### Преимущества встроенных очередей BullMQ:

1. **Интеграция**: Полная интеграция с NestJS экосистемой
2. **Масштабируемость**: Несколько воркеров могут обрабатывать задачи параллельно
3. **Надежность**: Автоматические повторы при ошибках
4. **Мониторинг**: Детальная статистика выполнения задач
5. **Гибкость**: Приоритизация задач и настраиваемые расписания
6. **Упрощение**: Один сервис вместо двух

## Тестирование интеграции

Запустите скрипт тестирования для проверки работы интеграции:

```bash
python test_integration.py
```

## Переменные окружения

### Tweet Analyzer

```env
PORT=3002
AI_SERVICE_URL=http://localhost:8000
TWITTER_SCRAPER_URL=http://localhost:3000
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
```

### AI Service

```env
OPENAI_API_KEY=your_openai_api_key
CREWAI_API_KEY=your_crewai_api_key
```

## Разработка

### Структура проекта

```
digger/
├── apps/
│   ├── backend/
│   │   ├── ai-service/          # AI анализ (Python + FastAPI)
│   │   ├── tweet-analyzer/      # Анализ твитов (TypeScript)

│   │   ├── tweet-scraper/       # Сбор твитов (Node.js)
│   │   └── freqtrade-manager/   # Управление ботами
│   └── frontend/
│       └── admin/               # Веб-интерфейс (Next.js)
├── packages/                    # Общие пакеты
├── docker-compose.yml           # Конфигурация Docker
└── test_integration.py          # Тесты интеграции
```

### Workflow разработки

1. **Queue Service**: Настройка очередей и планировщиков
2. **Tweet Analyzer**: Интеграция с Queue Service для фоновых задач
3. **AI Service**: Разработка AI агентов и задач
4. **Тестирование**: Использование `test_integration.py` для проверки интеграции
5. **Деплой**: Через Docker Compose

## Мониторинг

- Queue Service: http://localhost:3004/health
- Tweet Analyzer: http://localhost:3002/health
- AI Service: http://localhost:8000/health
- Web Interface: http://localhost:3000
- Redis: localhost:6379

## Логи

```bash
# Просмотр логов всех сервисов
docker-compose logs -f

# Логи конкретного сервиса

docker-compose logs -f tweet-analyzer
docker-compose logs -f ai-service
docker-compose logs -f redis
```
