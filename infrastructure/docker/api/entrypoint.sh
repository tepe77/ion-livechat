#!/bin/sh
set -e

ROLE=${1:-${CONTAINER_ROLE:-app}}

echo "Starting ION Live Chat Service with role: $ROLE"

# Wait for database if configured
if [ -n "$DB_HOST" ]; then
  echo "Checking database connection to $DB_HOST:$DB_PORT..."
  until nc -z -v -w30 "$DB_HOST" "${DB_PORT:-5432}"; do
    echo "Waiting for database to be ready..."
    sleep 2
  done
  echo "Database is reachable."
fi

if [ "$ROLE" = "app" ]; then
  # Create storage link if needed
  php artisan storage:link || true

  # Auto-migrate if RUN_MIGRATIONS is set
  if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running database migrations..."
    php artisan migrate --force
  fi

  # Auto-seed if RUN_SEEDERS is set
  if [ "$RUN_SEEDERS" = "true" ]; then
    echo "Running database seeders..."
    php artisan db:seed --force
  fi

  echo "Starting Laravel HTTP server on port 8000..."
  exec php artisan serve --host=0.0.0.0 --port=8000

elif [ "$ROLE" = "reverb" ]; then
  echo "Starting Laravel Reverb WebSocket server on port 8080..."
  exec php artisan reverb:start --host=0.0.0.0 --port=8080 --hostname=0.0.0.0

elif [ "$ROLE" = "queue" ]; then
  echo "Starting Laravel Queue worker..."
  exec php artisan queue:work redis --sleep=3 --tries=3 --timeout=90 --verbose

elif [ "$ROLE" = "scheduler" ]; then
  echo "Starting Laravel Task Scheduler..."
  exec php artisan schedule:work --verbose

else
  exec "$@"
fi
