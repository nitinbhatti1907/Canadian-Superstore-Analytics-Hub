from __future__ import annotations

from typing import Dict, List, Optional, Tuple

import pandas as pd


def _split_csv_param(value: Optional[str]) -> Optional[List[str]]:
    if value is None:
        return None
    value = value.strip()
    if not value:
        return None
    return [v.strip() for v in value.split(",") if v.strip()]


def apply_filters(
    df: pd.DataFrame,
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
    """Filter dataframe using query params.

    Multi-select params are passed as comma-separated values.
    Dates are ISO (YYYY-MM-DD) or any pandas-parsable string.
    """

    dff = df

    # Dates
    if start_date:
        sd = pd.to_datetime(start_date, errors="coerce")
        if not pd.isna(sd):
            dff = dff[dff["Order Date"] >= sd]

    if end_date:
        ed = pd.to_datetime(end_date, errors="coerce")
        if not pd.isna(ed):
            # inclusive end date
            dff = dff[dff["Order Date"] <= ed]

    # Categorical filters
    mapping = {
        "Category": _split_csv_param(category),
        "Sub-Category": _split_csv_param(sub_category),
        "Segment": _split_csv_param(segment),
        "Region": _split_csv_param(region),
        "State": _split_csv_param(state),
        "City": _split_csv_param(city),
        "Ship Mode": _split_csv_param(ship_mode),
        "Order Priority": _split_csv_param(order_priority),
    }

    for col, values in mapping.items():
        if values:
            dff = dff[dff[col].isin(values)]

    # Discount range
    if min_discount is not None:
        dff = dff[dff["Discount"] >= float(min_discount)]
    if max_discount is not None:
        dff = dff[dff["Discount"] <= float(max_discount)]

    return dff


def safe_div(numer: float, denom: float) -> float:
    if denom == 0:
        return 0.0
    return float(numer) / float(denom)
