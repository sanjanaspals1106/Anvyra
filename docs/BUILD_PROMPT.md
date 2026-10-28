# ANVYRA – Build Instructions for Claude Code

You are finishing **ANVYRA**, a MERN college project for monitoring rural infrastructure in one village.
The database layer already exists in `server/` (read `server/README.md` and the code in `server/src/` before you start).
Build everything else described here: the Express API, the AI matching engine, and the React frontend.

Work in the phases listed at the end. After each phase, run the checks listed for it, fix anything that fails,
and make a git commit. Do not skip the checks.

---

## 1. What the app does

A Site Supervisor sends a daily progress update in plain words (English, Hindi or Telugu), e.g.
*"Completed 2 columns, used 40 bags cement"*. The app translates it to English, splits it into parts,
and **matches** each part to a task or material of that supervisor's project, with a score and reasons.
The Village Officer reviews it and approves, edits or rejects. Progress, material stock and charts are
calculated from **approved updates only**. Nothing is ever auto-approved.

Every project also tracks **materials** (received, used, stock), **issues** (reported by the supervisor,
resolved by the officer) and **budget** (sanctioned vs spent, entered by the officer).

## 2. Roles

| Role | How many | Language | Can do |
|---|---|---|---|
| Village Officer (`officer`) | 1 per village | English only | See all projects; review updates (approve / edit / reject); resolve issues; add expenses; add supervisors |
| Site Supervisor (`supervisor`) | 1 per project | English, Hindi, Telugu | Only their own project: send updates, log material deliveries, report issues, see their own updates |

There is no worker role, no admin role, no project manager. Use these simple names everywhere in the UI.

## 3. Existing code (do not rewrite it)

- `server/src/models/` – 9 Mongoose models: User, Project, Task, Material, Update, MaterialReceipt, Issue, Expense, ActivityLog.
- `server/src/utils/progress.js` – progress, stock, budget, planned %, and `getProjectSummary()`. Reuse these in the API.
- `server/src/seed/data.js` + `seed.js` – demo village **Ramapuram**: 4 projects (Government Houses, Overhead Water Tank,
  Canal, Electric Lines), 1 officer, 4 supervisors, approved update history, receipts, issues, expenses.
  Demo logins are in `server/README.md` (password `password123`).
- `server/.env` holds `MONGODB_URI` (MongoDB Atlas). Never commit `.env`.

You may add fields or small helpers if needed, but keep the existing models and seed data working.
If you change a model, update the seed and `server/README.md` to match.

## 4. Tech stack

- **Backend:** Node.js + Express (ES modules, plain JavaScript), Mongoose, `jsonwebtoken`, `bcryptjs`, `multer` (photo upload,
  max 5 MB, images only), `cors`, `dotenv`, `express-validator` or simple manual validation.
- **Matching:** `@xenova/transformers` with `Xenova/all-MiniLM-L6-v2`, `fuse.js`, plus our own number/unit parser.
- **Frontend:** React + Vite (plain JavaScript, already created in `client/`), React Router, Tailwind CSS, Recharts,
  `react-i18next`, Axios, `lucide-react` icons.
- Root `package.json` with a `dev` script that runs server and client together (`concurrently`).

## 5. Backend API

Add `server/src/index.js` (Express app, port 5000), plus `routes/`, `controllers/`, `middleware/`, `matching/`.

**Auth and access rules (enforce on the server, not just in the UI):**
- `POST /api/auth/login` → JWT (7 days) + user. `GET /api/auth/me`.
- `requireAuth` middleware verifies the JWT and loads the user from the DB on every request.
- `requireRole('officer')` / `requireRole('supervisor')`.
- A supervisor may only read or write records of **their own** `projectId`. Any request for another project returns 403,
  whatever the URL says.
- Never return `passwordHash`.

**Endpoints (adjust names if needed, keep the behaviour):**

| Method & path | Who | What |
|---|---|---|
| GET `/api/dashboard` | officer | Village summary: overall %, waiting updates, open issues, budget totals, and `getProjectSummary()` for each project |
| GET `/api/dashboard/progress-history` | officer | Weekly cumulative actual % per project + planned % line, from project start to today (for the line chart) |
| GET `/api/projects` | both | Officer: all; supervisor: own |
| GET `/api/projects/:id` | both | Project + task progress + material stock + budget + open issues |
| GET `/api/projects/:id/updates?status=` | both | Updates, newest first |
| POST `/api/match/preview` | supervisor | Runs matching on text **without saving**; used for the live preview while typing |
| POST `/api/updates` | supervisor | Text + optional photo + optional workDate → translate, match, save as `waiting` |
| GET `/api/updates/mine` | supervisor | Own updates with status and officer comment |
| GET `/api/updates/review?status=waiting` | officer | Review queue (needs_check first, then oldest first) |
| PATCH `/api/updates/:id/approve` | officer | Body may contain edited items (change task/material or quantity). If the officer picks a task for a needs_check item, save it. Over-planned items need a comment |
| PATCH `/api/updates/:id/reject` | officer | Comment required |
| POST `/api/projects/:id/receipts` | supervisor | Log material received |
| GET/POST `/api/projects/:id/issues` | supervisor posts, both read | |
| PATCH `/api/issues/:id/resolve` | officer | Resolution note required |
| GET/POST `/api/projects/:id/expenses` | officer | |
| GET/POST `/api/supervisors` | officer | List / add a supervisor and assign to a project |
| GET `/api/projects/:id/activity` | officer | Activity log |

