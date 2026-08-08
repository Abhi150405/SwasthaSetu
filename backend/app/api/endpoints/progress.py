from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import datetime, time
from pydantic import BaseModel
from beanie import PydanticObjectId

from app.models.user import User
from app.models.progress import ProgressTracker, MealLog
from app.models.consultation import Consultation
from app.models.dietplan import DietPlan
from app.core.security import get_current_user

router = APIRouter()

class WaterIntakeRequest(BaseModel):
    amount: float
    date: Optional[str] = None

class MealTakenRequest(BaseModel):
    meal_type: str
    date: Optional[str] = None

class ProgressTargetsRequest(BaseModel):
    patient_id: str
    target_water_ml: Optional[float] = None
    target_calories: Optional[float] = None

@router.put("/targets")
async def update_patient_targets(
    payload: ProgressTargetsRequest,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can update patient health targets.")

    try:
        patient_oid = PydanticObjectId(payload.patient_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid patient ID")

    now = datetime.now()
    start_of_day = datetime.combine(now.date(), time.min)
    end_of_day = datetime.combine(now.date(), time.max)

    progress = await ProgressTracker.find_one(
        ProgressTracker.patient == patient_oid,
        ProgressTracker.date >= start_of_day,
        ProgressTracker.date <= end_of_day
    )

    if not progress:
        latest_diet = await DietPlan.find(
            DietPlan.patient == patient_oid
        ).sort("-createdAt").first_or_none()
        diet_id = latest_diet.id if latest_diet else patient_oid

        progress = ProgressTracker(
            patient=patient_oid,
            diet_plan=diet_id,
            date=start_of_day,
            water_intake_ml=0,
            target_water_ml=payload.target_water_ml or 2500,
            target_calories=payload.target_calories or 2000,
            updated_at=now,
            meal_log=[
                MealLog(meal_type="breakfast", status="pending"),
                MealLog(meal_type="lunch", status="pending"),
                MealLog(meal_type="dinner", status="pending")
            ]
        )
        await progress.insert()
    else:
        if payload.target_water_ml is not None:
            progress.target_water_ml = payload.target_water_ml
        if payload.target_calories is not None:
            progress.target_calories = payload.target_calories
        progress.updated_at = now
        await progress.save()

    return {"success": True, "data": progress, "message": "Patient targets updated successfully."}

@router.get("/today")
async def get_progress_today(
    date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    if date:
        try:
            query_date = datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            query_date = datetime.now()
    else:
        query_date = datetime.now()
        
    start_of_day = datetime.combine(query_date.date(), time.min)
    end_of_day = datetime.combine(query_date.date(), time.max)

    progress = await ProgressTracker.find_one(
        ProgressTracker.patient == current_user.id,
        ProgressTracker.date >= start_of_day,
        ProgressTracker.date <= end_of_day
    )

    if not progress:
        latest_diet = await DietPlan.find(
            DietPlan.patient == current_user.id
        ).sort("-createdAt").first_or_none()

        diet_id = latest_diet.id if latest_diet else current_user.id

        progress = ProgressTracker(
            patient=current_user.id,
            diet_plan=diet_id,
            date=start_of_day,
            water_intake_ml=0,
            target_water_ml=2500,
            target_calories=2000,
            meal_log=[
                MealLog(meal_type="breakfast", status="pending"),
                MealLog(meal_type="lunch", status="pending"),
                MealLog(meal_type="dinner", status="pending")
            ]
        )
        await progress.insert()

    # Look up assigned/consultation doctor's name
    doctor_name = "Dr. Sharma"
    patient = await User.get(current_user.id, with_children=True)
    if patient and getattr(patient, "doctorId", None):
        doc = await User.get(patient.doctorId, with_children=True)
        if doc:
            doctor_name = doc.name

    if doctor_name == "Dr. Sharma":
        consultation = await Consultation.find_one(
            Consultation.patientId == current_user.id
        )
        if consultation and consultation.doctorId:
            doc = await User.get(consultation.doctorId, with_children=True)
            if doc:
                doctor_name = doc.name

    prog_dict = progress.model_dump()
    prog_dict["_id"] = str(progress.id)
    prog_dict["id"] = str(progress.id)
    prog_dict["target_water_ml"] = getattr(progress, "target_water_ml", 2500) or 2500
    prog_dict["target_calories"] = getattr(progress, "target_calories", 2000) or 2000
    prog_dict["doctor_name"] = doctor_name

    return {"success": True, "data": prog_dict, "message": "Progress fetched successfully."}

@router.get("/history")
async def get_patient_history(
    limit: int = Query(7),
    patient_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    target_id = current_user.id
    if patient_id:
        if current_user.role != "doctor":
            raise HTTPException(status_code=403, detail="Not authorized")
        target_id = PydanticObjectId(patient_id)

    history = await ProgressTracker.find(
        ProgressTracker.patient == target_id
    ).sort("-date").limit(limit).to_list()

    return {"success": True, "data": history, "message": "Patient history fetched successfully."}

@router.post("/water")
async def update_water_intake(
    payload: WaterIntakeRequest,
    current_user: User = Depends(get_current_user)
):
    if not payload.amount:
        raise HTTPException(status_code=400, detail="Water amount is required")

    if payload.date:
        try:
            query_date = datetime.strptime(payload.date, "%Y-%m-%d")
        except ValueError:
            query_date = datetime.now()
    else:
        query_date = datetime.now()

    start_of_day = datetime.combine(query_date.date(), time.min)
    end_of_day = datetime.combine(query_date.date(), time.max)

    progress = await ProgressTracker.find_one(
        ProgressTracker.patient == current_user.id,
        ProgressTracker.date >= start_of_day,
        ProgressTracker.date <= end_of_day
    )

    if not progress:
        latest_diet = await DietPlan.find(
            DietPlan.patient == current_user.id
        ).sort("-createdAt").first_or_none()
        
        diet_id = latest_diet.id if latest_diet else current_user.id

        now = datetime.now()
        progress = ProgressTracker(
            patient=current_user.id,
            diet_plan=diet_id,
            date=start_of_day,
            water_intake_ml=payload.amount,
            water_updated_at=now,
            updated_at=now,
            meal_log=[
                MealLog(meal_type="breakfast", status="pending"),
                MealLog(meal_type="lunch", status="pending"),
                MealLog(meal_type="dinner", status="pending")
            ]
        )
        await progress.insert()
    else:
        now = datetime.now()
        progress.water_intake_ml += payload.amount
        progress.water_updated_at = now
        progress.updated_at = now
        await progress.save()

    return {"success": True, "data": progress, "message": "Water intake updated."}

@router.post("/meal")
async def mark_meal_taken(
    payload: MealTakenRequest,
    current_user: User = Depends(get_current_user)
):
    if not payload.meal_type:
        raise HTTPException(status_code=400, detail="Meal type is required")

    if payload.date:
        try:
            query_date = datetime.strptime(payload.date, "%Y-%m-%d")
        except ValueError:
            query_date = datetime.now()
    else:
        query_date = datetime.now()

    start_of_day = datetime.combine(query_date.date(), time.min)
    end_of_day = datetime.combine(query_date.date(), time.max)

    progress = await ProgressTracker.find_one(
        ProgressTracker.patient == current_user.id,
        ProgressTracker.date >= start_of_day,
        ProgressTracker.date <= end_of_day
    )

    now = datetime.now()

    if not progress:
        latest_diet = await DietPlan.find(
            DietPlan.patient == current_user.id
        ).sort("-createdAt").first_or_none()
        
        diet_id = latest_diet.id if latest_diet else current_user.id

        progress = ProgressTracker(
            patient=current_user.id,
            diet_plan=diet_id,
            date=start_of_day,
            updated_at=now,
            meal_log=[
                MealLog(meal_type="breakfast", status="completed" if payload.meal_type == "breakfast" else "pending", acknowledged_at=now if payload.meal_type == "breakfast" else None),
                MealLog(meal_type="lunch", status="completed" if payload.meal_type == "lunch" else "pending", acknowledged_at=now if payload.meal_type == "lunch" else None),
                MealLog(meal_type="dinner", status="completed" if payload.meal_type == "dinner" else "pending", acknowledged_at=now if payload.meal_type == "dinner" else None)
            ]
        )
        await progress.insert()
    else:
        found = False
        for m in progress.meal_log:
            if m.meal_type == payload.meal_type:
                m.status = "completed" if m.status != "completed" else "pending"
                m.acknowledged_at = now if m.status == "completed" else None
                found = True
                break
        if not found:
            progress.meal_log.append(MealLog(meal_type=payload.meal_type, status="completed", acknowledged_at=now))
        progress.updated_at = now
        await progress.save()

    return {"success": True, "data": progress, "message": f"{payload.meal_type} status updated."}
