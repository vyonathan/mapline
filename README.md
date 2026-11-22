# Mapline

**Mapline** is a full-stack Indonesian railway mapping and exploration platform. It provides an interactive railway map, station exploration, railway line discovery, timetable (GAPEKA) integration, train simulation, and route planning.

## Product Identity

- **Category:** Railway mapping, transportation exploration and railway simulation
- **Primary geography:** Indonesia
- **Primary audience:** Railway enthusiasts, passengers, transportation researchers and railway simulation enthusiasts
- **Design philosophy:** Apple Maps-inspired interface, minimalist visual language, dark mode as default, map-first interaction.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide icons, React Leaflet |
| **Backend** | Next.js API routes, server-side data processing, Clerk authentication |
| **Database** | PostgreSQL, Prisma ORM |
| **Map** | Leaflet (via react-leaflet), OpenStreetMap + Esri tiles |

---

## Project Structure

```
mapline/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Database migrations
│   └── seed.ts            # Seed script (populates railway datasets)
│
├── public/
│   ├── favicon.svg
│
├── src/
│   ├── app/
│   │   ├── (application)/
│   │   │   ├── map/          # Interactive railway map (default landing)
│   │   │   ├── stations/     # Station exploration
│   │   │   ├── lines/        # Railway line exploration
│   │   │   ├── journeys/     # Route planning
│   │   │   └── simulation/   # Train simulation
│   │   │
│   │   ├── api/
│   │   │   ├── stations/     # GET/POST/DELETE stations
│   │   │   ├── lines/        # GET/POST/DELETE lines
│   │   │   ├── journeys/     # POST route planning
│   │   │   ├── timetables/   # GET timetable versions & datasets
│   │   │   └── user/         # Auth, saved stations, saved lines, preferences
│   │   │
│   │   ├── layout.tsx        # Root layout with Clerk + Theme providers
│   │   ├── page.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── map/              # MaplineMap (Leaflet map)
│   │   ├── navigation/       # Floating navigation
│   │   ├── panels/           # Panels & inspectors
│   │   ├── stations/         # StationCard, StationDetail
│   │   ├── lines/            # LineCard, LineDetail
│   │   ├── journeys/         # JourneyCard
│   │   ├── trains/           # TrainCard
│   │   ├── timetables/       # TimetableVersionCard, TimetableList
│   │   └── ui/               # Button, Card, ThemeProvider, etc.
│   │
│   ├── features/
│   │   ├── railway/          # Railway graph engine (route planning, path interpolation)
│   │   ├── routing/          # Route planner (Dijkstra-based)
│   │   ├── simulation/       # Train simulation engine (WIB clock, interpolation)
│   │   ├── timetables/       # Timetable dataset management (2025/2026)
│   │   ├── authentication/   # Clerk integration
│   │   └── favorites/        # Saved stations/lines
│   │
│   ├── lib/
│   │   ├── database/         # Prisma client
│   │   ├── auth/             # Clerk auth utilities
│   │   ├── validation/       # Input validation
│   │   └── utilities/        # Helper functions
│   │
│   ├── data/railway/         # Version-controlled railway datasets
│   └── types/
│
├── tests/
│
├── docker-compose.yml
├── .env.example
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

## Data Integrity

All railway datasets are preserved from the original project:

| Dataset | Records | Source |
|---------|---------|--------|
| Railway stations | 125 | `src/data/railway/stations.json` |
| Railway lines | 13 | `src/data/railway/lines.json` |
| GAPEKA 2025 trips | 926 | `src/data/railway/gapeka-2025.json` |
| GAPEKA 2026 trips | 1,058 | `src/data/railway/gapeka-2026.json` |

**Important:** GAPEKA 2025 and 2026 schedules are explicitly marked as `synthetic-estimated-headway` and `isSyntheticEstimate: true`. They are **not** verified official PT KAI / DJKA timetables. The application preserves this classification throughout.

---

## Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14 (local or Docker Compose)
- **npm** (comes with Node.js)

---

## Local Installation

```bash
# 1. Clone and navigate to the project
cd mapline

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local and fill in:
#   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
#   - CLERK_SECRET_KEY
#   - DATABASE_URL

# 4. Start PostgreSQL (see Database Setup below)

# 5. Run database migrations
npx prisma migrate dev

# 6. Seed the database (optional but recommended)
npm run prisma:seed

