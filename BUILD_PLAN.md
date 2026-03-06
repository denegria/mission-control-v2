# Mission Control v2 — Frontend Build Plan

## Objective
Rebuild Mission Control v2 in Next.js with a Linear-style dark dashboard aesthetic, matching the provided reference screenshots as closely as possible (ignoring facecam), while preserving current Mission Control stability.

## Non-Negotiables
- Build in **`mission-control-v2/`** only.
- Keep current Mission Control untouched.
- Left sidebar must include **all tabs shown in references** with matching order/active states.
- Replace "Henry" with **Giuseppe** (or other grunt names) in seeded UI content.
- No fake progress updates: only report work after command/file proof.

## Tech Baseline (locked)
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- ESLint

## Phased Execution

### Phase 0 — Reference Lock (0.5 day)
1. Create a screenshot parity board (`/docs/reference-parity.md`).
2. Extract and lock:
   - sidebar width + spacing rhythm
   - topbar height + controls spacing
   - board column widths + card paddings
   - typography scale/weights
   - border/blur/shadow/opacity values
3. Build a strict parity checklist (Pass/Fail).

### Phase 1 — Design System Foundation (0.5 day)
1. Define tokens in `src/styles/tokens.css`:
   - neutrals/background layers
   - accent colors (status chips)
   - border alpha + radii
   - shadows + glows
   - spacing + type scale
2. Implement app shell primitives:
   - Starfield/dark background layers
   - Left sidebar
   - Top command/search bar
   - Main content container + panel system

### Phase 2 — Core UI Primitives (0.5–1 day)
Build reusable, style-locked components:
- `SidebarNavItem`
- `TopBar`
- `Panel`
- `Chip/Badge`
- `SectionHeader`
- `TaskCard`
- `ActivityItem`
- `ProjectCard`
- `CalendarBlock`
- `MemoryRow`
- `RoleCard`

### Phase 3 — Screen Parity Build (1–2 days)
Implement left-nav routes and first-pass screens:
1. Tasks (Kanban + activity panel)
2. Calendar (weekly grid + routine blocks)
3. Projects (cards, progress, statuses)
4. Memory (list + detail split)
5. Team (agent/grunt role cards)
6. Any additional tabs from references (must be included in sidebar parity list)

### Phase 4 — Polish + QA (0.5 day)
1. Pixel-close visual pass (spacing, borders, shadows, type).
2. Keyboard/focus accessibility sanity pass.
3. Responsive pass for primary viewport + one smaller width.
4. Final parity checklist score and gap list.

## Sidebar Parity Matrix (to finalize from all screenshots)
- [ ] Dashboard / Home (if present in references)
- [x] Tasks
- [x] Calendar
- [x] Projects
- [x] Memory
- [x] Team
- [ ] Settings / Integrations / Others visible in references

> Note: this matrix is intentionally strict; no route is considered complete until it matches screenshot parity and nav order.

## Content Seeding Rules
- Replace “Henry” with “Giuseppe” by default.
- Other allowed names: Builder, Sentry, Cisco, Walter, Titan, Scout.
- Use consistent naming across tasks, activity feed, and team cards.

## Definition of Done
- Next.js app runs and builds cleanly.
- All sidebar tabs from references are present and navigable.
- Main screens visually match references to agreed parity.
- No regressions to current Mission Control because v2 is isolated.

## Immediate Next Actions
1. Create `docs/reference-parity.md` and lock measurements from screenshots.
2. Implement shell + token system.
3. Build sidebar routes for all identified tabs.
4. Deliver first visual checkpoint for approval before deeper screen detail.
