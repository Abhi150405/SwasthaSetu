# Phase 1: Build the React application
FROM node:18-alpine AS build

# Set the working directory
WORKDIR /app

# Install pnpm or use npm (since the project uses pnpm)
RUN npm install -g pnpm

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN pnpm build

# Phase 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output to Nginx's public directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy a custom Nginx configuration if needed (e.g., for SPA routing)
# Create a basic nginx config for SPA
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://backend:5000; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_cache_bypass $http_upgrade; \
    } \
    location /api/ai { \
        proxy_pass http://backend-python:5001; \
    } \
    location /api/recipe { \
        proxy_pass http://backend-python:5001; \
    } \
    location /api/diet { \
        proxy_pass http://backend-python:5001; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
