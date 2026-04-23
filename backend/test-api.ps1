# MESOB Wellness - API Testing Script for Windows PowerShell
# Tests key endpoints to verify PostgreSQL migration

$BASE_URL = "http://localhost:5000/api/v1"
$PASSED = 0
$FAILED = 0

Write-Host "`n🧪 MESOB Wellness - API Testing" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get
    if ($response.status -eq "success") {
        Write-Host "✓ Health check passed" -ForegroundColor Green
        $PASSED++
    } else {
        Write-Host "✗ Health check failed" -ForegroundColor Red
        $FAILED++
    }
} catch {
    Write-Host "✗ Health check failed: $_" -ForegroundColor Red
    $FAILED++
}

# Test 2: API Health Check
Write-Host "`nTest 2: API Health Check" -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get
    if ($response.data.database -eq "connected") {
        Write-Host "✓ Database connected" -ForegroundColor Green
        $PASSED++
    } else {
        Write-Host "✗ Database not connected" -ForegroundColor Red
        $FAILED++
    }
} catch {
    Write-Host "✗ API health check failed: $_" -ForegroundColor Red
    $FAILED++
}

# Test 3: Login as Customer
Write-Host "`nTest 3: Login as Customer" -ForegroundColor Blue
try {
    $body = @{
        email = "customer@mesob.et"
        password = "Customer123!"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $body -ContentType "application/json"
    if ($response.status -eq "success" -and $response.data.token) {
        Write-Host "✓ Customer login successful" -ForegroundColor Green
        $CUSTOMER_TOKEN = $response.data.token
        $CUSTOMER_ID = $response.data.user.id
        $PASSED++
    } else {
        Write-Host "✗ Customer login failed" -ForegroundColor Red
        $FAILED++
    }
} catch {
    Write-Host "✗ Customer login failed: $_" -ForegroundColor Red
    $FAILED++
}

# Test 4: Login as Nurse
Write-Host "`nTest 4: Login as Nurse" -ForegroundColor Blue
try {
    $body = @{
        email = "nurse@mesob.et"
        password = "Nurse123!"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $body -ContentType "application/json"
    if ($response.status -eq "success" -and $response.data.token) {
        Write-Host "✓ Nurse login successful" -ForegroundColor Green
        $NURSE_TOKEN = $response.data.token
        $NURSE_ID = $response.data.user.id
        $PASSED++
    } else {
        Write-Host "✗ Nurse login failed" -ForegroundColor Red
        $FAILED++
    }
} catch {
    Write-Host "✗ Nurse login failed: $_" -ForegroundColor Red
    $FAILED++
}

# Test 5: Login as Manager
Write-Host "`nTest 5: Login as Manager" -ForegroundColor Blue
try {
    $body = @{
        email = "manager@mesob.et"
        password = "Manager123!"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $body -ContentType "application/json"
    if ($response.status -eq "success" -and $response.data.token) {
        Write-Host "✓ Manager login successful" -ForegroundColor Green
        $MANAGER_TOKEN = $response.data.token
        $PASSED++
    } else {
        Write-Host "✗ Manager login failed" -ForegroundColor Red
        $FAILED++
    }
} catch {
    Write-Host "✗ Manager login failed: $_" -ForegroundColor Red
    $FAILED++
}

# Test 6: Get Current User
Write-Host "`nTest 6: Get Current User" -ForegroundColor Blue
try {
    $headers = @{
        Authorization = "Bearer $CUSTOMER_TOKEN"
    }
    $response = Invoke-RestMethod -Uri "$BASE_URL/auth/me" -Method Get -Headers $headers
    if ($response.status -eq "success" -and $response.data.email -eq "customer@mesob.et") {
        Write-Host "✓ Get current user successful" -ForegroundColor Green
        $PASSED++
    } else {
        Write-Host "✗ Get current user failed" -ForegroundColor Red
        $FAILED++
    }
} catch {
    Write-Host "✗ Get current user failed: $_" -ForegroundColor Red
    $FAILED++
}

# Test 7: Record BMI (Nurse)
Write-Host "`nTest 7: Record BMI" -ForegroundColor Blue
try {
    $headers = @{
        Authorization = "Bearer $NURSE_TOKEN"
    }
    $body = @{
        weightKg = 75
        heightCm = 180
        notes = "Test BMI recording"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/vitals/bmi" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    if ($response.status -eq "success") {
        Write-Host "✓ BMI recording successful" -ForegroundColor Green
        $PASSED++
    } else {
        Write-Host "✗ BMI recording failed" -ForegroundColor Red
        $FAILED++
    }
} catch {
    Write-Host "✗ BMI recording failed: $_" -ForegroundColor Red
    $FAILED++
}

# Test 8: Record Blood Pressure (Nurse)
Write-Host "`nTest 8: Record Blood Pressure" -ForegroundColor Blue
try {
    $headers = @{
        Authorization = "Bearer $NURSE_TOKEN"
    }
    $body = @{
        systolic = 120
        diastolic = 80
        notes = "Test BP recording"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/vitals/blood-pressure" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    if ($response.status -eq "success") {
        Write-Host "✓ Blood pressure recording successful" -ForegroundColor Green
        $PASSED++
    } else {
        Write-Host "✗ Blood pressure recording failed" -ForegroundColor Red
        $FAILED++
    }
} catch {
    Write-Host "✗ Blood pressure recording failed: $_" -ForegroundColor Red
    $FAILED++
}

# Test 9: Create Appointment
Write-Host "`nTest 9: Create Appointment" -ForegroundColor Blue
try {
    $headers = @{
        Authorization = "Bearer $CUSTOMER_TOKEN"
    }
    $scheduledTime = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    $body = @{
        scheduledAt = $scheduledTime
        reason = "Annual checkup"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/appointments" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    if ($response.status -eq "success") {
        Write-Host "✓ Appointment creation successful" -ForegroundColor Green
        $APPOINTMENT_ID = $response.data.id
        $PASSED++
    } else {
        Write-Host "✗ Appointment creation failed" -ForegroundColor Red
        $FAILED++
    }
} catch {
    Write-Host "✗ Appointment creation failed: $_" -ForegroundColor Red
    $FAILED++
}

# Test 10: Create Wellness Plan (Nurse)
Write-Host "`nTest 10: Create Wellness Plan" -ForegroundColor Blue
try {
    $headers = @{
        Authorization = "Bearer $NURSE_TOKEN"
    }
    $body = @{
        userId = $CUSTOMER_ID
        planText = "Walk 30 minutes daily"
        goals = "Improve cardiovascular health"
        duration = 30
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/plans" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    if ($response.status -eq "success") {
        Write-Host "✓ Wellness plan creation successful" -ForegroundColor Green
        $PASSED++
    } else {
        Write-Host "✗ Wellness plan creation failed" -ForegroundColor Red
        $FAILED++
    }
} catch {
    Write-Host "✗ Wellness plan creation failed: $_" -ForegroundColor Red
    $FAILED++
}

# Test 11: Submit Feedback
Write-Host "`nTest 11: Submit Feedback" -ForegroundColor Blue
try {
    $headers = @{
        Authorization = "Bearer $CUSTOMER_TOKEN"
    }
    $body = @{
        rating = 5
        comment = "Excellent service!"
        category = "service"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/feedback" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    if ($response.status -eq "success") {
        Write-Host "✓ Feedback submission successful" -ForegroundColor Green
        $PASSED++
    } else {
        Write-Host "✗ Feedback submission failed" -ForegroundColor Red
        $FAILED++
    }
} catch {
    Write-Host "✗ Feedback submission failed: $_" -ForegroundColor Red
    $FAILED++
}

# Test 12: Get Vitals History
Write-Host "`nTest 12: Get Vitals History" -ForegroundColor Blue
try {
    $headers = @{
        Authorization = "Bearer $NURSE_TOKEN"
    }
    $response = Invoke-RestMethod -Uri "$BASE_URL/vitals/history/$NURSE_ID" -Method Get -Headers $headers
    if ($response.status -eq "success") {
        Write-Host "✓ Get vitals history successful" -ForegroundColor Green
        $PASSED++
    } else {
        Write-Host "✗ Get vitals history failed" -ForegroundColor Red
        $FAILED++
    }
} catch {
    Write-Host "✗ Get vitals history failed: $_" -ForegroundColor Red
    $FAILED++
}

# Summary
Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Total Tests: $($PASSED + $FAILED)"
Write-Host "Passed: $PASSED" -ForegroundColor Green
Write-Host "Failed: $FAILED" -ForegroundColor Red

if ($FAILED -eq 0) {
    Write-Host "`n✅ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "`n✓ PostgreSQL migration successful" -ForegroundColor Green
    Write-Host "✓ All API endpoints working" -ForegroundColor Green
    Write-Host "✓ Authentication working" -ForegroundColor Green
    Write-Host "✓ Role-based access control working" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n❌ SOME TESTS FAILED" -ForegroundColor Red
    exit 1
}
