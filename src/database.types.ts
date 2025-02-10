export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analysis: {
        Row: {
          change24h: number | null
          created_at: string | null
          e0v1e: Json | null
          id: number
          last_price: number
          long: Json
          open_interest: number | null
          rating: number | null
          short: Json
          symbol: string
          ta240: Json | null
          ta30: Json | null
          volume24h: number
        }
        Insert: {
          change24h?: number | null
          created_at?: string | null
          e0v1e?: Json | null
          id?: never
          last_price: number
          long: Json
          open_interest?: number | null
          rating?: number | null
          short: Json
          symbol: string
          ta240?: Json | null
          ta30?: Json | null
          volume24h?: number
        }
        Update: {
          change24h?: number | null
          created_at?: string | null
          e0v1e?: Json | null
          id?: never
          last_price?: number
          long?: Json
          open_interest?: number | null
          rating?: number | null
          short?: Json
          symbol?: string
          ta240?: Json | null
          ta30?: Json | null
          volume24h?: number
        }
        Relationships: []
      }
      buys: {
        Row: {
          coin: string
          created_at: string
          id: number
          indicators: Json
          order_id: string
          price: number
          qty: string
          selled: boolean
          stop_loss: number | null
          symbol: string
          take_profit: number | null
          type: string
          wait_for: number | null
        }
        Insert: {
          coin: string
          created_at?: string
          id?: never
          indicators: Json
          order_id: string
          price: number
          qty: string
          selled?: boolean
          stop_loss?: number | null
          symbol: string
          take_profit?: number | null
          type: string
          wait_for?: number | null
        }
        Update: {
          coin?: string
          created_at?: string
          id?: never
          indicators?: Json
          order_id?: string
          price?: number
          qty?: string
          selled?: boolean
          stop_loss?: number | null
          symbol?: string
          take_profit?: number | null
          type?: string
          wait_for?: number | null
        }
        Relationships: []
      }
      coins: {
        Row: {
          created_at: string
          id: number
          name: string | null
          rating: number | null
          short: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          name?: string | null
          rating?: number | null
          short?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string | null
          rating?: number | null
          short?: string | null
        }
        Relationships: []
      }
      funding_rates: {
        Row: {
          exchange_id: string
          funding_rate: number
          id: number
          liquidity_score: number
          symbol: string
          timestamp: string | null
        }
        Insert: {
          exchange_id: string
          funding_rate: number
          id?: never
          liquidity_score: number
          symbol: string
          timestamp?: string | null
        }
        Update: {
          exchange_id?: string
          funding_rate?: number
          id?: never
          liquidity_score?: number
          symbol?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      news: {
        Row: {
          content: string | null
          created_at: string
          id: number
          parsed_at: string | null
          tags: string[]
          title: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: number
          parsed_at?: string | null
          tags?: string[]
          title?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: number
          parsed_at?: string | null
          tags?: string[]
          title?: string | null
        }
        Relationships: []
      }
      news_coins: {
        Row: {
          coin: number | null
          created_at: string
          id: number
          news: number | null
        }
        Insert: {
          coin?: number | null
          created_at?: string
          id?: number
          news?: number | null
        }
        Update: {
          coin?: number | null
          created_at?: string
          id?: number
          news?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "news_coins_coin_fkey"
            columns: ["coin"]
            isOneToOne: false
            referencedRelation: "coins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_coins_news_fkey"
            columns: ["news"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      scams: {
        Row: {
          ca: string | null
          created_at: string
          id: number
          name: string
        }
        Insert: {
          ca?: string | null
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          ca?: string | null
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      sells: {
        Row: {
          candles1: Json
          candles15: Json
          candles3: Json
          candles30: Json
          created_at: string | null
          id: number
          indicators: Json
          pnl: number
          symbol: string
        }
        Insert: {
          candles1: Json
          candles15: Json
          candles3: Json
          candles30: Json
          created_at?: string | null
          id?: never
          indicators: Json
          pnl: number
          symbol: string
        }
        Update: {
          candles1?: Json
          candles15?: Json
          candles3?: Json
          candles30?: Json
          created_at?: string | null
          id?: never
          indicators?: Json
          pnl?: number
          symbol?: string
        }
        Relationships: []
      }
      tweets: {
        Row: {
          author: string | null
          bookmarks: number | null
          content: string | null
          created_at: string
          hashtags: string[] | null
          id: number
          likes: number | null
          retweets: number | null
          views: number | null
        }
        Insert: {
          author?: string | null
          bookmarks?: number | null
          content?: string | null
          created_at?: string
          hashtags?: string[] | null
          id?: number
          likes?: number | null
          retweets?: number | null
          views?: number | null
        }
        Update: {
          author?: string | null
          bookmarks?: number | null
          content?: string | null
          created_at?: string
          hashtags?: string[] | null
          id?: number
          likes?: number | null
          retweets?: number | null
          views?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_most_recent_unique_symbols: {
        Args: Record<PropertyKey, never>
        Returns: {
          change24h: number | null
          created_at: string | null
          e0v1e: Json | null
          id: number
          last_price: number
          long: Json
          open_interest: number | null
          rating: number | null
          short: Json
          symbol: string
          ta240: Json | null
          ta30: Json | null
          volume24h: number
        }[]
      }
      get_unique_symbols: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      candle_intervals:
        | "1"
        | "3"
        | "5"
        | "15"
        | "30"
        | "60"
        | "120"
        | "240"
        | "360"
        | "720"
        | "D"
        | "W"
        | "M"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
