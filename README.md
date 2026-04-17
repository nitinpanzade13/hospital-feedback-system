# Hospital Feedback System - Complete Architecture Guide

## 🏥 System Overview

A decoupled, scalable architecture for real-time patient feedback analysis leveraging:
- **Google Form** for multilingual data entry
- **FastAPI Backend** as the central traffic controller
- **MongoDB Atlas** for data persistence
- **Local GPU Worker** for cost-efficient AI processing
- **React Dashboard** for admin visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                        QR CODE (Hospital)                       │
│                              ↓                                   │
│                      GOOGLE FORM (Multilingual)                │
│                              ↓                                   │
│              GOOGLE APPS SCRIPT (Webhook Trigger)             │
│                              ↓                                   │
├─────────────────────────────────────────────────────────────────┤
│                      FASTAPI BACKEND (8000)                    │
│                    - Receives feedback                          │
│                    - Stores in MongoDB                          │
│                    - Serves dashboard API                       │
├─────────────────────────────────────────────────────────────────┤
│                      MONGODB ATLAS (Cloud)                     │
│                   - Feedback (pending, processed)              │
│                   - Indexed by status, department              │
├─────────────────────────────────────────────────────────────────┤
│              AI WORKER (Local GPU - 6GB VRAM)                  │
│           - Polls for pending feedback                          │
│           - XLM-RoBERTa analysis                               │
│           - Updates results in MongoDB                          │
├─────────────────────────────────────────────────────────────────┤
│            REACT DASHBOARD (Admin Portal - 3000)              │
│         - Real-time emotion distribution                       │
│         - Department-wise trends                               │
│         - Plotly visualizations                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
Hospital Feedback Project/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt        # Python dependencies
│   └── .env                    # Configuration
│
├── frontend/
│   ├── package.json           # React dependencies
│   ├── src/
│   │   ├── App.js             # Main component
│   │   ├── App.css            # Styling
│   │   ├── index.js           # Entry point
│   │   └── components/
│   │       ├── DashboardSummary.js
│   │       ├── EmotionHeatmap.js
│   │       ├── DepartmentTrends.js
│   │       ├── RecentFeedback.js
│   │       └── TimeSeries.js
│   └── public/
│       └── index.html
│
├── ai_worker/
│   ├── worker.py              # GPU sentiment analysis
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Configuration
│
├── scripts/
│   └── google_apps_script.js  # Google Apps Script webhook
│
├── config/
│   └── .env.example           # Environment template
│
└── README.md                  # This file
```

---

## 🚀 Quick Start

### Prerequisites

#### Option 1: Docker (Recommended - Easiest)
- Docker Desktop ([Download](https://www.docker.com/products/docker-desktop))
- Docker Compose (usually included with Docker Desktop)
- MongoDB Atlas account (free tier available)

#### Option 2: Local Setup
- Python 3.9+
- Node.js 16+
- MongoDB Atlas account
- NVIDIA GPU (6GB+ VRAM) for AI Worker
- CUDA 11.8+

---

## 📦 Setup with Docker (Recommended)

### 1. Clone and Configure

```bash
# Clone the repository
git clone https://github.com/your-username/hospital-feedback-system.git
cd hospital-feedback-system

# Copy environment template and configure
cp .env.example .env

# Edit .env file with your credentials:
# - MONGODB_URL: Your MongoDB Atlas connection string
# - EMAIL_USER: Your Gmail address
# - EMAIL_PASSWORD: Your Gmail App Password (see below)
# - APP_URL: Your machine's network IP (e.g., http://192.168.1.100:3000)
```

### 2. Get Gmail App Password (Required for Email)
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification (if not already enabled)
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select "Mail" and "Windows Computer"
5. Copy the 16-character password to `EMAIL_PASSWORD` in `.env`

### 3. Get MongoDB Connection String
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (free tier available)
3. Click "Connect" → "Drivers"
4. Copy the connection string: `mongodb+srv://username:password@...`
5. Replace username, password, and add to `MONGODB_URL` in `.env`

