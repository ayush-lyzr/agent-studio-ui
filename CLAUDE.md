# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agent Studio UI is a comprehensive admin dashboard for building and managing AI agents. Built with React, TypeScript, Vite, and ShadcnUI (TailwindCSS + RadixUI). The application supports multi-agent workflows, knowledge bases, responsible AI policies, agent evaluation, and integrations with various LLM providers (OpenAI, Anthropic, AWS Bedrock, Nvidia NIM, etc.).

## Development Commands

```bash
# Install dependencies (project uses pnpm)
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Run linter
pnpm run lint

# Format code
pnpm run format

# Check formatting
pnpm run format:check

# Run tests (watch mode)
pnpm run test

# Preview production build
pnpm run preview
```

## Architecture

### State Management

- **Zustand** for global state management (`src/lib/store.ts`)
- Persisted store for API keys, user data, organization data, agents, environments, RAG configs
- Page-specific stores (e.g., `onboarding.store.ts`, `manage-admin.store.ts`)

### Routing

- React Router v6 with lazy loading (`src/router.tsx`)
- Main authenticated routes under `/` with `AppShell` wrapper
- Public routes: `/auth/*`, `/blueprint`, `/forgot-password`, `/reset-password`
- Development-only routes gated by `isDevEnv`: agent-policies, groups, voice-builder

### API Layer

- Axios instance configured in `src/lib/axios.ts` with base URL `{BASE_URL}/v3`
- Centralized error handling via interceptors
- Environment variables managed through Vite (`VITE_BASE_URL`, `VITE_RAG_URL`, `VITE_RAI_URL`, etc.)
- See `src/lib/constants.ts` for all environment constants

### Key Directories

- **`src/components/`**: Reusable UI components
  - `ui/`: ShadcnUI components (buttons, dialogs, tables, etc.)
  - `custom/`: Custom components (markdown renderer, rich text editor, etc.)
  - `sidebar/`: Sidebar navigation and related components
- **`src/pages/`**: Page-level components organized by feature
  - Each page typically has its own `index.tsx` and related components
  - Service files (`.service.ts`) contain API calls
  - Store files (`.store.ts`) contain local state management
- **`src/lib/`**: Core utilities and configurations
  - `store.ts`: Global Zustand store
  - `axios.ts`: API client configuration
  - `utils.ts`: Common utility functions
  - `types.ts`: TypeScript type definitions
  - `constants.ts`: Application constants, plan limits, model display names
- **`src/hooks/`**: Custom React hooks
  - `useCurrentUser.tsx`, `useAgent.ts`, `useChatSession.ts`, `useWebSocket.ts`, etc.
- **`src/orchestration-standalone/`**: Standalone orchestration application with its own build configuration

### Major Features

1. **Agent Management** (`/agent-create`, `/agent-builder`)
   - Create and configure agents with LLM models, tools, knowledge bases
   - Agent builder includes code IDE for custom agent development
   - Managed agents support for specialized configurations (PII detection, groundedness, text2sql)

2. **Knowledge Base** (`/knowledge-base`)
   - File-based and semantic knowledge bases
   - RAG (Retrieval Augmented Generation) playground
   - Document upload and management

3. **Multi-Agent Workflows** (`/multi-agent-workflow`)
   - Visual workflow builder using React Flow (XYFlow)
   - Create complex agent orchestrations

4. **Responsible AI** (`/responsible-ai`)
   - Configure AI safety policies (PII detection, prompt injection, toxicity, bias)
   - Policy evaluation and chat testing

5. **Agent Marketplace** (`/agent-marketplace`)
   - Browse and deploy pre-built agents
   - Hub system for categorized agents

6. **Configuration** (`/configure/*`)
   - Models: Configure LLM provider credentials
   - Tools: Manage agent tools
   - Data Connectors: Set up external data sources

7. **Traces & Analytics** (`/traces`, `/credit-report`)
   - Agent execution traces and metrics
   - Credit usage reporting

8. **Organization Management** (`/organization`, `/manage`)
   - Team management, roles, permissions
   - Subscription and billing

### Authentication

- Uses Memberstack for authentication
- User and organization data stored in global Zustand store
- API token (`app_token`) used for backend API requests
- Protected routes check authentication via `useCurrentUser` hook

### Styling

- TailwindCSS with custom configuration (`tailwind.config.ts`)
- Dark mode support via `next-themes`
- Path alias `@/` maps to `src/`

### Important Patterns

1. **Lazy Loading**: All routes use React Router's lazy loading
2. **API Services**: Each feature has a `.service.ts` file for API calls
3. **Type Safety**: Strong TypeScript typing throughout (`src/lib/types.ts`)
4. **Error Handling**: Centralized in Axios interceptor with toast notifications
5. **Plan Limits**: Plan-based feature gating (Community, Starter, Pro, Custom) defined in `src/lib/constants.ts`
6. **Model Support**: Comprehensive model display names mapping for Bedrock and Nvidia NIM providers

### Testing

- Test setup in `src/setupTests.ts`
- Tests excluded from `**/__tests__/**/*` directories
- Uses Vitest with globals enabled

### Build Configuration

- Vite with React SWC plugin for fast builds
- Node polyfills enabled for browser compatibility
- Dev server proxy for `/api/crawl` endpoints
- Production builds output to `dist/`

## Environment Variables

Key environment variables (defined in `.env`):
- `VITE_BASE_URL`: Backend API base URL
- `VITE_RAG_URL`: RAG service URL
- `VITE_RAI_URL`: Responsible AI service URL
- `VITE_MARKETPLACE_URL`: Marketplace service URL
- `VITE_MEMERSTACK_PUBLICKEY`: Memberstack public key
- `VITE_MIXPANEL_KEY`: Mixpanel analytics key
- `VITE_MIXPANEL_MODE`: Set to 'dev' for development environment



Always use the shedcn MCP



NO NEED TO BUILD AND CHECK, JUST RUN TSC CHECKS...