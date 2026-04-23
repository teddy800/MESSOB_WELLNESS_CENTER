import { useEffect, useState } from 'react';
import { Activity, Calendar, Heart, MessageSquare, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { vitalsService } from '../services/vitalsService';
import { appointmentsService } from '../services/appointmentsService';
import StatCard from '../components/ui/StatCard';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { format } from 'date-fns';

const statusVariant = {
  PENDING: 'warning', CONFIRMED: 'info', IN_PROGRESS: 'info',
  COMPLETED: 'success', CANCELLED: 'danger', NO_SHOW: 'neutral',
};

const bpVariant = {
  NORMAL: 'success', ELEVATED: 'warning',
  HYPERTENSION_STAGE_1: 'warning', HYPERTENSION_STAGE_2: 'danger', HYPERTENSIVE_CRISIS: 'danger',
};

const bmiVariant = {
  UNDERWEIGHT: 'warning', NORMAL: 'success', OVERWEIGHT: 'warning', OBESITY: 'danger',
};

export default function Dashboard() {
  const { user, isNurseOrAbove } = useAuth();
  const [latestVitals, setLatestVitals] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [vitalsRes, apptRes] = await Promise.allSettled([
          vitalsService.getLatest(user.id),
          appointmentsService.getAll({ userId: user.id }),
        ]);
        // 404 means no vitals yet — treat as null, not an error
        if (vitalsRes.status === 'fulfilled') {
          setLatestVitals(vitalsRes.value.data.data);
        }
        if (apptRes.status === 'fulfilled') {
          setAppointments(apptRes.value.data.data.appointments || []);
        }
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) load();
  }, [user?.id]);

  const upcoming = appointments.filter(a => ['PENDING','CONFIRMED'].includes(a.status)).slice(0, 3);
  const hasAbnormal = latestVitals && (
    latestVitals.bpCategory === 'HYPERTENSION_STAGE_2' ||
    latestVitals.bpCategory === 'HYPERTENSIVE_CRISIS' ||
    latestVitals.bmiCategory === 'OBESITY'
  );

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-teal-200 text-sm font-medium">Good {getGreeting()}</p>
            <h2 className="text-2xl font-bold mt-0.5">{user?.fullName}</h2>
            <p className="text-teal-200 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <Heart size={28} className="text-white" />
          </div>
        </div>
        {hasAbnormal && (
          <div className="mt-4 flex items-center gap-2 bg-red-500/30 border border-red-400/40 rounded-xl px-4 py-2.5">
            <AlertTriangle size={16} className="text-red-200 flex-shrink-0" />
            <p className="text-sm text-red-100 font-medium">Abnormal vitals detected — please consult a nurse.</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Last BMI" color="teal"
          value={latestVitals?.bmi ? latestVitals.bmi.toFixed(1) : '—'}
          sub={latestVitals?.bmiCategory?.replace('_', ' ') || 'No data'} />
        <StatCard icon={Heart} label="Blood Pressure" color="red"
          value={latestVitals?.systolic ? `${latestVitals.systolic}/${latestVitals.diastolic}` : '—'}
          sub={latestVitals?.bpCategory?.replace(/_/g, ' ') || 'No data'} />
        <StatCard icon={Calendar} label="Appointments" color="blue"
          value={appointments.length}
          sub={`${upcoming.length} upcoming`} />
        <StatCard icon={TrendingUp} label="Heart Rate" color="purple"
          value={latestVitals?.heartRate ? `${latestVitals.heartRate} bpm` : '—'}
          sub={latestVitals?.recordedAt ? `Recorded ${format(new Date(latestVitals.recordedAt), 'MMM d')}` : 'No data'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Latest Vitals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Activity size={17} className="text-teal-600" /> Latest Vitals
              </h3>
              {latestVitals && (
                <span className="text-xs text-slate-400">
                  {format(new Date(latestVitals.recordedAt), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse" />)}
              </div>
            ) : latestVitals ? (
              <div className="space-y-3">
                <VitalRow label="BMI" value={latestVitals.bmi?.toFixed(1)}
                  badge={latestVitals.bmiCategory} variant={bmiVariant[latestVitals.bmiCategory]} />
                <VitalRow label="Blood Pressure"
                  value={latestVitals.systolic ? `${latestVitals.systolic}/${latestVitals.diastolic} mmHg` : null}
                  badge={latestVitals.bpCategory?.replace(/_/g,' ')} variant={bpVariant[latestVitals.bpCategory]} />
                <VitalRow label="Heart Rate" value={latestVitals.heartRate ? `${latestVitals.heartRate} bpm` : null} />
                <VitalRow label="Temperature" value={latestVitals.temperature ? `${latestVitals.temperature}°C` : null} />
                <VitalRow label="O₂ Saturation" value={latestVitals.oxygenSaturation ? `${latestVitals.oxygenSaturation}%` : null} />
                <VitalRow label="Weight" value={latestVitals.weightKg ? `${latestVitals.weightKg} kg` : null} />
              </div>
            ) : (
              <EmptyState icon={Activity} text="No vitals recorded yet" />
            )}
          </CardBody>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Calendar size={17} className="text-blue-600" /> Upcoming Appointments
            </h3>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="space-y-2">
                {[1,2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />)}
              </div>
            ) : upcoming.length > 0 ? (
              <div className="space-y-3">
                {upcoming.map(appt => (
                  <div key={appt.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Clock size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{appt.reason}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {format(new Date(appt.scheduledAt), 'MMM d, yyyy · h:mm a')}
                      </p>
                    </div>
                    <Badge variant={statusVariant[appt.status]}>{appt.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Calendar} text="No upcoming appointments" />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Health Tips */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle size={17} className="text-emerald-600" /> Wellness Tips
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { title: 'Stay Hydrated', desc: 'Drink at least 8 glasses of water daily to maintain optimal health.', color: 'bg-sky-50 border-sky-100 text-sky-700' },
              { title: 'Regular Exercise', desc: 'Aim for 30 minutes of moderate activity at least 5 days a week.', color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
              { title: 'Monitor BP', desc: 'Check your blood pressure regularly, especially if you have risk factors.', color: 'bg-purple-50 border-purple-100 text-purple-700' },
            ].map(tip => (
              <div key={tip.title} className={`p-4 rounded-xl border ${tip.color}`}>
                <p className="font-semibold text-sm">{tip.title}</p>
                <p className="text-xs mt-1 opacity-80">{tip.desc}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function VitalRow({ label, value, badge, variant }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-800">{value || '—'}</span>
        {badge && <Badge variant={variant || 'neutral'}>{badge.replace(/_/g,' ')}</Badge>}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
      <Icon size={32} className="mb-2 opacity-40" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
