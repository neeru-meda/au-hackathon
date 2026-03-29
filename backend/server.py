from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, date
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================
# MODELS
# ============================================

class SubjectAttendance(BaseModel):
    math: float = 0.0
    dbms: float = 0.0
    os: float = 0.0

class Student(BaseModel):
    student_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rollNo: str
    name: str
    course: str = "B.Tech CSE"
    email: str
    attendancePercent: float = 100.0
    subjectAttendance: SubjectAttendance = SubjectAttendance()
    status: str = "Eligible"  # Eligible or Shortage

class LoginRequest(BaseModel):
    username: str
    password: str
    role: str  # Teacher or Admin

class LoginResponse(BaseModel):
    success: bool
    message: str
    user: Optional[Dict] = None

class AttendanceRecord(BaseModel):
    record_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str
    subject: str
    period: str
    markedBy: str  # teacher username
    attendance: List[Dict]  # [{rollNo, name, status}]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AttendanceSubmission(BaseModel):
    date: str
    subject: str
    period: str
    markedBy: str
    attendance: List[Dict]

class Alert(BaseModel):
    alert_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    rollNo: str
    name: str
    attendancePercent: float
    status: str = "Pending"  # Pending or Sent
    created_at: datetime = Field(default_factory=datetime.utcnow)
    sent_at: Optional[datetime] = None

class SendAlertRequest(BaseModel):
    alert_id: str

class LetterRequest(BaseModel):
    rollNo: str
    documentType: str  # Bonafide, Study Certificate, Loan Estimation, Internship Permission

# ============================================
# SEED DATA
# ============================================

SEED_STUDENTS = [
    {"rollNo": "R001", "name": "Aarav Kumar", "email": "aarav.kumar@student.au.edu"},
    {"rollNo": "R002", "name": "Vivaan Singh", "email": "vivaan.singh@student.au.edu"},
    {"rollNo": "R003", "name": "Aditya Patel", "email": "aditya.patel@student.au.edu"},
    {"rollNo": "R004", "name": "Vihaan Sharma", "email": "vihaan.sharma@student.au.edu"},
    {"rollNo": "R005", "name": "Arjun Reddy", "email": "arjun.reddy@student.au.edu"},
    {"rollNo": "R006", "name": "Sai Krishna", "email": "sai.krishna@student.au.edu"},
    {"rollNo": "R007", "name": "Reyansh Gupta", "email": "reyansh.gupta@student.au.edu"},
    {"rollNo": "R008", "name": "Ayaan Verma", "email": "ayaan.verma@student.au.edu"},
    {"rollNo": "R009", "name": "Krishna Rao", "email": "krishna.rao@student.au.edu"},
    {"rollNo": "R010", "name": "Ishaan Nair", "email": "ishaan.nair@student.au.edu"},
    {"rollNo": "R011", "name": "Ananya Iyer", "email": "ananya.iyer@student.au.edu"},
    {"rollNo": "R012", "name": "Diya Menon", "email": "diya.menon@student.au.edu"},
    {"rollNo": "R013", "name": "Saanvi Rao", "email": "saanvi.rao@student.au.edu"},
    {"rollNo": "R014", "name": "Aadhya Nair", "email": "aadhya.nair@student.au.edu"},
    {"rollNo": "R015", "name": "Navya Reddy", "email": "navya.reddy@student.au.edu"},
    {"rollNo": "R016", "name": "Priya Singh", "email": "priya.singh@student.au.edu"},
    {"rollNo": "R017", "name": "Kavya Kumar", "email": "kavya.kumar@student.au.edu"},
    {"rollNo": "R018", "name": "Riya Sharma", "email": "riya.sharma@student.au.edu"},
    {"rollNo": "R019", "name": "Aditi Patel", "email": "aditi.patel@student.au.edu"},
    {"rollNo": "R020", "name": "Shriya Gupta", "email": "shriya.gupta@student.au.edu"},
    {"rollNo": "R021", "name": "Rohan Das", "email": "rohan.das@student.au.edu"},
    {"rollNo": "R022", "name": "Karan Verma", "email": "karan.verma@student.au.edu"},
    {"rollNo": "R023", "name": "Pranav Joshi", "email": "pranav.joshi@student.au.edu"},
    {"rollNo": "R024", "name": "Harsh Mehta", "email": "harsh.mehta@student.au.edu"},
    {"rollNo": "R025", "name": "Dev Patel", "email": "dev.patel@student.au.edu"},
    {"rollNo": "R026", "name": "Meera Iyer", "email": "meera.iyer@student.au.edu"},
    {"rollNo": "R027", "name": "Tara Reddy", "email": "tara.reddy@student.au.edu"},
    {"rollNo": "R028", "name": "Nidhi Sharma", "email": "nidhi.sharma@student.au.edu"},
    {"rollNo": "R029", "name": "Pooja Kumar", "email": "pooja.kumar@student.au.edu"},
    {"rollNo": "R030", "name": "Sneha Singh", "email": "sneha.singh@student.au.edu"}
]

