from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class UserRegister(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    role: str = "parent"


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    role: str

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class MessageResponse(BaseModel):
    message: str


class ChildCreate(BaseModel):
    name: str
    dateOfBirth: date
    sex: Optional[str] = None
    birthWeight: Optional[float] = None
    birthLength: Optional[float] = None


class ChildUpdate(BaseModel):
    name: Optional[str] = None
    dateOfBirth: Optional[date] = None
    sex: Optional[str] = None
    birthWeight: Optional[float] = None
    birthLength: Optional[float] = None


class ChildResponse(BaseModel):
    id: str
    name: str
    dateOfBirth: date
    sex: Optional[str] = None
    birthWeight: Optional[float] = None
    birthLength: Optional[float] = None
    userId: str
    createdAt: datetime

    model_config = {"from_attributes": True}


class GrowthRecordCreate(BaseModel):
    childId: str
    date: date
    weight: Optional[float] = None
    height: Optional[float] = None
    headCircumference: Optional[float] = None
    notes: Optional[str] = None


class GrowthRecordUpdate(BaseModel):
    date: Optional[date] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    headCircumference: Optional[float] = None
    notes: Optional[str] = None


class GrowthRecordResponse(BaseModel):
    id: str
    childId: str
    date: date
    weight: Optional[float] = None
    height: Optional[float] = None
    headCircumference: Optional[float] = None
    notes: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    weightZscore: Optional[float] = None
    heightZscore: Optional[float] = None
    headZscore: Optional[float] = None
    weightPercentile: Optional[float] = None
    heightPercentile: Optional[float] = None
    headPercentile: Optional[float] = None

    model_config = {"from_attributes": True}


class AlertResponse(BaseModel):
    id: str
    childId: str
    recordId: Optional[str] = None
    alertType: str
    severity: str
    message: str
    active: str
    createdAt: datetime
    resolvedAt: Optional[datetime] = None

    model_config = {"from_attributes": True}


class GrowthTrendPoint(BaseModel):
    date: str
    weight: Optional[float] = None
    height: Optional[float] = None
    weightZscore: Optional[float] = None
    heightZscore: Optional[float] = None
    weightPercentile: Optional[float] = None
    heightPercentile: Optional[float] = None


class GrowthAnalysis(BaseModel):
    childId: str
    ageMonths: float
    lastRecord: Optional[GrowthRecordResponse] = None
    weightTrend: Optional[str] = None
    heightTrend: Optional[str] = None
    alerts: list[AlertResponse] = []
    weightVelocity: Optional[float] = None
    heightVelocity: Optional[float] = None


class GrowthTrends(BaseModel):
    childId: str
    weightGainLastMonth: Optional[float] = None
    heightGainLastMonth: Optional[float] = None
    weightVelocity: Optional[float] = None
    heightVelocity: Optional[float] = None
    trend: list[GrowthTrendPoint] = []


class MlFeatures(BaseModel):
    childId: str
    ageMonths: float
    sex: Optional[str] = None
    birthWeight: Optional[float] = None
    birthLength: Optional[float] = None
    currentWeight: Optional[float] = None
    currentHeight: Optional[float] = None
    headCircumference: Optional[float] = None
    weightPercentile: Optional[float] = None
    heightPercentile: Optional[float] = None
    headPercentile: Optional[float] = None
    weightZscore: Optional[float] = None
    heightZscore: Optional[float] = None
    headZscore: Optional[float] = None
    weightGainLastMonth: Optional[float] = None
    heightGainLastMonth: Optional[float] = None
    growthVelocity: Optional[float] = None


class ConversationCreate(BaseModel):
    childId: str


class ConversationRename(BaseModel):
    title: str


class ConversationResponse(BaseModel):
    id: str
    childId: str
    title: Optional[str] = None
    summary: Optional[str] = None
    messageCount: int = 0
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    childId: str
    conversationId: str
    message: str


class ChatResponse(BaseModel):
    id: str
    childId: str
    userMessage: str
    assistantMessage: str
    createdAt: datetime

    model_config = {"from_attributes": True}


class ChatHistoryItem(BaseModel):
    id: str
    userMessage: str
    assistantMessage: str
    createdAt: datetime

    model_config = {"from_attributes": True}


class GrowthAnalysisRequest(BaseModel):
    childId: str


class GrowthAnalysisResponse(BaseModel):
    conversationId: str
    analysis: str
    id: str
    userMessage: str
    assistantMessage: str
    createdAt: datetime


class GrowthPredictionResponse(BaseModel):
    id: str
    childId: str
    predictionDate: date
    predictedWeight1Month: Optional[float] = None
    predictedWeight3Months: Optional[float] = None
    predictedHeight1Month: Optional[float] = None
    predictedHeight3Months: Optional[float] = None
    confidenceScore: Optional[float] = None
    createdAt: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PredictionRequest(BaseModel):
    generateTraining: bool = True
    trainModels: bool = True


class TrainResponse(BaseModel):
    datasetRows: int
    weightModel: str
    heightModel: str
    weightMAE: Optional[float] = None
    weightRMSE: Optional[float] = None
    weightR2: Optional[float] = None
    heightMAE: Optional[float] = None
    heightRMSE: Optional[float] = None
    heightR2: Optional[float] = None
