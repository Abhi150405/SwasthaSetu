import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "SwasthaSetu AI Backend"
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DB_NAME: str = os.getenv("DB_NAME", "SWASTHASETU")
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY") or ""

    ACCESS_TOKEN_SECRET: str = os.getenv("ACCESS_TOKEN_SECRET", "secret")
    REFRESH_TOKEN_SECRET: str = os.getenv("REFRESH_TOKEN_SECRET", "refresh_secret")
    ACCESS_TOKEN_EXPIRY: str = os.getenv("ACCESS_TOKEN_EXPIRY", "15m")
    REFRESH_TOKEN_EXPIRY: str = os.getenv("REFRESH_TOKEN_EXPIRY", "7d")
    DEV_ORIGIN: str = os.getenv("DEV_ORIGIN", "http://localhost:8080")
    
    # Cloudinary Config
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")

settings = Settings()
