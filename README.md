# Auth LLM App

A full-stack authentication and LLM prompt-limiting app built with FastAPI (Python backend) and React (frontend).

## Features
- User registration and login (JWT-based authentication)
- Only authenticated users can access the LLM prompt page
- Each user starts with 5 credits (prompts)
- Each token is valid for 5 prompt generations
- Credits and token usage are enforced on the backend
- Modern, interactive React frontend
- Backend ready for OpenAI or other LLM integration

## Project Structure
```
backend/      # FastAPI backend (auth, database, models, routers)
frontend/     # React frontend (components, context, styles)
main.py       # FastAPI app entry point
```

## Quick Start

### Backend
1. Create and activate a Python virtual environment:
   ```sh
   python3 -m venv venv
   source venv/bin/activate
   ```
2. Install dependencies:
   ```sh
   pip install -r backend/requirements.txt
   ```
3. Start the backend server:
   ```sh
   uvicorn main:app --reload
   ```

### Frontend
1. Install dependencies:
   ```sh
   cd frontend
   npm install
   ```
2. Start the frontend dev server:
   ```sh
   npm run dev
   ```
3. Open [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal)

## Usage
- Register a new user (username, email, password)
- Login with your credentials
- Use the prompt page to generate up to 5 LLM responses per token (and 5 credits per user)
- Logout and login again to refresh your token usage

## Customization
- To use OpenAI or another LLM, update the backend `/auth/generate` endpoint to call your preferred API.
- To change credit/token limits, update the logic in the backend.

## License
MIT

---
**Author:** Sumanth ([GitHub](https://github.com/Sumanth-CBRE))
