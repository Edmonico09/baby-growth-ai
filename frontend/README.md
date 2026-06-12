# BabyGrowth AI — Frontend

A modern web application for tracking children's growth and development,
with an AI-powered health assistant. Built with Next.js 16, React 19,
TypeScript, and Tailwind CSS v4.

## Features

### 📊 Dashboard
Real-time display of weight, height, health status, and growth trends
computed from actual user data (not hardcoded).

### 👶 Child Profile
Create and manage your child's profile with name, date of birth, sex,
and birth measurements.

### 📈 Growth Tracking
Record weight, height, and head circumference over time. View interactive
Recharts-powered charts with trend lines, monthly gain metrics, and a
sortable data table with inline edit/delete.

### 🤖 AI Assistant
Multi-turn conversations with an LLM-powered pediatric assistant.
Conversations are organized as independent threads (like ChatGPT/Claude)
with auto-generated titles after the first message. Memory management:
full history up to 50 messages, then summary mode.

### 🌙 Dark Mode
System-preference-aware dark/light theme toggle with localStorage persistence.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| UI | Tailwind CSS v4 + shadcn/ui + Base UI |
| State | Zustand 5 |
| Charts | Recharts |
| HTTP | Axios (with 401 interceptor → redirect to `/login`) |
| Icons | Lucide React |
| Dates | date-fns |

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx           # Root layout (fonts, providers, error boundary)
│   ├── page.tsx             # Dashboard
│   ├── providers.tsx        # SidebarProvider (React context)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── assistant/page.tsx   # AI assistant with sidebar conversation list
│   ├── growth/page.tsx      # Growth records (chart + table + form modal)
│   └── profile/page.tsx     # Child profile view/edit
├── components/
│   ├── app-layout.tsx       # Main layout shell (sidebar + content)
│   ├── sidebar.tsx          # Navigation sidebar (visible only on /assistant)
│   ├── navbar.tsx           # Top bar with hamburger, logo, dark mode toggle
│   ├── chat-interface.tsx   # Chat UI with error banner
│   ├── child-profile-card.tsx
│   ├── error-boundary.tsx
│   ├── growth-chart.tsx     # Recharts weight/height line chart
│   ├── growth-record-form.tsx
│   ├── growth-table.tsx     # Sortable table with edit/delete actions
│   ├── quick-prompts.tsx    # Predefined chat prompts
│   ├── stat-card.tsx
│   ├── theme-provider.tsx   # Dark/light mode management
│   └── ui/                  # shadcn/ui primitives
├── store/                   # Zustand stores
│   ├── auth.ts              # Login, register, logout, token management
│   ├── chat.ts              # Conversations, messages, send, error state
│   ├── child.ts             # Child profile CRUD
│   └── growth.ts            # Growth records CRUD
├── api/                     # Axios API clients
│   ├── client.ts            # Axios instance with auth interceptor
│   ├── auth.ts
│   ├── chat.ts
│   ├── child.ts
│   └── growth.ts
└── lib/
    └── utils.ts             # cn() utility (clsx + tailwind-merge)
```

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Stats cards, child profile card, growth trends |
| `/login` | Login | Email + password authentication |
| `/register` | Register | Create account (role forced to `parent`) |
| `/growth` | Growth tracking | Interactive chart, data table, add/edit modal |
| `/profile` | Profile | View and edit child profile |
| `/assistant` | AI Assistant | Conversation list (sidebar) + chat interface |

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL to your backend URL (default: http://localhost:8000)

# 3. Start development server
pnpm dev
```

The app runs at `http://localhost:3000`.

## Backend Integration

The frontend connects to a Python FastAPI backend at `NEXT_PUBLIC_API_URL`.
All API calls go through an Axios client that:

- Attaches the JWT token from `localStorage` as a `Bearer` header
- Automatically redirects to `/login` on 401 responses
- Handles errors gracefully with user-facing messages

## Key Design Decisions

- **Sidebar state**: Single React context (`SidebarProvider`), no duplicated local state
- **Age calculation**: Calendar-date comparison (not millisecond arithmetic) to avoid timezone issues
- **Auth interceptor**: 401 response → clear localStorage → redirect `/login`
- **Error handling**: Error banner in ChatInterface with dismiss action
- **Sex typing**: Typed as `'male' | 'female' | ''` for type safety
- **Conversations**: Visible as a list only on the `/assistant` page
