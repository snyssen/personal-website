VERSION 0.7
FROM mcr.microsoft.com/playwright:v1.29.0-focal
WORKDIR /usr/src/app

deps:
    COPY package*.json ./
    RUN npm install

build:
    FROM +deps
    ARG APP_VERSION="version undefined"
    ARG WEBSITE_URI="https://snyssen.be"
    ENV APP_VERSION ${APP_VERSION}
    ENV WEBSITE_URI ${WEBSITE_URI}
    COPY . .
    RUN npm run build:ci
    SAVE ARTIFACT dist AS LOCAL dist

docker:
    FROM caddy:2-alpine
    ARG IMAGE_TAG="latest"
    COPY +build/dist /usr/share/caddy
    SAVE IMAGE --push snyssen/personal-website:$IMAGE_TAG
