FROM node:20-slim

WORKDIR /app

# Install Python + PyMuPDF for PDF→PNG conversion
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip && \
    pip3 install --no-cache-dir --break-system-packages PyMuPDF && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Node dependencies
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy backend source
COPY backend/ .

# Tesseract.js downloads language models on first use — pre-warm the cache
# so the first request isn't slow inside the container
RUN node -e "const T=require('tesseract.js'); T.recognize('./parser/abbott.png','eng').then(()=>process.exit(0)).catch(()=>process.exit(0));" || true

EXPOSE 3001

CMD ["node", "demo.js"]
