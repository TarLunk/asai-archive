FROM node:23

# создание директории приложения
WORKDIR /usr/src/docker/asai-tg-bots

COPY package*.json ./

RUN npm install

# копируем исходный код
COPY . .

RUN npm run build

CMD [ "npm", "run", "start" ]