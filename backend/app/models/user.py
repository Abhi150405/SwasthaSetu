from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator

from beanie import Document, PydanticObjectId
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class Address(BaseModel):
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    isDefault: bool = False

class User(Document):
    name: str
    email: EmailStr
    password: str
    dob: datetime
    gender: str  # "male", "female", "prefer not to say"
    contact: str
    address: List[Address] = []
    role: str  # 'patient' or 'doctor'
    refreshToken: Optional[str] = None
    lastNotificationsSeenAt: Optional[datetime] = None

    class Settings:
        name = "users"
        is_root = True

    def verify_password(self, plain_password: str) -> bool:
        return pwd_context.verify(plain_password, self.password)

    @classmethod
    def get_password_hash(cls, password: str) -> str:
        return pwd_context.hash(password)

class Patient(User):
    ayurvedic_category: str = "vata"  # "vata", "pitta", "kapha"
    medical_history: List[str] = []
    medical_history_url: Optional[str] = None
    documents: List[dict] = []
    diseases: List[str] = []
    assigned_doctor: Optional[PydanticObjectId] = None
    doctorId: Optional[PydanticObjectId] = None
    mode: str = "online"  # "online", "offline"
    allergies: List[str] = []
    height: Optional[float] = None  # in cm
    weight: Optional[float] = None  # in kg

    @field_validator("allergies", "diseases", "medical_history", mode="before")
    @classmethod
    def parse_str_or_list(cls, v):
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()] if v.strip() else []
        return v or []


class Doctor(User):
    licenseNo: str
    hospital: str
    specialty: str
    phone: str
    bio: str = ""
    specialization: List[str] = []
    experience: int = 0
    verification_status: bool = False
    patients: List[PydanticObjectId] = []
    linked_patients: List[PydanticObjectId] = []
