# stage 1
FROM node:18 as builder
ARG APP_VERSION="version undefined"
ENV APP_VERSION ${APP_VERSION}
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY --from=builder /usr/src/app/dist /usr/share/caddy
