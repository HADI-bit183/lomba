# Production Deployment

NovaMind is a single Node.js service: the same process serves the existing
frontend and all `/api/*` backend routes. It can run on any Docker-compatible
host while continuing to use Supabase PostgreSQL and Supabase Auth.

## 1. Rotate exposed secrets

Before deployment, rotate the Supabase secret key and `SESSION_SECRET` that were
previously shared outside the hosting provider. Never copy `.env.local` into an
image or commit it to Git.

## 2. Configure Supabase

Run the database schema once:

```bash
DATABASE_URL='postgresql://...' npm run migrate
```

Alternatively, execute `database/schema.sql` in the Supabase SQL Editor.

In Supabase Authentication URL Configuration:

- Set the Site URL to the production HTTPS domain.
- Add the same domain to Redirect URLs.
- Keep email confirmation enabled.
- Configure custom SMTP before production email traffic.

## 3. Required runtime variables

Configure these in the hosting provider's secret/environment settings:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=4173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SESSION_SECRET=minimum-32-random-characters
AUTH_REDIRECT_URL=https://your-domain.example/
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.5-flash
```

`PORT` may be overridden automatically by the hosting provider.
`DATABASE_URL` is needed only by the migration command and should not be added
to the runtime container unless migrations run there.

Optional production alerting:

```env
ERROR_WEBHOOK_URL=https://alerts.example/webhook
```

When set, server `ERROR` and `FATAL` logs are still written locally and are also
sent as JSON to the webhook with a short timeout.

Optional shared rate limiting for multi-instance deployments:

```env
REDIS_REST_URL=https://your-redis-rest-endpoint
REDIS_REST_TOKEN=...
RATE_LIMIT_MAX=20
RATE_LIMIT_WINDOW_MS=60000
```

If Redis REST is configured, auth/chat/user write endpoints use Redis counters
so every app instance shares the same rate limit window. Without Redis, the app
falls back to the in-memory limiter, which is suitable only for one instance.

## 4. Docker deployment

```bash
docker build -t novamind-hub .
docker run --rm -p 4173:4173 --env-file .env.production novamind-hub
```

Migrations are applied from `database/migrations/*.sql` in filename order and
recorded in `public.schema_migrations`. Keep `database/schema.sql` as the
readable full-schema snapshot, and add future production changes as new
versioned files such as `002_add_profile_columns.sql`.

For a Git-based Node host without Docker:

- Install/build command: `npm ci`
- Pre-deploy/release command: `npm run migrate` (requires `DATABASE_URL`)
- Start command: `npm start`
- Liveness path: `/api/health`
- Readiness path: `/api/ready`

The readiness endpoint returns `503` until Supabase Auth, the database, and the
latest required columns are reachable.

Do not deploy this project to GitHub Pages as the production target. GitHub Pages
can only serve static files, while NovaMind requires the Node.js server for
`/api/*`, authentication, sessions, AI chat, and database access.

## 5. Verify

After deployment:

```bash
curl https://your-domain.example/api/health
curl https://your-domain.example/api/ready
```

Use HTTPS in production so authentication cookies receive the `Secure`
attribute. Static frontend requests use relative URLs, so no frontend API host
rewrite is required when frontend and backend are deployed together.
