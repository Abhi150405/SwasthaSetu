from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from beanie import PydanticObjectId

from app.models.consultation import Consultation
from app.models.user import User, Doctor, Patient
from app.core.security import get_current_user

router = APIRouter()

class RequestConsultationPayload(BaseModel):
    doctorId: str
    symptoms: Optional[str] = ""
    notes: Optional[str] = ""
    patientName: Optional[str] = None
    patientDosha: Optional[str] = None

class UpdateStatusPayload(BaseModel):
    status: str
    notes: Optional[str] = None

async def format_consultation(c: Consultation) -> dict:
    c_dict = c.model_dump()
    c_dict["_id"] = str(c.id)
    c_dict["id"] = str(c.id)
    c_dict["patientId"] = str(c.patientId)

    if c.doctorId:
        try:
            doc = await User.get(c.doctorId, with_children=True)
            if doc:
                c_dict["doctorId"] = {
                    "_id": str(doc.id),
                    "id": str(doc.id),
                    "name": doc.name,
                    "specialty": getattr(doc, "specialty", "General Medicine"),
                    "hospital": getattr(doc, "hospital", "City Hospital"),
                    "rating": getattr(doc, "rating", 4.8)
                }
            else:
                c_dict["doctorId"] = str(c.doctorId)
        except Exception:
            c_dict["doctorId"] = str(c.doctorId)
    return c_dict

@router.post("/request")
async def request_consultation(
    payload: RequestConsultationPayload,
    current_user: User = Depends(get_current_user)
):
    try:
        doc_id = PydanticObjectId(payload.doctorId)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid doctor ID format"
        )

    doctor = await Doctor.get(doc_id)
    if not doctor:
        doctor = await User.get(doc_id)
        if not doctor or doctor.role != "doctor":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found"
            )

    patient_name = payload.patientName or current_user.name
    patient_dosha = payload.patientDosha or getattr(current_user, "ayurvedic_category", None)

    consultation = Consultation(
        patientId=current_user.id,
        doctorId=doc_id,
        status="pending",
        patientName=patient_name,
        patientDosha=patient_dosha,
        symptoms=payload.symptoms or "",
        notes=payload.notes or ""
    )

    await consultation.create()

    return {"success": True, "data": await format_consultation(consultation)}

@router.get("/doctor")
async def get_doctor_consultations(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can view doctor consultations"
        )

    query = {"doctorId": current_user.id}
    if status_filter:
        query["status"] = status_filter

    consultations = await Consultation.find(query).to_list()
    data = [await format_consultation(c) for c in consultations]

    return {"success": True, "data": data}

@router.get("/patient")
async def get_patient_consultations(
    current_user: User = Depends(get_current_user)
):
    consultations = await Consultation.find({"patientId": current_user.id}).to_list()
    data = [await format_consultation(c) for c in consultations]

    return {"success": True, "data": data}

@router.put("/{consultation_id}/status")
async def update_consultation_status(
    consultation_id: str,
    payload: UpdateStatusPayload,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can update consultation status"
        )

    allowed_statuses = ["pending", "accepted", "rejected", "completed"]
    if payload.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Status must be one of {allowed_statuses}"
        )

    try:
        c_id = PydanticObjectId(consultation_id)
        consultation = await Consultation.get(c_id)
    except Exception:
        consultation = None

    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found"
        )

    if consultation.doctorId != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update this consultation status"
        )

    consultation.status = payload.status
    if payload.notes is not None:
        consultation.notes = payload.notes

    await consultation.save()

    return {"success": True, "data": await format_consultation(consultation)}
