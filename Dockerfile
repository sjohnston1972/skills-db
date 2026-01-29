FROM node:18-alpine

# Install PostgreSQL, nginx, supervisor, and apache2-utils (for htpasswd)
RUN apk add --no-cache \
    postgresql \
    postgresql-client \
    nginx \
    supervisor \
    apache2-utils \
    bash

# Create postgres user directories
RUN mkdir -p /run/postgresql && \
    chown postgres:postgres /run/postgresql && \
    mkdir -p /var/lib/postgresql/data && \
    chown postgres:postgres /var/lib/postgresql/data

# Initialize PostgreSQL database
RUN su postgres -c "initdb -D /var/lib/postgresql/data"

# Configure PostgreSQL to listen on all interfaces
RUN echo "host all all 0.0.0.0/0 trust" >> /var/lib/postgresql/data/pg_hba.conf && \
    echo "listen_addresses='*'" >> /var/lib/postgresql/data/postgresql.conf

# Create database and user
RUN su postgres -c "pg_ctl -D /var/lib/postgresql/data start" && \
    sleep 3 && \
    su postgres -c "psql -c \"CREATE USER skillsuser WITH PASSWORD 'changeme123';\"" && \
    su postgres -c "psql -c \"CREATE DATABASE skills_matrix OWNER skillsuser;\"" && \
    su postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE skills_matrix TO skillsuser;\"" && \
    su postgres -c "pg_ctl -D /var/lib/postgresql/data stop"

# Setup application directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --production

# Copy application code
COPY backend/ ./backend/
COPY .env ./

# Copy frontend files to nginx directory
COPY frontend/ /usr/share/nginx/html/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Copy htpasswd file for basic authentication
COPY .htpasswd /etc/nginx/.htpasswd

# Copy supervisord configuration
COPY supervisord.conf /etc/supervisord.conf

# Create logs directory
RUN mkdir -p /var/log/supervisor

# Environment variables
ENV NODE_ENV=production
ENV DB_HOST=localhost
ENV DB_PORT=5432
ENV DB_NAME=skills_matrix
ENV DB_USER=skillsuser
ENV DB_PASSWORD=changeme123
ENV PORT=3000

# Expose port 80 (nginx will proxy to Node.js on 3000)
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/api/health || exit 1

# Start supervisord (manages postgres, nginx, node)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
