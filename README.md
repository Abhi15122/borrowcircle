# BorrowCircle

**Good things, shared.** A community lending application where members list
useful items, request borrowing dates, and manage approval, handover and return.
Every member can lend and borrow.

## Features

- Register, log in, restore a session, and log out.
- Public Explore with title search, categories, date filters and pagination.
- Create, edit and archive your own items; image/category fallbacks.
- Borrow for 1–14 inclusive calendar days with an optional note.
- Borrowing history and cancellation of pending/approved requests.
- Lending inbox with approval, rejection, handover and return.
- MongoDB-enforced reservations, state transitions and ownership checks.
- Responsive screens with loading, empty, retry, validation and API error states.

## Stack and structure

React + TypeScript, Vite, React Router, Tailwind CSS, Lucide, TanStack Query,
React Hook Form and Zod. Node.js + Express + TypeScript, MongoDB + Mongoose,
Argon2id and Mongo-backed sessions. Vitest, Supertest, React Testing Library
and user-event for verification.

```text
client/src/
  app/                 Routes and query provider
  components/          Layout, fields, images and feedback
  features/            Auth, items and borrowing APIs/components
  pages/               Page composition
  lib/                 Typed, runtime-validated HTTP client
  styles/              Responsive visual design
server/src/
  routes/              Endpoints and middleware composition
  controllers/         HTTP input/output
  services/            Business rules, transactions and DTOs
  models/              MongoDB schemas and indexes
  middleware/          Authentication, CSRF and centralized errors
  validation/          Runtime input parsing
  config/              Environment and database setup
  scripts/             Setup, local database and fictional seed
shared/src/            Browser-safe schemas, types, constants and dates
```

## Setup and running

Use Node.js **22.19 or later** and npm. From the project root:

```powershell
npm ci
npm run setup
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api` to port 4000.
Use the exact configured origin; `localhost` and `127.0.0.1` differ for CSRF.

`setup` creates ignored `server/.env` with a random session secret and preserves
an existing file. The local helper starts a real MongoDB replica set on port
27018 with persistent data in ignored `server/.data/db`. Its first run may
download MongoDB from the vendor and needs Internet access. Do not run two
helpers on the same port or data directory.

While development runs, use another terminal:

```powershell
npm run seed
```

Fictional accounts: `maya@example.test` and `arjun@example.test`.
Setup's fictional demo password is `BorrowCircle-demo-2026!`. Change
`DEMO_PASSWORD` before the first seed if desired. Re-seeding preserves existing
items, accounts and passwords. Seeding is refused outside development.

For Atlas/another replica set, configure `MONGODB_URI`, then use
`npm run dev:external` instead. A standalone MongoDB server cannot support
the required transactions. Startup verifies database capability and prepares
indexes before serving traffic. Production never substitutes a mock database.

| Environment variable | Purpose                                                          |
| -------------------- | ---------------------------------------------------------------- |
| `NODE_ENV`           | `development`, `test`, or `production`                           |
| `PORT`               | API port, default 4000                                           |
| `APP_ORIGIN`         | Exact browser origin without trailing slash; HTTPS in production |
| `MONGODB_URI`        | Replica-set or Atlas URI                                         |
| `SESSION_SECRET`     | Random secret, at least 32 characters; never commit              |
| `TRUST_PROXY`        | `1` for one trusted reverse proxy; otherwise `0`                 |
| `DEMO_PASSWORD`      | Fictional development seed password, at least 10 characters      |

See `server/.env.example`. Keep deployment credentials in the environment.

| Command                | Purpose                                                  |
| ---------------------- | -------------------------------------------------------- |
| `npm run setup`        | Generate local configuration without overwriting it      |
| `npm run dev`          | Local database, API, React and shared TypeScript watcher |
| `npm run dev:external` | API, React and shared watcher with an external database  |
| `npm run seed`         | Idempotent fictional development data                    |
| `npm run typecheck`    | Check all workspaces                                     |
| `npm run lint`         | ESLint                                                   |
| `npm run format:check` | Prettier verification                                    |
| `npm run format`       | Apply formatting                                         |
| `npm test`             | Unit, UI and real MongoDB integration tests              |
| `npm run test:watch`   | Interactive test watcher                                 |
| `npm run build`        | Build shared code, backend and React                     |
| `npm start`            | Start the compiled server                                |

