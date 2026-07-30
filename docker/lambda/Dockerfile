FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache git

COPY package*.json ./

RUN npm install

EXPOSE 3000

CMD ["npx", "ts-node", "--esm", "--no-warnings", "src/dev-server.ts"]
