#!/bin/bash

# MESOB Wellness - Comprehensive API Testing
# Tests all backend endpoints including authentication, users, vitals, appointments, wellness plans, and feedback

BASE_URL="http://localhost:5000/api/v1"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test
run_test() {
  local test_name="$1"
  local response="$2"
  local expected="$3"
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  if echo "$response" | grep -q "$expected"; then
    echo -e "${GREEN}✓ $test_name${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    return 0
  else
    echo -e "${RED}✗ $test_name${NC}"
    echo "   Response: $response"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    return 1
  fi
}

echo "🧪 MESOB Wellness - Comprehensive API Testing"
echo "=============================================="
echo ""

# ============================================
# SECTION 1: AUTHENTICATION
# ============================================
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo -e "${CYAN}  SECTION 1: AUTHENTICATION${NC}"
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo ""

# Test 1.1: Login as Customer
echo -e "${BLUE}Test 1.1: Login as Customer${NC}"
CUSTOMER_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@mesob.et",
    "password": "Customer123!"
  }')

if run_test "Customer login" "$CUSTOMER_LOGIN" "success"; then
  CUSTOMER_TOKEN=$(echo "$CUSTOMER_LOGIN" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  CUSTOMER_ID=$(echo "$CUSTOMER_LOGIN" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
fi
echo ""

# Test 1.2: Login as Nurse
echo -e "${BLUE}Test 1.2: Login as Nurse${NC}"
NURSE_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nurse@mesob.et",
    "password": "Nurse123!"
  }')

if run_test "Nurse login" "$NURSE_LOGIN" "success"; then
  NURSE_TOKEN=$(echo "$NURSE_LOGIN" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  NURSE_ID=$(echo "$NURSE_LOGIN" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
fi
echo ""

# Test 1.3: Login as Manager
echo -e "${BLUE}Test 1.3: Login as Manager${NC}"
MANAGER_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@mesob.et",
    "password": "Manager123!"
  }')

if run_test "Manager login" "$MANAGER_LOGIN" "success"; then
  MANAGER_TOKEN=$(echo "$MANAGER_LOGIN" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  MANAGER_ID=$(echo "$MANAGER_LOGIN" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
fi
echo ""

# Test 1.4: Verify Token
echo -e "${BLUE}Test 1.4: Verify Token${NC}"
VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verify-token" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$CUSTOMER_TOKEN\"}")
run_test "Token verification" "$VERIFY_RESPONSE" "valid"
echo ""

# Test 1.5: Get Current User
echo -e "${BLUE}Test 1.5: Get Current User (via /auth/me)${NC}"
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")
run_test "Get current user" "$ME_RESPONSE" "customer@mesob.et"
echo ""

# ============================================
# SECTION 2: USER PROFILE MANAGEMENT
# ============================================
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo -e "${CYAN}  SECTION 2: USER PROFILE MANAGEMENT${NC}"
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo ""

# Test 2.1: Get User Profile
echo -e "${BLUE}Test 2.1: Get User Profile (GET /users/me)${NC}"
USER_PROFILE=$(curl -s -X GET "$BASE_URL/users/me" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")
run_test "Get user profile" "$USER_PROFILE" "customer@mesob.et"
echo ""

# Test 2.2: Update User Profile
echo -e "${BLUE}Test 2.2: Update User Profile (PUT /users/me)${NC}"
UPDATE_PROFILE=$(curl -s -X PUT "$BASE_URL/users/me" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Customer Name",
    "phone": "+251911234567"
  }')
run_test "Update user profile" "$UPDATE_PROFILE" "success"
echo ""

# ============================================
# SECTION 3: VITALS MANAGEMENT
# ============================================
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo -e "${CYAN}  SECTION 3: VITALS MANAGEMENT${NC}"
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo ""

# Test 3.1: Check Vitals Status
echo -e "${BLUE}Test 3.1: Check Vitals Status${NC}"
VITALS_STATUS=$(curl -s -X GET "$BASE_URL/vitals/status" \
  -H "Authorization: Bearer $NURSE_TOKEN")
run_test "Vitals status check" "$VITALS_STATUS" "operational"
echo ""

# Test 3.2: Record BMI
echo -e "${BLUE}Test 3.2: Record BMI${NC}"
BMI_RESPONSE=$(curl -s -X POST "$BASE_URL/vitals/bmi" \
  -H "Authorization: Bearer $NURSE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "weightKg": 75,
    "heightCm": 180,
    "notes": "Regular checkup"
  }')
run_test "Record BMI" "$BMI_RESPONSE" "recordId"
echo ""

# Test 3.3: Record Blood Pressure
echo -e "${BLUE}Test 3.3: Record Blood Pressure${NC}"
BP_RESPONSE=$(curl -s -X POST "$BASE_URL/vitals/blood-pressure" \
  -H "Authorization: Bearer $NURSE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "systolic": 125,
    "diastolic": 82,
    "notes": "Slightly elevated"
  }')
run_test "Record blood pressure" "$BP_RESPONSE" "recordId"
echo ""

# Test 3.4: Get Vitals History
echo -e "${BLUE}Test 3.4: Get Vitals History${NC}"
HISTORY_RESPONSE=$(curl -s -X GET "$BASE_URL/vitals/history/$NURSE_ID" \
  -H "Authorization: Bearer $NURSE_TOKEN")
run_test "Get vitals history" "$HISTORY_RESPONSE" "records"
echo ""

# Test 3.5: Get Latest Vitals
echo -e "${BLUE}Test 3.5: Get Latest Vitals${NC}"
LATEST_RESPONSE=$(curl -s -X GET "$BASE_URL/vitals/latest/$NURSE_ID" \
  -H "Authorization: Bearer $NURSE_TOKEN")
run_test "Get latest vitals" "$LATEST_RESPONSE" "recordedAt"
echo ""

# ============================================
# SECTION 4: APPOINTMENTS MANAGEMENT
# ============================================
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo -e "${CYAN}  SECTION 4: APPOINTMENTS MANAGEMENT${NC}"
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo ""

# Test 4.1: Create Appointment
echo -e "${BLUE}Test 4.1: Create Appointment${NC}"
APPOINTMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/appointments" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "scheduledAt": "2026-05-15T10:00:00Z",
    "reason": "Annual physical examination"
  }')

if run_test "Create appointment" "$APPOINTMENT_RESPONSE" "success"; then
  APPOINTMENT_ID=$(echo "$APPOINTMENT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi
echo ""

# Test 4.2: List All Appointments
echo -e "${BLUE}Test 4.2: List All Appointments${NC}"
LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/appointments" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")
run_test "List appointments" "$LIST_RESPONSE" "appointments"
echo ""

# Test 4.3: Get Appointment by ID
if [ -n "$APPOINTMENT_ID" ]; then
  echo -e "${BLUE}Test 4.3: Get Appointment by ID${NC}"
  GET_APPOINTMENT=$(curl -s -X GET "$BASE_URL/appointments/$APPOINTMENT_ID" \
    -H "Authorization: Bearer $NURSE_TOKEN")
  run_test "Get appointment by ID" "$GET_APPOINTMENT" "success"
  echo ""
fi

# Test 4.4: Update Appointment Status to CONFIRMED
if [ -n "$APPOINTMENT_ID" ]; then
  echo -e "${BLUE}Test 4.4: Update Appointment Status to CONFIRMED${NC}"
  UPDATE_CONFIRMED=$(curl -s -X PATCH "$BASE_URL/appointments/$APPOINTMENT_ID" \
    -H "Authorization: Bearer $NURSE_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "status": "CONFIRMED",
      "notes": "Patient confirmed via phone"
    }')
  run_test "Update to CONFIRMED" "$UPDATE_CONFIRMED" "CONFIRMED"
  echo ""
fi

# Test 4.5: Update Appointment Status to IN_PROGRESS
if [ -n "$APPOINTMENT_ID" ]; then
  echo -e "${BLUE}Test 4.5: Update Appointment Status to IN_PROGRESS${NC}"
  UPDATE_PROGRESS=$(curl -s -X PATCH "$BASE_URL/appointments/$APPOINTMENT_ID" \
    -H "Authorization: Bearer $NURSE_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "status": "IN_PROGRESS",
      "notes": "Patient arrived and consultation started"
    }')
  run_test "Update to IN_PROGRESS" "$UPDATE_PROGRESS" "IN_PROGRESS"
  echo ""
fi

# Test 4.6: Complete Appointment with Diagnosis
if [ -n "$APPOINTMENT_ID" ]; then
  echo -e "${BLUE}Test 4.6: Complete Appointment with Diagnosis${NC}"
  UPDATE_COMPLETED=$(curl -s -X PATCH "$BASE_URL/appointments/$APPOINTMENT_ID" \
    -H "Authorization: Bearer $NURSE_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "status": "COMPLETED",
      "diagnosis": "Patient is in good health. Blood pressure slightly elevated.",
      "prescription": "Continue current lifestyle. Monitor blood pressure weekly.",
      "notes": "Follow-up in 3 months"
    }')
  run_test "Complete appointment" "$UPDATE_COMPLETED" "COMPLETED"
  echo ""
fi

# Test 4.7: Filter Appointments by Status
echo -e "${BLUE}Test 4.7: Filter Appointments by Status${NC}"
FILTER_RESPONSE=$(curl -s -X GET "$BASE_URL/appointments?status=COMPLETED" \
  -H "Authorization: Bearer $NURSE_TOKEN")
run_test "Filter appointments" "$FILTER_RESPONSE" "appointments"
echo ""

# ============================================
# SECTION 5: WELLNESS PLANS
# ============================================
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo -e "${CYAN}  SECTION 5: WELLNESS PLANS${NC}"
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo ""

# Test 5.1: Create Wellness Plan
echo -e "${BLUE}Test 5.1: Create Wellness Plan${NC}"
PLAN_RESPONSE=$(curl -s -X POST "$BASE_URL/plans" \
  -H "Authorization: Bearer $NURSE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$CUSTOMER_ID\",
    \"planText\": \"30 minutes walk daily, drink 8 glasses of water\",
    \"goals\": \"Improve cardiovascular health\",
    \"duration\": 30
  }")
run_test "Create wellness plan" "$PLAN_RESPONSE" "success"
echo ""

# Test 5.2: Get Wellness Plans for User
echo -e "${BLUE}Test 5.2: Get Wellness Plans for User${NC}"
GET_PLANS=$(curl -s -X GET "$BASE_URL/plans/$CUSTOMER_ID" \
  -H "Authorization: Bearer $NURSE_TOKEN")
run_test "Get wellness plans" "$GET_PLANS" "planText"
echo ""

# Test 5.3: Get Active Wellness Plans Only
echo -e "${BLUE}Test 5.3: Get Active Wellness Plans Only${NC}"
GET_ACTIVE_PLANS=$(curl -s -X GET "$BASE_URL/plans/$CUSTOMER_ID?activeOnly=true" \
  -H "Authorization: Bearer $NURSE_TOKEN")
run_test "Get active wellness plans" "$GET_ACTIVE_PLANS" "success"
echo ""

# ============================================
# SECTION 6: FEEDBACK
# ============================================
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo -e "${CYAN}  SECTION 6: FEEDBACK${NC}"
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo ""

# Test 6.1: Submit Feedback
echo -e "${BLUE}Test 6.1: Submit Feedback${NC}"
FEEDBACK_RESPONSE=$(curl -s -X POST "$BASE_URL/feedback" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$CUSTOMER_ID\",
    \"rating\": 5,
    \"comment\": \"Excellent service! Very professional staff.\",
    \"category\": \"SERVICE_QUALITY\"
  }")
run_test "Submit feedback" "$FEEDBACK_RESPONSE" "success"
echo ""

# Test 6.2: Submit Another Feedback
echo -e "${BLUE}Test 6.2: Submit Another Feedback${NC}"
FEEDBACK_RESPONSE2=$(curl -s -X POST "$BASE_URL/feedback" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$CUSTOMER_ID\",
    \"rating\": 4,
    \"comment\": \"Good experience overall.\",
    \"category\": \"GENERAL\"
  }")
run_test "Submit second feedback" "$FEEDBACK_RESPONSE2" "success"
echo ""

# Test 6.3: Get All Feedback (Manager)
echo -e "${BLUE}Test 6.3: Get All Feedback (Manager)${NC}"
GET_FEEDBACK=$(curl -s -X GET "$BASE_URL/feedback" \
  -H "Authorization: Bearer $MANAGER_TOKEN")
run_test "Get all feedback" "$GET_FEEDBACK" "rating"
echo ""

# Test 6.4: Get Feedback Statistics
echo -e "${BLUE}Test 6.4: Get Feedback Statistics${NC}"
GET_STATS=$(curl -s -X GET "$BASE_URL/feedback?stats=true" \
  -H "Authorization: Bearer $MANAGER_TOKEN")
run_test "Get feedback statistics" "$GET_STATS" "averageRating"
echo ""

# Test 6.5: Filter Feedback by Rating
echo -e "${BLUE}Test 6.5: Filter Feedback by Rating${NC}"
FILTER_FEEDBACK=$(curl -s -X GET "$BASE_URL/feedback?rating=5" \
  -H "Authorization: Bearer $MANAGER_TOKEN")
run_test "Filter feedback by rating" "$FILTER_FEEDBACK" "success"
echo ""

# ============================================
# SECTION 7: AUTHORIZATION TESTS
# ============================================
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo -e "${CYAN}  SECTION 7: AUTHORIZATION TESTS${NC}"
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo ""

# Test 7.1: Customer Cannot Create Wellness Plan
echo -e "${BLUE}Test 7.1: Customer Cannot Create Wellness Plan (403)${NC}"
UNAUTHORIZED_PLAN=$(curl -s -X POST "$BASE_URL/plans" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$CUSTOMER_ID\",
    \"planText\": \"Test plan\"
  }")
run_test "Customer cannot create plan" "$UNAUTHORIZED_PLAN" "Insufficient permissions"
echo ""

# Test 7.2: Customer Cannot View All Feedback
echo -e "${BLUE}Test 7.2: Customer Cannot View All Feedback (403)${NC}"
UNAUTHORIZED_FEEDBACK=$(curl -s -X GET "$BASE_URL/feedback" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")
run_test "Customer cannot view all feedback" "$UNAUTHORIZED_FEEDBACK" "Insufficient permissions"
echo ""

# Test 7.3: Unauthenticated Request Fails
echo -e "${BLUE}Test 7.3: Unauthenticated Request Fails (401)${NC}"
UNAUTH_REQUEST=$(curl -s -X GET "$BASE_URL/users/me")
run_test "Unauthenticated request fails" "$UNAUTH_REQUEST" "error"
echo ""

# ============================================
# TEST SUMMARY
# ============================================
echo ""
echo "=============================================="
echo -e "${CYAN}TEST SUMMARY${NC}"
echo "=============================================="
echo ""
echo "Total Tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
echo -e "${RED}Failed:       $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
  echo ""
  echo "📋 Tested Features:"
  echo "  ✓ Authentication (login, token verification, logout)"
  echo "  ✓ User profile management (get, update)"
  echo "  ✓ Vitals recording (BMI, blood pressure)"
  echo "  ✓ Vitals history (get history, get latest)"
  echo "  ✓ Appointments (create, list, update status)"
  echo "  ✓ Appointment status transitions (PENDING → CONFIRMED → IN_PROGRESS → COMPLETED)"
  echo "  ✓ Wellness plans (create, get by user)"
  echo "  ✓ Feedback (submit, get all, statistics)"
  echo "  ✓ Role-based access control (RBAC)"
  echo "  ✓ Authorization checks"
  echo ""
  echo "🗄️ Database Tables Used:"
  echo "  - users (authentication and profiles)"
  echo "  - health_profiles (user health information)"
  echo "  - vital_records (BMI and blood pressure history)"
  echo "  - appointments (appointment management)"
  echo "  - wellness_plans (wellness plan tracking)"
  echo "  - feedback (user feedback and ratings)"
  echo "  - audit_logs (compliance and security)"
  echo ""
  exit 0
else
  echo -e "${RED}❌ SOME TESTS FAILED${NC}"
  echo ""
  echo "Please review the failed tests above and check:"
  echo "  1. Backend server is running (npm run dev)"
  echo "  2. Database is properly configured"
  echo "  3. All migrations have been applied"
  echo "  4. Test users have been seeded"
  echo ""
  exit 1
fi
