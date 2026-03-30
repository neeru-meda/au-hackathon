# AcadEase 360° - Feature Documentation
### Andhra University | Department of Computer Science & Systems Engineering
---

## 1. Overview

**AcadEase 360°** is a mobile-first smart attendance and academic utility application built for Andhra University's CSSE Department. It provides role-based access for Teachers and Admins to manage student attendance, view analytics, send alerts, and generate official university letters.

**Tech Stack:**
- **Frontend:** React Native (Expo) with Expo Router (file-based navigation)
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **State Management:** React Context API

**Color Theme:**
- Primary: `#B31217` (Deep Red - AU Brand Color)
- Secondary: `#F4C430` (Gold)
- Accent: `#2F5D2F` (Green)

---

## 2. Authentication & Login

| Feature | Details |
|---------|---------|
| Login Method | Username & Password |
| Role Detection | Auto-detected from username (no manual role selection needed) |
| Seeding | Database auto-seeds 30 students on first login |
| UI Design | Red background with centered white card, AU logo, demo credentials displayed |

**Demo Credentials:**
- **Teacher:** `teacher` / `teacher123`
- **Admin:** `admin` / `admin123`

**Login Screen Highlights:**
- Official Andhra University logo displayed
- App title "AcadEase 360°" with subtitle "AU CSSE Smart Utility"
- Clean card-based layout on deep red background
- Footer: "Andhra University - CSSE Department"

---

## 3. Role-Based Navigation

The app dynamically shows/hides tabs based on the logged-in user's role:

### Teacher Tabs:
| Tab | Icon | Screen |
|-----|------|--------|
| Dashboard | Home | Welcome screen with stats overview |
| Attendance | Calendar | Take/manage attendance |
| Students | People | View student list and details |

### Admin Tabs:
| Tab | Icon | Screen |
|-----|------|--------|
| Dashboard | Home | Welcome screen with stats overview |
| Students | People | View student list and details |
| Analytics | Stats Chart | Attendance analytics & trends |
| Alerts | Notifications | Send SMS/Email alerts to absentees |
| Letters | Document | Generate official university certificates |

---

## 4. Dashboard

- Personalized greeting with logged-in user's name and role
- Quick stats cards showing:
  - Total students count
  - Average attendance percentage
  - Students with attendance shortage (<75%)
- Role-specific quick action buttons
- Deep red title styling consistent with AU branding

---

## 5. Smart Attendance System (Teacher)

| Feature | Details |
|---------|---------|
| Subject Selection | Custom dropdown with subjects: Math, DBMS, OS, CN, SE |
| Date Picker | Custom native-feeling date picker (not default system picker) |
| Default State | All students marked **Absent** by default |
| Marking | Tap to toggle individual student Present/Absent |
| Instant Update | UI updates immediately after submission |
| Backend Sync | Attendance records saved to MongoDB with date, subject, and per-student status |

**How it works:**
1. Teacher selects a subject from the custom dropdown
2. Picks a date using the custom date picker
3. Student list loads with all students marked Absent (default)
4. Teacher taps to mark students as Present
5. Submits attendance - data saved to backend and attendance percentages recalculated

---

## 6. Students List

- Searchable list of all 30 seeded students
- Each student card shows:
  - Name and Roll Number
  - Course (e.g., B.Tech+M.Tech - CSE)
  - Overall attendance percentage
  - Status badge: **Eligible** (green, >= 75%) or **Shortage** (red, < 75%)
- Search functionality to filter students by name or roll number
- Consistent red title styling

---

## 7. Business Rule Engine

| Rule | Threshold | Action |
|------|-----------|--------|
| Attendance Shortage | < 75% overall | RED "Shortage" badge on student card |
| Alert Trigger | < 75% attendance | Student appears in Alerts list for admin action |
| Eligible Status | >= 75% overall | GREEN "Eligible" badge |

---

## 8. Analytics Dashboard (Admin)

- **Semester-wise Analytics:** Visual breakdown of attendance across semesters
- **Subject-wise Trends:** Attendance percentages per subject (Math, DBMS, OS, CN, SE)
- **Absentee Tracking:** Count and list of students below 75% threshold
- Styled with AU brand colors (red titles, consistent card design)
- Same top bar styling as Dashboard (not white background)

**API Endpoints:**
- `GET /api/analytics/day-wise` - Daily attendance trends
- `GET /api/analytics/subject-wise` - Subject-wise breakdown
- `GET /api/analytics/semester-wise` - Semester overview

---

## 9. Alert System (Admin)

| Feature | Details |
|---------|---------|
| Alert List | Shows all students with attendance < 75% |
| Alert Types | SMS and Email notifications |
| Send Action | Admin can send alerts to individual students |
| Status Tracking | Alerts tracked with sent/pending status |
| Simulation | Currently simulated (Resend API key pending for live email) |

**Note:** The alert sending is currently **simulated** on the backend. To enable real SMS/Email delivery, a Resend API key needs to be configured.

**API Endpoints:**
- `GET /api/alerts` - Fetch all alerts
- `POST /api/alerts/send` - Send alert to a student

---

## 10. Letter Generator (Admin)

The Letter Generator creates official Andhra University certificates matching the exact institutional format.

### Supported Document Types:
| Document | Description |
|----------|-------------|
| **Bonafide Certificate** | Certifies student enrollment at AU |
| **Study Certificate** | Confirms student's study and character |
| **Loan Estimation Letter** | For educational loan purposes with fee details |
| **Internship Permission Letter** | NOC for summer internship programmes |

