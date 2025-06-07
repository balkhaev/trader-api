# syntax=docker/dockerfile:1
FROM python:3.11-slim

# Set workdir
WORKDIR /app

# Copy project
COPY . /app

# Устанавливаем корневые сертификаты
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose default port (can be overridden)
ENV PORT=8000

CMD ["python", "-m", "main"] 
