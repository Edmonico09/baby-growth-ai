import logging
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from openai import OpenAI

from app.config import settings
from app.database import get_db
from app.models import User, Child, ChatMessage, GrowthRecord, Conversation, Alert
from app.schemas import (
    ChatRequest,
    ChatResponse,
    ChatHistoryItem,
    ConversationCreate,
    ConversationRename,
    ConversationResponse,
    GrowthAnalysisRequest,
    GrowthAnalysisResponse,
    MessageResponse,
)
from app.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])

SYSTEM_PROMPT = (
    "You are BabyGrowth AI, a helpful pediatric health assistant. "
    "You provide evidence-based advice about infant and child growth, "
    "nutrition, sleep, and developmental milestones. "
    "Always remind parents to consult their pediatrician for medical concerns. "
    "Keep responses concise, warm, and informative.\n\n"
    "GROWTH DATA NOTE: The percentiles and z-scores provided below are calculated "
    "automatically from WHO growth standards using the LMS method. Do not recalculate "
    "them yourself. Use them as-is to inform your interpretation of the child's growth status.\n\n"
    "ML PREDICTIONS NOTE: The predicted future weight and height values come from our "
    "custom RandomForest ML model trained on WHO-based growth data. These are statistical "
    "projections, not guarantees. Refer to them in your analysis (e.g., 'Our model predicts "
    "your child will reach X kg in 3 months'). Do not recalculate predictions."
)

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
MAX_HISTORY_MESSAGES = 50


def get_client() -> OpenAI:
    return OpenAI(api_key=settings.groq_api_key, base_url=GROQ_BASE_URL)


def get_child_or_404(child_id: str, user: User, db: Session) -> Child:
    child = db.query(Child).filter(Child.id == child_id, Child.user_id == user.id).first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    return child


def get_conversation_or_404(conv_id: str, user: User, db: Session) -> Conversation:
    conv = (
        db.query(Conversation)
        .join(Child)
        .filter(Conversation.id == conv_id, Child.user_id == user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return conv


def compute_age(birth_date: date) -> str:
    today = date.today()
    years = today.year - birth_date.year
    months = today.month - birth_date.month
    if today.day < birth_date.day:
        months -= 1
    if months < 0:
        years -= 1
        months += 12
    if years > 0:
        return f"{years} year{'s' if years > 1 else ''} and {months} month{'s' if months != 1 else ''}"
    return f"{months} month{'s' if months != 1 else ''}"


def build_child_context(child: Child, db: Session) -> str:
    parts = []
    parts.append(f"Child's name: {child.name}")
    parts.append(f"Age: {compute_age(child.date_of_birth)}")
    if child.sex:
        label = "male" if child.sex.lower() == "male" else "female"
        parts.append(f"Gender: {label}")
    if child.birth_weight:
        parts.append(f"Birth weight: {child.birth_weight} kg")
    if child.birth_length:
        parts.append(f"Birth length: {child.birth_length} cm")

    latest = (
        db.query(GrowthRecord)
        .filter(GrowthRecord.child_id == child.id)
        .order_by(GrowthRecord.date.desc())
        .first()
    )
    if latest:
        if latest.weight:
            parts.append(f"Latest recorded weight: {latest.weight} kg")
        if latest.height:
            parts.append(f"Latest recorded height: {latest.height} cm")
        if latest.weight_zscore is not None:
            parts.append(f"Weight-for-age z-score: {latest.weight_zscore:.2f} (percentile: {latest.weight_percentile:.1f}%)")
        if latest.height_zscore is not None:
            parts.append(f"Length/Height-for-age z-score: {latest.height_zscore:.2f} (percentile: {latest.height_percentile:.1f}%)")
        if latest.head_zscore is not None:
            parts.append(f"Head circumference-for-age z-score: {latest.head_zscore:.2f} (percentile: {latest.head_percentile:.1f}%)")

    alerts = (
        db.query(Alert)
        .filter(Alert.child_id == child.id, Alert.active == "active")
        .order_by(Alert.created_at.desc())
        .limit(3)
        .all()
    )
    if alerts:
        parts.append("Active alerts:")
        for a in alerts:
            parts.append(f"  [{a.severity.upper()}] {a.message}")

    try:
        from services.ml.predict_growth import predict_growth
        predictions = predict_growth(child.id, db)
        if predictions:
            parts.append("ML Growth Predictions (from our RandomForest model):")
            parts.append(f"  Predicted weight in 1 month: {predictions['predicted_weight_1_month']} kg")
            parts.append(f"  Predicted weight in 3 months: {predictions['predicted_weight_3_months']} kg")
            parts.append(f"  Predicted height in 1 month: {predictions['predicted_height_1_month']} cm")
            parts.append(f"  Predicted height in 3 months: {predictions['predicted_height_3_months']} cm")
            parts.append(f"  Confidence score: {predictions['confidence_score']:.0%}")
            parts.append("NOTE: These predictions are from our ML model. Do not recalculate them.")
    except Exception:
        pass

    return "\n".join(parts)


def format_history(messages: list[ChatMessage]) -> list[dict]:
    msgs = []
    for msg in messages:
        msgs.append({"role": "user", "content": msg.user_message})
        msgs.append({"role": "assistant", "content": msg.assistant_message})
    return msgs


def generate_title_from_llm(client: OpenAI, first_message: str) -> str:
    try:
        response = client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": "Generate a short title (max 5 words) for the conversation. Return only the title, no quotes."},
                {"role": "user", "content": first_message},
            ],
            max_tokens=20,
        )
        title = response.choices[0].message.content.strip().strip('"').strip("'") if response.choices else None
        return title[:255] if title else None
    except Exception:
        logger.exception("Title generation failed")
        return None


