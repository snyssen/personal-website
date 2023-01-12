# stage 1
FROM node:18 as builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY --from=builder /usr/src/app/dist /usr/share/caddy
