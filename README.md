# Tericsoft HR Portal — Next.js

AI-powered offer letter generation with compensation calculator.

## 🚀 Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.local.example .env.local
# Edit .env.local → add your MISTRAL_API_KEY

# 3. Run dev server
npm run dev
# Open http://localhost:3000
```

## 📁 4-Page Flow

| Page | Route | Purpose |
|---|---|---|
| 1 | `/form` | Candidate details + AI responsibilities |
| 2 | `/compensation` | Salary calculator (old/new regime, all editable) |
| 3 | `/editor` | Edit letter + live preview |
| 4 | `/export` | Download PDF |

## 🐙 Push to GitHub

```bash
# 1. Initialize git (if not done)
git init
git add .
git commit -m "Initial commit: Tericsoft HR Portal"

# 2. Create repo on GitHub (go to github.com → New repository)
#    Name: tericsoft-hr-portal
#    Visibility: Private
#    Do NOT initialize with README

# 3. Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/tericsoft-hr-portal.git
git branch -M main
git push -u origin main
```

## 🌐 Deploy on Vercel (Free)

### Option A — Vercel CLI (recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# → Link to existing project? No
# → Project name: tericsoft-hr-portal
# → Framework: Next.js (auto-detected)
# → Build command: npm run build (default)
# → Output directory: .next (default)

# Set environment variable
vercel env add MISTRAL_API_KEY
# → Enter your key when prompted
# → Select: Production, Preview, Development

# Deploy to production
vercel --prod
```

### Option B — GitHub Integration (easiest)
1. Push to GitHub (steps above)
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your `tericsoft-hr-portal` repo
4. Add environment variable: `MISTRAL_API_KEY` = your key
5. Click **Deploy** — done! Auto-deploys on every `git push`

### Option C — Streamlit Cloud alternative
The original Python/Streamlit version still works. This Next.js version is for production use.

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MISTRAL_API_KEY` | Yes | From [console.mistral.ai](https://console.mistral.ai) |

## 🧮 Compensation Calculator

- Supports **Old Tax Regime** and **New Tax Regime (Budget 2025)**
- Tax slabs auto-calculate; all fields manually overridable
- Table matches the official Tericsoft compensation letter format
- Saves selected regime to offer letter and compensation page

## 📦 Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Zustand** (state management)
- **Mistral AI** (AI content generation)
- **jsPDF + html2canvas** (PDF export)
