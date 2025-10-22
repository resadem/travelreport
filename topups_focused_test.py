#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class TopupsHistoryTester:
    def __init__(self, base_url="https://travelagent-hub.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.sub_agency_id = None
        self.test_results = []

    def log_result(self, test_name, success, details=""):
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {details}")

    def make_request(self, method, endpoint, data=None, token=None, expected_status=200):
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

            success = response.status_code == expected_status
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"text": response.text, "status_code": response.status_code}
            
            return success, response_data

        except Exception as e:
            return False, {"error": str(e)}

    def setup_authentication(self):
        """Setup admin authentication and create test sub-agency"""
        print("🔐 Setting up authentication...")
        
        # Admin login
        success, response = self.make_request(
            'POST', 'auth/login',
            data={"email": "admin@4travels.com", "password": "admin123"}
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.log_result("Admin Authentication", True, f"Token obtained for {response['user']['email']}")
        else:
            self.log_result("Admin Authentication", False, f"Failed: {response}")
            return False

        # Create or get sub-agency for testing
        test_email = f"test_topup_agency_{datetime.now().strftime('%H%M%S')}@example.com"
        success, response = self.make_request(
            'POST', 'auth/register',
            data={
                "agency_name": "Test Topup Agency",
                "email": test_email,
                "password": "TestPass123!",
                "role": "sub_agency",
                "locale": "ru"
            },
            token=self.admin_token
        )
        
        if success:
            self.sub_agency_id = response.get('id')
            self.log_result("Create Test Sub-Agency", True, f"ID: {self.sub_agency_id}")
            return True
        else:
            self.log_result("Create Test Sub-Agency", False, f"Failed: {response}")
            return False

    def test_create_topup(self):
        """Test creating a top-up (stores in history)"""
        print("\n💰 Testing Top-up Creation...")
        
        topup_data = {
            "amount": 5000.0,
            "type": "cash"
        }
        
        success, response = self.make_request(
            'POST', f'users/{self.sub_agency_id}/topup-balance',
            data=topup_data,
            token=self.admin_token
        )
        
        if success:
            required_fields = ['topup_id', 'new_balance', 'topup_amount']
            has_fields = all(field in response for field in required_fields)
            
            if has_fields:
                self.log_result("Create Top-up", True, 
                               f"Amount: {response['topup_amount']}, New Balance: {response['new_balance']}, ID: {response['topup_id']}")
                return response['topup_id']
            else:
                self.log_result("Create Top-up", False, f"Missing fields in response: {response}")
        else:
            self.log_result("Create Top-up", False, f"Request failed: {response}")
        
        return None

    def test_get_topups_history(self):
        """Test retrieving top-ups history"""
        print("\n📋 Testing Top-ups History Retrieval...")
        
        success, response = self.make_request('GET', 'topups', token=self.admin_token)
        
        if success and isinstance(response, list):
            if response:
                first_topup = response[0]
                required_fields = ['id', 'agency_id', 'agency_name', 'amount', 'type', 'date', 'created_at']
                has_required_fields = all(field in first_topup for field in required_fields)
                
                # Check sorting (most recent first)
                is_sorted = True
                if len(response) > 1:
                    for i in range(len(response) - 1):
                        if response[i]['created_at'] < response[i + 1]['created_at']:
                            is_sorted = False
                            break
                
                self.log_result("Get Top-ups History", has_required_fields and is_sorted,
                               f"Found {len(response)} top-ups, Fields OK: {has_required_fields}, Sorted: {is_sorted}")
                
                # Show sample data
                print(f"   Sample top-up: {json.dumps(first_topup, indent=2)}")
            else:
                self.log_result("Get Top-ups History", True, "Empty history (no top-ups yet)")
        else:
            self.log_result("Get Top-ups History", False, f"Request failed: {response}")

    def test_edit_topup(self):
        """Test editing a top-up"""
        print("\n✏️ Testing Top-up Editing...")
        
        # Create initial top-up
        initial_data = {"amount": 3000.0, "type": "other"}
        success, response = self.make_request(
            'POST', f'users/{self.sub_agency_id}/topup-balance',
            data=initial_data,
            token=self.admin_token
        )
        
        if not success or 'topup_id' not in response:
            self.log_result("Edit Top-up Setup", False, f"Failed to create initial top-up: {response}")
            return
            
        topup_id = response['topup_id']
        initial_balance = response['new_balance']
        
        # Edit the top-up
        edit_data = {"amount": 4000.0, "type": "cash"}
        success, response = self.make_request(
            'PUT', f'topups/{topup_id}',
            data=edit_data,
            token=self.admin_token
        )
        
        if success:
            # Verify balance adjustment
            user_success, user_response = self.make_request(
                'GET', f'users/{self.sub_agency_id}',
                token=self.admin_token
            )
            
            if user_success:
                new_balance = user_response.get('balance', 0)
                expected_balance = initial_balance + 1000  # 4000 - 3000 = 1000 increase
                balance_correct = abs(new_balance - expected_balance) < 0.01
                
                self.log_result("Edit Top-up", balance_correct,
                               f"Balance adjusted from {initial_balance} to {new_balance} (expected: {expected_balance})")
            else:
                self.log_result("Edit Top-up", False, f"Failed to verify balance: {user_response}")
        else:
            self.log_result("Edit Top-up", False, f"Edit request failed: {response}")

    def test_delete_topup(self):
        """Test deleting a top-up"""
        print("\n🗑️ Testing Top-up Deletion...")
        
        # Create top-up to delete
        topup_data = {"amount": 2000.0, "type": "cash"}
        success, response = self.make_request(
            'POST', f'users/{self.sub_agency_id}/topup-balance',
            data=topup_data,
            token=self.admin_token
        )
        
        if not success or 'topup_id' not in response:
            self.log_result("Delete Top-up Setup", False, f"Failed to create top-up: {response}")
            return
            
        topup_id = response['topup_id']
        
        # Get balance before deletion
        user_success, user_response = self.make_request(
            'GET', f'users/{self.sub_agency_id}',
            token=self.admin_token
        )
        
        if not user_success:
            self.log_result("Delete Top-up", False, f"Failed to get balance: {user_response}")
            return
            
        balance_before = user_response.get('balance', 0)
        
        # Delete the top-up
        success, response = self.make_request(
            'DELETE', f'topups/{topup_id}',
            token=self.admin_token
        )
        
        if success:
            # Verify balance and history
            user_success, user_response = self.make_request(
                'GET', f'users/{self.sub_agency_id}',
                token=self.admin_token
            )
            
            history_success, history_response = self.make_request('GET', 'topups', token=self.admin_token)
            
            if user_success and history_success:
                new_balance = user_response.get('balance', 0)
                expected_balance = balance_before - 2000.0
                balance_correct = abs(new_balance - expected_balance) < 0.01
                
                topup_removed = not any(topup.get('id') == topup_id for topup in history_response)
                
                self.log_result("Delete Top-up", balance_correct and topup_removed,
                               f"Balance: {balance_before} → {new_balance}, Removed from history: {topup_removed}")
            else:
                self.log_result("Delete Top-up", False, "Failed to verify deletion effects")
        else:
            self.log_result("Delete Top-up", False, f"Delete request failed: {response}")

    def test_edge_cases(self):
        """Test edge cases and error handling"""
        print("\n🚨 Testing Edge Cases...")
        
        # Non-existent top-up edit
        success, response = self.make_request(
            'PUT', 'topups/fake-id',
            data={"amount": 1000.0, "type": "cash"},
            token=self.admin_token,
            expected_status=404
        )
        self.log_result("Edit Non-existent Top-up", success, "Correctly returned 404")
        
        # Non-existent top-up delete
        success, response = self.make_request(
            'DELETE', 'topups/fake-id',
            token=self.admin_token,
            expected_status=404
        )
        self.log_result("Delete Non-existent Top-up", success, "Correctly returned 404")

    def run_comprehensive_test(self):
        """Run comprehensive top-ups history test"""
        print("🚀 Starting Comprehensive Top-ups History Backend Test")
        print("=" * 60)
        
        if not self.setup_authentication():
            print("❌ Authentication setup failed - stopping tests")
            return False
        
        self.test_create_topup()
        self.test_get_topups_history()
        self.test_edit_topup()
        self.test_delete_topup()
        self.test_edge_cases()
        
        # Summary
        print("\n" + "=" * 60)
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        print(f"📊 Test Summary: {passed}/{total} passed")
        
        if passed < total:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
        
        return passed == total

def main():
    tester = TopupsHistoryTester()
    success = tester.run_comprehensive_test()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())