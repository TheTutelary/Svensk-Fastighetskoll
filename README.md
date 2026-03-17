# 🇸🇪 Svensk Fastighetskoll (Premium Property Analyzer)

Svensk Fastighetskoll is a world-class, AI-powered property analysis engine designed to give Swedish real estate buyers an unfair advantage. By analyzing listings from **Hemnet**, **Booli**, and various brokerage sites, it provides a comprehensive **100-Point Rating** based on 6 critical categories.

---

## 🚀 Features

### 1. The "100-Point Rating Engine"
Every property is evaluated across six weighted categories to ensure no detail is missed:
- **Location & Macro (20pts):** Municipality growth, regional economic trends, and area safety.
- **Commutability (15pts):** The "3-City Rule"—ease of access to Stockholm, Gothenburg, or Malmö via train or highway.
- **Plot & Land (15pts):** Garden size, orientation (S/W focus), privacy, and topography.
- **Structural Health (20pts):** Building age, renovation history, energy class, and risk indicators (Radon, Moisture).
- **Proximity (15pts):** Walking distance to schools, grocery stores, nature, and healthcare.
- **Financial/Energy (15pts):** Operating costs (*driftkostnad*), pantbrev, and BRF economics (for apartments).

### 2. Intelligent Scraper
Our engine uses a **Hybrid Scraping Approach**:
- **Metadata Extraction:** Pulls structured JSON-LD and OpenGraph data for high accuracy.
- **Gemini 2.0 Flash:** Processes raw listing text to infer missing details and calculate scores.

### 3. Beautiful Visualizations
- **Performance Radar:** A visual footprint of how the property balances different categories.
- **Score Gauge:** A high-impact visualization of the overall rating.
- **Market Valuation:** AI-driven estimate of fair value vs. asking price with a 5-year outlook.
- **Risk Dashboard:** Color-coded severity warnings for structural or financial concerns.

---

## 🛠 Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Lucide Icons
- **Animation:** Framer Motion
- **AI Backend:** Vercel Serverless Functions + Google Gemini 2.0 Flash
- **Scraping:** Cheerio + LD-JSON Parser

---

## 🏁 Getting Started

### 1. Prerequisites
- [Node.js 18+](https://nodejs.org/)
- A [Google AI Studio API Key](https://aistudio.google.com/apikey) (free tier works)

### 2. Setup
1. Clone the repository and navigate to the root:
   ```bash
   npm install
   ```
2. Create a `.env.local` file (one has been provided as a template):
   ```env
   GEMINI_API_KEY=your_key_here
   ```

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to start analyzing.

---

## ☁️ Deploy to Vercel

1. **Connect to GitHub:** Push this repository to your GitHub account.
2. **Import to Vercel:** Go to [Vercel](https://vercel.com/new) and select the repository.
3. **Set Environment Variables:** Add `GEMINI_API_KEY` in the project settings.
4. **Deploy:** Hit deploy and your world-class analyzer is live.

---

*Built with precision for the Swedish real estate market.*
