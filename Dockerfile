FROM node:20-alpine AS base
WORKDIR /app

# ---------- Frontend build stage ----------
FROM base AS frontend-builder
# Copy only package files for caching
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---------- Backend build stage ----------
FROM base AS backend-builder
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci
COPY backend/ ./

# ---------- Runtime image ----------
FROM node:20-alpine AS runtime
WORKDIR /app

# Install concurrently to run both services
RUN npm install -g concurrently

# Copy built frontend
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package*.json ./frontend/
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules

# Copy backend
COPY --from=backend-builder /app/backend ./backend

# Expose ports
EXPOSE 3000 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV FRONTEND_PORT=3000

# Start both services using concurrently (using shell form for cd commands)
CMD concurrently --kill-others --names "BACKEND,FRONTEND" -c "blue,green" \
    "cd backend && PORT=8080 npm start" \
    "cd frontend && PORT=3000 npm start"
