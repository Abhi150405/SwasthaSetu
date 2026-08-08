import os
from fastapi import APIRouter, HTTPException, Response, Request, Depends, status

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timezone
import jwt
from beanie import PydanticObjectId

from app.models.user import User, Patient, Doctor
from app.core.security import (
    create_access_token, 
    create_refresh_token, 
    get_current_user,
    pwd_context
)
from app.core.config import settings

from pymongo.errors import DuplicateKeyError

router = APIRouter()

class RegisterPatientRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    dob: datetime
    gender: str
    contact: str
    ayurvedic_category: str
    mode: str
    address: Optional[dict] = None
    diseases: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    medical_history_url: Optional[str] = None
    documents: Optional[List[dict]] = None


class RegisterDoctorRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    dob: datetime
    gender: str
    contact: str
    licenseNo: str
    hospital: str
    specialty: str
    phone: str
    address: Optional[dict] = None
    bio: Optional[str] = ""

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    samesite_val = "none"
    secure_val = True

    response.set_cookie(
        key="accessToken",
        value=access_token,
        httponly=True,
        secure=secure_val,
        samesite=samesite_val,
        max_age=15 * 60  # 15 minutes
    )
    
    response.set_cookie(
        key="refreshToken",
        value=refresh_token,
        httponly=True,
        secure=secure_val,
        samesite=samesite_val,
        max_age=7 * 24 * 60 * 60  # 7 days
    )

def clear_auth_cookies(response: Response):
    samesite_val = "none"
    secure_val = True

    response.delete_cookie(key="accessToken", secure=secure_val, samesite=samesite_val)
    response.delete_cookie(key="refreshToken", secure=secure_val, samesite=samesite_val)


@router.post("/register/patient")
async def register_patient(payload: RegisterPatientRequest, response: Response):
    existing_user = await User.find_one({"email": payload.email}, with_children=True)
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists with this email")
    
    patient = Patient(
        name=payload.name,
        email=payload.email,
        password=User.get_password_hash(payload.password),
        dob=payload.dob,
        gender=payload.gender,
        contact=payload.contact,
        role="patient",
        ayurvedic_category=payload.ayurvedic_category,
        mode=payload.mode,
        diseases=payload.diseases or [],
        allergies=payload.allergies or [],
        height=payload.height,
        weight=payload.weight,
        medical_history_url=payload.medical_history_url,
        documents=payload.documents or []
    )

    if payload.address:
        patient.address = [payload.address]

    try:
        await patient.insert()
        
        access_token = create_access_token(patient)
        refresh_token = create_refresh_token(patient)
        
        patient.refreshToken = User.get_password_hash(refresh_token[:70])
        await patient.save()
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="User already exists with this email")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")
    
    set_auth_cookies(response, access_token, refresh_token)
    
    return {"message": "Patient registered successfully", "user": {"id": str(patient.id), "name": patient.name, "email": patient.email, "role": patient.role}}

@router.post("/register/doctor")
async def register_doctor(payload: RegisterDoctorRequest, response: Response):
    existing_user = await User.find_one({"email": payload.email}, with_children=True)
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists with this email")
    
    doctor = Doctor(
        name=payload.name,
        email=payload.email,
        password=User.get_password_hash(payload.password),
        dob=payload.dob,
        gender=payload.gender,
        contact=payload.contact,
        role="doctor",
        licenseNo=payload.licenseNo,
        hospital=payload.hospital,
        specialty=payload.specialty,
        phone=payload.phone,
        bio=payload.bio or ""
    )
    if payload.address:
        doctor.address = [payload.address]

    try:
        await doctor.insert()
        
        access_token = create_access_token(doctor)
        refresh_token = create_refresh_token(doctor)
        
        doctor.refreshToken = User.get_password_hash(refresh_token[:70])
        await doctor.save()
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="User already exists with this email")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")
    
    set_auth_cookies(response, access_token, refresh_token)
    
    return {"message": "Doctor registered successfully", "user": {"id": str(doctor.id), "name": doctor.name, "email": doctor.email, "role": doctor.role}}

@router.post("/login")
async def login(payload: LoginRequest, response: Response):
    clean_email = str(payload.email).strip().lower()
    user = await User.find_one({"email": clean_email}, with_children=True)
    if not user:
        import re
        user = await User.find_one({"email": {"$regex": f"^{re.escape(clean_email)}$", "$options": "i"}}, with_children=True)

    if not user or not user.verify_password(payload.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user)
    
    user.refreshToken = User.get_password_hash(refresh_token[:70])
    await user.save()
    
    set_auth_cookies(response, access_token, refresh_token)
    
    return {"message": "Login successful", "user": {"id": str(user.id), "name": user.name, "email": user.email, "role": user.role}}


@router.post("/logout")
async def logout(response: Response, current_user: User = Depends(get_current_user)):
    current_user.refreshToken = None
    await current_user.save()
    
    response.delete_cookie("accessToken")
    response.delete_cookie("refreshToken")
    
    return {"message": "Logged out successfully"}

@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refreshToken")
    if not token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
    
    try:
        payload = jwt.decode(token, settings.REFRESH_TOKEN_SECRET, algorithms=["HS256"])
        user_id = payload.get("_id")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    user = await User.get(PydanticObjectId(user_id), with_children=True)
    if not user or not user.refreshToken:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    # Verify hashed refresh token
    if not pwd_context.verify(token[:70], user.refreshToken):
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    # Rotate token
    new_access_token = create_access_token(user)
    new_refresh_token = create_refresh_token(user)
    
    user.refreshToken = User.get_password_hash(new_refresh_token[:70])
    await user.save()
    
    set_auth_cookies(response, new_access_token, new_refresh_token)
    
    return {"message": "Token refreshed successfully"}

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    # Safely return user without exposing password/hashed tokens
    user_dict = current_user.model_dump(exclude={"password", "refreshToken"})
    user_dict["id"] = str(current_user.id)
    return user_dict

@router.put("/notifications-seen")
async def mark_notifications_seen(current_user: User = Depends(get_current_user)):
    current_user.lastNotificationsSeenAt = datetime.now(timezone.utc)
    await current_user.save()
    return {"success": True, "lastNotificationsSeenAt": current_user.lastNotificationsSeenAt}
