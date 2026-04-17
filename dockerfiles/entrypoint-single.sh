#!/bin/bash
set -e

# Initialize MariaDB data directory on first run
if [ ! -d "/var/lib/mysql/mysql" ]; then
    echo "Initializing MariaDB..."
    mysql_install_db --user=mysql --datadir=/var/lib/mysql
fi

# Start MariaDB in the background
mysqld_safe --user=mysql &

# Wait until MariaDB is ready via unix socket
echo "Waiting for MariaDB to start..."
until mysqladmin ping --socket=/var/run/mysqld/mysqld.sock --silent 2>/dev/null; do
    sleep 1
done
echo "MariaDB is ready."

# Switch root to password auth and create DB (unix socket — no password needed here)
mysql --socket=/var/run/mysqld/mysqld.sock -u root <<EOF
ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('');
FLUSH PRIVILEGES;
CREATE DATABASE IF NOT EXISTS flask_app;
USE flask_app;
SOURCE /init.sql;
EOF

# Start Node.js (serves API + React frontend)
echo "Starting Node.js server..."
exec node /app/index.js
