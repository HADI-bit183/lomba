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
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.4-mini
```

`PORT` may be overridden automatically by the hosting provider.
`DATABASE_URL` is needed only by the migration command and should not be added
to the runtime container unless migrations run there.

## 4. Docker deployment

```bash
docker build -t novamind-hub .
docker run --rm -p 4173:4173 --env-file .env.production novamind-hub
```

For a Git-based Node host without Docker:

- Install/build command: `npm ci`
- Pre-deploy/release command: `npm run migrate` (requires `DATABASE_URL`)
- Start command: `npm start`
- Liveness path: `/api/health`
- Readiness path: `/api/ready`

The readiness endpoint returns `503` until Supabase Auth, the database, and the
latest required columns are reachable.

## 5. Verify

After deployment:

```bash
curl https://your-domain.example/api/health
curl https://your-domain.example/api/ready
```

Use HTTPS in production so authentication cookies receive the `Secure`
attribute. Static frontend requests use relative URLs, so no frontend API host
rewrite is required when frontend and backend are deployed together.
