#!/usr/bin/env python3
"""
AcadEase 360° Backend API Testing Suite
Tests all backend endpoints for functionality and data integrity
"""

import requests
import json
import sys
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from environment
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://au-mobile-suite.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

print(f"Testing backend at: {API_BASE}")

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.failed_tests = []
        
    def log_test(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        
        if not success:
            self.failed_tests.append(result)
            if details:
                print(f"   Details: {details}")
    
    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n=== TESTING AUTHENTICATION ===")
        
        # Test valid teacher login
        try:
            response = self.session.post(f"{API_BASE}/login", json={
                "username": "teacher",
                "password": "teacher123",
                "role": "Teacher"
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('user', {}).get('role') == 'Teacher':
                    self.log_test("Teacher Login", True, "Valid teacher login successful")
                else:
                    self.log_test("Teacher Login", False, "Login response invalid", data)
            else:
                self.log_test("Teacher Login", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Teacher Login", False, "Request failed", str(e))
        
        # Test valid admin login
        try:
            response = self.session.post(f"{API_BASE}/login", json={
                "username": "admin",
                "password": "admin123",
                "role": "Admin"
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('user', {}).get('role') == 'Admin':
                    self.log_test("Admin Login", True, "Valid admin login successful")
                else:
                    self.log_test("Admin Login", False, "Login response invalid", data)
            else:
                self.log_test("Admin Login", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Admin Login", False, "Request failed", str(e))
        
        # Test invalid credentials
        try:
            response = self.session.post(f"{API_BASE}/login", json={
                "username": "invalid",
                "password": "wrong",
                "role": "Teacher"
            })
            
            if response.status_code == 200:
                data = response.json()
                if not data.get('success'):
                    self.log_test("Invalid Login", True, "Invalid credentials properly rejected")
                else:
                    self.log_test("Invalid Login", False, "Invalid credentials accepted", data)
            else:
                self.log_test("Invalid Login", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Invalid Login", False, "Request failed", str(e))
    
    def test_seed_data(self):
        """Test seed data endpoint"""
        print("\n=== TESTING SEED DATA ===")
        
        try:
            response = self.session.post(f"{API_BASE}/seed-data")
            
            if response.status_code == 200:
                data = response.json()
                if "students_count" in data or "count" in data:
                    student_count = data.get("students_count", data.get("count", 0))
                    if student_count >= 30:
                        self.log_test("Seed Data", True, f"Database seeded with {student_count} students")
                    else:
                        self.log_test("Seed Data", False, f"Only {student_count} students created, expected 30")
                else:
                    self.log_test("Seed Data", True, "Seed data endpoint responded", data)
            else:
                self.log_test("Seed Data", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Seed Data", False, "Request failed", str(e))
    
    def test_students_endpoints(self):
        """Test student-related endpoints"""
        print("\n=== TESTING STUDENTS ENDPOINTS ===")
        
        # Test get all students
        try:
            response = self.session.get(f"{API_BASE}/students")
            
            if response.status_code == 200:
                data = response.json()
                students = data.get('students', [])
                if len(students) >= 30:
                    self.log_test("Get All Students", True, f"Retrieved {len(students)} students")
                    
                    # Verify student data structure
                    if students:
                        student = students[0]
                        required_fields = ['rollNo', 'name', 'email', 'course', 'attendancePercent', 'subjectAttendance', 'status']
                        missing_fields = [field for field in required_fields if field not in student]
                        
                        if not missing_fields:
                            self.log_test("Student Data Structure", True, "All required fields present")
                        else:
                            self.log_test("Student Data Structure", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_test("Get All Students", False, f"Only {len(students)} students found, expected 30")
            else:
                self.log_test("Get All Students", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Get All Students", False, "Request failed", str(e))
        
        # Test get specific student
        try:
            response = self.session.get(f"{API_BASE}/students/R001")
            
            if response.status_code == 200:
                student = response.json()
                if student.get('rollNo') == 'R001':
                    self.log_test("Get Specific Student", True, f"Retrieved student {student.get('name')}")
                else:
                    self.log_test("Get Specific Student", False, "Wrong student returned", student)
            else:
                self.log_test("Get Specific Student", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Get Specific Student", False, "Request failed", str(e))
        
        # Test get non-existent student
        try:
            response = self.session.get(f"{API_BASE}/students/R999")
            
            if response.status_code == 404:
                self.log_test("Non-existent Student", True, "404 returned for non-existent student")
            else:
                self.log_test("Non-existent Student", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_test("Non-existent Student", False, "Request failed", str(e))
    
    def test_attendance_submission(self):
        """Test attendance submission"""
        print("\n=== TESTING ATTENDANCE SUBMISSION ===")
        
        attendance_data = {
            "date": "2025-07-15",
            "subject": "Math",
            "period": "1",
            "markedBy": "teacher",
            "attendance": [
                {"rollNo": "R001", "name": "Aarav Kumar", "status": "Present"},
                {"rollNo": "R002", "name": "Vivaan Singh", "status": "Absent"},
                {"rollNo": "R003", "name": "Aditya Patel", "status": "Absent"}
            ]
        }
        
        try:
            response = self.session.post(f"{API_BASE}/attendance", json=attendance_data)
            
            if response.status_code == 200:
                data = response.json()
                if "record_id" in data:
                    self.log_test("Attendance Submission", True, "Attendance record created successfully")
                    
                    # Verify student attendance was updated
                    student_response = self.session.get(f"{API_BASE}/students/R002")
                    if student_response.status_code == 200:
                        student = student_response.json()
                        if student.get('attendancePercent', 100) < 100:
                            self.log_test("Attendance Update", True, f"Student attendance updated to {student.get('attendancePercent')}%")
                        else:
                            self.log_test("Attendance Update", False, "Student attendance not updated")
                    
                else:
                    self.log_test("Attendance Submission", False, "No record_id in response", data)
            else:
                self.log_test("Attendance Submission", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Attendance Submission", False, "Request failed", str(e))
    
    def test_alerts_endpoints(self):
        """Test alerts endpoints"""
        print("\n=== TESTING ALERTS ENDPOINTS ===")
        
        # Test get alerts
        try:
            response = self.session.get(f"{API_BASE}/alerts")
            
            if response.status_code == 200:
                data = response.json()
                alerts = data.get('alerts', [])
                self.log_test("Get Alerts", True, f"Retrieved {len(alerts)} alerts")
                
                # Test send alert if alerts exist
                if alerts:
                    alert_id = alerts[0].get('alert_id')
                    if alert_id:
                        send_response = self.session.post(f"{API_BASE}/alerts/send", json={"alert_id": alert_id})
                        
                        if send_response.status_code == 200:
                            send_data = send_response.json()
                            if send_data.get('status') == 'success':
                                self.log_test("Send Alert", True, "Alert sent successfully")
                            else:
                                self.log_test("Send Alert", False, "Alert send failed", send_data)
                        else:
                            self.log_test("Send Alert", False, f"HTTP {send_response.status_code}", send_response.text)
                    else:
                        self.log_test("Send Alert", False, "No alert_id found in alert")
                else:
                    self.log_test("Send Alert", True, "No alerts to send (expected if no shortage students)")
            else:
                self.log_test("Get Alerts", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Get Alerts", False, "Request failed", str(e))
    
    def test_letter_generation(self):
        """Test letter generation"""
        print("\n=== TESTING LETTER GENERATION ===")
        
        document_types = [
            "Bonafide Certificate",
            "Study Certificate", 
            "Loan Estimation Letter",
            "Internship Permission Letter"
        ]
        
        for doc_type in document_types:
            try:
                response = self.session.post(f"{API_BASE}/letters/generate", json={
                    "rollNo": "R001",
                    "documentType": doc_type
                })
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('student') and data.get('documentType') == doc_type:
                        self.log_test(f"Letter Generation - {doc_type}", True, "Letter data generated successfully")
                    else:
                        self.log_test(f"Letter Generation - {doc_type}", False, "Invalid letter data", data)
                else:
                    self.log_test(f"Letter Generation - {doc_type}", False, f"HTTP {response.status_code}", response.text)
            except Exception as e:
                self.log_test(f"Letter Generation - {doc_type}", False, "Request failed", str(e))
        
        # Test with invalid roll number
        try:
            response = self.session.post(f"{API_BASE}/letters/generate", json={
                "rollNo": "R999",
                "documentType": "Bonafide Certificate"
            })
            
            if response.status_code == 404:
                self.log_test("Letter Generation - Invalid Student", True, "404 returned for invalid student")
            else:
                self.log_test("Letter Generation - Invalid Student", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_test("Letter Generation - Invalid Student", False, "Request failed", str(e))
    
    def test_analytics_endpoints(self):
        """Test analytics endpoints"""
        print("\n=== TESTING ANALYTICS ENDPOINTS ===")
        
        # Test day-wise analytics
        try:
            response = self.session.get(f"{API_BASE}/analytics/day-wise?date=2025-07-15")
            
            if response.status_code == 200:
                data = response.json()
                if 'absent_students' in data:
                    self.log_test("Day-wise Analytics", True, f"Retrieved absent students for date")
                else:
                    self.log_test("Day-wise Analytics", False, "No absent_students in response", data)
            else:
                self.log_test("Day-wise Analytics", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Day-wise Analytics", False, "Request failed", str(e))
        
        # Test subject-wise analytics
        try:
            response = self.session.get(f"{API_BASE}/analytics/subject-wise?subject=Math")
            
            if response.status_code == 200:
                data = response.json()
                if 'students' in data:
                    self.log_test("Subject-wise Analytics", True, f"Retrieved low attendance students for Math")
                else:
                    self.log_test("Subject-wise Analytics", False, "No students in response", data)
            else:
                self.log_test("Subject-wise Analytics", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Subject-wise Analytics", False, "Request failed", str(e))
        
        # Test semester-wise analytics
        try:
            response = self.session.get(f"{API_BASE}/analytics/semester-wise")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['total', 'eligible', 'shortage', 'students']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Semester-wise Analytics", True, f"Total: {data['total']}, Eligible: {data['eligible']}, Shortage: {data['shortage']}")
                else:
                    self.log_test("Semester-wise Analytics", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Semester-wise Analytics", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Semester-wise Analytics", False, "Request failed", str(e))
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting AcadEase 360° Backend API Tests")
        print(f"Backend URL: {API_BASE}")
        print("=" * 60)
        
        # Run tests in logical order
        self.test_seed_data()
        self.test_authentication()
        self.test_students_endpoints()
        self.test_attendance_submission()
        self.test_alerts_endpoints()
        self.test_letter_generation()
        self.test_analytics_endpoints()
        
        # Print summary
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = len(self.failed_tests)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['message']}")
                if test['details']:
                    print(f"    Details: {test['details']}")
        
        return passed_tests, failed_tests, self.test_results

if __name__ == "__main__":
    tester = BackendTester()
    passed, failed, results = tester.run_all_tests()
    
    # Exit with error code if tests failed
    sys.exit(0 if failed == 0 else 1)