### Letter Layout:
- **Header:** Official AU logo (Andhra University emblem)
- **Department:** "DEPARTMENT OF COMPUTER SCIENCE AND SYSTEMS ENGINEERING"
- **Institution:** "A.U. College of Engineering (A), Andhra University"
- **Location:** "Visakhapatnam - 530003"
- **Date:** Auto-generated current date
- **Title:** Document type in bold red
- **Body:** Institution-specific paragraph text with student details (name, roll no, course) dynamically inserted
- **Signature:** Prof. V. Valli Kumari, Head of the Department

### Example - Internship Permission Letter Body:
> This is to certify that **[Student Name]**, bearing regd. No. **[Roll No]** is a bonafide student of **[Course]**, II-Semester in the Dept. of Computer Science & Systems Engineering, A.U. College of Engineering (A), Andhra University, Visakhapatnam during the academic year **2025-26**.
>
> This certificate is issued at the request of the student for the purpose of applying for Summer internship programme. We have no objection to their participation in the program.

### Features:
- **Live Preview:** Mobile-friendly preview of the certificate before download
- **PDF Generation:** Uses `expo-print` to generate actual PDF files
- **Share/Print:** PDF can be shared or printed directly from the app
- **Dynamic Data:** Student name, roll number, and course pulled from database

**API Endpoint:**
- `POST /api/letters/generate` - Generate letter for a student (requires roll number and document type)

---

## 11. Backend API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/seed-data` | Seed database with 30 students |
| POST | `/api/login` | User authentication (auto role detection) |
| GET | `/api/students` | Get all students |
| GET | `/api/students/{roll_no}` | Get single student by roll number |
| POST | `/api/attendance` | Submit attendance record |
| GET | `/api/alerts` | Get all alerts |
| POST | `/api/alerts/send` | Send alert to a student |
| POST | `/api/letters/generate` | Generate official letter |
| GET | `/api/analytics/day-wise` | Day-wise attendance analytics |
| GET | `/api/analytics/subject-wise` | Subject-wise attendance analytics |
| GET | `/api/analytics/semester-wise` | Semester-wise attendance overview |
| GET | `/api/classes` | Get list of classes |

---

## 12. Database Schema

### Users Collection
```json
{
  "email": "string",
  "password": "string",
  "role": "Teacher | Admin",
  "name": "string"
}
```

### Students Collection
```json
{
  "rollNo": "string (e.g., R001)",
  "name": "string",
  "email": "string",
  "className": "string",
  "course": "string (e.g., B.Tech+M.Tech - CSE)",
  "semester": "number",
  "attendancePercent": "number",
  "subjectAttendance": {
    "math": "number",
    "dbms": "number",
    "os": "number",
    "cn": "number",
    "se": "number"
  },
  "status": "Eligible | Shortage"
}
```

### Alerts Collection
```json
{
  "studentId": "string",
  "type": "SMS | Email",
  "status": "sent | pending",
  "date": "string"
}
```

---

## 13. UI/UX Design Principles

- **Mobile-first:** All screens designed for touch interaction with minimum 44px touch targets
- **Card-based layout:** Clean, modern card design across all screens
- **AU Branding:** Deep red (#B31217) titles and accents throughout
- **Custom Components:** Native-feeling custom dropdowns and date pickers (no default system pickers)
- **Safe Areas:** Proper SafeAreaView usage to avoid notch/status bar overlap
- **Keyboard Handling:** KeyboardAvoidingView on all input screens
- **Platform Handling:** Platform-specific adjustments for iOS and Android

---

## 14. Project Structure

```
/app
  /backend
    server.py              # FastAPI backend with all routes and models
    requirements.txt       # Python dependencies
    .env                   # MongoDB connection string
  /frontend
    /app
      _layout.tsx           # Root layout with UserProvider context
      index.tsx             # Entry point (redirects to login)
      /(tabs)
        _layout.tsx         # Role-based tab navigation
        dashboard.tsx       # Dashboard tab
        attendance.tsx      # Attendance tab
        students.tsx        # Students tab
        analytics.tsx       # Analytics tab
        alerts.tsx          # Alerts tab
        letters.tsx         # Letters tab
      /screens
        LoginScreen.tsx     # Login page
        DashboardScreen.tsx # Dashboard with stats
        AttendanceScreen.tsx # Smart attendance system
        StudentsScreen.tsx  # Student list with search
        AnalyticsScreen.tsx # Admin analytics
        AlertsScreen.tsx    # Alert management
        LettersScreen.tsx   # Letter generator
      /utils
        api.ts              # API client functions
        UserContext.tsx      # Auth state management
        theme.ts            # Color, spacing, font constants
```

---

## 15. Current Limitations & Future Scope

| Item | Status | Notes |
|------|--------|-------|
| Real Email/SMS Alerts | Pending | Requires Resend API key integration |
| PDF Download to Device | Partial | Uses expo-print + expo-sharing (works on device) |
| Offline Support | Not implemented | Could add AsyncStorage caching |
| Push Notifications | Not implemented | Could use expo-notifications |
| Student Photo Upload | Not implemented | Future enhancement |
| Multi-department Support | Not implemented | Currently CSSE only |

---

*Document generated for AcadEase 360° - Andhra University CSSE Department*
*Last updated: March 2026*
