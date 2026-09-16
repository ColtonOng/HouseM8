# HouseM8 🌊

Colton and Anna's household budgeting app — a shared, local website for tracking what the
new place still needs, the groceries list, and who owes who on shared expenses. Styled
after Pacific Beach: ocean blue, sand, and sunset coral.

## Features

- **Dashboard** — a snapshot of the current balance, move-in progress, groceries to buy,
  and recent expenses.
- **Move-In List** — everything the house still needs, with an estimated cost per item,
  a running total, and a progress bar as things get checked off.
- **Groceries** — a shared shopping list with estimated prices, split into "to buy" and
  "in the cart".
- **Expenses** — log anything either of you pays for, choose how it splits (50/50, fully
  owed back, or a custom %), and see a running balance of who owes who. Mark expenses
  settled individually or all at once.

There's a person switcher in the top-right of every page ("Colton" / "Anna") — pick who's
using the browser so additions and expenses get attributed correctly. It's stored per
browser, not a real login, since this is meant to run locally for just the two of you.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) + SQLite — a local file database (`prisma/dev.db`),
  no external account or service needed

## Running it locally

**Requirements:** Node.js 20+ and npm.

```bash
# 1. Install dependencies
npm install

# 2. Copy the env file (already points at the local SQLite file)
cp .env.example .env

# 3. Create the database and apply the schema
npx prisma migrate dev

# 4. Seed the two housemates (Colton & Anna)
npm run db:seed

# 5. Start the app
npm run dev
```

Then open **http://localhost:3000**.

To use it from your girlfriend's laptop/phone on the same wifi instead of just
`localhost`, start the server with `npm run dev -- -H 0.0.0.0` and open
`http://<your-computer's-local-ip>:3000` from her device.

### Useful scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the local dev server |
| `npm run build && npm start` | Run a production build locally |
| `npm run db:studio` | Open Prisma Studio — a GUI to browse/edit the database |
| `npm run db:migrate` | Apply schema changes after editing `prisma/schema.prisma` |

### Changing the names

The two housemates are seeded in `prisma/seed.ts`. Edit the names there (or just rename
them via `npm run db:studio`) and re-run `npm run db:seed` if needed — `upsert` means it
won't create duplicates.

## Project structure

```
prisma/schema.prisma   Data models: Person, MoveInItem, GroceryItem, Expense
src/app/                Pages (Dashboard, Move-In List, Groceries, Expenses) + API routes
src/components/         NavBar and the person-switcher context
src/lib/                Prisma client, balance-splitting math, formatting helpers
```