Write an `ActivityLog` entry for every action listed in the model's enum. Only `waiting` updates can be approved
or rejected. Approve/reject must be atomic: check the status and set it in one `findOneAndUpdate`, so a double-click can't approve twice.
Return clear JSON errors (`{ error: "message" }`) with proper status codes.
Serve uploaded photos from `/uploads` and keep `server/uploads/` out of git (except a `.gitkeep`).

## 6. AI matching engine (the showcase feature – make it strong)

Put it in `server/src/matching/`. It must be explainable, deterministic, and testable.

**Pipeline for one update:**

1. **Translate.** If the text contains Devanagari or Telugu script, translate it to English.
   - Make translation a small swappable module (`translate.js`). Support a free/simple provider chosen by env var
     (e.g. `GEMINI_API_KEY` for Gemini, or Google Cloud Translation with `GOOGLE_TRANSLATE_KEY`). Document the setup in the README.
   - If no key is set or translation fails, keep the original text, still run matching (native keywords below still work),
     and force `matchStatus = needs_check`. Never crash.
   - Store `originalText`, `language` (detected from script: `hi` / `te` / `en`) and `englishText`.
2. **Normalise.** Lowercase; convert Devanagari digits (०-९) to 0-9; turn number words one–ten into digits.
3. **Split into parts** at commas, "and", "then", "also", full stops, and their Hindi/Telugu equivalents
   (और, तथा, మరియు). Each part is matched on its own, so one update can produce several items.
   A part with no number and no keyword match is ignored.
4. **Extract quantity + unit** from each part with a unit synonym table, e.g.
   - m: m, metre(s), meter(s) *when it follows a number and isn't "energy meter"*, mtr, मीटर/మీటర్లు (as length)
   - cu m: cu m, cum, cubic metre(s), m3, घन मीटर
   - bags: bag(s), bori, बोरी, బస్తాలు
   - kg: kg, kilo(s), किलो, కిలో
   - nos: nos, no(s), number(s), pieces, plus countable nouns (poles, columns, culverts, gates, pumps, transformers, meters)
   - houses: house(s), home(s), घर/घरों, ఇళ్లు/ఇళ్ళకు
   - %: %, percent, प्रतिशत
   Carefully handle "meter" (energy meter, a countable item) vs "metre" (length): if a number is followed by
   "meters" and the project has a Meter installation task or Energy meters material, use nearby words (installed, fixed, energy)
   to decide. Write tests for this case.
5. **Decide task vs material.** A part is a *material* item when it names a material **and** has a "use" word
   (used, consumed, utilised, लगा/लगी/लगीं/इस्तेमाल, వాడాము/ఉపయోగించాము). Otherwise match it against tasks.
   (A part may yield both, e.g. "erected 20 poles" → task Pole erection; only add a Poles material item if a "use" word is present.)
