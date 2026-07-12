# EcoSphere ESG Management Platform — AGENTS.md

## Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 14.x |
| Language | JavaScript (not TypeScript) | ES2022 |
| Styling | Tailwind CSS | 3.x |
| ORM | Prisma | 5.x |
| Database | SQLite | file:./dev.db |
| Auth | jose (JWT) + bcryptjs | latest |
| Charts | Recharts | latest |
| Icons | lucide-react | latest |
| Runtime | Node.js | 18+ |

## Folder Conventions

```
odoo-esg-managment/
├── app/                        # Next.js App Router routes
│   ├── (auth)/
│   │   └── login/page.js       # Login page (unauthenticated)
│   ├── (dashboard)/            # Protected app routes
│   │   ├── layout.js           # App shell (sidebar + topbar)
│   │   ├── page.js             # Dashboard overview
│   │   ├── environmental/      # Environmental module pages
│   │   ├── social/             # Social module pages
│   │   ├── governance/         # Governance module pages
│   │   ├── gamification/       # Gamification module pages
│   │   ├── reports/            # Reports module pages
│   │   └── settings/           # Settings module pages
│   ├── api/                    # API route handlers
│   │   └── auth/               # Auth endpoints
│   ├── globals.css             # Global styles + CSS variables
│   └── layout.js               # Root layout (fonts)
├── components/
│   └── ui/                     # Reusable UI kit components
│       ├── Button.js
│       ├── Card.js
│       ├── DataTable.js
│       ├── EmptyState.js
│       ├── Input.js
│       ├── Modal.js
│       ├── ProgressBar.js
│       ├── Select.js
│       ├── StatusPill.js
│       ├── Tabs.js
│       ├── Textarea.js
│       ├── Toast.js
│       └── Toggle.js
├── lib/                        # Shared services and utilities
│   ├── auth.js                 # getSession(), requireAdmin(), JWT helpers
│   ├── prisma.js               # Prisma client singleton
│   └── utils.js                # Shared utility functions
├── prisma/
│   ├── schema.prisma           # Database schema (all models)
│   ├── seed.js                 # Seed script with full demo dataset
│   └── dev.db                  # SQLite database (gitignored)
├── public/
│   └── uploads/                # Uploaded files (placeholder stubs)
├── middleware.js                # Route protection middleware
├── AGENTS.md                   # This file
├── ASSUMPTIONS.md              # Design decisions and assumptions
└── package.json
```

## Design Tokens (CSS Variables)

Defined in `app/globals.css`:

```css
--bg: #0B0B0D;        /* Page background */
--panel: #141417;     /* Primary card/panel */
--panel2: #1B1B1F;    /* Secondary panel / table row alt */
--border: #27272C;    /* Border color */
--text: #EDEDEF;      /* Primary text */
--muted: #8E8E93;     /* Muted / secondary text */

/* Module accent colors */
--green: #22C55E;     /* Environmental */
--blue: #3B82F6;      /* Social / Dashboard */
--purple: #A855F7;    /* Governance */
--orange: #F97316;    /* Gamification */
--red: #EF4444;       /* Danger */
--amber: #F59E0B;     /* Pending / Warning */
```

## Typography

- **Headings**: Space Grotesk (via `next/font/google`)
- **Body**: Inter (via `next/font/google`)

## Module Color Mapping

| Module | Accent | Hex |
|---|---|---|
| Dashboard | Blue | #3B82F6 |
| Environmental | Green | #22C55E |
| Social | Blue | #3B82F6 |
| Governance | Purple | #A855F7 |
| Gamification | Orange | #F97316 |
| Reports | Muted/All | — |
| Settings | Muted | — |

## ESG Score Weighting

- Environmental: **40%**
- Social: **30%**
- Governance: **30%**
- Overall = env×0.4 + social×0.3 + gov×0.3

## Development Rules (MUST follow in every task)

1. **Server-side validation on every API route**: Always validate request body shape, types, and authorization before any DB write.
2. **No static JSON data**: All data must come from the database via Prisma. No hardcoded arrays or mock data in components.
3. **Toast feedback on every mutation**: Every create/update/delete operation must show a toast notification (success or error) using the Toast provider.
4. **Consistent dark theme**: All UI must use the CSS variables above. Never use raw hex values in components — always use `var(--token)`.
5. **Role-based access**: ADMIN can access all routes. EMPLOYEE sees only their own data on sensitive routes.
6. **httpOnly cookies only**: JWT tokens must be stored in httpOnly cookies, never in localStorage or sessionStorage.
7. **Prisma transactions**: Use `prisma.$transaction()` when multiple related DB writes must be atomic.
8. **Error boundaries**: Every page must handle loading and error states gracefully.

## Git Commit Convention

Commits follow conventional commits format:
- `chore:` — scaffolding, config
- `feat(module):` — new feature
- `fix(module):` — bug fix
- `docs:` — documentation only

## npm Scripts

```
npm run dev        # Start dev server on port 3000
npm run build      # Production build
npm run db:push    # Push Prisma schema to DB
npm run db:seed    # Run seed script
npm run db:reset   # Drop DB, push schema, seed fresh
```
