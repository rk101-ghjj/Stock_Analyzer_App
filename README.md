# Stock_Analyzer_App
Stock_Analyzer_App using Reactjs, recharts, Pure CSS


# Stock Analysis (Frontend)

Summary
- Single-page React app (Vite) for loading, visualizing and analyzing stock data.
- Implemented: search with suggestions, Select/Load behavior, real‑time quote polling, technical indicators (SMA/EMA/RSI/MACD/BB helpers), improved modern UI styles.

Quick Highlights
- Real-time current quote polling (GLOBAL_QUOTE via AlphaVantage) on symbol selection (configurable polling interval in code).
- Historical series fetch (daily) and indicators enrichment (enrichWithIndicators).
- SearchBar: suggestions list with working "Select" (type="button") and Load (form submit) handlers.
- useLocalCache hook persists user preferences (indicators config, last symbol) to localStorage.
- Polished UI via App.css (glass-gradient, responsive layout).

What I changed / fixed
- Fixes for module export/import mismatches (Indicators.js, alphaVantage.js): added compatible named + default exports.
- Implemented and exported enrichWithIndicators and default export in src/utils/Indicators.js.
- Added getRealtimeQuote in src/services/alphaVantage.js and exported it.
- Implemented robust useLocalCache hook returning [state, setValue].
- Replaced/implemented SearchBar component to ensure Select and Load work (Select uses type="button" to avoid accidental form submit).
- Added polling effect in App.jsx to fetch realtime quotes immediately on symbol change and every 30s (adjustable).
- CSS polishing in src/App.css — fixed syntax errors (missing braces).

File structure (important files)
- frontend/
  - package.json
  - .gitignore
  - README.md (this file)
  - src/
    - main.jsx                -- app entry
    - App.jsx                 -- main component + state, handlers, effects
    - App.css                 -- app styles (modern UI)
    - hooks/
      - useLocalCache.js
    - components/
      - SearchBar.jsx         -- search + suggestions + Select / Load wiring
      - ... other UI components (TickerCard, Panels, etc.)
    - services/
      - alphaVantage.js       -- getDailySeries, getRealtimeQuote, other API helpers
    - utils/
      - Indicators.js         -- toSeries, SMA, EMA, RSI and enrichWithIndicators
    - ...assets, tests as present

Requirements
- Node 18+ (recommended)
- npm or yarn
- AlphaVantage API key (free tier exists, but has rate limits)

Environment
- Create a file frontend/.env with:
  VITE_ALPHA_VANTAGE_KEY=your_api_key_here
- .env is in .gitignore by default — do NOT commit it.

Setup (Windows PowerShell)
1. Open PowerShell in project folder:
   cd "d:\Project\Stock_Analysis_Project\frontend"

2. Install:
   npm install

3. Add .env (see above) and restart dev server if already running.

Run (development)
- Start dev server:
  npm run dev
- Open: http://localhost:5173

Build (production)
- npm run build
- npm run preview

Push to GitHub (exclude sensitive files)
1. Ensure .gitignore exists and includes `.env`, `node_modules`, `dist`, etc. (already present).
2. From project root:
   cd "d:\Project\Stock_Analysis_Project"
   git init
   git rm -r --cached .
   git add .
   git commit -m "Initial commit — frontend"
   git remote add origin https://github.com/youruser/yourrepo.git
   git branch -M main
   git push -u origin main

Notes & Troubleshooting
- AlphaVantage rate limits: free tier ~5 requests/minute. Reduce polling frequency or use paid/data feed for true streaming.
- Common errors:
  - "does not provide an export named 'X'": check default vs named exports in the service/util file and App.jsx imports.
  - "useLocalCache is not a function": ensure hook exports default function returning [state, setState].
  - SearchBar Select button not calling handler: ensure button has type="button" and calls onSelect/onSubmit.
  - Static data / no realtime: confirm VITE_ALPHA_VANTAGE_KEY set and polling effect is running; check browser console for fetch errors.
- If you see CORS or API errors, inspect network tab and ensure API key and quota are valid.

Next steps / improvements
- Replace AlphaVantage polling with a websocket/data provider for true streaming.
- Add unit tests for utils/Indicators functions.
- Add user preferences UI for polling interval and currency.

If you want, I can:
- generate unit tests for Indicators.js
- prepare a small GitHub Actions workflow to deploy the build to GitHub
