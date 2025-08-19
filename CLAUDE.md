# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Digital Avatar Management System that consists of a Vue 3 frontend, custom API server, and Directus CMS backend. The system manages 3D digital avatar models with features like Azure TTS voice synthesis, animation control, and comprehensive model lifecycle management.

## Architecture

### Frontend (Vue 3 + TypeScript)
- **Location**: `frontend/`
- **Tech Stack**: Vue 3, TypeScript, Three.js, Vite, Pinia, Vue Router, Vue I18n
- **Key Features**: 3D model rendering, voice synthesis integration, responsive design, role-based permissions

### API Server (Express + TypeScript)
- **Location**: `api-server/`
- **Purpose**: Backend-for-Frontend (BFF) layer between Directus CMS and Vue frontend
- **Key Responsibilities**: Credential isolation (OpenAI/Azure keys), business logic aggregation, unified gateway

### Database & CMS
- **Directus**: Content management system with PostgreSQL backend
- **Database**: PostgreSQL with avatar models, users, roles, and file management

## Development Commands

### Root Level Commands
```bash
# Install dependencies for all workspaces
yarn install

# Lint staged files (pre-commit hook)
yarn prepare  # Sets up husky hooks
```

### Frontend Development
```bash
cd frontend

# Development server (with hot reload)
yarn dev

# Build commands
yarn build          # Production build (same as build:prod)
yarn build:stage    # Staging build
yarn build:prod     # Production build

# Code quality
yarn lint           # ESLint check
yarn lint:fix       # ESLint with auto-fix
yarn format         # Prettier formatting
yarn type-check     # TypeScript type checking
yarn check          # Run both lint and type-check

# Utility scripts
yarn sass-check         # Check SASS warnings
yarn i18n:check         # Check i18n completeness
yarn i18n:report        # Generate i18n report
yarn generate-voices    # Generate Azure voices config
yarn download-tts       # Download Azure TTS samples
```

### API Server Development
```bash
cd api-server

# Development server (with hot reload)
yarn dev

# Production start
yarn start

# Testing endpoints
yarn test:azure     # Test Azure TTS
yarn test:simple    # Simple functionality test
yarn test:ssml      # Test SSML generation
yarn test:all       # Test all handlers
```

### Docker Development
```bash
# Local development environment
docker compose -f docker-compose.dev.yml up -d --build

# Staging environment (recommended for local testing)
docker compose -f docker-compose.stage.yml up -d --build

# Production environment
docker compose -f docker-compose.prod.yml up -d --build

# Stop and cleanup
docker compose -f docker-compose.dev.yml down -v
```

## Key Components & Architecture

### Frontend Structure
- **Views**: Role-based routing (Admin: `/admin`, User: `/user`)
- **Components**: Reusable UI components including 3D model viewer, animation controls
- **API Layer**: Abstracted API calls to both Directus and custom API server
- **State Management**: Pinia stores for user state, model data, and UI state
- **3D Rendering**: Three.js integration for GLB/GLTF model display and animation

### State Management (Pinia Stores)
- **AuthStore** (frontend/src/store/index.ts): User authentication state, role management, token persistence
  - `isAuthenticated`: Boolean getter for login status
  - `isAdmin`: Boolean getter for admin role check
  - `setUser()`: Store user data and token in localStorage
  - `clearUser()`: Clear authentication data
  - `initAuth()`: Restore auth state from localStorage on app startup

### API Server Endpoints
- `GET /health` - Health check
- `GET /api/avatars` - Fetch avatar models from Directus
- `PUT/PATCH /api/avatars/:id` - Update avatar status/version
- `POST /api/openai-ssml` - Generate SSML using OpenAI
- `POST /api/azure-tts` - Azure TTS voice synthesis
- `POST /api/generate-ssml` - Advanced SSML generation

### Data Model (Directus)
**avatars collection**:
- `name`, `description`, `tags` (JSON), `purpose`, `style`
- `main_file` (UUID to directus_files), `preview_image` (UUID)
- `version` (e.g., "1.0.0"), `status` (draft/pending/processing/ready/error)

### Authentication & Permissions
- **Admin**: Full CRUD access, can see all model statuses, manage users
- **User**: Read-only access to "ready" status models, can use animation features
- **Login**: ⚠️ **Currently uses mock authentication** (frontend/src/api/directus.ts:21) - real Directus auth integration is planned

