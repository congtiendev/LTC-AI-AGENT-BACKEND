FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p logs uploads/avatars uploads/temp

EXPOSE 3000

USER node

CMD ["npm", "start"]
