from __future__ import annotations

import os
from functools import lru_cache
from typing import Optional

import pandas as pd

DEFAULT_DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "data",
    "SuperstoreDataset.csv",
)


@lru_cache(maxsize=1)
def load_dataset(path: Optional[str] = None) -> pd.DataFrame:
    """Load and normalize the Canadian Superstore dataset.

    Notes:
    - Uses utf-8-sig because the file has a BOM.
    - Parses dates.
    - Ensures numeric columns are numeric.
    """
    data_path = path or os.environ.get("DATA_PATH") or DEFAULT_DATA_PATH

    df = pd.read_csv(data_path, encoding="utf-8-sig")

    # Normalize column names (keep original for output, but make internal access easy)
    df.columns = [c.strip() for c in df.columns]

    # Parse dates
    for col in ["Order Date", "Ship Date"]:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce")

    # Ensure numeric
    num_cols = [
        "Sales",
        "Quantity",
        "Unit Sales",
        "Discount",
        "Profit",
        "Shipping Cost",
        "Unit shipping cost",
        "Profit_per_unit",
        "unit cost",
        "Number of days",
    ]
    for col in num_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Clean string columns
    str_cols = [
        "Order ID",
        "Ship Mode",
        "Customer ID",
        "Customer Name",
        "Segment",
        "City",
        "State",
        "Country",
        "Region",
        "Product ID",
        "Category",
        "Sub-Category",
        "Product Name",
        "Order Priority",
    ]
    for col in str_cols:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()

    return df