### 4. Run with Docker

```bash
# Start all services (Backend, Frontend, AI Worker)
docker-compose up -d

# Check if containers are running
docker-compose ps

# View logs
docker-compose logs -f

# Access the application:
# Frontend: http://localhost:3000
# Backend API Docs: http://localhost:8000/docs
```

### 5. First Login
- Email: `superadmin@hospital.com` (default from `.env`)
- Password: `SuperAdmin@123` (default from `.env`)
- ⚠️ Change these credentials immediately in production!

### Useful Docker Commands

```bash
# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart backend
docker-compose restart frontend

# View logs for a service
docker-compose logs backend -f

# Rebuild images after code changes
docker-compose up -d --build
```

---

## 💻 Local Setup (Alternative)

### 1. Clone Repository

```bash
git clone https://github.com/your-username/hospital-feedback-system.git
cd hospital-feedback-system

# Copy environment file
cp .env.example .env
# Edit .env with your credentials
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**API Documentation:** http://localhost:8000/docs

### 3. Frontend Setup (New Terminal)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

**Dashboard:** http://localhost:3000

### 4. AI Worker Setup (Optional - New Terminal)

```bash
cd ai_worker

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies (may take 5-10 minutes)
pip install -r requirements.txt

# Run worker
python worker.py
```

---

## 🔧 Configuration Guide

### Backend (.env)

```env
# MongoDB Connection
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=hospital_feedback

# API Settings
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:8000
```

### AI Worker (.env)

```env
# Backend URL for polling
BACKEND_URL=http://localhost:8000

# Processing settings
POLLING_INTERVAL=5           # seconds between polls
BATCH_SIZE=10                # feedback items per batch

# GPU configuration
# CUDA_VISIBLE_DEVICES=0     # Uncomment to specify GPU
```

---

## 📊 MongoDB Schema

### Feedback Collection

```javascript
{
  _id: ObjectId,
  patient_name: String,
  department: String,              // e.g., "Emergency", "Oncology"
  rating: Number,                  // 1-5 stars
  feedback_text: String,
  language: String,                // e.g., "en", "hi", "es"
  timestamp: ISODate,
  status: String,                  // "pending" or "processed"
  
  // Populated by AI Worker after processing
  emotion: String,                 // e.g., "joy", "frustration"
  confidence_score: Number,        // 0-1
  processed_at: ISODate
}
```

### Indexes (Auto-created)
- `status` - for querying pending/processed feedback
- `department` - for department-wise analytics
- `timestamp` - for time-based sorting

---

## 🔗 Google Apps Script Setup

### Step 1: Create Google Form
1. Go to [Google Forms](https://forms.google.com)
2. Create a new form with questions:
   - **Patient Name** (Short Text)
   - **Department** (Multiple Choice)
   - **Overall Rating** (Linear Scale 1-5)
   - **Feedback** (Paragraph)
   - **Language** (Multiple Choice: English, Hindi, Spanish, etc.)

### Step 2: Set Up Apps Script
1. Click `Tools` → `Script Editor`
2. Copy code from `scripts/google_apps_script.js`
3. Update `BACKEND_URL` with your FastAPI backend URL
4. Update field names to match your form

### Step 3: Add Form Submission Trigger
1. Click `⏰ Current project's triggers`
2. Click `+ Create new trigger`
3. Configure:
   - **Choose which function to run:** `onFormSubmit`
   - **Which runs at deployment:** `New deployments`
   - **Events:** `From spreadsheet` → `On form submit`
4. Click `Save`

### Step 4: Generate QR Code
1. In Apps Script, run `getGoogleFormLink()`
2. Copy the QR code URL
3. Print and display in hospital

---

## 📈 API Endpoints

### Health Check
```bash
GET /health
```

### Receive Feedback (Google Apps Script)
```bash
POST /api/feedback
Content-Type: application/json

{
  "patient_name": "John Doe",
  "department": "Emergency",
  "rating": 4,
  "feedback_text": "Great care!",
  "language": "en"
}
```

