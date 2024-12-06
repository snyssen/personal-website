# stage 1
FROM mcr.microsoft.com/playwright:v1.49.0-focal as builder
ARG APP_VERSION="version undefined"
ARG WEBSITE_URI="https://snyssen.be"
ENV APP_VERSION ${APP_VERSION}
ENV WEBSITE_URI ${WEBSITE_URI}
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:ci

FROM caddy:2-alpine
COPY --from=builder /usr/src/app/dist /usr/share/caddy
