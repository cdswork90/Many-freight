#!/usr/bin/env sh
set -eu
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example. Set DATABASE_URL and AUTH_SECRET before continuing."
fi
npm install
npx prisma generate
echo "Dependencies installed. Start PostgreSQL, then run: npx prisma migrate dev --name init"
echo "After migration, run: npm run db:seed && npm run dev"
