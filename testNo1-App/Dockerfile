# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package definition files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy remaining source code
COPY . .

# Embed environment variables
ENV VITE_COINGECKO_API_KEY=CG-yUn7AHZj9EfEGiFM8sFBdsET
ENV VITE_USE_API_KEY=true

# Build the application
RUN pnpm build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
