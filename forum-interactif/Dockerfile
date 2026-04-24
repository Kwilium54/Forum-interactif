#  Stage 1 : Build 
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances en premier
COPY package*.json ./
RUN npm ci

# Copier le reste du code source
COPY . .

# Build de l'application Nuxt
RUN npm run build

#  Stage 2 : Production 
FROM node:20-alpine AS runner

WORKDIR /app

# Copier uniquement le build final 
COPY --from=builder /app/.output /app/.output

ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
