import { GroqAgent } from "./agent"
import { TweetData } from "../types/index"

export class GroqTweetAnalyst extends GroqAgent {
  protected buildPrompt(input: unknown): string {
    const tweetData = input as TweetData

    return `
Проанализируй следующий твит в финансовом контексте:

Текст твита: ${tweetData.text}
Автор: ${tweetData.author || "Не указан"}
Дата: ${tweetData.timestamp || "Не указана"}
URL: ${tweetData.url || "Не указан"}
Метрики: ${tweetData.metrics ? `Лайки: ${tweetData.metrics.likes || 0}, Ретвиты: ${tweetData.metrics.retweets || 0}, Ответы: ${tweetData.metrics.replies || 0}` : "Не указаны"}

Верни результат анализа СТРОГО в JSON формате:
{
  "sentiment": "positive|negative|neutral",
  "confidence": 0.0-1.0,
  "impact_level": "high|medium|low",
  "market_relevance": true|false,
  "summary": "краткое описание влияния на рынок",
  "key_points": ["ключевой пункт 1", "ключевой пункт 2"],
  "affected_markets": ["рынок1", "рынок2"]
}

Не добавляй никаких пояснений до или после JSON.
    `
  }
}
