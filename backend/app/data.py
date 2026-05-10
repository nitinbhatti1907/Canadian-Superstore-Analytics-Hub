from __future__ import annotations

import gc
import os
from functools import lru_cache
from typing import Optional

import pandas as pd

DEFAULT_DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "data",
    "SuperstoreDataset.csv",
)

# Only load the columns the API actually uses. This drops Customer Name,
# Country, Postal Code, Product ID, Ship Date, Row ID, and several unused
# numeric columns (Number of days, Unit Sales, Shipping Cost, etc.) — none
# of which are referenced anywhere in main.py, filters.py, or the frontend.
USECOLS = [
    "Order ID",
    "Order Date",
    "Ship Mode",
    "Customer ID",
    "Segment",
    "City",
    "State",
    "Region",
    "Category",
    "Sub-Category",
    "Product Name",
    "Sales",
    "Quantity",
    "Discount",
    "Profit",
    "Order Priority",
]

# Low-cardinality string columns become pandas Categorical to slash memory.
# Each value is stored as a small int code + one shared lookup table instead
# of a per-row Python string object (~50 bytes of heap overhead each).
CATEGORICAL_COLS = [
    "Ship Mode",
    "Segment",
    "City",
    "State",
    "Region",
    "Category",
    "Sub-Category",
    "Product Name",
    "Order Priority",
]

# Read these as compact numeric dtypes at load time.
# Quantity is float32 (not int16) because the CSV has NaN values which
# narrow integer dtypes can't represent. float32 still halves the default
# float64 footprint.
DTYPES = {
    "Sales": "float32",
    "Profit": "float32",
    "Discount": "float32",
    "Quantity": "float32",
}


@lru_cache(maxsize=1)
def load_dataset(path: Optional[str] = None) -> pd.DataFrame:
    """Load and normalize the Canadian Superstore dataset.

    Memory-conscious: only reads needed columns, uses categorical dtypes for
    repeating strings, and float32/int16 for numeric columns. The full 13MB
    CSV would otherwise expand to 200-400MB in a default-typed DataFrame
    (object-dtype strings dominate). With these settings it stays well under
    50MB, which fits comfortably in Render's 512MB free-tier instance.
    """
    data_path = path or os.environ.get("DATA_PATH") or DEFAULT_DATA_PATH

    # Sniff header to figure out which of our wanted columns are actually
    # present (keeps the loader resilient if the CSV evolves).
    header = pd.read_csv(data_path, encoding="utf-8-sig", nrows=0)
    available = {c.strip(): c for c in header.columns}
    cols_to_read = [available[c] for c in USECOLS if c in available]

    df = pd.read_csv(
        data_path,
        encoding="utf-8-sig",
        usecols=cols_to_read,
        dtype={available[k]: v for k, v in DTYPES.items() if k in available},
        parse_dates=[available["Order Date"]] if "Order Date" in available else None,
    )

    df.columns = [c.strip() for c in df.columns]

    # Convert string columns to categorical AFTER load so missing columns
    # don't blow up.
    for col in CATEGORICAL_COLS:
        if col in df.columns:
            df[col] = df[col].astype("string").str.strip().astype("category")

    # Order ID and Customer ID stay as plain strings — they have very high
    # cardinality (categorical wouldn't help) but they're identifiers so we
    # interned-strip them.
    for col in ("Order ID", "Customer ID"):
        if col in df.columns:
            df[col] = df[col].astype("string").str.strip()

    # Drop rows missing the most critical columns rather than carrying NaN
    # weight through every aggregation.
    df = df.dropna(subset=[c for c in ("Order Date", "Order ID") if c in df.columns])

    # Encourage the allocator to release any temporary buffers from the read.
    gc.collect()

    return df
