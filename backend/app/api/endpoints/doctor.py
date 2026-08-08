from typing import List, Optional, Union
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from beanie import PydanticObjectId

from app.models.user import User, Patient, Doctor, Address
from app.models.consultation import Consultation
from app.core.security import get_current_user

router = APIRouter()

class AddressInput(BaseModel):
    city: Optional[str] = ""
    state: Optional[str] = ""
    country: Optional[str] = ""

class CreatePatientRequest(BaseModel):
    name: str
    email: EmailStr
    gender: str
    dob: str
    contact: str
    address: Optional[Union[AddressInput, dict]] = None
    height: Optional[Union[float, str]] = None
    weight: Optional[Union[float, str]] = None
    ayurvedic_category: str = "vata"
    allergies: Optional[Union[List[str], str]] = None
    diseases: Optional[Union[List[str], str]] = None
    password: Optional[str] = "Patient@123"

@router.get("/all")
async def get_all_doctors():
    doctors = await Doctor.find_all().to_list()
    
    data = []
    for d in doctors:
        data.append({
            "_id": str(d.id),
            "name": d.name,
            "specialty": getattr(d, 'specialty', 'General Medicine'),
            "rating": getattr(d, 'rating', 4.8)
        })
        
    return {"success": True, "data": data}

@router.put("/profile/{doctor_id}")
async def update_doctor_profile(doctor_id: str, data: dict, current_user: User = Depends(get_current_user)):
    try:
        doctor = await Doctor.get(PydanticObjectId(doctor_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    if not doctor or str(current_user.id) != doctor_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    for field in ["name", "licenseNo", "hospital", "specialty", "phone", "bio"]:
        if field in data and data[field] is not None:
            setattr(doctor, field, data[field])
            
    await doctor.save()
    doc_dict = doctor.model_dump(exclude={"password", "refreshToken"})
    doc_dict["_id"] = str(doctor.id)
    doc_dict["id"] = str(doctor.id)
    return {"success": True, "data": doc_dict}

@router.get("/patients")
async def get_doctor_patients(current_user: User = Depends(get_current_user)):
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can access patient lists"
        )
    
    # 1. Direct patients assigned to this doctor
    direct_patients = await User.find({
        "role": "patient",
        "$or": [
            {"doctorId": current_user.id},
            {"assigned_doctor": current_user.id}
        ]
    }, with_children=True).to_list()
    
    patient_ids = {p.id for p in direct_patients}

    # 2. Patients connected via consultations
    consultations = await Consultation.find(Consultation.doctorId == current_user.id).to_list()
    for c in consultations:
        if c.patientId and c.patientId not in patient_ids:
            try:
                p = await User.get(c.patientId, with_children=True)
                if p:
                    direct_patients.append(p)
                    patient_ids.add(p.id)
            except Exception:
                pass

    # 3. Patients in doctor's linked_patients list
    if hasattr(current_user, "linked_patients") and isinstance(current_user.linked_patients, list):
        for pid in current_user.linked_patients:
            try:
                oid = PydanticObjectId(pid) if isinstance(pid, str) else pid
                if oid not in patient_ids:
                    p = await User.get(oid, with_children=True)
                    if p:
                        direct_patients.append(p)
                        patient_ids.add(p.id)
            except Exception:
                pass

    formatted_patients = []
    for p in direct_patients:
        p_dict = p.model_dump(exclude={"password", "refreshToken"})
        p_dict["_id"] = str(p.id)
        p_dict["id"] = str(p.id)
        if getattr(p, "doctorId", None):
            p_dict["doctorId"] = str(p.doctorId)
        if getattr(p, "assigned_doctor", None):
            p_dict["assigned_doctor"] = str(p.assigned_doctor)
        formatted_patients.append(p_dict)

    return {"success": True, "data": formatted_patients}

import json
import os
import uuid
import cloudinary
import cloudinary.uploader
from fastapi import Request

from app.core.config import settings

async def upload_file_to_cloudinary(file_content: bytes, folder: str, filename: str = "document.pdf") -> Optional[str]:
    # 1. AWS S3 Upload
    aws_key = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret = os.getenv("AWS_SECRET_ACCESS_KEY")
    aws_bucket = os.getenv("AWS_STORAGE_BUCKET_NAME")
    aws_region = os.getenv("AWS_REGION", "us-east-1")

    if aws_key and aws_secret and aws_bucket:
        try:
            import boto3
            s3_client = boto3.client(
                "s3",
                aws_access_key_id=aws_key,
                aws_secret_access_key=aws_secret,
                region_name=aws_region
            )
            ext = os.path.splitext(filename)[1] or ".pdf"
            s3_filename = f"medical_docs/{uuid.uuid4().hex}{ext}"
            s3_client.put_object(
                Bucket=aws_bucket,
                Key=s3_filename,
                Body=file_content,
                ContentType="application/pdf" if ext == ".pdf" else "image/png"
            )
            return f"https://{aws_bucket}.s3.{aws_region}.amazonaws.com/{s3_filename}"
        except Exception as e:
            print(f"AWS S3 upload failed in doctor helper: {e}")

    # 2. Cloudinary Upload
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
        try:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True
            )
            res = cloudinary.uploader.upload(
                file_content,
                resource_type="auto",
                folder=folder
            )
            return res.get("secure_url") or res.get("url") or res.get("public_id")
        except Exception as e:
            print(f"Cloudinary upload failed, saving to local storage: {e}")

    # 3. Fallback to local storage
    upload_dir = os.path.join(os.getcwd(), "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(filename)[1] or ".pdf"
    safe_name = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(upload_dir, safe_name), "wb") as f:
        f.write(file_content)
    return f"/api/files/view/{safe_name}"



