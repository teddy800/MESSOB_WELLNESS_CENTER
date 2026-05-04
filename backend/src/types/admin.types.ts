import type { UserRole, AppointmentStatus, CenterStatus, BmiCategory, BloodPressureCategory } from "@prisma/client";

// ============ FILTER TYPES ============

export interface UserFilters {
  role?: UserRole;
  region?: string;
  center?: string;
  status?: 'active' | 'inactive';
  verification?: 'verified' | 'unverified';
  search?: string;
  page?: number;
  limit?: number;
}

export interface CenterFilters {
  region?: string;
  status?: CenterStatus;
  city?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AppointmentFilters {
  region?: string;
  center?: string;
  status?: AppointmentStatus;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export interface VitalFilters {
  region?: string;
  center?: string;
  dateFrom?: Date;
  dateTo?: Date;
  bmiCategory?: BmiCategory;
  bpCategory?: BloodPressureCategory;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FeedbackFilters {
  region?: string;
  center?: string;
  npsScore?: number;
  dateFrom?: Date;
  dateTo?: Date;
  feedbackType?: string;
  page?: number;
  limit?: number;
}

export interface AuditFilters {
  region?: string;
  center?: string;
  user?: string;
  action?: string;
  resource?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

// ============ RESPONSE TYPES ============

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  verified: number;
  unverified: number;
  byRole: Record<UserRole, number>;
  byRegion: Record<string, number>;
}

export interface CenterStats {
  total: number;
  active: number;
  inactive: number;
  maintenance: number;
  byRegion: Record<string, number>;
}

export interface AppointmentStats {
  total: number;
  waiting: number;
  inProgress: number;
  inService: number;
  completed: number;
  cancelled: number;
  noShow: number;
  byRegion: Record<string, number>;
  byStatus: Record<AppointmentStatus, number>;
}

export interface VitalStats {
  total: number;
  averageBMI: number;
  averageSystolic: number;
  averageDiastolic: number;
  averageHeartRate: number;
  averageTemperature: number;
  averageOxygenSaturation: number;
  byBmiCategory: Record<BmiCategory, number>;
  byBpCategory: Record<BloodPressureCategory, number>;
}

export interface FeedbackStats {
  total: number;
  averageNPS: number;
  averageServiceQuality: number;
  averageStaffBehavior: number;
  averageCleanliness: number;
  averageWaitTime: number;
  npsDistribution: Record<number, number>;
  byRegion: Record<string, number>;
}

export interface DashboardMetrics {
  users: UserStats;
  centers: CenterStats;
  appointments: AppointmentStats;
  vitals: VitalStats;
  feedback: FeedbackStats;
  lastUpdated: Date;
}

export interface RegionDistribution {
  region: string;
  count: number;
  percentage: number;
}

export interface RoleDistribution {
  role: UserRole;
  count: number;
  percentage: number;
}

export interface StatusDistribution {
  status: AppointmentStatus;
  count: number;
  percentage: number;
}

export interface RegionCenterMap {
  region: string;
  centers: number;
  active: number;
  inactive: number;
}

export interface RegionAppointmentMap {
  region: string;
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export interface RegionNPS {
  region: string;
  nps: number;
  feedbackCount: number;
}

// ============ AUDIT LOG TYPES ============

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  resource: string | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
  user?: {
    id: string;
    fullName: string;
    email: string | null;
  };
}
