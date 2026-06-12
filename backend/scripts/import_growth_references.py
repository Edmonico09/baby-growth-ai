"""
Import WHO growth reference CSV files into the database.

Usage:
    python scripts/import_growth_references.py

Reads all CSV files from ../data/growth_reference/ and populates the
growth_ref_weight_age, growth_ref_length_age, growth_ref_weight_length,
and growth_ref_head_age tables.

Idempotent: safe to re-run (truncates and re-imports).
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine
from app.models import (
    Base,
    GrowthRefWeightAge,
    GrowthRefLengthAge,
    GrowthRefWeightLength,
    GrowthRefHeadAge,
)

DATA_DIR = Path(__file__).parent.parent.parent / "data" / "growth_reference"

FILE_MAP = {
    "WHO-Boys-Weight-for-age-Percentiles.csv": (GrowthRefWeightAge, "male"),
    "WHO-Girls-Weight-for-age-Percentiles.csv": (GrowthRefWeightAge, "female"),
    "WHO-Boys-Length-for-age-Percentiles.csv": (GrowthRefLengthAge, "male"),
    "WHO-Girls-Length-for-age-Percentiles.csv": (GrowthRefLengthAge, "female"),
    "WHO-Boys-Weight-for-length-Percentiles.csv": (GrowthRefWeightLength, "male"),
    "WHO-Girls-Weight-for-length-Percentiles.csv": (GrowthRefWeightLength, "female"),
    "WHO-Boys-Head-Circumference-for-age-Percentiles.csv": (GrowthRefHeadAge, "male"),
    "WHO-Girls-Head-Circumference-for-age-Percentiles.csv": (GrowthRefHeadAge, "female"),
}

PERCENTILE_COLUMNS = [
    "2nd (2.3rd)", "5th", "10th", "25th", "50th", "75th", "90th", "95th", "98th (97.7th)"
]


def parse_csv(filepath: Path) -> pd.DataFrame:
    df = pd.read_csv(filepath, encoding="utf-8-sig")
    df.columns = df.columns.str.strip()
    return df


def clean_percentile_name(name: str) -> str:
    return name.replace(" ", "_").replace("(", "").replace(")", "").replace(".", "_")


def normalize_df(df: pd.DataFrame, model_class, sex: str) -> list[dict]:
    rows = []
    has_month = "Month" in df.columns
    for _, row in df.iterrows():
        record = {
            "sex": sex,
            "L": float(row["L"]),
            "M": float(row["M"]),
            "S": float(row["S"]),
        }
        if has_month:
            record["age_months"] = float(row["Month"])
        else:
            record["length_cm"] = float(row["Length"])
        percentiles = {}
        for col in PERCENTILE_COLUMNS:
            if col in row and pd.notna(row[col]):
                clean_name = clean_percentile_name(col)
                percentiles[clean_name] = float(row[col])
        record["percentiles"] = percentiles
        rows.append(record)
    return rows


def import_table(db: Session, model_class, rows: list[dict]):
    db.query(model_class).delete()
    for row in rows:
        obj = model_class(**row)
        db.add(obj)
    db.commit()


def main():
    print(f"Reading growth reference files from: {DATA_DIR}")

    if not DATA_DIR.exists():
        print(f"ERROR: Directory not found: {DATA_DIR}")
        sys.exit(1)

    stats = {}

    for filename, (model_class, sex) in FILE_MAP.items():
        filepath = DATA_DIR / filename
        if not filepath.exists():
            print(f"  SKIP {filename} (not found)")
            continue

        print(f"  Processing {filename} ({sex})...")
        df = parse_csv(filepath)
        rows = normalize_df(df, model_class, sex)
        import_table(SessionLocal(), model_class, rows)
        stats[filename] = len(rows)
        print(f"    -> imported {len(rows)} rows")

    print("\nImport complete!")
    for f, count in stats.items():
        print(f"  {f}: {count} rows")


if __name__ == "__main__":
    main()
