from typing import Optional, List, Dict
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from beanie import PydanticObjectId

from app.models.message import Message
from app.models.user import User
from app.core.security import get_current_user

router = APIRouter()

class SendMessagePayload(BaseModel):
    content: Optional[str] = None
    text: Optional[str] = None

def format_message(m: Message, current_user_id: PydanticObjectId) -> dict:
    is_me = (m.senderId == current_user_id)
    sender_type = "user" if is_me else ("doctor" if m.senderRole == "doctor" else "patient")
    return {
        "_id": str(m.id),
        "id": str(m.id),
        "senderId": str(m.senderId),
        "receiverId": str(m.receiverId),
        "senderRole": m.senderRole,
        "sender": sender_type,
        "content": m.content,
        "text": m.content,
        "createdAt": m.createdAt.isoformat(),
        "timestamp": m.createdAt.isoformat(),
        "read": m.read
    }

@router.get("/conversations")
async def get_conversations(current_user: User = Depends(get_current_user)):
    user_id = current_user.id

    # Find all messages involving current_user
    messages = await Message.find({
        "$or": [{"senderId": user_id}, {"receiverId": user_id}]
    }).sort("+createdAt").to_list()

    partners_map: Dict[str, dict] = {}

    for m in messages:
        partner_id = m.receiverId if m.senderId == user_id else m.senderId
        partner_id_str = str(partner_id)

        if partner_id_str not in partners_map:
            partners_map[partner_id_str] = {
                "partnerId": partner_id_str,
                "lastMessage": m.content,
                "lastMessageTime": m.createdAt,
                "unreadCount": 0
            }
        else:
            partners_map[partner_id_str]["lastMessage"] = m.content
            partners_map[partner_id_str]["lastMessageTime"] = m.createdAt

        # Count unread messages sent by partner to current_user
        if m.receiverId == user_id and m.senderId == partner_id and not m.read:
            partners_map[partner_id_str]["unreadCount"] += 1

    # Fetch partner user details (name, role, specialty)
    conversations = []
    for pid_str, conv in partners_map.items():
        try:
            partner_user = await User.get(PydanticObjectId(pid_str), with_children=True)
        except Exception:
            partner_user = None

        conv["partnerName"] = partner_user.name if partner_user else f"User {pid_str[:6]}"
        conv["partnerRole"] = partner_user.role if partner_user else "user"
        conv["name"] = conv["partnerName"]
        conv["id"] = pid_str
        conv["_id"] = pid_str
        conv["createdAt"] = conv["lastMessageTime"].isoformat()
        conv["lastMessageTime"] = conv["lastMessageTime"].isoformat()
        conversations.append(conv)

    # Sort conversations by lastMessageTime descending
    conversations.sort(key=lambda c: c["lastMessageTime"], reverse=True)

    return {"success": True, "data": conversations}

@router.get("/{other_user_id}")
async def get_message_history(
    other_user_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        partner_id = PydanticObjectId(other_user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )

    messages = await Message.find({
        "$or": [
            {"senderId": current_user.id, "receiverId": partner_id},
            {"senderId": partner_id, "receiverId": current_user.id}
        ]
    }).sort("+createdAt").to_list()

    data = [format_message(m, current_user.id) for m in messages]
    return {"success": True, "data": data}

@router.post("/{other_user_id}")
async def send_message(
    other_user_id: str,
    payload: SendMessagePayload,
    current_user: User = Depends(get_current_user)
):
    text_content = (payload.content or payload.text or "").strip()
    if not text_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty"
        )

    try:
        partner_id = PydanticObjectId(other_user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid recipient ID format"
        )

    partner = await User.get(partner_id, with_children=True)
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient user not found"
        )

    new_msg = Message(
        senderId=current_user.id,
        receiverId=partner_id,
        senderRole=current_user.role,
        content=text_content,
        createdAt=datetime.now(timezone.utc),
        read=False
    )

    await new_msg.create()

    return {"success": True, "data": format_message(new_msg, current_user.id)}

@router.put("/{other_user_id}/read")
async def mark_messages_read(
    other_user_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        partner_id = PydanticObjectId(other_user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )

    await Message.find({
        "senderId": partner_id,
        "receiverId": current_user.id,
        "read": False
    }).update({"$set": {"read": True}})

    return {"success": True, "message": "Messages marked as read"}
