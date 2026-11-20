# My Task Manager

A responsive personal task manager built as a React learning and portfolio project. It uses a React + Vite frontend, an Express REST API, and Supabase PostgreSQL for persistent storage.

## Features

- Create, view, edit, and delete tasks.
- Mark tasks Pending or Completed and move completed tasks back to Pending.
- Search task titles and filter by status and priority.
- View total, pending, completed, and high-priority task counts.
- Validate form input and show loading, empty, success, and error states.
- Confirm before deleting a task.
- Register and sign in with Supabase Auth, verify email, and recover or reset a password.
- Users can access only their own tasks.
- Responsive layout for desktop, tablet, and mobile.

## Technology

- React, Vite, JavaScript, and CSS
- React Hooks: `useState`, `useEffect`, and `useCallback`
- Node.js and Express 5
- `pg` Pool for PostgreSQL connections
- Supabase PostgreSQL and parameterized SQL
- Supabase Auth with per-user PostgreSQL row-level security

## Screenshots

Add screenshots of the dashboard and task form to a `screenshots/` folder, then link them here. No screenshot is included yet.

## Project structure

```text
Task Manager/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   ├── .env.example
│   ├── app.js
│   └── server.js
├── database/
│   ├── migrations/
│   └── schema.sql
├── src/
│   ├── components/
│   ├── services/
│   ├── App.jsx
│   └── main.jsx
├── INTERVIEW_QUESTIONS.md
└── README.md
```

The existing Vite project root is the frontend; keeping it there avoids duplicating or moving the starter project.

## Requirements

- Node.js 20.19+ or 22.12+ (Vite requirement) and npm
- A Supabase project with PostgreSQL enabled
- Supabase Auth enabled
- The Supabase database connection URL and public anon/publishable key

## Install

Run these commands from the project root:

```powershell
npm install
npm --prefix backend install
```

## Supabase database setup

For a new project, open **SQL Editor**, paste [database/schema.sql](./database/schema.sql), and run it. For the existing task table, apply [20261119_add_task_ownership.sql](./database/migrations/20261119_add_task_ownership.sql) instead. The migration adds an owner UUID and per-user policies; it aborts without changing task rows if it finds an ownerless row. It does not delete task data.

The migration keeps RLS enabled and grants the `authenticated` role access only when `auth.uid()` matches the task owner. The API validates each Supabase access token and runs task queries as the `authenticated` role in a transaction.

### Password reset redirect

In Supabase **Authentication → URL Configuration**, add the app callback URL to the allowed redirect URLs, for example `http://localhost:5173/reset-password` for local development and the equivalent `/reset-password` URL for production. The forgot-password page requests a link that returns to this route. The reset page requires an active Supabase recovery session; invalid or expired links offer a way to request another link.

## Backend configuration

If `backend/.env` does not exist in your checkout, copy the example:

```powershell
if (!(Test-Path backend\.env)) { Copy-Item backend\.env.example backend\.env }
```

Edit `backend/.env` and replace `YOUR-DATABASE-PASSWORD` with your Supabase database password. The connection URL is:

```dotenv
PORT=5000
FRONTEND_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
DATABASE_URL=postgresql://postgres.ttrzjcizjjmxegrwiotc:YOUR-DATABASE-PASSWORD@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
SUPABASE_ANON_KEY=YOUR-PUBLIC-ANON-OR-PUBLISHABLE-KEY
SUPABASE_TEST_EMAIL=
SUPABASE_TEST_PASSWORD=
```

Use the database password from your Supabase project, not an API key. URL-encode special characters in the password before placing it in the connection URL. `SUPABASE_ANON_KEY` is the public anon/publishable key, not a service-role key. The optional test credentials are used only by the integration test. Keep `backend/.env` private; it is excluded by `.gitignore`. The example file contains placeholders only.

### Frontend Auth configuration

Copy the root `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the same Supabase project values. The anon/publishable key is intended for browser use and is protected by RLS; never put the database URL, database password, or a service-role/secret key in a `VITE_` variable. `.env.local` is excluded by `.gitignore`.

### Supabase TLS certificate

The backend verifies Supabase's server certificate. Download the database root certificate from your Supabase project's **Database Settings → SSL Configuration** and save it as `backend/supabase-root.crt`. If you save it under another path, set `DATABASE_SSL_CA` in `backend/.env` to that path (relative paths are resolved from `backend/`). Certificate verification is intentionally not disabled.

## Run the application

Open two terminals in the project root:

```powershell
# Terminal 1: Express API
npm run api
```

```powershell
# Terminal 2: React frontend
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`), create an account or sign in, then manage your own tasks. Check the API process at `http://localhost:5000/api/health`. Every task endpoint requires a valid Supabase Auth access token.

For production frontend output, run `npm run build`. For the API without watch mode, run `npm run api:start`.

## API documentation

All task endpoints use the `/api/tasks` base path. Task JSON fields are `id`, `title`, `description`, `status`, `priority`, `createdAt`, and `updatedAt`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Check that the API process is running |
| GET | `/api/health/db` | Check that Supabase PostgreSQL is reachable |
| GET | `/api/tasks` | List the signed-in user's tasks |
| GET | `/api/tasks/:id` | Get one of the signed-in user's tasks |
| POST | `/api/tasks` | Create a task for the signed-in user (`title`, optional `description`, optional `priority`) |
| PUT | `/api/tasks/:id` | Update one of the signed-in user's tasks (`title`, `description`, `priority`) |
| PATCH | `/api/tasks/:id/status` | Set the signed-in user's task status to `Pending` or `Completed` |
| DELETE | `/api/tasks/:id` | Delete the signed-in user's task; returns HTTP 204 |

Send the Supabase session as `Authorization: Bearer <access-token>`. The API validates task values and uses PostgreSQL query parameters for user input. Errors return a JSON body such as `{"error":"Task title is required."}`.

## React concepts demonstrated

- `Dashboard` owns the task list and UI state, then passes data and event handlers as props.
- `useEffect` loads tasks from the API when the dashboard first appears.
- `useState` stores tasks, filters, form state, and loading/error/notice messages.
- Controlled form fields keep their values in React state.
- Event handlers process form submissions and task actions.
- Conditional rendering shows dialogs, errors, empty states, and loading feedback.
- `map()` renders one reusable `TaskItem` per task; `filter()` searches and filters without mutating state.
- `src/services/taskApi.js` keeps HTTP requests separate from presentation components.
- Express routes call controllers, which use parameterized PostgreSQL queries through `pg`.

Read [INTERVIEW_QUESTIONS.md](./INTERVIEW_QUESTIONS.md) for simple explanations of the design and React concepts.

## Testing

```powershell
npm run lint
npm run build
npm --prefix backend start
```

The frontend checks do not require a database. For end-to-end API and database CRUD testing, configure `backend/.env`, run the schema in Supabase, and start the API in one terminal. Then run this integration test in another terminal:

```powershell
npm --prefix backend run test:integration
```

Set `SUPABASE_TEST_EMAIL` and `SUPABASE_TEST_PASSWORD` in the private backend `.env` to an existing Supabase Auth test account. The test verifies unauthenticated requests are rejected, obtains a real access token, checks RLS isolation, exercises the CRUD/status API, and deletes only its uniquely marked temporary task even if a test fails. It never prints credentials or task content.

## Future improvements

- Add due dates, sorting, and pagination.
- Add automated browser tests for authentication and task workflows.
- Deploy the frontend and API.

## Publish on GitHub

No repository was created and nothing was pushed. After reviewing the files and adding your own GitHub repository URL, run:

```powershell
git init
git add .
git commit -m "Initial commit: Personal Task Manager"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```