### Get Pending Feedback (AI Worker)
```bash
GET /api/feedback/pending?limit=10
```

### Update with Analysis Results (AI Worker)
```bash
POST /api/feedback/{id}/process
Content-Type: application/json

{
  "emotion": "joy",
  "confidence_score": 0.95
}
```

### Dashboard Summary
```bash
GET /api/dashboard/summary

Response:
{
  "overall_stats": {
    "total_feedback": 150,
    "processed": 145,
    "pending": 5
  },
  "emotion_distribution": [
    {
      "_id": "joy",
      "count": 45,
      "avg_confidence": 0.92
    },
    ...
  ],
  "department_trends": [
    {
      "_id": "Emergency",
      "count": 50,
      "avg_rating": 4.2,
      "emotions": ["joy", "satisfaction", ...]
    },
    ...
  ],
  "recent_feedback": [...]
}
```

### Time Series Data
```bash
GET /api/dashboard/time-series?days=30

Response:
{
  "time_series": [
    {
      "_id": {
        "year": 2024,
        "month": 4,
        "day": 11
      },
      "count": 12,
      "avg_rating": 4.3
    },
    ...
  ]
}
```

---

## 🤖 AI Model Details

### XLM-RoBERTa (Multilinguality)
- **Model:** `facebook/bart-large-mnli`
- **Type:** Zero-shot classification
- **Languages Supported:** 100+ languages including:
  - English, Hindi, Spanish, French, German, Chinese, Arabic, etc.
- **Emotion Categories:**
  - Positive: joy, happiness, satisfaction, trust, anticipation
  - Neutral: neutral, surprise
  - Negative: dissatisfaction, frustration, anger, sadness, fear

### Processing Flow
```
Raw Feedback → Tokenization → Model Inference → Emotion + Confidence
(Any language)    (Multilingual)    (60GB+ token    (Standardized
                                     vocabulary)     categories)
```

### Performance
- **Throughput:** ~2-5 feedback/second (6GB GPU)
- **Latency:** ~200-500ms per item
- **Memory:** ~6GB for model + batch processing
- **Confidence:** Typically 85-95% for clear sentiments

---

## 📊 Dashboard Features

### 1. Summary Cards
- Total Feedback Count
- Processed Count
- Pending Count
- Processing Rate (%)

### 2. Emotion Heatmap
- Visual distribution of detected emotions
- Count per emotion
- Average confidence score
- Color-coded by emotion intensity

### 3. Department Trends
- Feedback count per department
- Average rating per department
- Most common emotion per department
- Identifies areas needing attention

### 4. Time Series Visualization
- 30-day feedback volume trend
- Average rating trend over time
- Helps identify patterns and improvements

### 5. Recent Feedback Table
- List of latest 20 feedback items
- Patient name, department, rating
- Detected emotion with confidence
- Raw feedback text
- Relative timestamp

### 6. Admin Actions
- Real-time data refresh (5-second polling)
- Department-wise filtering
- Exportable reports (future feature)
- Email alerts for critical issues (future feature)

---

## 🔒 Security Best Practices

### Backend
- ✅ CORS configured for specific origins
- ✅ Input validation with Pydantic
- ✅ MongoDB connection pooling
- ⚠️ TODO: Add authentication (JWT tokens)
- ⚠️ TODO: Rate limiting
- ⚠️ TODO: Request logging/audit trail

### Data Privacy
- ✅ Personal identifying information stored
- ✅ All feedback retained for audit
- ⚠️ TODO: GDPR compliance (data export/deletion)
- ⚠️ TODO: Data encryption at rest
- ⚠️ TODO: Role-based access control (Admin/Manager/Viewer)

### Google Apps Script
- ✅ HTTPS connection to backend
- ⚠️ TODO: API key for webhook authentication
- ⚠️ TODO: Signature verification

---

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Error**
```
Error: ServerSelectionTimeoutError
```
- Check MongoDB URL in `.env`
- Ensure IP is whitelisted in MongoDB Atlas
- Verify network connectivity: `ping cluster.mongodb.net`

