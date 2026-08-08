import os
import uuid
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
import cloudinary
import cloudinary.uploader
import cloudinary.utils

from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"}
MAX_SIZE = 15 * 1024 * 1024  # 15MB

@router.post("/upload", summary="Upload a medical document")
async def upload_document(
    file: UploadFile = File(...), 
    current_user: Optional[User] = Depends(get_current_user)
):
    file_content = await file.read()
    
    if len(file_content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds the 15MB limit.")
    
    # 1. AWS S3 Upload (If AWS S3 keys configured)
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
            ext = os.path.splitext(file.filename or "")[1] or (".pdf" if "pdf" in (file.content_type or "") else ".png")
            s3_filename = f"medical_docs/{uuid.uuid4().hex}{ext}"
            s3_client.put_object(
                Bucket=aws_bucket,
                Key=s3_filename,
                Body=file_content,
                ContentType=file.content_type or "application/pdf"
            )
            s3_url = f"https://{aws_bucket}.s3.{aws_region}.amazonaws.com/{s3_filename}"
            return {
                "success": True,
                "url": s3_url,
                "message": "File uploaded to AWS S3 successfully."
            }
        except Exception as e:
            print(f"AWS S3 upload failed, checking next storage option: {e}")

    # 2. Cloudinary Upload (If Cloudinary keys configured)
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
        try:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True
            )
            user_folder = getattr(current_user, "id", "anonymous")
            response = cloudinary.uploader.upload(
                file_content,
                resource_type="auto",
                folder=f"swasthasetu/patients/{user_folder}"
            )
            url = response.get("secure_url") or response.get("url")
            if url:
                return {
                    "success": True, 
                    "url": url,
                    "public_id": response.get("public_id"),
                    "message": "File uploaded to Cloudinary successfully."
                }
        except Exception as e:
            print(f"Cloudinary upload failed, falling back to local file storage: {e}")

    # 3. Local File Storage Fallback
    ext = os.path.splitext(file.filename or "")[1] or (".pdf" if "pdf" in (file.content_type or "") else ".png")
    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as f:
        f.write(file_content)
        
    local_url = f"/api/files/view/{filename}"
    
    return {
        "success": True,
        "url": local_url,
        "filename": filename,
        "message": "File uploaded to local storage successfully."
    }

@router.get("/view/{filename}", summary="View local uploaded document")
async def view_local_document(filename: str):
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    media_type = "application/pdf" if safe_filename.endswith(".pdf") else "image/png"
    return FileResponse(file_path, media_type=media_type)
