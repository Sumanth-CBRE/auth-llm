import jwt
from fastapi import Depends, HTTPException, status, APIRouter, Body
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from typing import Dict

from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import TokenData
from ..models import User
import ollama  # Assuming ollama is installed and imported

# to get a string like this run:
# openssl rand -hex 32
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

router = APIRouter()

# In-memory stores for demo (replace with DB in production)
user_db: Dict[str, dict] = {}
token_usage: Dict[str, int] = {}


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def get_user(db: Session, username: str):
    db_user = db.query(User).filter(User.username == username).first()
    print(f"[DEBUG] get_user: username={username}, db_user={db_user}")
    return db_user


def authenticate_user(db: Session, username: str, password: str):
    print(f"[DEBUG] authenticate_user: username={username}, password={password}")
    user = get_user(db, username)
    print(f"[DEBUG] authenticate_user: user from db={user}")
    if not user:
        print("[DEBUG] authenticate_user: user not found")
        return False
    if not verify_password(password, user.hashed_password):
        print(f"[DEBUG] authenticate_user: password mismatch for user {username}")
        return False
    print(f"[DEBUG] authenticate_user: authentication successful for user {username}")
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except InvalidTokenError:
        raise credentials_exception

    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/register")
def register(username: str = Body(...), password: str = Body(...), db: Session = Depends(get_db)):
    if get_user(db, username):
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(password)
    # Add user to DB (replace with ORM logic as needed)
    new_user = User(username=username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    user_db[username] = {"credits": 5}
    return {"msg": "User registered successfully"}


@router.post("/login")
def login(username: str = Body(...), password: str = Body(...), db: Session = Depends(get_db)):
    user = authenticate_user(db, username, password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.username})
    if username not in user_db:
        user_db[username] = {"credits": 5}
    return {"access_token": access_token, "token_type": "bearer", "credits": user_db[username]["credits"]}


@router.post("/generate")
async def generate(prompt: str = Body(..., embed=True), current_user: User = Depends(get_current_active_user), token: str = Depends(oauth2_scheme)):
    if user_db[current_user.username]["credits"] <= 0:
        raise HTTPException(status_code=401, detail="No credits left for this user.")
    usage = token_usage.get(token, 0)
    if usage >= 5:
        raise HTTPException(status_code=401, detail="Token usage limit reached. Please logout and login again to get a new token.")
    token_usage[token] = usage + 1
    user_db[current_user.username]["credits"] -= 1
    response = ollama.chat(model="mistral", messages=[{"role": "user", "content": prompt}])
    return {"response": response["message"]["content"], "credits_left": user_db[current_user.username]["credits"], "token_uses_left": 5 - token_usage[token]}
