FROM node:24.13.1 AS runtime
WORKDIR /app

FROM mcr.microsoft.com/playwright:v1.58.2 AS builder
ARG APP_VERSION="version undefined"
ARG WEBSITE_URI="https://snyssen.be"
ENV APP_VERSION=${APP_VERSION}
ENV WEBSITE_URI=${WEBSITE_URI}
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:ci

FROM runtime AS prod-deps
COPY package*.json ./
RUN npm install --omit=dev

FROM runtime AS final
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
ENV HOST=0.0.0.0
ENV PORT=80
EXPOSE 80
CMD ["node", "./dist/server/entry.mjs"]
