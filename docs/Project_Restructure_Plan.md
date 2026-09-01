# Fleet Strike - Project Restructure Plan

## Current Structure

```
fleet-strike-game/
├── src/              # Frontend code (mixed with HTML)
├── server/           # Backend code
├── shared/           # Shared types
├── docs/             # Documentation
└── package.json      # Root package
```

## Proposed Structure (Monorepo with Clear Separation)

```
fleet-strike-game/
├── frontend/                 # Client application
│   ├── src/
│   │   ├── ecs/              # ECS systems and components
│   │   │   ├── components/   # Component definitions
│   │   │   ├── systems/      # System logic
│   │   │   └── world.ts      # ECS world setup
│   │   ├── rendering/        # PixiJS rendering layer
│   │   │   ├── sprites/      # Sprite management
│   │   │   ├── particles/    # Particle effects
│   │   │   └── camera.ts     # Camera system
│   │   ├── network/          # WebSocket client
│   │   ├── ui/               # UI components (HUD, menus)
│   │   ├── assets/           # Textures, sounds
│   │   ├── styles/           # CSS files
│   │   └── main.ts           # Entry point
│   ├── public/               # Static assets
│   │   └── index.html        # HTML entry
│   ├── tests/                # Frontend tests
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                  # Server application
│   ├── src/
│   │   ├── ecs/              # Server-authoritative ECS (shared with frontend)
│   │   ├── network/          # WebSocket server
│   │   ├── matchmaking/      # Room creation, matchmaking
│   │   ├── simulation/       # Server-side game loop
│   │   └── index.ts          # Entry point
│   ├── tests/                # Backend tests
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                   # Shared code (frontend + backend)
│   ├── ecs/                  # Shared ECS definitions
│   │   ├── components.ts     # Component schemas
│   │   └── constants.ts      # Game constants
│   ├── network/              # Network protocol
│   │   └── messages.ts       # WebSocket message types
│   ├── config.ts             # Current config
│   ├── types.ts              # Current types
│   └── package.json
│
├── infrastructure/           # Infrastructure as Code (NEW)
│   ├── terraform/            # Terraform configs
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── docker/               # Docker configurations
│   │   ├── Dockerfile.frontend
│   │   ├── Dockerfile.backend
│   │   ├── docker-compose.yml
│   │   └── nginx.conf
│   └── k8s/                  # Kubernetes manifests (optional)
│
├── .github/                  # GitHub Actions CI/CD (NEW)
│   └── workflows/
│       ├── test.yml          # Run tests on PR
│       ├── deploy-staging.yml
│       └── deploy-production.yml
│
├── docs/                     # Documentation
├── package.json              # Root package.json (workspaces)
├── pnpm-workspace.yaml       # PNPM workspace config
└── README.md
```

## Migration Steps

### Phase 1: Create New Folder Structure (No Breaking Changes)

1. **Create frontend directory:**
   ```bash
   mkdir -p frontend/src frontend/public frontend/tests
   ```

2. **Create backend directory:**
   ```bash
   mkdir -p backend/src backend/tests
   ```

3. **Create infrastructure directory:**
   ```bash
   mkdir -p infrastructure/terraform infrastructure/docker infrastructure/k8s
   ```

4. **Create GitHub workflows directory:**
   ```bash
   mkdir -p .github/workflows
   ```

### Phase 2: Move Frontend Files

1. **Move src/ to frontend/src/:**
   ```bash
   mv src/* frontend/src/
   ```

2. **Move index.html to frontend/public/:**
   ```bash
   mv index.html frontend/public/
   ```

3. **Move vite config:**
   ```bash
   mv vite.config.ts frontend/
   ```

4. **Create frontend package.json:**
   ```json
   {
     "name": "@fleet-strike/frontend",
     "version": "1.0.0",
     "type": "module",
     "scripts": {
       "dev": "vite",
       "build": "tsc && vite build",
       "preview": "vite preview"
     },
     "dependencies": {
       "@pixi/particle-emitter": "^5.0.8",
       "pixi.js": "^8.12.0",
       "bitecs": "^0.3.43"
     },
     "devDependencies": {
       "typescript": "^5.9.2",
       "vite": "^7.1.3"
     }
   }
   ```

### Phase 3: Move Backend Files

1. **Move server/ to backend/src/:**
   ```bash
   mv server/* backend/src/
   ```

2. **Create backend package.json:**
   ```json
   {
     "name": "@fleet-strike/backend",
     "version": "1.0.0",
     "type": "module",
     "scripts": {
       "dev": "tsx watch src/index.ts",
       "build": "tsc",
       "start": "node dist/index.js"
     },
     "dependencies": {
       "express": "^5.1.0",
       "ws": "^8.18.3",
       "bitecs": "^0.3.43"
     },
     "devDependencies": {
       "@types/express": "^5.0.3",
       "@types/node": "^24.3.0",
       "@types/ws": "^8.18.1",
       "tsx": "^4.20.5",
       "typescript": "^5.9.2"
     }
   }
   ```

### Phase 4: Update Shared Package

1. **Create shared/package.json:**
   ```json
   {
     "name": "@fleet-strike/shared",
     "version": "1.0.0",
     "type": "module",
     "main": "./dist/index.js",
     "types": "./dist/index.d.ts",
     "scripts": {
       "build": "tsc",
       "watch": "tsc --watch"
     },
     "dependencies": {
       "bitecs": "^0.3.43"
     },
     "devDependencies": {
       "typescript": "^5.9.2"
     }
   }
   ```

2. **Create shared/src/ directory:**
   ```bash
   mkdir -p shared/src
   mv shared/config.ts shared/src/
   mv shared/types.ts shared/src/
   ```

### Phase 5: Update Root Configuration

