import uuid
from datetime import date, datetime, time
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models.location import Location
from app.models.plan import Plan
from app.models.plan_activity import PlanActivity
from app.models.plan_member import PlanMember
from app.models.user import User
from app.services.database import get_db

plan_router = APIRouter(prefix="/plans", tags=["Plans"])


# ── Request Schemas ───────────────────────────────────────────────────────────

class CreatePlanRequest(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: date
    end_date: date


class UpdatePlanRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class AddMemberRequest(BaseModel):
    user_email: str
    role: str = "editor"  # "editor" or "viewer"


class CreateActivityRequest(BaseModel):
    location_id: Optional[uuid.UUID] = None
    activity_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    notes: Optional[str] = None
    order_index: int


class UpdateActivityRequest(BaseModel):
    location_id: Optional[uuid.UUID] = None
    activity_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    notes: Optional[str] = None
    order_index: Optional[int] = None


# ── Response Schemas ──────────────────────────────────────────────────────────

class LocationBrief(BaseModel):
    id: uuid.UUID
    name: Optional[str]
    city: Optional[str]
    country: Optional[str]
    category: Optional[str]
    avg_rating: Optional[float]

    class Config:
        from_attributes = True


class ActivityResponse(BaseModel):
    id: uuid.UUID
    order_index: int
    activity_date: date
    start_time: Optional[time]
    end_time: Optional[time]
    notes: Optional[str]
    location: Optional[LocationBrief]


class DayResponse(BaseModel):
    date: date
    activities: List[ActivityResponse]


class MemberResponse(BaseModel):
    user_id: uuid.UUID
    email: Optional[str]
    full_name: Optional[str]
    avatar_url: Optional[str]
    role: str
    joined_at: datetime


class PlanSummaryResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str]
    owner_id: uuid.UUID
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class PlanDetailResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str]
    owner_id: uuid.UUID
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    created_at: datetime
    members: List[MemberResponse]
    days: List[DayResponse]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _require_auth(request: Request) -> uuid.UUID:
    user = request.state.user
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return uuid.UUID(user["user_id"])


def _get_plan_or_404(plan_id: uuid.UUID, db: Session) -> Plan:
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return plan


