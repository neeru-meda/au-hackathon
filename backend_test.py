#!/usr/bin/env python3
"""
AcadEase 360° Backend API Testing - Phase 1 New Endpoints
Testing all new features: clerk/student login, add student, letter request system,
QR generation, bulk sync, at-risk analytics, audit log
"""

import requests
import json
import sys
from datetime import datetime

# Base URL from frontend .env
BASE_URL = "https://au-mobile-suite.preview.emergentagent.com/api"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.saved_data = {}
        
    def log_test(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def test_endpoint(self, method, endpoint, data=None, expected_status=200, test_name=""):
        """Generic endpoint test"""
        try:
            url = f"{BASE_URL}{endpoint}"
            if method.upper() == "GET":
                response = self.session.get(url)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if success and response.headers.get('content-type', '').startswith('application/json'):
                try:
                    json_data = response.json()
                    if isinstance(json_data, dict):
                        details += f", Keys: {list(json_data.keys())}"
                except:
                    pass
            elif not success:
                details += f", Response: {response.text[:200]}"
                
            self.log_test(test_name or f"{method} {endpoint}", success, details)
            return response
        except Exception as e:
            self.log_test(test_name or f"{method} {endpoint}", False, f"Exception: {str(e)}")
            return None

    def run_all_tests(self):
        """Run all Phase 1 tests according to review request"""
        print("🚀 Starting AcadEase 360° Backend API Testing - Phase 1")
        print("=" * 60)
        
        # STEP 1: Seed data first
        print("\n📊 STEP 1: Seeding Database")
        response = self.test_endpoint("POST", "/seed-data", test_name="Seed Database")
        if response and response.status_code == 200:
            try:
                data = response.json()
                print(f"    Created {data.get('students_count', 0)} students, {data.get('alerts_count', 0)} alerts")
            except:
                pass
        
        # STEP 2: Test existing endpoints still work
        print("\n🔐 STEP 2: Testing Existing Authentication")
        
        # Teacher login
        teacher_response = self.test_endpoint("POST", "/login", 
            {"username": "teacher", "password": "teacher123"}, 
            test_name="Teacher Login")
        if teacher_response and teacher_response.status_code == 200:
            try:
                data = teacher_response.json()
                if data.get("success") and data.get("user", {}).get("role") == "Teacher":
                    print("    Teacher role verified")
                else:
                    self.log_test("Teacher Role Verification", False, "Role not Teacher")
            except:
                pass
        
        # Admin login
        admin_response = self.test_endpoint("POST", "/login", 
            {"username": "admin", "password": "admin123"}, 
            test_name="Admin Login")
        if admin_response and admin_response.status_code == 200:
            try:
                data = admin_response.json()
                if data.get("success") and data.get("user", {}).get("role") == "Admin":
                    print("    Admin role verified")
                else:
                    self.log_test("Admin Role Verification", False, "Role not Admin")
            except:
                pass
        
        # Test student endpoints
        self.test_endpoint("GET", "/students", test_name="GET All Students")
        self.test_endpoint("GET", "/students/R001", test_name="GET Specific Student (R001)")
        
        # STEP 3: Test NEW Clerk & Student Login
        print("\n🆕 STEP 3: Testing NEW Clerk & Student Login")
        
        # Clerk login
        clerk_response = self.test_endpoint("POST", "/login", 
            {"username": "clerk", "password": "clerk123"}, 
            test_name="Clerk Login")
        if clerk_response and clerk_response.status_code == 200:
            try:
                data = clerk_response.json()
                if data.get("success") and data.get("user", {}).get("role") == "Clerk":
                    print("    Clerk role verified")
                else:
                    self.log_test("Clerk Role Verification", False, f"Expected Clerk, got {data.get('user', {}).get('role')}")
            except:
                pass
        
        # Student login (R001 -> username "R001", password "student123")
        student_response = self.test_endpoint("POST", "/login", 
            {"username": "R001", "password": "student123"}, 
            test_name="Student Login (R001)")
        if student_response and student_response.status_code == 200:
            try:
                data = student_response.json()
                if data.get("success") and data.get("user", {}).get("role") == "Student":
                    roll_no = data.get("user", {}).get("rollNo")
                    if roll_no == "R001":
                        print(f"    Student login verified: {roll_no}")
                    else:
                        self.log_test("Student RollNo Verification", False, f"Expected R001, got {roll_no}")
                else:
                    self.log_test("Student Role Verification", False, f"Expected Student, got {data.get('user', {}).get('role')}")
            except:
                pass
        
        # Invalid credentials test
        invalid_response = self.test_endpoint("POST", "/login", 
            {"username": "invalid", "password": "wrong"}, 
            test_name="Invalid Credentials Test")
        if invalid_response and invalid_response.status_code == 200:
            try:
                data = invalid_response.json()
                if not data.get("success"):
                    print("    Invalid credentials properly rejected")
                else:
                    self.log_test("Invalid Credentials Rejection", False, "Should have failed but succeeded")
            except:
                pass
        
        # STEP 4: Test Add Student API
        print("\n👨‍🎓 STEP 4: Testing Add Student API")
        
        # Add new student
        new_student_data = {
            "rollNo": "NEW001",
            "name": "Test Student",
            "email": "test@au.edu",
            "phone": "9876543210",
            "course": "B.Tech+M.Tech - CSE",
            "semester": 3
        }
        add_response = self.test_endpoint("POST", "/students", new_student_data, 
            test_name="Add New Student")
        if add_response and add_response.status_code == 200:
            try:
                data = add_response.json()
                # Verify required fields
                required_fields = ["attendancePercent", "hasOutstandingDues", "username", "password"]
                missing_fields = [f for f in required_fields if f not in data]
                if not missing_fields:
                    print(f"    Student created with attendance: {data.get('attendancePercent')}%, dues: {data.get('hasOutstandingDues')}")
                    print(f"    Username: {data.get('username')}, Password: {data.get('password')}")
                else:
                    self.log_test("Student Fields Verification", False, f"Missing fields: {missing_fields}")
            except:
                pass
        
        # Try duplicate rollNo
        duplicate_response = self.test_endpoint("POST", "/students", new_student_data, 
            expected_status=400, test_name="Duplicate RollNo Test")
        if duplicate_response and duplicate_response.status_code == 400:
            print("    Duplicate rollNo properly rejected")
        
        # Try bad email
        bad_email_data = new_student_data.copy()
        bad_email_data["rollNo"] = "NEW002"
        bad_email_data["email"] = "bademail"
        bad_email_response = self.test_endpoint("POST", "/students", bad_email_data, 
            expected_status=400, test_name="Bad Email Test")
        if bad_email_response and bad_email_response.status_code == 400:
            print("    Bad email properly rejected")
        
        # STEP 5: Test Letter Request System
        print("\n📄 STEP 5: Testing Letter Request System")
        
        # Create letter request (R001 should have attendance >= 75%)
        letter_request_data = {
            "rollNo": "R001",
            "docType": "Bonafide Certificate"
        }
        request_response = self.test_endpoint("POST", "/letters/request", letter_request_data, 
            test_name="Create Letter Request")
        request_id = None
        if request_response and request_response.status_code == 200:
            try:
                data = request_response.json()
                request_id = data.get("requestId")
                status = data.get("status")
                if status == "Queue":
                    print(f"    Request created with ID: {request_id}, Status: {status}")
                    self.saved_data["request_id"] = request_id
                else:
                    self.log_test("Request Status Verification", False, f"Expected Queue, got {status}")
            except:
                pass
        
        # Get all letter requests
        requests_response = self.test_endpoint("GET", "/letters/requests", 
            test_name="Get Letter Requests")
        if requests_response and requests_response.status_code == 200:
            try:
                data = requests_response.json()
                requests_list = data.get("requests", [])
                print(f"    Found {len(requests_list)} letter requests")
                if requests_list and not request_id:
                    # Use first request if we didn't save one
                    request_id = requests_list[0].get("requestId")
                    self.saved_data["request_id"] = request_id
            except:
                pass
        
        # Approve the request
        if request_id:
            approve_data = {"status": "Approved"}
            approve_response = self.test_endpoint("PUT", f"/letters/requests/{request_id}", 
                approve_data, test_name="Approve Letter Request")
            if approve_response and approve_response.status_code == 200:
                try:
                    data = approve_response.json()
                    verify_token = data.get("verifyToken")
                    if verify_token:
                        print(f"    Request approved with verify token: {verify_token}")
                        self.saved_data["verify_token"] = verify_token
                    else:
                        self.log_test("Verify Token Generation", False, "No verify token in response")
                except:
                    pass
        
        # STEP 6: Test Letter Generate with QR
        print("\n🔲 STEP 6: Testing Letter Generate with QR")
        
        generate_data = {
            "rollNo": "R001",
            "docType": "Bonafide Certificate",
            "requestId": request_id
        }
        generate_response = self.test_endpoint("POST", "/letters/generate-full", generate_data, 
            test_name="Generate Letter with QR")
        if generate_response and generate_response.status_code == 200:
            try:
                data = generate_response.json()
                html = data.get("html", "")
                filename = data.get("filename", "")
                verify_token = data.get("verifyToken", "")
                
                # Check for QR code in HTML
                has_qr = "data:image/png;base64" in html
                if has_qr:
                    print(f"    Letter generated with QR code, filename: {filename}")
                    if verify_token:
                        self.saved_data["verify_token"] = verify_token
                else:
                    self.log_test("QR Code Verification", False, "No QR code found in HTML")
            except:
                pass
        
        # STEP 7: Test QR Verification (no auth)
        print("\n✅ STEP 7: Testing QR Verification")
        
        verify_token = self.saved_data.get("verify_token")
        if verify_token:
            # Valid token test
            verify_response = self.test_endpoint("GET", f"/letters/verify/{verify_token}", 
                test_name="Verify Valid Token")
            if verify_response and verify_response.status_code == 200:
                try:
                    data = verify_response.json()
                    if data.get("valid") == True:
                        student_name = data.get("studentName", "")
                        roll_no = data.get("rollNo", "")
                        print(f"    Valid token verified: {student_name} ({roll_no})")
                    else:
                        self.log_test("Valid Token Verification", False, "Token marked as invalid")
                except:
                    pass
        
        # Invalid token test
        invalid_verify_response = self.test_endpoint("GET", "/letters/verify/INVALID_TOKEN", 
            test_name="Verify Invalid Token")
        if invalid_verify_response and invalid_verify_response.status_code == 200:
            try:
                data = invalid_verify_response.json()
                if data.get("valid") == False:
                    print("    Invalid token properly rejected")
                else:
                    self.log_test("Invalid Token Rejection", False, "Invalid token marked as valid")
            except:
                pass
        
        # STEP 8: Test Bulk Sync Attendance
        print("\n📊 STEP 8: Testing Bulk Sync Attendance")
        
        # Bulk sync data (JSON array directly)
        bulk_sync_data = [
            {
                "localId": "test-001",
                "subject": "math",
                "date": "2026-03-28",
                "records": [
                    {"rollNo": "R001", "status": "Present"},
                    {"rollNo": "R002", "status": "Absent"}
                ],
                "createdAt": "2026-03-28T10:00:00"
            }
        ]
        
        sync_response = self.test_endpoint("POST", "/attendance/bulk-sync", bulk_sync_data, 
            test_name="Bulk Sync Attendance")
        if sync_response and sync_response.status_code == 200:
            try:
                data = sync_response.json()
                synced = data.get("synced", [])
                skipped = data.get("skipped", [])
                print(f"    Synced: {len(synced)}, Skipped: {len(skipped)}")
                
                # Verify localId in response
                if synced and synced[0].get("localId") == "test-001":
                    print("    LocalId properly returned in synced array")
                else:
                    self.log_test("LocalId Verification", False, "LocalId not found in synced response")
            except:
                pass
        
        # Submit same data again to test duplicates
        duplicate_sync_response = self.test_endpoint("POST", "/attendance/bulk-sync", bulk_sync_data, 
            test_name="Duplicate Sync Test")
        if duplicate_sync_response and duplicate_sync_response.status_code == 200:
            try:
                data = duplicate_sync_response.json()
                skipped = data.get("skipped", [])
                if skipped and skipped[0].get("localId") == "test-001":
                    print("    Duplicate properly skipped")
                else:
                    self.log_test("Duplicate Skip Verification", False, "Duplicate not properly skipped")
            except:
                pass
        
        # STEP 9: Test At-Risk Analytics
        print("\n⚠️ STEP 9: Testing At-Risk Analytics")
        
        at_risk_response = self.test_endpoint("GET", "/analytics/at-risk", 
            test_name="At-Risk Analytics")
        if at_risk_response and at_risk_response.status_code == 200:
            try:
                data = at_risk_response.json()
                at_risk_students = data.get("atRiskStudents", [])
                print(f"    Found {len(at_risk_students)} at-risk students")
                if at_risk_students:
                    sample = at_risk_students[0]
                    required_fields = ["rollNo", "name", "currentPercent", "projectedPercent", "subjectsAtRisk"]
                    missing_fields = [f for f in required_fields if f not in sample]
                    if not missing_fields:
                        print(f"    Sample: {sample['name']} - Current: {sample['currentPercent']}%, Projected: {sample['projectedPercent']}%")
                    else:
                        self.log_test("At-Risk Fields Verification", False, f"Missing fields: {missing_fields}")
            except:
                pass
        
        # STEP 10: Test Audit Log
        print("\n📋 STEP 10: Testing Audit Log")
        
        audit_response = self.test_endpoint("GET", "/audit-log", 
            test_name="Get Audit Log")
        if audit_response and audit_response.status_code == 200:
            try:
                data = audit_response.json()
                logs = data.get("logs", [])
                print(f"    Found {len(logs)} audit log entries")
                
                # Check for expected actions
                expected_actions = ["LOGIN", "ADD_STUDENT", "LETTER_REQUESTED", "LETTER_APPROVED", 
                                  "LETTER_GENERATED", "ATTENDANCE_SYNCED"]
                found_actions = set()
                for log in logs:
                    action = log.get("action")
                    if action in expected_actions:
                        found_actions.add(action)
                
                missing_actions = set(expected_actions) - found_actions
                if not missing_actions:
                    print(f"    All expected actions found: {sorted(found_actions)}")
                else:
                    print(f"    Found actions: {sorted(found_actions)}")
                    print(f"    Missing actions: {sorted(missing_actions)}")
            except:
                pass
        
        # STEP 11: Test Letter Request Rejection
        print("\n❌ STEP 11: Testing Letter Request Rejection")
        
        # Create another request
        reject_request_data = {
            "rollNo": "R001",
            "docType": "Study Certificate"
        }
        reject_request_response = self.test_endpoint("POST", "/letters/request", reject_request_data, 
            test_name="Create Request for Rejection")
        
        new_request_id = None
        if reject_request_response and reject_request_response.status_code == 200:
            try:
                data = reject_request_response.json()
                new_request_id = data.get("requestId")
            except:
                pass
        
        # Reject the request
        if new_request_id:
            reject_data = {
                "status": "Rejected",
                "reason": "Missing documents"
            }
            reject_response = self.test_endpoint("PUT", f"/letters/requests/{new_request_id}", 
                reject_data, test_name="Reject Letter Request")
            if reject_response and reject_response.status_code == 200:
                try:
                    data = reject_response.json()
                    rejection_reason = data.get("rejectionReason")
                    if rejection_reason == "Missing documents":
                        print(f"    Request rejected with reason: {rejection_reason}")
                    else:
                        self.log_test("Rejection Reason Verification", False, f"Expected 'Missing documents', got '{rejection_reason}'")
                except:
                    pass
        
        # STEP 12: Test eligibility check on letter request
        print("\n🚫 STEP 12: Testing Eligibility Check")
        
        # Try to find a student with low attendance or use the newly added student
        ineligible_request_data = {
            "rollNo": "NEW001",  # The student we added has 0% attendance
            "docType": "Bonafide Certificate"
        }
        ineligible_response = self.test_endpoint("POST", "/letters/request", ineligible_request_data, 
            expected_status=400, test_name="Ineligible Student Request")
        if ineligible_response and ineligible_response.status_code == 400:
            try:
                error_text = ineligible_response.text
                if "Not eligible" in error_text or "Attendance" in error_text:
                    print("    Ineligible student properly rejected")
                else:
                    print(f"    Rejection reason: {error_text}")
            except:
                pass
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        # Show failed tests
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  • {test['test']}: {test['details']}")
        else:
            print(f"\n🎉 ALL TESTS PASSED!")

if __name__ == "__main__":
    tester = APITester()
    tester.run_all_tests()