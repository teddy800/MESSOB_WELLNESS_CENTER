import { prisma } from "../config/prisma";
import { AppointmentStatus } from "../generated/prisma";

export interface CapacityInfo {
  dailyLimit: number;
  slotsUsed: number;
  slotsRemaining: number;
  date: string;
}

export interface BookingStats {
  totalAppointments: number;
  onlineBookings: number;
  walkInBookings: number;
  noShowRate: number;
  averageServiceTime: number;
  date: string;
}

export interface QueueAnalytics {
  currentQueueSize: number;
  averageWaitTime: number;
  peakHours: Array<{ hour: number; count: number }>;
  efficiencyMetrics: {
    completionRate: number;
    onTimeRate: number;
  };
}

export interface HealthAnalytics {
  totalPatients: number;
  highRiskCount: number;
  averageBP: { systolic: number; diastolic: number };
  averageGlucose: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface StaffPerformance {
  id: string;
  fullName: string;
  role: string;
  vitalsRecorded: number;
  averageServiceTime: number;
  appointmentsHandled: number;
  performanceScore: number;
}

// System Settings
export async function getSystemSettings() {
  // For now, return default settings. In production, this would come from a settings table
  return {
    dailySlotLimit: 100,
    appointmentIntervalMinutes: 30,
    walkInEnabled: true,
    autoConfirmBookings: false,
  };
}

export async function updateSystemSettings(settings: {
  dailySlotLimit?: number;
  appointmentIntervalMinutes?: number;
  walkInEnabled?: boolean;
  autoConfirmBookings?: boolean;
}) {
  // In production, this would update a settings table
  // For now, we'll just return the updated settings
  const currentSettings = await getSystemSettings();
  return { ...currentSettings, ...settings };
}

// Capacity Management
export async function getCapacityInfo(date?: string): Promise<CapacityInfo> {
  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const appointmentsToday = await prisma.appointment.count({
    where: {
      scheduledAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        not: AppointmentStatus.CANCELLED,
      },
    },
  });

  const settings = await getSystemSettings();
  const dailyLimit = settings.dailySlotLimit;

  return {
    dailyLimit,
    slotsUsed: appointmentsToday,
    slotsRemaining: Math.max(0, dailyLimit - appointmentsToday),
    date: targetDate.toISOString().split('T')[0],
  };
}

// Booking Statistics
export async function getBookingStats(date?: string): Promise<BookingStats> {
  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const [totalAppointments, completedAppointments, noShowAppointments] = await Promise.all([
    prisma.appointment.count({
      where: {
        scheduledAt: { gte: startOfDay, lte: endOfDay },
      },
    }),
    prisma.appointment.count({
      where: {
        scheduledAt: { gte: startOfDay, lte: endOfDay },
        status: AppointmentStatus.COMPLETED,
      },
    }),
    prisma.appointment.count({
      where: {
        scheduledAt: { gte: startOfDay, lte: endOfDay },
        status: AppointmentStatus.NO_SHOW,
      },
    }),
  ]);

  // Calculate average service time from completed appointments
  const completedWithTimes = await prisma.appointment.findMany({
    where: {
      scheduledAt: { gte: startOfDay, lte: endOfDay },
      status: AppointmentStatus.COMPLETED,
      startedAt: { not: null },
      completedAt: { not: null },
    },
    select: {
      startedAt: true,
      completedAt: true,
    },
  });

  const averageServiceTime = completedWithTimes.length > 0
    ? completedWithTimes.reduce((sum, apt) => {
        const duration = new Date(apt.completedAt!).getTime() - new Date(apt.startedAt!).getTime();
        return sum + duration;
      }, 0) / completedWithTimes.length / (1000 * 60) // Convert to minutes
    : 0;

  const noShowRate = totalAppointments > 0 ? (noShowAppointments / totalAppointments) * 100 : 0;

  return {
    totalAppointments,
    onlineBookings: totalAppointments, // Assuming all are online for now
    walkInBookings: 0, // Would need to track this separately
    noShowRate: Math.round(noShowRate * 100) / 100,
    averageServiceTime: Math.round(averageServiceTime),
    date: targetDate.toISOString().split('T')[0],
  };
}

