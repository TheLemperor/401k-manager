# 401(k) Contribution Manager

A web application for managing 401(k) retirement contributions with real-time projections and impact analysis.

## Features
- Toggle between percentage and fixed dollar contributions
- Interactive slider/input for contribution adjustments
- Real-time retirement balance projections
- Year-to-date contribution tracking
- IRS limit tracking and validation
- Impact analysis for contribution changes

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

The application will be available at http://localhost:3000

## Tech Stack
- **Frontend**: React, Material-UI, Recharts
- **Backend**: Django REST Framework
- **Database**: SQLite

## Architecture
- Single-page React application with responsive design
- RESTful API backend with Django
- Mock data generation for YTD contributions
- Real-time retirement projections using compound interest calculations
```

## requirements.txt
Create `backend/requirements.txt`:
```
Django==5.0.1
djangorestframework==3.14.0
django-cors-headers==4.3.1