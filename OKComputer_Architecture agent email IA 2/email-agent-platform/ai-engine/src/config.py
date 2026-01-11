"""
Application configuration
"""

import os
from typing import List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "Email Agent AI Engine"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=False, description="Debug mode")
    HOST: str = Field(default="0.0.0.0", description="Host to bind to")
    PORT: int = Field(default=8000, description="Port to bind to")
    
    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000"],
        description="CORS allowed origins"
    )
    
    # Database
    DATABASE_URL: str = Field(
        default="postgresql://emailagent:password@localhost:5432/emailagent",
        description="PostgreSQL database URL"
    )
    
    MONGODB_URL: str = Field(
        default="mongodb://localhost:27017/emailagent",
        description="MongoDB connection URL"
    )
    
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL"
    )
    
    # Object Storage (MinIO/S3)
    S3_ENDPOINT: str = Field(default="localhost:9000", description="S3 endpoint")
    S3_ACCESS_KEY: str = Field(default="minioadmin", description="S3 access key")
    S3_SECRET_KEY: str = Field(default="minioadmin", description="S3 secret key")
    S3_BUCKET_NAME: str = Field(default="email-agent", description="S3 bucket name")
    S3_REGION: str = Field(default="us-east-1", description="S3 region")
    S3_USE_SSL: bool = Field(default=False, description="Use SSL for S3")
    
    # AI Models
    MODELS_PATH: str = Field(default="models", description="Path to AI models")
    SPACY_MODEL: str = Field(default="fr_core_news_lg", description="spaCy model name")
    
    # Classification
    CLASSIFICATION_CONFIDENCE_THRESHOLD: float = Field(
        default=0.7,
        description="Minimum confidence for auto-classification"
    )
    
    # Processing
    MAX_FILE_SIZE_MB: int = Field(default=50, description="Maximum file size in MB")
    PDF_PROCESSING_TIMEOUT: int = Field(
        default=30,
        description="PDF processing timeout in seconds"
    )
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    LOG_FORMAT: str = Field(
        default="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        description="Log format"
    )
    
    # Monitoring
    METRICS_ENABLED: bool = Field(default=True, description="Enable metrics collection")
    METRICS_PORT: int = Field(default=9090, description="Metrics server port")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get application settings"""
    return settings