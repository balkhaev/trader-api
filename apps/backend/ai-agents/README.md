# AI Agents Service

Сервис для анализа новостей и твитов с помощью AI агентов, поддерживающий OpenAI и Groq API.

## Возможности

- 📈 **Анализ новостей** - анализ финансового влияния новостей на рынки
- 🐦 **Анализ твитов** - анализ влияния социальных медиа на финансовые рынки
- 🤖 **AI агенты** - специализированные агенты для разных типов контента
- 🌊 **LangGraph.js** - использование графов состояний для обработки данных
- 🔄 **REST API** - простой API для интеграции с другими сервисами
- ⚡ **Мульти-провайдер** - поддержка OpenAI и Groq для максимальной гибкости
- 🔍 **Сравнение результатов** - возможность сравнить анализ разных AI провайдеров

## Структура проекта

```
src/
├── agents/          # AI агенты
│   ├── base-agent.ts           # Базовый класс агента (OpenAI)
│   ├── groq-agent.ts           # Базовый класс Groq агента
│   ├── news-analyst.ts         # Агент анализа новостей (OpenAI)
│   ├── tweet-analyst.ts        # Агент анализа твитов (OpenAI)
│   ├── groq-news-analyst.ts    # Агент анализа новостей (Groq)
│   ├── groq-tweet-analyst.ts   # Агент анализа твитов (Groq)
│   ├── agent-manager.ts        # Менеджер OpenAI агентов
│   └── groq-agent-manager.ts   # Менеджер с поддержкой Groq
├── config/          # Конфигурация
│   └── agents.yaml         # Настройки агентов
├── types/           # TypeScript типы
│   └── index.ts
├── utils/           # Утилиты
│   └── config.ts
├── server.ts        # Express сервер
└── main.ts         # Точка входа
```

## Установка и запуск

1. **Установка зависимостей:**

```bash
npm install
```

2. **Настройка переменных окружения:**

```bash
cp .env.example .env
# Отредактируйте .env и добавьте ваши API ключи:
# OPENAI_API_KEY=your_openai_key
# GROQ_API_KEY=your_groq_key (опционально)
```

3. **Запуск в режиме разработки:**

```bash
npm run dev
```

4. **Сборка для продакшена:**

```bash
npm run build
npm start
```

5. **Тестирование Groq функциональности:**

```bash
node test-groq.js
```

## API Endpoints

### GET /health

Проверка работоспособности сервиса и доступных провайдеров.

**Ответ:**

```json
{
  "status": "ok",
  "service": "ai-agents",
  "timestamp": "2024-01-15T10:30:00Z",
  "providers": {
    "openai": true,
    "groq": true
  }
}
```

### GET /info

Информация о сервисе и доступных endpoints.

### Оригинальные endpoints (только OpenAI)

#### POST /analyze/news

Анализ новости с помощью OpenAI.

#### POST /analyze/tweet

Анализ твита с помощью OpenAI.

### Новые endpoints с поддержкой провайдеров

#### POST /v2/analyze/news

Анализ новости с выбором провайдера.

**Запрос:**

```json
{
  "data": {
    "title": "Заголовок новости",
    "content": "Текст новости",
    "source": "Источник (опционально)",
    "url": "URL новости (опционально)",
    "timestamp": "Время публикации (опционально)"
  },
  "provider": "openai|groq"
}
```

#### POST /v2/analyze/tweet

Анализ твита с выбором провайдера.

**Запрос:**

```json
{
  "data": {
    "text": "Текст твита",
    "author": "Автор (опционально)",
    "timestamp": "Время публикации (опционально)",
    "url": "URL твита (опционально)",
    "metrics": {
      "likes": 100,
      "retweets": 50,
      "replies": 25
    }
  },
  "provider": "openai|groq"
}
```

#### POST /analyze

Универсальный endpoint для анализа с выбором провайдера.

**Запрос:**

```json
{
  "type": "news|tweet",
  "data": {
    // Данные в зависимости от типа
  },
  "provider": "openai|groq"
}
```

