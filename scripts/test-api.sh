#!/bin/bash

# PostGenie AI - API Testing Script
# Tests the authentication endpoints

if [ -z "$1" ]; then
    echo "Usage: ./test-api.sh <API_GATEWAY_URL>"
    echo "Example: ./test-api.sh https://abc123.execute-api.us-east-1.amazonaws.com/prod"
    exit 1
fi

API_URL=$1
EMAIL="test-$(date +%s)@example.com"
PASSWORD="Test1234"

echo "🧪 Testing PostGenie AI API"
echo "============================"
echo "API URL: $API_URL"
echo "Test Email: $EMAIL"
echo ""

# Test Registration
echo "1️⃣  Testing Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "Response: $REGISTER_RESPONSE"
echo ""

# Extract token
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Registration failed - no token received"
    exit 1
fi

echo "✅ Registration successful!"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Test Login
echo "2️⃣  Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "Response: $LOGIN_RESPONSE"
echo ""

# Check if login was successful
if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo "✅ Login successful!"
else
    echo "❌ Login failed"
    exit 1
fi

echo ""
echo "✨ All tests passed!"
echo ""
echo "You can now use this token for authenticated requests:"
echo "Authorization: Bearer $TOKEN"
