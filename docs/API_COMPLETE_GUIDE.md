# Mesob Wellness - Complete API & Frontend Integration Guide

**Version:** 1.0.0  
**Last Updated:** April 23, 2026  
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication System](#authentication-system)
3. [Hierarchical Role Creation](#hierarchical-role-creation)
4. [All API Endpoints](#all-api-endpoints)
5. [Frontend Requirements](#frontend-requirements)
6. [Database Schema](#database-schema)
7. [Testing Guide](#testing-guide)

---

## Overview

### Base URL
```
http://localhost:5000/api/v1
```

### Response Format

**Success Response:**
```json
{
  "status": "success",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Error description"
}
```

### Authentication
All protected endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

---

## Authentication System

### User Roles (5 Levels)

| Role | Level | Description |
|------|-------|-------------|
| CUSTOMER_STAFF | 1 | Basic users, patients |
| NURSE_OFFICER | 2 | Healthcare staff, record vitals |
| MANAGER | 3 | Center managers, create nurses |
| REGIONAL_OFFICE | 4 | Regional administrators |
| FEDERAL_ADMIN | 5 | System administrators |

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Customer | customer@mesob.et | Customer123! |
| Nurse | nurse@mesob.et | Nurse123! |
| Manager | manager@mesob.et | Manager123! |
| Regional | regional@mesob.et | Regional123! |
| Admin | admin@mesob.et | Admin123! |

---

## Hierarchical Role Creation

### Registration Rules

**Public Registration (`POST /auth/register`):**
- ✅ Anyone can register
- ✅ Always creates CUSTOMER_STAFF role
- ❌ Cannot specify role

**Hierarchical Creation (`POST /auth/create-user`):**
- ✅ FEDERAL_ADMIN can create any role
- ✅ MANAGER can create NURSE_OFFICER and CUSTOMER_STAFF
- ✅ Must assign centerId when creating users
- ❌ Other roles cannot create users

### Creation Matrix

| Creator Role | Can Create |
|--------------|------------|
| FEDERAL_ADMIN | All roles (CUSTOMER_STAFF, NURSE_OFFICER, MANAGER, REGIONAL_OFFICE, FEDERAL_ADMIN) |
| MANAGER | NURSE_OFFICER, CUSTOMER_STAFF (must assign to their center) |
| REGIONAL_OFFICE | ❌ Cannot create users |
| NURSE_OFFICER | ❌ Cannot create users |
| CUSTOMER_STAFF | ❌ Cannot create users |

---

## All API Endpoints

### Total: 31 Endpoints

---

## 1. Authentication Endpoints (6)

### 1.1 Public Registration
**POST** `/api/v1/auth/register`

Creates CUSTOMER_STAFF account (public access).

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "phone": "+251911234567",
  "dateOfBirth": "1990-01-15",
  "gender": "MALE"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "CUSTOMER_STAFF"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.2 Hierarchical User Creation
**POST** `/api/v1/auth/create-user`

Creates user with specific role (requires authentication).

**Authorization:** FEDERAL_ADMIN (all roles), MANAGER (NURSE_OFFICER, CUSTOMER_STAFF)

**Request:**
```json
{
  "email": "nurse@example.com",
  "password": "SecurePass123!",
  "fullName": "Jane Smith",
  "role": "NURSE_OFFICER",
  "centerId": "center-uuid",
  "phone": "+251911234568"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "nurse@example.com",
      "fullName": "Jane Smith",
      "role": "NURSE_OFFICER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.3 Login
**POST** `/api/v1/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "CUSTOMER_STAFF"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.4 Verify Token
**POST** `/api/v1/auth/verify-token`

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 1.5 Get Current User
**GET** `/api/v1/auth/me`

**Headers:** `Authorization: Bearer <token>`

### 1.6 Logout
**POST** `/api/v1/auth/logout`

**Headers:** `Authorization: Bearer <token>`

---

## 2. User Profile Endpoints (2)

### 2.1 Get Profile
**GET** `/api/v1/users/me`

### 2.2 Update Profile
**PUT** `/api/v1/users/me`

**Request:**
```json
{
  "name": "Updated Name",
  "phone": "+251911234567"
}
```

---

## 3. Vitals Endpoints (5)

### 3.1 Check Status
**GET** `/api/v1/vitals/status`

### 3.2 Record BMI
**POST** `/api/v1/vitals/bmi`

**Authorization:** NURSE_OFFICER+

**Request:**
```json
{
  "weightKg": 75,
  "heightCm": 180,
  "notes": "Regular checkup"
}
```

### 3.3 Record Blood Pressure
**POST** `/api/v1/vitals/blood-pressure`

**Authorization:** NURSE_OFFICER+

**Request:**
```json
{
  "systolic": 120,
  "diastolic": 80,
  "notes": "Normal reading"
}
```

### 3.4 Get Vitals History
**GET** `/api/v1/vitals/history/:userId`

### 3.5 Get Latest Vitals
**GET** `/api/v1/vitals/latest/:userId`

---

## 4. Appointments Endpoints (4)

### 4.1 List Appointments
**GET** `/api/v1/appointments`

**Query Parameters:**
- `status` - Filter by status (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW)

### 4.2 Create Appointment
**POST** `/api/v1/appointments`

**Request:**
```json
{
  "patientId": 1,
  "scheduledAt": "2026-05-15T10:00:00Z",
  "reason": "Annual physical examination"
}
```

### 4.3 Get Appointment
**GET** `/api/v1/appointments/:id`

### 4.4 Update Appointment
**PATCH** `/api/v1/appointments/:id`

**Authorization:** NURSE_OFFICER+

**Request:**
```json
{
  "status": "COMPLETED",
  "diagnosis": "Patient is in good health",
  "prescription": "Continue current lifestyle"
}
```

---

## 5. Wellness Plans Endpoints (2)

### 5.1 Create Plan
**POST** `/api/v1/plans`

**Authorization:** NURSE_OFFICER+

**Request:**
```json
{
  "userId": "user-uuid",
  "planText": "30 minutes walk daily",
  "goals": "Improve cardiovascular health",
  "duration": 30
}
```

### 5.2 Get Plans
**GET** `/api/v1/plans/:userId`

**Query Parameters:**
- `activeOnly=true` - Get only active plans

---

## 6. Feedback Endpoints (2)

### 6.1 Submit Feedback
**POST** `/api/v1/feedback`

**Request:**
```json
{
  "userId": "user-uuid",
  "rating": 5,
  "comment": "Excellent service!",
  "category": "SERVICE_QUALITY"
}
```

### 6.2 Get Feedback
**GET** `/api/v1/feedback`

**Authorization:** MANAGER+

**Query Parameters:**
- `stats=true` - Get statistics
- `rating=5` - Filter by rating
- `category=SERVICE_QUALITY` - Filter by category

---

## 7. Centers Management Endpoints (8)

### 7.1 Create Center
**POST** `/api/v1/centers`

**Authorization:** FEDERAL_ADMIN only

**Request:**
```json
{
  "name": "Addis Ababa Central Health Center",
  "code": "AA-CHC-001",
  "region": "Addis Ababa",
  "city": "Addis Ababa",
  "address": "Bole Road, Near Edna Mall",
  "phone": "+251911234567",
  "email": "aa.central@mesob.et",
  "capacity": 100
}
```

### 7.2 List Centers
**GET** `/api/v1/centers`

**Query Parameters:**
- `region=Addis Ababa` - Filter by region
- `status=ACTIVE` - Filter by status

### 7.3 Get Center
**GET** `/api/v1/centers/:id`

### 7.4 Update Center
**PUT** `/api/v1/centers/:id`

**Authorization:** FEDERAL_ADMIN only

### 7.5 Delete Center
**DELETE** `/api/v1/centers/:id`

**Authorization:** FEDERAL_ADMIN only

### 7.6 Center Analytics
**GET** `/api/v1/centers/:id/analytics`

**Authorization:** NURSE_OFFICER+ (own center), MANAGER+ (own center), REGIONAL_OFFICE (region), FEDERAL_ADMIN (all)

**Response:**
```json
{
  "status": "success",
  "data": {
    "centerId": "uuid",
    "totalStaff": 25,
    "totalAppointments": 450,
    "completedAppointments": 380,
    "pendingAppointments": 70,
    "totalVitals": 520,
    "averageFeedback": 4.5
  }
}
```

### 7.7 Regional Analytics
**GET** `/api/v1/centers/analytics/region/:region`

**Authorization:** REGIONAL_OFFICE+

### 7.8 National Analytics
**GET** `/api/v1/centers/analytics/all`

**Authorization:** FEDERAL_ADMIN only

---

## Frontend Requirements

### Pages Needed

#### 1. Public Pages
- **Landing Page** - System overview
- **Login Page** - Email/password form
- **Register Page** - Public registration (creates CUSTOMER_STAFF)

#### 2. Customer Dashboard
- **Profile Page** - View/edit profile
- **Appointments Page** - Book and view appointments
- **Vitals History** - View own vitals
- **Wellness Plans** - View assigned plans
- **Feedback Form** - Submit feedback

#### 3. Nurse Dashboard
- **Vitals Recording** - Record BMI, blood pressure
- **Appointments Management** - Update appointment status
- **Patient List** - View assigned patients
- **Center Analytics** - View own center stats

#### 4. Manager Dashboard
- **User Creation** - Create nurses and staff
- **Center Overview** - Center statistics
- **Staff Management** - View and manage staff
- **Appointments Overview** - All center appointments
- **Analytics Dashboard** - Charts and metrics

#### 5. Regional Office Dashboard
- **Regional Overview** - All centers in region
- **Regional Analytics** - Aggregated statistics
- **Centers Comparison** - Performance comparison
- **Reports** - Regional reports

#### 6. Federal Admin Dashboard
- **Centers Management** - CRUD operations
- **User Creation** - Create any role
- **National Analytics** - Nationwide statistics
- **Regional Comparison** - Compare regions
- **System Settings** - Configuration

### Components Needed

#### Authentication Components
```jsx
- LoginForm
- RegisterForm
- CreateUserForm (hierarchical)
- ProtectedRoute
- RoleBasedRoute
```

#### User Components
```jsx
- ProfileCard
- ProfileEditForm
- UserList
- UserCard
```

#### Vitals Components
```jsx
- BMIRecordForm
- BloodPressureForm
- VitalsHistoryChart
- VitalsCard
- LatestVitalsDisplay
```

#### Appointments Components
```jsx
- AppointmentBookingForm
- AppointmentsList
- AppointmentCard
- AppointmentStatusBadge
- AppointmentUpdateForm
```

#### Wellness Components
```jsx
- WellnessPlanForm
- WellnessPlanCard
- WellnessPlansList
- GoalsTracker
```

#### Feedback Components
```jsx
- FeedbackForm
- FeedbackList
- FeedbackCard
- RatingDisplay
- FeedbackStats
```

#### Centers Components
```jsx
- CenterForm
- CentersList
- CenterCard
- CenterDetailsModal
- CenterStatusBadge
```

#### Analytics Components
```jsx
- AnalyticsDashboard
- CenterAnalyticsCard
- RegionalAnalyticsChart
- NationalOverview
- StatisticsCard
- TrendsChart
```

### State Management

```javascript
// Auth State
{
  user: {
    id: string,
    email: string,
    fullName: string,
    role: string,
    centerId?: string
  },
  token: string,
  isAuthenticated: boolean
}

// Centers State
{
  centers: Center[],
  selectedCenter: Center | null,
  analytics: {
    center: CenterAnalytics,
    regional: RegionalAnalytics,
    national: NationalAnalytics
  }
}

// Appointments State
{
  appointments: Appointment[],
  filters: {
    status: string,
    date: Date
  }
}
```

### API Service Layer

```javascript
// services/api.js
const API_BASE_URL = 'http://localhost:5000/api/v1';

// Auth Service
export const authService = {
  register: (data) => POST('/auth/register', data),
  createUser: (data, token) => POST('/auth/create-user', data, token),
  login: (credentials) => POST('/auth/login', credentials),
  logout: (token) => POST('/auth/logout', null, token),
  verifyToken: (token) => POST('/auth/verify-token', { token }),
  getCurrentUser: (token) => GET('/auth/me', token)
};

// Centers Service
export const centersService = {
  create: (data, token) => POST('/centers', data, token),
  getAll: (filters, token) => GET('/centers', token, filters),
  getById: (id, token) => GET(`/centers/${id}`, token),
  update: (id, data, token) => PUT(`/centers/${id}`, data, token),
  delete: (id, token) => DELETE(`/centers/${id}`, token),
  getAnalytics: (id, token) => GET(`/centers/${id}/analytics`, token),
  getRegionalAnalytics: (region, token) => GET(`/centers/analytics/region/${region}`, token),
  getNationalAnalytics: (token) => GET('/centers/analytics/all', token)
};

// Vitals Service
export const vitalsService = {
  recordBMI: (data, token) => POST('/vitals/bmi', data, token),
  recordBP: (data, token) => POST('/vitals/blood-pressure', data, token),
  getHistory: (userId, token) => GET(`/vitals/history/${userId}`, token),
  getLatest: (userId, token) => GET(`/vitals/latest/${userId}`, token)
};

// Appointments Service
export const appointmentsService = {
  create: (data, token) => POST('/appointments', data, token),
  getAll: (filters, token) => GET('/appointments', token, filters),
  getById: (id, token) => GET(`/appointments/${id}`, token),
  update: (id, data, token) => PATCH(`/appointments/${id}`, data, token)
};
```

### Routing Structure

```javascript
// App Routes
/                          → Landing Page
/login                     → Login Page
/register                  → Register Page

// Customer Routes
/dashboard                 → Customer Dashboard
/profile                   → Profile Page
/appointments              → Appointments List
/appointments/book         → Book Appointment
/vitals                    → Vitals History
/wellness-plans            → Wellness Plans
/feedback                  → Submit Feedback

// Nurse Routes
/nurse/dashboard           → Nurse Dashboard
/nurse/vitals              → Record Vitals
/nurse/appointments        → Manage Appointments
/nurse/patients            → Patient List

// Manager Routes
/manager/dashboard         → Manager Dashboard
/manager/users/create      → Create User (Nurse/Staff)
/manager/staff             → Staff Management
/manager/analytics         → Center Analytics

// Regional Routes
/regional/dashboard        → Regional Dashboard
/regional/centers          → Centers in Region
/regional/analytics        → Regional Analytics

// Admin Routes
/admin/dashboard           → Admin Dashboard
/admin/centers             → Centers Management
/admin/centers/create      → Create Center
/admin/users/create        → Create User (Any Role)
/admin/analytics           → National Analytics
```

### Authorization Guards

```javascript
// Route Protection
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};

// Usage
<Route path="/admin/*" element={
  <ProtectedRoute allowedRoles={['FEDERAL_ADMIN']}>
    <AdminLayout />
  </ProtectedRoute>
} />
```

---

## Database Schema

### Tables (8)

1. **users** - User accounts with center assignment
2. **health_profiles** - User health information
3. **vital_records** - BMI, blood pressure, vitals history
4. **appointments** - Appointment management
5. **wellness_plans** - Personalized wellness plans
6. **feedback** - User feedback and ratings
7. **centers** - Health centers/facilities
8. **audit_logs** - Compliance and security logging

### Key Relationships

```
Center (1) ──────── (Many) User
  │
User (1) ──────── (1) HealthProfile
  │
  ├──────── (Many) VitalRecord (as patient)
  ├──────── (Many) VitalRecord (as recorder)
  ├──────── (Many) Appointment
  ├──────── (Many) WellnessPlan
  ├──────── (Many) Feedback
  └──────── (Many) AuditLog
```

---

## Testing Guide

### Run Tests

```bash
cd backend
bash test-all-endpoints.sh
```

### Manual Testing

#### 1. Test Public Registration
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "fullName": "Test User"
  }'
```

#### 2. Test Hierarchical User Creation
```bash
# Login as Admin
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mesob.et","password":"Admin123!"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Create Nurse
curl -X POST http://localhost:5000/api/v1/auth/create-user \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newnurse@mesob.et",
    "password": "Nurse123!",
    "fullName": "New Nurse",
    "role": "NURSE_OFFICER",
    "centerId": "center-uuid"
  }'
```

#### 3. Test Centers Management
```bash
# Create Center
curl -X POST http://localhost:5000/api/v1/centers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Center",
    "code": "TC-001",
    "region": "Addis Ababa",
    "city": "Addis Ababa",
    "address": "Test Address",
    "capacity": 50
  }'

# Get Analytics
curl -X GET http://localhost:5000/api/v1/centers/analytics/all \
  -H "Authorization: Bearer $TOKEN"
```

---

## Error Handling

### Common Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

### Error Response Examples

```json
{
  "status": "error",
  "message": "Managers can only create Nurse Officers and Customer Staff"
}
```

```json
{
  "status": "error",
  "message": "Center ID is required when creating users"
}
```

---

## Security Best Practices

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Token Management
- Tokens expire after 1 hour
- Store tokens securely (HttpOnly cookies recommended)
- Refresh tokens before expiration
- Clear tokens on logout

### Role-Based Access
- Always verify user role before operations
- Use middleware for route protection
- Log all sensitive operations
- Implement audit trails

---

## Performance Requirements

- Authentication: < 2 seconds
- Vitals operations: < 100ms
- Appointments operations: < 100ms
- Analytics queries: < 500ms

---

## Compliance

### Proclamation 1321/2024
- All data stored locally
- Audit logging enabled
- No external data transmission
- User consent required
- Data sovereignty maintained

---

## Support & Documentation

- **API Contract:** `docs/api.md`
- **Database Schema:** `docs/DATABASE_SCHEMA.md`
- **Implementation Status:** `docs/IMPLEMENTATION_STATUS.md`
- **README:** `README.md`

---

**End of Complete API Guide**

For questions or issues, refer to the documentation files or contact the development team.
