# Stage 1 - build the Angular app
FROM node:20-alpine AS build

WORKDIR /workspace

# install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# copy sources and build
COPY . .
# ensure production build
RUN npm run build -- --configuration production

# Stage 2 - serve static files with nginx (small, fast)
FROM nginx:1.25-alpine

# Remove default nginx html
RUN rm -rf /usr/share/nginx/html/*

# Copy built files from builder
COPY --from=build /workspace/dist/landportal-frontend /usr/share/nginx/html

# Copy a basic nginx conf to enable single-page-app routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port nginx listens on
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
