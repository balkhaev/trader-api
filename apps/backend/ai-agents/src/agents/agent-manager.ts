import config from "../../agents.json"
import { GroqNewsAnalyst } from "./news-analyst"
import { GroqTweetAnalyst } from "./tweet-analyst"
import { NewsData, TweetData, AnalysisResult } from "../types/index"

export type ProviderType = "openai" | "groq"

export class GroqAgentManager {
  private newsAnalystGroq: GroqNewsAnalyst
  private tweetAnalystGroq: GroqTweetAnalyst

  constructor(groqApiKey: string) {
    // Groq агенты
    this.newsAnalystGroq = new GroqNewsAnalyst(config.news_analyst, groqApiKey)
    this.tweetAnalystGroq = new GroqTweetAnalyst(
      config.tweet_analyst,
      groqApiKey
    )
  }

  async analyzeNews(
    newsData: NewsData,
    provider: ProviderType = "openai"
  ): Promise<AnalysisResult | null> {
    try {
      return await this.newsAnalystGroq.analyze(newsData)
    } catch (error) {
      console.error(`Ошибка анализа новости (${provider}):`, error)
      return null
    }
  }

  async analyzeTweet(
    tweetData: TweetData,
    provider: ProviderType = "openai"
  ): Promise<AnalysisResult | null> {
    try {
      return await this.tweetAnalystGroq.analyze(tweetData)
    } catch (error) {
      console.error(`Ошибка анализа твита (${provider}):`, error)
      return null
    }
  }

  async analyzeContent(content: {
    type: "news" | "tweet"
    data: NewsData | TweetData
    provider?: ProviderType
  }): Promise<AnalysisResult | null> {
    const provider = content.provider || "openai"

    if (content.type === "news") {
      return this.analyzeNews(content.data as NewsData, provider)
    } else if (content.type === "tweet") {
      return this.analyzeTweet(content.data as TweetData, provider)
    }

    throw new Error("Неподдерживаемый тип контента")
  }

  // Метод для сравнения результатов разных провайдеров
  async compareProviders(content: {
    type: "news" | "tweet"
    data: NewsData | TweetData
  }): Promise<{
    openai: AnalysisResult | null
    groq: AnalysisResult | null
  }> {
    const [openaiResult, groqResult] = await Promise.all([
      this.analyzeContent({ ...content, provider: "openai" }),
      this.analyzeContent({ ...content, provider: "groq" }),
    ])

    return {
      openai: openaiResult,
      groq: groqResult,
    }
  }
}
