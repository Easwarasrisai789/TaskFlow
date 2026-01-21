## Taskflow – Smart Task Manager (React + Firebase)

Taskflow is a **smart task manager web app** built with **React (TypeScript)**, **Firebase Authentication**, and **Cloud Firestore**.  
It lets each user securely sign in, manage **daily/weekly/monthly** tasks, and see **live productivity reports** with charts, streaks, and smart insights.

### Features

- **Firebase Auth**
  - Email/password sign in & sign up
  - Google sign-in (once enabled in your Firebase console)
- **Per-user data**
  - Each user only sees their own profile and tasks (stored under `users/{uid}/tasks`)
- **Tasks**
  - Daily, weekly, and monthly tasks
  - Checkbox for **today’s completion** per task
  - Statuses: ✅ completed, ❌ missed, • pending
  - For reports, days without completion in the past are treated as **missed**
- **Live reports (no page refresh)**
  - Weekly and monthly aggregates (total, completed, missed, productivity %)
  - Live **weekly bar chart** (completed vs missed per day)
  - All powered by Firestore `onSnapshot` listeners
- **Productivity & insights**
  - Weekly and monthly productivity progress bars
  - **Streak tracking** for consecutive successful days
  - Smart insights based on your recent performance
- **UX & UI**
  - Smooth page transitions via `framer-motion`
  - **Focus mode** to hide side panels and show only today’s tasks
  - **Dark / light mode** with persistence in `localStorage`
  - Responsive layout for **mobile, laptop, desktop**
  - Touch-friendly forms and task checkboxes

---

## 1. Getting started

### Prerequisites

- Node.js (>= 18)
- npm
- A Firebase project with:
  - **Authentication** enabled (Email/Password + optionally Google)
  - **Cloud Firestore** in “Production” or “Test” mode

### Install dependencies

In the project root (`taskflow`):

```bash
npm install
```

### Run the development server

```bash
npm start
```

Open `http://localhost:3000` in your browser.

The app will automatically reload when you edit files.

---

## 2. Firebase configuration

The app reads Firebase configuration from `src/firebase.ts`. It currently uses the config you provided in the Firebase console.

If you want a more GitHub-friendly setup:

1. Create a `.env.local` file (not committed to git) and put:

```bash
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
REACT_APP_FIREBASE_MEASUREMENT_ID=...
```

2. Update `src/firebase.ts` to read from `process.env.REACT_APP_*` variables.

> Note: Firebase API keys are safe to expose in client code, but using env variables makes it easier to have different configs per environment.

---

## 3. Firestore data model

- **Users collection**

  - `users/{uid}`
  - Created/updated automatically on login.
  - Example fields:
    - `uid`: string
    - `name`: string
    - `email`: string
    - `photoURL`: string | null
    - `lastLoginAt`: ISO string

- **Tasks subcollection**

  - `users/{uid}/tasks/{taskId}`
  - Example fields:
    - `title`: string
    - `description`: string
    - `frequency`: `"daily" | "weekly" | "monthly"`
    - `createdAt`: ISO string timestamp
    - `active`: boolean
    - `completions`: map of `YYYY-MM-DD -> "completed" | "missed"`

The hook `useTasks`:

- Subscribes to `users/{uid}/tasks` via `onSnapshot` for **real-time updates**.
- On checkbox toggle, sets `completions[YYYY-MM-DD]` to `"completed"` or `"missed"`.
- For weekly/monthly reports, days in the past with no completion entry are treated as missed.

---

## 4. Running a production build

```bash
npm run build
```

This outputs a static bundle into the `build` folder.

You can preview it locally with:

```bash
npm install -g serve
serve -s build
```

Then open the URL shown in your terminal (usually `http://localhost:3000`).

---

## 5. Deployment

Because this is a pure frontend app (React + Firebase), you can deploy it to any static hosting provider, for example:

- Firebase Hosting
- Vercel
- Netlify
- GitHub Pages

### Example: Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Choose "build" as your public directory and "Single-page app"
npm run build
firebase deploy
```

Your app will be live on the Hosting URL Firebase gives you.

---

## 6. Project structure

- `src/firebase.ts` – Firebase app, Auth, Firestore instances
- `src/contexts/AuthContext.tsx` – Firebase Auth state and helpers
- `src/contexts/ThemeContext.tsx` – Light/dark mode handling
- `src/hooks/useTasks.ts` – Task CRUD, daily completions, stats, streaks, chart data
- `src/pages/LoginPage.tsx` – Auth UI with email/password + Google
- `src/pages/DashboardPage.tsx` – Main dashboard, tasks, reports, focus mode
- `src/components/Layout.tsx` – Shell layout (header, theme toggle, user chip)
- `src/types/task.ts` – TypeScript types for tasks and completions
- `src/App.tsx` – Routing (`/login`, private dashboard route)
- `src/App.css`, `src/index.css` – Modern responsive UI styling

---

## 7. GitHub readiness

This repository is ready to be pushed to GitHub:

- Pure **frontend stack**: React + Firebase + Recharts + Framer Motion.
- No custom server code.
- Single `npm install && npm start` flow for easy onboarding.
- Clear README for setup, configuration, and deployment.

