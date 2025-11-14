# Medicine Reminder Web App

A full-stack (Node.js + Express + MongoDB) Medicine Reminder Web App scaffold created by ChatGPT.

## What's included
- `backend/` - Express server, Mongoose models, routes, controllers, simple scheduler (simulated).
- `frontend/` - Minimal HTML/CSS/JS pages for Login, Dashboard, Add Medicine, Reminders, History.
- `postman_collection.json` - Example endpoints (manual).
- `package.json` - Backend dependencies.
- `README` with instructions.

## Quick start (backend)
1. Ensure Node.js (v16+) and MongoDB are installed / accessible.
2. Run:
```bash
cd backend
npm install
cp .env.example .env   # edit MONGO_URL and JWT_SECRET if needed
node server.js
```
3. Server runs on `http://localhost:4000`

## Frontend
Open `frontend/index.html` in your browser. The frontend uses the API at `http://localhost:4000/api/...` by default.

## Notes
- This scaffold is for hackathon / prototype purposes. Improve validation, error handling and security for production.
