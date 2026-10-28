# ANVYRA – Backend (database setup)

This folder holds the MongoDB part of ANVYRA: the connection, the 9 collections (Mongoose models),
and a seed script that fills in the demo village **Ramapuram** with its 4 projects.

## 1. Create a free MongoDB Atlas database

1. Sign up at https://www.mongodb.com/cloud/atlas and create a **free (M0) cluster**.
   Pick a region close to you, e.g. Mumbai.
2. **Create a database user.** In *Database Access*, add a user with a username and password.
   Note them down. Avoid special characters like `@ : /` in the password, or they will break the connection string.
3. **Allow your IP address.** In *Network Access*, add your current IP address.
   For college or demo use, you can add `0.0.0.0/0` (allow from anywhere).
4. **Get the connection string.** Click *Connect* on your cluster, choose *Drivers* (Node.js),
   and copy the string. It looks like
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

Atlas changes its screens now and then, so the menu names may differ slightly.

## 2. Connect the project

You need Node.js 18 or newer.

```bash
cd server
npm install
cp .env.example .env      # on Windows: copy .env.example .env
```

Open `.env` and paste your connection string. Put **`/anvyra`** (the database name) right after `.mongodb.net`:

```
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/anvyra?retryWrites=true&w=majority
```

## 3. Fill in the demo data

```bash
npm run seed       # deletes old ANVYRA data and loads the demo village
npm run db:check   # prints each project's progress, stock and budget
```

Demo logins (password for all: `password123`):

| Email | Role |
| --- | --- |
| officer@anvyra.test | Village Officer |
| housing@anvyra.test | Supervisor – Government Houses (Hindi) |
| watertank@anvyra.test | Supervisor – Overhead Water Tank (Hindi) |
| canal@anvyra.test | Supervisor – Canal (Telugu) |
| electric@anvyra.test | Supervisor – Electric Lines (Telugu) |

What the demo data shows (as of 28 Oct 2026):

| Project | Progress | Planned | Budget spent | Story for the demo |
| --- | --- | --- | --- | --- |
| Government Houses | 23.8% | 52.5% | 26.9% | Behind plan, cement running low |
| Overhead Water Tank | 39.5% | 41.7% | 33.3% | On track |
| Canal | 20.0% | 55.6% | 60.0% | Behind plan, spending ahead of work, open flood issue |
| Electric Lines | 38.0% | 47.1% | 37.1% | On track, poles running low, open land issue |

You can also open the database in **MongoDB Compass** (free desktop app) with the same connection string to see the collections.

## Collections

| Collection | What it holds |
| --- | --- |
| users | Village Officer and Site Supervisors |
| projects | The 4 projects, with dates and sanctioned amount |
| tasks | Work items per project, with unit, planned quantity and matching keywords |
| materials | Materials per project, with unit and low-stock level |
| updates | Supervisor progress updates: original text, English text, matched items, status |
| materialreceipts | Material deliveries |
| issues | Problems reported by supervisors |
| expenses | Money spent, entered by the officer |
| activitylogs | Who did what, and when |

Progress, stock and budget are **never stored**. They are calculated from approved data in
`src/utils/progress.js` using MongoDB aggregation, so they can never go out of sync.

## Folder structure

```
server/
├── .env.example
├── package.json
└── src/
    ├── config/db.js          connection
    ├── models/               9 Mongoose models
    ├── utils/progress.js     progress, stock, budget calculations
    └── seed/
        ├── data.js           demo village data (edit this to change the demo)
        ├── seed.js           npm run seed
        └── check.js          npm run db:check
```
