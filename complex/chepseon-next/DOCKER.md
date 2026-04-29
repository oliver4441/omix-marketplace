# Local Development with Docker

## Quick Start

1. **Start everything with Docker:**
   ```bash
   cd /home/oliver/complex/chepseon-next
   docker-compose up -d
   ```

2. **Push database schema:**
   ```bash
   docker-compose exec app npx prisma db push
   ```

3. **Access the app:**
   - App: http://localhost:3000
   - Database: localhost:5432

## Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# Access database
docker-compose exec db psql -U postgres -d chepseon_sms
```

## Environment Variables

Create `.env` file:
```bash
DATABASE_URL="postgresql://postgres:chepseon123@localhost:5432/chepseon_sms?schema=public"
JWT_SECRET="your-secret-key-here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Without Docker (Local Development)

1. Start local PostgreSQL
2. Copy `.env.example` to `.env` and update DATABASE_URL
3. Run: `npm install && npx prisma db push && npm run dev`
