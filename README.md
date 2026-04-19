# 🛒 Canadian Superstore Analytics Hub

> **A full-stack sales analytics dashboard for the Canadian Superstore dataset — built with React + FastAPI to explore sales, profit, customer segmentation, and market basket patterns through interactive charts and filters.**

[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Pandas-teal?style=for-the-badge&logo=fastapi)](#)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue?style=for-the-badge&logo=react)](#)
[![Charts](https://img.shields.io/badge/Charts-Recharts-orange?style=for-the-badge)](#)
[![Dataset](https://img.shields.io/badge/Dataset-Canadian%20Superstore%20CSV-green?style=for-the-badge)](#)

---

## 👋 Hey, Welcome!

I'm **Nitin**, and I built this Canadian Superstore Analytics Hub as a hands-on data analytics project to explore what a production-style sales dashboard actually looks like when you wire a real dataset to a real API with a real frontend.

The dataset is a Canadian Superstore sales CSV with orders across multiple regions, categories, customer segments, and ship modes. I wanted a dashboard that goes beyond simple bar charts — something that includes market basket analysis, RFM-style customer segmentation, discount impact curves, and granular filters that actually work across every visualization at once.

The result is a single-page dashboard with **9 chart types**, **8 filter dimensions**, and a **paginated data table** — all powered by a FastAPI + Pandas backend doing the aggregation server-side.

---

## 📸 What You Get

Open the dashboard and you get a complete analytical view of the Canadian Superstore dataset:

- 🎛️ **8 filter controls** — date range, category, sub-category, segment, region, province, ship mode, discount range
- 📊 **6 KPI cards** — Sales, Profit, Profit Margin %, Orders, Unique Customers, Avg Discount
- 📈 **9 visualization panels** — trends, breakdowns, top products, discount analysis, segmentation, market basket
- 📋 **Paginated data table** — browse raw order rows with current filter applied
- ⚡ **All filters apply globally** — every chart and KPI updates when you change any filter

---

## ✨ Dashboard Features

### 🎛️ **Filter Panel**

Every filter applies to every chart and KPI simultaneously:

| Filter | Values |
|:-------|:-------|
| **Date Range** | Order date start / end (calendar picker) |
| **Category** | Furniture / Office Supplies / Technology |
| **Sub-Category** | Chairs, Phones, Binders, etc. |
| **Segment** | Consumer / Corporate / Home Office |
| **Region** | West / East / Central / South |
| **Province** | All Canadian provinces in the dataset |
| **Ship Mode** | Standard Class / Second Class / First Class / Same Day |
| **Discount Range** | Min / max discount percentage slider |

### 📊 **KPI Cards**

Six summary metrics calculated from the filtered dataset:

| KPI | Description |
|:----|:------------|
| 💰 **Total Sales** | Sum of all sales in the filtered view |
| 📈 **Total Profit** | Sum of all profit in the filtered view |
| 📉 **Profit Margin %** | Profit ÷ Sales × 100 |
| 📦 **Total Orders** | Count of unique order IDs |
| 👥 **Unique Customers** | Count of distinct customer IDs |
| 🏷️ **Avg Discount** | Mean discount rate across filtered rows |

### 📈 **Visualization Panels**

| # | Chart | Description |
|:-:|:------|:------------|
| 1 | 📅 **Sales & Profit Trend** | Monthly time-series line chart for sales and profit |
| 2 | 🗂️ **Category Breakdown** | Grouped bar chart: sales + profit by product category |
| 3 | 🌍 **Region Breakdown** | Horizontal bar chart of top regions by sales |
| 4 | 🏆 **Top Products** | Bar chart of top N products ranked by sales |
| 5 | 🏷️ **Discount Impact** | Scatter/bin chart showing how discount level affects profit |
| 6 | 👥 **Customer Segmentation** | RFM-style breakdown: Consumer vs Corporate vs Home Office |
| 7 | 🛍️ **Market Basket** | Top co-purchased product pairs within the same order |
| 8 | 📦 **Ship Mode Distribution** | Pie/bar of orders by shipping class |
| 9 | 📋 **Raw Data Table** | Paginated order-level table with current filters applied |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│              Browser (Client)                │
│                                              │
│  React 18 + TypeScript + Vite               │
│  Recharts — all chart components            │
│  Tailwind CSS — utility styling             │
│                                              │
│  fetch() calls with filter query params ──┐ │
└──────────────────────────────────────────┼─┘
                                           │
                        HTTP (REST + JSON) │
                                           ▼
┌──────────────────────────────────────────────┐
│              FastAPI Backend                  │
│                                              │
│  /api/meta      ── filter options metadata   │
│  /api/summary   ── KPI aggregations          │
│  /api/trend     ── monthly time series       │
│  /api/category  ── category breakdown        │
│  /api/region    ── region breakdown          │
│  /api/products  ── top products              │
│  /api/discount  ── discount impact bins      │
│  /api/segment   ── customer segmentation     │
│  /api/basket    ── market basket pairs       │
│  /api/rows      ── paginated raw data        │
│                                              │
│  Pandas — all aggregation + filtering        │
│  CSV loaded once into memory at startup     │
└──────────────────────────────────────────────┘
```

The backend loads the CSV **once at startup** into a Pandas DataFrame. Every API request filters that DataFrame using Pandas query operations and returns aggregated JSON. No database required.

---

## 🛠️ Tech Stack

### Frontend

| Technology | Role |
|:-----------|:-----|
| **React 18** | Component-based UI |
| **TypeScript** | Type-safe component and API integration |
| **Vite** | Fast build tool + dev server |
| **Recharts** | All chart visualizations |
| **Tailwind CSS** | Utility-first styling |

### Backend

| Technology | Role |
|:-----------|:-----|
| **FastAPI 0.115** | REST API framework |
| **Pandas 2.2** | Data loading, filtering, and aggregation |
| **Uvicorn** | ASGI server |
| **python-dateutil** | Date parsing utilities |

---

## 📁 Project Structure

```
Canadian-Superstore-Analytics-Hub/
│
├── data/
│   └── SuperstoreDataset.csv     # The source dataset (Canada orders)
│
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app + all API routes
│   │   └── ...                   # Data loading, filter helpers
│   ├── requirements.txt          # fastapi, uvicorn, pandas, python-dateutil
│   └── package.json              # (if using Node for any backend tooling)
│
└── frontend/
    ├── src/
    │   ├── components/           # Chart components (Trend, Category, Basket, ...)
    │   ├── pages/                # Dashboard page layout
    │   └── main.tsx              # App entry point
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites
- **Python** 3.10+
- **Node.js** 18+
- **pip**

### 1. Backend Setup (FastAPI + Pandas)

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # macOS/Linux
# .venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Start the backend
uvicorn app.main:app --reload --port 8000
```

Backend runs at: **http://localhost:8000**

Verify it's working:
- `http://localhost:8000/api/meta` → filter metadata
- `http://localhost:8000/api/summary` → KPI totals
- `http://localhost:8000/docs` → Swagger UI

### 2. Frontend Setup (React + TypeScript)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

### 3. Custom Backend URL (Optional)

If your backend runs on a different port or host, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

---

## 📂 Dataset Notes

- **Default path:** `data/SuperstoreDataset.csv` (relative to the project root)
- **Override path:** Set the `DATA_PATH` environment variable to an absolute path

```bash
DATA_PATH=/absolute/path/to/your/SuperstoreDataset.csv uvicorn app.main:app --reload
```

**Required CSV columns** (must match exactly if you swap the dataset):

```
Order ID, Order Date, Ship Date, Ship Mode, Customer ID, Customer Name,
Segment, Country, City, State, Postal Code, Region, Product ID,
Category, Sub-Category, Product Name, Sales, Quantity, Discount, Profit,
Order Priority
```

The `State` column contains Canadian province names (despite the column header).

---

## 🔍 Sample API Calls

```bash
# Get KPI summary with filters
curl "http://localhost:8000/api/summary?category=Technology&region=West"

# Get monthly trend for a date range
curl "http://localhost:8000/api/trend?start=2022-01-01&end=2023-12-31"

# Get top 10 products by sales
curl "http://localhost:8000/api/products?limit=10&segment=Consumer"

# Get market basket pairs
curl "http://localhost:8000/api/basket?min_support=2"

# Get paginated raw rows
curl "http://localhost:8000/api/rows?page=1&page_size=25&category=Furniture"
```

---

## 🌐 Browser Support

| Browser | Supported? |
|:--------|:----------:|
| **Chrome** | ✅ |
| **Firefox** | ✅ |
| **Edge** | ✅ |
| **Safari** | ✅ |
| **Mobile** | ✅ (responsive layout) |

---

## ⚠️ Known Limitations

| Limitation | Notes |
|:-----------|:------|
| 🐘 CSV loaded into memory | The entire CSV loads at startup. Fine for this dataset size (~10K rows), but not scalable to millions of rows without a real DB |
| 🔄 No real-time updates | Data is static — refreshing the backend is required to pick up a new CSV |
| 🗄️ No persistent storage | No user accounts, saved filters, or export history — everything is session-based |
| 🐌 Large filter combinations | Complex market basket queries on large datasets may be slow without query optimization |

---

## 🗺️ Roadmap / Future Improvements

- 🗄️ **PostgreSQL backend** — replace CSV + Pandas with a proper database for production scale
- 📤 **CSV/Excel export** — export filtered data or chart data as a downloadable file
- 🔐 **User accounts** — save filter presets and bookmark views
- 🤖 **AI insights** — integrate an LLM to surface natural-language observations ("Profit margins dropped 12% in Q3 — driven by high discounts in Furniture")
- 📅 **Year-over-year comparison** — overlay two time periods on the trend chart
- 🗺️ **Map visualization** — province-level choropleth for regional sales
- 📱 **Mobile-first redesign** — the current layout prioritizes desktop
- 🐳 **Docker + docker-compose** — one-command local setup

---

## 🤝 Contributing

Want to extend this dashboard? Great starting points:

- Add a new API route + matching frontend chart component
- Swap the CSV loading for a SQLite/PostgreSQL backend
- Add unit tests for the Pandas aggregation functions
- Build a proper CI/CD pipeline

Open an issue or submit a PR — always happy to review! 😄

---

## 👤 Author

**Nitin Bhatti**

---

## 📜 License

Open source — for educational and portfolio use. Feel free to fork, extend, and adapt this for your own analytics projects.

📂 **Repo:** [github.com/nitinbhatti1907/canadian-superstore-analytics-hub](https://github.com/nitinbhatti1907/canadian-superstore-analytics-hub)
