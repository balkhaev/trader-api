import Groq from "groq-sdk"
import { AgentConfig } from "../types/agent"
import { AnalysisResult } from "../types/index"

export abstract class GroqAgent {
  protected groq: Groq
  protected config: AgentConfig
  protected modelName: string

  constructor(
    config: AgentConfig,
    apiKey: string,
    modelName: string = "llama-3.1-70b-versatile"
  ) {
    this.config = config
    this.modelName = modelName
    this.groq = new Groq({
      apiKey: apiKey,
    })
  }

  protected abstract buildPrompt(input: unknown): string

  protected parseResponse(content: string): AnalysisResult {
    try {
      // Пытаемся найти JSON в ответе
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      // Если JSON не найден, возвращаем базовый результат
      return {
        sentiment: "neutral",
        confidence: 0.5,
        impact_level: "low",
        market_relevance: false,
        summary: content.substring(0, 200),
        key_points: [content.substring(0, 100)],
      }
    } catch (error) {
      // Возвращаем заглушку при ошибке парсинга
      return {
        sentiment: "neutral",
        confidence: 0.1,
        impact_level: "low",
        market_relevance: false,
        summary: "Ошибка парсинга ответа",
        key_points: ["Не удалось проанализировать"],
      }
    }
  }

  public async analyze(input: unknown): Promise<AnalysisResult | null> {
    try {
      const prompt = this.buildPrompt(input)
      const systemMessage = `${this.config.role}\n\nЦель: ${this.config.goal}\n\nПредыстория: ${this.config.backstory}`

      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: systemMessage,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: this.modelName,
        temperature: 0.3,
        max_tokens: 1024,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error("Пустой ответ от Groq API")
      }

      const analysis = this.parseResponse(content)
      return analysis
    } catch (error) {
      console.error("Ошибка в Groq агенте:", error)
      return null
    }
  }
}