For production, build and provide the required variables with
`NODE_ENV=production`. Put Node behind HTTPS, configure that public
`APP_ORIGIN`, and use `TRUST_PROXY=1` only behind one trusted proxy.
Express serves built React and `/api` from one origin and binds `0.0.0.0`.
The database helper is development-only.

### Deploying on Vercel

Import this repository with its root directory set to `.`. The included
`vercel.json` builds all workspaces, publishes `client/dist`, and routes
`/api/*` to a single Express function. React and the API share one HTTPS origin.
The API reuses database connections between requests and waits for database
capability checks and indexes before serving traffic.

Set these Vercel environment variables before deploying:

| Variable         | Value                                                               |
| ---------------- | ------------------------------------------------------------------- |
| `NODE_ENV`       | `production`                                                        |
| `APP_ORIGIN`     | The exact production URL, such as `https://your-project.vercel.app` |
| `MONGODB_URI`    | An Atlas connection string with a dedicated BorrowCircle database   |
| `SESSION_SECRET` | A newly generated random secret of at least 32 characters           |
| `TRUST_PROXY`    | `1`                                                                 |
| `NODEJS_HELPERS` | `0`, so Express handles JSON parsing and body-size limits           |

Use an Atlas database user with access limited to the application's database.
Configure Atlas network access for the deployment before testing. Never use
the local `127.0.0.1` database URI in Vercel or commit deployment credentials.
Redeploy after changing environment variables. Preview deployments need their
own exact `APP_ORIGIN` and a separate database for isolated testing.

After deployment, check `/api/health`, registration, login/session restoration,
item creation, and borrowing through return. A successful frontend build alone
does not verify the database or authentication. The initial deployment has no
seed data; register accounts and add items through the application.

## Borrowing rules and concurrency

Dates are `YYYY-MM-DD`, with **Asia/Kolkata** defining today's community date.
Both dates count toward the 1–14-day duration. Invalid/reversed ranges, past
starts and excessive durations are rejected.

```text
pending → approved → borrowed → returned
pending → rejected
pending / approved → cancelled (borrower only)
```

Pending requests reserve nothing. Approval inserts one reservation per date
and changes status within one MongoDB transaction. A unique `(item, date)`
index prevents overlapping approvals; conflicts return 409 and roll back
partial writes. Cancellation and return release reservations.

Every lifecycle transaction writes an item revision to coordinate request
creation, approval and archive races. Conditional status updates prevent
repeated transitions. Conditional `activeLoan` writes enforce one active
handover, including overdue loans. Handover requires today's date within the
booked range. Operations inside each transaction run sequentially.
See [Mongoose transactions](https://mongoosejs.com/docs/transactions.html) and
[MongoDB unique indexes](https://www.mongodb.com/docs/manual/core/index-unique/).

Archiving is blocked by approved/active loans, rejects pending requests within
the same transaction, hides the listing and preserves historical references.

## API and security

All endpoints use `/api`: `/auth/register`, `/auth/login`, `/auth/logout`,
`/auth/me`, `/auth/csrf`, `/items`, `/items/:id`, `/items/:id/requests`,
`/requests`, and `/requests/:id/{approve,reject,cancel,handover,return}`.
Lists accept bounded pagination. Requests accept `view=borrowing` or `lending`.
`GET /api/health` checks database readiness with a bounded ping.

Argon2id password hashing, normalized unique emails, regenerated sessions,
HttpOnly/SameSite cookies and Secure cookies in production. Mutations require
session-bound CSRF tokens and reject mismatched origins. Auth rate limiting,
Helmet, body limits, strict field allowlists, escaped searches, validated
configuration and explicit DTOs protect the API. Password hashes and session
secrets are never returned. The frontend validates responses at runtime.

## Testing

Tests start an isolated real MongoDB replica set with a unique test database.
They never read the application's database URI or delete development data.
Checks cover booking races, reservation release, active handovers, archive
races, permissions, sessions, CSRF, validation and item forms.

## Scope and limitations

One community, free lending, general pickup areas and optional HTTPS image
URLs. No payments, chat, maps, reviews, uploads, notifications, email verification
or password reset. Pickup coordination happens outside the app. Expired approved
requests require borrower cancellation before archiving. Auth rate limiting is
process-local; multiple API instances would need a shared limiter.
