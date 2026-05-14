/**
 * Patient Conditions Service
 * 
 * Manages CRUD operations for patient health conditions
 */

import prisma from '../config/prisma';
import { Prisma } from '../generated/prisma';

/**
 * Get all patient conditions (for analytics)
 * Returns all condition records from wellness plans with dates
 */
export async function getAllPatientConditions() {
  const wellnessPlans = await prisma.wellnessPlan.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      userId: true,
      conditions: true,
      createdAt: true,
    },
  });

  // Flatten the conditions array into individual records
  const flattenedRecords: Array<{
    id: string;
    patientId: string;
    condition: string;
    createdAt: Date;
  }> = [];

  wellnessPlans.forEach(plan => {
    const conditions = plan.conditions as string[] | null;
    
    // If no conditions or empty array, this is a "normal" patient
    if (!conditions || (Array.isArray(conditions) && conditions.length === 0)) {
      flattenedRecords.push({
        id: plan.id,
        patientId: plan.userId,
        condition: 'normal',
        createdAt: plan.createdAt,
      });
    } else if (Array.isArray(conditions)) {
      // Add each condition as a separate record
      conditions.forEach((condition: any) => {
        flattenedRecords.push({
          id: plan.id,
          patientId: plan.userId,
          condition: typeof condition === 'string' ? condition : String(condition),
          createdAt: plan.createdAt,
        });
      });
    }
  });

  return flattenedRecords;
}

/**
 * Upsert patient conditions (create or update)
 * 
 * @param patientId - Patient user ID
 * @param conditions - Array of condition strings
 * @param isNurseApproved - Whether conditions are nurse-approved
 * @param approvedBy - Nurse user ID (required if isNurseApproved is true)
 * @param transactionClient - Optional Prisma transaction client
 * @returns Created or updated patient condition record
 */
export async function upsertPatientConditions(
  patientId: string,
  conditions: string[],
  isNurseApproved: boolean,
  approvedBy?: string,
  transactionClient?: Prisma.TransactionClient
) {
  const client = transactionClient || prisma;

  const data: any = {
    conditions: conditions,
    calculatedAt: new Date(),
    isNurseApproved,
    updatedAt: new Date(),
  };

  if (isNurseApproved) {
    data.approvedAt = new Date();
    data.approvedBy = approvedBy || null;
  } else {
    // Reset approval fields when conditions are recalculated
    data.approvedAt = null;
    data.approvedBy = null;
  }

  return await client.patientCondition.upsert({
    where: { patientId },
    update: data,
    create: {
      patientId,
      ...data,
    },
  });
}

/**
 * Get patient conditions by patient ID
 * 
 * @param patientId - Patient user ID
 * @returns Patient condition record or null
 */
