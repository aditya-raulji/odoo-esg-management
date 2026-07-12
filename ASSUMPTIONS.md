# ASSUMPTIONS.md — EcoSphere ESG Platform

## Architecture Assumptions

1. **Single git repository** — All code in one repo, no monorepo setup.
2. **SQLite for development** — `prisma/dev.db` is the only database; production migration not in scope for hackathon.
3. **Port 3000** — Dev server always runs on default Next.js port 3000.
4. **Node.js ≥ 18** — Required for `jose` JWT and App Router.

## Auth Assumptions

5. **JWT payload fields**: `{ id, role, name, departmentId, email }` stored in the `ecosphere_session` httpOnly cookie.
6. **JWT expiry**: 7 days from login.
7. **bcryptjs salt rounds**: 10 (balance of security and seed speed).
8. **Middleware protection**: All routes under `/` except `/login`, `/api/auth/*`, and `/uploads/*` are protected.

## Seed Data Assumptions

9. **Employee emails**: Derived as `firstname.lastname@ecosphere.io` (lowercase, dots, no spaces). E.g., "Aditi Rao" → `aditi.rao@ecosphere.io`.
10. **Admin email**: `admin@ecosphere.io`.
11. **Admin password**: `Admin@123`.
12. **Employee password**: `Emp@123` for all non-admin users.
13. **Placeholder upload files**: `public/uploads/photo.jpg` and `public/uploads/cert.pdf` are 1-byte stub files (just enough for links to resolve without 404).
14. **Carbon transaction generation**: 220 rows spread over last 12 months using a sine wave pattern (rising Jan→Jul, falling Jul→Dec) with random variation. 42 rows fall in the last 7 days (2026-07-05 to 2026-07-12).
15. **DepartmentScore logic**: Scores are seeded directly to produce Environmental=82, Social=74, Governance=88 for period 2026-07, giving Overall ESG = 82×0.4 + 74×0.3 + 88×0.3 = 32.8+22.2+26.4 = 81.4 ≈ 81.
16. **Leaderboard XP**: Manufacturing employees' XP sums to ~4820, Corporate employees' XP sums to ~3505. Aditi Rao has xp=3910.
17. **Department head names match User names**: The `head` field in Department uses the same name as the corresponding User record.

## UI/UX Assumptions

18. **StatusPill mapping**:
    - Active / On Track → green (`--green`)
    - Completed / Resolved / Approved → blue (`--blue`) — or green where noted
    - Under Review → purple (`--purple`)
    - Pending / Warning → amber (`--amber`)
    - Open / High severity → red (`--red`)
    - Medium severity → orange (`--orange`)
    - Draft → grey (`--muted`)
19. **Sidebar collapses to a hamburger/drawer** at viewport width < 1024px.
20. **Toast position**: Bottom-right, auto-dismiss after 4 seconds.
21. **DataTable striped rows**: Even rows use `--panel`, odd rows use `--panel2`.

## GitHub Repository

22. **Remote name**: `origin`, branch: `main`.
23. **Repo name**: `ecosphere-esg` under the user's GitHub account.
24. **Initial push**: After commit 1, then again after commit 7.

## Out of Scope (Hackathon)

25. Real file uploads (S3/cloud storage) — using static placeholder files.
26. Email sending — notification system is DB-only.
27. Real-time features — no WebSockets; page refresh required.
28. Production deployment — localhost only.
