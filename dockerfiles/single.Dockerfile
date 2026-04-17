FROM node:20-slim

# Install MariaDB, Python, PyMuPDF
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        mariadb-server \
        python3 python3-pip && \
    pip3 install --no-cache-dir --break-system-packages PyMuPDF && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Build React frontend
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Empty REACT_APP_API_URL = use relative paths (same origin as backend)
ENV REACT_APP_API_URL=""
RUN npm run build

# Setup backend
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/ ./

# Put the React build where Express will serve it
RUN cp -r /frontend/build /app/public

# DB init script
COPY db/init.sql /init.sql

# Entrypoint
COPY dockerfiles/entrypoint-single.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
