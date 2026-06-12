"""
Generate synthetic children with realistic growth data based on WHO LMS curves.

Usage:
    python scripts/generate_synthetic_children.py [--count 500] [--months 24]

Creates synthetic children + growth records directly in the database.
Each child gets a consistent growth trajectory (z-score offset) drawn from N(0,1.2).
"""

import argparse
import random
import sys
from datetime import date, timedelta, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Child, GrowthRecord, GrowthRefWeightAge, GrowthRefLengthAge, GrowthRefHeadAge
from app.auth import hash_password
from app.models import User

rng = np.random.default_rng(42)

MONTHLY_INTERVALS = [30, 31, 30, 31, 30, 31, 30, 31, 31, 30, 31, 30]


def _inverse_lms(z: float, L: float, M: float, S: float) -> float:
    if L == 0:
        from math import exp
        return M * exp(S * z)
    return M * (1 + L * S * z) ** (1 / L)


def _ref_lms(rows: list, age_months: float):
    """Return interpolated L, M, S from reference rows at given age."""
    if not rows:
        return 1.0, 0.0, 0.0
    sorted_rows = sorted(rows, key=lambda r: r.age_months)
    if age_months <= sorted_rows[0].age_months:
        return sorted_rows[0].L, sorted_rows[0].M, sorted_rows[0].S
    if age_months >= sorted_rows[-1].age_months:
        return sorted_rows[-1].L, sorted_rows[-1].M, sorted_rows[-1].S
    for i in range(len(sorted_rows) - 1):
        low, high = sorted_rows[i].age_months, sorted_rows[i + 1].age_months
        if low <= age_months <= high:
            if high == low:
                return sorted_rows[i].L, sorted_rows[i].M, sorted_rows[i].S
            r = (age_months - low) / (high - low)
            return (
                sorted_rows[i].L + r * (sorted_rows[i + 1].L - sorted_rows[i].L),
                sorted_rows[i].M + r * (sorted_rows[i + 1].M - sorted_rows[i].M),
                sorted_rows[i].S + r * (sorted_rows[i + 1].S - sorted_rows[i].S),
            )
    return sorted_rows[-1].L, sorted_rows[-1].M, sorted_rows[-1].S


def _generate_child_data(
    sex: str,
    birth_date: date,
    num_months: int,
    weight_z_offset: float,
    height_z_offset: float,
    head_z_offset: float,
    db: Session,
) -> list[GrowthRecord]:
    records = []
    sex_lbl = "male" if sex == "male" else "female"
    w_ref = db.query(GrowthRefWeightAge).filter(GrowthRefWeightAge.sex == sex_lbl).all()
    h_ref = db.query(GrowthRefLengthAge).filter(GrowthRefLengthAge.sex == sex_lbl).all()
    head_ref = db.query(GrowthRefHeadAge).filter(GrowthRefHeadAge.sex == sex_lbl).all()

    day = 0
    for m in range(num_months + 1):
        age_m = float(m)
        d = birth_date + timedelta(days=day)
        if d > date.today():
            break

        wL, wM, wS = _ref_lms(w_ref, age_m)
        hL, hM, hS = _ref_lms(h_ref, age_m)
        heL, heM, heS = _ref_lms(head_ref, age_m)

        noise_w = rng.normal(0, 0.08)
        noise_h = rng.normal(0, 0.15)
        noise_he = rng.normal(0, 0.1)

        weight = _inverse_lms(weight_z_offset + noise_w, wL, wM, wS) if wS > 0 else None
        height = _inverse_lms(height_z_offset + noise_h, hL, hM, hS) if hS > 0 else None
        head = _inverse_lms(head_z_offset + noise_he, heL, heM, heS) if heS > 0 else None

        records.append(GrowthRecord(
            date=d,
            weight=round(weight, 2) if weight else None,
            height=round(height, 1) if height else None,
            head_circumference=round(head, 1) if head else None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        ))

        day += MONTHLY_INTERVALS[m % 12] if m < len(MONTHLY_INTERVALS) else 30

    return records


def generate(
    count: int = 500,
    months: int = 24,
    batch_size: int = 100,
):
    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == "synthetic@babygrowth.ai").first()
        if existing_user:
            user = existing_user
            print(f"Reusing existing synthetic user: {user.id}")
        else:
            user = User(
                email="synthetic@babygrowth.ai",
                password_hash=hash_password("synthetic123"),
                name="Synthetic Data",
                role="parent",
            )
            db.add(user)
            db.flush()
            print(f"Created synthetic user: {user.id}")

        sexes = ["male", "female"]
        names_m = [f"Boy_{i}" for i in range(count // 2)]
        names_f = [f"Girl_{i}" for i in range(count // 2 + count % 2)]
        total_created = 0

        for batch_start in range(0, count, batch_size):
            batch_end = min(batch_start + batch_size, count)
            print(f"Generating batch {batch_start + 1}–{batch_end}...")

            for i in range(batch_start, batch_end):
                sex = sexes[i % 2]
                name = names_m[i // 2] if sex == "male" else names_f[i // 2]
                birth_date = date(
                    rng.integers(2022, 2025),
                    rng.integers(1, 13),
                    rng.integers(1, 29),
                )

                child = Child(
                    user_id=user.id,
                    name=name,
                    date_of_birth=birth_date,
                    sex=sex,
                    birth_weight=round(float(rng.normal(3.3, 0.4)), 2),
                    birth_length=round(float(rng.normal(50.0, 2.0)), 1),
                    created_at=datetime.utcnow(),
                )
                db.add(child)
                db.flush()

                weight_offset = float(rng.normal(0, 1.2))
                height_offset = float(rng.normal(0, 1.0))
                head_offset = float(rng.normal(0, 0.8))

                records = _generate_child_data(sex, birth_date, months, weight_offset, height_offset, head_offset, db)
                for rec in records:
                    rec.child_id = child.id
                    db.add(rec)

                total_created += 1
                if (i - batch_start + 1) % 50 == 0:
                    print(f"  ... {i - batch_start + 1} children in this batch")

            db.commit()
            print(f"  Batch committed. Total so far: {total_created}")

        print(f"\nDone! Created {total_created} synthetic children.")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic children for ML training")
    parser.add_argument("--count", type=int, default=500, help="Number of children (default: 500)")
    parser.add_argument("--months", type=int, default=24, help="Months of data per child (default: 24)")
    parser.add_argument("--batch-size", type=int, default=100, help="DB commit batch size (default: 100)")
    args = parser.parse_args()
    generate(count=args.count, months=args.months, batch_size=args.batch_size)
