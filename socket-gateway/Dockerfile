FROM node:20-alpine

WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY . .

EXPOSE 13001
CMD ["node", "src/index.js"]