export async function getPatientConditions(patientId: string) {
  return await prisma.patientCondition.findUnique({
    where: { patientId },
    include: {
      patient: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      approver: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });
}

/**
 * Get all nurse-approved conditions
 * 
 * @returns Array of nurse-approved patient condition records
 */
export async function getAllNurseApprovedConditions() {
  return await prisma.patientCondition.findMany({
    where: { isNurseApproved: true },
    include: {
      patient: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      approver: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: {
      approvedAt: 'desc',
    },
  });
}

/**
 * Get health condition trends over time
 * Returns time-series data for line chart visualization with deltas and comparisons
 * OPTIMIZED: Single database query instead of multiple queries in a loop
 */
export async function getConditionTrends(period: string) {
  try {
    const now = new Date();
    let dataPoints: { date: Date; label: string; isHighlighted?: boolean }[] = [];
    let startDate: Date;

    if (period === 'daily') {
      // Last 7 days with today highlighted
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        date.setHours(0, 0, 0, 0);
        dataPoints.push({
          date,
          label: i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          isHighlighted: i === 0
        });
      }
    } else if (period === 'weekly') {
      // Last 8 weeks with this week highlighted
      startDate = new Date(now);
      startDate.setDate(now.getDate() - (7 * 7));
      startDate.setHours(0, 0, 0, 0);
      
      for (let i = 7; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - (i * 7));
        date.setHours(0, 0, 0, 0);
        const weekStart = new Date(date);
        const weekEnd = new Date(date);
        weekEnd.setDate(weekStart.getDate() + 6);
        dataPoints.push({
          date,
          label: i === 0 ? 'This week' : `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          isHighlighted: i === 0
        });
      }
    } else if (period === 'monthly') {
      // All 12 months up to now
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 11);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(now.getMonth() - i);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        dataPoints.push({
          date,
          label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          isHighlighted: i === 0
        });
      }
    } else if (period === 'all') {
      // Get first wellness plan date
      const firstPlan = await prisma.wellnessPlan.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true }
      });

      if (!firstPlan) {
        console.log('No wellness plans found - returning empty data');
        return { 
          labels: [], 
          datasets: {
            hypertension: [],
            overweight: [],
            obesity: [],
            diabetes: [],
            heart_respiratory: [],
            normal: [],
            other: [],
          }, 
          deltas: null, 
          monthlyComparison: null, 
          highlightedIndex: -1 
        };
      }

      const firstDate = new Date(firstPlan.createdAt);
      startDate = new Date(firstDate);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      
      const monthsDiff = Math.ceil((now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const numPoints = Math.min(monthsDiff, 12);

      for (let i = numPoints - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(now.getMonth() - i);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        dataPoints.push({
          date,
          label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          isHighlighted: false
        });
      }
    } else {
      return { 
        labels: [], 
        datasets: {
          hypertension: [],
          overweight: [],
          obesity: [],
          diabetes: [],
          heart_respiratory: [],
          normal: [],
          other: [],
        }, 
        deltas: null, 
        monthlyComparison: null, 
        highlightedIndex: -1 
      };
    }

    // OPTIMIZED: Fetch ALL wellness plans in the entire date range with a single query
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    const allPlans = await prisma.wellnessPlan.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        conditions: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`✅ Fetched ${allPlans.length} wellness plans for ${period} trend analysis`);

    // Define all conditions
    const conditions = [
      'hypertension',
      'overweight',
      'obesity',
      'diabetes',
      'heart_issues',
      'respiratory_issues',
      'normal',
      'other'
    ];

    // Initialize datasets
    const datasets: any = {};
    conditions.forEach(condition => {
      datasets[condition] = [];
    });

    const highlightedIndex = dataPoints.findIndex(p => p.isHighlighted);

    // Group plans by time period
    for (let i = 0; i < dataPoints.length; i++) {
      const point = dataPoints[i];
      const nextPoint = dataPoints[i + 1];
      
      const periodStart = point.date;
      let periodEnd: Date;
      
      if (period === 'monthly' && i === dataPoints.length - 1) {
        // Current month: only count up to today
        periodEnd = new Date(now);
        periodEnd.setHours(23, 59, 59, 999);
      } else if (nextPoint) {
        periodEnd = nextPoint.date;
      } else {
        periodEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      }

      // Filter plans for this period
      const periodPlans = allPlans.filter(plan => {
        const planDate = new Date(plan.createdAt);
        return planDate >= periodStart && planDate < periodEnd;
      });

      // Count conditions
      const counts: Record<string, number> = {};
      conditions.forEach(c => counts[c] = 0);

      periodPlans.forEach(plan => {
        const conditionList = plan.conditions as string[] | null;
        
        if (!conditionList || conditionList.length === 0) {
          counts['normal']++;
        } else {
          conditionList.forEach(condition => {
            const key = condition.toLowerCase().replace(/ /g, '_');
            if (key === 'heart_issues' || key === 'respiratory_issues') {
              counts[key] = (counts[key] || 0) + 1;
            } else {
              counts[key] = (counts[key] || 0) + 1;
            }
          });
        }
      });

      // For weekly: calculate average daily patients
      if (period === 'weekly') {
        conditions.forEach(condition => {
          datasets[condition].push(Math.round((counts[condition] || 0) / 7));
        });
      } else {
        conditions.forEach(condition => {
          datasets[condition].push(counts[condition] || 0);
        });
      }
    }

    // Calculate monthly comparison (for monthly view only)
    let monthlyComparison: any = null;
    if (period === 'monthly' && dataPoints.length >= 2) {
      const currentMonthIndex = dataPoints.length - 1;
      const previousMonthIndex = dataPoints.length - 2;
      
      monthlyComparison = {
        currentMonth: dataPoints[currentMonthIndex].label,
        previousMonth: dataPoints[previousMonthIndex].label,
        conditions: {}
      };

      conditions.forEach(condition => {
        const current = datasets[condition][currentMonthIndex] || 0;
        const previous = datasets[condition][previousMonthIndex] || 0;
        const change = current - previous;
        const percentChange = previous > 0 ? Math.round((change / previous) * 100) : 0;
        
        monthlyComparison.conditions[condition] = {
          current,
          previous,
          change,
          percentChange,
          trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
        };
      });
    }

    return {
      labels: dataPoints.map(p => p.label),
      highlightedIndex,
      datasets: {
        hypertension: datasets.hypertension,
        overweight: datasets.overweight,
        obesity: datasets.obesity,
        diabetes: datasets.diabetes,
        heart_respiratory: datasets.heart_issues.map((v: number, i: number) => v + datasets.respiratory_issues[i]),
        normal: datasets.normal,
        other: datasets.other,
      },
      deltas: null,
      monthlyComparison,
    };
  } catch (error) {
    console.error('❌ Error in getConditionTrends:', error);
    // Return empty data on error
    return { 
      labels: [], 
      datasets: {
        hypertension: [],
        overweight: [],
        obesity: [],
        diabetes: [],
        heart_respiratory: [],
        normal: [],
        other: [],
      }, 
      deltas: null, 
      monthlyComparison: null, 
      highlightedIndex: -1 
    };
  }
}

/**
 * Get all nurse-approved conditions within a date range (or all time if dates are null)
 * Now queries wellness plans directly to include ALL patients with wellness plans in the period
 */
export async function getConditionsByDateRange(
  startDate: Date | null,
  endDate: Date | null
) {
  try {
    console.log('📊 getConditionsByDateRange called with:', { startDate, endDate });
    
    // Build where clause conditionally
    const whereClause: any = {};
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }
    // If no dates, fetch all wellness plans (all time)

    console.log('📊 Where clause:', JSON.stringify(whereClause, null, 2));

    // Get all wellness plans created in the date range (or all time)
    const wellnessPlans = await prisma.wellnessPlan.findMany({
      where: whereClause,
      select: {
        userId: true,
        conditions: true,
      },
    });

    console.log(`📊 Found ${wellnessPlans.length} wellness plans`);

    // Return conditions from wellness plans (each plan represents one patient)
    return wellnessPlans.map(plan => ({
      conditions: plan.conditions as string[],
    }));
  } catch (error) {
    console.error('❌ Error in getConditionsByDateRange:', error);
    throw error;
  }
}