# 7. Start the development server
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_APP_URL` | Application URL (for Clerk) | No |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (frontend) | Yes |
| `CLERK_SECRET_KEY` | Clerk secret key (server-side) | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |

**Do not commit `.env.local` to version control.** The `.env.example` file provides a template.

---

## Database Setup

### Local PostgreSQL

1. Install PostgreSQL from https://www.postgresql.org/download/
2. Create a database named `mapline`:

```bash
createdb mapline
```

3. Update `DATABASE_URL` in `.env.local`:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/mapline?schema=public
```

### Docker Compose

```bash
docker-compose up -d postgres
```

The Docker Compose configuration creates a `mapline` database with user `mapline` / password `mapline`.

Then update `DATABASE_URL` in `.env.local`:

```
DATABASE_URL=postgresql://mapline:mapline@localhost:5432/mapline?schema=public
```

---

## Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name <description>

# Apply migrations to production database
npx prisma migrate deploy

# Reset database (destructive)
npx prisma migrate reset --force

# Push schema changes without creating a migration
npx prisma db push
```

---

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:migrate-dev` | Create and run migration |
| `npm run prisma:seed` | Run seed script |
| `npm run prisma:reset` | Reset database |
| `npm run typecheck` | Run TypeScript check |

---

## API Design

### Stations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/stations` | List all stations (with pagination, filtering) |
| GET | `/api/stations/[id]` | Get a single station |
| POST | `/api/stations/search` | Search stations |
| GET | `/api/stations/ids` | Get all station IDs (for autocomplete) |

### Lines

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/lines` | List all lines (with filtering) |
| GET | `/api/lines/[id]` | Get a single line |
| POST | `/api/lines/[id]` | (reserved for future use) |

### Journeys

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/journeys/plan` | Plan a route between two stations |
| GET | `/api/journeys/alternatives` | Get alternative routes |

### Timetables

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/timetables/versions` | List available schedule versions |
| GET | `/api/timetables/[version]` | Get a timetable dataset (metadata + count) |

### User

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/user/me` | Get current authenticated user |
| GET | `/api/user/saved-stations` | List saved stations |
| POST | `/api/user/saved-stations` | Save a station |
| DELETE | `/api/user/saved-stations?stationId=...` | Remove a saved station |
| GET | `/api/user/saved-lines` | List saved lines |
| POST | `/api/user/saved-lines` | Save a line |
| DELETE | `/api/user/saved-lines?lineId=...` | Remove a saved line |
| GET | `/api/user/preferences` | Get user preferences |
| PUT | `/api/user/preferences` | Update user preference |

All authenticated endpoints verify the Clerk session on the server. Unauthenticated endpoints (stations, lines, timetables) are accessible without authentication.

---

## Route Planning

The route planner uses a graph-based shortest-path algorithm:

- **Graph:** Stations are nodes, line sequences are edges.
- **Weights:** Inter-station distance (Euclidean in lat/lon space).
- **Transfers:** A small penalty is applied when switching lines.
- **Optimization:** Minimizes transfers first, then distance.

**Note:** The route planner uses distance-based routing. It does **not** claim to find the fastest route, as reliable journey-time information is not loaded. The response includes a disclaimer noting this.

---

## Train Simulation

The simulation engine operates independently of the map UI:

- **Clock:** WIB (UTC+7) time in minutes since midnight.
- **Speed:** Adjustable (0 = paused, 1 = realtime, >1 = fast-forward).
- **Sync:** Real-time clock sync is supported.
- **Positioning:** Trains interpolate along cached railway segment paths.
- **Performance:** Segment paths are cached and reused; graph calculations are not repeated on every frame.

---

## Authentication

The application uses Clerk for authentication:

- Sign in, sign up, and sign out
- User profile management (via Clerk UI)
- Server-side session verification
- User-specific saved stations and lines
- Proper authorization checks (users can only access their own data)

**Authentication does not block public map exploration.** Unauthenticated users can browse the railway map, stations, lines, and timetables.

---

## Deployment

### Vercel (Recommended)

1. Push the repository to GitHub.
2. Import the repository in Vercel.
3. Add the environment variables (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`).
4. Deploy.

### Custom Server / Container

```bash
npm run build
npm start
```

The `output: 'standalone'` configuration in `next.config.ts` ensures a minimal container image.

### Docker

```bash
docker build -t mapline .
docker run -p 3000:3000 -p 5432:5432 --env-file .env.local mapline
```

---

## Testing

The test suite covers:

- Application startup (build test)
- Database migrations (prisma migrate)
- Authentication (Clerk session verification)
- API endpoints (stations, lines, journeys, timetables, user)
- Map rendering (railway corridors, station markers)
- Station selection
- Line selection
- Route planning
- Timetable switching (2025/2026)
- Train simulation (speed, positions, interpolation)
- Mobile responsiveness (responsive panels, touch controls)

---

## License

MIT
