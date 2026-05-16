# Chepseon SMS - Project Instructions

This project is a modern School Management System (SMS) for Chepseon Complex High School (CCHS), built with Next.js 15+, TypeScript, and PostgreSQL. It features a glassmorphism UI, PWA support, and JWT-based authentication.

## Project Overview

- **Core Purpose:** Manage school operations including students, classes, exams, marks, payments, library, and attendance.
- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS (Glassmorphism design).
- **Backend:** Next.js API Routes (`src/app/api`).
- **ORM:** Prisma 6.19.0.
- **Database:** PostgreSQL (Docker for local development, Supabase for production).
- **Authentication:** Custom JWT-based auth with `bcryptjs` and `jsonwebtoken`.
- **PWA:** Progressive Web App support via `src/app/manifest.ts`.

## Architecture

- **App Router:** All pages and API routes are located in `src/app`.
- **Middleware:** `middleware.ts` handles authentication for API routes and protected pages.
- **Data Layer:** Prisma is used for database interactions. The client is initialized in `src/lib/prisma.ts`.
- **Auth Utilities:** JWT signing and verification logic resides in `src/lib/auth.ts`.
- **UI System:** Custom glassmorphism styles are defined in `src/app/globals.css`.

## Building and Running

### Key Commands

- `npm run dev`: Starts the development server.
- `npm run build`: Generates the Prisma client and builds the Next.js application.
- `npm run start`: Starts the production server.
- `npx prisma db push`: Pushes the Prisma schema to the database (useful during development).
- `npx prisma studio`: Opens the Prisma Studio GUI to view/edit data.
- `docker-compose up -d`: Starts the local PostgreSQL database container.

### Prerequisites

- Node.js 20+
- Docker (for local database)
- Environment variables configured in `.env` (see `.env.example`).

## Development Conventions

- **API Security:** All API routes (except `/api/auth/*`) require a valid JWT passed in the `Authorization: Bearer <token>` header.
- **Page Security:** Protected pages (Dashboard, Students, etc.) are guarded by middleware which checks for a `token` cookie.
- **Type Safety:** Use TypeScript for all components and API handlers. Prisma generates types based on `prisma/schema.prisma`.
- **Styling:** Adhere to the Glassmorphism design system using Tailwind CSS classes and the `.glass` utility.
- **PWA:** Maintain PWA compatibility by ensuring icons and manifest details are up to date in `public/` and `src/app/manifest.ts`.

## Project Structure Highlights

- `src/app/api/`: Contains all backend logic for different modules (attendance, classes, exams, etc.).
- `src/lib/`: Reusable utilities and singleton instances (Prisma, Auth).
- `prisma/schema.prisma`: The source of truth for the database schema.
- `public/`: Static assets including SVG icons for the dashboard.
- `middleware.ts`: Centralized routing and authentication guard.
