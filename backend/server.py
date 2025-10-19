from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from decimal import Decimal

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Models
class UserCreate(BaseModel):
    agency_name: str
    email: EmailStr
    password: str
    role: str = "sub_agency"
    locale: str = "ru"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    agency_name: str
    email: str
    role: str
    is_active: bool
    locale: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class ReservationCreate(BaseModel):
    agency_id: str
    agency_name: str
    date_of_issue: str
    service_type: str
    date_of_service: str
    description: str
    tourist_names: str
    price: float
    actual_date_of_full_payment: Optional[str] = None
    actual_date_of_prepayment: Optional[str] = None
    prepayment_amount: Optional[float] = 0
    rest_amount_of_payment: Optional[float] = 0
    last_date_of_payment: str
    supplier: Optional[str] = ""
    supplier_price: Optional[float] = 0
    supplier_prepayment_amount: Optional[float] = 0
    revenue: Optional[float] = 0
    revenue_percentage: Optional[float] = 0

class ReservationUpdate(BaseModel):
    agency_id: Optional[str] = None
    agency_name: Optional[str] = None
    date_of_issue: Optional[str] = None
    service_type: Optional[str] = None
    date_of_service: Optional[str] = None
    description: Optional[str] = None
    tourist_names: Optional[str] = None
    price: Optional[float] = None
    actual_date_of_full_payment: Optional[str] = None
    actual_date_of_prepayment: Optional[str] = None
    prepayment_amount: Optional[float] = None
    rest_amount_of_payment: Optional[float] = None
    last_date_of_payment: Optional[str] = None
    supplier: Optional[str] = None
    supplier_price: Optional[float] = None
    supplier_prepayment_amount: Optional[float] = None
    revenue: Optional[float] = None
    revenue_percentage: Optional[float] = None

class ReservationResponse(BaseModel):
    id: str
    agency_id: str
    agency_name: str
    date_of_issue: str
    service_type: str
    date_of_service: str
    description: str
    tourist_names: str
    price: float
    actual_date_of_full_payment: Optional[str] = None
    actual_date_of_prepayment: Optional[str] = None
    prepayment_amount: float
    rest_amount_of_payment: float
    last_date_of_payment: str
    supplier: Optional[str] = None
    supplier_price: Optional[float] = None
    supplier_prepayment_amount: Optional[float] = None
    revenue: Optional[float] = None
    revenue_percentage: Optional[float] = None
    created_at: str
    updated_at: str

class SettingsResponse(BaseModel):
    upcoming_due_threshold_days: int

class SettingsUpdate(BaseModel):
    upcoming_due_threshold_days: int

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

