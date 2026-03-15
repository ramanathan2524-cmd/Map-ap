# Deployment Guide

## Local Development

```bash
# 1. Start infrastructure
docker-compose up postgres redis -d

# 2. Run migrations and seed
cd backend
npm run migrate:dev
npm run generate
npm run seed

# 3. Start dev servers
cd ..
npm run dev
```

## Production Deployment (Docker Compose)

```bash
# 1. Copy and configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with production DB credentials

# 2. Build and start all services
docker-compose up -d --build

# 3. Run migrations
docker-compose exec backend npm run migrate

# 4. Import data (once)
docker-compose exec backend npm run seed
```

## Cloud Deployment (AWS Example)

```
Frontend  →  S3 + CloudFront
Backend   →  ECS Fargate or EC2 (t3.medium+)
Database  →  RDS PostgreSQL 15 with PostGIS extension
Cache     →  ElastiCache Redis
Tiles     →  Martin on EC2 or ECS
```

### RDS PostGIS Setup

```sql
-- Enable PostGIS on RDS (requires rds_superuser)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

### Environment Variables (Production)

```bash
NODE_ENV=production
DATABASE_URL="postgresql://user:password@rds-endpoint:5432/ap_election_map"
REDIS_URL="redis://elasticache-endpoint:6379"
CORS_ORIGIN="https://apelectionmap.in"
PORT=4000
```

## Performance Tuning (Production)

### PostgreSQL

```sql
-- Increase shared_buffers for spatial queries
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET work_mem = '64MB';
ALTER SYSTEM SET effective_cache_size = '6GB';
SELECT pg_reload_conf();

-- VACUUM and ANALYZE after bulk imports
VACUUM ANALYZE districts;
VACUUM ANALYZE booths;
VACUUM ANALYZE election_results;
```

### Nginx (Rate Limiting + Caching)

Add to `docker/nginx.conf` for production:

```nginx
# Cache API geo responses at Nginx level
proxy_cache_path /tmp/nginx_cache levels=1:2 keys_zone=api_cache:10m max_size=500m;

location /api/v1/geo/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 30m;
    proxy_cache_key "$request_uri";
    proxy_pass http://backend:4000;
}
```

## Monitoring

- **API health check**: `GET /health`
- **Postgres metrics**: pg_stat_activity, pg_stat_user_tables
- **Redis metrics**: `redis-cli info stats`
- Recommended: Grafana + Prometheus for dashboards
