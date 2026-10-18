# MyTrack — Task & Progress Tracker

A responsive React + Vite task tracker with a Node.js + Express starter API.

## Included in this updated prototype
- Redesigned sign-in and sign-up screens with form validation and helpful error messages
- Demo browser-local account creation and sign-in
- Responsive dashboard and task management (create, edit, delete, search, filter)
- Task categories, priorities, due dates, statuses, and progress statistics
- GitHub-style activity heatmap for the last year
- Daily activity count and current streak when a task is marked completed
- Responsive desktop, tablet and mobile layouts
- Express API health endpoint

## Technology
- React + Vite
- CSS and Lucide React icons
- Node.js + Express API starter
- Browser localStorage for prototype data

## Run locally
From this folder, run:

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API health check: http://localhost:4000/api/health

Press `Ctrl+C` to stop both servers.

## Important limitations
Sign-in and sign-up are **prototype-only browser authentication**. Accounts, task data and activity history are stored in the current browser and do not sync between devices. This is not secure production authentication, and the Express API is not yet connected to the task data. Do not use real or sensitive passwords. A production version should use Supabase Auth and a database with server-side authorization and per-user task ownership.

## Next development phase
1. Connect Supabase Auth and PostgreSQL.
2. Add protected backend task CRUD routes and per-user data isolation.
3. Add automated tests, validation, deployment and mobile-device testing.