async def require_admin(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Initialize default admin and settings
@app.on_event("startup")
async def startup_event():
    # Create admin if not exists
    admin_email = "b2b@4travels.net"
    admin_exists = await db.users.find_one({"email": admin_email})
    
    if not admin_exists:
        admin_user = {
            "id": str(uuid.uuid4()),
            "agency_name": "4Travels Admin",
            "email": admin_email,
            "password_hash": hash_password("Admin123!"),
            "role": "admin",
            "is_active": True,
            "locale": "ru",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        logger.info(f"Admin user created: {admin_email}")
    
    # Create default settings if not exists
    settings = await db.settings.find_one({"id": "default"})
    if not settings:
        default_settings = {
            "id": "default",
            "upcoming_due_threshold_days": 7
        }
        await db.settings.insert_one(default_settings)
        logger.info("Default settings created")

# Auth routes
@api_router.post("/auth/register", response_model=UserResponse)
async def register_user(user_data: UserCreate, admin: dict = Depends(require_admin)):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = {
        "id": str(uuid.uuid4()),
        "agency_name": user_data.agency_name,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "role": user_data.role,
        "is_active": True,
        "locale": user_data.locale,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_dict)
    
    return UserResponse(
        id=user_dict["id"],
        agency_name=user_dict["agency_name"],
        email=user_dict["email"],
        role=user_dict["role"],
        is_active=user_dict["is_active"],
        locale=user_dict["locale"],
        created_at=user_dict["created_at"]
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is disabled")
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    user_response = UserResponse(
        id=user["id"],
        agency_name=user["agency_name"],
        email=user["email"],
        role=user["role"],
        is_active=user["is_active"],
        locale=user.get("locale", "ru"),
        created_at=user["created_at"]
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        agency_name=user["agency_name"],
        email=user["email"],
        role=user["role"],
        is_active=user["is_active"],
        locale=user.get("locale", "ru"),
        created_at=user["created_at"]
    )

@api_router.post("/auth/change-password")
async def change_password(password_data: PasswordChange, user: dict = Depends(get_current_user)):
    # Verify old password
    if not verify_password(password_data.old_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    # Update password
    new_hash = hash_password(password_data.new_password)
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password_hash": new_hash}}
    )
    
    return {"message": "Password changed successfully"}

# User management routes (Admin only)
@api_router.get("/users", response_model=List[UserResponse])
async def get_users(admin: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return [UserResponse(**user) for user in users]

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, admin: dict = Depends(require_admin)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**user)

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, user_data: Dict[str, Any], admin: dict = Depends(require_admin)):
    if "password" in user_data:
        user_data["password_hash"] = hash_password(user_data.pop("password"))
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": user_data}
    )
    return {"message": "User updated successfully"}

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(require_admin)):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# Reservation routes
@api_router.post("/reservations", response_model=ReservationResponse)
async def create_reservation(reservation: ReservationCreate, admin: dict = Depends(require_admin)):
    reservation_dict = reservation.model_dump()
    reservation_dict["id"] = str(uuid.uuid4())
    reservation_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    reservation_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.reservations.insert_one(reservation_dict)
    
    return ReservationResponse(**reservation_dict)

