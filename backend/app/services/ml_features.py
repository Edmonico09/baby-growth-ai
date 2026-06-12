from sqlalchemy.orm import Session

from app.models import Child, GrowthRecord
from app.services.growth_analysis_service import (
    compute_age_months,
    compute_weight_gain_last_month,
    compute_height_gain_last_month,
)


def generate_features(child_id: str, db: Session) -> dict:
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        return {}

    records = db.query(GrowthRecord).filter(
        GrowthRecord.child_id == child_id
    ).order_by(GrowthRecord.date.asc()).all()

    if not records:
        return {}

    latest = records[-1]
    age_months = compute_age_months(child.date_of_birth, latest.date)

    features = {
        "child_id": child.id,
        "age_months": round(age_months, 2),
        "sex": child.sex,
        "birth_weight": child.birth_weight,
        "birth_length": child.birth_length,
        "current_weight": latest.weight,
        "current_height": latest.height,
        "head_circumference": latest.head_circumference,
        "weight_percentile": latest.weight_percentile,
        "height_percentile": latest.height_percentile,
        "head_percentile": latest.head_percentile,
        "weight_zscore": latest.weight_zscore,
        "height_zscore": latest.height_zscore,
        "head_zscore": latest.head_zscore,
        "weight_gain_last_month": compute_weight_gain_last_month(child_id, db),
        "height_gain_last_month": compute_height_gain_last_month(child_id, db),
        "growth_velocity": None,
    }

    if features["weight_gain_last_month"] is not None and features["height_gain_last_month"] is not None:
        features["growth_velocity"] = round(
            (features["weight_gain_last_month"] + features["height_gain_last_month"]) / 2, 4
        )

    return features
