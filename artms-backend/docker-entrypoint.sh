#!/bin/bash
set -e

# Render assigns a dynamic port via $PORT (defaults to 80 if unset)
if [ -n "$PORT" ]; then
    sed -i "s/80/$PORT/g" /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf
fi

# Ensure storage directories and log files exist
mkdir -p /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/framework/cache \
         /var/www/html/storage/logs \
         /var/www/html/storage/app/public/avatars \
         /var/www/html/bootstrap/cache

touch /var/www/html/storage/logs/laravel.log || true

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache

# Discover packages at container runtime
php artisan package:discover --ansi || true

# Ensure storage symlink exists
php artisan storage:link || true

# Run database migrations
php artisan migrate --force || true

# Re-apply full write permissions after artisan runs
touch /var/www/html/storage/logs/laravel.log || true
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache

# Start Apache in foreground
exec apache2-foreground
