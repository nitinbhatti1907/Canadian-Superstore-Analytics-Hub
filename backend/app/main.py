from __future__ import annotations

from typing import Any, Dict, List, Optional

from itertools import combinations

import pandas as pd
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from .data import load_dataset
from .filters import apply_filters, safe_div

app = FastAPI(title="Canadian Superstore Dashboard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "https://canadian-superstore-frontend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _df_filtered(
    *,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    segment: Optional[str] = None,
    region: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    ship_mode: Optional[str] = None,
    order_priority: Optional[str] = None,
    min_discount: Optional[float] = None,
    max_discount: Optional[float] = None,
) -> pd.DataFrame:
    df = load_dataset()
    return apply_filters(
        df,
        start_date=start_date,
        end_date=end_date,
        category=category,
        sub_category=sub_category,
        segment=segment,
        region=region,
        state=state,
        city=city,
        ship_mode=ship_mode,
        order_priority=order_priority,
        min_discount=min_discount,
        max_discount=max_discount,
    )


@app.get("/api/meta")
def meta() -> Dict[str, Any]:
    df = load_dataset()

    min_date = df["Order Date"].min()
    max_date = df["Order Date"].max()

    def uniq(col: str) -> List[str]:
        return sorted([x for x in df[col].dropna().astype(str).unique().tolist() if x and x != "nan"])

    return {
        "date_min": None if pd.isna(min_date) else min_date.date().isoformat(),
        "date_max": None if pd.isna(max_date) else max_date.date().isoformat(),
        "categories": uniq("Category"),
        "sub_categories": uniq("Sub-Category"),
        "segments": uniq("Segment"),
        "regions": uniq("Region"),
        "states": uniq("State"),
        "cities": uniq("City"),
        "ship_modes": uniq("Ship Mode"),
        "order_priorities": uniq("Order Priority"),
    }


@app.get("/api/summary")
def summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    segment: Optional[str] = None,
    region: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    ship_mode: Optional[str] = None,
    order_priority: Optional[str] = None,
    min_discount: Optional[float] = None,
    max_discount: Optional[float] = None,
) -> Dict[str, Any]:
    dff = _df_filtered(
        start_date=start_date,
        end_date=end_date,
        category=category,
        sub_category=sub_category,
        segment=segment,
        region=region,
        state=state,
        city=city,
        ship_mode=ship_mode,
        order_priority=order_priority,
        min_discount=min_discount,
        max_discount=max_discount,
    )

    total_sales = float(dff["Sales"].sum(skipna=True))
    total_profit = float(dff["Profit"].sum(skipna=True))
    total_qty = int(dff["Quantity"].sum(skipna=True))
    orders = int(dff["Order ID"].nunique(dropna=True))
    customers = int(dff["Customer ID"].nunique(dropna=True))
    avg_discount = float(dff["Discount"].mean(skipna=True)) if len(dff) else 0.0
    profit_margin = safe_div(total_profit, total_sales)

    return {
        "rows": int(len(dff)),
        "orders": orders,
        "customers": customers,
        "total_sales": round(total_sales, 2),
        "total_profit": round(total_profit, 2),
        "profit_margin": round(profit_margin, 4),
        "total_quantity": total_qty,
        "avg_discount": round(avg_discount, 4),
    }


