# frontend/Dockerfile

# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./
# Install dependencies
RUN npm install

# Copy the public folder contents (including index.html) to the WORKDIR root
# This makes index.html directly accessible at /app/index.html for Vite
COPY public/ ./

# Copy the rest of the application code (your src folder, etc.)
COPY . .

# Build the React application
# Assuming 'npm run build' outputs to a 'build' directory.
# If your setup outputs to 'dist', change '/app/build' to '/app/dist' below.
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine

# Copy the build output from the build stage
# Ensure this path matches the output directory of your React build (e.g., /app/build or /app/dist)
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the Nginx configuration file for this frontend service
# This assumes your nginx.conf is in the same directory as this Dockerfile
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for Nginx
EXPOSE 80

# Command to start Nginx
CMD ["nginx", "-g", "daemon off;"]
