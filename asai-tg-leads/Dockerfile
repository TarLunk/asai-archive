FROM node:24-slim

WORKDIR /usr/src/docker/asai-tg-leads

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD [ "npm", "run", "start" ]