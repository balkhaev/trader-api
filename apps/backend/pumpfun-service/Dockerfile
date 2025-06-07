# Используем Node.js 20 Alpine для минимального размера образа
FROM node:20-alpine AS base

# Устанавливаем pnpm глобально
RUN npm install -g pnpm

# Создаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY package.json pnpm-lock.yaml ./

# Устанавливаем зависимости
RUN pnpm install --frozen-lockfile

# Копируем исходный код
COPY . .

# Собираем приложение
RUN pnpm run build

# Стадия production
FROM node:20-alpine AS production

# Устанавливаем pnpm и curl для healthcheck
RUN npm install -g pnpm && \
    apk add --no-cache curl

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Создаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY package.json pnpm-lock.yaml ./

# Устанавливаем только production зависимости
RUN pnpm install --frozen-lockfile --prod

# Копируем собранное приложение
COPY --from=base /app/dist ./dist

# Создаем директорию для логов
RUN mkdir -p logs && chown -R nestjs:nodejs logs

# Переключаемся на пользователя nestjs
USER nestjs

# Открываем порт
EXPOSE 3000

# Проверка здоровья
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Запускаем приложение
CMD ["node", "dist/main"] 