@api_router.get("/reservations")
async def get_reservations(
    user: dict = Depends(get_current_user),
    search: Optional[str] = None,
    service_type: Optional[str] = None,
    payment_status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    page: int = 1,
    limit: int = 25
):
    query = {}
    
    # Filter by agency for sub-agencies
    if user["role"] == "sub_agency":
        query["agency_id"] = user["id"]
    
    # Search filter
    if search:
        query["$or"] = [
            {"agency_name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tourist_names": {"$regex": search, "$options": "i"}}
        ]
    
    # Service type filter
    if service_type:
        query["service_type"] = service_type
    
    # Date filters
    if date_from or date_to:
        date_query = {}
        if date_from:
            date_query["$gte"] = date_from
        if date_to:
            date_query["$lte"] = date_to
        query["date_of_service"] = date_query
    
    # Get total count
    total = await db.reservations.count_documents(query)
    
    # Pagination
    skip = (page - 1) * limit
    
    # Fields to exclude based on role
    projection = {"_id": 0}
    if user["role"] == "sub_agency":
        projection["supplier"] = 0
        projection["supplier_price"] = 0
        projection["supplier_prepayment_amount"] = 0
        projection["revenue"] = 0
        projection["revenue_percentage"] = 0
    
    reservations = await db.reservations.find(query, projection).skip(skip).limit(limit).to_list(limit)
    
    # Apply payment status filter after fetch (since it's computed)
    if payment_status:
        filtered_reservations = []
        for res in reservations:
            res_status = compute_payment_status(res)
            if payment_status == "paid" and res_status == "paid":
                filtered_reservations.append(res)
            elif payment_status == "prepaid" and res_status == "prepaid":
                filtered_reservations.append(res)
            elif payment_status == "overdue" and res_status == "overdue":
                filtered_reservations.append(res)
            elif payment_status == "upcoming" and res_status == "upcoming":
                filtered_reservations.append(res)
        reservations = filtered_reservations
    
    return {
        "reservations": reservations,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

def compute_payment_status(reservation: dict) -> str:
    rest = reservation.get("rest_amount_of_payment", 0)
    prepayment = reservation.get("prepayment_amount", 0)
    last_date = reservation.get("last_date_of_payment")
    
    if rest == 0:
        return "paid"
    elif prepayment > 0 and rest > 0:
        if last_date:
            try:
                last_date_obj = datetime.fromisoformat(last_date.replace("Z", "+00:00"))
                today = datetime.now(timezone.utc)
                if today > last_date_obj:
                    return "overdue"
                else:
                    days_diff = (last_date_obj - today).days
                    if days_diff <= 7:
                        return "upcoming"
            except:
                pass
        return "prepaid"
    elif rest > 0:
        if last_date:
            try:
                last_date_obj = datetime.fromisoformat(last_date.replace("Z", "+00:00"))
                today = datetime.now(timezone.utc)
                if today > last_date_obj:
                    return "overdue"
            except:
                pass
        return "unpaid"
    return "unpaid"

@api_router.get("/reservations/{reservation_id}")
async def get_reservation(reservation_id: str, user: dict = Depends(get_current_user)):
    projection = {"_id": 0}
    if user["role"] == "sub_agency":
        projection["supplier"] = 0
        projection["supplier_price"] = 0
        projection["supplier_prepayment_amount"] = 0
        projection["revenue"] = 0
        projection["revenue_percentage"] = 0
    
    reservation = await db.reservations.find_one({"id": reservation_id}, projection)
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    # Check access for sub-agencies
    if user["role"] == "sub_agency" and reservation["agency_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return reservation

@api_router.put("/reservations/{reservation_id}")
async def update_reservation(
    reservation_id: str,
    reservation_data: ReservationUpdate,
    admin: dict = Depends(require_admin)
):
    update_dict = {k: v for k, v in reservation_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.reservations.update_one(
        {"id": reservation_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    return {"message": "Reservation updated successfully"}

@api_router.delete("/reservations/{reservation_id}")
async def delete_reservation(reservation_id: str, admin: dict = Depends(require_admin)):
    result = await db.reservations.delete_one({"id": reservation_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reservation not found")
    return {"message": "Reservation deleted successfully"}

# Settings routes
@api_router.get("/settings", response_model=SettingsResponse)
async def get_settings(user: dict = Depends(get_current_user)):
    settings = await db.settings.find_one({"id": "default"}, {"_id": 0})
    if not settings:
        return SettingsResponse(upcoming_due_threshold_days=7)
    return SettingsResponse(**settings)

@api_router.put("/settings")
async def update_settings(settings_data: SettingsUpdate, admin: dict = Depends(require_admin)):
    await db.settings.update_one(
        {"id": "default"},
        {"$set": settings_data.model_dump()},
        upsert=True
    )
    return {"message": "Settings updated successfully"}

# Statistics route
@api_router.get("/statistics")
async def get_statistics(user: dict = Depends(get_current_user)):
    query = {}
    if user["role"] == "sub_agency":
        query["agency_id"] = user["id"]
    
    projection = {"_id": 0}
    if user["role"] == "sub_agency":
        projection["supplier"] = 0
        projection["supplier_price"] = 0
        projection["supplier_prepayment_amount"] = 0
        projection["revenue"] = 0
        projection["revenue_percentage"] = 0
    
    reservations = await db.reservations.find(query, projection).to_list(10000)
    
    total_price = sum(r.get("price", 0) for r in reservations)
    total_prepayment = sum(r.get("prepayment_amount", 0) for r in reservations)
    total_rest = sum(r.get("rest_amount_of_payment", 0) for r in reservations)
    
    stats = {
        "total_reservations": len(reservations),
        "total_price": round(total_price, 2),
        "total_prepayment": round(total_prepayment, 2),
        "total_rest": round(total_rest, 2)
    }
    
    if user["role"] == "admin":
        total_revenue = sum(r.get("revenue", 0) for r in reservations)
        stats["total_revenue"] = round(total_revenue, 2)
    
    return stats

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()