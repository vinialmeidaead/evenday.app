#!/bin/sh

cd /app/backend

if ! php artisan migrate --force; then
    echo "============================================"
    echo "ERROR: Migrations could not complete. Check the error above."
    echo "Ensure DATABASE_URL is set."
    echo "============================================"
fi

php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Garantir que os diretórios existam (importante quando volumes estão vazios)
mkdir -p /app/backend/storage/app/public
mkdir -p /app/backend/storage/framework/{sessions,views,cache}
mkdir -p /app/backend/storage/logs
mkdir -p /app/backend/bootstrap/cache

php artisan storage:link

chown -R www-data:www-data /app/backend
chmod -R 775 /app/backend/storage /app/backend/bootstrap/cache

echo "-------------------------------------"
echo "Starting supervisord (nginx, php-fpm, node SSR, queue worker)..."
echo "-------------------------------------"
exec supervisord -c /etc/supervisord.conf
