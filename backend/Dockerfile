# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Create a directory for the database and ensure it's writable
RUN mkdir -p /app/data && chmod -R 777 /app/data

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

# Define a volume for persistent storage of the SQLite database
VOLUME /app/data

CMD ["node", "server.js"]