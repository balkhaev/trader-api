import { GroqAgent } from "./agent"
import { NewsData } from "../types/index"

export class GroqNewsAnalyst extends GroqAgent {
  protected buildPrompt(input: unknown): string {
    const newsItem = input as NewsData

    return `
Проанализируй следующую новость в финансовом контексте:

Заголовок: ${newsItem.title}
Содержание: ${newsItem.content || "Не указано"}
Источник: ${newsItem.source || "Не указан"}
URL: ${newsItem.url || "Не указан"}
Дата: ${newsItem.timestamp || "Не указана"}

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
