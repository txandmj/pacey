FROM node:20-slim AS builder

WORKDIR /app

# Accept API URL at build time so React can bake it in
ARG REACT_APP_API_URL=http://localhost:8000
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
RUN npm run build

# Serve the built app with a lightweight static server
FROM node:20-slim
RUN npm install -g serve
COPY --from=builder /app/build /app/build
EXPOSE 3000
CMD ["serve", "-s", "/app/build", "-l", "3000"]
