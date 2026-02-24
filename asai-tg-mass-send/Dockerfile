FROM node:24-slim

# создание директории приложения
WORKDIR /usr/src/docker/asai-tg-mass-send

COPY package*.json ./

RUN npm install

# копируем исходный код
COPY . .

RUN npm run build

CMD [ "npm", "run", "start" ]