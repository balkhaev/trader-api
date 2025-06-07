import express from "express"
import cors from "cors"
import { GroqAgentManager, ProviderType } from "./agents/agent-manager"
import { NewsData, TweetData } from "./types/index"
import { GROQ_API_KEY } from "./utils/env"

const app = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3003

if (!GROQ_API_KEY) {
  throw new Error("⚠️ GROQ_API_KEY не задан")
}

// Инициализация менеджеров агентов
const groqAgentManager = new GroqAgentManager(GROQ_API_KEY)

// Настройка middleware
app.use(cors())
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Endpoint для проверки работоспособности
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ai-agents",
    timestamp: new Date().toISOString(),
    providers: {
      groq: !!GROQ_API_KEY,
    },
  })
})

// Endpoint для анализа новостей (оригинальный - только OpenAI)
app.post("/analyze/news", async (req, res) => {
  try {
    const newsData: NewsData = req.body

    if (!newsData.title || !newsData.content) {
      res.status(400).json({
        error: "Обязательные поля title и content не заданы",
      })
      return
    }

    const result = await groqAgentManager.analyzeNews(newsData)

    if (!result) {
      res.status(500).json({
        error: "Не удалось проанализировать новость",
      })
      return
    }

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("Ошибка анализа новости:", error)
    res.status(500).json({
      error: "Внутренняя ошибка сервера",
    })
  }
})

// Endpoint для анализа твитов (оригинальный - только OpenAI)
app.post("/analyze/tweet", async (req, res) => {
  try {
    const tweetData: TweetData = req.body

    if (!tweetData.text) {
      res.status(400).json({
        error: "Обязательное поле text не задано",
      })
      return
    }

    const result = await groqAgentManager.analyzeTweet(tweetData)

    if (!result) {
      res.status(500).json({
        error: "Не удалось проанализировать твит",
      })
      return
    }

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("Ошибка анализа твита:", error)
    res.status(500).json({
      error: "Внутренняя ошибка сервера",
    })
  }
})

// Расширенный endpoint для анализа новостей с выбором провайдера
app.post("/v2/analyze/news", async (req, res) => {
  try {
    const { data: newsData, provider = "openai" } = req.body as {
      data: NewsData
      provider?: ProviderType
    }

    if (!newsData.title || !newsData.content) {
      res.status(400).json({
        error: "Обязательные поля title и content не заданы",
      })
      return
    }

    if (provider === "groq" && !groqAgentManager) {
      res.status(400).json({
        error: "Groq провайдер недоступен - проверьте GROQ_API_KEY",
      })
      return
    }

    const result = await groqAgentManager.analyzeNews(newsData, "groq")

    if (!result) {
      res.status(500).json({
        error: `Не удалось проанализировать новость с помощью ${provider}`,
      })
      return
    }

    res.json({
      success: true,
      provider,
      data: result,
    })
  } catch (error) {
    console.error("Ошибка анализа новости:", error)
    res.status(500).json({
      error: "Внутренняя ошибка сервера",
    })
  }
})

// Расширенный endpoint для анализа твитов с выбором провайдера
app.post("/v2/analyze/tweet", async (req, res) => {
  try {
    const { data: tweetData, provider = "openai" } = req.body as {
      data: TweetData
      provider?: ProviderType
    }

    if (!tweetData.text) {
      res.status(400).json({
        error: "Обязательное поле text не задано",
      })
      return
    }

    if (provider === "groq" && !groqAgentManager) {
      res.status(400).json({
        error: "Groq провайдер недоступен - проверьте GROQ_API_KEY",
      })
      return
    }

    const result = await groqAgentManager.analyzeTweet(tweetData, "groq")

    if (!result) {
      res.status(500).json({
        error: `Не удалось проанализировать твит с помощью ${provider}`,
      })
      return
    }

    res.json({
      success: true,
      provider,
      data: result,
    })
  } catch (error) {
    console.error("Ошибка анализа твита:", error)
    res.status(500).json({
      error: "Внутренняя ошибка сервера",
    })
  }
})

