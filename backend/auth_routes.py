from fastapi import APIRouter, HTTPException, Depends, status, Header
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional
import os
import secrets
import string
from dotenv import load_dotenv
from auth_models import (
    AdminUser, AdminCreate, AdminLogin, AdminConfirmEmail,
    PasswordResetRequest, PasswordReset, Token, AdminResponse, RoleEnum
)
from email_service import EmailService
from dependencies import get_database

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Security config
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production-hospital-12345")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
email_service = EmailService()

def hash_password(password: str) -> str:
    """Hash password with bcrypt (truncate to 72 bytes max for bcrypt compatibility)"""
    return pwd_context.hash(password[:72])

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def generate_random_token(length: int = 32) -> str:
    """Generate a secure random token"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get current user from Authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    admin = await db["admins"].find_one({"email": email})
    if admin is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return admin

async def get_superadmin_user(
    authorization: Optional[str] = Header(None),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get current user and verify superadmin role"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    admin = await db["admins"].find_one({"email": email})
    if admin is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    if admin.get("role") != RoleEnum.SUPERADMIN:
        raise HTTPException(status_code=403, detail="Only superadmin can access this")
    
    return admin

@router.post("/login", response_model=Token)
async def login(credentials: AdminLogin, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Admin login endpoint"""
    # Find admin
    admin = await db["admins"].find_one({"email": credentials.email})
    
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(credentials.password, admin.get("hashed_password", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not admin.get("is_active", False):
        raise HTTPException(status_code=403, detail="Account is inactive")
    
    if not admin.get("email_verified", False):
        raise HTTPException(status_code=403, detail="Email not verified. Please check your email.")
    
    # Update last login
    await db["admins"].update_one(
        {"_id": admin["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create token
    access_token = create_access_token(data={"sub": credentials.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(admin["_id"]),
            "email": admin["email"],
            "full_name": admin["full_name"],
            "role": admin["role"]
        }
    }

@router.post("/confirm-email", response_model=Token)
async def confirm_email(data: AdminConfirmEmail, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Confirm email and set password"""
    try:
        payload = jwt.decode(data.token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if token_type != "verification":
            raise HTTPException(status_code=400, detail="Invalid token type")
            
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    admin = await db["admins"].find_one({"email": email})
    
    if not admin:
        raise HTTPException(status_code=404, detail="User not found")
    
    if admin.get("email_verified"):
        raise HTTPException(status_code=400, detail="Email already verified")
    
    # Update password and verify email
    hashed_password = hash_password(data.password)
    await db["admins"].update_one(
        {"_id": admin["_id"]},
        {
            "$set": {
                "hashed_password": hashed_password,
                "email_verified": True,
                "verification_token": None,
                "verification_token_expires": None
            }
        }
    )
    
    # Create login token
    access_token = create_access_token(data={"sub": email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(admin["_id"]),
            "email": admin["email"],
            "full_name": admin["full_name"],
            "role": admin["role"]
        }
    }

@router.post("/forgot-password")
async def forgot_password(data: PasswordResetRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Request password reset"""
    admin = await db["admins"].find_one({"email": data.email})
    
    if not admin:
        # Don't reveal if email exists (security best practice)
        return {"message": "If email exists, password reset link has been sent"}
    
    if not admin.get("is_active"):
        return {"message": "If email exists, password reset link has been sent"}
    
    # Generate reset token
    reset_token = generate_random_token()
    reset_token_jwt = jwt.encode(
        {
            "sub": data.email,
            "type": "password_reset",
            "exp": datetime.utcnow() + timedelta(hours=1)
        },
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    
    # Save token to database
    await db["admins"].update_one(
        {"_id": admin["_id"]},
        {
            "$set": {
                "password_reset_token": reset_token,
                "password_reset_token_expires": datetime.utcnow() + timedelta(hours=1)
            }
        }
    )
    
    # Send email
    reset_link = f"{os.getenv('APP_URL', 'http://localhost:3000')}/reset-password?token={reset_token_jwt}"
    email_service.send_password_reset_email(data.email, admin["full_name"], reset_link)
    
    return {"message": "If email exists, password reset link has been sent"}

@router.post("/reset-password")
async def reset_password(data: PasswordReset, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Reset password with token"""
    try:
        payload = jwt.decode(data.token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if token_type != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid token type")
            
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    admin = await db["admins"].find_one({"email": email})
    
    if not admin:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password
    hashed_password = hash_password(data.new_password)
    await db["admins"].update_one(
        {"_id": admin["_id"]},
        {
            "$set": {
                "hashed_password": hashed_password,
                "password_reset_token": None,
                "password_reset_token_expires": None
            }
        }
    )
    
    return {"message": "Password reset successfully"}

@router.get("/me")
async def get_profile(authorization: Optional[str] = Header(None), db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get current user profile"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    admin = await db["admins"].find_one({"email": email}, {"hashed_password": 0})
    if not admin:
        raise HTTPException(status_code=404, detail="User not found")
    
    admin["_id"] = str(admin["_id"])
    return admin

@router.post("/logout")
async def logout():
    """Logout (token invalidation on frontend)"""
    return {"message": "Logged out successfully"}
