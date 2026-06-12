"""
Predict future weight and height for a child using trained RandomForest models.

Usage:
    from services.ml.predict_growth import predict_growth

Returns dict with 1-month and 3-month predictions + confidence score.
"""

import math
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
from sqlalchemy.orm import Session

from app.models import Child, GrowthRecord
from app.services.growth_analysis_service import (
    compute_age_months,
    compute_weight_gain_last_month,
    compute_height_gain_last_month,
)

BASE = Path(__file__).parent.parent.parent
WEIGHT_MODEL = BASE / "models" / "weight_model.pkl"
HEIGHT_MODEL = BASE / "models" / "height_model.pkl"
METRICS_PATH = BASE / "models" / "metrics.json"

FEATURES = [
    "age_months",
    "birth_weight",
    "birth_length",
    "current_weight",
    "current_height",
    "current_head_circumference",
    "weight_percentile",
    "height_percentile",
    "head_percentile",
    "weight_zscore",
    "height_zscore",
    "head_zscore",
    "weight_gain_last_month",
    "height_gain_last_month",
    "sex_male",
]

_models_loaded = False
_weight_model = None
_height_model = None
_weight_rmse = None
_height_rmse = None


def _load_models():
    global _models_loaded, _weight_model, _height_model, _weight_rmse, _height_rmse
    if _models_loaded:
        return

    if WEIGHT_MODEL.exists():
        _weight_model = joblib.load(WEIGHT_MODEL)
    if HEIGHT_MODEL.exists():
        _height_model = joblib.load(HEIGHT_MODEL)

    if METRICS_PATH.exists():
        import json
        with open(METRICS_PATH) as f:
            m = json.load(f)
            _weight_rmse = m.get("weight", {}).get("rmse")
            _height_rmse = m.get("height", {}).get("rmse")

    _models_loaded = True


def _build_feature_vector(child: Child, record: GrowthRecord, db: Session) -> list:
    sex_male = 1 if child.sex and child.sex.lower() == "male" else 0
    age_m = compute_age_months(child.date_of_birth, record.date)
    w_gain = compute_weight_gain_last_month(child.id, db)
    h_gain = compute_height_gain_last_month(child.id, db)

    return [
        age_m,
        child.birth_weight or 0,
        child.birth_length or 0,
        record.weight or 0,
        record.height or 0,
        record.head_circumference or 0,
        record.weight_percentile or 50,
        record.height_percentile or 50,
        record.head_percentile or 50,
        record.weight_zscore or 0,
        record.height_zscore or 0,
        record.head_zscore or 0,
        w_gain or 0,
        h_gain or 0,
        sex_male,
    ]


def _predict_one(model, features: list) -> tuple[Optional[float], Optional[float]]:
    """Return (prediction, std) — std from tree variance for confidence."""
    if model is None:
        return None, None
    X = np.array([features])
    tree_preds = np.array([tree.predict(X)[0] for tree in model.estimators_])
    pred = float(np.mean(tree_preds))
    std = float(np.std(tree_preds))
    return pred, std


def _confidence(std: float, rmse: Optional[float]) -> float:
    """Normalized confidence 0–1. Higher is better."""
    if rmse is None or rmse == 0:
        return 0.5
    cv = std / abs(rmse) if rmse else 1.0
    return max(0.0, min(1.0, 1.0 - cv / 3.0))


def _simulate_next_record(child: Child, record: GrowthRecord, weight_pred: float, height_pred: float) -> GrowthRecord:
    """Create a synthetic next record with predicted values for iterative 3-month prediction."""
    from datetime import timedelta
    next_date = record.date + timedelta(days=30)
    next_record = GrowthRecord(
        child_id=child.id,
        date=next_date,
        weight=weight_pred,
        height=height_pred,
        head_circumference=record.head_circumference,
        weight_zscore=None,
        height_zscore=None,
        weight_percentile=None,
        height_percentile=None,
    )
    return next_record


def predict_growth(child_id: str, db: Session) -> dict:
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        return {}

    latest = (
        db.query(GrowthRecord)
        .filter(GrowthRecord.child_id == child_id)
        .order_by(GrowthRecord.date.desc())
        .first()
    )
    if not latest:
        return {}

    _load_models()
    features = _build_feature_vector(child, latest, db)

    w_pred_1, w_std_1 = _predict_one(_weight_model, features)
    h_pred_1, h_std_1 = _predict_one(_height_model, features)

    if w_pred_1 is None:
        return {}

    sim = _simulate_next_record(child, latest, w_pred_1, h_pred_1)
    sim_features = _build_feature_vector(child, sim, db)
    w_pred_3, w_std_3 = _predict_one(_weight_model, sim_features)
    h_pred_3, h_std_3 = _predict_one(_height_model, sim_features)

    if w_pred_3 is None:
        w_pred_3 = w_pred_1 + (w_pred_1 - (latest.weight or 0))
        h_pred_3 = h_pred_1 + (h_pred_1 - (latest.height or 0))

    w_std_3 = w_std_3 or w_std_1
    h_std_3 = h_std_3 or h_std_1

    avg_std = (w_std_1 + w_std_3 + h_std_1 + h_std_3) / 4
    avg_rmse = ((_weight_rmse or 0.3) + (_height_rmse or 0.5)) / 2
    confidence = _confidence(avg_std, avg_rmse)

    result = {
        "predicted_weight_1_month": round(w_pred_1, 2),
        "predicted_weight_3_months": round(w_pred_3, 2),
        "predicted_height_1_month": round(h_pred_1, 1),
        "predicted_height_3_months": round(h_pred_3, 1),
        "confidence_score": round(confidence, 2),
    }

    return result
