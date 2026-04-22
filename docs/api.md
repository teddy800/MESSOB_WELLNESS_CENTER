# Mesob Wellness API Specification

## 1. Document Purpose

This document defines the current application programming interface contract for the Mesob Wellness platform. It is intended for backend, frontend, testing, and governance teams.

## 2. Scope

This version covers the following functional domains:

- Authentication
- User profile
- Vitals
- Appointments
- Wellness plans
- Feedback

## 3. Base URL

- Local environment: http://localhost:5000

## 3.1 Backend Development Baseline

- Runtime standard: Node.js with TypeScript strict mode enabled in backend/tsconfig.json.
- ORM initialization standard: Prisma initialized with MySQL provider.
- Prisma connection standard: DATABASE_URL must point to a local MySQL instance (localhost/127.0.0.1).
- Environment validation standard: backend startup enforces required variables and rejects placeholder secrets.

Required backend environment variables:

- NODE_ENV
- PORT
- DB_HOST
- DB_PORT
- DB_USER
- DB_PASS
- DB_NAME
- DATABASE_URL
- JWT_SECRET
- JWT_EXPIRES_IN

Modular backend API composition (for parallel team development):

- /api/v1/vitals
- /api/v1/appointments

Current module-ready endpoints:

- GET /api/v1/vitals/status
- POST /api/v1/vitals/bmi
- POST /api/v1/vitals/blood-pressure
- GET /api/v1/appointments
- POST /api/v1/appointments

## 4. API Governance Rules

- All successful responses shall use the standard success envelope.
- All failure responses shall use the standard error envelope.
- Timestamps shall use ISO 8601 UTC format.
- Request and response bodies shall be JSON.

### 4.1 Standard Success Envelope

```json
{
  "status": "success",
  "data": {}
}
```

### 4.2 Standard Error Envelope

```json
{
  "status": "error",
  "message": "string"
}
```

## 5. Endpoint Definitions

### 5.1 Authentication

#### POST /api/auth/register

Request body:

```json
{
  "name": "Abel M",
  "email": "abel@example.com",
  "password": "secret123",
  "roleId": 3
}
```

Success response:

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Abel M",
    "email": "abel@example.com",
    "roleId": 3
  }
}
```

#### POST /api/auth/login

Request body:

```json
{
  "email": "abel@example.com",
  "password": "secret123"
}
```

Success response:

```json
{
  "status": "success",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": 1,
      "name": "Abel M",
      "email": "abel@example.com",
      "roleId": 3
    }
  }
}
```

### 5.2 Users

#### GET /api/users/me

Success response:

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Abel M",
    "email": "abel@example.com",
    "roleId": 3
  }
}
```

#### PUT /api/users/me

Request body:

```json
{
  "name": "Abel Mengistu"
}
```

Success response:

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Abel Mengistu"
  }
}
```

### 5.3 Vitals

#### POST /api/vitals

Request body:

```json
{
  "userId": 1,
  "bp": "120/80",
  "heartRate": 72,
  "weight": 70.5,
  "height": 175.0
}
```

Success response:

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "createdAt": "2026-04-21T10:00:00.000Z"
  }
}
```

#### GET /api/vitals/:userId

Success response:

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "userId": 1,
      "bp": "120/80",
      "heartRate": 72,
      "weight": 70.5,
      "height": 175,
      "createdAt": "2026-04-21T10:00:00.000Z"
    }
  ]
}
```

### 5.4 Appointments

#### POST /api/appointments

Request body:

```json
{
  "userId": 1,
  "date": "2026-04-22T09:30:00.000Z"
}
```

Success response:

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "status": "pending",
    "tokenNumber": 5
  }
}
```

#### GET /api/appointments

Success response:

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "userId": 1,
      "date": "2026-04-22T09:30:00.000Z",
      "status": "pending",
      "tokenNumber": 5
    }
  ]
}
```

#### PUT /api/appointments/:id

Request body:

```json
{
  "status": "completed"
}
```

Success response:

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "status": "completed"
  }
}
```

### 5.5 Wellness Plans

#### POST /api/plans

Request body:

```json
{
  "userId": 1,
  "planText": "30 minutes walk daily"
}
```

Success response:

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "userId": 1,
    "createdAt": "2026-04-21T10:00:00.000Z"
  }
}
```

#### GET /api/plans/:userId

Success response:

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "userId": 1,
      "planText": "30 minutes walk daily",
      "createdAt": "2026-04-21T10:00:00.000Z"
    }
  ]
}
```

### 5.6 Feedback

#### POST /api/feedback

Request body:

```json
{
  "userId": 1,
  "rating": 5,
  "comment": "Good service"
}
```

Success response:

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "createdAt": "2026-04-21T10:00:00.000Z"
  }
}
```
