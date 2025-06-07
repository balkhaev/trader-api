export interface NewsData {
  title: string
  content: string
  source?: string
  url?: string
  timestamp?: string
}

export interface TweetData {
  text: string
  author?: string
  timestamp?: string
  url?: string
  metrics?: {
    likes?: number
    retweets?: number
    replies?: number
  }
}

export interface AnalysisResult {
  sentiment: "positive" | "negative" | "neutral"
  confidence: number
  impact_level: "low" | "medium" | "high"
  market_relevance: boolean
  summary: string
  key_points: string[]
  affected_markets?: string[]
}

export interface AgentState {
  input: NewsData | TweetData
  analysis?: AnalysisResult
  error?: string
}