## Environment Configuration

### Frontend Environment Variables
```env
# API endpoints
VITE_API_URL=http://localhost:3000
VITE_DIRECTUS_URL=http://localhost:8055

# Optional: Direct Azure integration (not recommended for production)
VITE_AZURE_SPEECH_KEY=your_key_here
VITE_AZURE_SPEECH_REGION=eastasia
```

### API Server Environment Variables

**Development (.env):**
```env
NODE_ENV=development
PORT=3000
DIRECTUS_URL=http://localhost:8055
DIRECTUS_TOKEN=your_directus_token
OPENAI_API_KEY=your_openai_key
AZURE_SPEECH_KEY=your_azure_key
AZURE_SPEECH_REGION=eastasia
```

**Production (.env.prod.api):**
```env
NODE_ENV=production
PORT=3000
DIRECTUS_URL=http://directus:8055
DIRECTUS_TOKEN=production_directus_token
OPENAI_API_KEY=production_openai_key
AZURE_SPEECH_KEY=production_azure_key
AZURE_SPEECH_REGION=eastasia
```

**Staging (.env.stage.api):**
```env
NODE_ENV=staging
PORT=3000
DIRECTUS_URL=http://directus:8055
DIRECTUS_TOKEN=staging_directus_token
OPENAI_API_KEY=staging_openai_key
AZURE_SPEECH_KEY=staging_azure_key
AZURE_SPEECH_REGION=eastasia
```

### Directus Environment Variables

**Development (.env):**
```env
DB_CLIENT=postgres
DB_HOST=db
DB_PORT=5432
DB_DATABASE=directus
DB_USER=directus
DB_PASSWORD=directus
KEY=directus-dev-key
SECRET=directus-dev-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin1234
```

**Production (.env.prod.directus) and Staging (.env.stage.directus):**
```env
DB_CLIENT=postgres
DB_HOST=db
DB_PORT=5432
DB_DATABASE=directus
DB_USER=directus
DB_PASSWORD=directus
KEY=production-directus-key
SECRET=production-directus-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=production-admin-password
```

## Testing & Quality Assurance

### Frontend Testing
- ESLint configuration with Vue and TypeScript rules
- Prettier for code formatting
- Vue TSC for type checking
- SASS warning checks
- i18n completeness validation

### Code Quality Commands to Run Before Commits
```bash
cd frontend
yarn check      # Runs lint + type-check
yarn format     # Format code
yarn sass-check # Check for SASS issues
```

## Deployment

### Development URLs
- Frontend dev server: `http://localhost:5173`
- API server: `http://localhost:3000`
- Directus admin: `http://localhost:8055`

### Production URLs
- Main site: `https://daidai.amis.hk`
- API: `https://api.daidai.amis.hk`
- CMS: `https://directus.daidai.amis.hk`

### Docker Services
- **db**: PostgreSQL 15 (internal: 5432, dev external: 54321)
- **directus**: Directus 11.8 (internal: 8055)
- **api**: Custom API server (internal: 3000)
- **frontend**: Nginx serving Vue build (internal: 80)
- **nginx-proxy-manager**: JC21 proxy (ports: 80, 443, 81)

## Important Notes

### Security Considerations
- API keys (OpenAI, Azure) should only be stored in API server, never in frontend
- Directus tokens should be server-side only
- Frontend uses API server as proxy to avoid exposing credentials

### File Structure Patterns
- Vue components use PascalCase: `ModelViewer.vue`
- TypeScript files use camelCase: `avatarManagement.ts`
- SCSS follows BEM methodology where applicable
- API handlers are modular in `api-server/handlers/`

### Development Workflow
1. Start backend services with Docker: `docker compose -f docker-compose.dev.yml up -d`
2. Start frontend dev server: `cd frontend && yarn dev`
3. Start API server: `cd api-server && yarn dev` (if developing API changes)
4. Access Directus admin at `localhost:8055` for content management

### Common Tasks
- **Adding new avatar models**: Upload through Directus admin interface
- **Modifying API endpoints**: Edit files in `api-server/handlers/`
- **Frontend feature development**: Work in `frontend/src/` with hot reload
- **Testing integrations**: Use provided test scripts in both frontend and api-server
