FROM node:20-slim

WORKDIR /app

# Install Python + PyMuPDF system-wide (no venv needed in container)
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip && \
    pip3 install --no-cache-dir --break-system-packages PyMuPDF && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
RUN npm install --omit=dev

COPY backend/ .

EXPOSE 8000

CMD ["node", "index.js"]
