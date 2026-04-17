"""
Dependency injection functions for FastAPI routes
"""
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

# This will be set by main.py during initialization
_db: Optional[AsyncIOMotorDatabase] = None


def set_database(db: AsyncIOMotorDatabase):
    """Set the database instance for dependency injection"""
    global _db
    _db = db


async def get_database() -> AsyncIOMotorDatabase:
    """Dependency function to provide database instance to routes"""
    return _db
