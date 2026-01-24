# TridentFans - Seattle Mariners Fan Community

## Project Overview

The ultimate Seattle Mariners fan community platform with AI-powered bots, real-time data, predictions, and community features.

## Tech Stack

- Next.js 15+ (App Router)
- TypeScript
- Tailwind CSS v4
- Supabase (Database & Auth)
- Anthropic Claude (AI Bots)
- MLB Stats API (Live Data)

## Design System

- **Colors**: Mariners Navy (#0C2C56), Teal (#005C5C), Silver (#C4CED4)
- **Mode**: Light mode default, dark mode supported
- **Style**: Professional yet fun, community-focused

## File Structure

```
app/
  page.tsx              # Home page
  predictions/          # Predictions system
  forum/                # Community forum
  chat/[botId]/         # Bot chat interface
  news/                 # News aggregation
  roster/               # Team roster
  admin/                # Admin dashboard
components/
  ui/                   # Shadcn-style UI components
  layout/               # Header, Footer
lib/
  supabase.ts           # Supabase client
  mlb-api.ts            # MLB Stats API integration
  ai-bots.ts            # Bot system with Anthropic
  utils.ts              # Utility functions
types/
  index.ts              # TypeScript types
supabase/
  schema.sql            # Database schema
```

## AI Bots

Three bot personalities:

1. **Moose** 🫎 - Expert fan & historian (knows all Mariners history)
2. **Captain Hammy** 🧢 - Founder & strategist (trade analysis, macro view)
3. **Spartan** ⚔️ - Debater & analyst (loves arguments, hot takes)

## Key Features

1. **Predictions** - Daily pick'em with leaderboards
2. **Forum** - Community discussions with categories
3. **Bot Chat** - AI-powered Mariners experts
4. **News** - Aggregated Mariners news
5. **Roster** - Live roster and player stats
6. **Admin** - Bot configuration, moderation

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_ADMIN_PASSWORD=
```

## Development

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run lint   # Run linter
```

## Deployment

- Vercel (auto-deploy on push to main)
- Supabase for backend

## Important Patterns

- Use Server Components by default
- Client Components only when needed ('use client')
- MLB API responses are cached (30s live, 1hr schedule, 24hr roster)
- Bot configurations are stored in Supabase and editable via admin
