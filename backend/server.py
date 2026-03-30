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
from datetime import datetime, date, timedelta
import asyncio
import string
import random
import io
import base64
import qrcode

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
    math: float = 100.0
    dbms: float = 100.0
    os: float = 100.0
    cn: float = 100.0  # Computer Networks
    se: float = 100.0  # Software Engineering

class Student(BaseModel):
    student_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rollNo: str
    name: str
    className: str = "Class A"  # Class A, B, C, D
    course: str = "B.Tech CSE"
    email: str
    attendancePercent: float = 100.0
    subjectAttendance: SubjectAttendance = SubjectAttendance()
    status: str = "Eligible"  # Eligible or Shortage

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    message: str
    user: Optional[Dict] = None

class AttendanceRecord(BaseModel):
    record_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str
    className: str
    subject: str
    period: str
    markedBy: str  # teacher username
    attendance: List[Dict]  # [{rollNo, name, status}]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AttendanceSubmission(BaseModel):
    date: str
    className: str
    subject: str
    period: str
    markedBy: str
    attendance: List[Dict]

class Alert(BaseModel):
    alert_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    rollNo: str
    name: str
    className: str
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
# NEW MODELS FOR PHASE 1
# ============================================

class LetterRequestCreate(BaseModel):
    rollNo: str
    docType: str

class LetterRequestUpdate(BaseModel):
    status: Optional[str] = None  # Approved, Rejected
    reason: Optional[str] = None
    collectedAt: Optional[str] = None

class LetterGenerateRequest(BaseModel):
    rollNo: str
    docType: str
    requestId: Optional[str] = None

class AddStudentRequest(BaseModel):
    rollNo: str
    name: str
    email: str
    phone: Optional[str] = ""
    course: str = "B.Tech+M.Tech - CSE"
    semester: int = 1

class BulkSyncItem(BaseModel):
    localId: str
    subject: str
    date: str
    records: List[Dict]
    createdAt: Optional[str] = None

class BulkSyncRequest(BaseModel):
    items: List[BulkSyncItem]

# ============================================
# SEED DATA
# ============================================