# ============================================
# ROUTES
# ============================================

@api_router.post("/seed-data")
async def seed_data():
    """Initialize database with 30 students"""
    try:
        # Check if already seeded
        existing = await db.students.count_documents({})
        if existing > 0:
            return {"message": "Database already seeded", "count": existing}
        
        # Create students with varying attendance
        students = []
        for i, seed_student in enumerate(SEED_STUDENTS):
            # Create varied but realistic attendance percentages
            base_attendance = 85.0 if i % 3 == 0 else (70.0 if i % 5 == 0 else 90.0)
            
            student = Student(
                rollNo=seed_student["rollNo"],
                name=seed_student["name"],
                email=seed_student["email"],
                attendancePercent=base_attendance,
                subjectAttendance=SubjectAttendance(
                    math=base_attendance + (i % 5),
                    dbms=base_attendance - (i % 3),
                    os=base_attendance + (i % 4)
                ),
                status="Eligible" if base_attendance >= 75.0 else "Shortage"
            )
            students.append(student.dict())
        
        result = await db.students.insert_many(students)
        
        # Create alerts for students with shortage
        alerts = []
        for student in students:
            if student["attendancePercent"] < 75.0:
                alert = Alert(
                    student_id=student["student_id"],
                    rollNo=student["rollNo"],
                    name=student["name"],
                    attendancePercent=student["attendancePercent"]
                )
                alerts.append(alert.dict())
        
        if alerts:
            await db.alerts.insert_many(alerts)
        
        return {
            "message": "Database seeded successfully",
            "students_count": len(students),
            "alerts_count": len(alerts)
        }
    except Exception as e:
        logger.error(f"Seed data error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Simple login - hardcoded credentials for demo"""
    try:
        # Hardcoded credentials
        valid_users = {
            "teacher": {"password": "teacher123", "role": "Teacher", "name": "Dr. Ramesh Kumar"},
            "admin": {"password": "admin123", "role": "Admin", "name": "Prof. Suresh Babu"}
        }
        
        user = valid_users.get(request.username.lower())
        
        if user and user["password"] == request.password and user["role"] == request.role:
            return LoginResponse(
                success=True,
                message="Login successful",
                user={
                    "username": request.username,
                    "role": request.role,
                    "name": user["name"]
                }
            )
        else:
            return LoginResponse(
                success=False,
                message="Invalid credentials"
            )
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/students")
async def get_students():
    """Get all students"""
    try:
        students = await db.students.find({}, {"_id": 0}).to_list(100)
        return {"students": students}
    except Exception as e:
        logger.error(f"Get students error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/students/{roll_no}")
async def get_student(roll_no: str):
    """Get a single student by roll number"""
    try:
        student = await db.students.find_one({"rollNo": roll_no}, {"_id": 0})
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        return student
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get student error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/attendance")
async def submit_attendance(submission: AttendanceSubmission):
    """Submit attendance and update student records"""
    try:
        # Save attendance record
        record = AttendanceRecord(**submission.dict())
        await db.attendance_records.insert_one(record.dict())
        
        # Update student attendance percentages
        for entry in submission.attendance:
            if entry["status"] == "Absent":
                student = await db.students.find_one({"rollNo": entry["rollNo"]})
                if student:
                    # Reduce attendance by 2% for each absence (demo calculation)
                    new_percent = max(0, student["attendancePercent"] - 2.0)
                    new_status = "Eligible" if new_percent >= 75.0 else "Shortage"
                    
                    # Update subject attendance too
                    subject_key = submission.subject.lower()
                    if subject_key in student["subjectAttendance"]:
                        new_subject_percent = max(0, student["subjectAttendance"][subject_key] - 2.0)
                        await db.students.update_one(
                            {"rollNo": entry["rollNo"]},
                            {
                                "$set": {
                                    "attendancePercent": new_percent,
                                    "status": new_status,
                                    f"subjectAttendance.{subject_key}": new_subject_percent
                                }
                            }
                        )
                    else:
                        await db.students.update_one(
                            {"rollNo": entry["rollNo"]},
                            {"$set": {"attendancePercent": new_percent, "status": new_status}}
                        )
                    
                    # Create alert if student falls below 75%
                    if new_percent < 75.0:
                        existing_alert = await db.alerts.find_one({
                            "rollNo": entry["rollNo"],
                            "status": "Pending"
                        })
                        if not existing_alert:
                            alert = Alert(
                                student_id=student["student_id"],
                                rollNo=student["rollNo"],
                                name=student["name"],
                                attendancePercent=new_percent
                            )
                            await db.alerts.insert_one(alert.dict())
        
        return {"message": "Attendance submitted successfully", "record_id": record.record_id}
    except Exception as e:
        logger.error(f"Submit attendance error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/alerts")
async def get_alerts():
    """Get all alerts"""
    try:
        alerts = await db.alerts.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
        return {"alerts": alerts}
    except Exception as e:
        logger.error(f"Get alerts error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/alerts/send")
async def send_alert(request: SendAlertRequest):
    """Send alert via email"""
    try:
        alert = await db.alerts.find_one({"alert_id": request.alert_id})
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        # TODO: Integrate actual email sending when API key is provided
        # For now, just mark as sent
        await db.alerts.update_one(
            {"alert_id": request.alert_id},
            {"$set": {"status": "Sent", "sent_at": datetime.utcnow()}}
        )
        
        logger.info(f"Alert sent (simulated) to {alert['name']} ({alert['rollNo']})")
        
        return {
            "message": f"Alert sent to {alert['name']}",
            "status": "success"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Send alert error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/letters/generate")
async def generate_letter(request: LetterRequest):
    """Generate letter data"""
    try:
        student = await db.students.find_one({"rollNo": request.rollNo}, {"_id": 0})
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        current_date = datetime.now().strftime("%d.%m.%Y")
        
        letter_data = {
            "student": student,
            "documentType": request.documentType,
            "date": current_date,
            "issuer": {
                "name": "PROF. V. VALLI KUMARI",
                "title": "HEAD OF THE DEPARTMENT",
                "department": "DEPARTMENT OF COMPUTER SCIENCE AND SYSTEMS ENGINEERING"
            }
        }
        
        return letter_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generate letter error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analytics/day-wise")
async def get_day_wise_analytics(date: str):
    """Get students absent on a specific day"""
    try:
        records = await db.attendance_records.find({"date": date}, {"_id": 0}).to_list(100)
        absent_students = []
        
        for record in records:
            for entry in record["attendance"]:
                if entry["status"] == "Absent":
                    absent_students.append({
                        "rollNo": entry["rollNo"],
                        "name": entry["name"],
                        "subject": record["subject"],
                        "period": record["period"]
                    })
        
        return {"date": date, "absent_students": absent_students}
    except Exception as e:
        logger.error(f"Day-wise analytics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analytics/subject-wise")
async def get_subject_wise_analytics(subject: str):
    """Get students with low attendance in a subject"""
    try:
        subject_key = subject.lower()
        students = await db.students.find({}, {"_id": 0}).to_list(100)
        
        low_attendance = []
        for student in students:
            if subject_key in student["subjectAttendance"]:
                percent = student["subjectAttendance"][subject_key]
                if percent < 75.0:
                    low_attendance.append({
                        "rollNo": student["rollNo"],
                        "name": student["name"],
                        "attendancePercent": percent,
                        "status": "Shortage"
                    })
        
        return {"subject": subject, "students": low_attendance}
    except Exception as e:
        logger.error(f"Subject-wise analytics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analytics/semester-wise")
async def get_semester_wise_analytics():
    """Get all students with eligibility status"""
    try:
        students = await db.students.find({}, {"_id": 0}).to_list(100)
        
        eligible = [s for s in students if s["status"] == "Eligible"]
        shortage = [s for s in students if s["status"] == "Shortage"]
        
        return {
            "total": len(students),
            "eligible": len(eligible),
            "shortage": len(shortage),
            "students": students
        }
    except Exception as e:
        logger.error(f"Semester-wise analytics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
