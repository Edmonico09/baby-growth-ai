from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Child, GrowthRecord
from app.schemas import GrowthRecordCreate, GrowthRecordUpdate, GrowthRecordResponse, MessageResponse
from app.auth import get_current_user
from app.services.growth_analysis_service import calculate_all_zscores
from app.services.alert_service import evaluate_and_create_alerts, resolve_active_alerts

router = APIRouter(prefix="/api/growth", tags=["growth"])


@router.get("", response_model=list[GrowthRecordResponse])
def get_growth_records(
    childId: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    child = db.query(Child).filter(Child.id == childId, Child.user_id == current_user.id).first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    records = db.query(GrowthRecord).filter(GrowthRecord.child_id == childId).order_by(GrowthRecord.date.asc()).all()
    return [
        GrowthRecordResponse(
            id=r.id,
            childId=r.child_id,
            date=r.date,
            weight=r.weight,
            height=r.height,
            headCircumference=r.head_circumference,
            notes=r.notes,
            createdAt=r.created_at,
            updatedAt=r.updated_at,
            weightZscore=r.weight_zscore,
            heightZscore=r.height_zscore,
            headZscore=r.head_zscore,
            weightPercentile=r.weight_percentile,
            heightPercentile=r.height_percentile,
            headPercentile=r.head_percentile,
        )
        for r in records
    ]


@router.post("", response_model=GrowthRecordResponse)
def create_growth_record(
    payload: GrowthRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    child = db.query(Child).filter(Child.id == payload.childId, Child.user_id == current_user.id).first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    resolve_active_alerts(child.id, db)

    record = GrowthRecord(
        child_id=payload.childId,
        date=payload.date,
        weight=payload.weight,
        height=payload.height,
        head_circumference=payload.headCircumference,
        notes=payload.notes,
    )
    db.add(record)
    db.flush()

    calculate_all_zscores(child, record, db)
    evaluate_and_create_alerts(child, record, db)

    db.commit()
    db.refresh(record)
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


@router.put("/{record_id}", response_model=GrowthRecordResponse)
def update_growth_record(
    record_id: str,
    payload: GrowthRecordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = (
        db.query(GrowthRecord)
        .join(Child)
        .filter(GrowthRecord.id == record_id, Child.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    child = db.query(Child).filter(Child.id == record.child_id).first()

    if payload.date is not None:
        record.date = payload.date
    if payload.weight is not None:
        record.weight = payload.weight
    if payload.height is not None:
        record.height = payload.height
    if payload.headCircumference is not None:
        record.head_circumference = payload.headCircumference
    if payload.notes is not None:
        record.notes = payload.notes

    resolve_active_alerts(child.id, db)
    calculate_all_zscores(child, record, db)
    evaluate_and_create_alerts(child, record, db)

    db.commit()
    db.refresh(record)
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


@router.delete("/{record_id}", response_model=MessageResponse)
def delete_growth_record(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = (
        db.query(GrowthRecord)
        .join(Child)
        .filter(GrowthRecord.id == record_id, Child.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    db.delete(record)
    db.commit()
    return MessageResponse(message="Record deleted successfully")
