# API Node + Prisma (PostgreSQL)
FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

COPY server.js ./
COPY prismaClient.js ./
COPY middleware ./middleware
COPY seed-admin.js ./

RUN npx prisma generate

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=5000
# Surchargé par docker-compose / plateforme
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/lifetag?schema=public

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