// Queue Analytics
export async function getQueueAnalytics(): Promise<QueueAnalytics> {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  // Current queue (confirmed appointments for today)
  const currentQueue = await prisma.appointment.count({
    where: {
      scheduledAt: { gte: startOfDay, lte: endOfDay },
      status: {
        in: [AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS],
      },
    },
  });

  // Peak hours analysis (last 7 days)
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const appointmentsByHour = await prisma.appointment.findMany({
    where: {
      scheduledAt: { gte: sevenDaysAgo, lte: endOfDay },
    },
    select: {
      scheduledAt: true,
    },
  });

  const hourCounts: { [hour: number]: number } = {};
  appointmentsByHour.forEach(apt => {
    const hour = new Date(apt.scheduledAt).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const peakHours = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Efficiency metrics
  const totalScheduled = await prisma.appointment.count({
    where: {
      scheduledAt: { gte: startOfDay, lte: endOfDay },
      status: { not: AppointmentStatus.CANCELLED },
    },
  });

  const completed = await prisma.appointment.count({
    where: {
      scheduledAt: { gte: startOfDay, lte: endOfDay },
      status: AppointmentStatus.COMPLETED,
    },
  });

  const onTime = await prisma.appointment.count({
    where: {
      scheduledAt: { gte: startOfDay, lte: endOfDay },
      status: AppointmentStatus.COMPLETED,
      startedAt: { not: null },
    },
  });

  return {
    currentQueueSize: currentQueue,
    averageWaitTime: 15, // Would need to calculate from actual wait times
    peakHours,
    efficiencyMetrics: {
      completionRate: totalScheduled > 0 ? Math.round((completed / totalScheduled) * 100) : 0,
      onTimeRate: completed > 0 ? Math.round((onTime / completed) * 100) : 0,
    },
  };
}

// Health Analytics
export async function getHealthAnalytics(): Promise<HealthAnalytics> {
  const totalPatients = await prisma.user.count({
    where: { role: 'CUSTOMER_STAFF' },
  });

  // Get latest vitals for risk assessment
  const latestVitals = await prisma.vitalRecord.findMany({
    where: {
      user: { role: 'CUSTOMER_STAFF' },
    },
    orderBy: { recordedAt: 'desc' },
    distinct: ['userId'],
    take: totalPatients,
  });

  let highRiskCount = 0;
  let systolicSum = 0;
  let diastolicSum = 0;
  let bpCount = 0;
  let riskDistribution = { low: 0, medium: 0, high: 0 };

  latestVitals.forEach(vital => {
    // Count BP readings
    if (vital.systolic && vital.diastolic) {
      systolicSum += vital.systolic;
      diastolicSum += vital.diastolic;
      bpCount++;
    }

    // Risk assessment based on BP and BMI categories
    const isHighRisk = 
      vital.bpCategory === 'HYPERTENSION_STAGE_2' ||
      vital.bpCategory === 'HYPERTENSIVE_CRISIS' ||
      vital.bmiCategory === 'OBESITY';

    const isMediumRisk = 
      vital.bpCategory === 'HYPERTENSION_STAGE_1' ||
      vital.bpCategory === 'ELEVATED' ||
      vital.bmiCategory === 'OVERWEIGHT';

    if (isHighRisk) {
      highRiskCount++;
      riskDistribution.high++;
    } else if (isMediumRisk) {
      riskDistribution.medium++;
    } else {
      riskDistribution.low++;
    }
  });

  return {
    totalPatients,
    highRiskCount,
    averageBP: {
      systolic: bpCount > 0 ? Math.round(systolicSum / bpCount) : 0,
      diastolic: bpCount > 0 ? Math.round(diastolicSum / bpCount) : 0,
    },
    averageGlucose: 0, // Would need glucose tracking
    riskDistribution,
  };
}

// Staff Performance
export async function getStaffPerformance(): Promise<StaffPerformance[]> {
  const staff = await prisma.user.findMany({
    where: {
      role: { in: ['NURSE_OFFICER', 'MANAGER'] },
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      role: true,
    },
  });

  const performanceData = await Promise.all(
    staff.map(async (member) => {
      const vitalsRecorded = await prisma.vitalRecord.count({
        where: { recordedBy: member.id },
      });

      // For appointments handled, we'd need to track which staff member handled each appointment
      const appointmentsHandled = 0; // Placeholder

      // Calculate performance score based on vitals recorded
      const performanceScore = Math.min(100, vitalsRecorded * 2);

      return {
        id: member.id,
        fullName: member.fullName,
        role: member.role,
        vitalsRecorded,
        averageServiceTime: 25, // Placeholder
        appointmentsHandled,
        performanceScore,
      };
    })
  );

  return performanceData.sort((a, b) => b.performanceScore - a.performanceScore);
}

// Audit Trail
export async function getAuditTrail(limit: number = 50) {
  // This would typically come from a dedicated audit log table
  // For now, we'll use vital records as a proxy for health record access
  const auditEntries = await prisma.vitalRecord.findMany({
    take: limit,
    orderBy: { recordedAt: 'desc' },
    include: {
      user: {
        select: { fullName: true, email: true },
      },
      recorder: {
        select: { fullName: true, role: true },
      },
    },
  });

  return auditEntries.map(entry => ({
    id: entry.id,
    action: 'VITALS_RECORDED',
    resourceType: 'VITAL_RECORD',
    resourceId: entry.id,
    userId: entry.userId,
    userName: entry.user.fullName,
    userEmail: entry.user.email,
    performedBy: entry.recordedBy,
    performedByName: entry.recorder.fullName,
    performedByRole: entry.recorder.role,
    timestamp: entry.recordedAt,
    details: `Recorded vitals for ${entry.user.fullName}`,
  }));
}