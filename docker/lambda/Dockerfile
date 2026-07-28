FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache git

COPY package*.json ./

RUN npm install && npm install -g tsx

EXPOSE 3000

CMD ["tsx", "src/dev-server.ts"]
