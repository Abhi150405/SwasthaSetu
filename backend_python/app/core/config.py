import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "SwasthaSetu AI Backend"
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DB_NAME: str = os.getenv("DB_NAME", "SWASTHASETU")
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    ACCESS_TOKEN_SECRET: str = os.getenv("ACCESS_TOKEN_SECRET", "secret")
    DEV_ORIGIN: str = os.getenv("DEV_ORIGIN", "http://localhost:8080")

settings = Settings()
