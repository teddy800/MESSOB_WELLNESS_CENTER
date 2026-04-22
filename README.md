# Mesob Wellness

## Overview

Mesob Wellness is a government-grade digital wellness platform with a Node.js/Express backend, React/Vite frontend, and MySQL database.

Core modules:

- Authentication and user access control
- Health records and patient profile data
- Vitals capture and historical tracking
- Appointment lifecycle management
- Wellness plan assignment and follow-up
- Feedback and reporting

Reference API contract: docs/api.md

## Repository Structure

The repository has been normalized for team sharing with a flat, module-based layout:

```text
Mesob-Wellness/
├─ backend/
│  ├─ src/
│  ├─ prisma/
│  ├─ db/
│  ├─ package.json
│  └─ tsconfig.json
├─ frontend/
│  ├─ src/
│  ├─ public/
│  ├─ index.html
│  └─ package.json
├─ docs/
│  └─ api.md
├─ .gitignore
└─ README.md
```

## Removed from Shared Structure

The following non-essential artifacts were removed to keep the repository clean for collaboration:

- Ad-hoc authentication test shell script
- Internal seed-user TypeScript script
- Duplicate root-level Prisma scaffold and root package files
- Generated build outputs from frontend/backend

## Backend Setup

1. Open a terminal in backend
2. Install dependencies: npm install
3. Start development server: npm run dev
4. Build for production: npm run build

## Frontend Setup

1. Open a terminal in frontend
2. Install dependencies: npm install
3. Start development server: npm run dev
4. Build for production: npm run build

## Notes

- Keep environment values in local .env files only.
- Use backend/prisma as the single Prisma source.
- Use docs/api.md as the shared API reference.

