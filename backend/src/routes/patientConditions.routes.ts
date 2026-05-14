/**
 * Patient Conditions Routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as PatientConditionsController from '../controllers/patientConditions.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/conditions/all/list - Get all patient conditions (for analytics)
router.get('/all/list', PatientConditionsController.getAllPatientConditions);

// GET /api/v1/conditions/trends - Get condition trends for line chart
router.get('/trends', PatientConditionsController.getConditionTrends);

// GET /api/v1/conditions/period - Get aggregated conditions by date range
router.get('/period', PatientConditionsController.getConditionsByPeriod);

// GET /api/v1/conditions/:patientId - Get conditions for a patient
router.get('/:patientId', PatientConditionsController.getPatientConditions);

// PUT /api/v1/conditions/:patientId - Update conditions (nurse approval)
router.put('/:patientId', PatientConditionsController.updatePatientConditions);

export default router;
