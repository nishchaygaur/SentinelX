# ==============================================================================
# SentinelX Backend Production Dockerfile
# Optimized Node.js 24 runtime with native YARA scanning toolchain
# ==============================================================================

FROM node:24-bookworm-slim

# Install system dependencies & YARA
RUN apt-get update && apt-get install -y --no-install-recommends \
    yara \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application files
COPY . .

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Run as non-privileged node user for container security
USER node

CMD ["node", "src/server.js"]
