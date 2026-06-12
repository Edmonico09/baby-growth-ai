# BabyGrowth AI - Application Structure

## 🏗️ Component Hierarchy

```
RootLayout
├── html / body (with theme variables)
└── Page Routes
    ├── Dashboard (/)
    │   ├── Sidebar
    │   │   ├── Logo/Branding
    │   │   ├── Navigation Links
    │   │   └── Footer Info
    │   ├── Navbar
    │   └── Main Content
    │       ├── PageHeader
    │       ├── StatCard x4
    │       │   ├── Current Weight
    │       │   ├── Current Height
    │       │   ├── Total Records
    │       │   └── Health Status
    │       └── Grid Layout
    │           ├── ChildProfileCard
    │           └── Quick Info
    │               ├── Latest Measurements
    │               └── Growth Insights
    │
    ├── Profile (/profile)
    │   ├── Sidebar
    │   ├── Navbar
    │   └── Main Content
    │       ├── PageHeader + Edit Button
    │       ├── ChildProfileCard
    │       └── EditProfileForm
    │           ├── Name Input
    │           ├── DOB Input
    │           ├── Gender Select
    │           ├── Weight Input
    │           ├── Height Input
    │           └── Save/Cancel Buttons
    │
    ├── Growth (/growth)
    │   ├── Sidebar
    │   ├── Navbar
    │   └── Main Content
    │       ├── PageHeader
    │       ├── ChartsGrid
    │       │   ├── GrowthChart (Weight)
    │       │   └── GrowthChart (Height)
    │       └── Tabs
    │           ├── Measurements Tab
    │           │   └── GrowthTable
    │           │       ├── TableHeader
    │           │       └── TableRows
    │           │           ├── Date
    │           │           ├── Weight + Trend
    │           │           ├── Height + Trend
    │           │           └── Status Badge
    │           └── Analysis Tab
    │               ├── Weight Analysis Card
    │               │   ├── Starting Weight
    │               │   ├── Current Weight
    │               │   ├── Total Gain
    │               │   └── Monthly Average
    │               └── Height Analysis Card
    │                   ├── Starting Height
    │                   ├── Current Height
    │                   ├── Total Growth
    │                   └── Monthly Average
    │
    └── Assistant (/assistant)
        ├── Sidebar
        ├── Navbar
        └── Main Content
            ├── PageHeader
            └── Grid Layout
                ├── ChatInterface (2/3 width)
                │   ├── MessageContainer
                │   │   ├── UserMessages (blue)
                │   │   └── AssistantMessages (gray)
                │   └── InputArea
                │       ├── TextField
                │       └── SendButton
                └── QuickPrompts (1/3 width)
                    ├── Header
                    └── PromptButtons x4
                        ├── "My baby eats very little..."
                        ├── "What foods are rich..."
                        ├── "My 2-year-old sleeps..."
                        └── "Is my child's growth..."
```

## 📁 File Organization

### App Routes (`app/`)
```
app/
├── layout.tsx           # Root layout with fonts & metadata
├── page.tsx             # Dashboard (home)
├── globals.css          # Theme variables & Tailwind config
├── profile/
│   └── page.tsx         # Child profile management
├── growth/
│   └── page.tsx         # Growth tracking & charts
└── assistant/
    └── page.tsx         # AI health assistant
```

### Components (`components/`)
```
components/
├── sidebar.tsx          # Left navigation sidebar
├── navbar.tsx           # Top navigation bar
├── stat-card.tsx        # Statistic card component
├── child-profile-card.tsx # Profile display card
├── growth-chart.tsx     # Chart wrapper (Recharts)
├── growth-table.tsx     # Measurements data table
├── chat-interface.tsx   # Chat UI component
├── quick-prompts.tsx    # Quick question buttons
└── ui/                  # shadcn/ui components
    ├── button.tsx       # Button (pre-installed)
    └── tabs.tsx         # Tabs (added via shadcn)
```

### Utilities (`lib/`)
```
lib/
├── utils.ts             # cn() function for Tailwind merging
├── mock-data.ts         # Demo data for development
└── api-client.ts        # Ready for API integration
```

## 🎨 Theme Architecture

### CSS Variables (globals.css)
```
Root Theme (Light Mode)
├── Colors
│   ├── background        #F9FAFB (off-white)
│   ├── foreground        #3F5470 (dark blue)
│   ├── primary           #4A7BA7 (light blue)
│   ├── secondary         #7B9D66 (light green)
│   ├── muted             #E5E7EB (light gray)
│   ├── card              #FFFFFF (white)
│   └── border            #E5E7EB (light gray)
│
└── Chart Colors
    ├── chart-1           #4A7BA7 (primary blue)
    ├── chart-2           #7B9D66 (secondary green)
    ├── chart-3           #5A8FB9 (lighter blue)
    ├── chart-4           #6B8BA1 (muted blue)
    └── chart-5           #8BA766 (lighter green)

Dark Mode (.dark class)
├── background           #2C3E50 (dark blue-gray)
├── foreground           #E8EEF5 (light text)
├── primary              #5A9DD4 (bright blue)
└── secondary            #8CB373 (bright green)
```

## 🔄 Data Flow

