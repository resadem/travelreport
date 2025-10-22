#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class B2BTravelPortalTester:
    def __init__(self, base_url="https://travelagent-hub.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.sub_agency_token = None
        self.sub_agency_id = None
        self.test_reservation_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append(f"{name}: {details}")

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    token: Optional[str] = None, expected_status: int = 200) -> tuple:
        """Make HTTP request and return success status and response data"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"text": response.text, "status_code": response.status_code}
            
            return success, response_data

        except Exception as e:
            return False, {"error": str(e)}

    def test_admin_login(self):
        """Test admin login with correct credentials"""
        success, response = self.make_request(
            'POST', 'auth/login',
            data={"email": "admin@4travels.com", "password": "admin123"}
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            user_data = response.get('user', {})
            role_correct = user_data.get('role') == 'admin'
            self.log_test("Admin Login", success and role_correct, 
                         f"Role: {user_data.get('role', 'unknown')}")
            return True
        else:
            self.log_test("Admin Login", False, f"Response: {response}")
            return False

    def test_admin_get_current_user(self):
        """Test getting current admin user info"""
        success, response = self.make_request('GET', 'auth/me', token=self.admin_token)
        
        if success:
            role_correct = response.get('role') == 'admin'
            email_correct = response.get('email') == 'admin@4travels.com'
            self.log_test("Admin Get Current User", role_correct and email_correct,
                         f"Role: {response.get('role')}, Email: {response.get('email')}")
        else:
            self.log_test("Admin Get Current User", False, f"Response: {response}")

    def test_create_sub_agency(self):
        """Test creating a sub-agency user"""
        test_email = f"test_agency_{datetime.now().strftime('%H%M%S')}@example.com"
        
        success, response = self.make_request(
            'POST', 'auth/register',
            data={
                "agency_name": "Test Agency",
                "email": test_email,
                "password": "TestPass123!",
                "role": "sub_agency",
                "locale": "ru"
            },
            token=self.admin_token,
            expected_status=200
        )
        
        if success:
            self.sub_agency_id = response.get('id')
            role_correct = response.get('role') == 'sub_agency'
            self.log_test("Create Sub-Agency", role_correct,
                         f"ID: {self.sub_agency_id}, Role: {response.get('role')}")
            
            # Now test login with sub-agency
            login_success, login_response = self.make_request(
                'POST', 'auth/login',
                data={"email": test_email, "password": "TestPass123!"}
            )
            
            if login_success and 'access_token' in login_response:
                self.sub_agency_token = login_response['access_token']
                self.log_test("Sub-Agency Login", True, "Token obtained")
            else:
                self.log_test("Sub-Agency Login", False, f"Response: {login_response}")
        else:
            self.log_test("Create Sub-Agency", False, f"Response: {response}")

    def test_create_reservation(self):
        """Test creating a reservation (admin only)"""
        reservation_data = {
            "agency_id": self.sub_agency_id or "test-agency-id",
            "agency_name": "Test Agency",
            "date_of_issue": "2025-01-15",
            "service_type": "Flight",
            "date_of_service": "2025-02-15",
            "description": "Test flight booking",
            "tourist_names": "John Doe, Jane Doe",
            "price": 1500.00,
            "prepayment_amount": 500.00,
            "rest_amount_of_payment": 1000.00,
            "last_date_of_payment": "2025-02-10",
            "supplier": "Test Airlines",
            "supplier_price": 1200.00,
            "supplier_prepayment_amount": 400.00,
            "revenue": 300.00,
            "revenue_percentage": 20.00
        }
        
        success, response = self.make_request(
            'POST', 'reservations',
            data=reservation_data,
            token=self.admin_token,
            expected_status=200
        )
        
        if success and 'id' in response:
            self.test_reservation_id = response['id']
            self.log_test("Create Reservation", True, f"ID: {self.test_reservation_id}")
        else:
            self.log_test("Create Reservation", False, f"Response: {response}")

    def test_admin_get_reservations(self):
        """Test admin getting all reservations (should see all 18 columns)"""
        success, response = self.make_request('GET', 'reservations', token=self.admin_token)
        
        if success and 'reservations' in response:
            reservations = response['reservations']
            if reservations:
                # Check if admin columns are present
                first_reservation = reservations[0]
                admin_columns = ['supplier', 'supplier_price', 'supplier_prepayment_amount', 
                               'revenue', 'revenue_percentage']
                has_admin_columns = all(col in first_reservation for col in admin_columns)
                self.log_test("Admin Get Reservations (All Columns)", has_admin_columns,
                             f"Admin columns present: {has_admin_columns}")
            else:
                self.log_test("Admin Get Reservations (All Columns)", True, "No reservations yet")
        else:
            self.log_test("Admin Get Reservations (All Columns)", False, f"Response: {response}")

    def test_sub_agency_get_reservations(self):
        """Test sub-agency getting reservations (should NOT see admin columns 14-18)"""
        if not self.sub_agency_token:
            self.log_test("Sub-Agency Get Reservations (RBAC)", False, "No sub-agency token")
            return
            
        success, response = self.make_request('GET', 'reservations', token=self.sub_agency_token)
        
        if success and 'reservations' in response:
            reservations = response['reservations']
            if reservations:
                # Check that admin columns are NOT present
                first_reservation = reservations[0]
                admin_columns = ['supplier', 'supplier_price', 'supplier_prepayment_amount', 
                               'revenue', 'revenue_percentage']
                has_admin_columns = any(col in first_reservation for col in admin_columns)
                self.log_test("Sub-Agency Get Reservations (RBAC)", not has_admin_columns,
                             f"Admin columns hidden: {not has_admin_columns}")
            else:
                self.log_test("Sub-Agency Get Reservations (RBAC)", True, "No reservations for sub-agency")
        else:
            self.log_test("Sub-Agency Get Reservations (RBAC)", False, f"Response: {response}")

    def test_sub_agency_cannot_create_reservation(self):
        """Test that sub-agency cannot create reservations"""
        if not self.sub_agency_token:
            self.log_test("Sub-Agency Cannot Create Reservation", False, "No sub-agency token")
            return
            
        reservation_data = {
            "agency_id": "test-id",
            "agency_name": "Test Agency",
            "date_of_issue": "2025-01-15",
            "service_type": "Hotel",
            "date_of_service": "2025-02-15",
            "description": "Test hotel booking",
            "tourist_names": "Test User",
            "price": 800.00,
            "prepayment_amount": 200.00,
            "rest_amount_of_payment": 600.00,
            "last_date_of_payment": "2025-02-10"
        }
        
        success, response = self.make_request(
            'POST', 'reservations',
            data=reservation_data,
            token=self.sub_agency_token,
            expected_status=403  # Should be forbidden
        )
        
        # Success here means we got the expected 403 status
        self.log_test("Sub-Agency Cannot Create Reservation", success,
                     f"Got expected 403 status: {success}")

    def test_get_statistics(self):
        """Test getting statistics"""
        success, response = self.make_request('GET', 'statistics', token=self.admin_token)
        
        if success:
            required_fields = ['total_reservations', 'total_price', 'total_prepayment', 'total_rest']
            has_required = all(field in response for field in required_fields)
            has_admin_revenue = 'total_revenue' in response  # Admin should see revenue
            self.log_test("Get Statistics", has_required and has_admin_revenue,
                         f"Required fields: {has_required}, Admin revenue: {has_admin_revenue}")
        else:
            self.log_test("Get Statistics", False, f"Response: {response}")

    def test_get_settings(self):
        """Test getting settings"""
        success, response = self.make_request('GET', 'settings', token=self.admin_token)
        
        if success and 'upcoming_due_threshold_days' in response:
            self.log_test("Get Settings", True, f"Threshold: {response['upcoming_due_threshold_days']}")
        else:
            self.log_test("Get Settings", False, f"Response: {response}")

    def test_update_settings(self):
        """Test updating settings (admin only)"""
        success, response = self.make_request(
            'PUT', 'settings',
            data={"upcoming_due_threshold_days": 10},
            token=self.admin_token
        )
        
        self.log_test("Update Settings", success, f"Response: {response}")

    def test_topup_balance(self):
        """Test creating a top-up (existing endpoint, but now stores in history)"""
        if not self.sub_agency_id:
            self.log_test("Create Top-up", False, "No sub-agency ID available")
            return None
            
        topup_data = {
            "amount": 5000.0,
            "type": "cash"
        }
        
        success, response = self.make_request(
            'POST', f'users/{self.sub_agency_id}/topup-balance',
            data=topup_data,
            token=self.admin_token
        )
        
        if success and 'topup_id' in response and 'new_balance' in response:
            topup_id = response['topup_id']
            self.log_test("Create Top-up", True, 
                         f"ID: {topup_id}, New Balance: {response['new_balance']}")
            return topup_id
        else:
            self.log_test("Create Top-up", False, f"Response: {response}")
            return None

    def test_get_topups_history(self):
        """Test getting top-ups history"""
        success, response = self.make_request('GET', 'topups', token=self.admin_token)
        
        if success and isinstance(response, list):
            # Check if response contains expected fields
            if response:
                first_topup = response[0]
                required_fields = ['id', 'agency_id', 'agency_name', 'amount', 'type', 'date', 'created_at']
                has_required_fields = all(field in first_topup for field in required_fields)
                
                # Check if sorted by created_at descending (most recent first)
                is_sorted = True
                if len(response) > 1:
                    for i in range(len(response) - 1):
                        if response[i]['created_at'] < response[i + 1]['created_at']:
                            is_sorted = False
                            break
                
                self.log_test("Get Top-ups History", has_required_fields and is_sorted,
                             f"Found {len(response)} top-ups, Required fields: {has_required_fields}, Sorted: {is_sorted}")
            else:
                self.log_test("Get Top-ups History", True, "No top-ups found (empty list)")
        else:
            self.log_test("Get Top-ups History", False, f"Response: {response}")

    def test_edit_topup(self):
        """Test editing a top-up"""
        # First create a top-up to edit
        if not self.sub_agency_id:
            self.log_test("Edit Top-up", False, "No sub-agency ID available")
            return
            
        # Create initial top-up
        topup_data = {
            "amount": 3000.0,
            "type": "other"
        }
        
        success, response = self.make_request(
            'POST', f'users/{self.sub_agency_id}/topup-balance',
            data=topup_data,
            token=self.admin_token
        )
        
        if not success or 'topup_id' not in response:
            self.log_test("Edit Top-up (Create Initial)", False, f"Failed to create initial top-up: {response}")
            return
            
        topup_id = response['topup_id']
        initial_balance = response['new_balance']
        
        # Now edit the top-up
        edit_data = {
            "amount": 4000.0,
            "type": "cash"
        }
        
        success, response = self.make_request(
            'PUT', f'topups/{topup_id}',
            data=edit_data,
            token=self.admin_token
        )
        
        if success:
            # Verify balance was adjusted correctly (should increase by 1000)
            user_success, user_response = self.make_request(
                'GET', f'users/{self.sub_agency_id}',
                token=self.admin_token
            )
            
            if user_success:
                new_balance = user_response.get('balance', 0)
                expected_balance = initial_balance + 1000  # 4000 - 3000 = 1000 increase
                balance_correct = abs(new_balance - expected_balance) < 0.01  # Allow for floating point precision
                
                self.log_test("Edit Top-up", balance_correct,
                             f"Balance adjusted correctly: {new_balance} (expected: {expected_balance})")
            else:
                self.log_test("Edit Top-up", False, f"Failed to verify balance: {user_response}")
        else:
            self.log_test("Edit Top-up", False, f"Response: {response}")

    def test_delete_topup(self):
        """Test deleting a top-up"""
        if not self.sub_agency_id:
            self.log_test("Delete Top-up", False, "No sub-agency ID available")
            return
            
        # First create a top-up to delete
        topup_data = {
            "amount": 2000.0,
            "type": "cash"
        }
        
        success, response = self.make_request(
            'POST', f'users/{self.sub_agency_id}/topup-balance',
            data=topup_data,
            token=self.admin_token
        )
        
        if not success or 'topup_id' not in response:
            self.log_test("Delete Top-up (Create Initial)", False, f"Failed to create initial top-up: {response}")
            return
            
        topup_id = response['topup_id']
        
        # Get current balance before deletion
        user_success, user_response = self.make_request(
            'GET', f'users/{self.sub_agency_id}',
            token=self.admin_token
        )
        
        if not user_success:
            self.log_test("Delete Top-up", False, f"Failed to get user balance: {user_response}")
            return
            
        balance_before_delete = user_response.get('balance', 0)
        
        # Now delete the top-up
        success, response = self.make_request(
            'DELETE', f'topups/{topup_id}',
            token=self.admin_token
        )
        
        if success:
            # Verify balance was adjusted correctly (should decrease by 2000)
            user_success, user_response = self.make_request(
                'GET', f'users/{self.sub_agency_id}',
                token=self.admin_token
            )
            
            if user_success:
                new_balance = user_response.get('balance', 0)
                expected_balance = balance_before_delete - 2000.0
                balance_correct = abs(new_balance - expected_balance) < 0.01
                
                # Verify top-up was removed from history
                history_success, history_response = self.make_request('GET', 'topups', token=self.admin_token)
                topup_removed = True
                if history_success and isinstance(history_response, list):
                    topup_removed = not any(topup.get('id') == topup_id for topup in history_response)
                
                self.log_test("Delete Top-up", balance_correct and topup_removed,
                             f"Balance adjusted: {balance_correct}, Removed from history: {topup_removed}")
            else:
                self.log_test("Delete Top-up", False, f"Failed to verify balance: {user_response}")
        else:
            self.log_test("Delete Top-up", False, f"Response: {response}")

    def test_topup_edge_cases(self):
        """Test edge cases for top-up operations"""
        # Test editing non-existent topup
        success, response = self.make_request(
            'PUT', 'topups/fake-id',
            data={"amount": 1000.0, "type": "cash"},
            token=self.admin_token,
            expected_status=404
        )
        self.log_test("Edit Non-existent Top-up (404)", success, "Got expected 404 status")
        
        # Test deleting non-existent topup
        success, response = self.make_request(
            'DELETE', 'topups/fake-id',
            token=self.admin_token,
            expected_status=404
        )
        self.log_test("Delete Non-existent Top-up (404)", success, "Got expected 404 status")

    def test_topup_authentication(self):
        """Test top-up endpoints require admin authentication"""
        # Test accessing top-ups history without token (should get 403 due to missing Bearer token)
        success, response = self.make_request(
            'GET', 'topups',
            expected_status=403
        )
        self.log_test("Top-ups History Requires Auth", success, "Got expected 403 status")
        
        # Test accessing with sub-agency token (should fail)
        if self.sub_agency_token:
            success, response = self.make_request(
                'GET', 'topups',
                token=self.sub_agency_token,
                expected_status=403
            )
            self.log_test("Top-ups History Admin Only", success, "Got expected 403 status")
        else:
            self.log_test("Top-ups History Admin Only", False, "No sub-agency token to test with")

    def test_get_users(self):
        """Test getting users list (admin only)"""
        success, response = self.make_request('GET', 'users', token=self.admin_token)
        
        if success and isinstance(response, list):
            self.log_test("Get Users", True, f"Found {len(response)} users")
        else:
            self.log_test("Get Users", False, f"Response: {response}")

    def test_reservation_details(self):
        """Test getting reservation details"""
        if not self.test_reservation_id:
            self.log_test("Get Reservation Details", False, "No test reservation ID")
            return
            
        success, response = self.make_request(
            'GET', f'reservations/{self.test_reservation_id}',
            token=self.admin_token
        )
        
        if success and 'id' in response:
            # Check admin columns are present for admin
            admin_columns = ['supplier', 'supplier_price', 'supplier_prepayment_amount', 
                           'revenue', 'revenue_percentage']
            has_admin_columns = all(col in response for col in admin_columns)
            self.log_test("Get Reservation Details (Admin)", has_admin_columns,
                         f"Admin columns present: {has_admin_columns}")
        else:
            self.log_test("Get Reservation Details (Admin)", False, f"Response: {response}")

    def test_update_reservation(self):
        """Test updating reservation (admin only)"""
        if not self.test_reservation_id:
            self.log_test("Update Reservation", False, "No test reservation ID")
            return
            
        update_data = {
            "description": "Updated test flight booking",
            "price": 1600.00
        }
        
        success, response = self.make_request(
            'PUT', f'reservations/{self.test_reservation_id}',
            data=update_data,
            token=self.admin_token
        )
        
        self.log_test("Update Reservation", success, f"Response: {response}")

    def test_search_and_filters(self):
        """Test search and filter functionality"""
        # Test service type filter
        success, response = self.make_request(
            'GET', 'reservations?service_type=Flight',
            token=self.admin_token
        )
        self.log_test("Filter by Service Type", success, f"Response: {response}")
        
        # Test search
        success, response = self.make_request(
            'GET', 'reservations?search=test',
            token=self.admin_token
        )
        self.log_test("Search Reservations", success, f"Response: {response}")

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        success, response = self.make_request(
            'POST', 'auth/login',
            data={"email": "invalid@example.com", "password": "wrongpass"},
            expected_status=401
        )
        
        self.log_test("Invalid Login Rejected", success, "Got expected 401 status")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting B2B Travel Portal Backend Tests")
        print("=" * 50)
        
        # Authentication tests
        if not self.test_admin_login():
            print("❌ Admin login failed - stopping tests")
            return False
            
        self.test_admin_get_current_user()
        self.test_invalid_login()
        
        # User management tests
        self.test_create_sub_agency()
        self.test_get_users()
        
        # Top-ups tests (NEW)
        print("\n🔄 Testing Top-ups History Backend...")
        self.test_topup_authentication()
        self.test_topup_balance()
        self.test_get_topups_history()
        self.test_edit_topup()
        self.test_delete_topup()
        self.test_topup_edge_cases()
        
        # Reservation tests
        self.test_create_reservation()
        self.test_admin_get_reservations()
        self.test_sub_agency_get_reservations()
        self.test_sub_agency_cannot_create_reservation()
        self.test_reservation_details()
        self.test_update_reservation()
        self.test_search_and_filters()
        
        # Settings and statistics
        self.test_get_statistics()
        self.test_get_settings()
        self.test_update_settings()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"  - {failure}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = B2BTravelPortalTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())