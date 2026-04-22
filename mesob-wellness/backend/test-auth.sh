#!/bin/bash

# MESOB Wellness Authentication Testing Script
# This script tests the authentication endpoints

BASE_URL="http://localhost:5000/api/v1"

echo "🧪 MESOB Wellness Authentication Testing"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Register a new user
echo -e "${YELLOW}Test 1: Register New User${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-'$(date +%s)'@mesob.et",
    "password": "TestUser123!",
    "fullName": "Test User",
    "role": "CUSTOMER_STAFF"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✓ Registration successful${NC}"
  NEW_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
else
  echo -e "${RED}✗ Registration failed${NC}"
  echo "$REGISTER_RESPONSE"
fi
echo ""

# Test 2: Login with nurse account
echo -e "${YELLOW}Test 2: Login as Nurse${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nurse@mesob.et",
    "password": "Nurse123!"
  }')

if echo "$LOGIN_RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✓ Login successful${NC}"
  NURSE_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
else
  echo -e "${RED}✗ Login failed${NC}"
  echo "$LOGIN_RESPONSE"
fi
echo ""

# Test 3: Get current user
echo -e "${YELLOW}Test 3: Get Current User (Protected Route)${NC}"
if [ -n "$NURSE_TOKEN" ]; then
  ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
    -H "Authorization: Bearer $NURSE_TOKEN")
  
  if echo "$ME_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Successfully retrieved user profile${NC}"
  else
    echo -e "${RED}✗ Failed to retrieve user profile${NC}"
    echo "$ME_RESPONSE"
  fi
else
  echo -e "${RED}✗ No token available (login failed)${NC}"
fi
echo ""

# Test 4: Invalid credentials
echo -e "${YELLOW}Test 4: Login with Invalid Credentials${NC}"
INVALID_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nurse@mesob.et",
    "password": "WrongPassword123!"
  }')

if echo "$INVALID_LOGIN" | grep -q "error"; then
  echo -e "${GREEN}✓ Correctly rejected invalid credentials${NC}"
else
  echo -e "${RED}✗ Should have rejected invalid credentials${NC}"
  echo "$INVALID_LOGIN"
fi
echo ""

# Test 5: Access without token
echo -e "${YELLOW}Test 5: Access Protected Route Without Token${NC}"
NO_TOKEN_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me")

if echo "$NO_TOKEN_RESPONSE" | grep -q "error"; then
  echo -e "${GREEN}✓ Correctly rejected request without token${NC}"
else
  echo -e "${RED}✗ Should have rejected request without token${NC}"
  echo "$NO_TOKEN_RESPONSE"
fi
echo ""

# Test 6: Verify token
echo -e "${YELLOW}Test 6: Verify Token${NC}"
if [ -n "$NURSE_TOKEN" ]; then
  VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verify-token" \
    -H "Content-Type: application/json" \
    -d "{\"token\": \"$NURSE_TOKEN\"}")
  
  if echo "$VERIFY_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Token verified successfully${NC}"
  else
    echo -e "${RED}✗ Token verification failed${NC}"
    echo "$VERIFY_RESPONSE"
  fi
else
  echo -e "${RED}✗ No token available${NC}"
fi
echo ""

# Test 7: Role-based access (Nurse accessing vitals)
echo -e "${YELLOW}Test 7: Role-Based Access - Nurse Recording Vitals${NC}"
if [ -n "$NURSE_TOKEN" ]; then
  VITALS_RESPONSE=$(curl -s -X POST "$BASE_URL/vitals/bmi" \
    -H "Authorization: Bearer $NURSE_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "weight": 70,
      "height": 1.75
    }')
  
  # Check if authorized (not 403)
  if echo "$VITALS_RESPONSE" | grep -q "403"; then
    echo -e "${RED}✗ Nurse should have access to record vitals${NC}"
  else
    echo -e "${GREEN}✓ Nurse has appropriate access${NC}"
  fi
else
  echo -e "${RED}✗ No token available${NC}"
fi
echo ""

# Test 8: Login as customer and try to access vitals (should fail)
echo -e "${YELLOW}Test 8: Role-Based Access - Customer Recording Vitals (Should Fail)${NC}"
CUSTOMER_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@mesob.et",
    "password": "Customer123!"
  }')

if echo "$CUSTOMER_LOGIN" | grep -q "success"; then
  CUSTOMER_TOKEN=$(echo "$CUSTOMER_LOGIN" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  
  CUSTOMER_VITALS=$(curl -s -X POST "$BASE_URL/vitals/bmi" \
    -H "Authorization: Bearer $CUSTOMER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "weight": 70,
      "height": 1.75
    }')
  
  if echo "$CUSTOMER_VITALS" | grep -q "403"; then
    echo -e "${GREEN}✓ Correctly denied customer access to record vitals${NC}"
  else
    echo -e "${RED}✗ Should have denied customer access${NC}"
    echo "$CUSTOMER_VITALS"
  fi
else
  echo -e "${RED}✗ Customer login failed${NC}"
fi
echo ""

# Test 9: Logout
echo -e "${YELLOW}Test 9: Logout${NC}"
if [ -n "$NURSE_TOKEN" ]; then
  LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/logout" \
    -H "Authorization: Bearer $NURSE_TOKEN")
  
  if echo "$LOGOUT_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Logout successful${NC}"
  else
    echo -e "${RED}✗ Logout failed${NC}"
    echo "$LOGOUT_RESPONSE"
  fi
else
  echo -e "${RED}✗ No token available${NC}"
fi
echo ""

echo "========================================"
echo "✅ Testing Complete!"
echo ""
echo "📋 Test Summary:"
echo "  - User Registration"
echo "  - User Login"
echo "  - Protected Route Access"
echo "  - Invalid Credentials Handling"
echo "  - Missing Token Handling"
echo "  - Token Verification"
echo "  - Role-Based Access Control"
echo "  - Logout"
echo ""
echo "For detailed testing, see docs/TESTING_AUTH.md"
