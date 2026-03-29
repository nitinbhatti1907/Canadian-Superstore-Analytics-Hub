# Canadian Superstore Sales Dashboard (React + Python)

This project builds a full dashboard (filters + KPIs + charts + table) using:
- **Backend:** FastAPI + Pandas
- **Frontend:** React (Vite) + Recharts
- **Dataset:** `data/SuperstoreDataset.csv` (Canada only)

## 1) Run the Backend (FastAPI)

### Prereqs
- Python 3.10+ recommended

### Steps
```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend will run at: `http://localhost:8000`

Test quickly:
- `http://localhost:8000/api/meta`
- `http://localhost:8000/api/summary`

## 2) Run the Frontend (React)

### Prereqs
- Node.js 18+ recommended

### Steps
```bash
cd frontend
npm install
npm run dev
```

Frontend will run at: `http://localhost:5173`

### API URL (optional)
By default the UI calls `http://localhost:8000`.
If your backend runs somewhere else, create `frontend/.env`:
```bash
VITE_API_URL=http://localhost:8000
```

## Filters Supported
- Date range (Order Date)
- Category / Sub-Category
- Segment
- Region
- Province (dataset column is `State`)
- Ship Mode
- Order Priority
- Discount min/max

## Dashboard Pages
Single-page dashboard that includes:
- KPI cards (Sales, Profit, Profit Margin, Orders, Customers, Avg Discount)
- Sales/Profit trend (monthly)
- Category breakdown (sales/profit)
- Region breakdown (top regions)
- Top products by sales
- Discount impact chart (binned)
- Customer segmentation (RFM-style)
- Market basket: top product pairs (within same order)
- Paginated row table (recent rows)

## Notes
- If you replace the dataset, keep the same column names.
- Dataset path can be overridden:
  - set environment variable `DATA_PATH=/absolute/path/to/SuperstoreDataset.csv`