SEED_STUDENTS = [
    # Class A (8 students)
    {"rollNo": "R001", "name": "Aarav Kumar", "email": "aarav.kumar@student.au.edu", "className": "Class A"},
    {"rollNo": "R002", "name": "Vivaan Singh", "email": "vivaan.singh@student.au.edu", "className": "Class A"},
    {"rollNo": "R003", "name": "Aditya Patel", "email": "aditya.patel@student.au.edu", "className": "Class A"},
    {"rollNo": "R004", "name": "Vihaan Sharma", "email": "vihaan.sharma@student.au.edu", "className": "Class A"},
    {"rollNo": "R005", "name": "Arjun Reddy", "email": "arjun.reddy@student.au.edu", "className": "Class A"},
    {"rollNo": "R006", "name": "Sai Krishna", "email": "sai.krishna@student.au.edu", "className": "Class A"},
    {"rollNo": "R007", "name": "Reyansh Gupta", "email": "reyansh.gupta@student.au.edu", "className": "Class A"},
    {"rollNo": "R008", "name": "Ayaan Verma", "email": "ayaan.verma@student.au.edu", "className": "Class A"},
    # Class B (7 students)
    {"rollNo": "R009", "name": "Krishna Rao", "email": "krishna.rao@student.au.edu", "className": "Class B"},
    {"rollNo": "R010", "name": "Ishaan Nair", "email": "ishaan.nair@student.au.edu", "className": "Class B"},
    {"rollNo": "R011", "name": "Ananya Iyer", "email": "ananya.iyer@student.au.edu", "className": "Class B"},
    {"rollNo": "R012", "name": "Diya Menon", "email": "diya.menon@student.au.edu", "className": "Class B"},
    {"rollNo": "R013", "name": "Saanvi Rao", "email": "saanvi.rao@student.au.edu", "className": "Class B"},
    {"rollNo": "R014", "name": "Aadhya Nair", "email": "aadhya.nair@student.au.edu", "className": "Class B"},
    {"rollNo": "R015", "name": "Navya Reddy", "email": "navya.reddy@student.au.edu", "className": "Class B"},
    # Class C (8 students)
    {"rollNo": "R016", "name": "Priya Singh", "email": "priya.singh@student.au.edu", "className": "Class C"},
    {"rollNo": "R017", "name": "Kavya Kumar", "email": "kavya.kumar@student.au.edu", "className": "Class C"},
    {"rollNo": "R018", "name": "Riya Sharma", "email": "riya.sharma@student.au.edu", "className": "Class C"},
    {"rollNo": "R019", "name": "Aditi Patel", "email": "aditi.patel@student.au.edu", "className": "Class C"},
    {"rollNo": "R020", "name": "Shriya Gupta", "email": "shriya.gupta@student.au.edu", "className": "Class C"},
    {"rollNo": "R021", "name": "Rohan Das", "email": "rohan.das@student.au.edu", "className": "Class C"},
    {"rollNo": "R022", "name": "Karan Verma", "email": "karan.verma@student.au.edu", "className": "Class C"},
    {"rollNo": "R023", "name": "Pranav Joshi", "email": "pranav.joshi@student.au.edu", "className": "Class C"},
    # Class D (7 students)
    {"rollNo": "R024", "name": "Harsh Mehta", "email": "harsh.mehta@student.au.edu", "className": "Class D"},
    {"rollNo": "R025", "name": "Dev Patel", "email": "dev.patel@student.au.edu", "className": "Class D"},
    {"rollNo": "R026", "name": "Meera Iyer", "email": "meera.iyer@student.au.edu", "className": "Class D"},
    {"rollNo": "R027", "name": "Tara Reddy", "email": "tara.reddy@student.au.edu", "className": "Class D"},
    {"rollNo": "R028", "name": "Nidhi Sharma", "email": "nidhi.sharma@student.au.edu", "className": "Class D"},
    {"rollNo": "R029", "name": "Pooja Kumar", "email": "pooja.kumar@student.au.edu", "className": "Class D"},
    {"rollNo": "R030", "name": "Sneha Singh", "email": "sneha.singh@student.au.edu", "className": "Class D"}
]

# ============================================
# ROUTES
# ============================================

