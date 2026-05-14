# SMED Changeover Manager
### Arvind Limited — Woven Production Unit, Electronic City, Bengaluru

Full-stack production floor management app for digitizing style changeover planning across Lines E1–E10.

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally
- npm 9+

### 1. Clone & install

```bash
cd SMED-App
npm install                    # root (installs concurrently)
npm install --prefix server    # backend deps
npm install --prefix client    # frontend deps
```

### 2. Database setup

```bash
# Copy env file and update your DB credentials
cp server/.env.example server/.env
# Edit server/.env → set DATABASE_URL

# Run migrations (creates all tables)
npm run db:migrate

# Seed with sample data (3 OBs, 50 workers, 30 machines, 1 checklist, 1 plan)
npm run db:seed
```

### 3. Run the app

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

---

## Architecture

```
SMED-App/
├── server/                  Node.js + Express + Prisma
│   ├── prisma/
│   │   ├── schema.prisma    All 9 data models
│   │   └── seed.js          Sample data
│   └── src/
│       ├── index.js         Express app
│       ├── routes/          ob, workers, allocation, machines, checklists, dashboard
│       └── utils/           allocationEngine.js, xlsxParser.js
└── client/                  React 18 + Vite + Tailwind
    └── src/
        ├── pages/           Dashboard, OBManager, SkillMatrix, AllocationPlanner,
        │                    MachineInventory, ChangeoverChecklist
        ├── components/      ui/, layout/, (modular components per page)
        ├── api/client.js    All API calls
        └── lib/utils.js     Helpers, colors, constants
```

---

## Modules

| Module | Page | Key Features |
|--------|------|--------------|
| **OB Manager** | `/ob` | XLSX upload, OB library, SAM summary, duplicate |
| **Skill Matrix** | `/skills` | Heatmap, worker directory, XLSX bulk upload |
| **Allocation Planner** | `/allocation` | Auto-allocate, manual swap, confirm plan, T-2 alerts |
| **Machine Inventory** | `/machines` | Line summary, transfer, requirement checker, condition |
| **Changeover Checklist** | `/checklists` | Template generator, interactive check-off, WIP tracker, print |
| **Dashboard** | `/dashboard` | All 10 line cards, upcoming changeovers, alert badges |

---

## XLSX Upload Formats

### OB Upload
Columns (any order, auto-detected by header name):
```
SL# | Description | Machine Type | Base SAM | Allowance % | Thread(m)
```

### Skill Matrix Upload
- One sheet per line (name: E1, E2, ... for auto line mapping)
- Row 7: `SLNO | EMP NO | NAME | DATE OF JOIN | GRADE | [op1] | [op2] | ...`
- Row 8+: Worker data with efficiency values (0.0–1.0)

---

## Allocation Algorithm

The greedy best-fit engine (`server/src/utils/allocationEngine.js`):
1. Sort operations: critical first → by SAM descending
2. For each operation, find workers on that line who have the skill
3. Filter by minimum grade requirement (`requiredGrade` on the operation)
4. Rank by efficiency score (fuzzy match on operation name)
5. Allocate highest-efficiency available worker
6. Flag unallocable operations in red

---

## Machine Types Reference

| Code | Full Name |
|------|-----------|
| SNLS | Single Needle Lock Stitch |
| 4TH O/L | 4-Thread Overlock |
| F/L(2T) | Flat Lock 2-Thread |
| F/L(3T) | Flat Lock 3-Thread |
| HT | Heat Transfer |
| BH | Button Hole |
| BT | Button/Bar Tack |
| KANSAI | Kansai Special |
| DNLS | Double Needle Lock Stitch |
| HAND | Manual/Hand operation |

---

## Resetting Seed Data

```bash
npm run db:reset   # drops all tables, re-migrates, re-seeds
```

---

## T-2 Alert System

The top bar displays a live alert count for:
- Allocation plans with changeovers in ≤2 days that are still DRAFT
- Overdue checklist items (PENDING past due date)
- Machine breakdowns

Alerts refresh every 60 seconds automatically.
