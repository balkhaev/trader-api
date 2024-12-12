# Указываем базовый образ для Node.js
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --production

# Копируем исходный код
COPY . .

RUN npm run build

# Указываем команду для запуска приложения
CMD ["npm", "start"]

# Указываем порт для работы приложения
EXPOSE 3000