**Port Already in Use**
```
Address already in use
```
```bash
# Windows: Find and kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8000 | xargs kill -9
```

### Frontend Issues

**API Connection Refused**
```
Failed to fetch dashboard data. Please check your backend connection.
```
- Ensure backend is running: `http://localhost:8000/health`
- Check `REACT_APP_API_URL` in `.env`
- Check CORS settings in FastAPI

**Build Fails**
```bash
# Clear node modules and reinstall
rm -r node_modules package-lock.json
npm install
npm start
```

### AI Worker Issues

**CUDA Out of Memory**
```
RuntimeError: CUDA out of memory
```
- Reduce `BATCH_SIZE` in `.env`
- Close other GPU applications
- Use smaller model: `unilm/xlm-roberta-base`

**Connection Timeout**
```
aiohttp.ClientConnectorError
```
- Ensure backend is running
- Check `BACKEND_URL` in `.env`
- Check firewall settings

**Model Download Stalled**
```bash
# Manually download model
python -c "from transformers import pipeline; pipeline('zero-shot-classification', model='facebook/bart-large-mnli')"
```

---

## 🚢 Deployment Guide

### Option 1: Docker (Recommended)

**Create `Dockerfile` for backend:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/main.py .
ENV MONGODB_URL=mongodb+srv://...

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Option 2: Cloud Platforms

#### **Azure App Service (Backend)**
```bash
az webapp up --name hospital-feedback-api --runtime PYTHON:3.11
```

#### **Firebase Hosting (Frontend)**
```bash
npm run build
firebase deploy --only hosting
```

#### **Google Compute Engine (AI Worker)**
- Create VM with GPU support
- SSH and install CUDA/PyTorch
- Deploy worker.py

### Option 3: On-Premises

#### **Backend: Windows Service**
```batch
# Create service wrapper script
sc create HospitalFeedbackAPI binPath="C:\path\to\python main.py"
```

#### **Frontend: IIS**
```bash
npm run build
# Upload build/ to IIS app
```

#### **AI Worker: Scheduled Task**
- Create batch file: `start_worker.bat`
- Schedule with Task Scheduler

---

## 📝 Example Workflows

### Workflow 1: Patient Submits Feedback
1. Patient scans QR code in-hospital
2. Opens Google Form (auto-detected language)
3. Fills out feedback
4. Submits form
5. Google Apps Script trigger fires
6. Webhook sends to FastAPI backend
7. Backend stores in MongoDB (status: "pending")
8. Dashboard shows in "Pending" count

**Time to completion:** <2 seconds

### Workflow 2: AI Processing
1. AI Worker polls `/api/feedback/pending` every 5 seconds
2. Retrieves 10 pending items
3. XLM-RoBERTa analyzes each item
4. Worker updates MongoDB with emotion + confidence
5. Backend reflects status change to "processed"
6. Dashboard updates emotion distribution in real-time

**Time to completion:** ~20-50 seconds per batch

### Workflow 3: Admin Reviews Dashboard
1. Admin opens React dashboard (http://localhost:3000)
2. Dashboard automatically polls backend (5-second interval)
3. Admin sees:
   - Total/processed/pending counts
   - Emotion distribution
   - Department-wise trends
   - Recent feedback items
   - 30-day trend chart
4. Identifies Emergency Department has high frustration
5. Takes action to improve wait times

---

## 📚 Additional Resources

- **FastAPI Documentation:** https://fastapi.tiangolo.com/
- **Motor (Async MongoDB):** https://motor.readthedocs.io/
- **React Documentation:** https://react.dev/
- **XLM-RoBERTa:** https://huggingface.co/facebook/bart-large-mnli
- **MongoDB Atlas:** https://www.mongodb.com/cloud/atlas
- **Google Apps Script Docs:** https://developers.google.com/apps-script

---

## 📞 Support & Feedback

For issues, improvements, or questions:
1. Check **Troubleshooting** section
2. Review **API Endpoints** documentation
3. Check application logs
4. Contact development team

---

**Last Updated:** April 2026
**Version:** 1.0.0
