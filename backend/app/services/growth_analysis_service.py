from datetime import date
from typing import Optional
from scipy.stats import norm
from sqlalchemy.orm import Session

from app.models import Child, GrowthRecord, GrowthRefWeightAge, GrowthRefLengthAge, GrowthRefWeightLength, GrowthRefHeadAge


def compute_age_months(birth_date: date, reference_date: Optional[date] = None) -> float:
    if reference_date is None:
        reference_date = date.today()
    days = (reference_date - birth_date).days
    return days / 30.4375


def _interpolate_lms(ref_rows, age_key: str, target_value: float):
    if not ref_rows:
        return None, None, None
    sorted_rows = sorted(ref_rows, key=lambda r: getattr(r, age_key))
    if target_value <= getattr(sorted_rows[0], age_key):
        return sorted_rows[0].L, sorted_rows[0].M, sorted_rows[0].S
    if target_value >= getattr(sorted_rows[-1], age_key):
        return sorted_rows[-1].L, sorted_rows[-1].M, sorted_rows[-1].S

    for i in range(len(sorted_rows) - 1):
        low = getattr(sorted_rows[i], age_key)
        high = getattr(sorted_rows[i + 1], age_key)
        if low <= target_value <= high:
            if high == low:
                return sorted_rows[i].L, sorted_rows[i].M, sorted_rows[i].S
            ratio = (target_value - low) / (high - low)
            L = sorted_rows[i].L + ratio * (sorted_rows[i + 1].L - sorted_rows[i].L)
            M = sorted_rows[i].M + ratio * (sorted_rows[i + 1].M - sorted_rows[i].M)
            S = sorted_rows[i].S + ratio * (sorted_rows[i + 1].S - sorted_rows[i].S)
            return L, M, S
    return sorted_rows[-1].L, sorted_rows[-1].M, sorted_rows[-1].S


def compute_zscore(X: float, L: float, M: float, S: float) -> float:
    if M == 0 or S == 0:
        return 0.0
    if L == 0:
        from math import log
        return log(X / M) / S
    from math import pow
    return ((X / M) ** L - 1) / (L * S)


def compute_percentile_from_zscore(z: float) -> float:
    return norm.cdf(z) * 100.0


def calculate_weight_zscore(child: Child, record: GrowthRecord, db: Session) -> Optional[float]:
    if record.weight is None:
        return None
    age_months = compute_age_months(child.date_of_birth, record.date)
    sex_label = "male" if child.sex and child.sex.lower() == "male" else "female"
    ref_rows = db.query(GrowthRefWeightAge).filter(GrowthRefWeightAge.sex == sex_label).all()
    L, M, S = _interpolate_lms(ref_rows, "age_months", age_months)
    if L is None:
        return None
    return compute_zscore(record.weight, L, M, S)


def calculate_height_zscore(child: Child, record: GrowthRecord, db: Session) -> Optional[float]:
    if record.height is None:
        return None
    age_months = compute_age_months(child.date_of_birth, record.date)
    sex_label = "male" if child.sex and child.sex.lower() == "male" else "female"
    ref_rows = db.query(GrowthRefLengthAge).filter(GrowthRefLengthAge.sex == sex_label).all()
    L, M, S = _interpolate_lms(ref_rows, "age_months", age_months)
    if L is None:
        return None
    return compute_zscore(record.height, L, M, S)


def calculate_head_zscore(child: Child, record: GrowthRecord, db: Session) -> Optional[float]:
    if record.head_circumference is None:
        return None
    age_months = compute_age_months(child.date_of_birth, record.date)
    sex_label = "male" if child.sex and child.sex.lower() == "male" else "female"
    ref_rows = db.query(GrowthRefHeadAge).filter(GrowthRefHeadAge.sex == sex_label).all()
    L, M, S = _interpolate_lms(ref_rows, "age_months", age_months)
    if L is None:
        return None
    return compute_zscore(record.head_circumference, L, M, S)


def compute_growth_velocity(records: list[GrowthRecord], field: str) -> Optional[float]:
    sorted_records = sorted(records, key=lambda r: r.date)
    if len(sorted_records) < 2:
        return None
    latest = sorted_records[-1]
    prev = sorted_records[-2]
    days = (latest.date - prev.date).days
    if days <= 0:
        return None
    months = days / 30.4375
    latest_val = getattr(latest, field, None)
    prev_val = getattr(prev, field, None)
    if latest_val is None or prev_val is None:
        return None
    return (latest_val - prev_val) / months


def calculate_all_zscores(child: Child, record: GrowthRecord, db: Session):
    record.weight_zscore = calculate_weight_zscore(child, record, db)
    record.height_zscore = calculate_height_zscore(child, record, db)
    record.head_zscore = calculate_head_zscore(child, record, db)

    if record.weight_zscore is not None:
        record.weight_percentile = round(compute_percentile_from_zscore(record.weight_zscore), 2)
    if record.height_zscore is not None:
        record.height_percentile = round(compute_percentile_from_zscore(record.height_zscore), 2)
    if record.head_zscore is not None:
        record.head_percentile = round(compute_percentile_from_zscore(record.head_zscore), 2)

    if record.weight_zscore is not None:
        record.weight_zscore = round(record.weight_zscore, 4)
    if record.height_zscore is not None:
        record.height_zscore = round(record.height_zscore, 4)
    if record.head_zscore is not None:
        record.head_zscore = round(record.head_zscore, 4)


def compute_weight_gain_last_month(child_id: str, db: Session) -> Optional[float]:
    records = db.query(GrowthRecord).filter(
        GrowthRecord.child_id == child_id,
        GrowthRecord.weight.isnot(None)
    ).order_by(GrowthRecord.date.asc()).all()
    return compute_growth_velocity(records, "weight")


def compute_height_gain_last_month(child_id: str, db: Session) -> Optional[float]:
    records = db.query(GrowthRecord).filter(
        GrowthRecord.child_id == child_id,
        GrowthRecord.height.isnot(None)
    ).order_by(GrowthRecord.date.asc()).all()
    return compute_growth_velocity(records, "height")
