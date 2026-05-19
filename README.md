# Standup Flow Board

An internal standup board for tracking people, work areas, work items, comments, ETAs, status, and change history.

The app is built with:

- Next.js 16 App Router
- React 19
- Prisma 7
- SQLite
- Tailwind CSS
- Session-based username/password login

## Features

- Work items grouped by work area.
- Inline status updates.
- People and work area management.
- Assignment, ETA, and comments.
- Activity audit log with actor account and source IP.
- Simple account system with HTTP-only cookie sessions.
- User self-service password change.
- Local command for creating users or resetting passwords.
- JSON export/import for business data migration.

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env` in the project root:

```bash
DATABASE_URL="file:./dev.db"
```

Optional seed-time admin variables:

```bash
STANDUP_ADMIN_USERNAME="harry"
STANDUP_ADMIN_PASSWORD="change-me"
STANDUP_ADMIN_DISPLAY_NAME="Harry"
```

Do not commit `.env`.

### 3. Create or update the local database

For a fresh local database:

```bash
npx prisma migrate deploy
npx prisma generate
```

If you are actively developing schema changes, use:

```bash
npm run db:migrate
```

### 4. Seed sample data and optional admin user

```bash
npm run db:seed
```

If `STANDUP_ADMIN_USERNAME` and `STANDUP_ADMIN_PASSWORD` are present, seed will create or update that user.

### 5. Create or reset a user manually

Use this when there is no account yet, or when resetting a password:

```bash
npm run user:upsert -- --username harry --password 'admin' --display-name 'Harry'
```

The username is normalized to lowercase.

### 6. Start local development

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

For LAN testing:

```bash
npm run dev:lan
```

Then open the machine's LAN IP on port `3000`.

## Using the app

### Login

Go to `/login` and sign in with a user created by seed or `npm run user:upsert`.

Sessions are stored in an HTTP-only cookie and backed by the database. You do not need to log in again until the session expires, you log out, clear cookies, or use another browser/device.

### Change your password

Use the key icon in the top-right account area, or open:

```text
/account/password
```

Changing password keeps the current session and removes other sessions for that user.

### Manage standup data

- `Board`: main standup board.
- `People`: add, rename, or deactivate people.
- `Areas`: add, edit, sort, or delete work areas.
- `Activity`: review audit history.
- `Database`: export or import business data.

### Activity audit log

Activity records include:

- actor username for changes made after login was added;
- source IP as a secondary audit hint;
- entity type and label;
- action;
- changed field;
- old and new values.

Older activity entries may show `unknown` actor because they were created before the account system existed.

## Database export/import

Open:

```text
/database
```

### Export

Click `Download export` to download a JSON file containing business data:

- people;
- work areas;
- work items;
- comments;
- activity logs.

The export intentionally does not include:

- users;
- sessions;
- password hashes;
- session token hashes.

### Import

Import is destructive for business data.

Flow:

1. Choose an export JSON file.
2. Review the preview counts.
3. Type:

```text
IMPORT AND REPLACE
```

4. Click `Replace data`.

Import replaces business data only. Existing accounts remain unchanged. After importing into a new environment, create or reset an account with:

```bash
npm run user:upsert -- --username harry --password 'new-password' --display-name 'Harry'
```

## Production deployment on a VM

The intended deployment is a Node.js app behind a reverse proxy such as Caddy.

Recommended OS: Ubuntu Server 24.04 LTS x64.

### 1. Install Node.js

Install a current Node.js LTS version using your preferred method, for example NodeSource or `nvm`.

Verify:

```bash
node -v
npm -v
```

### 2. Clone the repository

```bash
git clone <your-repo-url> standup
cd standup
```

### 3. Create `.env`

```bash
nano .env
```

Example:

```bash
DATABASE_URL="file:./dev.db"
```

For one-time seed account creation, temporarily include:

```bash
STANDUP_ADMIN_USERNAME="harry"
STANDUP_ADMIN_PASSWORD="change-this-password"
STANDUP_ADMIN_DISPLAY_NAME="Harry"
```

After the user is created, you can remove `STANDUP_ADMIN_PASSWORD` from `.env` and use `npm run user:upsert` for future resets.

### 4. Install dependencies

```bash
npm install
```

### 5. Apply database migrations and generate Prisma client

```bash
npx prisma migrate deploy
npx prisma generate
```

### 6. Seed initial data and admin user

```bash
npm run db:seed
```

Alternatively, create a user manually:

```bash
npm run user:upsert -- --username harry --password 'change-this-password' --display-name 'Harry'
```

### 7. Build the app

```bash
npm run build
```

### 8. Run with PM2

Install PM2 if needed:

```bash
npm install -g pm2
```

Start the app:

```bash
pm2 start npm --name standupboard -- start
pm2 save
```

Check status:

```bash
pm2 list
pm2 logs standupboard
```

After future updates:

```bash
git pull
npm install
npx prisma migrate deploy
npx prisma generate
npm run build
pm2 restart standupboard
```

## Caddy reverse proxy with HTTPS

Install Caddy, then configure your domain to point to the VM public IP.

Example Caddyfile:

```caddyfile
standup.example.com {
    reverse_proxy localhost:3000
}
```

Validate and reload:

```bash
sudo caddy validate
sudo systemctl reload caddy
```

Caddy will automatically provision HTTPS certificates when DNS points to the VM and ports `80` and `443` are reachable.

## Useful commands

```bash
npm run dev          # local dev server
npm run dev:lan      # local dev server bound to 0.0.0.0
npm run build        # production build
npm run start        # production server
npm run lint         # ESLint
npm run db:migrate   # create/apply dev migration
npm run db:seed      # seed sample data and optional admin
npm run user:upsert  # create user or reset password
```

## Files that should not be committed

Do not commit local runtime or secret files:

- `.env`
- `dev.db`
- `dev.db-journal`
- `.next/`
- `node_modules/`
- `.claude/`

Commit Prisma migrations, including auth migrations, because production deploys depend on them:

```text
prisma/migrations/
prisma/schema.prisma
```

## Security notes

- Use HTTPS in production.
- Passwords are stored as bcrypt hashes, not plaintext.
- Session cookies are HTTP-only.
- Session tokens are stored in the database as hashes.
- Database export files contain business data and activity logs. Treat them as sensitive backups even though they do not contain passwords or sessions.
