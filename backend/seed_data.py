"""
Seed script: creates user Kalo Queen + child Baby Queen + lots of usage data.
"""

import random
import requests
from datetime import date, timedelta, datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import GrowthRecord, Conversation, ChatMessage, Child, User
from app.auth import hash_password

API_BASE = "http://localhost:8000/api"
EMAIL = "kalo@example.com"
PASSWORD = "123456"
USER_NAME = "Kalo Queen"
CHILD_NAME = "Baby Queen"
CHILD_DOB = date(2024, 6, 12)
CHILD_SEX = "female"
BIRTH_WEIGHT = 3.2
BIRTH_LENGTH = 50.0

CHAT_PROMPTS = [
    "My baby eats very little, what should I do?",
    "What foods are rich in iron for babies?",
    "My 2-year-old is sleeping poorly.",
    "Is my child's growth normal?",
    "How much milk should a 2-year-old drink?",
    "My baby has a fever, what temperature is dangerous?",
    "When do babies start walking?",
    "What vaccines does my child need at 2 years?",
    "My child doesn't want to eat vegetables.",
    "How to deal with baby separation anxiety?",
    "Is it normal for a 2-year-old to only say 10 words?",
    "What are signs of dehydration in toddlers?",
    "How to introduce new foods to a picky eater?",
    "My baby wakes up crying every night.",
    "When should I start potty training?",
    "What are good calcium sources for toddlers?",
    "My child has a rash, should I worry?",
    "How much screen time is OK for a 2-year-old?",
    "What to do if my baby is constipated?",
    "My toddler throws tantrums every day.",
]

CHAT_RESPONSES = [
    "It's common for babies to have fluctuating appetites. Try offering small, frequent meals and focus on nutrient-dense foods. If you're concerned about weight gain, consult your pediatrician.",
    "Iron-rich foods include pureed meats, fortified cereals, spinach, beans, and lentils. Pair with vitamin C (like oranges) to boost absorption.",
    "Establish a consistent bedtime routine: bath, story, quiet time. Avoid screens 1h before bed. If poor sleep persists, check for teething or illness.",
    "Based on the WHO growth charts, steady growth along your child's percentile curve is what matters most. Your pediatrician can assess if growth is on track.",
    "At 2 years, about 2-3 cups (480-720ml) of whole milk per day is recommended. Too much milk can interfere with iron absorption.",
    "A rectal temperature above 100.4°F (38°C) is a fever. For babies under 3 months, any fever needs immediate medical attention.",
    "Most babies take their first steps between 9-15 months. Every child develops at their own pace. Some walk earlier, some later.",
    "Check your country's vaccination schedule. At 2 years, common vaccines include DTaP, MMR, varicella, and polio boosters.",
    "Try offering vegetables in fun shapes, mixed into favorite foods, or as part of a game. Keep offering without pressure.",
    "Separation anxiety peaks around 12-18 months. Practice short separations, maintain consistency, and reassure your child you'll return.",
    "By 2 years, most children say about 50 words. If you're concerned about speech delay, consult your pediatrician for an evaluation.",
    "Signs include dry mouth, no tears when crying, fewer wet diapers (none for 6h+), and lethargy. Seek medical help if these occur.",
    "Introduce one new food at a time alongside familiar favorites. It can take 10-15 exposures before a child accepts a new food.",
    "Night wakings are normal in babies. Check for hunger, wet diaper, or illness. If persistent, try gentle sleep training methods.",
    "Most children show readiness between 18-24 months. Look for signs like staying dry for 2h, interest in the toilet, and ability to pull pants down.",
    "Good sources: yogurt, cheese, fortified plant milks, tofu, and leafy greens. Aim for about 700mg of calcium per day.",
    "Many childhood rashes are harmless. Check if it fades when pressed, if your child has a fever, or seems unwell. When in doubt, see a doctor.",
    "The AAP recommends no more than 1 hour of quality programming per day for 2-year-olds. Co-viewing and discussing content is beneficial.",
    "Increase fiber (prunes, pears, peas), ensure adequate water intake, and encourage physical activity. Consult your pediatrician if persistent.",
    "Tantrums are normal at this age. Stay calm, acknowledge feelings, set clear limits, and offer choices when possible. They'll grow out of it.",
]


