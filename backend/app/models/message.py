from datetime import datetime, timezone
from typing import Optional
from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel, ASCENDING

class Message(Document):
    senderId: PydanticObjectId
    receiverId: PydanticObjectId
    senderRole: str  # "patient", "doctor", "system"
    content: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    read: bool = False

    class Settings:
        name = "messages"
        indexes = [
            IndexModel([("senderId", ASCENDING)]),
            IndexModel([("receiverId", ASCENDING)]),
            IndexModel([("createdAt", ASCENDING)]),
        ]
