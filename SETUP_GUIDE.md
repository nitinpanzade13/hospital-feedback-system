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

## Step 4: Build Frontend

Before starting Docker, build the frontend once:

```bash
cd frontend
npm install
npm run build
cd ..
```

---

## Step 5: Start with Docker

```bash
docker-compose up -d
```

**Check if services are running:**
```bash
docker-compose ps
```

**View logs if there are issues:**
```bash
docker-compose logs -f
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

## 🔧 Troubleshooting

### Problem: "Cannot connect to backend"
- **Solution**: Check MongoDB URL in `.env`
- **Verify**: `docker-compose logs backend`

### Problem: "Verification emails not sending"
- **Solution**: Check Gmail App Password in `.env`
- **Verify**: `docker-compose logs backend | grep -i email`

### Problem: "Frontend shows blank page"
- **Solution**: Rebuild frontend
  ```bash
  cd frontend
  npm run build
  cd ..
  docker-compose restart frontend
  ```

### Problem: "Port 3000 or 8000 already in use"
- **Solution**: Change ports in `docker-compose.yml` or stop other services

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
| Build frontend | `cd frontend && npm run build` | 3 min |
| Start Docker | `docker-compose up -d` | 2 min |
| **Total** | | **11 min** |

---

## ❓ Questions?

Refer to:
- [README.md](README.md) - Project overview
- [API Documentation](http://localhost:8000/docs) - API endpoints after startup
- Check Docker logs: `docker-compose logs`

Happy coding! 🎉
