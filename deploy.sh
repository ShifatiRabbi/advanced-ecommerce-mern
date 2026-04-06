#!/bin/bash
set -e
echo "=== ShopBD Production Deploy ==="

echo "→ Pulling latest code"
git pull origin main

echo "→ Installing server dependencies"
cd server && npm ci --production
cd ..

echo "→ Building client"
cd client && npm ci && npm run build
cd ..

echo "→ Building admin"
cd admin && npm ci && npm run build
cd ..

echo "→ Running seeder (skip if already seeded)"
cd server && node src/seeders/seed.js || echo "Seed skipped (data exists)"
cd ..

echo "→ Restarting PM2"
cd server
pm2 startOrReload ecosystem.config.cjs --env production
pm2 save
cd ..

echo "→ Reloading nginx"
sudo nginx -t && sudo systemctl reload nginx

echo "=== Deploy complete ==="
pm2 list