@api_router.post("/seed-data")
async def seed_data():
    """Initialize database with 30 students across 4 classes"""
    try:
        # Clear existing data for fresh seed
        await db.students.delete_many({})
        await db.alerts.delete_many({})
        await db.attendance_records.delete_many({})
        await db.letterRequests.delete_many({})
        await db.auditLog.delete_many({})
        
        # Create students with varying attendance
        students = []
        for i, seed_student in enumerate(SEED_STUDENTS):
            # Create varied but realistic attendance percentages
            base_attendance = 85.0 if i % 3 == 0 else (70.0 if i % 5 == 0 else 90.0)
            
            student_dict = {
                "student_id": str(uuid.uuid4()),
                "rollNo": seed_student["rollNo"],
                "name": seed_student["name"],
                "email": seed_student["email"],
                "className": seed_student["className"],
                "course": "B.Tech+M.Tech - CSE",
                "semester": 2,
                "phone": "",
                "attendancePercent": base_attendance,
                "subjectAttendance": {
                    "math": base_attendance + (i % 5),
                    "dbms": base_attendance - (i % 3),
                    "os": base_attendance + (i % 4),
                    "cn": base_attendance - (i % 2),
                    "se": base_attendance + (i % 3)
                },
                "status": "Eligible" if base_attendance >= 75.0 else "Shortage",
                "hasOutstandingDues": False,
                "username": seed_student["rollNo"][-4:] if len(seed_student["rollNo"]) >= 4 else seed_student["rollNo"],
                "password": "student123"
            }
            students.append(student_dict)
        
        result = await db.students.insert_many(students)
        
        # Create alerts for students with shortage
        alerts = []
        for student in students:
            if student["attendancePercent"] < 75.0:
                alert = Alert(
                    student_id=student["student_id"],
                    rollNo=student["rollNo"],
                    name=student["name"],
                    className=student["className"],
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
    """Login with auto-detected role from username"""
    try:
        # Hardcoded credentials - role detected from username
        valid_users = {
            "teacher": {"password": "teacher123", "role": "Teacher", "name": "Dr. Ramesh Kumar"},
            "admin": {"password": "admin123", "role": "Admin", "name": "Prof. Suresh Babu"},
            "clerk": {"password": "clerk123", "role": "Clerk", "name": "Clerk Office"}
        }

        user = valid_users.get(request.username.lower())

        if user and user["password"] == request.password:
            await write_audit(request.username, user["role"], "LOGIN", None, f"{user['role']} login")
            return LoginResponse(
                success=True,
                message="Login successful",
                user={
                    "username": request.username,
                    "role": user["role"],
                    "name": user["name"]
                }
            )

        # Check students collection for student login (username = last 4 digits of rollNo)
        student = await db.students.find_one({
            "username": request.username,
            "password": request.password
        }, {"_id": 0})

        if not student:
            # Also try matching last 4 chars of rollNo
            all_students = await db.students.find({}, {"_id": 0}).to_list(200)
            for s in all_students:
                uname = s.get("username") or (s["rollNo"][-4:] if len(s["rollNo"]) >= 4 else s["rollNo"])
                if uname == request.username and request.password == "student123":
                    student = s
                    break

        if student:
            await write_audit(request.username, "Student", "LOGIN", student["rollNo"], "Student login")
            return LoginResponse(
                success=True,
                message="Login successful",
                user={
                    "username": request.username,
                    "role": "Student",
                    "name": student["name"],
                    "rollNo": student["rollNo"]
                }
            )

        return LoginResponse(
            success=False,
            message="Invalid credentials"
        )
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/students")
async def get_students(className: Optional[str] = None):
    """Get all students, optionally filtered by class"""
    try:
        query = {}
        if className:
            query["className"] = className
            
        students = await db.students.find(query, {"_id": 0}).to_list(100)
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
                                className=student["className"],
                                attendancePercent=new_percent
                            )
                            await db.alerts.insert_one(alert.dict())
        
        await write_audit(submission.markedBy, "Teacher", "ATTENDANCE_MARKED", None,
                        f"Marked attendance for {submission.subject} on {submission.date}")
        return {"message": "Attendance submitted successfully", "record_id": record.record_id}
    except Exception as e:
        logger.error(f"Submit attendance error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/alerts")
async def get_alerts(className: Optional[str] = None):
    """Get all alerts, optionally filtered by class"""
    try:
        query = {}
        if className:
            query["className"] = className
            
        alerts = await db.alerts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
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
        
        await write_audit("admin", "Admin", "ALERT_SENT", alert["rollNo"],
                        f"Alert sent to {alert['name']}")
        
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
async def get_day_wise_analytics(date: str, className: Optional[str] = None):
    """Get students absent on a specific day"""
    try:
        query = {"date": date}
        if className:
            query["className"] = className
            
        records = await db.attendance_records.find(query, {"_id": 0}).to_list(100)
        absent_students = []
        
        for record in records:
            for entry in record["attendance"]:
                if entry["status"] == "Absent":
                    absent_students.append({
                        "rollNo": entry["rollNo"],
                        "name": entry["name"],
                        "className": record.get("className", "N/A"),
                        "subject": record["subject"],
                        "period": record["period"]
                    })
        
        return {"date": date, "absent_students": absent_students}
    except Exception as e:
        logger.error(f"Day-wise analytics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analytics/subject-wise")