### Mock Data Flow
```
mock-data.ts
├── childData
│   ├── name: "Emma Johnson"
│   ├── dateOfBirth: "2022-06-15"
│   ├── sex: "female"
│   └── createdAt: "2023-01-01"
│
├── growthRecords[]
│   └── 10 records with {date, weight, height}
│
├── chatMessages[]
│   └── Initial greeting message
│
└── aiAssistantExamples[]
    └── 4 quick prompt examples
```

### Component Data Flow
```
Dashboard
├── Import growthRecords
├── Import childData
├── Calculate latestRecord
├── Render StatCards with data
├── Render ChildProfileCard with data
└── Render Growth Insights

Growth Page
├── Import growthRecords
├── Pass data to GrowthChart x2
├── Pass data to GrowthTable
├── Calculate analytics
└── Display in Tabs

Assistant Page
├── Import chatMessages
├── Import aiAssistantExamples
├── Manage messages state
├── Handle message input
├── Show assistant responses
└── Update message history
```

## 🎯 Responsive Breakpoints

```
Layout Breakpoints
├── Mobile (375px)
│   ├── Sidebar: Visible but compact
│   ├── Grid: 1 column
│   ├── Charts: Full width, stacked
│   └── Tables: Horizontal scroll
│
├── Tablet (768px)
│   ├── Sidebar: Full width
│   ├── Grid: 2 columns
│   ├── Charts: Side by side
│   └── Tables: Responsive shrink
│
└── Desktop (1024px+)
    ├── Sidebar: Fixed left 256px
    ├── Content: 1024px max-width
    ├── Grid: 3-4 columns
    ├── Charts: Side by side
    └── Tables: Full functionality
```

## 🌊 Component Relationships

### Sidebar Usage
```
Sidebar Component
├── Logo (BG + BabyGrowth text)
├── NavLink (Dashboard)
│   └── Active when pathname === "/"
├── NavLink (Child Profile)
│   └── Active when pathname === "/profile"
├── NavLink (Growth)
│   └── Active when pathname === "/growth"
├── NavLink (AI Assistant)
│   └── Active when pathname === "/assistant"
└── Footer (Version info)
```

### StatCard Usage
```
StatCard Component
├── Props: label, value, unit, icon, trend
├── Icon: Lucide icon (TrendingUp, Calendar, Activity, etc.)
├── Display: Value + Unit in large text
├── Trend: Optional up/down indicator
└── Style: Card with icon background
```

### GrowthChart Usage
```
GrowthChart Component
├── Props: data, type ("weight" | "height"), title
├── Chart: Recharts LineChart
├── XAxis: Date labels (abbreviated)
├── YAxis: Weight (kg) or Height (cm)
├── Line: Blue for weight, Green for height
├── Dots: Interactive points with tooltip
└── Legend: Shows metric label
```

## 🔌 API Integration Points

Ready to connect these components to your FastAPI backend:

```
Component → API Endpoint
├── Dashboard
│   ├── StatCards ← GET /api/child
│   ├── StatCards ← GET /api/growth
│   └── ChildProfileCard ← GET /api/child
│
├── Profile
│   ├── ChildProfileCard ← GET /api/child
│   └── EditForm → POST/PUT /api/child
│
├── Growth
│   ├── GrowthChart ← GET /api/growth
│   ├── GrowthTable ← GET /api/growth
│   └── Analysis → Calculated from GET /api/growth
│
└── Assistant
    ├── ChatInterface ← GET /api/chat/history
    └── SendMessage → POST /api/chat
```

## 🎨 Color Usage Across Components

```
Primary Blue (#4A7BA7)
├── Sidebar active links
├── Primary buttons
├── Weight chart line
└── Accent highlights

Secondary Green (#7B9D66)
├── Height chart line
├── Accent elements
└── Growth indicators (↑)

Muted Colors (#E5E7EB)
├── Card backgrounds
├── Input fields
├── Table alternating rows
└── Borders

Text Colors
├── Foreground (#3F5470): Headings & main text
├── Muted (#808080): Secondary text
└── Links: Primary blue with hover
```

## 📊 Data Structure Examples

### Child Profile
```typescript
interface Child {
  id: string
  name: string
  dateOfBirth: string     // "2022-06-15"
  sex: "male" | "female"
  createdAt: string
}
```

### Growth Record
```typescript
interface GrowthRecord {
  id: string
  date: string            // "2024-12-01"
  weight: number          // kg
  height: number          // cm
}
```

### Chat Message
```typescript
interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}
```

## 🚀 Performance Optimizations

```
Code Splitting
├── Each route: Separate bundle
├── Dynamic imports: Ready to implement
└── Image optimization: Next.js Image component ready

Rendering Strategy
├── Server components: Layout, root structure
├── Client components: Interactive pages (marked 'use client')
└── Selective hydration: Ready for optimization

Styling Performance
├── Tailwind: Utility-first CSS
├── CSS variables: Theme tokens only
├── No unused styles: Tree-shaking enabled
└── Bundle size: ~30KB+ gzipped (before API code)
```

## 🔐 Security Architecture

```
Frontend Security
├── TypeScript: Type safety
├── Input validation: Form fields
├── XSS prevention: React's default escaping
├── CSRF: Ready for token implementation
└── Secrets: Environment variables for API URLs

Backend Integration Security
├── JWT tokens: localStorage/httpOnly cookies
├── API authentication: Bearer token headers
├── HTTPS: Production requirement
└── Rate limiting: Client-side ready
```

---

This structure provides a solid foundation for a production-ready child health tracking application, ready to be connected to your FastAPI backend.
