const axios = require("axios");
const io = require("socket.io-client");

// Конфигурация
const API_BASE_URL = "http://localhost:3003";
const WS_URL = "http://localhost:3003/pumpportal";

class PumpPortalClient {
  constructor() {
    this.apiClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
    });

    this.socket = null;
    this.isConnected = false;
  }

  // Подключение к WebSocket
  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      this.socket = io(WS_URL);

      this.socket.on("connect", () => {
        console.log("✅ WebSocket подключен");
        this.isConnected = true;
        resolve();
      });

      this.socket.on("connected", (data) => {
        console.log("📡 Получено приветствие:", data);
      });

      this.socket.on("disconnect", () => {
        console.log("❌ WebSocket отключен");
        this.isConnected = false;
      });

      this.socket.on("error", (error) => {
        console.error("🚨 WebSocket ошибка:", error);
        reject(error);
      });

      // Обработчики событий
      this.setupEventHandlers();
    });
  }

  // Настройка обработчиков событий
  setupEventHandlers() {
    this.socket.on("tokenCreated", (data) => {
      console.log("🆕 Новый токен создан:", {
        symbol: data.data.symbol,
        name: data.data.name,
        mint: data.data.mint,
        dev: data.data.dev,
        timestamp: data.timestamp,
      });
    });

    this.socket.on("tokenTrade", (data) => {
      console.log("💰 Новая сделка:", {
        type: data.data.txType,
        mint: data.data.mint,
        sol: data.data.sol,
        tokenAmount: data.data.tokenAmount,
        trader: data.data.traderPublicKey,
        timestamp: data.timestamp,
      });
    });

    this.socket.on("migration", (data) => {
      console.log("🚀 Миграция в Raydium:", {
        symbol: data.data.symbol,
        mint: data.data.mint,
        timestamp: data.timestamp,
      });
    });

    this.socket.on("subscribed", (data) => {
      console.log("✅ Подписка активирована:", data);
    });

    this.socket.on("unsubscribed", (data) => {
      console.log("❌ Отписка выполнена:", data);
    });
  }

  // Подписка на новые токены
  async subscribeToNewTokens() {
    if (!this.isConnected) {
      throw new Error("WebSocket не подключен");
    }

    this.socket.emit("subscribe", {
      method: "subscribeNewToken",
    });
  }

  // Подписка на сделки токена
  async subscribeToTokenTrades(tokenMints) {
    if (!this.isConnected) {
      throw new Error("WebSocket не подключен");
    }

    this.socket.emit("subscribe", {
      method: "subscribeTokenTrade",
      keys: tokenMints,
    });
  }

  // Подписка на миграции
  async subscribeToMigrations() {
    if (!this.isConnected) {
      throw new Error("WebSocket не подключен");
    }

    this.socket.emit("subscribe", {
      method: "subscribeMigration",
    });
  }

  // Lightning торговля
  async lightningTrade(tradeData) {
    try {
      console.log("⚡ Выполняю Lightning Trade:", tradeData);

      const response = await this.apiClient.post(
        "/trading/lightning",
        tradeData,
      );

      console.log("✅ Lightning Trade результат:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка Lightning Trade:",
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  // Локальная транзакция
  async createLocalTransaction(tradeData) {
    try {
      console.log("🔧 Создаю локальную транзакцию:", tradeData);

      const response = await this.apiClient.post("/trading/local", tradeData);

      console.log("✅ Локальная транзакция создана:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка создания локальной транзакции:",
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  // Получить информацию о токене
  async getTokenInfo(mint) {
    try {
      const response = await this.apiClient.get(`/trading/tokens/${mint}`);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка получения информации о токене:",
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  // Получить статистику токена
  async getTokenStats(mint) {
    try {
      const response = await this.apiClient.get(
        `/trading/tokens/${mint}/stats`,
      );
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка получения статистики токена:",
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  // Получить список токенов
  async getTokens(limit = 10, offset = 0) {
    try {
      const response = await this.apiClient.get(
        `/trading/tokens?limit=${limit}&offset=${offset}`,
      );
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка получения списка токенов:",
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  // Получить последние сделки
  async getLatestTrades(mint = null, limit = 10) {
    try {
      const url = mint
        ? `/trading/trades?mint=${mint}&limit=${limit}`
        : `/trading/trades?limit=${limit}`;

      const response = await this.apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Ошибка получения сделок:",
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  // Проверка здоровья сервиса
  async checkHealth() {
    try {
      const response = await this.apiClient.get("/health");
      console.log("🏥 Статус сервиса:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Сервис недоступен:", error.message);
      throw error;
    }
  }

  // Отключение
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log("👋 WebSocket отключен");
    }
  }
}

// Пример использования
async function main() {
  const client = new PumpPortalClient();

  try {
    // Проверяем здоровье сервиса
    await client.checkHealth();

    // Подключаемся к WebSocket
    await client.connectWebSocket();

    // Подписываемся на события
    await client.subscribeToNewTokens();
    await client.subscribeToMigrations();

    // Получаем список токенов
    const tokens = await client.getTokens(5);
    console.log("📊 Топ токены:", tokens);

    // Получаем последние сделки
    const trades = await client.getLatestTrades(null, 5);
    console.log("💹 Последние сделки:", trades);

    // Пример Lightning Trade (закомментирован для безопасности)
    /*
    const lightningTradeResult = await client.lightningTrade({
      action: 'buy',
      mint: 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC',
      amount: 0.01,
      denominatedInSol: true,
      slippage: 10,
      priorityFee: 0.00005,
      pool: 'auto'
    });
    */

    // Пример создания локальной транзакции (закомментирован)
    /*
    const localTxResult = await client.createLocalTransaction({
      publicKey: 'YourWalletPublicKey...',
      action: 'buy',
      mint: 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC',
      amount: 0.01,
      denominatedInSol: true,
      slippage: 10,
      priorityFee: 0.00005,
      pool: 'pump'
    });
    */

    console.log("🎉 Клиент запущен! Ожидаю события...");
    console.log("Нажмите Ctrl+C для выхода");

    // Обработка выхода
    process.on("SIGINT", () => {
      console.log("\n👋 Завершение работы...");
      client.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error("🚨 Ошибка:", error.message);
    client.disconnect();
    process.exit(1);
  }
}

// Запуск примера
if (require.main === module) {
  main();
}

module.exports = PumpPortalClient;