# ─── CRUD Conversations ─────────────────────────────


@router.get("/conversations", response_model=list[ConversationResponse])
def list_conversations(
    childId: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_child_or_404(childId, current_user, db)
    conversations = (
        db.query(Conversation)
        .filter(Conversation.child_id == childId)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return [
        ConversationResponse(
            id=c.id,
            childId=c.child_id,
            title=c.title,
            summary=c.summary,
            messageCount=len(c.messages),
            createdAt=c.created_at,
            updatedAt=c.updated_at,
        )
        for c in conversations
    ]


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_child_or_404(payload.childId, current_user, db)
    conv = Conversation(
        child_id=payload.childId,
        title=None,
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return ConversationResponse(
        id=conv.id,
        childId=conv.child_id,
        title=conv.title,
        summary=conv.summary,
        messageCount=0,
        createdAt=conv.created_at,
        updatedAt=conv.updated_at,
    )


@router.put("/conversations/{conv_id}", response_model=ConversationResponse)
def rename_conversation(
    conv_id: str,
    payload: ConversationRename,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = get_conversation_or_404(conv_id, current_user, db)
    conv.title = payload.title
    db.commit()
    db.refresh(conv)
    return ConversationResponse(
        id=conv.id,
        childId=conv.child_id,
        title=conv.title,
        summary=conv.summary,
        messageCount=len(conv.messages),
        createdAt=conv.created_at,
        updatedAt=conv.updated_at,
    )


@router.delete("/conversations/{conv_id}", response_model=MessageResponse)
def delete_conversation(
    conv_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = get_conversation_or_404(conv_id, current_user, db)
    db.delete(conv)
    db.commit()
    return MessageResponse(message="Conversation deleted")


@router.post("/conversations/{conv_id}/generate-title", response_model=ConversationResponse)
def generate_title(
    conv_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = get_conversation_or_404(conv_id, current_user, db)
    if conv.title:
        return ConversationResponse(
            id=conv.id,
            childId=conv.child_id,
            title=conv.title,
            summary=conv.summary,
            messageCount=len(conv.messages),
            createdAt=conv.created_at,
            updatedAt=conv.updated_at,
        )

    first_msg = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == conv.id)
        .order_by(ChatMessage.created_at.asc())
        .first()
    )
    if not first_msg:
        return ConversationResponse(
            id=conv.id,
            childId=conv.child_id,
            title=conv.title,
            summary=conv.summary,
            messageCount=0,
            createdAt=conv.created_at,
            updatedAt=conv.updated_at,
        )

    try:
        client = get_client()
        title = generate_title_from_llm(client, first_msg.user_message)
        if title:
            conv.title = title
            db.commit()
            db.refresh(conv)
    except Exception:
        logger.exception("Title generation failed")

    return ConversationResponse(
        id=conv.id,
        childId=conv.child_id,
        title=conv.title,
        summary=conv.summary,
        messageCount=len(conv.messages),
        createdAt=conv.created_at,
        updatedAt=conv.updated_at,
    )


# ─── Messages ────────────────────────────────────────


@router.post("", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    child = get_child_or_404(payload.childId, current_user, db)
    conv = get_conversation_or_404(payload.conversationId, current_user, db)

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == conv.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    need_summary = False
    if len(messages) >= MAX_HISTORY_MESSAGES:
        need_summary = True
        context_messages = messages[-(MAX_HISTORY_MESSAGES - 1):]
    else:
        context_messages = messages

    child_context = build_child_context(child, db)
    system_text = f"{SYSTEM_PROMPT}\n\nChild profile:\n{child_context}"

    llm_messages = [{"role": "system", "content": system_text}]
    if need_summary and conv.summary:
        llm_messages.append({
            "role": "system",
            "content": f"Previous conversation summary:\n{conv.summary}",
        })
    llm_messages.extend(format_history(context_messages))
    llm_messages.append({"role": "user", "content": payload.message})

    try:
        client = get_client()
        response = client.chat.completions.create(
            model=settings.groq_model,
            messages=llm_messages,
        )
        assistant_message = response.choices[0].message.content or "I'm sorry, I couldn't generate a response."
    except Exception as e:
        logger.exception("Groq API call failed")
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    chat_msg = ChatMessage(
        child_id=child.id,
        conversation_id=conv.id,
        user_message=payload.message,
        assistant_message=assistant_message,
    )
    db.add(chat_msg)
    db.commit()
    db.refresh(chat_msg)

    conv.updated_at = datetime.utcnow()
    db.commit()

    if need_summary and not conv.summary:
        try:
            summary_messages = [
                {"role": "system", "content": "Summarize this conversation between a parent and a pediatric assistant in 2-3 sentences."},
            ]
            for msg in messages[:-1]:
                summary_messages.append({"role": "user", "content": msg.user_message})
                summary_messages.append({"role": "assistant", "content": msg.assistant_message})
            summary_resp = client.chat.completions.create(
                model=settings.groq_model,
                messages=summary_messages,
            )
            if summary_resp.choices[0].message.content:
                conv.summary = summary_resp.choices[0].message.content.strip()
                db.commit()
        except Exception:
            logger.exception("Summary generation failed")

    return ChatResponse(
        id=chat_msg.id,
        childId=chat_msg.child_id,
        userMessage=chat_msg.user_message,
        assistantMessage=chat_msg.assistant_message,
        createdAt=chat_msg.created_at,
    )


@router.get("/history", response_model=list[ChatHistoryItem])
def chat_history(
    conversationId: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_conversation_or_404(conversationId, current_user, db)
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == conversationId)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return [
        ChatHistoryItem(
            id=m.id,
            userMessage=m.user_message,
            assistantMessage=m.assistant_message,
            createdAt=m.created_at,
        )
        for m in messages
    ]


@router.post("/analyze-growth", response_model=GrowthAnalysisResponse)
def analyze_growth(
    payload: GrowthAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    child = get_child_or_404(payload.childId, current_user, db)
    child_context = build_child_context(child, db)

    analysis_prompt = (
        "You are a pediatric growth analyst. Based on the child's growth data below, "
        "provide a brief, clear analysis (2-4 sentences) of their growth pattern. "
        "Note any concerns (e.g., below 3rd or above 97th percentile, rapid changes) "
        "and general advice. Do not recalculate percentiles or z-scores.\n\n"
        f"Child profile:\n{child_context}"
    )

    try:
        client = get_client()
        response = client.chat.completions.create(
            model=settings.groq_model,
            messages=[{"role": "system", "content": analysis_prompt}],
        )
        analysis = response.choices[0].message.content or "Unable to generate analysis."
    except Exception as e:
        logger.exception("Growth analysis LLM call failed")
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    conv = Conversation(child_id=child.id)
    db.add(conv)
    db.flush()

    user_msg_text = "Analyze my child's growth"
    chat_msg = ChatMessage(
        child_id=child.id,
        conversation_id=conv.id,
        user_message=user_msg_text,
        assistant_message=analysis,
    )
    db.add(chat_msg)
    db.commit()
    db.refresh(chat_msg)

    return GrowthAnalysisResponse(
        conversationId=conv.id,
        analysis=analysis,
        id=chat_msg.id,
        userMessage=user_msg_text,
        assistantMessage=analysis,
        createdAt=chat_msg.created_at,
    )
