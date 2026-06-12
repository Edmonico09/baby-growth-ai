from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.models import Child, GrowthRecord, Alert


def evaluate_and_create_alerts(child: Child, record: GrowthRecord, db: Session) -> list[Alert]:
    created = []
    existing_active = db.query(Alert).filter(
        Alert.child_id == child.id,
        Alert.active == "active"
    ).count()

    alerts_to_check = []

    if record.weight_zscore is not None:
        if record.weight_zscore < -3:
            alerts_to_check.append(("low_weight", "critical",
                f"Weight z-score is {record.weight_zscore:.2f} (severely below normal). Please consult a pediatrician."))
        elif record.weight_zscore < -2:
            alerts_to_check.append(("low_weight", "warning",
                f"Weight z-score is {record.weight_zscore:.2f} (below normal). Monitor closely."))
        elif record.weight_zscore > 3:
            alerts_to_check.append(("high_weight", "critical",
                f"Weight z-score is {record.weight_zscore:.2f} (severely above normal). Please consult a pediatrician."))
        elif record.weight_zscore > 2:
            alerts_to_check.append(("high_weight", "warning",
                f"Weight z-score is {record.weight_zscore:.2f} (above normal). Monitor closely."))

    if record.height_zscore is not None:
        if record.height_zscore < -3:
            alerts_to_check.append(("stunting", "critical",
                f"Height z-score is {record.height_zscore:.2f} (severely stunted). Please consult a pediatrician."))
        elif record.height_zscore < -2:
            alerts_to_check.append(("stunting", "warning",
                f"Height z-score is {record.height_zscore:.2f} (below normal). Monitor growth closely."))
        elif record.height_zscore > 3:
            alerts_to_check.append(("high_length", "critical",
                f"Height z-score is {record.height_zscore:.2f} (severely above normal). Please consult a pediatrician."))
        elif record.height_zscore > 2:
            alerts_to_check.append(("high_length", "warning",
                f"Height z-score is {record.height_zscore:.2f} (above normal). Monitor closely."))

    if record.head_zscore is not None:
        if record.head_zscore < -3:
            alerts_to_check.append(("low_head", "critical",
                f"Head circumference z-score is {record.head_zscore:.2f} (severely below normal). Please consult a pediatrician."))
        elif record.head_zscore < -2:
            alerts_to_check.append(("low_head", "warning",
                f"Head circumference z-score is {record.head_zscore:.2f} (below normal). Monitor closely."))
        elif record.head_zscore > 3:
            alerts_to_check.append(("high_head", "critical",
                f"Head circumference z-score is {record.head_zscore:.2f} (severely above normal). Please consult a pediatrician."))
        elif record.head_zscore > 2:
            alerts_to_check.append(("high_head", "warning",
                f"Head circumference z-score is {record.head_zscore:.2f} (above normal). Monitor closely."))

    prev_records = db.query(GrowthRecord).filter(
        GrowthRecord.child_id == child.id,
        GrowthRecord.weight.isnot(None)
    ).order_by(GrowthRecord.date.desc()).limit(4).all()

    if len(prev_records) >= 2:
        sorted_records = sorted(prev_records, key=lambda r: r.date)

        if sorted_records[-1].weight is not None and sorted_records[-2].weight is not None:
            weight_change = sorted_records[-1].weight - sorted_records[-2].weight

            if weight_change < -0.1:
                alerts_to_check.append(("weight_loss", "critical",
                    f"Weight decreased by {abs(weight_change):.2f} kg since last measurement."))

        if len(sorted_records) >= 3:
            gains = []
            for i in range(1, len(sorted_records)):
                if sorted_records[i].weight is not None and sorted_records[i - 1].weight is not None:
                    gains.append(sorted_records[i].weight - sorted_records[i - 1].weight)

            if len(gains) >= 2 and all(g <= 0.05 for g in gains[-2:]):
                alerts_to_check.append(("weight_stagnation", "warning",
                    "Weight appears to have plateaued over the last measurements. Monitor appetite and growth."))

    for alert_type, severity, message in alerts_to_check:
        existing = db.query(Alert).filter(
            Alert.child_id == child.id,
            Alert.alert_type == alert_type,
            Alert.active == "active"
        ).first()

        if not existing:
            alert = Alert(
                child_id=child.id,
                record_id=record.id,
                alert_type=alert_type,
                severity=severity,
                message=message,
                active="active",
            )
            db.add(alert)
            created.append(alert)

    return created


def resolve_active_alerts(child_id: str, db: Session):
    alerts = db.query(Alert).filter(
        Alert.child_id == child_id,
        Alert.active == "active"
    ).all()
    now = datetime.utcnow()
    for a in alerts:
        a.active = "resolved"
        a.resolved_at = now
    db.flush()
