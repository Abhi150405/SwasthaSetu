from typing import Optional
from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel, ASCENDING

class Consultation(Document):
    patientId: PydanticObjectId
    doctorId: PydanticObjectId
    status: str = "pending"  # "pending", "accepted", "rejected", "completed"
    patientName: Optional[str] = None
    patientDosha: Optional[str] = None
    symptoms: str = ""
    notes: str = ""

    class Settings:
        name = "consultations"
        indexes = [
            IndexModel([("patientId", ASCENDING)]),
            IndexModel([("doctorId", ASCENDING)]),
        ]