def seed():
    # ── Step 1: Register via API ──
    print("1. Registering user...")
    r = requests.post(f"{API_BASE}/auth/register", json={
        "email": EMAIL,
        "password": PASSWORD,
        "name": USER_NAME,
    })
    if r.status_code not in (200, 400):
        print(f"  Register failed: {r.text}")
        return
    if r.status_code == 400:
        print("  User already exists, logging in...")
        r = requests.post(f"{API_BASE}/auth/login", json={
            "email": EMAIL,
            "password": PASSWORD,
        })
        r.raise_for_status()

    data = r.json()
    token = data["token"]
    user_id = data["user"]["id"]
    print(f"  User ID: {user_id}")

    headers = {"Authorization": f"Bearer {token}"}

    # ── Step 2: Create child via API ──
    print("2. Creating child profile...")
    r = requests.post(f"{API_BASE}/child", json={
        "name": CHILD_NAME,
        "dateOfBirth": CHILD_DOB.isoformat(),
        "sex": CHILD_SEX,
        "birthWeight": BIRTH_WEIGHT,
        "birthLength": BIRTH_LENGTH,
    }, headers=headers)
    if r.status_code == 400:
        # already exists, fetch it
        r2 = requests.get(f"{API_BASE}/child", headers=headers)
        r2.raise_for_status()
        child_id = r2.json()["id"]
        print(f"  Child already exists, ID: {child_id}")
    else:
        r.raise_for_status()
        child_id = r.json()["id"]
        print(f"  Child ID: {child_id}")

    # ── Step 3: Generate growth records ──
    print("3. Generating growth records (36 months)...")
    db: Session = SessionLocal()
    try:
        existing = db.query(GrowthRecord).filter(GrowthRecord.child_id == child_id).count()
        if existing > 0:
            print(f"  {existing} growth records already exist, skipping...")
        else:
            records = []
            # Birth to 3 years, roughly monthly
            for months in range(0, 37):
                d = date(2024, 6, 12) + timedelta(days=months * 30)
                if d > date.today():
                    break
                # Realistic WHO-based growth curves for female child
                weight = _sim_weight(months, BIRTH_WEIGHT)
                height = _sim_height(months, BIRTH_LENGTH)
                records.append(GrowthRecord(
                    child_id=child_id,
                    date=d,
                    weight=round(weight + random.uniform(-0.3, 0.3), 2),
                    height=round(height + random.uniform(-0.5, 0.5), 1),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                ))
            db.bulk_save_objects(records)
            db.commit()
            print(f"  Inserted {len(records)} growth records")

        # ── Step 4: Generate conversations ──
        print("4. Generating conversations...")
        existing_convos = db.query(Conversation).filter(Conversation.child_id == child_id).count()
        if existing_convos >= 5:
            print(f"  {existing_convos} conversations already exist, skipping...")
        else:
            num_convos = 5
            convos_to_create = num_convos - existing_convos
            for i in range(convos_to_create):
                conv = Conversation(
                    child_id=child_id,
                    title=f"Consultation #{i + 1}",
                    created_at=datetime.utcnow() - timedelta(days=convos_to_create - i, hours=random.randint(1, 12)),
                    updated_at=datetime.utcnow() - timedelta(days=convos_to_create - i, hours=random.randint(1, 12)),
                )
                db.add(conv)
                db.flush()

                num_msgs = random.randint(3, 6)
                used = set()
                for m in range(num_msgs):
                    idx = random.randint(0, len(CHAT_PROMPTS) - 1)
                    while idx in used and len(used) < len(CHAT_PROMPTS):
                        idx = random.randint(0, len(CHAT_PROMPTS) - 1)
                    used.add(idx)
                    msg = ChatMessage(
                        child_id=child_id,
                        conversation_id=conv.id,
                        user_message=CHAT_PROMPTS[idx],
                        assistant_message=CHAT_RESPONSES[idx],
                        created_at=conv.created_at + timedelta(minutes=m * random.randint(2, 30)),
                    )
                    db.add(msg)
                print(f"  Created conversation '{conv.title}' with {num_msgs} messages")
            db.commit()
        print("Done!")
    finally:
        db.close()


def _sim_weight(months: int, birth_kg: float) -> float:
    """Simulate realistic weight for a female child (0-36 months)."""
    # Typical weight curves: double birth weight by ~5 months, triple by ~12 months
    if months <= 1:
        return birth_kg + months * 0.15
    elif months <= 6:
        return birth_kg + 0.5 + (months - 1) * 0.12
    elif months <= 12:
        return birth_kg + 1.1 + (months - 6) * 0.08
    elif months <= 24:
        return birth_kg + 1.6 + (months - 12) * 0.05
    else:
        return birth_kg + 2.2 + (months - 24) * 0.04


def _sim_height(months: int, birth_cm: float) -> float:
    """Simulate realistic height for a female child (0-36 months)."""
    if months <= 1:
        return birth_cm + months * 0.8
    elif months <= 6:
        return birth_cm + 0.8 + (months - 1) * 0.6
    elif months <= 12:
        return birth_cm + 3.8 + (months - 6) * 0.35
    elif months <= 24:
        return birth_cm + 5.9 + (months - 12) * 0.25
    else:
        return birth_cm + 8.9 + (months - 24) * 0.15


if __name__ == "__main__":
    seed()