// Endpoint для сравнения результатов разных провайдеров
app.post("/compare", async (req, res) => {
  try {
    const { type, data } = req.body

    if (!type || !data) {
      res.status(400).json({
        error: "Обязательные поля type и data не заданы",
      })
      return
    }

    if (type !== "news" && type !== "tweet") {
      res.status(400).json({
        error: "Тип должен быть news или tweet",
      })
      return
    }

    if (!groqAgentManager) {
      res.status(400).json({
        error: "Сравнение недоступно - проверьте GROQ_API_KEY",
      })
      return
    }

    const results = await groqAgentManager.compareProviders({ type, data })

    res.json({
      success: true,
      comparison: results,
    })
  } catch (error) {
    console.error("Ошибка сравнения провайдеров:", error)
    res.status(500).json({
      error: "Внутренняя ошибка сервера",
    })
  }
})

// Универсальный endpoint для анализа контента (расширенный)
app.post("/analyze", async (req, res) => {
  try {
    const {
      type,
      data,
      provider = "groq",
    } = req.body as {
      type: "news" | "tweet"
      data: NewsData | TweetData
      provider?: ProviderType
    }

    if (!type || !data) {
      res.status(400).json({
        error: "Обязательные поля type и data не заданы",
      })
      return
    }

    if (type !== "news" && type !== "tweet") {
      res.status(400).json({
        error: "Тип должен быть news или tweet",
      })
      return
    }

    if (provider === "groq" && !groqAgentManager) {
      res.status(400).json({
        error: "Groq провайдер недоступен - проверьте GROQ_API_KEY",
      })
      return
    }

    const result = await groqAgentManager.analyzeContent({
      type,
      data,
      provider,
    })

    if (!result) {
      res.status(500).json({
        error: `Не удалось проанализировать контент с помощью ${provider}`,
      })
      return
    }

    res.json({
      success: true,
      provider,
      data: result,
    })
  } catch (error) {
    console.error("Ошибка анализа контента:", error)
    res.status(500).json({
      error: "Внутренняя ошибка сервера",
    })
  }
})

// Endpoint для получения информации о сервисе
app.get("/info", (req, res) => {
  res.json({
    service: "AI Agents Service",
    version: "2.0.0",
    description:
      "Сервис для анализа новостей и твитов с помощью AI агентов (OpenAI и Groq)",
    providers: {
      groq: !!GROQ_API_KEY,
    },
    endpoints: [
      "GET /health - проверка работоспособности",
      "GET /info - информация о сервисе",
      "POST /analyze/news - анализ новостей (OpenAI)",
      "POST /analyze/tweet - анализ твитов (OpenAI)",
      "POST /v2/analyze/news - анализ новостей с выбором провайдера",
      "POST /v2/analyze/tweet - анализ твитов с выбором провайдера",
      "POST /analyze - универсальный анализ с выбором провайдера",
      "POST /compare - сравнение результатов OpenAI и Groq",
    ],
  })
})

// Функция для запуска сервера
export const startServer = (): void => {
  app.listen(PORT, () => {
    console.log(`🚀 AI Agents сервер запущен на порту ${PORT}`)
    console.log(`📊 Доступные провайдеры:`)
    console.log(`   Groq: ${GROQ_API_KEY ? "✅" : "❌"}`)
    console.log(`📝 Доступные endpoints:`)
    console.log(`   GET  http://localhost:${PORT}/health`)
    console.log(`   GET  http://localhost:${PORT}/info`)
    console.log(`   POST http://localhost:${PORT}/analyze/news`)
    console.log(`   POST http://localhost:${PORT}/analyze/tweet`)
    console.log(`   POST http://localhost:${PORT}/v2/analyze/news`)
    console.log(`   POST http://localhost:${PORT}/v2/analyze/tweet`)
    console.log(`   POST http://localhost:${PORT}/analyze`)
    console.log(`   POST http://localhost:${PORT}/compare`)
  })
}

// Функция для получения приложения Express (для тестирования)
export const getApp = (): express.Application => {
  return app
}

// Запуск сервера, если файл запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer()
}
