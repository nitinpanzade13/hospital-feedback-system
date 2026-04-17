from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Optional, List
import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from bson import ObjectId
import qrcode
import io
import urllib.parse
import httpx
import asyncio
from forms_config import get_form_id, DEPARTMENT_FORM_CONFIG
from auth_routes import router as auth_router
from admin_routes import router as admin_router
from dependencies import set_database

load_dotenv()

# Configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb+srv://username:password@cluster.mongodb.net/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "hospital_feedback")
COLLECTION_NAME = "feedback"
QUESTIONS_COLLECTION_NAME = "department_questions"
DEPARTMENTS_COLLECTION_NAME = "departments"

# Global database client
client: Optional[AsyncIOMotorClient] = None
db: Optional[AsyncIOMotorDatabase] = None


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)


class FeedbackModel(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias="_id")
    patient_name: str
    department: str
    rating: Optional[int] = Field(None, ge=1, le=5)
    feedback_text: str
    language: str = "en"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str = "pending"  # pending, processed
    emotion: Optional[str] = None
    confidence_score: Optional[float] = None
    processed_at: Optional[datetime] = None  # When AI analysis completed
    all_responses: Optional[dict] = None  # Store all question responses
    detailed_analysis: Optional[dict] = None  # Per-question emotion analysis

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class QuestionModel(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias="_id")
    question_text: str
    question_type: str = "short_answer"  # short_answer, paragraph, multiple_choice, rating
    required: bool = True
    options: Optional[List[str]] = None  # For multiple_choice
    order: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    translations: Optional[dict] = None  # {"hindi": "...", "spanish": "...", "marathi": "..."}

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class DepartmentQuestionsModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    department_name: str
    questions: List[QuestionModel] = []
    form_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class DepartmentModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    name: str
    description: Optional[str] = None
    form_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class FeedbackProcessingResultModel(BaseModel):
    """Model for AI Worker to send processing results"""
    emotion: str
    confidence_score: float
    detailed_analysis: Optional[dict] = None

    class Config:
        arbitrary_types_allowed = True


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global client, db
    import sys
    print("🔄 Initializing MongoDB connection...", flush=True)
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    set_database(db)  # Set database for dependency injection
    print("✓ MongoDB connected", flush=True)
    
    # Ensure indexes
    await db[COLLECTION_NAME].create_index("status")
    await db[COLLECTION_NAME].create_index("department")
    await db[COLLECTION_NAME].create_index("timestamp")
    await db[QUESTIONS_COLLECTION_NAME].create_index("department_name")
    await db[DEPARTMENTS_COLLECTION_NAME].create_index("name")
    
    # Initialize admins collection with indexes
    await db["admins"].create_index("email", unique=True)
    await db["admins"].create_index("role")
    
    # Check if superadmin exists, if not create default one
    superadmin_exists = await db["admins"].find_one({"role": "superadmin"})
    if not superadmin_exists:
        print("🔑 Creating default superadmin...", flush=True)
        from auth_routes import hash_password
        default_superadmin = {
            "email": os.getenv("SUPERADMIN_EMAIL", "superadmin@hospital.com"),
            "hashed_password": hash_password(os.getenv("SUPERADMIN_PASSWORD", "SuperAdmin@123")),
            "full_name": "Super Administrator",
            "role": "superadmin",
            "is_active": True,
            "email_verified": True,
            "created_at": datetime.utcnow(),
            "last_login": None
        }
        await db["admins"].insert_one(default_superadmin)
        print(f"✓ Default superadmin created: {default_superadmin['email']}", flush=True)
    else:
        print("✓ Superadmin already exists", flush=True)
    
    # Initialize default departments if not exist
    default_departments = ["Emergency", "ICU", "Oncology", "Cardiology", "Pediatrics"]
    print(f"📋 Initializing {len(default_departments)} departments...", flush=True)
    
    for dept_name in default_departments:
        dept_exists = await db[DEPARTMENTS_COLLECTION_NAME].find_one({"name": dept_name})
        if not dept_exists:
            await db[DEPARTMENTS_COLLECTION_NAME].insert_one({
                "_id": ObjectId(),
                "name": dept_name,
                "description": f"{dept_name} Department",
                "created_at": datetime.utcnow()
            })
            print(f"  ✓ Created department: {dept_name}", flush=True)
        else:
            print(f"  ✓ Department already exists: {dept_name}", flush=True)
        
        # Initialize default questions collection if not exist
        questions_exists = await db[QUESTIONS_COLLECTION_NAME].find_one({"department_name": dept_name})
        if not questions_exists:
            print(f"  🔄 Initializing questions for {dept_name}...", flush=True)
            await db[QUESTIONS_COLLECTION_NAME].insert_one({
                "_id": ObjectId(),
                "department_name": dept_name,
                "questions": [
                    {
                        "_id": ObjectId(),
                        "question_text": "How would you rate your overall experience?",
                        "question_type": "rating",
                        "required": True,
                        "order": 1
                    },
                    {
                        "_id": ObjectId(),
                        "question_text": "What did you appreciate most about our service?",
                        "question_type": "paragraph",
                        "required": True,
                        "order": 2
                    },
                    {
                        "_id": ObjectId(),
                        "question_text": "What areas can we improve?",
                        "question_type": "paragraph",
                        "required": False,
                        "order": 3
                    }
                ],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            print(f"  ✓ Created 3 default questions for {dept_name}", flush=True)
        else:
            qs_count = len(questions_exists.get("questions", []))
            print(f"  ✓ Questions already exist for {dept_name} ({qs_count} questions)", flush=True)
    
    print("✅ MongoDB initialization complete", flush=True)
    yield
    # Shutdown
    client.close()
    print("✓ MongoDB disconnected", flush=True)


app = FastAPI(
    title="Hospital Feedback API",
    description="Central traffic controller for patient feedback processing",
    lifespan=lifespan
)

# CORS middleware to allow Google Apps Script and React dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(admin_router)


# ==========================================
# GOOGLE FORMS AUTO-UPDATE
# ==========================================

async def add_question_to_google_form(department: str, question_dict: dict):
    """
    Sends a request to Google Apps Script to add a question to the form.
    This is called automatically when a question is added in the dashboard.
    
    Args:
        department: Department name
        question_dict: Question details
    """
    try:
        # Get form configuration
        form_config = DEPARTMENT_FORM_CONFIG.get(department)
        if not form_config:
            print(f"❌ No form configuration found for {department}")
            return
        
        form_id = form_config.get("form_id")
        backend_url = form_config.get("backend_url")
        
        # Prepare the question data
        payload = {
            "question_text": question_dict.get("question_text", ""),
            "question_type": question_dict.get("question_type", "short_answer"),
            "required": question_dict.get("required", True),
            "options": question_dict.get("options", None),
            "department": department,
            "form_id": form_id
        }
        
        print(f"📤 Sending question to Google Form for {department}: {payload['question_text']}")
        
        # Call Google Apps Script endpoint (if available)
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{backend_url}/api/forms/{department}/add-question",
                json=payload,
                timeout=5.0
            )
            
            if response.status_code in [200, 201]:
                print(f"✅ Question added to Google Form: {response.json()}")
            else:
                print(f"⚠️ Google Form update response: {response.status_code} - {response.text}")
                
    except Exception as e:
        print(f"❌ Error adding question to Google Form: {e}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected" if db is not None else "disconnected"
    }


@app.post("/api/feedback/session")
async def set_feedback_session(department: str, language: str = "english"):
    """
    Store the current feedback session (department + language).
    Called by frontend before opening Google Form.
    
    Args:
        department: Selected department
        language: Selected language
        
    Returns:
        Confirmation that session was stored
    """
    try:
        # Store in a special session collection
        session_data = {
            "_id": "current_session",
            "department": department,
            "language": language,
            "timestamp": datetime.utcnow()
        }
        
        # Upsert (insert or update)
        await db["feedback_session"].replace_one(
            {"_id": "current_session"},
            session_data,
            upsert=True
        )
        
        return {
            "status": "success",
            "message": "Session stored",
            "department": department,
            "language": language
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/feedback/session")
async def get_feedback_session():
    """
    Retrieve the current feedback session.
    Called by Google Apps Script to get department/language.
    
    Returns:
        Current session with department and language
    """
    try:
        session_data = await db["feedback_session"].find_one({"_id": "current_session"})
        
        if session_data:
            return {
                "status": "success",
                "department": session_data.get("department"),
                "language": session_data.get("language")
            }
        else:
            return {
                "status": "success",
                "department": None,
                "language": "english"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/feedback/form-qr")
async def get_form_qr_code(form_url: str = "https://forms.google.com/your-form-id"):
    """
    Generate QR code for Google Form.
    
    Args:
        form_url: URL of the Google Form
        
    Returns:
        PNG image of QR code
    """
    try:
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(form_url)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save to BytesIO
        img_io = io.BytesIO()
        img.save(img_io, 'PNG')
        img_io.seek(0)
        
        return StreamingResponse(
            iter([img_io.getvalue()]),
            media_type="image/png",
            headers={"Content-Disposition": "inline; filename=form-qr.png"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/feedback/form-info")
async def get_form_info(department: Optional[str] = None):
    """
    Get form URL and setup information.
    If department is specified, return department-specific form URL.
    
    Returns:
        Form URL, QR code link, and department-specific questions
    """
    try:
        if department:
            # Get department-specific form info
            dept_info = await db[QUESTIONS_COLLECTION_NAME].find_one({"department_name": department})
            if not dept_info:
                # Return base form if department not found
                form_url = os.getenv("GOOGLE_FORM_URL", "https://forms.google.com/replace-with-your-form-id")
                questions = []
            else:
                form_url = dept_info.get("form_url") or os.getenv("GOOGLE_FORM_URL", "https://forms.google.com/replace-with-your-form-id")
                questions = dept_info.get("questions", [])
                
                # Convert ObjectIds to strings for JSON serialization
                for q in questions:
                    if "_id" in q and isinstance(q["_id"], ObjectId):
                        q["_id"] = str(q["_id"])
                
                # Add department parameter to form URL
                separator = "&" if "?" in form_url else "?"
                form_url = f"{form_url}{separator}entry.department={urllib.parse.quote(department)}"
        else:
            form_url = os.getenv("GOOGLE_FORM_URL", "https://forms.google.com/replace-with-your-form-id")
            questions = []
        
        return {
            "status": "success",
            "form_url": form_url,
            "qr_code_url": f"/api/feedback/form-qr?form_url={urllib.parse.quote(form_url)}&department={urllib.parse.quote(department) if department else ''}",
            "department": department,
            "questions": questions,
            "instructions": {
                "step1": "Users can scan the QR code with their phone camera",
                "step2": "Opens the Google Form to submit feedback",
                "step3": "Feedback is submitted via Google Apps Script",
                "step4": "Backend receives and stores feedback",
                "step5": "AI Worker processes emotion analysis"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Helper functions for rating calculation
def emotion_to_rating(emotion: str) -> int:
    """Convert emotion to rating (1-5)"""
    emotion_map = {
        "joy": 5,
        "gratitude": 5,
        "satisfaction": 4,
        "surprise": 4,
        "neutral": 3,
        "concern": 2,
        "dissatisfaction": 2,
        "anger": 1
    }
    return emotion_map.get(emotion.lower(), 3)


def calculate_rating_from_responses(all_responses: dict, detailed_analysis: dict) -> float:
    """
    Calculate average rating from both numeric responses and emotion-detected text responses.
    
    Combines:
    - Numeric responses (1-5 scale questions converted to ratings)
    - Emotion-based ratings from text responses (emotions converted to 1-5 scale)
    """
    ratings = []
    
    # Extract numeric responses (looking for numeric string values)
    if all_responses:
        for question, response in all_responses.items():
            # Try to parse numeric responses
            if isinstance(response, str):
                try:
                    numeric_val = int(response)
                    if 1 <= numeric_val <= 5:
                        ratings.append(numeric_val)
                except (ValueError, TypeError):
                    pass
    
    # Extract emotion-based ratings from detailed_analysis
    if detailed_analysis:
        for question, analysis in detailed_analysis.items():
            if isinstance(analysis, dict) and "emotion" in analysis:
                emotion = analysis["emotion"]
                emotion_rating = emotion_to_rating(emotion)
                ratings.append(emotion_rating)
    
    # Calculate average rating
    if ratings:
        avg_rating = sum(ratings) / len(ratings)
        return round(avg_rating, 2)
    return 3.0  # Default neutral rating


@app.post("/api/feedback")
async def receive_feedback(feedback: FeedbackModel):
    """
    Receive feedback from Google Apps Script.
    Stores immediately with 'pending' status.
    Calculates rating from numeric responses and emotion analysis.
    """
    try:
        feedback_dict = feedback.dict(by_alias=True, exclude_unset=True)
        feedback_dict["_id"] = ObjectId()
        # Ensure timestamp is set (if not provided by frontend)
        if "timestamp" not in feedback_dict:
            feedback_dict["timestamp"] = datetime.utcnow()
        # Ensure status is set to pending for AI processing
        feedback_dict["status"] = "pending"
        
        # Calculate rating from all_responses and detailed_analysis
        if "all_responses" in feedback_dict or "detailed_analysis" in feedback_dict:
            calculated_rating = calculate_rating_from_responses(
                feedback_dict.get("all_responses", {}),
                feedback_dict.get("detailed_analysis", {})
            )
            feedback_dict["rating"] = calculated_rating
        
        result = await db[COLLECTION_NAME].insert_one(feedback_dict)
        
        return {
            "status": "success",
            "message": "Feedback received and queued for processing",
            "id": str(result.inserted_id),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/feedback/pending")
async def get_pending_feedback(limit: int = 10):
    """
    Get pending feedback for AI processing.
    AI Worker polls this endpoint.
    """
    try:
        cursor = db[COLLECTION_NAME].find(
            {"status": "pending"}
        ).limit(limit)
        
        pending_feedback = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string for JSON serialization
        for feedback in pending_feedback:
            feedback["_id"] = str(feedback["_id"])
        
        return {
            "status": "success",
            "count": len(pending_feedback),
            "feedback": pending_feedback
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/feedback/{feedback_id}/process")
async def update_feedback_result(
    feedback_id: str, 
    result: FeedbackProcessingResultModel
):
    """
    Update feedback with AI processing results.
    Called by AI Worker after sentiment analysis.
    
    Args:
        feedback_id: ID of the feedback
        result: FeedbackProcessingResultModel with emotion, confidence_score, and optional detailed_analysis
    """
    try:
        update_data = {
            "emotion": result.emotion,
            "confidence_score": result.confidence_score,
            "status": "processed",
            "processed_at": datetime.utcnow()
        }
        
        if result.detailed_analysis:
            update_data["detailed_analysis"] = result.detailed_analysis
        
        result_obj = await db[COLLECTION_NAME].update_one(
            {"_id": ObjectId(feedback_id)},
            {"$set": update_data}
        )
        
        if result_obj.matched_count == 0:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        return {
            "status": "success",
            "message": "Feedback updated with processing results",
            "id": feedback_id,
            "emotion": result.emotion,
            "confidence": result.confidence_score,
            "has_detailed_analysis": result.detailed_analysis is not None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dashboard/summary")
async def get_dashboard_summary():
    """
    Get aggregated data for React Dashboard.
    Returns emotion distribution, department trends, etc.
    """
    try:
        pipeline = [
            {
                "$group": {
                    "_id": "$emotion",
                    "count": {"$sum": 1},
                    "avg_confidence": {"$avg": "$confidence_score"}
                }
            },
            {"$sort": {"count": -1}}
        ]
        
        emotion_distribution = await db[COLLECTION_NAME].aggregate(pipeline).to_list(None)
        
        # Department-wise feedback
        dept_pipeline = [
            {
                "$group": {
                    "_id": "$department",
                    "count": {"$sum": 1},
                    "avg_rating": {"$avg": "$rating"},
                    "emotions": {"$push": "$emotion"}
                }
            },
            {"$sort": {"count": -1}}
        ]
        
        department_trends = await db[COLLECTION_NAME].aggregate(dept_pipeline).to_list(None)
        
        # Recent feedback
        recent = await db[COLLECTION_NAME].find().sort("timestamp", -1).limit(20).to_list(20)
        for item in recent:
            item["_id"] = str(item["_id"])
        
        # Overall stats
        total_count = await db[COLLECTION_NAME].count_documents({})
        processed_count = await db[COLLECTION_NAME].count_documents({"status": "processed"})
        pending_count = await db[COLLECTION_NAME].count_documents({"status": "pending"})
        
        return {
            "status": "success",
            "overall_stats": {
                "total_feedback": total_count,
                "processed": processed_count,
                "pending": pending_count
            },
            "emotion_distribution": emotion_distribution,
            "department_trends": department_trends,
            "recent_feedback": recent
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/feedback/test/analyze-all")
async def analyze_all_feedback():
    """
    TESTING ENDPOINT: Manually analyze all pending feedback 
    to test emotion detection without waiting for triggers.
    """
    try:
        # Mark all unprocessed feedback as pending
        update_result = await db[COLLECTION_NAME].update_many(
            {"emotion": {"$exists": False}},
            {"$set": {"status": "pending"}}
        )
        
        return {
            "status": "success",
            "message": f"Marked {update_result.modified_count} feedback items for analysis"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/feedback/test/force-pending")
async def force_all_pending():
    """
    TESTING ENDPOINT: Override all feedback to pending status for testing.
    """
    try:
        # Mark ALL feedback as pending for reanalysis
        result = await db[COLLECTION_NAME].update_many(
            {},
            {"$set": {"status": "pending"}}
        )
        
        return {
            "status": "success",
            "message": f"Marked {result.modified_count} feedback items as pending for analysis"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dashboard/time-series")
async def get_time_series(days: int = 30):
    """
    Get time-series data for trend visualization.
    """
    try:
        pipeline = [
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$timestamp"},
                        "month": {"$month": "$timestamp"},
                        "day": {"$dayOfMonth": "$timestamp"}
                    },
                    "count": {"$sum": 1},
                    "avg_rating": {"$avg": "$rating"}
                }
            },
            {"$sort": {"_id": 1}},
            {"$limit": days}
        ]
        
        time_series = await db[COLLECTION_NAME].aggregate(pipeline).to_list(None)
        
        return {
            "status": "success",
            "time_series": time_series
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/test/populate-demo-data")
async def populate_demo_data(count: int = 50):
    """
    Populate database with demo feedback data for testing.
    
    Args:
        count: Number of demo feedback items to create (default: 50)
    
    Returns:
        Status and count of created items
    """
    try:
        demo_feedbacks = [
            {
                "patient_name": f"Patient {i}",
                "department": ["Emergency", "ICU", "Oncology", "Cardiology", "Pediatrics"][i % 5],
                "feedback_text": [
                    "Great service, very professional staff!",
                    "The wait time was too long but staff was helpful.",
                    "Excellent care and attention from doctors.",
                    "Could improve the cleanliness of the rooms.",
                    "Outstanding experience, highly recommend!",
                    "Staff was rude and dismissive.",
                    "Good treatment but facilities need upgrade.",
                    "Very satisfied with the care received.",
                    "Horrific experience, worst hospital ever.",
                    "Amazing doctors, they saved my life!",
                ][i % 10],
                "language": "en",
                "timestamp": datetime.utcnow() - timedelta(days=i % 30),
                "status": "processed" if i % 2 == 0 else "pending",
                "emotion": ["joy", "satisfaction", "neutral", "dissatisfaction", "anger"][i % 5] if i % 2 == 0 else None,
                "confidence_score": 0.85 + (i % 15) * 0.01 if i % 2 == 0 else None,
                "processed_at": datetime.utcnow() if i % 2 == 0 else None
            }
            for i in range(count)
        ]
        
        result = await db[COLLECTION_NAME].insert_many(demo_feedbacks)
        
        return {
            "status": "success",
            "message": f"Created {len(result.inserted_ids)} demo feedback items",
            "count": len(result.inserted_ids),
            "ids": [str(id) for id in result.inserted_ids[:5]] + (["..."] if len(result.inserted_ids) > 5 else [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/test/populate-detailed-demo-data")
async def populate_detailed_demo_data(count: int = 20):
    """
    Populate database with detailed demo feedback data including department-specific questions.
    """
    try:
        demo_feedbacks = []
        departments = ["Emergency", "ICU", "Oncology", "Cardiology", "Pediatrics"]
        
        for i in range(count):
            dept = departments[i % 5]
            base_date = datetime.utcnow() - timedelta(days=i % 30)
            
            # Detailed responses based on department
            all_responses = {
                "How satisfied are you with care?": str((i % 5) + 1),
                "How would you rate cleanliness?": str((i % 5) + 1),
                "Additional comments?": ["Good", "Bad", "Excellent", "Poor", "Average"][i % 5],
                "What did you appreciate most about our service?": [
                    "Professional staff",
                    "Quick response",
                    "Caring attitude",
                    "Good facilities",
                    "Excellent doctors"
                ][i % 5],
                "What areas can we improve?": [
                    "Staff behaviour",
                    "Wait times",
                    "Cleanliness",
                    "Facilities",
                    "Communication"
                ][i % 5],
                "test": ["good", "bad", "okay", "excellent", "poor"][i % 5]
            }
            
            detailed_analysis = {
                "How satisfied are you with care?": {"emotion": ["joy", "satisfaction", "neutral", "concern", "anger"][i % 5], "confidence": 0.85},
                "How would you rate cleanliness?": {"emotion": ["satisfaction", "neutral", "dissatisfaction", "surprise", "joy"][i % 5], "confidence": 0.78},
                "Additional comments?": {"emotion": ["satisfaction", "dissatisfaction", "neutral", "joy", "concern"][i % 5], "confidence": 0.82},
                "What did you appreciate most about our service?": {"emotion": ["joy", "satisfaction", "gratitude", "surprise", "neutral"][i % 5], "confidence": 0.88},
                "What areas can we improve?": {"emotion": ["dissatisfaction", "concern", "neutral", "suggestion", "anger"][i % 5], "confidence": 0.80},
                "test": {"emotion": ["dissatisfaction", "dissatisfaction", "neutral", "dissatisfaction", "dissatisfaction"][i % 5], "confidence": 0.64}
            }
            
            # Calculate overall emotion from the most frequent emotion in detailed_analysis
            emotions_list = [q_analysis["emotion"] for q_analysis in detailed_analysis.values()]
            emotion_counts = {}
            for emotion in emotions_list:
                emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
            overall_emotion = max(emotion_counts, key=emotion_counts.get)
            
            # Calculate average confidence
            confidence_scores = [q_analysis["confidence"] for q_analysis in detailed_analysis.values()]
            overall_confidence = sum(confidence_scores) / len(confidence_scores)
            
            # Calculate overall rating from responses and emotions
            overall_rating = calculate_rating_from_responses(all_responses, detailed_analysis)
            
            feedback_record = {
                "patient_name": f"Patient {i+1}",
                "department": dept,
                "rating": overall_rating,
                "feedback_text": "Detailed feedback with multiple responses",
                "language": "en",
                "timestamp": base_date,
                "status": "processed",
                "emotion": overall_emotion,
                "confidence_score": overall_confidence,
                "processed_at": base_date + timedelta(hours=1),
                "all_responses": all_responses,
                "detailed_analysis": detailed_analysis
            }
            demo_feedbacks.append(feedback_record)
        
        result = await db[COLLECTION_NAME].insert_many(demo_feedbacks)
        
        return {
            "status": "success",
            "message": f"Created {len(result.inserted_ids)} detailed demo feedback items",
            "count": len(result.inserted_ids)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/test/clear-database")
async def clear_database():
    """
    Clear all feedback data from database (for testing only).
    
    Returns:
        Status and count of deleted items
    """
    try:
        result = await db[COLLECTION_NAME].delete_many({})
        
        return {
            "status": "success",
            "message": f"Deleted {result.deleted_count} feedback items",
            "count": result.deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/reports/export")
async def export_feedback(format: str = "json", start_date: Optional[str] = None, end_date: Optional[str] = None):
    """
    Export feedback data in different formats.
    
    Args:
        format: Export format (json, csv)
        start_date: Filter from date (ISO format)
        end_date: Filter to date (ISO format)
    
    Returns:
        Exported data or CSV file
    """
    try:
        # Build filter
        filter_query = {}
        if start_date or end_date:
            filter_query["timestamp"] = {}
            if start_date:
                filter_query["timestamp"]["$gte"] = datetime.fromisoformat(start_date)
            if end_date:
                filter_query["timestamp"]["$lte"] = datetime.fromisoformat(end_date)
        
        # Get all feedback
        feedbacks = await db[COLLECTION_NAME].find(filter_query).to_list(None)
        
        # Convert ObjectId to string
        for feedback in feedbacks:
            feedback["_id"] = str(feedback["_id"])
        
        if format.lower() == "csv":
            # For CSV, return structured data that frontend can use to generate CSV
            return {
                "status": "success",
                "format": "csv",
                "count": len(feedbacks),
                "data": feedbacks
            }
        else:
            # Default JSON format
            return {
                "status": "success",
                "format": "json",
                "count": len(feedbacks),
                "data": feedbacks,
                "export_date": datetime.utcnow().isoformat()
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== DEPARTMENT & QUESTIONS MANAGEMENT ENDPOINTS =====

@app.get("/api/departments")
async def get_departments():
    """
    Get all departments in the system.
    
    Returns:
        List of departments
    """
    try:
        departments = await db[DEPARTMENTS_COLLECTION_NAME].find().to_list(None)
        
        for dept in departments:
            dept["_id"] = str(dept["_id"])
        
        return {
            "status": "success",
            "count": len(departments),
            "departments": departments
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/departments")
async def create_department(department: DepartmentModel):
    """
    Create a new department.
    
    Args:
        department: Department details
    
    Returns:
        Created department with ID
    """
    try:
        # Check if department name already exists
        existing = await db[DEPARTMENTS_COLLECTION_NAME].find_one({"name": department.name})
        if existing:
            raise HTTPException(status_code=400, detail="Department already exists")
        
        dept_dict = department.dict(by_alias=True, exclude_unset=True)
        dept_dict["_id"] = ObjectId()
        
        result = await db[DEPARTMENTS_COLLECTION_NAME].insert_one(dept_dict)
        
        # Create default questions collection for this department
        await db[QUESTIONS_COLLECTION_NAME].insert_one({
            "_id": ObjectId(),
            "department_name": department.name,
            "questions": [
                {
                    "_id": ObjectId(),
                    "question_text": "How would you rate your overall experience?",
                    "question_type": "rating",
                    "required": True,
                    "order": 1
                },
                {
                    "_id": ObjectId(),
                    "question_text": "What did you appreciate most about our service?",
                    "question_type": "paragraph",
                    "required": True,
                    "order": 2
                },
                {
                    "_id": ObjectId(),
                    "question_text": "What areas can we improve?",
                    "question_type": "paragraph",
                    "required": False,
                    "order": 3
                }
            ],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        return {
            "status": "success",
            "message": "Department created successfully",
            "id": str(result.inserted_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/departments/{department}/questions")
async def get_department_questions(department: str):
    """
    Get all questions for a specific department.
    
    Args:
        department: Department name
    
    Returns:
        List of questions for the department
    """
    try:
        dept_questions = await db[QUESTIONS_COLLECTION_NAME].find_one({"department_name": department})
        
        if not dept_questions:
            raise HTTPException(status_code=404, detail="Department not found")
        
        dept_questions["_id"] = str(dept_questions["_id"])
        for question in dept_questions.get("questions", []):
            if "_id" in question:
                question["_id"] = str(question["_id"])
        
        return {
            "status": "success",
            "department": department,
            "questions": dept_questions.get("questions", [])
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/departments/{department}/questions")
async def add_question_to_department(department: str, question: QuestionModel):
    """
    Add a new question to a department's feedback form.
    Also triggers automatic addition to Google Form.
    
    Args:
        department: Department name
        question: Question details
    
    Returns:
        Success status
    """
    try:
        # Convert Pydantic model to dict, excluding the id field
        question_dict = question.dict(exclude={"id"})
        question_dict["_id"] = ObjectId()
        
        result = await db[QUESTIONS_COLLECTION_NAME].update_one(
            {"department_name": department},
            {
                "$push": {"questions": question_dict},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        if result.matched_count == 0:
            # Create new department questions entry if not exists
            await db[QUESTIONS_COLLECTION_NAME].insert_one({
                "_id": ObjectId(),
                "department_name": department,
                "questions": [question_dict],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
        
        # Trigger Google Form auto-update (fire and forget)
        try:
            asyncio.create_task(add_question_to_google_form(department, question_dict))
        except Exception as e:
            print(f"⚠️ Warning: Could not add question to Google Form: {e}")
        
        return {
            "status": "success",
            "message": "Question added successfully",
            "question_id": str(question_dict["_id"])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/departments/{department}/questions/{question_id}")
async def update_question(department: str, question_id: str, question: QuestionModel):
    """
    Update a specific question in a department's feedback form.
    
    Args:
        department: Department name
        question_id: Question ID to update
        question: Updated question details
    
    Returns:
        Success status
    """
    try:
        # Convert Pydantic model to dict, excluding the id field
        question_dict = question.dict(exclude={"id"})
        question_dict["_id"] = ObjectId(question_id)
        
        result = await db[QUESTIONS_COLLECTION_NAME].update_one(
            {
                "department_name": department,
                "questions._id": ObjectId(question_id)
            },
            {
                "$set": {
                    "questions.$": question_dict,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Question not found")
        
        return {
            "status": "success",
            "message": "Question updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/departments/{department}/questions/{question_id}")
async def delete_question(department: str, question_id: str):
    """
    Delete a specific question from a department's feedback form.
    
    Args:
        department: Department name
        question_id: Question ID to delete
    
    Returns:
        Success status
    """
    try:
        result = await db[QUESTIONS_COLLECTION_NAME].update_one(
            {"department_name": department},
            {
                "$pull": {"questions": {"_id": ObjectId(question_id)}},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Department not found")
        
        return {
            "status": "success",
            "message": "Question deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/departments/{department}/form-url")
async def update_department_form_url(department: str, form_url: str):
    """
    Update the Google Form URL for a specific department.
    
    Args:
        department: Department name
        form_url: New Google Form URL
    
    Returns:
        Success status
    """
    try:
        result = await db[QUESTIONS_COLLECTION_NAME].update_one(
            {"department_name": department},
            {
                "$set": {
                    "form_url": form_url,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Department not found")
        
        return {
            "status": "success",
            "message": "Form URL updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
