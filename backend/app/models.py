import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, Date, JSON, Enum as SAEnum
from sqlalchemy.orm import relationship
import enum

from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=True)
    role = Column(String(20), nullable=False, default="parent")
    created_at = Column(DateTime, default=datetime.utcnow)

    children = relationship("Child", back_populates="user")


class Child(Base):
    __tablename__ = "children"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=False)
    sex = Column(String(10), nullable=True)
    birth_weight = Column(Float, nullable=True)
    birth_length = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="children")
    growth_records = relationship("GrowthRecord", back_populates="child", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="child", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="child", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="child", cascade="all, delete-orphan")


class GrowthRecord(Base):
    __tablename__ = "growth_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    child_id = Column(String, ForeignKey("children.id"), nullable=False)
    date = Column(Date, nullable=False)
    weight = Column(Float, nullable=True)
    height = Column(Float, nullable=True)
    head_circumference = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    weight_zscore = Column(Float, nullable=True)
    height_zscore = Column(Float, nullable=True)
    head_zscore = Column(Float, nullable=True)
    weight_percentile = Column(Float, nullable=True)
    height_percentile = Column(Float, nullable=True)
    head_percentile = Column(Float, nullable=True)

    child = relationship("Child", back_populates="growth_records")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=generate_uuid)
    child_id = Column(String, ForeignKey("children.id"), nullable=False, index=True)
    title = Column(String(255), nullable=True)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    child = relationship("Child", back_populates="conversations")
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    child_id = Column(String, ForeignKey("children.id"), nullable=False)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False, index=True)
    user_message = Column(Text, nullable=False)
    assistant_message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    child = relationship("Child", back_populates="chat_messages")
    conversation = relationship("Conversation", back_populates="messages")


class AlertSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class AlertType(str, enum.Enum):
    LOW_WEIGHT = "low_weight"
    HIGH_WEIGHT = "high_weight"
    STUNTING = "stunting"
    HIGH_LENGTH = "high_length"
    LOW_HEAD = "low_head"
    HIGH_HEAD = "high_head"
    WEIGHT_LOSS = "weight_loss"
    WEIGHT_STAGNATION = "weight_stagnation"
    LOW_BMI = "low_bmi"
    HIGH_BMI = "high_bmi"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=generate_uuid)
    child_id = Column(String, ForeignKey("children.id"), nullable=False, index=True)
    record_id = Column(String, ForeignKey("growth_records.id"), nullable=True)
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False, default="warning")
    message = Column(Text, nullable=False)
    active = Column(SAEnum("active", "resolved", name="alert_status"), nullable=False, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    child = relationship("Child", back_populates="alerts")
    growth_record = relationship("GrowthRecord")


class GrowthRefWeightAge(Base):
    __tablename__ = "growth_ref_weight_age"

    id = Column(String, primary_key=True, default=generate_uuid)
    sex = Column(String(10), nullable=False, index=True)
    age_months = Column(Float, nullable=False)
    L = Column(Float, nullable=False)
    M = Column(Float, nullable=False)
    S = Column(Float, nullable=False)
    percentiles = Column(JSON, nullable=True)


class GrowthRefLengthAge(Base):
    __tablename__ = "growth_ref_length_age"

    id = Column(String, primary_key=True, default=generate_uuid)
    sex = Column(String(10), nullable=False, index=True)
    age_months = Column(Float, nullable=False)
    L = Column(Float, nullable=False)
    M = Column(Float, nullable=False)
    S = Column(Float, nullable=False)
    percentiles = Column(JSON, nullable=True)


class GrowthRefWeightLength(Base):
    __tablename__ = "growth_ref_weight_length"

    id = Column(String, primary_key=True, default=generate_uuid)
    sex = Column(String(10), nullable=False, index=True)
    length_cm = Column(Float, nullable=False)
    L = Column(Float, nullable=False)
    M = Column(Float, nullable=False)
    S = Column(Float, nullable=False)
    percentiles = Column(JSON, nullable=True)


class GrowthRefHeadAge(Base):
    __tablename__ = "growth_ref_head_age"

    id = Column(String, primary_key=True, default=generate_uuid)
    sex = Column(String(10), nullable=False, index=True)
    age_months = Column(Float, nullable=False)
    L = Column(Float, nullable=False)
    M = Column(Float, nullable=False)
    S = Column(Float, nullable=False)
    percentiles = Column(JSON, nullable=True)


class GrowthPrediction(Base):
    __tablename__ = "growth_predictions"

    id = Column(String, primary_key=True, default=generate_uuid)
    child_id = Column(String, ForeignKey("children.id"), nullable=False, index=True)
    prediction_date = Column(Date, nullable=False, default=datetime.utcnow)
    predicted_weight_1_month = Column(Float, nullable=True)
    predicted_weight_3_months = Column(Float, nullable=True)
    predicted_height_1_month = Column(Float, nullable=True)
    predicted_height_3_months = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    child = relationship("Child")