def _get_member_or_403(plan_id: uuid.UUID, user_id: uuid.UUID, db: Session) -> PlanMember:
    member = db.query(PlanMember).filter(
        PlanMember.plan_id == plan_id, PlanMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this plan")
    return member


def _to_activity_response(act: PlanActivity, db: Session) -> ActivityResponse:
    location = None
    if act.location_id:
        loc = db.query(Location).filter(Location.id == act.location_id).first()
        if loc:
            location = LocationBrief.model_validate(loc)
    return ActivityResponse(
        id=act.id,
        order_index=act.order_index,
        activity_date=act.activity_date.date() if isinstance(act.activity_date, datetime) else act.activity_date,
        start_time=act.start_time.time() if isinstance(act.start_time, datetime) else act.start_time,
        end_time=act.end_time.time() if isinstance(act.end_time, datetime) else act.end_time,
        notes=act.notes,
        location=location,
    )


def _build_days(activities: List[PlanActivity], db: Session) -> List[DayResponse]:
    days: Dict[date, List[ActivityResponse]] = {}
    for act in activities:
        resp = _to_activity_response(act, db)
        days.setdefault(resp.activity_date, []).append(resp)
    return [
        DayResponse(date=d, activities=sorted(acts, key=lambda a: a.order_index))
        for d, acts in sorted(days.items())
    ]


def _get_members(plan_id: uuid.UUID, db: Session) -> List[MemberResponse]:
    rows = (
        db.query(PlanMember, User)
        .join(User, PlanMember.user_id == User.id)
        .filter(PlanMember.plan_id == plan_id)
        .all()
    )
    return [
        MemberResponse(
            user_id=m.user_id,
            email=u.email,
            full_name=u.full_name,
            avatar_url=u.avatar_url,
            role=m.role,
            joined_at=m.joined_at,
        )
        for m, u in rows
    ]


# ── Plan CRUD ─────────────────────────────────────────────────────────────────

@plan_router.post("/", response_model=PlanSummaryResponse, status_code=status.HTTP_201_CREATED)
def create_plan(body: CreatePlanRequest, request: Request, db: Session = Depends(get_db)):
    user_id = _require_auth(request)
    plan = Plan(
        title=body.title,
        description=body.description,
        owner_id=user_id,
        start_date=datetime.combine(body.start_date, time.min),
        end_date=datetime.combine(body.end_date, time.min),
    )
    db.add(plan)
    db.flush()
    db.add(PlanMember(plan_id=plan.id, user_id=user_id, role="owner"))
    db.commit()
    db.refresh(plan)
    return plan


@plan_router.get("/", response_model=List[PlanSummaryResponse])
def list_my_plans(request: Request, db: Session = Depends(get_db)):
    user_id = _require_auth(request)
    plan_ids = db.query(PlanMember.plan_id).filter(PlanMember.user_id == user_id).subquery()
    return db.query(Plan).filter(Plan.id.in_(plan_ids)).order_by(Plan.created_at.desc()).all()


@plan_router.get("/{plan_id}", response_model=PlanDetailResponse)
def get_plan(plan_id: uuid.UUID, request: Request, db: Session = Depends(get_db)):
    user_id = _require_auth(request)
    plan = _get_plan_or_404(plan_id, db)
    _get_member_or_403(plan_id, user_id, db)

    activities = (
        db.query(PlanActivity)
        .filter(PlanActivity.plan_id == plan_id)
        .order_by(PlanActivity.activity_date, PlanActivity.order_index)
        .all()
    )

    return PlanDetailResponse(
        id=plan.id,
        title=plan.title,
        description=plan.description,
        owner_id=plan.owner_id,
        start_date=plan.start_date,
        end_date=plan.end_date,
        created_at=plan.created_at,
        members=_get_members(plan_id, db),
        days=_build_days(activities, db),
    )


@plan_router.put("/{plan_id}", response_model=PlanSummaryResponse)
def update_plan(plan_id: uuid.UUID, body: UpdatePlanRequest, request: Request, db: Session = Depends(get_db)):
    user_id = _require_auth(request)
    plan = _get_plan_or_404(plan_id, db)
    _get_member_or_403(plan_id, user_id, db)

    if body.title is not None:
        plan.title = body.title
    if body.description is not None:
        plan.description = body.description
    if body.start_date is not None:
        plan.start_date = datetime.combine(body.start_date, time.min)
    if body.end_date is not None:
        plan.end_date = datetime.combine(body.end_date, time.min)

    db.commit()
    db.refresh(plan)
    return plan


@plan_router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(plan_id: uuid.UUID, request: Request, db: Session = Depends(get_db)):
    user_id = _require_auth(request)
    plan = _get_plan_or_404(plan_id, db)
    member = _get_member_or_403(plan_id, user_id, db)

    if member.role != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can delete this plan")

    db.query(PlanActivity).filter(PlanActivity.plan_id == plan_id).delete()
    db.query(PlanMember).filter(PlanMember.plan_id == plan_id).delete()
    db.delete(plan)
    db.commit()


# ── Member Management ─────────────────────────────────────────────────────────

@plan_router.post("/{plan_id}/members", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
def add_member(plan_id: uuid.UUID, body: AddMemberRequest, request: Request, db: Session = Depends(get_db)):
    user_id = _require_auth(request)
    _get_plan_or_404(plan_id, db)
    requester = _get_member_or_403(plan_id, user_id, db)

    if requester.role != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can add members")

    target = db.query(User).filter(User.email == body.user_email).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    already_member = db.query(PlanMember).filter(
        PlanMember.plan_id == plan_id, PlanMember.user_id == target.id
    ).first()
    if already_member:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already a member")

    new_member = PlanMember(plan_id=plan_id, user_id=target.id, role=body.role)
    db.add(new_member)
    db.commit()
    db.refresh(new_member)

    return MemberResponse(
        user_id=new_member.user_id,
        email=target.email,
        full_name=target.full_name,
        avatar_url=target.avatar_url,
        role=new_member.role,
        joined_at=new_member.joined_at,
    )


@plan_router.delete("/{plan_id}/members/{target_user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    plan_id: uuid.UUID, target_user_id: uuid.UUID, request: Request, db: Session = Depends(get_db)
):
    user_id = _require_auth(request)
    _get_plan_or_404(plan_id, db)
    requester = _get_member_or_403(plan_id, user_id, db)

    if requester.role != "owner" and user_id != target_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can remove other members")

    target_membership = db.query(PlanMember).filter(
        PlanMember.plan_id == plan_id, PlanMember.user_id == target_user_id
    ).first()
    if not target_membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    if target_membership.role == "owner":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove the owner from the plan")

    db.delete(target_membership)
    db.commit()


# ── Activity Management ───────────────────────────────────────────────────────

@plan_router.post("/{plan_id}/activities", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
def add_activity(plan_id: uuid.UUID, body: CreateActivityRequest, request: Request, db: Session = Depends(get_db)):
    user_id = _require_auth(request)
    _get_plan_or_404(plan_id, db)
    _get_member_or_403(plan_id, user_id, db)

    activity = PlanActivity(
        plan_id=plan_id,
        location_id=body.location_id,
        activity_date=datetime.combine(body.activity_date, time.min),
        start_time=datetime.combine(body.activity_date, body.start_time) if body.start_time else None,
        end_time=datetime.combine(body.activity_date, body.end_time) if body.end_time else None,
        notes=body.notes,
        order_index=body.order_index,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return _to_activity_response(activity, db)


@plan_router.put("/{plan_id}/activities/{activity_id}", response_model=ActivityResponse)
def update_activity(
    plan_id: uuid.UUID,
    activity_id: uuid.UUID,
    body: UpdateActivityRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    user_id = _require_auth(request)
    _get_plan_or_404(plan_id, db)
    _get_member_or_403(plan_id, user_id, db)

    activity = db.query(PlanActivity).filter(
        PlanActivity.id == activity_id, PlanActivity.plan_id == plan_id
    ).first()
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

    if body.location_id is not None:
        activity.location_id = body.location_id
    if body.notes is not None:
        activity.notes = body.notes
    if body.order_index is not None:
        activity.order_index = body.order_index

    effective_date = body.activity_date or (
        activity.activity_date.date() if isinstance(activity.activity_date, datetime) else activity.activity_date
    )
    if body.activity_date is not None:
        activity.activity_date = datetime.combine(body.activity_date, time.min)
    if body.start_time is not None:
        activity.start_time = datetime.combine(effective_date, body.start_time)
    if body.end_time is not None:
        activity.end_time = datetime.combine(effective_date, body.end_time)

    db.commit()
    db.refresh(activity)
    return _to_activity_response(activity, db)


@plan_router.delete("/{plan_id}/activities/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(
    plan_id: uuid.UUID, activity_id: uuid.UUID, request: Request, db: Session = Depends(get_db)
):
    user_id = _require_auth(request)
    _get_plan_or_404(plan_id, db)
    _get_member_or_403(plan_id, user_id, db)

    activity = db.query(PlanActivity).filter(
        PlanActivity.id == activity_id, PlanActivity.plan_id == plan_id
    ).first()
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

    db.delete(activity)
    db.commit()