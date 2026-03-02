# Docker Setup for Agent Studio UI

This document provides instructions for building and running Agent Studio UI in Docker containers.

## Quick Start

### Using Docker Compose (Recommended)

1. **Build and run the container:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Open your browser and navigate to `http://localhost:3000`

3. **Stop the container:**
   ```bash
   docker-compose down
   ```

### Using Docker CLI Only

1. **Build the image:**
   ```bash
   docker build -t agent-studio-ui:latest .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3000:80 \
     --name agent-studio-ui \
     agent-studio-ui:latest
   ```

3. **Access the application:**
   - Open your browser and navigate to `http://localhost:3000`

4. **Stop the container:**
   ```bash
   docker stop agent-studio-ui
   docker rm agent-studio-ui
   ```

## Configuration

### Environment Variables

The Docker build uses your existing `.env` file to embed build-time variables (VITE_ variables are embedded at build time):

1. **Ensure `.env` file exists** in the project root with required variables:
   - `VITE_BASE_URL`: Backend API endpoint
   - `VITE_RAG_URL`: RAG service endpoint
   - `VITE_RAI_URL`: Responsible AI service endpoint
   - `VITE_MARKETPLACE_URL`: Marketplace service endpoint
   - `VITE_MEMERSTACK_PUBLICKEY`: Memberstack authentication key
   - `VITE_MIXPANEL_KEY`: Mixpanel analytics key

2. **With Docker Compose:**
   The `.env` file is automatically loaded during build and at runtime:
   ```bash
   docker-compose up --build
   ```

3. **With Docker CLI:**
   Pass environment variables using the `-e` flag:
   ```bash
   docker run -p 3000:80 \
     -e VITE_BASE_URL=http://api.example.com/v3 \
     -e VITE_MEMERSTACK_PUBLICKEY=your_key \
     agent-studio-ui:latest
   ```

## Image Details

### Base Images

- **Build Stage:** `node:20-alpine` (lightweight Node.js environment)
- **Runtime Stage:** `nginx:alpine` (lightweight Nginx web server)

### Build Process

The multi-stage Docker build:

1. **Stage 1 (Builder):**
   - Installs pnpm globally
   - Copies package files
   - Installs dependencies with frozen lockfile
   - Runs TypeScript compiler and Vite build
   - Output: Built files in `/app/dist`

2. **Stage 2 (Runtime):**
   - Copies built files to Nginx
   - Configures Nginx for SPA routing
   - Exposes port 80
   - Serves static files with proper caching headers

## Dockerfile Breakdown

```dockerfile
# Multi-stage build for optimized image size
FROM node:20-alpine AS builder    # Build stage
...
FROM nginx:alpine                  # Runtime stage
```

### Why Multi-Stage?

- **Smaller final image:** Only Nginx and static files in production
- **Faster startup:** No Node.js in the final image
- **Better security:** Reduced attack surface

## Nginx Configuration

The included `nginx.conf` provides:

- **Gzip compression** for CSS, JS, and JSON
- **Cache busting** for static assets (1-year expiry with immutable flag)
- **SPA routing** via `try_files` directive (serves `index.html` for unknown routes)
- **Health check endpoint** at `/health`
- **No cache headers** for HTML files

## Volume Mounting (Advanced)

To work with local source files during development:

```bash
docker run -p 3000:80 \
  -v $(pwd)/dist:/usr/share/nginx/html \
  agent-studio-ui:latest
```

Note: You'll need to run `pnpm run build` locally first.

## Networking

### Port Mapping

- Container port 80 (Nginx) → Host port 3000 (default in docker-compose)
- Customize with `-p HOST_PORT:80` in Docker CLI

### Connecting to External Services

If backend services are on your host machine:

**On Linux:**
```bash
docker run -p 3000:80 \
  -e VITE_BASE_URL=http://host.docker.internal:8000/v3 \
  agent-studio-ui:latest
```

**On macOS/Windows (Docker Desktop):**
```bash
docker run -p 3000:80 \
  --network=host \
  agent-studio-ui:latest
```

Or use `host.docker.internal` like Linux.

## Troubleshooting

### Container exits immediately

Check logs:
```bash
docker logs agent-studio-ui
```

Ensure environment variables are set correctly.

### Build fails

Verify you have enough disk space and that `pnpm-lock.yaml` is present:
```bash
ls -la pnpm-lock.yaml
```

### Port already in use

Change the port mapping:
```bash
docker run -p 8080:80 agent-studio-ui:latest
```

Then access at `http://localhost:8080`

### Blank page or routing issues

Verify `nginx.conf` is in the same directory as `Dockerfile`.

Check Nginx logs:
```bash
docker exec agent-studio-ui cat /var/log/nginx/error.log
```

## Performance Optimization

### Image Size

Current optimizations:
- Alpine Linux base images (~150MB total)
- Multi-stage build (removes build dependencies)
- No devDependencies in runtime image

To further reduce size, consider:
```bash
# Check current size
docker images agent-studio-ui:latest
```

### Build Time

Speed up builds:
```bash
# Use BuildKit for parallel builds
DOCKER_BUILDKIT=1 docker build -t agent-studio-ui:latest .
```

## Production Deployment

### Best Practices

1. **Use specific Node version:** Already using `node:20-alpine`
2. **Enable health checks:** Configured in `docker-compose.yml`
3. **Set resource limits:**
   ```bash
   docker run -p 3000:80 \
     --memory="512m" \
     --cpus="1" \
     agent-studio-ui:latest
   ```

4. **Use environment files for secrets:**
   ```bash
   docker run -p 3000:80 \
     --env-file .env.production \
     agent-studio-ui:latest
   ```

### Registry Push

```bash
# Tag for registry (e.g., Docker Hub)
docker tag agent-studio-ui:latest myregistry/agent-studio-ui:latest

# Push to registry
docker push myregistry/agent-studio-ui:latest
```

### Example Production docker-compose.yml

```yaml
version: '3.8'

services:
  agent-studio-ui:
    image: myregistry/agent-studio-ui:latest
    ports:
      - "80:80"
    environment:
      - VITE_BASE_URL=https://api.production.com/v3
      - VITE_MEMERSTACK_PUBLICKEY=${MEMBERSTACK_KEY}
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
    restart: always
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Useful Commands

```bash
# Build image
docker build -t agent-studio-ui:latest .

# Run container
docker run -p 3000:80 agent-studio-ui:latest

# View logs
docker logs -f agent-studio-ui

# Execute command in container
docker exec agent-studio-ui cat /usr/share/nginx/html/index.html

# Inspect image
docker inspect agent-studio-ui:latest

# List images
docker images

# Remove image
docker rmi agent-studio-ui:latest

# Docker Compose commands
docker-compose up                 # Start services
docker-compose up -d              # Start in background
docker-compose down               # Stop and remove
docker-compose logs -f            # View logs
docker-compose ps                 # List services
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
