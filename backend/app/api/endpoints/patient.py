from fastapi import APIRouter, Depends, HTTPException
from beanie import PydanticObjectId
from app.models.user import User, Patient
from app.core.security import get_current_user

router = APIRouter()

@router.get("/profile/{patient_id}")
async def get_patient_profile(patient_id: str, current_user: User = Depends(get_current_user)):
    try:
        patient = await Patient.get(PydanticObjectId(patient_id))
    except Exception:
        patient = None

    if not patient:
        # Fall back to current user if matches
        if str(current_user.id) == patient_id:
            patient = current_user
        else:
            raise HTTPException(status_code=404, detail="Patient profile not found")

    if current_user.role == "patient" and str(current_user.id) != str(patient.id):
        raise HTTPException(status_code=403, detail="Not authorized to view this profile")

    patient_dict = patient.model_dump(exclude={"password", "refreshToken"})
    patient_dict["_id"] = str(patient.id)
    patient_dict["id"] = str(patient.id)
    return {"success": True, "data": patient_dict}

@router.put("/profile/{patient_id}")
async def update_patient_profile(patient_id: str, data: dict, current_user: User = Depends(get_current_user)):
    try:
        patient = await Patient.get(PydanticObjectId(patient_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Patient not found")

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if current_user.role == "patient" and str(current_user.id) != str(patient.id):
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")

    # Update allowed fields
    for field in ["name", "contact", "gender", "height", "weight", "ayurvedic_category", "medical_history_url", "documents", "allergies", "diseases", "medical_history"]:
        if field in data and data[field] is not None:
            val = data[field]
            if field in ["allergies", "diseases", "medical_history"] and isinstance(val, str):
                val = [s.strip() for s in val.split(",") if s.strip()] if val.strip() else []
            setattr(patient, field, val)



    await patient.save()
    patient_dict = patient.model_dump(exclude={"password", "refreshToken"})
    patient_dict["_id"] = str(patient.id)
    return {"success": True, "data": patient_dict}