@router.post("/patients")
async def create_doctor_patient(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can add new patients"
        )

    content_type = request.headers.get("content-type", "")
    file_bytes = None
    data = {}

    if "multipart/form-data" in content_type:
        form = await request.form()
        for key, val in form.items():
            if hasattr(val, "filename") and val.filename:
                file_bytes = await val.read()
            else:
                data[key] = val
    else:
        try:
            data = await request.json()
        except Exception:
            data = {}

    name = data.get("name")
    email = data.get("email")
    gender = data.get("gender")
    dob = data.get("dob")
    contact = data.get("contact")

    if not name or not email or not gender or not dob or not contact:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required fields (name, email, gender, dob, contact)"
        )

    # Check for existing email
    existing_user = await User.find_one(User.email == email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    # Parse dob
    try:
        if isinstance(dob, datetime):
            dob_dt = dob
        else:
            dob_dt = datetime.fromisoformat(str(dob).replace("Z", "+00:00"))
    except Exception:
        try:
            dob_dt = datetime.strptime(str(dob), "%Y-%m-%d")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format for dob. Use YYYY-MM-DD"
            )

    # Parse height & weight
    height_val = None
    raw_h = data.get("height")
    if raw_h not in (None, ""):
        try:
            height_val = float(raw_h)
        except ValueError:
            pass

    weight_val = None
    raw_w = data.get("weight")
    if raw_w not in (None, ""):
        try:
            weight_val = float(raw_w)
        except ValueError:
            pass

    # Parse allergies & diseases
    allergies = data.get("allergies")
    allergies_list = []
    if isinstance(allergies, str):
        allergies_list = [a.strip() for a in allergies.split(",") if a.strip()]
    elif isinstance(allergies, list):
        allergies_list = allergies

    diseases = data.get("diseases")
    diseases_list = []
    if isinstance(diseases, str):
        diseases_list = [d.strip() for d in diseases.split(",") if d.strip()]
    elif isinstance(diseases, list):
        diseases_list = diseases

    # Parse address
    raw_address = data.get("address")
    address_obj = Address(isDefault=True)
    if raw_address:
        if isinstance(raw_address, str):
            try:
                raw_address = json.loads(raw_address)
            except Exception:
                raw_address = {}
        if isinstance(raw_address, dict):
            address_obj.city = raw_address.get("city")
            address_obj.state = raw_address.get("state")
            address_obj.country = raw_address.get("country")

    # Upload PDF file to Cloudinary if provided
    medical_history_url = None
    if file_bytes and len(file_bytes) > 0:
        if len(file_bytes) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds the 10MB limit."
            )
        try:
            medical_history_url = await upload_file_to_cloudinary(
                file_bytes,
                folder=f"swasthasetu/patients/{current_user.id}"
            )
        except Exception as e:
            print(f"Cloudinary upload error: {e}")

    password_hash = User.get_password_hash(data.get("password") or "Patient@123")
    ayurvedic_category = data.get("ayurvedic_category", "vata")

    new_patient = Patient(
        name=name,
        email=email,
        password=password_hash,
        dob=dob_dt,
        gender=gender,
        contact=contact,
        address=[address_obj],
        role="patient",
        ayurvedic_category=ayurvedic_category,
        allergies=allergies_list,
        diseases=diseases_list,
        height=height_val,
        weight=weight_val,
        doctorId=current_user.id,
        assigned_doctor=current_user.id,
        medical_history_url=medical_history_url,
        mode="online"
    )

    await new_patient.create()

    # Optionally update doctor's linked_patients list
    if hasattr(current_user, "linked_patients") and isinstance(current_user.linked_patients, list):
        if new_patient.id not in current_user.linked_patients:
            current_user.linked_patients.append(new_patient.id)
            await current_user.save()

    patient_dict = new_patient.model_dump(exclude={"password", "refreshToken"})
    patient_dict["_id"] = str(new_patient.id)
    patient_dict["id"] = str(new_patient.id)
    patient_dict["doctorId"] = str(current_user.id)
    patient_dict["assigned_doctor"] = str(current_user.id)
    if medical_history_url:
        patient_dict["medical_history_url"] = medical_history_url

    return {"success": True, "data": patient_dict}

@router.get("/patients/{patient_id}")
async def get_patient_detail(
    patient_id: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can view patient details"
        )

    try:
        patient = await Patient.get(PydanticObjectId(patient_id), with_children=True)
    except Exception:
        patient = None

    if not patient:
        try:
            patient = await User.get(PydanticObjectId(patient_id), with_children=True)
        except Exception:
            patient = None

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    # Check ownership or consultation link
    consultation = await Consultation.find_one(
        Consultation.patientId == patient.id,
        Consultation.doctorId == current_user.id
    )

    is_owner = (
        getattr(patient, "doctorId", None) == current_user.id or
        getattr(patient, "assigned_doctor", None) == current_user.id or
        consultation is not None
    )

    if not is_owner and hasattr(current_user, "linked_patients") and isinstance(current_user.linked_patients, list):
        if str(patient.id) in [str(x) for x in current_user.linked_patients]:
            is_owner = True

    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this patient's details"
        )

    patient_dict = patient.model_dump(exclude={"password", "refreshToken"})
    patient_dict["_id"] = str(patient.id)
    patient_dict["id"] = str(patient.id)
    if getattr(patient, "doctorId", None):
        patient_dict["doctorId"] = str(patient.doctorId)
    if getattr(patient, "assigned_doctor", None):
        patient_dict["assigned_doctor"] = str(patient.assigned_doctor)

    return {"success": True, "data": patient_dict}
