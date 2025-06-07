#!/bin/bash

# PumpFun Trader Management Script
# Скрипт для управления PumpFun трейдером

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода цветного текста
print_color() {
    printf "${1}${2}${NC}\n"
}

# Функция для проверки статуса сервиса
check_service() {
    local url="http://localhost:3000/health"
    if curl -s -f "$url" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Функция для ожидания запуска сервиса
wait_for_service() {
    print_color $YELLOW "Ожидание запуска сервиса..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if check_service; then
            print_color $GREEN "✅ Сервис запущен и готов к работе!"
            return 0
        fi
        
        printf "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_color $RED "❌ Сервис не запустился в течение 60 секунд"
    return 1
}

# Функция для отображения статуса трейдера
show_status() {
    print_color $BLUE "📊 Статус трейдера:"
    curl -s http://localhost:3000/trader/status | jq '.' || print_color $RED "Ошибка получения статуса"
}

# Функция для отображения позиций
show_positions() {
    print_color $BLUE "📈 Открытые позиции:"
    curl -s http://localhost:3000/trader/positions | jq '.' || print_color $RED "Ошибка получения позиций"
}

# Функция для отображения статистики
show_stats() {
    print_color $BLUE "📊 Статистика торговли:"
    curl -s http://localhost:3000/trader/stats | jq '.' || print_color $RED "Ошибка получения статистики"
}

# Функция для запуска трейдера
start_trader() {
    print_color $GREEN "🚀 Запуск трейдера..."
    curl -s -X POST http://localhost:3000/trader/start | jq '.' || print_color $RED "Ошибка запуска трейдера"
}

# Функция для остановки трейдера
stop_trader() {
    print_color $YELLOW "⏹️ Остановка трейдера..."
    curl -s -X POST http://localhost:3000/trader/stop | jq '.' || print_color $RED "Ошибка остановки трейдера"
}

# Функция для отображения помощи
show_help() {
    echo "PumpFun Trader Management Script"
    echo ""
    echo "Использование: $0 [КОМАНДА]"
    echo ""
    echo "Команды:"
    echo "  start-services    Запустить все сервисы (Docker Compose)"
    echo "  stop-services     Остановить все сервисы"
    echo "  restart-services  Перезапустить все сервисы"
    echo "  logs             Показать логи сервиса"
    echo "  status           Показать статус трейдера"
    echo "  positions        Показать открытые позиции"
    echo "  stats            Показать статистику торговли"
    echo "  start-trading    Запустить торговлю"
    echo "  stop-trading     Остановить торговлю"
    echo "  close-all        Закрыть все позиции"
    echo "  monitor          Мониторинг в реальном времени"
    echo "  health           Проверить здоровье сервиса"
    echo "  help             Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  $0 start-services    # Запустить все сервисы"
    echo "  $0 start-trading     # Начать торговлю"
    echo "  $0 monitor           # Мониторинг позиций"
}

# Основная логика
case "${1:-help}" in
    "start-services")
        print_color $GREEN "🚀 Запуск всех сервисов..."
        docker-compose up -d
        wait_for_service
        ;;
    
    "stop-services")
        print_color $YELLOW "⏹️ Остановка всех сервисов..."
        docker-compose down
        ;;
    
    "restart-services")
        print_color $YELLOW "🔄 Перезапуск всех сервисов..."
        docker-compose restart
        wait_for_service
        ;;
    
    "logs")
        print_color $BLUE "📋 Логи сервиса:"
        docker-compose logs -f pumpfun-service
        ;;
    
    "status")
        show_status
        ;;
    
    "positions")
        show_positions
        ;;
    
    "stats")
        show_stats
        ;;
    
    "start-trading")
        start_trader
        ;;
    
    "stop-trading")
        stop_trader
        ;;
    
    "close-all")
        print_color $YELLOW "🔴 Закрытие всех позиций..."
        curl -s -X POST http://localhost:3000/trader/positions/close-all | jq '.'
        ;;
    
    "monitor")
        print_color $BLUE "📊 Мониторинг трейдера (Ctrl+C для выхода)..."
        while true; do
            clear
            echo "=== PumpFun Trader Monitor ==="
            echo "Время: $(date)"
            echo ""
            show_status
            echo ""
            show_positions
            echo ""
            echo "Обновление через 10 секунд..."
            sleep 10
        done
        ;;
    
    "health")
        if check_service; then
            print_color $GREEN "✅ Сервис работает нормально"
            exit 0
        else
            print_color $RED "❌ Сервис недоступен"
            exit 1
        fi
        ;;
    
    "help"|*)
        show_help
        ;;
esac 
