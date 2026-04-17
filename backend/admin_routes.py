from fastapi import APIRouter, HTTPException, Depends, status, Header
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from datetime import datetime, timedelta
from jose import jwt
import os
from dotenv import load_dotenv
from auth_models import AdminCreate, AdminUpdate, AdminResponse, RoleEnum
from email_service import EmailService
from auth_routes import hash_password, SECRET_KEY, ALGORITHM, generate_random_token, get_superadmin_user
from dependencies import get_database

load_dotenv()

router = APIRouter(prefix="/api/admin", tags=["admin-management"])
email_service = EmailService()

@router.post("/create", response_model=AdminResponse)
async def create_admin(
    new_admin: AdminCreate,
    superadmin: dict = Depends(get_superadmin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Superadmin creates a new admin"""
    # superadmin is already verified by the dependency
    
    # Check if email already exists
    existing = await db["admins"].find_one({"email": new_admin.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create admin document (without password initially)
    admin_doc = {
        "email": new_admin.email,
        "full_name": new_admin.full_name,
        "role": new_admin.role,
        "is_active": True,
        "email_verified": False,
        "created_at": datetime.utcnow(),
        "created_by": superadmin["email"],
        "last_login": None,
        "hashed_password": hash_password("temp_password_to_be_set"),  # Temporary
        "verification_token": None,
        "verification_token_expires": None
    }
    
    result = await db["admins"].insert_one(admin_doc)
    
    # Generate verification token
    verification_token = jwt.encode(
        {
            "sub": new_admin.email,
            "type": "verification",
            "exp": datetime.utcnow() + timedelta(hours=24)
        },
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    
    # Update with verification token
    await db["admins"].update_one(
        {"_id": result.inserted_id},
        {
            "$set": {
                "verification_token": verification_token,
                "verification_token_expires": datetime.utcnow() + timedelta(hours=24)
            }
        }
    )
    
    # Send verification email
    verification_link = f"{os.getenv('APP_URL', 'http://localhost:3000')}/confirm-email?token={verification_token}"
    email_sent = email_service.send_verification_email(new_admin.email, new_admin.full_name, verification_link)
    
    if not email_sent:
        print(f"⚠️ Warning: Verification email failed to send for {new_admin.email}")
        print(f"   Email config: {email_service.sender_email} via {email_service.smtp_server}:{email_service.smtp_port}")
        # Don't fail the admin creation, but user needs to know
    
    return {
        "id": str(result.inserted_id),
        "email": admin_doc["email"],
        "full_name": admin_doc["full_name"],
        "role": admin_doc["role"],
        "is_active": admin_doc["is_active"],
        "email_verified": admin_doc["email_verified"],
        "created_at": admin_doc["created_at"],
        "created_by": admin_doc["created_by"]
    }

@router.get("/list", response_model=List[AdminResponse])
async def list_admins(
    superadmin: dict = Depends(get_superadmin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Superadmin lists all admins"""
    
    admins = await db["admins"].find({}, {"hashed_password": 0}).to_list(None)
    
    for admin in admins:
        admin["_id"] = str(admin["_id"]) if "_id" in admin else None
        admin["id"] = admin.pop("_id", None)
    
    return admins

@router.get("/{admin_id}", response_model=AdminResponse)
async def get_admin(
    admin_id: str,
    superadmin: dict = Depends(get_superadmin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Superadmin gets admin details"""
    
    from bson import ObjectId
    try:
        admin = await db["admins"].find_one(
            {"_id": ObjectId(admin_id)},
            {"hashed_password": 0}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid admin ID")
    
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    admin["_id"] = str(admin["_id"])
    return admin

@router.put("/{admin_id}", response_model=AdminResponse)
async def update_admin(
    admin_id: str,
    admin_update: AdminUpdate,
    superadmin: dict = Depends(get_superadmin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Superadmin updates admin details"""
    
    from bson import ObjectId
    try:
        admin_oid = ObjectId(admin_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid admin ID")
    
    admin = await db["admins"].find_one({"_id": admin_oid})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    # Prevent modifying own role
    if admin["role"] == RoleEnum.SUPERADMIN and admin_update.role != RoleEnum.SUPERADMIN:
        raise HTTPException(status_code=400, detail="Cannot demote superadmin")
    
    # Build update dict
    update_data = {}
    if admin_update.full_name is not None:
        update_data["full_name"] = admin_update.full_name
    if admin_update.role is not None:
        update_data["role"] = admin_update.role
    if admin_update.is_active is not None:
        update_data["is_active"] = admin_update.is_active
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    await db["admins"].update_one(
        {"_id": admin_oid},
        {"$set": update_data}
    )
    
    updated_admin = await db["admins"].find_one(
        {"_id": admin_oid},
        {"hashed_password": 0}
    )
    
    updated_admin["_id"] = str(updated_admin["_id"])
    return updated_admin

@router.delete("/{admin_id}")
async def delete_admin(
    admin_id: str,
    superadmin: dict = Depends(get_superadmin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Superadmin deletes an admin"""
    
    from bson import ObjectId
    try:
        admin_oid = ObjectId(admin_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid admin ID")
    
    admin = await db["admins"].find_one({"_id": admin_oid})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    # Prevent deleting own account
    if admin["email"] == superadmin["email"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Prevent deleting another superadmin
    if admin["role"] == RoleEnum.SUPERADMIN:
        raise HTTPException(status_code=400, detail="Cannot delete another superadmin")
    
    # Send notification email
    email_service.send_admin_deleted_email(admin["email"], admin["full_name"])
    
    # Delete admin
    await db["admins"].delete_one({"_id": admin_oid})
    
    return {"message": f"Admin {admin['email']} deleted successfully"}

@router.post("/{admin_id}/reactivate", response_model=AdminResponse)
async def reactivate_admin(
    admin_id: str,
    superadmin: dict = Depends(get_superadmin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Superadmin reactivates an inactive admin"""
    
    from bson import ObjectId
    try:
        admin_oid = ObjectId(admin_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid admin ID")
    
    admin = await db["admins"].find_one({"_id": admin_oid})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    if admin.get("is_active"):
        raise HTTPException(status_code=400, detail="Admin is already active")
    
    await db["admins"].update_one(
        {"_id": admin_oid},
        {"$set": {"is_active": True}}
    )
    
    updated_admin = await db["admins"].find_one(
        {"_id": admin_oid},
        {"hashed_password": 0}
    )
    
    updated_admin["_id"] = str(updated_admin["_id"])
    return updated_admin

@router.post("/{admin_id}/deactivate", response_model=AdminResponse)
async def deactivate_admin(
    admin_id: str,
    superadmin: dict = Depends(get_superadmin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Superadmin deactivates an admin"""
    
    from bson import ObjectId
    try:
        admin_oid = ObjectId(admin_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid admin ID")
    
    admin = await db["admins"].find_one({"_id": admin_oid})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    # Prevent deactivating own account
    if admin["email"] == superadmin["email"]:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    
    if not admin.get("is_active"):
        raise HTTPException(status_code=400, detail="Admin is already inactive")
    
    await db["admins"].update_one(
        {"_id": admin_oid},
        {"$set": {"is_active": False}}
    )
    
    updated_admin = await db["admins"].find_one(
        {"_id": admin_oid},
        {"hashed_password": 0}
    )
    
    updated_admin["_id"] = str(updated_admin["_id"])
    return updated_admin
