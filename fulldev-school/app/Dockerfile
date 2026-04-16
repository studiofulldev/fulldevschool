# =============================================================================
# Stage 0 — Dev
# Roda ng serve com hot reload. Usado pelo docker-compose em desenvolvimento.
# O código-fonte é montado via volume — alterações refletem sem rebuild.
# =============================================================================
FROM node:22-alpine AS dev

WORKDIR /app

COPY package*.json ./
RUN npm ci

EXPOSE 4200

# --host 0.0.0.0 obrigatório para aceitar conexões de fora do container.
# --poll 2000 necessário no macOS: inotify não funciona em bind mounts via Docker Desktop.
CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--poll", "2000"]

# =============================================================================
# Stage 1 — Build
# Compila a aplicação Angular com ng build.
# =============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Instala dependências antes de copiar o código-fonte para aproveitar o cache
# de camadas do Docker (só reinstala quando package*.json mudar).
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# =============================================================================
# Stage 2 — Serve
# Copia apenas o output de build para uma imagem nginx enxuta.
# =============================================================================
FROM nginx:1.27-alpine

# Output do @angular/build:application fica em dist/app/browser
COPY --from=builder /app/dist/app/browser /usr/share/nginx/html

# Configuração do nginx para SPA (todas as rotas → index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
