"""
Transform growth_records into a supervised ML dataset (sliding window).

Usage:
    python scripts/generate_training_dataset.py

Output: backend/training_growth_dataset.csv
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Child, GrowthRecord
from app.services.growth_analysis_service import compute_age_months

OUTPUT = Path(__file__).parent.parent / "training_growth_dataset.csv"


def build_dataset(db: Session) -> pd.DataFrame:
    children = db.query(Child).all()
    rows = []

    for ci, child in enumerate(children):
        if ci > 0 and ci % 100 == 0:
            print(f"  Processing child {ci}/{len(children)}...")

        records = (
            db.query(GrowthRecord)
            .filter(GrowthRecord.child_id == child.id)
            .order_by(GrowthRecord.date.asc())
            .all()
        )
        if len(records) < 2:
            continue

        for i in range(len(records) - 1):
            current = records[i]
            target = records[i + 1]

            age_months = compute_age_months(child.date_of_birth, current.date)
            target_age = compute_age_months(child.date_of_birth, target.date)
            months_ahead = round(target_age - age_months, 2)
            if months_ahead < 0.5 or months_ahead > 2.0:
                continue

            w_gain = None
            h_gain = None
            if i > 0:
                prev = records[i - 1]
                days = (current.date - prev.date).days
                if days > 0:
                    m = days / 30.4375
                    if prev.weight is not None and current.weight is not None:
                        w_gain = round((current.weight - prev.weight) / m, 4)
                    if prev.height is not None and current.height is not None:
                        h_gain = round((current.height - prev.height) / m, 4)

            rows.append({
                "child_id": child.id,
                "age_months": round(age_months, 2),
                "sex": child.sex or "unknown",
                "birth_weight": child.birth_weight,
                "birth_length": child.birth_length,
                "current_weight": current.weight,
                "current_height": current.height,
                "current_head_circumference": current.head_circumference,
                "weight_percentile": current.weight_percentile,
                "height_percentile": current.height_percentile,
                "head_percentile": current.head_percentile,
                "weight_zscore": current.weight_zscore,
                "height_zscore": current.height_zscore,
                "head_zscore": current.head_zscore,
                "weight_gain_last_month": w_gain,
                "height_gain_last_month": h_gain,
                "target_weight_next_month": target.weight,
                "target_height_next_month": target.height,
            })

    df = pd.DataFrame(rows)
    df.to_csv(OUTPUT, index=False)
    print(f"\nDataset saved: {OUTPUT}")
    print(f"Rows: {len(df)}")
    print(f"Columns: {list(df.columns)}")
    w_valid = df["target_weight_next_month"].notna().sum()
    h_valid = df["target_height_next_month"].notna().sum()
    print(f"Weight target non-null: {w_valid}")
    print(f"Height target non-null: {h_valid}")
    return df


if __name__ == "__main__":
    db = SessionLocal()
    try:
        build_dataset(db)
    finally:
        db.close()
