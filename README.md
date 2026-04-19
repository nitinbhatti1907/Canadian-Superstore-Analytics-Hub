# Canadian Superstore Analytics Hub

An interactive sales analytics dashboard built on the Canadian Superstore dataset. Filter by date, region, category, and segment — every chart and KPI updates live.

---

## 🚀 Live

| Service | URL | Hosted on |
|---------|-----|-----------|
| **Dashboard (Frontend)** | [canadian-superstore-analytics-hub.netlify.app](https://canadian-superstore-analytics-hub.netlify.app) | Netlify |
| **Data API (Backend)** | [canadian-superstore-analytics-hub.onrender.com](https://canadian-superstore-analytics-hub.onrender.com) | Render |

> The frontend (React/Vite) is deployed on Netlify. The backend (FastAPI/Pandas) runs as a separate service on Render. The frontend calls the Render API at runtime.

---

## What questions can you answer with this dashboard?

- Which Canadian region drives the most profit — and which one discounts the most?
- How did sales trend month-over-month in 2022 vs 2023?
- Which sub-categories have positive margin vs. which are being sold at a loss?
- What product pairs are most often ordered together?
- How does discount level correlate with profitability across categories?
- Which customer segment (Consumer / Corporate / Home Office) is most valuable by RFM?

---

## Dashboard panels

```
┌─────────────────────────────────────────────────────────────────────┐
│  FILTERS  Date range · Category · Sub-Category · Segment ·          │
│           Region · Province · Ship Mode · Discount range            │
├────────────┬────────────┬────────────┬────────────┬─────────────────┤
│  Sales     │  Profit    │  Margin %  │  Orders    │  Customers      │
│  $2.4M     │  $286K     │  12.1%     │  5,009     │  793            │
├─────────────────────────────────┬───────────────────────────────────┤
│  Sales & Profit Trend (monthly) │  Category Breakdown               │
├─────────────────────────────────┼───────────────────────────────────┤
│  Region Breakdown               │  Top Products by Sales            │
├─────────────────────────────────┼───────────────────────────────────┤
│  Discount Impact (binned)       │  Customer Segmentation (RFM)      │
├─────────────────────────────────┴───────────────────────────────────┤
│  Market Basket — Top Co-Purchased Product Pairs                     │
├─────────────────────────────────────────────────────────────────────┤
│  Raw Data Table (paginated, all filters applied)                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Architecture

This project uses a **split deployment** — frontend and backend are separate services.

```
Netlify (static)              Render (web service)
─────────────────             ──────────────────────────
React + TypeScript            FastAPI + Pandas
Vite build output   ──────►   /api/* endpoints
                   fetch()    CSV loaded into memory
                              on startup
```

The backend loads `SuperstoreDataset.csv` once into a Pandas DataFrame at startup. Every API call applies filters as Pandas query operations and returns aggregated JSON — no database, no ORM.

---

## Local setup

**Requirements:** Python 3.10+ · Node.js 18+

### 1. Start the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Verify at:
- `http://localhost:8000/api/meta` — filter options
- `http://localhost:8000/api/summary` — KPI totals
- `http://localhost:8000/docs` — Swagger UI

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

If your backend runs on a different host, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

### Custom dataset path

```bash
DATA_PATH=/absolute/path/to/SuperstoreDataset.csv uvicorn app.main:app --reload
```

---

## Dataset

**File:** `data/SuperstoreDataset.csv` — Canadian Superstore orders.

Required column names (must match if you swap the CSV):

```
Order ID        Order Date      Ship Date       Ship Mode
Customer ID     Customer Name   Segment         Country
City            State           Postal Code     Region
Product ID      Category        Sub-Category    Product Name
Sales           Quantity        Discount        Profit
Order Priority
```

> The `State` column contains Canadian province names (the column name is a legacy artefact from the original Superstore dataset structure).

---

## API reference

| Endpoint | Key query params | Returns |
|----------|------------------|---------|
| `GET /api/meta` | — | All unique filter values (categories, regions, provinces…) |
| `GET /api/summary` | any filter | Sales, profit, margin, orders, customers, avg discount |
| `GET /api/trend` | `start`, `end` + filters | Monthly sales + profit time series |
| `GET /api/category` | filters | Sales + profit grouped by category / sub-category |
| `GET /api/region` | filters | Top regions by sales |
| `GET /api/products` | `limit`, filters | Top N products by sales |
| `GET /api/discount` | filters | Profit by discount bin |
| `GET /api/segment` | filters | Sales + profit by customer segment |
| `GET /api/basket` | `min_support`, filters | Top co-purchased product pairs |
| `GET /api/rows` | `page`, `page_size`, filters | Paginated raw order rows |

All filter params: `start`, `end`, `category`, `sub_category`, `segment`, `region`, `province`, `ship_mode`, `discount_min`, `discount_max`

---

## Project structure

```
Canadian-Superstore-Analytics-Hub/
├── data/
│   └── SuperstoreDataset.csv
├── backend/
│   ├── requirements.txt          # fastapi, uvicorn, pandas, python-dateutil
│   └── app/
│       └── main.py               # All routes + Pandas aggregation logic
└── frontend/
    ├── tsconfig.json
    ├── vite.config.ts
    ├── package.json
    └── src/
        ├── components/           # Trend, Category, Region, Basket, Discount…
        ├── pages/                # Dashboard layout
        └── main.tsx
```

---

## Deploying your own copy

### Backend → Render

1. Create a **Web Service** on [render.com](https://render.com)
2. Build command: `pip install -r backend/requirements.txt`
3. Start command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4. Upload `data/SuperstoreDataset.csv` or set `DATA_PATH` env variable

### Frontend → Netlify

1. Push repo to GitHub
2. Connect to [netlify.com](https://netlify.com)
3. Build command: `npm run build`
4. Publish directory: `frontend/dist`
5. Set env variable: `VITE_API_URL=https://your-render-service.onrender.com`

---

## Tech stack

**Frontend:** React 18 · TypeScript · Vite · Recharts · Tailwind CSS

**Backend:** FastAPI 0.115 · Pandas 2.2 · Uvicorn · python-dateutil

---

## Limitations & next steps

**Current limitations:**
- Entire CSV is held in memory — fine at ~10K rows, but won't scale to millions without a real database
- No user accounts or saved filter states — everything resets on page reload
- Market basket analysis is O(n²) on order pairs — slow on large unfiltered datasets

**Planned improvements:**
- PostgreSQL backend with proper indexing
- Saved filter presets per user
- Year-over-year comparison overlay on trend chart
- Province-level choropleth map
- CSV/Excel export for filtered data
- Natural language insights via LLM ("Profit dropped 18% in Q3 — high Furniture discounts are the driver")

---

*Built by **Nitin Bhatti** — [github.com/nitinbhatti1907](https://github.com/nitinbhatti1907)*
