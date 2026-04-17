from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional
from bson import ObjectId
from enum import Enum

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

class RoleEnum(str, Enum):
    ADMIN = "admin"
    SUPERADMIN = "superadmin"

class AdminUser(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias="_id")
    email: str
    hashed_password: str
    full_name: str
    role: RoleEnum = RoleEnum.ADMIN
    is_active: bool = True
    email_verified: bool = False
    verification_token: Optional[str] = None
    verification_token_expires: Optional[datetime] = None
    password_reset_token: Optional[str] = None
    password_reset_token_expires: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None  # Email of superadmin who created this
    last_login: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
        use_enum_values = True

# Request/Response Models
class AdminCreate(BaseModel):
    email: str
    full_name: str
    role: RoleEnum = RoleEnum.ADMIN

class AdminUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[RoleEnum] = None
    is_active: Optional[bool] = None

class AdminLogin(BaseModel):
    email: str
    password: str

class AdminConfirmEmail(BaseModel):
    token: str
    password: str  # Password set during confirmation

class PasswordResetRequest(BaseModel):
    email: str

class PasswordReset(BaseModel):
    token: str
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class AdminResponse(BaseModel):
    id: Optional[str] = None
    email: str
    full_name: str
    role: str
    is_active: bool
    email_verified: bool
    created_at: datetime
    created_by: Optional[str] = None
    last_login: Optional[datetime] = None

    class Config:
        json_encoders = {ObjectId: str}
