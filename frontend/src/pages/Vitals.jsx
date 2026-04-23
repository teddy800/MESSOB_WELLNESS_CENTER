import { useEffect, useState } from 'react';
import { Activity, Plus, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { vitalsService } from '../services/vitalsService';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Textarea } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const bpVariant = {
  NORMAL: 'success', ELEVATED: 'warning',
  HYPERTENSION_STAGE_1: 'warning', HYPERTENSION_STAGE_2: 'danger', HYPERTENSIVE_CRISIS: 'danger',
};
const bmiVariant = {
  UNDERWEIGHT: 'warning', NORMAL: 'success', OVERWEIGHT: 'warning', OBESITY: 'danger',
};

export default function Vitals() {
  const { user, isNurseOrAbove } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState('bmi'); // 'bmi' | 'bp'
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    weightKg: '', heightCm: '', systolic: '', diastolic: '',
    heartRate: '', temperature: '', oxygenSaturation: '', notes: '', userId: '',
  });

  const canRecord = isNurseOrAbove();

  const load = async () => {
    setLoading(true);
    try {
      const res = await vitalsService.getHistory(user.id, 30);
      setRecords(res.data.data.records || []);
    } catch {
      toast.error('Failed to load vitals history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user?.id) load(); }, [user?.id]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const patientId = form.userId || user.id;
      if (tab === 'bmi') {
        if (!form.weightKg || !form.heightCm) { toast.error('Weight and height are required'); return; }
        await vitalsService.postBmi({
          weightKg: parseFloat(form.weightKg),
          heightCm: parseFloat(form.heightCm),
          userId: patientId,
          notes: form.notes || undefined,
        });
      } else {
        if (!form.systolic || !form.diastolic) { toast.error('Systolic and diastolic are required'); return; }
        await vitalsService.postBloodPressure({
          systolic: parseInt(form.systolic),
          diastolic: parseInt(form.diastolic),
          userId: patientId,
          notes: form.notes || undefined,
        });
      }
      toast.success('Vitals recorded successfully');
      setModalOpen(false);
      setForm({ weightKg:'', heightCm:'', systolic:'', diastolic:'', heartRate:'', temperature:'', oxygenSaturation:'', notes:'', userId:'' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record vitals');
    } finally {
      setSubmitting(false);
    }
  };

  // Chart data
  const chartData = [...records].reverse().map(r => ({
    date: format(new Date(r.recordedAt), 'MMM d'),
    BMI: r.bmi ? parseFloat(r.bmi.toFixed(1)) : null,
    Systolic: r.systolic || null,
    Diastolic: r.diastolic || null,
    HeartRate: r.heartRate || null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Vitals & Health Screening</h2>
          <p className="text-sm text-slate-500 mt-0.5">Track your health metrics over time</p>
        </div>
        {canRecord && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Record Vitals
          </Button>
        )}
      </div>

      {/* Charts */}
      {records.length > 1 && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp size={16} className="text-teal-600" /> BMI Trend
              </h3>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={['auto','auto']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="BMI" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Activity size={16} className="text-red-500" /> Blood Pressure Trend
              </h3>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={['auto','auto']} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Systolic" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Diastolic" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Records Table */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-slate-800">Vitals History</h3>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />)}
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-slate-400">
              <Activity size={36} className="mb-2 opacity-40" />
              <p className="text-sm">No vitals recorded yet</p>
              {canRecord && <p className="text-xs mt-1">Click "Record Vitals" to get started</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Date','BMI','BP','Heart Rate','Temp','O₂ Sat','Risk'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {format(new Date(r.recordedAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        {r.bmi ? (
                          <div>
                            <span className="font-semibold text-slate-800">{r.bmi.toFixed(1)}</span>
                            {r.bmiCategory && <Badge variant={bmiVariant[r.bmiCategory]} className="ml-1">{r.bmiCategory.replace('_',' ')}</Badge>}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {r.systolic ? (
                          <span className="font-semibold text-slate-800">{r.systolic}/{r.diastolic}</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{r.heartRate ? `${r.heartRate} bpm` : '—'}</td>
                      <td className="px-4 py-3 text-slate-700">{r.temperature ? `${r.temperature}°C` : '—'}</td>
                      <td className="px-4 py-3 text-slate-700">{r.oxygenSaturation ? `${r.oxygenSaturation}%` : '—'}</td>
                      <td className="px-4 py-3">
                        {r.bpCategory ? (
                          <Badge variant={bpVariant[r.bpCategory]}>{r.bpCategory.replace(/_/g,' ')}</Badge>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Record Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Vitals" size="md">
        <div className="flex gap-2 mb-5">
          {['bmi','bp'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors
                ${tab === t ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {t === 'bmi' ? 'BMI / Body' : 'Blood Pressure'}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {canRecord && (
            <Input label="Patient User ID (leave blank for self)" value={form.userId}
              onChange={set('userId')} placeholder="UUID of patient" />
          )}
          {tab === 'bmi' ? (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Weight (kg) *" type="number" step="0.1" value={form.weightKg} onChange={set('weightKg')} placeholder="72.5" />
              <Input label="Height (cm) *" type="number" step="0.1" value={form.heightCm} onChange={set('heightCm')} placeholder="175" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Systolic (mmHg) *" type="number" value={form.systolic} onChange={set('systolic')} placeholder="120" />
              <Input label="Diastolic (mmHg) *" type="number" value={form.diastolic} onChange={set('diastolic')} placeholder="80" />
            </div>
          )}
          <Textarea label="Notes (optional)" value={form.notes} onChange={set('notes')} rows={3} placeholder="Any additional observations..." />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={submitting}>Save Record</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
