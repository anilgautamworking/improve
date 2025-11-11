# India Quiz App - Unified Backend Edition

## Setup

### 1. Start Backend (Python/Flask API)
```bash
cd ../DailyQuestionBank-automation
./scripts/start_api.sh
```

This starts the unified Flask backend on port 3001 which provides:
- User authentication
- Question API
- User progress tracking
- Admin dashboard

### 2. Start Frontend (in new terminal)
```bash
cd Dailyquestionbank-frontend
npm run dev
```

## Configuration

- **Backend API**: `http://localhost:3001` (Flask)
- **Frontend**: `http://localhost:5173` (Vite)
- **Database**: `localhost:5432` (PostgreSQL via Docker)
- **Admin Dashboard**: `http://localhost:3001` (Flask)

## Features

✨ **AI-Powered Questions**: Questions automatically generated daily from news articles  
📊 **Dynamic Categories**: Categories and question counts load from database  
🎯 **Smart Filtering**: Time-based filtering (News This Month, Last 3 Months)  
📱 **Mobile Optimized**: Touch gestures for swiping categories and questions  
⚙️ **Settings**: Enforce answer requirement, difficulty filters, statement questions  
🔒 **Authentication**: JWT-based secure authentication  

## Architecture

The app now uses a **unified Python backend** that:
- Scrapes news articles daily via cron
- Generates questions using AI (OpenAI/Ollama)
- Serves both admin dashboard and user API
- Manages all database operations

**No more Node.js/Express backend needed!**

## Database

The backend uses the automation database:
- Host: `localhost`
- Port: `5432`
- Database: `daily_question_bank`
- User: `postgres`
- Password: `postgres`

Database is managed by `DailyQuestionBank-automation` via Docker.

## Development

### Backend Development
```bash
cd ../DailyQuestionBank-automation
source venv/bin/activate
python3 src/api/app.py
```

### Frontend Development
```bash
npm run dev
```

### Generate Questions Manually
```bash
cd ../DailyQuestionBank-automation
source venv/bin/activate
python scripts/run_daily_pipeline.py
```

## Migration Notes

This app has been migrated from Express (Node.js) to Flask (Python).

See `MIGRATION_TO_FLASK.md` for details.

