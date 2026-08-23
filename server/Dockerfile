FROM node:20-alpine

WORKDIR /app

COPY package.json ./

RUN npm cache clean --force && npm install --legacy-peer-deps

COPY . .

EXPOSE 4000

CMD ["npm", "start"]
