# Mesob Wellness

## Project Overview

Mesob Wellness is a government-grade digital wellness platform with a Node.js/Express backend, React/Vite frontend, and MySQL database.

Primary modules:

- Authentication and user access control
- Health records and patient profile data
- Vitals capture and historical tracking
- Appointment lifecycle management
- Wellness plan assignment and follow-up
- Feedback and reporting

Reference API contract is maintained in docs/api.md.

## Test Credentials

The following test users are available for development and testing:

| Email | Password | Role |
|-------|----------|------|
| customer@mesob.et | Customer123! | CUSTOMER_STAFF |
| nurse@mesob.et | Nurse123! | NURSE_OFFICER |
| manager@mesob.et | Manager123! | MANAGER |
| regional@mesob.et | Regional123! | REGIONAL_OFFICE |
| admin@mesob.et | Admin123! | FEDERAL_ADMIN |

To seed these users, run:
```bash
cd backend
npx ts-node src/scripts/seed-users.ts
```

## Day 2 Plan

### Objectives

- Move from skeleton implementation to controlled module-level delivery
- Implement core authenticated API flows with consistent response contracts
- Enforce project standards for security, traceability, and operational readiness

### Workstream 1: Platform Control Baseline

- Finalize environment configuration policy for backend and frontend
- Standardize API error handling, status codes, and response envelope
- Establish request validation rules for all create/update endpoints

### Workstream 2: Backend Service Delivery

- Complete Auth module:
	- register
	- login
	- role-aware token claims
- Complete Users module:
	- get current user profile
	- update current user profile
- Deliver Vitals module:
	- create vitals record
	- list vitals history by user
- Deliver Appointments module:
	- create appointment
	- list appointments
	- update appointment status

### Workstream 3: Data Layer and Integrity

- Execute schema and seed scripts in controlled order
- Validate foreign key relationships and required indexes
- Add migration-ready SQL structure for non-breaking future updates

### Workstream 4: Frontend Integration

- Complete login view integration with backend auth endpoints
- Connect dashboard to authenticated user profile endpoint
- Add vitals and appointments baseline screens for API integration testing
- Enforce shared API client configuration and error display behavior

### Workstream 5: Quality, Security, and Compliance

- Backend smoke tests for health, auth, and one data module flow
- Frontend build and route integrity verification
- Input validation and password handling review
- Minimal audit-ready checklist for release decision

## Day 2 Expected Deliverables

- Auth, Users, Vitals, and Appointments core endpoints operational
- Frontend login and dashboard integration completed
- Database integrity checks completed
- Standard response and error model applied across delivered endpoints
- Updated technical documentation reflecting implemented contracts
