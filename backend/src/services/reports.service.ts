import { prisma } from "../config/prisma";
import { AppointmentStatus } from "../generated/prisma";

export interface ReportData {
  period: string;
  startDate: string;
  endDate: string;
  summary: {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShowAppointments: number;
    totalPatients: number;
    newPatients: number;
    vitalsRecorded: number;
  };
  appointments: {
    byStatus: Array<{ status: string; count: number }>;
    byDay: Array<{ date: string; count: number }>;
    byHour: Array<{ hour: number; count: number }>;
  };
  health: {
    riskDistribution: { low: number; medium: number; high: number };
    averageVitals: {
      systolic: number;
      diastolic: number;
      heartRate: number;
      temperature: number;
      bmi: number;
    };
  };
  staff: {
    performance: Array<{
      name: string;
      role: string;
      vitalsRecorded: number;
      appointmentsHandled: number;
    }>;
  };
}

export async function generateReport(
  startDate: Date,
  endDate: Date,
  reportType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom' = 'monthly'
): Promise<ReportData> {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // Get appointments data
  const appointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: { gte: start, lte: end },
    },
    include: {
      user: {
        select: { id: true, fullName: true, createdAt: true },
      },
    },
  });

  // Get vitals data
  const vitals = await prisma.vitalRecord.findMany({
    where: {
      recordedAt: { gte: start, lte: end },
    },
    include: {
      user: {
        select: { id: true, fullName: true },
      },
      recorder: {
        select: { id: true, fullName: true, role: true },
      },
    },
  });

  // Calculate summary statistics
  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
  const cancelledAppointments = appointments.filter(a => a.status === AppointmentStatus.CANCELLED).length;
  const noShowAppointments = appointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length;

  const uniquePatients = new Set(appointments.map(a => a.userId));
  const totalPatients = uniquePatients.size;

  // New patients (created during this period)
  const newPatients = appointments.filter(a => 
    new Date(a.user.createdAt) >= start && new Date(a.user.createdAt) <= end
  ).length;

  const vitalsRecorded = vitals.length;

  // Appointments by status
  const statusCounts = Object.values(AppointmentStatus).map(status => ({
    status,
    count: appointments.filter(a => a.status === status).length,
  }));

  // Appointments by day
  const dayMap = new Map<string, number>();
  appointments.forEach(apt => {
    const day = new Date(apt.scheduledAt).toISOString().split('T')[0];
    dayMap.set(day, (dayMap.get(day) || 0) + 1);
  });
  const appointmentsByDay = Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }));

  // Appointments by hour
  const hourMap = new Map<number, number>();
  appointments.forEach(apt => {
    const hour = new Date(apt.scheduledAt).getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  });
  const appointmentsByHour = Array.from(hourMap.entries()).map(([hour, count]) => ({ hour, count }));

  // Health analytics
  let riskDistribution = { low: 0, medium: 0, high: 0 };
  let systolicSum = 0, diastolicSum = 0, heartRateSum = 0, temperatureSum = 0, bmiSum = 0;
  let bpCount = 0, hrCount = 0, tempCount = 0, bmiCount = 0;

  vitals.forEach(vital => {
    // Risk assessment
    const isHighRisk = 
      vital.bpCategory === 'HYPERTENSION_STAGE_2' ||
      vital.bpCategory === 'HYPERTENSIVE_CRISIS' ||
      vital.bmiCategory === 'OBESITY';

    const isMediumRisk = 
      vital.bpCategory === 'HYPERTENSION_STAGE_1' ||
      vital.bpCategory === 'ELEVATED' ||
      vital.bmiCategory === 'OVERWEIGHT';

    if (isHighRisk) {
      riskDistribution.high++;
    } else if (isMediumRisk) {
      riskDistribution.medium++;
    } else {
      riskDistribution.low++;
    }

    // Average calculations
    if (vital.systolic && vital.diastolic) {
      systolicSum += vital.systolic;
      diastolicSum += vital.diastolic;
      bpCount++;
    }
    if (vital.heartRate) {
      heartRateSum += vital.heartRate;
      hrCount++;
    }
    if (vital.temperature) {
      temperatureSum += vital.temperature;
      tempCount++;
    }
    if (vital.bmi) {
      bmiSum += vital.bmi;
      bmiCount++;
    }
  });

  // Staff performance
  const staffMap = new Map<string, { name: string; role: string; vitalsRecorded: number; appointmentsHandled: number }>();
  
  vitals.forEach(vital => {
    const staffId = vital.recordedBy;
    const staffName = vital.recorder.fullName;
    const staffRole = vital.recorder.role;
    
    if (!staffMap.has(staffId)) {
      staffMap.set(staffId, {
        name: staffName,
        role: staffRole,
        vitalsRecorded: 0,
        appointmentsHandled: 0,
      });
    }
    
    staffMap.get(staffId)!.vitalsRecorded++;
  });

  const staffPerformance = Array.from(staffMap.values());

  return {
    period: reportType,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    summary: {
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      totalPatients,
      newPatients,
      vitalsRecorded,
    },
    appointments: {
      byStatus: statusCounts,
      byDay: appointmentsByDay,
      byHour: appointmentsByHour,
    },
    health: {
      riskDistribution,
      averageVitals: {
        systolic: bpCount > 0 ? Math.round(systolicSum / bpCount) : 0,
        diastolic: bpCount > 0 ? Math.round(diastolicSum / bpCount) : 0,
        heartRate: hrCount > 0 ? Math.round(heartRateSum / hrCount) : 0,
        temperature: tempCount > 0 ? Math.round((temperatureSum / tempCount) * 10) / 10 : 0,
        bmi: bmiCount > 0 ? Math.round((bmiSum / bmiCount) * 10) / 10 : 0,
      },
    },
    staff: {
      performance: staffPerformance,
    },
  };
}

export async function generateMonthlyReport(year: number, month: number): Promise<ReportData> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  return generateReport(startDate, endDate, 'monthly');
}

export async function generateQuarterlyReport(year: number, quarter: number): Promise<ReportData> {
  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0);
  return generateReport(startDate, endDate, 'quarterly');
}

export async function generateCustomReport(startDate: string, endDate: string): Promise<ReportData> {
  return generateReport(new Date(startDate), new Date(endDate), 'custom');
}