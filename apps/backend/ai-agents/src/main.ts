import { startServer } from "./server"

function main() {
  try {
    startServer()
  } catch (error) {
    console.error("❌ Ошибка запуска сервера:", error)
    process.exit(1)
  }
}

// Обработка сигналов для корректного завершения работы
process.on("SIGINT", () => {
  console.log("\n👋 Получен сигнал SIGINT, завершаем работу...")
  process.exit(0)
})

process.on("SIGTERM", () => {
  console.log("\n👋 Получен сигнал SIGTERM, завершаем работу...")
  process.exit(0)
})

main()
