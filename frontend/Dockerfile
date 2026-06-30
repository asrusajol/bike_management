# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first — cached unless package files change
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit --no-fund

# Pass API base URL at build time.
# Leave empty (default) when nginx reverse proxy routes /api → backend.
# Override with: docker build --build-arg VITE_API_URL=https://api.example.com
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build


# ── Stage 2: serve ────────────────────────────────────────────────────────────
# Final image is pure nginx:alpine — no Node, no source, no node_modules.
FROM nginx:1.27-alpine AS runtime

# Remove default site
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf            /etc/nginx/conf.d/app.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# nginx writes pid/tmp files as root by default; keep that default for simplicity
CMD ["nginx", "-g", "daemon off;"]
