# blurrr — Vintage Event Camera & Shared Photo Album

A full-stack event photo-sharing application built with HTML, CSS, Vanilla JavaScript, Node.js, Express, Supabase Auth, PostgreSQL, and private Supabase Storage.

## Features

- Organizer sign-in with Supabase Auth
- Create events with random guest-link tokens (only token hashes are stored)
- Guests can access an event without creating an account
- Camera capture, Canvas vintage filter, preview, retake, and upload
- Upload images from a device gallery
- Shared gallery with signed image URLs, lightbox, and individual downloads
- Organizer-only event/photo management
- Download event photos as a ZIP
- Retryable event deletion state if storage cleanup fails
- Input validation, rate limiting, CORS, and upload limits

## Project structure

```text
blurrr/
├── apps/
│   ├── web/                   # Static frontend, deploy to Netlify
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── event.html
│   │   ├── camera.html
│   │   ├── gallery.html
│   │   └── admin.html
│   │   └── assets/{css,js,images}
│   └── api/                   # Express backend, deploy to Render
│       ├── src/
│       │   ├── config/
│       │   ├── controllers/
│       │   ├── middleware/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── utils/
│       │   └── server.js
│       ├── package.json
│       └── .env.example
├── supabase/migrations/001_initial_schema.sql
├── docs/API.md
├── .gitignore
└── README.md
```

## Requirements

- Node.js 20 or newer
- A Supabase project
- Git (recommended)

## 1. Configure Supabase

1. Create a project at https://supabase.com.
2. Open **Project Settings → API** and copy the Project URL and anon/publishable key.
3. Copy the **service_role** key for backend use only. Never place it in frontend code or commit it to Git.
4. Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor.
5. Confirm Storage has a **private** bucket named `event-photos`. The migration attempts to create it. If it is missing, create it manually with a 10 MB file limit and JPEG, PNG, and WebP allowed.
6. In **Authentication → URL Configuration**, set the local Site URL to your local web origin (for example `http://127.0.0.1:5500`) and add the local login page to the redirect allow list (`http://127.0.0.1:5500/login.html`). Add the production login page after deploying.

Do not paste the service-role key into chat, a browser page, or a frontend file. It is a backend secret.

## 2. Configure the API

```powershell
Set-Location .\apps\api
Copy-Item .env.example .env
notepad .env
npm ci
npm run dev
```

Fill in `apps/api/.env` with the values from your Supabase project. `Copy-Item` creates the local file; replace every `YOUR_...` value before starting the API:

```env
PORT=4000
NODE_ENV=development
FRONTEND_ORIGINS=http://127.0.0.1:5500,http://localhost:5500
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
STORAGE_BUCKET=event-photos
MAX_UPLOAD_MB=10
```

The API health check is `http://localhost:4000/api/health`. A successful response contains `"status":"ok"`. Keep this terminal open while testing.

## 3. Configure the frontend

Edit `apps/web/assets/js/config.js`:

```js
window.BLURRR_CONFIG = {
  API_BASE_URL: "http://localhost:4000/api",
  SUPABASE_URL: "https://YOUR_PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY"
};
```

The anon key is designed for browser use when RLS is configured. The service-role key must remain on the backend.

Keep `API_BASE_URL` as `http://localhost:4000/api` for local development. Serve the frontend through an HTTP server (not `file://`). For example, use VS Code's Live Server extension to open `apps/web/index.html`, then note the exact origin it uses. Add that origin to `FRONTEND_ORIGINS` in `apps/api/.env` and restart the API if it is not already listed. `localhost` and `127.0.0.1` count as different origins. Camera access requires HTTPS in production and is generally available on localhost in development.

## 4. Run and test locally

1. Start the API in one terminal with `npm run dev` inside `apps/api`; confirm the health check succeeds.
2. Serve `apps/web` on `http://127.0.0.1:5500` or another allowed origin and confirm the page loads without Supabase configuration warnings in the browser console.
3. Open `login.html`, register/sign in with Supabase Auth.
4. Create an event from the dashboard.
5. Open the guest link in a private/incognito window.
6. Capture or choose an image, upload it, and confirm it appears in Event Folder.
7. Sign in as the organizer and test photo deletion and ZIP download.
8. Test permanent deletion only with disposable test data. Confirm the deleted guest link no longer works.

## API routes

See [`docs/API.md`](docs/API.md).

## 5. Deploy

Deploy only after the local flow works. Push the project to a Git repository first; never commit `.env` or any service-role key.

### Render (API)

1. Create a Render Blueprint from the repository; Render will read `render.yaml`. Alternatively create a Web Service using root directory `apps/api`, build command `npm ci`, and start command `npm start`.
2. Set the environment variables Render requests from `render.yaml`. `FRONTEND_ORIGINS` must be the exact HTTPS origin of your deployed frontend (for example `https://your-site.netlify.app`, with no path or trailing slash). Set the Supabase URL and keys from your own project. The service-role key belongs only in Render's secret environment variables.
3. After deploy, visit `https://YOUR_RENDER_DOMAIN/api/health` and confirm it returns `"status":"ok"`.

### Netlify (frontend)

1. Import the same repository into Netlify. The root `netlify.toml` sets the base directory to `apps/web` and publish directory to `.`.
2. Before publishing, edit `apps/web/assets/js/config.js`: set `API_BASE_URL` to `https://YOUR_RENDER_DOMAIN/api`, and set `SUPABASE_URL` and `SUPABASE_ANON_KEY` to the public values for the same Supabase project used by the API.
3. Deploy and copy the final HTTPS site origin. Add that exact origin to Render's `FRONTEND_ORIGINS` environment variable, then redeploy/restart the API.
4. In Supabase Auth URL Configuration, set the production Site URL and allow `https://YOUR_NETLIFY_DOMAIN/login.html`.
5. Retest organizer sign-in, event creation, guest upload, photo viewing, ZIP download, and deletion on the production site. The production frontend API URL must not point to `localhost`.

## 6. Security notes

- Guest tokens are generated with Node's cryptographic RNG and only SHA-256 hashes are stored.
- Organizer API calls verify the Supabase access token and event ownership server-side.
- Image files are stored in a private bucket and exposed through short-lived signed URLs.
- The API uses a service-role key only server-side; because service-role credentials bypass RLS, all privileged operations still perform explicit authorization checks.
- A guest link is a bearer link: anyone who receives it can access that event as a guest.
- Event deletion is retryable. If storage cleanup fails, the event remains in `pending_deletion` and guests are denied access; an organizer can retry deletion.
- Storage-provider backups and retention policies may retain data for a period after deletion.

## 7. MVP limitations / production hardening

This is a practical college-project baseline, not a substitute for a security audit. Before use with sensitive or large events, consider email verification, CAPTCHA/abuse prevention, malware scanning, observability, automated cleanup jobs, automated tests, and a formal privacy/retention policy.
