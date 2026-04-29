#!/bin/bash
# Setup Cloudflare D1 and connect to Vercel
# Requires: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID

# 1. Create D1 database
echo "Creating D1 database..."
npx wrangler d1 create chepseon-sms-db --location weur

# 2. After creation, get database_id from output and update wrangler.toml
# Then run:
# npx wrangler d1 execute chepseon-sms-db --file=./schema.sql

# 3. Get credentials for Vercel
echo "Database created! Now add these to Vercel:"
echo "CLOUDFLARE_ACCOUNT_ID=your_account_id"
echo "CLOUDFLARE_D1_TOKEN=your_api_token"
echo "CLOUDFLARE_D1_DATABASE_ID=the_database_id"
