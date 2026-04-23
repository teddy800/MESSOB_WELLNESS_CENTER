import { useEffect, useState } from 'react';
import { BarChart3, Users, Activity, TrendingUp, Building2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { centersService } from '../services/centersService';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];

export default function Analytics() {
  const { user, isFederalAdmin, isRegionalOrAbove, isManagerOrAbove } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regionInput, setRegionInput] = useState('');

  const load = async (regionOverride) => {
    setLoading(true);
    try {
      let res;
      if (isFederalAdmin()) {
        // Federal admin: all analytics
        res = await centersService.getAllAnalytics();
      } else if (isRegionalOrAbove()) {
        // Regional office: needs a region name
        const region = regionOverride || regionInput;
        if (!region) { setLoading(false); return; }
        res = await centersService.getRegionalAnalytics(region);
      } else if (user?.centerId) {
        // Manager / Nurse: center-level analytics for their assigned center
        res = await centersService.getAnalytics(user.centerId);
      }
      if (res) setData(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  // ── Normalize response shapes ──────────────────────────────────────────────
  // getAllAnalytics  → { totalCenters, totalRegions, regions:[...], summary:{totalStaff, totalAppointments, totalVitals,...} }
  // getRegionalAnalytics → { region, totalCenters, centers:[...], summary:{...} }
  // getCenterAnalytics   → { centerId, totalStaff, totalAppointments, completedAppointments, pendingAppointments, totalVitals, averageFeedback }

  const summary = data?.summary || data || {};
  const centers = data?.centers || data?.regions || [];
  const isCenterLevel = !!(data?.centerId);

  const summaryStats = isCenterLevel
    ? {
        staff: data.totalStaff,
        vitals: data.totalVitals,
        appointments: data.totalAppointments,
        feedback: data.averageFeedback?.toFixed(1),
      }
    : {
        staff: summary.totalStaff,
        vitals: summary.totalVitals,
        appointments: summary.totalAppointments,
        centers: data?.totalCenters,
      };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  // Regional office with no region selected yet
  if (!data && isRegionalOrAbove() && !isFederalAdmin()) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Analytics Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">Enter your region to view analytics</p>
        </div>
        <Card>
          <CardBody>
            <div className="flex gap-3 max-w-sm">
              <Input
                placeholder="e.g. Addis Ababa"
                value={regionInput}
                onChange={e => setRegionInput(e.target.value)}
                label="Region Name"
              />
              <div className="flex items-end">
                <Button onClick={() => load(regionInput)} disabled={!regionInput}>
                  Load
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <BarChart3 size={48} className="mb-3 opacity-40" />
        <p className="text-lg font-semibold text-slate-600">No analytics data available</p>
        <p className="text-sm mt-1">
          {!user?.centerId && !isFederalAdmin() && !isRegionalOrAbove()
            ? 'You are not assigned to a center yet'
            : 'No data found'}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => load()}>
          <RefreshCw size={15} /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Analytics Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isFederalAdmin() ? 'National overview' :
             isRegionalOrAbove() ? `Region: ${data.region || regionInput}` :
             'Center-level analytics'}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => load()}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Staff" color="teal"
          value={summaryStats.staff ?? '—'} />
        <StatCard icon={Activity} label="Vitals Recorded" color="red"
          value={summaryStats.vitals ?? '—'} />
        <StatCard icon={TrendingUp} label="Appointments" color="purple"
          value={summaryStats.appointments ?? '—'} />
        {isCenterLevel
          ? <StatCard icon={BarChart3} label="Avg Feedback" color="amber"
              value={summaryStats.feedback ?? '—'} sub="out of 5" />
          : <StatCard icon={Building2} label="Centers" color="blue"
              value={summaryStats.centers ?? centers.length ?? '—'} />
        }
      </div>

      {/* Center-level detail */}
      {isCenterLevel && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardBody className="text-center py-6">
              <p className="text-3xl font-bold text-emerald-600">{data.completedAppointments ?? '—'}</p>
              <p className="text-sm text-slate-500 mt-1">Completed Appointments</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-6">
              <p className="text-3xl font-bold text-amber-500">{data.pendingAppointments ?? '—'}</p>
              <p className="text-sm text-slate-500 mt-1">Pending Appointments</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Centers / Regions table */}
      {centers.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-bold text-slate-800">
              {isFederalAdmin() ? 'Regional Breakdown' : 'Centers Breakdown'}
            </h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {isFederalAdmin()
                      ? ['Region', 'Centers', 'Staff', 'Appointments', 'Vitals'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                        ))
                      : ['Center ID', 'Staff', 'Appointments', 'Completed', 'Vitals', 'Avg Feedback'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                        ))
                    }
                  </tr>
                </thead>
                <tbody>
                  {centers.map((c, i) => (
                    <tr key={c.region || c.centerId || i} className="border-b border-slate-50 hover:bg-slate-50">
                      {isFederalAdmin() ? (
                        <>
                          <td className="px-4 py-3 font-semibold text-slate-800">{c.region}</td>
                          <td className="px-4 py-3 text-slate-600">{c.totalCenters ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{c.summary?.totalStaff ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{c.summary?.totalAppointments ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{c.summary?.totalVitals ?? '—'}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.centerId?.slice(0, 8)}…</td>
                          <td className="px-4 py-3 text-slate-600">{c.totalStaff ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{c.totalAppointments ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{c.completedAppointments ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{c.totalVitals ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{c.averageFeedback?.toFixed(1) ?? '—'}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
