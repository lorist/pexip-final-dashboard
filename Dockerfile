# Stage 1: Build the React application
[cite_start]FROM node:18-alpine AS build [cite: 1]

[cite_start]WORKDIR /app [cite: 1]

[cite_start]COPY package*.json ./ [cite: 1]
[cite_start]RUN npm install [cite: 1]

COPY . [cite_start]. [cite: 1]
[cite_start]RUN npm run build [cite: 2]

# Stage 2: Serve the application with Nginx
[cite_start]FROM nginx:stable-alpine [cite: 2]

# Copy the build output from the build stage
[cite_start]COPY --from=build /app/dist /usr/share/nginx/html [cite: 2]

# Copy the Nginx configuration for HTTPS (ensure this file exists in your project directory)
COPY nginx-https.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 # Expose port 80 for HTTP (Certbot challenge and redirect)
EXPOSE 443 # Expose port 443 for HTTPS

CMD ["nginx", "-g", "daemon off;"]