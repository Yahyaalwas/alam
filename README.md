# ALAMAH PMS — Performance Management System

A production-ready, bilingual (Arabic/English) performance management system for Alamah Marketing.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS (utility-first, RTL support)
- **Database**: PostgreSQL + Prisma ORM 7
- **Auth**: JWT (httpOnly cookies)
- **Validation**: Zod + React Hook Form
- **State**: Zustand

## Features

- Role-based access (employee / manager)
- 3-stage performance workflow: Self Review → Manager Review → HR Finalization
- Immutable locking at each stage (enforced at UI + API level)
- Weighted scoring: Goals 60% + Competencies 40%
- Arabic/English language switcher with full RTL support
- Responsive, mobile-friendly design

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/alamah_pms"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Run database migrations

```bash
npm run db:migrate
```

### 4. Seed the database

```bash
npm run db:seed
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Seed Credentials

| Role     | Email                  | Password      |
|----------|------------------------|---------------|
| Manager  | manager@alamah.com     | manager123    |
| Employee | ahmed@alamah.com       | employee123   |
| Employee | fatima@alamah.com      | employee123   |
| Employee | khalid@alamah.com      | employee123   |

## Assessment Workflow

```
[Employee] → Fill self ratings + comments → Submit (locked permanently)
     ↓
[Manager]  → View employee input (read-only) → Fill manager ratings → Submit (locked permanently)
     ↓
[Manager/HR] → Enter final calibrated scores → Finalize (entire card locked permanently)
```

## Scoring Formula

```
Final Score = (Σ goal_rating/5 × goal_weight / total_goal_weight × 60)
            + (Σ comp_rating/5 × comp_weight / total_comp_weight × 40)
```

- Rating scale: 1–5
- Goals total weight: 60%
- Competencies total weight: 40%

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/                       # login, logout, me
│   │   └── performance-cards/[id]/
│   │       ├── self-review/
│   │       ├── manager-review/
│   │       ├── finalize/
│   │       └── save-draft/
│   ├── dashboard/
│   │   ├── employee/                   # Employee dashboard
│   │   └── manager/                    # Manager dashboard
│   └── performance/[id]/               # Performance card detail
├── components/
│   ├── dashboard/                      # Navbar, Sidebar, Dashboard clients
│   ├── performance/                    # PerformanceCardView, RatingRow
│   └── ui/                             # Button, Badge, Modal, Toast, Spinner
├── lib/
│   ├── auth.ts                         # JWT + bcrypt helpers
│   ├── db.ts                           # Prisma client singleton
│   ├── score.ts                        # Score calculation utility
│   ├── generated/prisma/               # Prisma 7 generated client
│   └── i18n/                           # Translations + React context
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── middleware.ts                        # Auth guard + role-based routing
├── types/                              # Shared TypeScript types
└── validators/                         # Zod validation schemas
```

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel dashboard
3. Add environment variables
4. Deploy — Prisma generates automatically via `postinstall`

## Available Scripts

| Script                | Description                          |
|-----------------------|--------------------------------------|
| `npm run dev`         | Start development server             |
| `npm run build`       | Build for production                 |
| `npm run db:migrate`  | Run Prisma migrations                |
| `npm run db:seed`     | Seed the database with sample data   |
| `npm run db:studio`   | Open Prisma Studio GUI               |
| `npm run db:reset`    | Reset database (dev only)            |