6. **Score every candidate** (tasks of the supervisor's project, or its materials). Only that one project's items are candidates.
   - **Meaning (50%)**: cosine similarity between the part's English text and the task name + keywords, using
     `Xenova/all-MiniLM-L6-v2` embeddings. Load the model once at startup (singleton), cache task embeddings per project,
     and rescale cosine so unrelated ≈ 0 and close matches ≈ 1.
   - **Keywords (30%)**: share of the task's keywords found in the part (English + Hindi + Telugu keywords already in the seed),
     using `fuse.js` so small spelling mistakes still count (e.g. "colums", "exavation").
   - **Unit (20%)**: 1 if the extracted unit fits the task's unit, 0.5 if no unit was found, 0 if it clearly conflicts.
   - Skip tasks that are already 100% complete (but still list them with the reason "already complete" if they would have ranked first).
7. **Decide.** `matched` if the top score ≥ 0.60 **and** it is ≥ 0.10 ahead of the second. Otherwise `needs_check`.
   The update's `matchStatus` is `needs_check` if any item needs a check.
8. **Explain.** Store the top 3 candidates per item with `score` and human-readable `reasons`, e.g.
   `["meaning 0.88", "words: column", "unit matches (nos)"]`.
9. **Checks** shown to the officer (don't block saving): quantity would push the task above its planned quantity;
   material used is more than current stock; unit missing.

Expose one function `matchUpdate({ text, projectId })` → `{ language, englishText, items[], matchStatus, warnings[] }`,
used by both the preview endpoint and the create endpoint.

**Matching test set (required).** Create `server/src/matching/testcases.js` with **at least 40** sample updates across all 4 projects
and all 3 languages, each with the expected items (task/material name + quantity). Include tricky ones: spelling mistakes,
synonyms ("put up poles", "dug the canal"), two tasks in one sentence, a material-only update, the meter-vs-metre case,
an ambiguous update that *should* be needs_check, and an unrelated sentence that should produce no items.
Add `npm run test:matching` that runs them through `matchUpdate` (translation stubbed with the stored English text so the test runs
offline), prints a table and an accuracy %, and exits non-zero below **90%**. Tune keywords, unit rules and thresholds
until it passes, without hard-coding answers. Note the final accuracy in the README.

**Seed:** extend the seed to also create about 6 **waiting** updates spread across the projects by running them through `matchUpdate`
(stub translation as above), including one needs_check and one over-planned case, so the review queue is not empty in the demo.

## 7. Frontend

### 7.1 Theme – bright countryside (very important)

The whole website sits on one **fixed, full-screen illustrated background**, drawn by us as an inline SVG React component
(`client/src/components/CountrysideBackground.jsx`). Do not use any stock image. It is a flat, friendly vector scene,
no outlines, like a children's-book landscape:

- **Sky:** a vertical gradient from deep sky blue at the top (about `#14A3D6`) to a pale cyan near the horizon (about `#9BE3F2`).
- **Sun:** a bright yellow circle in the top-left area, with a small white cloud overlapping its lower edge.
- **Clouds:** two or three small, soft, flat white clouds (slightly transparent) scattered in the upper sky, and big
  puffy cloud banks sitting on the horizon on the left and right sides, partly behind the hills.
- **Hills:** two broad, rounded bright-green hills (`#5BC236` to `#3FA52A`) meeting near the middle, filling the bottom ~35% of the screen,
  with darker green bushes/trees clumped at the far left and far right edges.
- **Path:** a winding sandy-ochre path (`#D9A441`, slightly darker edge) starting wide at the bottom centre and narrowing as it curves
  up to the horizon between the two hills.
- **Details:** small grass tufts on the hills, tiny white dots (distant flowers), and along the bottom edge a row of flowers:
  white daisies with yellow centres, small magenta-pink flowers and yellow tulip-like flowers, among taller grass blades.
- Keep it light and calm. Optionally let the clouds drift very slowly (CSS animation, disabled with `prefers-reduced-motion`).
- The scene must scale to any screen with `preserveAspectRatio="xMidYMid slice"`, and stay sharp on mobile.

**On top of the scene:** content sits on white, slightly transparent cards (`bg-white/85` with `backdrop-blur`, rounded-2xl,
soft shadow) so text and charts stay readable. The sidebar is a white translucent panel too.
Colour tokens: primary **sky blue** (`#0E8FC6`), success **grass green** (`#2E9E44`), accent **path ochre** (`#D9A441`),
warning amber, danger red (used only for delays, low stock, open issues). Dark text (`#1F2937`) on cards.
Fonts: **Nunito** for headings and body (friendly, rounded), with **Noto Sans Devanagari** and **Noto Sans Telugu** as fallbacks so
Hindi and Telugu render well. Big, clear numbers. No dark mode needed.

### 7.2 Layout (reference: the old ANVYRA screens, but light and simpler)

- **Login page:** split layout on the countryside background.
  Left: ANVYRA logo + name, tagline *"Building our village, one update at a time"* (or similar), a one-line description,
  and three short feature points with icons (AI matching in 3 languages; Officer approval for every update; Progress, materials,
  budget in one place). Right: a white "Sign in" card with email + password (show/hide), a Sign in button, and a
  **"Demo access"** row of quick-login buttons (Village Officer + the 4 supervisors) that fill in the demo credentials.
  Language switch (English | हिन्दी | తెలుగు) in the top-right corner.
- **App shell (after login):** left sidebar with logo, nav links with icons and count badges (e.g. updates waiting), and the
  logged-in user's name + role + logout at the bottom; collapsible on small screens. Top bar with the page title,
  project name (for supervisors), the language switch (supervisors only), and the user's initials avatar.

### 7.3 Pages

**Village Officer (English only):**
1. **Village Dashboard (home) – must be very clear, understandable in 5 seconds:**
   - Header: village name, today's date.
   - Summary strip of 4 stat cards: overall village progress %, updates waiting for review, open issues, budget spent (₹ and %).
   - **4 project cards** (one per project, with a simple icon for houses / water tank / canal / electricity): progress ring
     with %, planned % below it, supervisor name, last update date, and badges: *On track* (green) or *Delayed* (red),
     *Low stock: Cement*, *2 open issues*, *Spending ahead of work*. Clicking opens Project Details.
   - **Line chart:** progress over time (weekly) for all 4 projects, one colour per project, with dashed planned lines.
   - **Bar chart:** % budget spent vs % work done, side by side for each project.
   - **Updates by project:** tabs, one per project; each tab split into *Waiting*, *Approved*, *Rejected* lists showing
     date, English text, matched items and status.
2. **Review Updates:** queue on the left (needs_check first, with badges); selected update on the right showing original text,
   English translation, photo, and for each item the **top 3 matches as bars with score % and reasons**, the extracted
   quantity + unit, and warnings. Officer can switch the task with a dropdown, edit the quantity, then Approve / Reject (comment).
   Show a small "AI pipeline" panel (Translated → Split into parts → Matched → Checks) for the selected update — this is the showcase.
3. **Project Details:** progress bar per task (done / planned with unit), materials table (received, used, stock, low-stock highlight),
   budget card with expense list and "Add expense", open and resolved issues, update history, and activity log.
4. **Issues:** all issues across projects, filter by project and status, Resolve with a note.
5. **Supervisors:** list, add a supervisor (name, email, password, language, project).

**Site Supervisor (English / Hindi / Telugu):**
1. **My Project (home):** big progress ring, task progress bars, low-stock warnings, open issues, last 5 updates with status.
2. **Send Update:** large text box ("What work was done today?"), optional photo, work date (default today).
   While typing (debounced ~700 ms), call `/api/match/preview` and show a **live preview** card: "We understood:
   Columns – 2 nos (91%) · Cement used – 40 bags". Also show the 4-step AI pipeline with each step ticking off on submit.
   A mic button using the browser's Web Speech API (hi-IN / te-IN / en-IN based on the chosen language) is a nice extra
   if it's simple; hide it if the browser doesn't support it.
3. **My Updates:** list with Waiting / Approved / Rejected badges and officer comments.
4. **Materials & Issues:** log material received (material dropdown, quantity, date, note), current stock table,
   report an issue (type, description, photo).

### 7.4 Languages

- `react-i18next` with `client/src/i18n/locales/en.json`, `hi.json`, `te.json`. Translate **every** label, button, message and
  empty state on the login page and all supervisor pages into proper Hindi and Telugu (natural, simple words a site supervisor uses).
- The switch saves the choice in localStorage and on the user (`language` field). Officer pages stay in English.
- Task and material names come from the DB in English; show them as they are.

### 7.5 General UI rules

- Simple words everywhere. No jargon like "claims", "WBS", "activities", "ledger".
- Loading states, empty states and friendly error messages on every page; toast messages on save.
- Works on a phone (supervisors will use phones): cards stack, sidebar becomes a menu.
- Format money in Indian style (₹26,00,000) and dates as "28 Oct 2026".

## 8. Phases (commit after each)

1. **API foundation:** Express app, auth, middleware, access rules, all read endpoints. Check: login works for all 5 demo users;
   a supervisor gets 403 on another project; `/api/dashboard` numbers equal `npm run db:check`.
2. **Matching engine:** pipeline, test set, `npm run test:matching` ≥ 90%, preview + create endpoints, waiting updates in seed.
3. **Review flow:** approve / edit / reject, receipts, issues, expenses, supervisors, activity log. Check: approving an update
   changes task progress and stock; double approve is refused; rejecting needs a comment.
4. **Frontend shell:** Tailwind theme, countryside background, login, app shell, routing by role, Axios with JWT, i18n.
5. **Officer pages**, with the dashboard first.
6. **Supervisor pages**, with Send Update + live preview first.
7. **Polish and docs:** responsive check, empty/error states, root README (what ANVYRA is, setup, env vars, demo logins,
   how matching works, accuracy result, screenshots list), `.env.example` files for server and client.

**Before finishing:** run the seed, `npm run test:matching`, `npm run build` for the client, start both apps, and walk through:
supervisor sends a Hindi update → officer sees translation and matches → approves → dashboard progress and stock change.
Fix anything broken. Then summarise what was built, the matching accuracy, and anything left undone.

Do not add features beyond this document (no schedules import, no OCR, no extra AI agents). Keep the code clean and commented
in plain English, since this is a college project that will be explained in a viva.
