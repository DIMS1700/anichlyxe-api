FROM python:3.9-slim

# Install dependency sistem untuk browser
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Browser Playwright
RUN playwright install --with-deps chromium

COPY . .

# Perintah jalan
CMD ["uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "8000"]