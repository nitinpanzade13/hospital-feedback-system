# 🚀 Setup Guide for Collaborators

## For Your Collaborator (Step-by-Step)

### Step 1: Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/hospital-feedback-system.git
cd hospital-feedback-system
```

### Step 2: Create Environment File
```bash
# Copy the example environment file
cp .env.example .env
```

### Step 3: Configure `.env` File (IMPORTANT ⚠️)

Edit `.env` and update these values with YOUR OWN credentials:

#### A. MongoDB Connection (Required)
```bash
MONGODB_URL=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority
```
**How to get it:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Click "Connect" → "Drivers"
4. Copy the connection string
5. Replace YOUR_USERNAME and YOUR_PASSWORD

#### B. Gmail App Password (Required for Email Features)
```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```
**How to get it:**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification (if not already)
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select "Mail" and "Windows Computer"
5. Copy the 16-character password
6. Paste it as EMAIL_PASSWORD

#### C. JWT Secret Key (Optional - generates automatically if left)
```bash
SECRET_KEY=your-secure-random-key
```
**Generate one:**
```bash
# On Windows PowerShell:
$random = 0..(31) | ForEach-Object { [byte]::Parse('{0:X2}' -f (Get-Random -Minimum 0 -Maximum 256), 'HexNumber') }
[BitConverter]::ToString($random) -replace '-'

# On Mac/Linux:
openssl rand -hex 32
```

#### D. Admin Credentials (Optional - change in production)
```bash
SUPERADMIN_EMAIL=superadmin@hospital.com
SUPERADMIN_PASSWORD=SuperAdmin@123
```
⚠️ **Change these in production!**

#### E. Network URL (Choose one)
```bash
# Option 1: Local Only (Desktop)
APP_URL=http://localhost:3000

# Option 2: Network Access (Phone/Tablet on same network)
APP_URL=http://192.168.x.x:3000
# Replace 192.168.x.x with your actual network IP
# Get your IP: ipconfig (Windows) or ifconfig (Mac/Linux)
```

---

## ✅ Verify Everything Works

Once running, test these URLs:

1. **Frontend Dashboard**: http://localhost:3000
2. **Backend API Docs**: http://localhost:8000/docs
3. **Default Login**:
   - Email: `superadmin@hospital.com`
   - Password: `SuperAdmin@123`

---

## ✅ Manual Setup (Shared Python venv)

Use this if you want to run locally without Docker and share one Python environment for backend + AI worker.

### Step A: Create shared venv (Python 3.11)
```bash
# From project root
C:\Users\nitin\AppData\Local\Programs\Python\Python311\python.exe -m venv .venv
```

### Step B: Install Python dependencies
```bash
.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.venv\Scripts\python.exe -m pip install -r ai_worker\requirements.txt
```

### Step C: Install PyTorch (CUDA)
```bash
.venv\Scripts\python.exe -m pip install torch==2.1.0 torchvision==0.16.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cu121
```

### Step D: Start services
```bash
# Backend
.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# AI worker (new terminal)
.venv\Scripts\python.exe ai_worker\worker.py

# Frontend (new terminal)
cd frontend
npm install
npm start
```

### Step E: Verify GPU
```bash
.venv\Scripts\python.exe -c "import torch; print(torch.cuda.is_available()); print(torch.version.cuda)"
```

## 🔧 Troubleshooting

### Problem: "Cannot connect to backend"
- **Solution**: Check MongoDB URL in `.env`

### Problem: "Verification emails not sending"
- **Solution**: Check Gmail App Password in `.env`

### Problem: "Frontend shows blank page"
- **Solution**: Reinstall frontend dependencies
  ```bash
  cd frontend
  npm install
  npm start
  ```

### Problem: "Port 3000 or 8000 already in use"
- **Solution**: Stop other services or change the port in your run command

### Problem: "CUDA not available" (torch.cuda.is_available() == False)
- **Solution**: Install CUDA-enabled PyTorch (see Manual Setup Step C)
- **Verify driver**: `nvidia-smi`

---

## 📝 Environment File Template

See [.env.example](.env.example) for all available configuration options.

**Never commit `.env` file** - it contains sensitive credentials!

---

## 🎯 Quick Summary

| Step | Command | Time |
|------|---------|------|
| Clone | `git clone ...` | 1 min |
| Setup `.env` | `cp .env.example .env` + edit | 5 min |
| Install deps | `pip install -r ...` + `npm install` | 5 min |
| Start services | `uvicorn` + `worker.py` + `npm start` | 2 min |
| **Total** | | **13 min** |

---

## ❓ Questions?

Refer to:
- [README.md](README.md) - Project overview
- [API Documentation](http://localhost:8000/docs) - API endpoints after startup

Happy coding! 🎉
