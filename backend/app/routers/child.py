from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Child
from app.schemas import ChildCreate, ChildUpdate, ChildResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/child", tags=["child"])


@router.get("", response_model=ChildResponse)
def get_child(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    child = db.query(Child).filter(Child.user_id == current_user.id).first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No child profile found")
    return ChildResponse(
        id=child.id,
        name=child.name,
        dateOfBirth=child.date_of_birth,
        sex=child.sex,
        birthWeight=child.birth_weight,
        birthLength=child.birth_length,
        userId=child.user_id,
        createdAt=child.created_at,
    )


@router.post("", response_model=ChildResponse)
def create_child(payload: ChildCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    child = Child(
        user_id=current_user.id,
        name=payload.name,
        date_of_birth=payload.dateOfBirth,
        sex=payload.sex,
        birth_weight=payload.birthWeight,
        birth_length=payload.birthLength,
    )
    db.add(child)
    db.commit()
    db.refresh(child)
    return ChildResponse(
        id=child.id,
        name=child.name,
        dateOfBirth=child.date_of_birth,
        sex=child.sex,
        birthWeight=child.birth_weight,
        birthLength=child.birth_length,
        userId=child.user_id,
        createdAt=child.created_at,
    )


@router.get("/{child_id}", response_model=ChildResponse)
def get_child_by_id(child_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    child = db.query(Child).filter(Child.id == child_id, Child.user_id == current_user.id).first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    return ChildResponse(
        id=child.id,
        name=child.name,
        dateOfBirth=child.date_of_birth,
        sex=child.sex,
        birthWeight=child.birth_weight,
        birthLength=child.birth_length,
        userId=child.user_id,
        createdAt=child.created_at,
    )
