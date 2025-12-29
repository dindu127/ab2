# =========================
# Stage 1: Build Angular
# =========================
FROM node:20-alpine AS build

WORKDIR /workspace

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build -- --configuration production

# =========================
# Stage 2: Serve with nginx
# =========================
FROM nginx:1.25-alpine

# Remove default nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy Angular build output
COPY --from=build /workspace/dist/landportal-frontend/browser /usr/share/nginx/html

# SPA routing support
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