async def get_subject_wise_analytics(subject: str, className: Optional[str] = None):
    """Get students with low attendance in a subject"""
    try:
        subject_key = subject.lower()
        
        query = {}
        if className:
            query["className"] = className
            
        students = await db.students.find(query, {"_id": 0}).to_list(100)
        
        low_attendance = []
        for student in students:
            if subject_key in student["subjectAttendance"]:
                percent = student["subjectAttendance"][subject_key]
                if percent < 75.0:
                    low_attendance.append({
                        "rollNo": student["rollNo"],
                        "name": student["name"],
                        "className": student["className"],
                        "attendancePercent": percent,
                        "status": "Shortage"
                    })
        
        return {"subject": subject, "students": low_attendance}
    except Exception as e:
        logger.error(f"Subject-wise analytics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analytics/semester-wise")
async def get_semester_wise_analytics(className: Optional[str] = None):
    """Get all students with eligibility status"""
    try:
        query = {}
        if className:
            query["className"] = className
            
        students = await db.students.find(query, {"_id": 0}).to_list(100)
        
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

@api_router.get("/classes")
async def get_classes():
    """Get list of all classes"""
    try:
        return {
            "classes": ["Class A", "Class B", "Class C", "Class D"]
        }
    except Exception as e:
        logger.error(f"Get classes error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# AUDIT LOG HELPER
# ============================================

async def write_audit(actor_username: str, actor_role: str, action: str, student_roll: str = None, detail: str = ""):
    """Write an entry to the audit log"""
    try:
        await db.auditLog.insert_one({
            "timestamp": datetime.utcnow().isoformat(),
            "actorUsername": actor_username,
            "actorRole": actor_role,
            "action": action,
            "studentRollNo": student_roll,
            "detail": detail
        })
    except Exception as e:
        logger.error(f"Audit log write error: {str(e)}")

# ============================================
# QR CODE HELPER
# ============================================

def generate_qr_base64(data: str) -> str:
    """Generate QR code as base64 PNG string"""
    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")

def generate_verify_token(length: int = 8) -> str:
    """Generate random alphanumeric verification token"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

# ============================================
# CERTIFICATE HTML TEMPLATE
# ============================================

def build_certificate_html(doc_type: str, student: dict, verify_token: str, qr_base64: str) -> str:
    """Build full certificate HTML with QR code"""
    current_date = datetime.now().strftime("%d/%m/%Y")
    name = student["name"]
    roll_no = student["rollNo"]
    course = student.get("course", "B.Tech+M.Tech - CSE")
    semester = student.get("semester", "II")
    if isinstance(semester, int):
        roman = {1:"I",2:"II",3:"III",4:"IV",5:"V",6:"VI",7:"VII",8:"VIII"}
        semester = roman.get(semester, str(semester))

    body_texts = {
        "Bonafide Certificate": f"This is to certify that <strong>{name}</strong>, bearing Registration No. <strong>{roll_no}</strong>, is a bonafide student of <strong>{course}</strong>, {semester} Semester in the Department of Computer Science and Systems Engineering, A.U. College of Engineering (A), Andhra University, Visakhapatnam, during the academic year 2025-26. This certificate is issued for the purpose as requested by the student.",
        "Study Certificate": f"This is to certify that <strong>{name}</strong>, bearing Registration No. <strong>{roll_no}</strong>, has been studying <strong>{course}</strong> in the Department of Computer Science and Systems Engineering, A.U. College of Engineering (A), Andhra University, Visakhapatnam during the academic year 2025-26. The student bears good conduct and character. This certificate is issued at the request of the student.",
        "Loan Estimation Letter": f"This is to certify that <strong>{name}</strong>, bearing Registration No. <strong>{roll_no}</strong>, is a bonafide student of <strong>{course}</strong>, {semester} Semester during the academic year 2025-26.<br><br>Estimated fee structure: Tuition Fee: Rs.85,000/- | Hostel Fee: Rs.45,000/- | Miscellaneous: Rs.10,000/- | Total: Rs.1,40,000/-<br><br>This letter is issued for educational loan application purposes.",
        "Internship Permission Letter": f"This is to certify that <strong>{name}</strong>, bearing Registration No. <strong>{roll_no}</strong>, is a bonafide student of <strong>{course}</strong>, {semester} Semester in the Department of Computer Science and Systems Engineering, A.U. College of Engineering (A), Andhra University, Visakhapatnam during the academic year 2025-26. This certificate is issued at the request of the student for the purpose of applying for Summer Internship Programme. We have no objection to their participation in the programme provided it does not interfere with their academic schedule."
    }

    body_text = body_texts.get(doc_type, body_texts["Bonafide Certificate"])
    title = doc_type.upper()

    html = f"""<!DOCTYPE html>
<html>
<head>
<style>
  body{{font-family:Arial,sans-serif;margin:48px;color:#000;position:relative}}
  .header{{text-align:center;border-bottom:2px solid #B31217;padding-bottom:14px;margin-bottom:24px}}
  .dept{{font-size:15px;font-weight:bold;color:#B31217}}
  .inst{{font-size:13px;margin-top:2px}}
  .title{{text-align:center;font-size:17px;font-weight:bold;color:#B31217;text-decoration:underline;margin:20px 0 24px}}
  .body-text{{font-size:13px;line-height:1.9;text-align:justify}}
  .sig{{margin-top:64px}}
  .sig p{{margin:2px 0;font-size:13px}}
  .qr{{position:absolute;bottom:48px;right:48px;text-align:center}}
  .qr-label{{font-size:9px;color:#888;margin-top:4px}}
</style>
</head>
<body>
  <div class="header">
    <div class="dept">DEPARTMENT OF COMPUTER SCIENCE AND SYSTEMS ENGINEERING</div>
    <div class="inst">A.U. College of Engineering (A), Andhra University</div>
    <div class="inst">Visakhapatnam - 530003</div>
    <div style="font-size:12px;margin-top:8px">Date: {current_date}</div>
  </div>
  <div class="title">{title}</div>
  <div class="body-text">{body_text}</div>
  <div class="sig">
    <p><br/><br/></p>
    <p><strong>Prof. V. Valli Kumari</strong></p>
    <p>Head of the Department</p>
    <p>Dept. of CS&amp;SE, A.U. College of Engineering (A)</p>
  </div>
  <div class="qr">
    <img src="data:image/png;base64,{qr_base64}" width="80" height="80"/>
    <div class="qr-label">Scan to verify</div>
    <div class="qr-label">{verify_token}</div>
  </div>
</body>
</html>"""
    return html

# ============================================
# NEW ENDPOINTS — AUDIT LOG
# ============================================

@api_router.get("/audit-log")
async def get_audit_log():
    """Get audit log entries, newest first"""
    try:
        logs = await db.auditLog.find({}, {"_id": 0}).sort("timestamp", -1).to_list(200)
        return {"logs": logs}
    except Exception as e:
        logger.error(f"Get audit log error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# NEW ENDPOINT — ADD STUDENT
# ============================================

@api_router.post("/students")
async def add_student(request: AddStudentRequest):
    """Add a new student"""
    try:
        # Check duplicate rollNo
        existing = await db.students.find_one({"rollNo": request.rollNo})
        if existing:
            raise HTTPException(status_code=400, detail="Roll number already exists")

        # Validate email
        if "@" not in request.email:
            raise HTTPException(status_code=400, detail="Invalid email address")

        student = {
            "student_id": str(uuid.uuid4()),
            "rollNo": request.rollNo,
            "name": request.name,
            "email": request.email,
            "phone": request.phone or "",
            "className": "Class A",
            "course": request.course,
            "semester": request.semester,
            "attendancePercent": 0.0,
            "subjectAttendance": {"math": 0.0, "dbms": 0.0, "os": 0.0, "cn": 0.0, "se": 0.0},
            "status": "Eligible",
            "hasOutstandingDues": False,
            "username": request.rollNo[-4:] if len(request.rollNo) >= 4 else request.rollNo,
            "password": "student123"
        }

        await db.students.insert_one(student)
        await write_audit("admin", "Admin", "ADD_STUDENT", request.rollNo, f"Added student {request.name}")

        # Return without _id
        student.pop("_id", None)
        return student
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Add student error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# NEW ENDPOINTS — LETTER REQUEST SYSTEM
# ============================================

@api_router.post("/letters/request")
async def create_letter_request(request: LetterRequestCreate):
    """Create a new letter/certificate request"""
    try:
        # Check student exists
        student = await db.students.find_one({"rollNo": request.rollNo}, {"_id": 0})
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        # Check eligibility
        if student.get("attendancePercent", 0) < 75:
            raise HTTPException(status_code=400, detail=f"Not eligible — Attendance {student['attendancePercent']}%")
        if student.get("hasOutstandingDues", False):
            raise HTTPException(status_code=400, detail="Outstanding dues on record")

        letter_req = {
            "requestId": str(uuid.uuid4()),
            "rollNo": request.rollNo,
            "studentName": student["name"],
            "docType": request.docType,
            "status": "Queue",
            "requestedAt": datetime.utcnow().isoformat(),
            "reviewedAt": None,
            "reviewedBy": None,
            "rejectionReason": None,
            "verifyToken": None,
            "printedAt": None,
            "collectedAt": None
        }

        await db.letterRequests.insert_one(letter_req)
        await write_audit("clerk", "Clerk", "LETTER_REQUESTED", request.rollNo, f"Requested {request.docType}")

        letter_req.pop("_id", None)
        return letter_req
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create letter request error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/letters/requests")
async def get_letter_requests():
    """Get all letter requests, newest first"""
    try:
        requests = await db.letterRequests.find({}, {"_id": 0}).sort("requestedAt", -1).to_list(500)
        return {"requests": requests}
    except Exception as e:
        logger.error(f"Get letter requests error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/letters/requests/{request_id}")
async def update_letter_request(request_id: str, body: LetterRequestUpdate):
    """Update a letter request (approve/reject/collected)"""
    try:
        existing = await db.letterRequests.find_one({"requestId": request_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Request not found")

        update_data = {"reviewedAt": datetime.utcnow().isoformat()}

        if body.status == "Approved":
            token = generate_verify_token()
            update_data["status"] = "Approved"
            update_data["verifyToken"] = token
            update_data["reviewedBy"] = "admin"
            # Simulate SMS
            logger.info(f"SMS sent: Your {existing['docType']} certificate is approved. Collect from dept office.")
            await write_audit("admin", "Admin", "LETTER_APPROVED", existing["rollNo"],
                            f"Approved {existing['docType']}")

        elif body.status == "Rejected":
            update_data["status"] = "Rejected"
            update_data["rejectionReason"] = body.reason or "No reason provided"
            update_data["reviewedBy"] = "admin"
            logger.info(f"SMS sent: Your {existing['docType']} request was rejected: {body.reason}")
            await write_audit("admin", "Admin", "LETTER_REJECTED", existing["rollNo"],
                            f"Rejected {existing['docType']}: {body.reason}")

        if body.collectedAt:
            update_data["collectedAt"] = body.collectedAt
            await write_audit("clerk", "Clerk", "CERTIFICATE_COLLECTED", existing["rollNo"],
                            f"Collected {existing['docType']}")

        await db.letterRequests.update_one({"requestId": request_id}, {"$set": update_data})

        updated = await db.letterRequests.find_one({"requestId": request_id}, {"_id": 0})
        return updated
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update letter request error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# UPDATED LETTER GENERATE WITH QR
# ============================================

@api_router.post("/letters/generate-full")
async def generate_letter_full(request: LetterGenerateRequest):
    """Generate full certificate HTML with QR code"""
    try:
        student = await db.students.find_one({"rollNo": request.rollNo}, {"_id": 0})
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        # Get or create verify token
        verify_token = generate_verify_token()
        if request.requestId:
            lr = await db.letterRequests.find_one({"requestId": request.requestId})
            if lr and lr.get("verifyToken"):
                verify_token = lr["verifyToken"]
            # Update printedAt
            await db.letterRequests.update_one(
                {"requestId": request.requestId},
                {"$set": {"printedAt": datetime.utcnow().isoformat()}}
            )

        # Generate QR code
        verify_url = f"/api/letters/verify/{verify_token}"
        qr_base64 = generate_qr_base64(verify_url)

        # Build HTML
        html = build_certificate_html(request.docType, student, verify_token, qr_base64)

        filename = f"{request.docType.replace(' ', '_')}_{request.rollNo}_{datetime.now().year}.pdf"

        await write_audit("clerk", "Clerk", "LETTER_GENERATED", request.rollNo,
                        f"Generated {request.docType}")

        return {"html": html, "filename": filename, "verifyToken": verify_token}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generate letter full error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# QR VERIFICATION — NO AUTH
# ============================================

@api_router.get("/letters/verify/{token}")
async def verify_certificate(token: str):
    """Verify a certificate by token — no authentication required"""
    try:
        lr = await db.letterRequests.find_one({"verifyToken": token}, {"_id": 0})
        if lr:
            return {
                "valid": True,
                "studentName": lr.get("studentName", ""),
                "rollNo": lr.get("rollNo", ""),
                "docType": lr.get("docType", ""),
                "approvedBy": lr.get("reviewedBy", ""),
                "approvedAt": lr.get("reviewedAt", "")
            }
        else:
            return {"valid": False}
    except Exception as e:
        logger.error(f"Verify certificate error: {str(e)}")
        return {"valid": False}

# ============================================
# OFFLINE BULK SYNC
# ============================================

async def recalculate_student_attendance(roll_no: str, subject_key: str):
    """Recalculate a student's attendance from actual records"""
    try:
        # Count total sessions for this subject
        total_sessions = await db.attendance_records.count_documents({"subject": subject_key})
        if total_sessions == 0:
            return

        # Count sessions where student was present
        present_sessions = 0
        records = await db.attendance_records.find({"subject": subject_key}).to_list(1000)
        for record in records:
            for entry in record.get("attendance", []):
                if entry.get("rollNo") == roll_no and entry.get("status") == "Present":
                    present_sessions += 1

        subject_percent = round((present_sessions / total_sessions) * 100, 1) if total_sessions > 0 else 0

        # Update subject attendance
        subject_map = {"math": "math", "dbms": "dbms", "os": "os", "cn": "cn", "se": "se"}
        sk = subject_key.lower()
        if sk in subject_map:
            await db.students.update_one(
                {"rollNo": roll_no},
                {"$set": {f"subjectAttendance.{sk}": subject_percent}}
            )

        # Recalculate overall from all subjects
        student = await db.students.find_one({"rollNo": roll_no})
        if student:
            sa = student.get("subjectAttendance", {})
            subjects = [sa.get("math", 0), sa.get("dbms", 0), sa.get("os", 0), sa.get("cn", 0), sa.get("se", 0)]
            overall = round(sum(subjects) / len(subjects), 1) if subjects else 0
            status = "Eligible" if overall >= 75 else "Shortage"
            await db.students.update_one(
                {"rollNo": roll_no},
                {"$set": {"attendancePercent": overall, "status": status}}
            )
    except Exception as e:
        logger.error(f"Recalculate attendance error for {roll_no}: {str(e)}")

@api_router.post("/attendance/bulk-sync")
async def bulk_sync_attendance(items: List[BulkSyncItem]):
    """Sync offline attendance records"""
    try:
        synced = []
        skipped = []

        for item in items:
            # Check if attendance record with same subject+date already exists
            existing = await db.attendance_records.find_one({
                "subject": item.subject,
                "date": item.date
            })

            if existing:
                skipped.append({"localId": item.localId})
                continue

            # Insert new attendance record
            record = {
                "record_id": str(uuid.uuid4()),
                "date": item.date,
                "className": "Class A",
                "subject": item.subject,
                "period": "1",
                "markedBy": "teacher",
                "attendance": item.records,
                "timestamp": datetime.utcnow().isoformat()
            }
            await db.attendance_records.insert_one(record)

            # Recalculate attendance for each student
            all_roll_nos = set()
            for entry in item.records:
                rn = entry.get("rollNo")
                if rn:
                    all_roll_nos.add(rn)

            for rn in all_roll_nos:
                await recalculate_student_attendance(rn, item.subject)

            # Create alerts for students below 75%
            for entry in item.records:
                if entry.get("status") == "Absent":
                    student = await db.students.find_one({"rollNo": entry["rollNo"]})
                    if student and student.get("attendancePercent", 100) < 75:
                        existing_alert = await db.alerts.find_one({
                            "rollNo": entry["rollNo"], "status": "Pending"
                        })
                        if not existing_alert:
                            alert = Alert(
                                student_id=student.get("student_id", ""),
                                rollNo=student["rollNo"],
                                name=student["name"],
                                className=student.get("className", ""),
                                attendancePercent=student["attendancePercent"]
                            )
                            await db.alerts.insert_one(alert.dict())

            synced.append({"localId": item.localId})

        await write_audit("teacher", "Teacher", "ATTENDANCE_SYNCED", None,
                        f"Synced {len(synced)} session(s), skipped {len(skipped)}")

        return {"synced": synced, "skipped": skipped, "conflicts": []}
    except Exception as e:
        logger.error(f"Bulk sync error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# PREDICTIVE AT-RISK ANALYTICS
# ============================================

@api_router.get("/analytics/at-risk")
async def get_at_risk_students():
    """Get students at risk of falling below 75% based on recent attendance trends"""
    try:
        students = await db.students.find({}, {"_id": 0}).to_list(200)
        at_risk_list = []
        fourteen_days_ago = (datetime.utcnow() - timedelta(days=14)).strftime("%Y-%m-%d")
        subjects = ["math", "dbms", "os", "cn", "se"]

        for student in students:
            at_risk_subjects = []
            min_projected = 100

            for subject in subjects:
                # Get recent sessions (last 14 days)
                recent_records = await db.attendance_records.find({
                    "subject": subject,
                    "date": {"$gte": fourteen_days_ago}
                }).to_list(100)

                if len(recent_records) == 0:
                    continue

                recent_present = 0
                recent_total = len(recent_records)
                for rec in recent_records:
                    for entry in rec.get("attendance", []):
                        if entry.get("rollNo") == student["rollNo"] and entry.get("status") == "Present":
                            recent_present += 1

                recent_rate = recent_present / recent_total if recent_total > 0 else 0

                # Get all sessions for this subject
                all_records = await db.attendance_records.find({"subject": subject}).to_list(500)
                total_attended = 0
                for rec in all_records:
                    for entry in rec.get("attendance", []):
                        if entry.get("rollNo") == student["rollNo"] and entry.get("status") == "Present":
                            total_attended += 1

                projected_attended = total_attended + recent_rate * 40
                projected_total = len(all_records) + 40
                projected_pct = (projected_attended / projected_total) * 100 if projected_total > 0 else 0

                if projected_pct < min_projected:
                    min_projected = projected_pct

                current_subj_pct = student.get("subjectAttendance", {}).get(subject, 0)
                if projected_pct < 75 and current_subj_pct >= 75:
                    at_risk_subjects.append(subject)

            if at_risk_subjects:
                at_risk_list.append({
                    "rollNo": student["rollNo"],
                    "name": student["name"],
                    "currentPercent": student.get("attendancePercent", 0),
                    "projectedPercent": round(min_projected, 1),
                    "subjectsAtRisk": at_risk_subjects
                })

        return {"atRiskStudents": at_risk_list}
    except Exception as e:
        logger.error(f"At-risk analytics error: {str(e)}")
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
