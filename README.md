# ANVYRA

**Building our village, one update at a time.**

ANVYRA is a MERN app for monitoring rural infrastructure in one village (demo village: *Ramapuram*, with
4 projects: Government Houses, Overhead Water Tank, Canal, Electric Lines).

A **Site Supervisor** sends a daily progress update in plain words (English, Hindi or Telugu), for example
*"Completed 2 columns, used 40 bags cement"*. The app translates it, splits it into parts and **matches** each part to a
task or material of that supervisor's project, with a score and reasons. The **Village Officer** reviews it and
approves, edits or rejects it. Progress, material stock and charts are calculated from **approved updates only**.
Nothing is ever auto-approved.

| Role | Language | Can do |
|---|---|---|
| Village Officer | English | See all projects, review updates, resolve issues, add expenses, change the supervisor of a project |
| Site Supervisor | English / Hindi / Telugu | Own project only: send updates, log material deliveries, report issues |

## Setup

Needs Node.js 18+ and a MongoDB database (free MongoDB Atlas works; see `server/README.md`).

```bash
npm run install:all                 # installs root, server and client packages
cp server/.env.example server/.env  # then put your MONGODB_URI in it
cp client/.env.example client/.env  # optional
npm run seed                        # loads the demo village (deletes old ANVYRA data!)
npm run dev                         # API on :5001 and website on http://localhost:5173
```

The first start downloads the small AI model (about 25 MB) once; later starts are fast.
The API uses port **5001** because macOS uses 5000 for AirPlay.

### Environment variables (`server/.env`)

| Name | Meaning |
|---|---|
| `MONGODB_URI` | MongoDB connection string (required) |
| `JWT_SECRET` | Secret for login tokens (set your own) |
| `PORT` | API port, default 5001 |
| `GROQ_API_KEY`, `GROQ_MODEL` | Translate Hindi/Telugu with Groq, tried first (optional) |
| `GEMINI_API_KEY` | Fallback translation with Gemini (optional) |
| `GOOGLE_TRANSLATE_KEY` | Or translate with Google Cloud Translation (optional) |

### Demo logins (password `password123`)

| Email | Role |
|---|---|
| officer@anvyra.test | Village Officer |
| housing@anvyra.test | Supervisor, Government Houses (Hindi) |
| watertank@anvyra.test | Supervisor, Overhead Water Tank (Hindi) |
| canal@anvyra.test | Supervisor, Canal (Telugu) |
| electric@anvyra.test | Supervisor, Electric Lines (Telugu) |

The login page has quick-fill buttons for all five.

## How matching works

Code: `server/src/matching/`. It is rule-based plus a small local AI model, so it is explainable and repeatable.

1. **Translate** Hindi/Telugu to English (`translate.js`, Gemini or Google Translate). No key or a failure: keep the original
   text, still match using the Hindi/Telugu keywords, and force `needs_check`. It never crashes.
2. **Normalise**: lowercase, Hindi/Telugu digits to 0-9, number words (one to ten) to digits, small spelling fixes.
3. **Split** into parts at commas, "and", "then", full stops (and और / तथा / మరియు). Each part is matched alone.
4. **Quantity and unit** from a unit table (m, cu m, bags, kg, nos, houses, %). "meters" can be a length or an energy
   meter; nearby words (installed, fixed, of wire...) decide.
5. **Task or material?** A material item needs a material name plus a "used" word; otherwise the part is matched to tasks.
6. **Score** every task/material of that one project: **50% meaning** (cosine similarity with `Xenova/all-MiniLM-L6-v2`
   embeddings), **30% keywords** (fuzzy match with `fuse.js`, English/Hindi/Telugu), **20% unit** (1 fits, 0.5 none, 0 conflict).
7. **Decide**: `matched` if the best score is at least 0.60 and at least 0.10 ahead of the second, else `needs_check`.
   Tasks already at 100% are not chosen automatically.
8. **Explain**: the top 3 candidates with scores and reasons are stored and shown to the officer.
   A part that contains a quantity is never dropped: if nothing fits, it is kept as `needs_check` with the reason
   "no matching task found" so the officer picks the task.
9. **Checks** (warnings, never blocking): above planned quantity, more material used than in stock, unit missing.

### Test results

Translation is replaced by the stored English text in all tests, so they run offline without a database.

| Set | Command | Cases | Accuracy |
|---|---|---|---|
| Tuning set | `npm run test:matching` | 57 | **100%** |
| Held-out set 1 | `npm run test:heldout` | 20 | **100%** (first run 85%, 3 failures) |
| Held-out set 2 | `npm run test:heldout2` | 20 | **100%** (first and only run) |

(run these inside `server/`). The **tuning set** is what the keywords, unit rules and scoring were adjusted against, so its score
is optimistic. A **held-out set** is written afterwards and run once without changing any code. Held-out set 1 failed 3 of 20
cases first (85%); those failures led to general fixes (every part with a quantity is kept for the officer, a "used" word applies
to all materials in its sentence, task-name words and project-name words are handled fairly), so set 1 is no longer independent.
Held-out set 2 was written after those fixes and is the fairest number, but 20 cases is a small sample: expect real-world
accuracy lower than 100%, especially for long or unusual sentences. Without translation the Hindi/Telugu cases still find the
right task/material about 90% of the time, but are always marked `needs_check`.

## Using translation

Set one or more keys in `server/.env` and restart the API. Providers are tried in this order, and the next one is used
if a call fails: **Groq** (`GROQ_API_KEY`, model from `GROQ_MODEL`, default `llama-3.3-70b-versatile`), then
**Gemini** (`GEMINI_API_KEY`), then **Google Translate** (`GOOGLE_TRANSLATE_KEY`). Free keys: https://console.groq.com/keys
and https://aistudio.google.com/apikey. If no key is set or all providers fail, the update keeps its original words and is
marked "needs check".

## Folder structure

```
server/src  config, models, utils (progress calculations), middleware (auth, upload, errors),
            controllers, routes, matching (engine + tests), seed (demo data)
client/src  api.js, auth, i18n (en/hi/te), components, pages/officer, pages/supervisor
```

## API summary

`POST /api/auth/login`, `GET /api/auth/me`, `GET /api/dashboard`, `/dashboard/progress-history`, `/dashboard/counts`,
`GET /api/projects`, `/projects/:id`, `/projects/:id/updates`, `/projects/:id/activity`,
`POST /api/match/preview`, `POST /api/updates`, `GET /api/updates/mine`, `GET /api/updates/review`,
`PATCH /api/updates/:id/approve|reject`, `GET|POST /api/projects/:id/receipts|issues|expenses`,
`GET /api/issues`, `PATCH /api/issues/:id/resolve`, `GET /api/supervisors`, `PUT /api/projects/:id/supervisor`.
Access rules are enforced on the server: a supervisor gets 403 for any other project.

## Screenshots to take for the report

Login page; Village Dashboard (stat cards, project cards, charts); Review Updates with the AI pipeline and top-3 bars;
Project Details; Send Update with live preview (try Hindi and Telugu); Materials & Issues; a phone view.

## Notes

- Each project has exactly one active supervisor. "Change supervisor" (officer) replaces them: the old one can no longer sign in but stays in the database, so their past updates and activity log entries keep their name. A former supervisor can be chosen again later.
- Uploaded photos are saved in `server/uploads/` (not in git).
