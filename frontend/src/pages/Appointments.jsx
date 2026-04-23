import { useEffect, useState } from 'react';
import { Calendar, Plus, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { appointmentsService } from '../services/appointmentsService';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Textarea, Select } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const statusVariant = {
  PENDING: 'warning', CONFIRMED: 'info', IN_PROGRESS: 'info',
  COMPLETED: 'success', CANCELLED: 'danger', NO_SHOW: 'neutral',
};

const statusIcon = {
  PENDING: Clock, CONFIRMED: CheckCircle, IN_PROGRESS: Clock,
  COMPLETED: CheckCircle, CANCELLED: XCircle, NO_SHOW: XCircle,
};

export default function Appointments() {
  const { user, isNurseOrAbove } = useAuth();
  const nurseOrAbove = isNurseOrAbove();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [createForm, setCreateForm] = useState({ patientId: '', scheduledAt: '', reason: '' });
  const [updateForm, setUpdateForm] = useState({ status: '', notes: '', diagnosis: '', prescription: '', cancellationReason: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = nurseOrAbove ? {} : { userId: user.id };
      const res = await appointmentsService.getAll(params);
      setAppointments(res.data.data.appointments || []);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user?.id) load(); }, [user?.id]);

  const setC = (k) => (e) => setCreateForm(f => ({ ...f, [k]: e.target.value }));
  const setU = (k) => (e) => setUpdateForm(f => ({ ...f, [k]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const patientId = createForm.patientId || user.id;
      await appointmentsService.create({
        patientId,
        scheduledAt: new Date(createForm.scheduledAt).toISOString(),
        reason: createForm.reason,
      });
      toast.success('Appointment booked successfully');
      setCreateOpen(false);
      setCreateForm({ patientId: '', scheduledAt: '', reason: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await appointmentsService.update(selected.id, {
        status: updateForm.status,
        notes: updateForm.notes || undefined,
        diagnosis: updateForm.diagnosis || undefined,
        prescription: updateForm.prescription || undefined,
        cancellationReason: updateForm.cancellationReason || undefined,
      });
      toast.success('Appointment updated');
      setUpdateOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const openUpdate = (appt) => {
    setSelected(appt);
    setUpdateForm({ status: appt.status, notes: appt.notes || '', diagnosis: appt.diagnosis || '', prescription: appt.prescription || '', cancellationReason: '' });
    setUpdateOpen(true);
  };

  const filtered = filter === 'ALL' ? appointments : appointments.filter(a => a.status === filter);

  const counts = appointments.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Appointments</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage and track health appointments</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Book Appointment
        </Button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[['ALL', 'All', 'neutral'], ['PENDING','Pending','warning'], ['CONFIRMED','Confirmed','info'],
          ['IN_PROGRESS','In Progress','info'], ['COMPLETED','Completed','success'], ['CANCELLED','Cancelled','danger']
        ].map(([val, label, variant]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`p-3 rounded-xl border text-center transition-all ${filter === val ? 'border-teal-400 bg-teal-50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
            <p className="text-lg font-bold text-slate-800">{val === 'ALL' ? appointments.length : (counts[val] || 0)}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800">
              {filter === 'ALL' ? 'All Appointments' : `${filter.replace('_',' ')} Appointments`}
            </h3>
            <span className="text-sm text-slate-400">{filtered.length} records</span>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-slate-400">
              <Calendar size={36} className="mb-2 opacity-40" />
              <p className="text-sm">No appointments found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map(appt => {
                const Icon = statusIcon[appt.status] || Clock;
                return (
                  <div key={appt.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                      ${appt.status === 'COMPLETED' ? 'bg-emerald-100' : appt.status === 'CANCELLED' ? 'bg-red-100' : 'bg-blue-100'}`}>
                      <Icon size={18} className={
                        appt.status === 'COMPLETED' ? 'text-emerald-600' :
                        appt.status === 'CANCELLED' ? 'text-red-500' : 'text-blue-600'
                      } />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate">{appt.reason}</p>
                        <Badge variant={statusVariant[appt.status]}>{appt.status.replace('_',' ')}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(new Date(appt.scheduledAt), 'EEEE, MMMM d, yyyy · h:mm a')}
                      </p>
                      {appt.diagnosis && (
                        <p className="text-xs text-slate-600 mt-1 bg-slate-50 rounded px-2 py-1">
                          <span className="font-medium">Diagnosis:</span> {appt.diagnosis}
                        </p>
                      )}
                    </div>
                    {nurseOrAbove && !['COMPLETED','CANCELLED'].includes(appt.status) && (
                      <Button size="sm" variant="secondary" onClick={() => openUpdate(appt)}>Update</Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Book Appointment">
        <form onSubmit={handleCreate} className="space-y-4">
          {isNurseOrAbove() && (
            <Input label="Patient ID (leave blank for self)" value={createForm.patientId}
              onChange={setC('patientId')} placeholder="Patient UUID" />
          )}
          <Input label="Date & Time *" type="datetime-local" required
            value={createForm.scheduledAt} onChange={setC('scheduledAt')} />
          <Textarea label="Reason *" required rows={3}
            value={createForm.reason} onChange={setC('reason')} placeholder="Describe the reason for this appointment..." />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={submitting}>Book Appointment</Button>
          </div>
        </form>
      </Modal>

      {/* Update Modal */}
      <Modal open={updateOpen} onClose={() => setUpdateOpen(false)} title="Update Appointment">
        <form onSubmit={handleUpdate} className="space-y-4">
          <Select label="Status *" required value={updateForm.status} onChange={setU('status')}>
            {['PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW'].map(s => (
              <option key={s} value={s}>{s.replace('_',' ')}</option>
            ))}
          </Select>
          <Textarea label="Notes" rows={2} value={updateForm.notes} onChange={setU('notes')} placeholder="Clinical notes..." />
          {updateForm.status === 'COMPLETED' && (
            <>
              <Textarea label="Diagnosis" rows={2} value={updateForm.diagnosis} onChange={setU('diagnosis')} placeholder="Diagnosis details..." />
              <Textarea label="Prescription" rows={2} value={updateForm.prescription} onChange={setU('prescription')} placeholder="Prescribed medications..." />
            </>
          )}
          {updateForm.status === 'CANCELLED' && (
            <Textarea label="Cancellation Reason" rows={2} value={updateForm.cancellationReason} onChange={setU('cancellationReason')} placeholder="Reason for cancellation..." />
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setUpdateOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={submitting}>Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
