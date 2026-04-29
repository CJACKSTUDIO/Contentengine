# ────────────────────────────────────────────────────────────
#  Catjack content worker
#
#  Node 20 base + Python (for yt-dlp) + ffmpeg (yt-dlp post-processing).
#  Single-stage image — Railway compiles + runs from the same layer.
# ────────────────────────────────────────────────────────────

FROM node:20-slim

# System deps for yt-dlp + ffmpeg post-processing
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    python3 python3-pip ffmpeg ca-certificates curl \
 && pip3 install --break-system-packages --no-cache-dir yt-dlp \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install ALL deps (dev + prod) so we have tsc available to build.
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY tsconfig.json ./
COPY src ./src

# Build TS → JS, then prune devDependencies for a leaner runtime image.
RUN npx tsc && npm prune --omit=dev

# Drop ephemeral files
RUN rm -rf node_modules/.cache /tmp/* /root/.cache

# Railway sets PORT at runtime
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.js"]
