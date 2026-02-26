# 🔥 EBFC Sprint Burndown

> Track your sprint. Tell your story.

A Next.js web app for Scrum sprint burndown tracking, built for the EBFC Scrum Community and construction teams using Lean + Scrum principles.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffelipe-ebfc%2Febfc-sprint-burndown)

## ✨ Features

- **Burndown Chart** — SVG-based, identical to the original v1 tool
- **Sprint Setup** — Items planned + sprint days (Mon–Sun pills)
- **Daily Tracking** — Remaining items + buffer inputs per day
- **PPC%** — Plan Percent Complete (the Lean Construction bridge)
- **Velocity** — items/day, calculated automatically
- **Sprint History** — Past sprints table + velocity trend chart
- **localStorage Persistence** — No account required, data lives in your browser
- **EBFC Branding** — Navy #1A237E + Accent #FF6F00
- **Mobile-First** — Works on jobsite phones
- **"1 card = 1 point" philosophy** built in

## 🚀 Deploy to Vercel (2 minutes)

### Option A: One-Click Deploy
Click the button above ☝️

### Option B: Import from GitHub
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Continue with GitHub"**
3. Search for `ebfc-sprint-burndown` under `felipe-ebfc`
4. Click **Import** → **Deploy**
5. Done! URL: `ebfc-sprint-burndown.vercel.app`

### Option C: CLI
```bash
export PATH="/opt/homebrew/opt/node@22/bin:/opt/homebrew/bin:$PATH"
cd ~/clawd/workspace/vercel-ebfc-app/ebfc-burndown
vercel login   # opens browser → sign in
vercel --yes   # deploys
```

## 🛠️ Local Development

```bash
export PATH="/opt/homebrew/opt/node@22/bin:/opt/homebrew/bin:$PATH"
cd ~/clawd/workspace/vercel-ebfc-app/ebfc-burndown
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## 🏗️ Tech Stack

- **Next.js 16** (App Router, static export)
- **Tailwind CSS v4**
- **TypeScript**
- **SVG charts** (no chart library dependency)
- **localStorage** for persistence

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main page (client component)
│   ├── layout.tsx            # SEO + viewport metadata
│   └── globals.css           # EBFC brand variables + animations
├── components/
│   ├── BurndownChart.tsx     # SVG burndown chart
│   ├── DailyInputs.tsx       # Per-day remaining + buffer inputs
│   ├── SprintSetupCard.tsx   # Items + day pills + start button
│   ├── SprintSummaryCard.tsx # Stats + sprint goal + PPC%
│   └── SprintHistoryCard.tsx # Past sprints + velocity trend
└── lib/
    ├── types.ts              # SprintState, SprintHistoryRecord
    ├── constants.ts          # DAY_NAMES, colors, localStorage keys
    ├── useSprintState.ts     # localStorage state hook
    └── utils.ts              # Metrics computation, chart helpers
```

## 🤝 Community

Built with ❤️ by the **EBFC Scrum Community**

- 🌐 [theebfcshow.com](https://www.theebfcshow.com/)
- 📚 [Join the community](https://store.theebfcshow.com/the-ebfc-show-community)
- 📖 [What velocity really means](https://www.theebfcshow.com/blog/what-velocity-really-means-on-your-construction-project/)