#### POST /compare

Сравнение результатов анализа между OpenAI и Groq.

**Запрос:**

```json
{
  "type": "news|tweet",
  "data": {
    // Данные для анализа
  }
}
```

**Ответ:**

```json
{
  "success": true,
  "comparison": {
    "openai": {
      "sentiment": "positive",
      "confidence": 0.85
      // ... остальные поля
    },
    "groq": {
      "sentiment": "positive",
      "confidence": 0.78
      // ... остальные поля
    }
  }
}
```

## Формат ответа анализа

Все endpoints анализа возвращают результат в следующем формате:

```json
{
  "success": true,
  "provider": "openai|groq",
  "data": {
    "sentiment": "positive|negative|neutral",
    "confidence": 0.85,
    "impact_level": "low|medium|high",
    "market_relevance": true,
    "summary": "Краткое резюме анализа",
    "key_points": ["Ключевой пункт 1", "Ключевой пункт 2"],
    "affected_markets": ["акции", "валютный рынок"]
  }
}
```

## Конфигурация агентов

Агенты настраиваются через файл `src/config/agents.yaml`:

```yaml
news_analyst:
  role: Финансовый аналитик новостей
  goal: Анализировать новости в финансовом контексте
  backstory: Описание экспертизы агента

tweet_analyst:
  role: Финансовый аналитик твитов
  goal: Анализировать твиты в финансовом контексте
  backstory: Описание экспертизы агента
```

## Примеры использования

### Анализ новости с OpenAI

```bash
curl -X POST http://localhost:3003/analyze/news \
  -H "Content-Type: application/json" \
  -d '{
    "title": "ЦБ РФ повысил ключевую ставку до 16%",
    "content": "Банк России принял решение повысить ключевую ставку на 200 б.п. до 16% годовых..."
  }'
```

### Анализ новости с Groq

```bash
curl -X POST http://localhost:3003/v2/analyze/news \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "title": "ЦБ РФ повысил ключевую ставку до 16%",
      "content": "Банк России принял решение повысить ключевую ставку на 200 б.п. до 16% годовых..."
    },
    "provider": "groq"
  }'
```

### Сравнение провайдеров

```bash
curl -X POST http://localhost:3003/compare \
  -H "Content-Type: application/json" \
  -d '{
    "type": "news",
    "data": {
      "title": "Tesla отчитается о рекордной прибыли",
      "content": "Компания Tesla готовится представить квартальные результаты..."
    }
  }'
```

### Анализ твита с Groq

```bash
curl -X POST http://localhost:3003/v2/analyze/tweet \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "text": "Bitcoin breaking new ATH! 🚀 #BTC #crypto",
      "author": "@cryptoexpert",
      "metrics": {"likes": 1500, "retweets": 300}
    },
    "provider": "groq"
  }'
```

## Переменные окружения

- `OPENAI_API_KEY` - API ключ OpenAI (обязательно)
- `GROQ_API_KEY` - API ключ Groq (опционально, для Groq функциональности)
- `PORT` - порт сервера (по умолчанию 3003)
- `NODE_ENV` - окружение (development/production)

## Поддерживаемые модели

### OpenAI

- `gpt-4-turbo-preview` (по умолчанию)

### Groq

- `llama-3.1-70b-versatile` (по умолчанию)
- `llama-3.1-8b-instant`
- `mixtral-8x7b-32768`

## Технологии

- **LangGraph.js** - для создания AI агентов с графами состояний
- **OpenAI GPT-4** - языковая модель для анализа
- **Groq API** - быстрые инференсы с Llama и Mixtral моделями
- **Express.js** - веб-сервер
- **TypeScript** - строгая типизация
- **YAML** - конфигурация агентов

## Преимущества Groq

- ⚡ **Скорость** - значительно быстрее OpenAI для многих задач
- 💰 **Стоимость** - более доступные цены
- 🔄 **Альтернатива** - резервный провайдер при недоступности OpenAI
- 🧪 **Эксперименты** - возможность сравнить качество разных моделей