1. **Update root package.json:**
   ```json
   {
     "name": "fleet-strike-monorepo",
     "version": "1.0.0",
     "private": true,
     "workspaces": [
       "frontend",
       "backend",
       "shared"
     ],
     "scripts": {
       "dev": "concurrently -k \"pnpm -C backend dev\" \"pnpm -C frontend dev\"",
       "build": "pnpm -C shared build && pnpm -C backend build && pnpm -C frontend build",
       "test": "pnpm -r test",
       "lint": "pnpm -r lint",
       "typecheck": "pnpm -r typecheck"
     },
     "devDependencies": {
       "concurrently": "^9.2.1"
     }
   }
   ```

2. **Update pnpm-workspace.yaml:**
   ```yaml
   packages:
     - 'frontend'
     - 'backend'
     - 'shared'
   ```

3. **Update vite.config.ts in frontend:**
   ```typescript
   import { defineConfig } from 'vite';
   
   export default defineConfig({
     root: './public',
     build: {
       outDir: '../dist',
       emptyOutDir: true
     },
     resolve: {
       alias: {
         '@shared': '../../shared/src'
       }
     }
   });
   ```

### Phase 6: Create Infrastructure Files

1. **Create Dockerfile.frontend:**
   ```dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package*.json pnpm-lock.yaml ./
   COPY shared/ ./shared/
   COPY frontend/ ./frontend/
   RUN npm install -g pnpm
   RUN pnpm install --frozen-lockfile
   RUN pnpm -C shared build
   RUN pnpm -C frontend build

   FROM nginx:alpine
   COPY --from=builder /app/frontend/dist /usr/share/nginx/html
   COPY infrastructure/docker/nginx.conf /etc/nginx/nginx.conf
   EXPOSE 80
   ```

2. **Create Dockerfile.backend:**
   ```dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package*.json pnpm-lock.yaml ./
   COPY shared/ ./shared/
   COPY backend/ ./backend/
   RUN npm install -g pnpm
   RUN pnpm install --frozen-lockfile
   RUN pnpm -C shared build
   RUN pnpm -C backend build

   FROM node:20-alpine
   WORKDIR /app
   COPY --from=builder /app/backend/dist ./dist
   COPY --from=builder /app/node_modules ./node_modules
   EXPOSE 3000
   CMD ["node", "dist/index.js"]
   ```

3. **Create docker-compose.yml:**
   ```yaml
   version: '3.8'
   services:
     backend:
       build:
         context: .
         dockerfile: infrastructure/docker/Dockerfile.backend
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=development
       volumes:
         - ./backend/src:/app/backend/src
         - ./shared:/app/shared
     
     frontend:
       build:
         context: .
         dockerfile: infrastructure/docker/Dockerfile.frontend
       ports:
         - "5173:80"
       environment:
         - VITE_API_URL=ws://localhost:3000
       depends_on:
         - backend
   ```

### Phase 7: Create CI/CD Workflows

1. **Create .github/workflows/test.yml:**
   ```yaml
   name: Test
   
   on:
     pull_request:
     push:
       branches: [main, develop]
   
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         
         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '20'
         
         - name: Install pnpm
           run: npm install -g pnpm
         
         - name: Install dependencies
           run: pnpm install --frozen-lockfile
         
         - name: Run type check
           run: pnpm typecheck
         
         - name: Run unit tests
           run: pnpm test
   ```

### Phase 8: Install bitECS

```bash
# Install bitECS in all packages that need it
pnpm add bitecs -C frontend
pnpm add bitecs -C backend
pnpm add bitecs -C shared
```

### Phase 9: Clean Up Old Files

```bash
# Remove old src directory (already moved to frontend/)
rm -rf src/

# Remove old server directory (already moved to backend/)
rm -rf server/

# Remove root-level config files (moved to packages)
rm tsconfig.app.json
rm tsconfig.node.json
rm vite.config.ts
```

### Phase 10: Test Everything

```bash
# Install all dependencies
pnpm install

# Run development servers
pnpm dev

# Verify frontend loads: http://localhost:5173
# Verify backend responds: ws://localhost:3000

# Run type checks
pnpm typecheck

# Build production
pnpm build
```

## Benefits of This Structure

1. **Clear Separation:** Frontend and backend are clearly separated
2. **Shared Code:** Common types and ECS definitions in `shared/`
3. **Infrastructure as Code:** Terraform and Docker configs in dedicated folder
4. **CI/CD Ready:** GitHub Actions workflows for automated testing and deployment
5. **Scalable:** Easy to add new packages (e.g., `admin-panel`, `ai-bot`)
6. **Type Safety:** TypeScript across all packages with proper workspace references
7. **Modern Tooling:** PNPM workspaces, Vite, Docker, Terraform

## Timeline Estimate

- **Phase 1-5 (Restructure):** 1-2 hours
- **Phase 6 (Infrastructure):** 1 hour
- **Phase 7 (CI/CD):** 1 hour
- **Phase 8-10 (Install, cleanup, test):** 1 hour
- **Total:** ~4-5 hours

## Risk Mitigation

1. **Create a backup branch before starting:**
   ```bash
   git checkout -b backup-before-restructure
   git checkout -b restructure
   ```

2. **Move files incrementally and test after each phase**

3. **Keep both old and new structure temporarily until verified**

4. **Update all import paths gradually**

## Next Steps After Migration

1. **Set up ECS architecture in `shared/ecs/`**
2. **Create PixiJS renderer in `frontend/src/rendering/`**
3. **Implement WebSocket protocol in `shared/network/`**
4. **Deploy to Digital Ocean using Terraform**
5. **Set up CI/CD pipeline with GitHub Actions**

---

**Note:** This is a comprehensive plan. We can execute it incrementally to minimize disruption to ongoing development.
