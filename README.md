# VIPISI Trading Terminal MVP

Local operator dashboard for VIPISI and related trading workflows.

This is not a broker-style chart clone. It is built around journal-driven oversight:

- account and session state
- recent VIPISI journal tail
- trade and skipped setup feed
- risk and kill-switch visibility
- setup family expectancy stats
- operator command handoff

## Journal source

Default journal path:

`C:\Users\Dir.Vipisi\Downloads\deriv bots\vipisi_journal_v4.csv`

Override with:

```powershell
$env:VIPISI_JOURNAL_PATH="C:\path\to\vipisi_journal_v4.csv"
```

## Run

Install dependencies:

```powershell
npm install
```

Run in development:

```powershell
npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:4310/api/dashboard`

Build the frontend:

```powershell
npm run build
```

Run the built app locally:

```powershell
npm start
```

Then open `http://localhost:4310`.

## What the MVP does

- Reads the VIPISI CSV locally through an Express API
- Derives session summary, hit rate, drawdown, and recent PnL
- Shows the latest execute/skip decisions with reasons and outcomes
- Surfaces inferred risk state from the latest filter flags and loss streak
- Aggregates signal family stats with expectancy, quality, and win rate
- Displays documented local operator commands for bot start/stop workflow

## Structure

- `server/` CSV ingestion and dashboard aggregation
- `src/` operator terminal UI
- `vite.config.js` frontend build and local API proxy
