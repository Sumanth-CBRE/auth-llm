from datetime import timedelta
import os

from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends, HTTPException, status, APIRouter, Body
from sqlalchemy.orm import Session

from ..auth.auth_handler import (
    authenticate_user, ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, get_user, get_password_hash,
    get_current_active_user, oauth2_scheme, user_db, token_usage
)
from ..database import get_db
from ..schemas import Token, UserCreate, UserResponse
from ..models import User
import openai

openai.api_key = os.getenv("OPENAI_API_KEY")

router = APIRouter()


@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user(db, user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered.")
    hashed_password = get_password_hash(user.password)
    db_user = User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/token")
async def login_for_access_token(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: Session = Depends(get_db)
) -> Token:
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")


@router.post("/generate")
async def generate(prompt: str = Body(..., embed=True), current_user: User = Depends(get_current_active_user), token: str = Depends(oauth2_scheme)):
    # Ensure user_db entry exists for the current user
    if current_user.username not in user_db:
        user_db[current_user.username] = {"credits": 5}
    if user_db[current_user.username]["credits"] <= 0:
        raise HTTPException(status_code=401, detail="No credits left for this user.")
    usage = token_usage.get(token, 0)
    if usage >= 5:
        raise HTTPException(status_code=401, detail="Token usage limit reached. Please logout and login again to get a new token.")
    token_usage[token] = usage + 1
    user_db[current_user.username]["credits"] -= 1
    # Use OpenAI API for chat completion
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
    )
    return {
        "response": response["choices"][0]["message"]["content"],
        "credits_left": user_db[current_user.username]["credits"],
        "token_uses_left": 5 - token_usage[token]
    }