@app.get("/api/timeseries")
def timeseries(
    granularity: str = Query("month", pattern="^(day|week|month)$"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    segment: Optional[str] = None,
    region: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    ship_mode: Optional[str] = None,
    order_priority: Optional[str] = None,
    min_discount: Optional[float] = None,
    max_discount: Optional[float] = None,
) -> Dict[str, Any]:
    dff = _df_filtered(
        start_date=start_date,
        end_date=end_date,
        category=category,
        sub_category=sub_category,
        segment=segment,
        region=region,
        state=state,
        city=city,
        ship_mode=ship_mode,
        order_priority=order_priority,
        min_discount=min_discount,
        max_discount=max_discount,
    ).copy()

    if dff.empty:
        return {"granularity": granularity, "data": []}

    dff = dff.dropna(subset=["Order Date"]).set_index("Order Date").sort_index()

    rule = {"day": "D", "week": "W", "month": "MS"}[granularity]

    agg = dff.resample(rule).agg({"Sales": "sum", "Profit": "sum", "Quantity": "sum"}).reset_index()
    agg["date"] = agg["Order Date"].dt.date.astype(str)

    data = [
        {
            "date": row["date"],
            "sales": round(float(row["Sales"]), 2),
            "profit": round(float(row["Profit"]), 2),
            "quantity": int(row["Quantity"]),
        }
        for _, row in agg.iterrows()
    ]

    return {"granularity": granularity, "data": data}


@app.get("/api/category_breakdown")
def category_breakdown(
    level: str = Query("category", pattern="^(category|sub_category)$"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    segment: Optional[str] = None,
    region: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    ship_mode: Optional[str] = None,
    order_priority: Optional[str] = None,
    min_discount: Optional[float] = None,
    max_discount: Optional[float] = None,
) -> Dict[str, Any]:
    dff = _df_filtered(
        start_date=start_date,
        end_date=end_date,
        category=category,
        sub_category=sub_category,
        segment=segment,
        region=region,
        state=state,
        city=city,
        ship_mode=ship_mode,
        order_priority=order_priority,
        min_discount=min_discount,
        max_discount=max_discount,
    )

    if dff.empty:
        return {"level": level, "data": []}

    col = "Category" if level == "category" else "Sub-Category"
    agg = (
        dff.groupby(col, dropna=False)
        .agg(sales=("Sales", "sum"), profit=("Profit", "sum"), orders=("Order ID", "nunique"))
        .reset_index()
        .sort_values("sales", ascending=False)
    )

    data = [
        {
            "name": str(r[col]),
            "sales": round(float(r["sales"]), 2),
            "profit": round(float(r["profit"]), 2),
            "orders": int(r["orders"]),
        }
        for _, r in agg.iterrows()
    ]

    return {"level": level, "data": data}


@app.get("/api/region_breakdown")
def region_breakdown(
    level: str = Query("region", pattern="^(region|state|city)$"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    segment: Optional[str] = None,
    region: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    ship_mode: Optional[str] = None,
    order_priority: Optional[str] = None,
    min_discount: Optional[float] = None,
    max_discount: Optional[float] = None,
    top_n: int = 15,
) -> Dict[str, Any]:
    dff = _df_filtered(
        start_date=start_date,
        end_date=end_date,
        category=category,
        sub_category=sub_category,
        segment=segment,
        region=region,
        state=state,
        city=city,
        ship_mode=ship_mode,
        order_priority=order_priority,
        min_discount=min_discount,
        max_discount=max_discount,
    )

    if dff.empty:
        return {"level": level, "data": []}

    col = {"region": "Region", "state": "State", "city": "City"}[level]

    agg = (
        dff.groupby(col, dropna=False)
        .agg(sales=("Sales", "sum"), profit=("Profit", "sum"), orders=("Order ID", "nunique"))
        .reset_index()
        .sort_values("sales", ascending=False)
        .head(max(1, min(top_n, 50)))
    )

    data = [
        {
            "name": str(r[col]),
            "sales": round(float(r["sales"]), 2),
            "profit": round(float(r["profit"]), 2),
            "orders": int(r["orders"]),
        }
        for _, r in agg.iterrows()
    ]

    return {"level": level, "data": data}


@app.get("/api/top_products")
def top_products(
    metric: str = Query("sales", pattern="^(sales|profit)$"),
    top_n: int = 10,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    segment: Optional[str] = None,
    region: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    ship_mode: Optional[str] = None,
    order_priority: Optional[str] = None,
    min_discount: Optional[float] = None,
    max_discount: Optional[float] = None,
) -> Dict[str, Any]:
    dff = _df_filtered(
        start_date=start_date,
        end_date=end_date,
        category=category,
        sub_category=sub_category,
        segment=segment,
        region=region,
        state=state,
        city=city,
        ship_mode=ship_mode,
        order_priority=order_priority,
        min_discount=min_discount,
        max_discount=max_discount,
    )

    if dff.empty:
        return {"metric": metric, "data": []}

    agg = (
        dff.groupby(["Product Name"], dropna=False)
        .agg(sales=("Sales", "sum"), profit=("Profit", "sum"), quantity=("Quantity", "sum"))
        .reset_index()
    )

    sort_col = "sales" if metric == "sales" else "profit"
    agg = agg.sort_values(sort_col, ascending=False).head(max(1, min(top_n, 50)))

    data = [
        {
            "name": str(r["Product Name"])[:60],
            "sales": round(float(r["sales"]), 2),
            "profit": round(float(r["profit"]), 2),
            "quantity": int(r["quantity"]),
        }
        for _, r in agg.iterrows()
    ]

    return {"metric": metric, "data": data}


@app.get("/api/discount_impact")
def discount_impact(
    bins: int = 8,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    segment: Optional[str] = None,
    region: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    ship_mode: Optional[str] = None,
    order_priority: Optional[str] = None,
) -> Dict[str, Any]:
    dff = _df_filtered(
        start_date=start_date,
        end_date=end_date,
        category=category,
        sub_category=sub_category,
        segment=segment,
        region=region,
        state=state,
        city=city,
        ship_mode=ship_mode,
        order_priority=order_priority,
    )

    if dff.empty:
        return {"data": []}

    # Profit margin per row
    dff = dff.copy()
    dff["profit_margin_row"] = dff.apply(lambda r: safe_div(r["Profit"], r["Sales"]) if pd.notna(r["Sales"]) else 0.0, axis=1)

    # Bin by discount
    bins = max(3, min(int(bins), 20))
    dff["disc_bin"] = pd.cut(dff["Discount"].fillna(0), bins=bins)

    agg = (
        dff.groupby("disc_bin", dropna=False)
        .agg(
            sales=("Sales", "sum"),
            profit=("Profit", "sum"),
            avg_margin=("profit_margin_row", "mean"),
            rows=("Row ID", "count"),
        )
        .reset_index()
    )

    def label(interval: Any) -> str:
        try:
            left = float(interval.left)
            right = float(interval.right)
            return f"{left:.2f} - {right:.2f}"
        except Exception:
            return str(interval)

    data = [
        {
            "discount_range": label(r["disc_bin"]),
            "sales": round(float(r["sales"]), 2),
            "profit": round(float(r["profit"]), 2),
            "avg_margin": round(float(r["avg_margin"]), 4),
            "rows": int(r["rows"]),
        }
        for _, r in agg.iterrows()
    ]

    return {"data": data}


@app.get("/api/rows")
def rows(
    limit: int = 50,
    offset: int = 0,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    segment: Optional[str] = None,
    region: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    ship_mode: Optional[str] = None,
    order_priority: Optional[str] = None,
    min_discount: Optional[float] = None,
    max_discount: Optional[float] = None,
) -> Dict[str, Any]:
    limit = max(10, min(int(limit), 200))
    offset = max(0, int(offset))

    dff = _df_filtered(
        start_date=start_date,
        end_date=end_date,
        category=category,
        sub_category=sub_category,
        segment=segment,
        region=region,
        state=state,
        city=city,
        ship_mode=ship_mode,
        order_priority=order_priority,
        min_discount=min_discount,
        max_discount=max_discount,
    )

    total = int(len(dff))
    page = dff.sort_values("Order Date", ascending=False).iloc[offset : offset + limit]

    cols = [
        "Order Date",
        "Order ID",
        "Customer ID",
        "Segment",
        "City",
        "State",
        "Region",
        "Category",
        "Sub-Category",
        "Product Name",
        "Sales",
        "Discount",
        "Profit",
        "Quantity",
    ]
    cols = [c for c in cols if c in page.columns]

    # Serialize
    items: List[Dict[str, Any]] = []
    for _, r in page[cols].iterrows():
        item = {}
        for c in cols:
            v = r[c]
            if c == "Order Date" and pd.notna(v):
                item["Order Date"] = v.date().isoformat()
            elif isinstance(v, (float, int)) and pd.notna(v):
                item[c] = float(v) if c in ["Sales", "Profit", "Discount"] else int(v) if c == "Quantity" else float(v)
            else:
                item[c] = None if pd.isna(v) else str(v)
        items.append(item)

    return {"total": total, "limit": limit, "offset": offset, "items": items}


@app.get("/api/rfm_segments")
def rfm_segments(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    segment: Optional[str] = None,
    region: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    ship_mode: Optional[str] = None,
    order_priority: Optional[str] = None,
    min_discount: Optional[float] = None,
    max_discount: Optional[float] = None,
) -> Dict[str, Any]:
    """Simple RFM-style customer segmentation (quantile-based)."""

    dff = _df_filtered(
        start_date=start_date,
        end_date=end_date,
        category=category,
        sub_category=sub_category,
        segment=segment,
        region=region,
        state=state,
        city=city,
        ship_mode=ship_mode,
        order_priority=order_priority,
        min_discount=min_discount,
        max_discount=max_discount,
    )

    if dff.empty:
        return {"data": []}

    dff = dff.dropna(subset=["Order Date", "Customer ID", "Order ID"]).copy()
    if dff.empty:
        return {"data": []}

    ref_date = dff["Order Date"].max() + pd.Timedelta(days=1)

    cust = (
        dff.groupby("Customer ID")
        .agg(
            last_order=("Order Date", "max"),
            frequency=("Order ID", "nunique"),
            monetary=("Sales", "sum"),
            profit=("Profit", "sum"),
        )
        .reset_index()
    )
    cust["recency_days"] = (ref_date - cust["last_order"]).dt.days

    def qscore(series: pd.Series, invert: bool = False) -> pd.Series:
        s = series.copy()
        if s.nunique(dropna=True) < 4:
            r = s.rank(method="average", ascending=not invert)
            return pd.cut(r, bins=4, labels=[1, 2, 3, 4]).astype(int)
        try:
            out = pd.qcut(s, q=4, labels=[1, 2, 3, 4], duplicates="drop").astype(int)
            return out if not invert else (5 - out)
        except Exception:
            r = s.rank(method="average", ascending=not invert)
            return pd.cut(r, bins=4, labels=[1, 2, 3, 4]).astype(int)

    # For recency: smaller recency_days means more recent => higher score
    cust["r"] = qscore(cust["recency_days"], invert=True)
    cust["f"] = qscore(cust["frequency"], invert=False)
    cust["m"] = qscore(cust["monetary"], invert=False)

    def label(row: pd.Series) -> str:
        r, f, m = int(row["r"]), int(row["f"]), int(row["m"])
        if r >= 3 and f >= 3 and m >= 3:
            return "Champions"
        if f >= 3 and r >= 2:
            return "Loyal"
        if m >= 3 and r >= 2:
            return "Big Spenders"
        if r == 4 and f == 1:
            return "New"
        if r == 1 and (f >= 3 or m >= 3):
            return "At Risk"
        return "Others"

    cust["rfm_segment"] = cust.apply(label, axis=1)

    seg = (
        cust.groupby("rfm_segment")
        .agg(customers=("Customer ID", "count"), sales=("monetary", "sum"), profit=("profit", "sum"))
        .reset_index()
        .sort_values("customers", ascending=False)
    )

    data = [
        {
            "segment": str(r["rfm_segment"]),
            "customers": int(r["customers"]),
            "sales": round(float(r["sales"]), 2),
            "profit": round(float(r["profit"]), 2),
        }
        for _, r in seg.iterrows()
    ]
    return {"data": data}


@app.get("/api/basket_pairs")
def basket_pairs(
    top_n: int = 15,
    top_products: int = 200,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    segment: Optional[str] = None,
    region: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    ship_mode: Optional[str] = None,
    order_priority: Optional[str] = None,
    min_discount: Optional[float] = None,
    max_discount: Optional[float] = None,
) -> Dict[str, Any]:
    """Top product pairs purchased together (simple market-basket)."""

    dff = _df_filtered(
        start_date=start_date,
        end_date=end_date,
        category=category,
        sub_category=sub_category,
        segment=segment,
        region=region,
        state=state,
        city=city,
        ship_mode=ship_mode,
        order_priority=order_priority,
        min_discount=min_discount,
        max_discount=max_discount,
    )

    if dff.empty:
        return {"data": []}

    dff = dff.dropna(subset=["Order ID", "Product Name"]).copy()
    if dff.empty:
        return {"data": []}

    top_n = max(5, min(int(top_n), 50))
    top_products = max(50, min(int(top_products), 500))

    freq = dff["Product Name"].value_counts().head(top_products)
    keep = set(freq.index.tolist())
    dff = dff[dff["Product Name"].isin(keep)]

    pair_counts: Dict[tuple, int] = {}
    grouped = dff.groupby("Order ID")["Product Name"].apply(lambda s: sorted(set(s.tolist())))

    for items in grouped:
        if len(items) < 2:
            continue
        if len(items) > 30:
            items = items[:30]
        for a, b in combinations(items, 2):
            key = (a, b)
            pair_counts[key] = pair_counts.get(key, 0) + 1

    top = sorted(pair_counts.items(), key=lambda kv: kv[1], reverse=True)[:top_n]
    data = [
        {"product_a": k[0], "product_b": k[1], "count": int(v)}
        for (k, v) in top
    ]

    return {"data": data}
