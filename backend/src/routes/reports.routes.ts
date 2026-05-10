import { Router } from 'express';
import { generateCombinedReport } from '../controllers/reports.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../generated/prisma';

const router = Router();

/**
 * POST /api/v1/reports/combined/:patientId
 * Generate combined health report PDF
 * All staff roles can download reports
 */
router.post(
  '/combined/:patientId',
  authenticate,
  authorize(
    UserRole.NURSE_OFFICER,
    UserRole.MANAGER,
    UserRole.REGIONAL_OFFICE,
    UserRole.FEDERAL_OFFICE,
    UserRole.SYSTEM_ADMIN,
    UserRole.STAFF
  ),
  generateCombinedReport
);

export default router;
