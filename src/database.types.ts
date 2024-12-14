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
          adx: Json | null
          atr: number | null
          bollinger_bands: Json | null
          cci: number | null
          change24h: number | null
          created_at: string | null
          e0v1e: Json | null
          ema: number | null
          id: number
          indicators: Json | null
          last_price: number
          long: Json
          macd: Json | null
          momentum: number | null
          obv: number | null
          open_interest: number | null
          rating: number | null
          rsi: number | null
          short: Json
          signal: number | null
          sma: number | null
          stochastic_rsi: Json | null
          symbol: string
          trend: string
          volume24h: number
        }
        Insert: {
          adx?: Json | null
          atr?: number | null
          bollinger_bands?: Json | null
          cci?: number | null
          change24h?: number | null
          created_at?: string | null
          e0v1e?: Json | null
          ema?: number | null
          id?: never
          indicators?: Json | null
          last_price: number
          long: Json
          macd?: Json | null
          momentum?: number | null
          obv?: number | null
          open_interest?: number | null
          rating?: number | null
          rsi?: number | null
          short: Json
          signal?: number | null
          sma?: number | null
          stochastic_rsi?: Json | null
          symbol: string
          trend: string
          volume24h?: number
        }
        Update: {
          adx?: Json | null
          atr?: number | null
          bollinger_bands?: Json | null
          cci?: number | null
          change24h?: number | null
          created_at?: string | null
          e0v1e?: Json | null
          ema?: number | null
          id?: never
          indicators?: Json | null
          last_price?: number
          long?: Json
          macd?: Json | null
          momentum?: number | null
          obv?: number | null
          open_interest?: number | null
          rating?: number | null
          rsi?: number | null
          short?: Json
          signal?: number | null
          sma?: number | null
          stochastic_rsi?: Json | null
          symbol?: string
          trend?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_most_recent_unique_symbols: {
        Args: Record<PropertyKey, never>
        Returns: {
          adx: Json | null
          atr: number | null
          bollinger_bands: Json | null
          cci: number | null
          change24h: number | null
          created_at: string | null
          e0v1e: Json | null
          ema: number | null
          id: number
          indicators: Json | null
          last_price: number
          long: Json
          macd: Json | null
          momentum: number | null
          obv: number | null
          open_interest: number | null
          rating: number | null
          rsi: number | null
          short: Json
          signal: number | null
          sma: number | null
          stochastic_rsi: Json | null
          symbol: string
          trend: string
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
