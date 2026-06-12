from datetime import date, datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Child, GrowthRecord, Alert, GrowthPrediction
from app.schemas import (
    GrowthAnalysis,
    GrowthTrends,
    GrowthTrendPoint,
    GrowthRecordResponse,
    AlertResponse,
    MlFeatures,
    GrowthPredictionResponse,
    PredictionRequest,
    TrainResponse,
)
from app.auth import get_current_user
from app.services.growth_analysis_service import (
    compute_age_months,
    compute_weight_gain_last_month,
    compute_height_gain_last_month,
)
from app.services.ml_features import generate_features

router = APIRouter(prefix="/api/children", tags=["analysis"])


def get_child_or_404(child_id: str, user: User, db: Session) -> Child:
    child = db.query(Child).filter(Child.id == child_id, Child.user_id == user.id).first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    return child


@router.get("/{child_id}/growth-analysis", response_model=GrowthAnalysis)
def get_growth_analysis(
    child_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    child = get_child_or_404(child_id, current_user, db)
    records = db.query(GrowthRecord).filter(
        GrowthRecord.child_id == child_id
    ).order_by(GrowthRecord.date.asc()).all()

    age_months = compute_age_months(child.date_of_birth)

    last_record = records[-1] if records else None
    last_record_resp = None
    if last_record:
        last_record_resp = GrowthRecordResponse(
            id=last_record.id,
            childId=last_record.child_id,
            date=last_record.date,
            weight=last_record.weight,
            height=last_record.height,
            headCircumference=last_record.head_circumference,
            notes=last_record.notes,
            createdAt=last_record.created_at,
            updatedAt=last_record.updated_at,
            weightZscore=last_record.weight_zscore,
            heightZscore=last_record.height_zscore,
            headZscore=last_record.head_zscore,
            weightPercentile=last_record.weight_percentile,
            heightPercentile=last_record.height_percentile,
            headPercentile=last_record.head_percentile,
        )

    weight_trend = None
    height_trend = None
    if len(records) >= 2:
        if last_record and last_record.weight_zscore is not None:
            if last_record.weight_zscore < -2:
                weight_trend = "below_normal"
            elif last_record.weight_zscore > 2:
                weight_trend = "above_normal"
            else:
                weight_trend = "normal"

        if last_record and last_record.height_zscore is not None:
            if last_record.height_zscore < -2:
                height_trend = "below_normal"
            elif last_record.height_zscore > 2:
                height_trend = "above_normal"
            else:
                height_trend = "normal"

    alerts = db.query(Alert).filter(
        Alert.child_id == child_id,
        Alert.active == "active"
    ).order_by(Alert.created_at.desc()).all()

    weight_velocity = compute_weight_gain_last_month(child_id, db)
    height_velocity = compute_height_gain_last_month(child_id, db)

    return GrowthAnalysis(
        childId=child_id,
        ageMonths=round(age_months, 2),
        lastRecord=last_record_resp,
        weightTrend=weight_trend,
        heightTrend=height_trend,
        alerts=[AlertResponse(
            id=a.id,
            childId=a.child_id,
            recordId=a.record_id,
            alertType=a.alert_type,
            severity=a.severity,
            message=a.message,
            active=a.active,
            createdAt=a.created_at,
            resolvedAt=a.resolved_at,
        ) for a in alerts],
        weightVelocity=round(weight_velocity, 4) if weight_velocity is not None else None,
        heightVelocity=round(height_velocity, 4) if height_velocity is not None else None,
    )


@router.get("/{child_id}/percentiles", response_model=GrowthRecordResponse)
def get_latest_percentiles(
    child_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    child = get_child_or_404(child_id, current_user, db)
    record = db.query(GrowthRecord).filter(
        GrowthRecord.child_id == child_id,
        GrowthRecord.weight_zscore.isnot(None)
    ).order_by(GrowthRecord.date.desc()).first()

    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No growth records with calculated percentiles")

    return GrowthRecordResponse(
        id=record.id,
        childId=record.child_id,
        date=record.date,
        weight=record.weight,
        height=record.height,
        headCircumference=record.head_circumference,
        notes=record.notes,
        createdAt=record.created_at,
        updatedAt=record.updated_at,
        weightZscore=record.weight_zscore,
        heightZscore=record.height_zscore,
        headZscore=record.head_zscore,
        weightPercentile=record.weight_percentile,
        heightPercentile=record.height_percentile,
        headPercentile=record.head_percentile,
    )


@router.get("/{child_id}/alerts", response_model=list[AlertResponse])
def get_alerts(
    child_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_child_or_404(child_id, current_user, db)
    alerts = db.query(Alert).filter(
        Alert.child_id == child_id
    ).order_by(Alert.created_at.desc()).all()

    return [AlertResponse(
        id=a.id,
        childId=a.child_id,
        recordId=a.record_id,
        alertType=a.alert_type,
        severity=a.severity,
        message=a.message,
        active=a.active,
        createdAt=a.created_at,
        resolvedAt=a.resolved_at,
    ) for a in alerts]


@router.get("/{child_id}/growth-trends", response_model=GrowthTrends)
def get_growth_trends(
    child_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_child_or_404(child_id, current_user, db)
    records = db.query(GrowthRecord).filter(
        GrowthRecord.child_id == child_id
    ).order_by(GrowthRecord.date.asc()).all()

    weight_gain = compute_weight_gain_last_month(child_id, db)
    height_gain = compute_height_gain_last_month(child_id, db)

    trend_points = []
    for r in records:
        trend_points.append(GrowthTrendPoint(
            date=r.date.isoformat(),
            weight=r.weight,
            height=r.height,
            weightZscore=r.weight_zscore,
            heightZscore=r.height_zscore,
            weightPercentile=r.weight_percentile,
            heightPercentile=r.height_percentile,
        ))

    return GrowthTrends(
        childId=child_id,
        weightGainLastMonth=round(weight_gain, 4) if weight_gain is not None else None,
        heightGainLastMonth=round(height_gain, 4) if height_gain is not None else None,
        weightVelocity=round(weight_gain, 4) if weight_gain is not None else None,
        heightVelocity=round(height_gain, 4) if height_gain is not None else None,
        trend=trend_points,
    )


@router.get("/{child_id}/ml-features", response_model=MlFeatures)
def get_ml_features(
    child_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_child_or_404(child_id, current_user, db)
    features = generate_features(child_id, db)

    if not features:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No growth data available")

    return MlFeatures(**features)


@router.get("/{child_id}/predictions", response_model=list[GrowthPredictionResponse])
def get_predictions(
    child_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_child_or_404(child_id, current_user, db)
    predictions = (
        db.query(GrowthPrediction)
        .filter(GrowthPrediction.child_id == child_id)
        .order_by(GrowthPrediction.created_at.desc())
        .all()
    )
    return [
        GrowthPredictionResponse(
            id=p.id,
            childId=p.child_id,
            predictionDate=p.prediction_date,
            predictedWeight1Month=p.predicted_weight_1_month,
            predictedWeight3Months=p.predicted_weight_3_months,
            predictedHeight1Month=p.predicted_height_1_month,
            predictedHeight3Months=p.predicted_height_3_months,
            confidenceScore=p.confidence_score,
            createdAt=p.created_at,
        )
        for p in predictions
    ]


@router.post("/{child_id}/predict", response_model=GrowthPredictionResponse)
def predict_growth(
    child_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_child_or_404(child_id, current_user, db)
    from services.ml.predict_growth import predict_growth as run_prediction

    result = run_prediction(child_id, db)
    if not result:
        raise HTTPException(status_code=400, detail="Insufficient data for prediction")

    pred = GrowthPrediction(
        child_id=child_id,
        prediction_date=date.today(),
        predicted_weight_1_month=result.get("predicted_weight_1_month"),
        predicted_weight_3_months=result.get("predicted_weight_3_months"),
        predicted_height_1_month=result.get("predicted_height_1_month"),
        predicted_height_3_months=result.get("predicted_height_3_months"),
        confidence_score=result.get("confidence_score"),
    )
    db.add(pred)
    db.commit()
    db.refresh(pred)

    return GrowthPredictionResponse(
        id=pred.id,
        childId=pred.child_id,
        predictionDate=pred.prediction_date,
        predictedWeight1Month=pred.predicted_weight_1_month,
        predictedWeight3Months=pred.predicted_weight_3_months,
        predictedHeight1Month=pred.predicted_height_1_month,
        predictedHeight3Months=pred.predicted_height_3_months,
        confidenceScore=pred.confidence_score,
        createdAt=pred.created_at,
    )


@router.post("/ml/train", response_model=TrainResponse)
def train_models(
    payload: PredictionRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload is None:
        payload = PredictionRequest()

    import json

    results = {"datasetRows": 0, "weightModel": "", "heightModel": "", "weightMAE": None, "weightRMSE": None, "weightR2": None, "heightMAE": None, "heightRMSE": None, "heightR2": None}

    if payload.generateTraining:
        from scripts.generate_training_dataset import build_dataset
        df = build_dataset(db)
        results["datasetRows"] = len(df)

    if payload.trainModels:
        from services.ml.train_growth_model import train
        train()

        models_dir = Path(__file__).parent.parent.parent / "models"
        weight_p = models_dir / "weight_model.pkl"
        height_p = models_dir / "height_model.pkl"
        results["weightModel"] = str(weight_p)
        results["heightModel"] = str(height_p)

        metrics_path = models_dir / "metrics.json"
        if metrics_path.exists():
            with open(metrics_path) as f:
                m = json.load(f)
                results["weightMAE"] = m.get("weight", {}).get("mae")
                results["weightRMSE"] = m.get("weight", {}).get("rmse")
                results["weightR2"] = m.get("weight", {}).get("r2")
                results["heightMAE"] = m.get("height", {}).get("mae")
                results["heightRMSE"] = m.get("height", {}).get("rmse")
                results["heightR2"] = m.get("height", {}).get("r2")

    return TrainResponse(**results)
