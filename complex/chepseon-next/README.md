# Chepseon SMS - School Management System

A modern school management system built with Next.js 15+, TypeScript, and PostgreSQL. Features glassmorphism UI design, PWA support, and JWT authentication.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Authentication Flow](#authentication-flow)
- [Database Setup](#database-setup)
- [API Routes](#api-routes)
- [UI/Design System](#uidesign-system)
- [Development Workflow](#development-workflow)
- [Docker Setup](#docker-setup)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Future Migration](#future-migration)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  - Next.js 15 App Router                                  │
│  - React 19 + TypeScript                                 │
│  - Tailwind CSS (Glassmorphism UI)                      │
│  - PWA (manifest.ts)                                    │
└────────────────────────────┬──────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     Next.js API Routes                      │
│  /api/auth/* - Login/Register (JWT)                      │
│  /api/students, /api/classes, /api/exams, etc.         │
└────────────────────────────┬──────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              Prisma ORM (v6.19.3)                        │
│  - Schema: prisma/schema.prisma                         │
│  - Client: @prisma/client                              │
└────────────────────────────┬──────────────────────────────┘
                             │
            ┌───────────────┴───────────────┐
            ▼                               ▼
    ┌─────────────┐               ┌─────────────────┐
    │   Supabase   │               │  PostgreSQL    │
    │  (Production)│               │ (Docker Local) │
    └─────────────┘               └─────────────────┘
```

### Tech Stack
- **Frontend:** Next.js 15.5.15, React 19, TypeScript
- **Styling:** Tailwind CSS with Glassmorphism effects
- **ORM:** Prisma 6.19.3
- **Database:** PostgreSQL (Supabase in production, Docker for local)
- **Authentication:** JWT (jsonwebtoken) + bcryptjs
- **Deployment:** Vercel (production), Docker (local)
- **PWA:** Manifest configured for Android install

---

## Authentication Flow

### How It Works
1. **Login:** User submits email/password → `/api/auth/login`
2. **Verification:** Server checks credentials against database using Prisma
3. **JWT Generation:** On success, server returns JWT token signed with `JWT_SECRET`
4. **Client Storage:** Token stored in `localStorage`
5. **Protected Routes:** Middleware (`middleware.ts`) verifies JWT on API routes
6. **Authorization Header:** API requests include `Authorization: Bearer <token>`

### Token Structure
```typescript
{
  id: number,
  email: string,
  userTypeId: number,
  iat: number,  // issued at
  exp: number     // expires in 7 days
}
```

### Middleware Protection
```typescript
// middleware.ts protects:
- /api/* (all API routes except /api/auth/*)
- /dashboard/*
- /students/*, /classes/*, etc.
```

---

## Database Setup

### Schema Overview
The Prisma schema (`prisma/schema.prisma`) includes:

| Model | Description |
|-------|-------------|
| `User` | Authentication, name, email, password, userType |
| `UserType` | Admin, Teacher, Student, etc. |
| `StudentRecord` | Links User to student data (admissionNo, class, etc.) |
| `MyClass` | Class information with ClassType and Section |
| `ClassType` | Form 1, Form 2, etc. |
| `Subject` | Subjects taught |
| `Exam` | Exam definitions (term, year) |
| `Mark` | Student marks per exam/subject |
| `Payment` | Payment definitions |
| `PaymentRecord` | Actual payment records |
| `Book` | Library books |
| `BookRequest` | Book borrowing requests |
| `Attendance` | Student attendance records |
| `Timetable` | Class schedules |

### Local Development (Docker)
```bash
# Start PostgreSQL container
docker-compose up -d db

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio
npx prisma studio
```

### Production (Supabase)
```bash
# Set DATABASE_URL in Vercel environment variables
# Format: postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres

# Push schema
npx prisma db push
```

---

## API Routes

All routes are in `src/app/api/` and return JSON responses.

### Authentication
| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/login` | POST | Authenticate user, return JWT |
| `/api/auth/register` | POST | Register new user |

### Resources
| Route | Methods | Description |
|-------|----------|-------------|
| `/api/students` | GET, POST | List/create students |
| `/api/classes` | GET, POST | List/create classes |
| `/api/exams` | GET, POST | List/create exams |
| `/api/payments` | GET, POST | List/create payments |
| `/api/marks` | GET, POST | List/create marks |
| `/api/attendance` | GET, POST | List/create attendance |
| `/api/library` | GET, POST | List/add books |
| `/api/subjects` | GET, POST | List/create subjects |

### Dashboard
| Route | Method | Description |
|-------|--------|-------------|
| `/api/dashboard?type=stats` | GET | Return counts (students, staff, etc.) |
| `/api/dashboard?type=recent` | GET | Return recent students/payments |

### Query Parameters
- `search` - Search by name/admission number
- `class_id` - Filter by class
- `page` - Pagination (default: 1)
- `limit` - Items per page (default: 20)

---

## UI/Design System

### Glassmorphism Effect
The app uses a glassmorphism design with Tailwind CSS:

```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### Color Scheme
- **Primary:** Blue gradient (`from-blue-900 via-blue-800 to-blue-900`)
- **Text:** White with blue-200 for secondary text
- **Cards:** Glass effect with hover states

### Responsive Design
- Mobile-first approach
- Breakpoints: `md:` (768px), `lg:` (1024px)
- Grid layouts: `grid-cols-1 md:grid-cols-2 lg:grid-cols-5`

### PWA Support
- `manifest.ts` configures installability
- Icons in `/public/icon.svg` and `/public/logo.svg`
- Android install prompt available
- Start URL: `/login`

---

## Development Workflow

### Prerequisites
- Node.js 20+
- Docker (for local database)
- Vercel CLI (for deployment)

### Local Setup
```bash
# 1. Clone and install
cd /home/oliver/complex/chepseon-next
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# 3. Start Docker database
docker-compose up -d

# 4. Push database schema
npx prisma db push

# 5. Run development server
npm run dev
```

### Project Structure
```
chepseon-next/
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── auth/     # Login/register
│   │   │   ├── students/
│   │   │   ├── classes/
│   │   │   └── ...
│   │   ├── dashboard/    # Dashboard page
│   │   ├── login/        # Login page
│   │   ├── layout.tsx   # Root layout
│   │   └── page.tsx      # Homepage
│   └── lib/
│       ├── auth.ts       # JWT utilities
│       └── prisma.ts    # Prisma client
├── prisma/
│   └── schema.prisma   # Database schema
├── public/
│   ├── logo.svg
│   ├── icons/
│   └── ...
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## Docker Setup

### Services
1. **db** - PostgreSQL 16 Alpine
   - Port: 5432
   - Volume: `postgres_data` for persistence
   - Healthcheck: `pg_isready`

2. **app** - Next.js application
   - Port: 3000
   - Depends on: healthy db service
   - Hot-reload: volume mounted at `/app`

### Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# Access database
docker-compose exec db psql -U postgres -d chepseon_sms

# Run Prisma commands in container
docker-compose exec app npx prisma db push
docker-compose exec app npx prisma studio
```

### Dockerfile Stages
- **base** - Node.js 20 Alpine
- **build** - Install deps, generate Prisma client, build Next.js
- **production** - Serve with `npm start`

---

## Deployment

### Vercel (Production)
The app is deployed at: **https://chepseon-next.vercel.app**

```bash
# Deploy to production
vercel --prod --token=YOUR_VERCEL_TOKEN

# Or connect GitHub repo for auto-deployment
```

### Environment Variables in Vercel
Set these in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Value | Type |
|----------|-------|------|
| `DATABASE_URL` | Supabase connection string | Encrypted |
| `JWT_SECRET` | Random 32+ char string | Encrypted |
| `NEXT_PUBLIC_APP_URL` | https://chepseon-next.vercel.app | Plain |

### Build Process
1. `npm install` - Install dependencies
2. `prisma generate` - Generate Prisma client (postinstall hook)
3. `next build` - Build Next.js app
4. Deploy to Vercel edge network

---

## Environment Variables

### `.env.example`
```bash
# Database (Local Docker)
DATABASE_URL="postgresql://postgres:chepseon123@localhost:5432/chepseon_sms?schema=public"

# Database (Supabase Production)
# DATABASE_URL="postgresql://postgres:PASSWORD@db.REF.supabase.co:5432/postgres?schema=public"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # or Vercel URL
```

### Generating JWT Secret
```bash
openssl rand -base64 32
```

---

## Future Migration

### From Current Setup to Full Supabase

The app is already prepared for Supabase migration:

1. **Database:** Prisma schema uses PostgreSQL (compatible with Supabase)
2. **Auth:** JWT system can be replaced with Supabase Auth (optional)
3. **Storage:** Can add Supabase Storage for file uploads
4. **Realtime:** Can add Supabase Realtime for live updates

### Steps to Complete Supabase Integration
```bash
# 1. Get Supabase credentials
#    → app.supabase.com → Project: chepseon-sms (ref: opsnjkvhjgvzhpkxttci)
#    → Settings → Database → Copy connection string

# 2. Update Vercel environment variable
#    DATABASE_URL = postgresql://postgres:PASSWORD@db.opsnjkvhjgvzhpkxttci.supabase.co:5432/postgres

# 3. Push schema
npx prisma db push

# 4. (Optional) Switch to Supabase Auth
#    - Remove custom JWT code
#    - Use @supabase/supabase-js client
#    - Update middleware for Supabase tokens
```

### Why This Setup Is Migration-Ready

| Feature | Current | Supabase Ready |
|---------|---------|----------------|
| Database | PostgreSQL (Prisma) | ✅ Same schema |
| Auth | Custom JWT | Can switch to Supabase Auth |
| API Routes | Next.js API | ✅ Compatible |
| Environment | Vercel + Supabase DB | ✅ Already configured |

---

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs db

# Reset database
docker-compose down -v  # WARNING: Deletes data
docker-compose up -d
npx prisma db push
```

### Build Failures
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npx prisma generate
```

### JWT Issues
```bash
# Verify JWT_SECRET is set
echo $JWT_SECRET

# Decode a token (for debugging)
echo "YOUR_TOKEN" | cut -d'.' -f2 | base64 -d | jq .
```

---

## License

MIT License - Free to use and modify.

---

**Last Updated:** April 2026
**Maintainers:** Chepseon Complex High School (CCHS)
