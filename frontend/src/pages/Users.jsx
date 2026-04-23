import { useEffect, useState } from 'react';
import { Users as UsersIcon, Plus, Shield, Mail, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Select } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const roleColors = {
  CUSTOMER_STAFF: 'info', NURSE_OFFICER: 'success',
  MANAGER: 'purple', REGIONAL_OFFICE: 'warning', FEDERAL_ADMIN: 'danger',
};

export default function Users() {
  const { user, isFederalAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', role: 'CUSTOMER_STAFF',
    phone: '', centerId: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      // Use auth/me endpoint pattern — list users via a users endpoint if available
      // Fallback: show placeholder since no GET /users endpoint is defined in backend
      setUsers([]);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/v1/auth/create-user', {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone || undefined,
        centerId: form.centerId || undefined,
      });
      toast.success('User created successfully');
      setCreateOpen(false);
      setForm({ fullName:'', email:'', password:'', role:'CUSTOMER_STAFF', phone:'', centerId:'' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const allowedRoles = isFederalAdmin()
    ? ['CUSTOMER_STAFF','NURSE_OFFICER','MANAGER','REGIONAL_OFFICE','FEDERAL_ADMIN']
    : ['CUSTOMER_STAFF','NURSE_OFFICER'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">User Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">Create and manage platform users</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Create User
        </Button>
      </div>

      {/* Create user card */}
      <Card>
        <CardBody>
          <div className="flex flex-col items-center py-8 text-slate-400">
            <UsersIcon size={48} className="mb-3 opacity-40" />
            <p className="text-lg font-semibold text-slate-600">Create New Users</p>
            <p className="text-sm mt-1 text-center max-w-sm">
              Use the "Create User" button to add nurses, officers, managers, or other staff to the platform.
            </p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> Create User
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Role permissions info */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Shield size={16} className="text-teal-600" /> Role Permissions
          </h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {[
              { role: 'CUSTOMER_STAFF', label: 'Customer / Staff', desc: 'View own records, book appointments, submit feedback', color: 'info' },
              { role: 'NURSE_OFFICER', label: 'Nurse / Officer', desc: 'Record vitals, create wellness plans, manage appointments', color: 'success' },
              { role: 'MANAGER', label: 'Manager', desc: 'Full center oversight, view all feedback, create staff accounts', color: 'purple' },
              { role: 'REGIONAL_OFFICE', label: 'Regional Office', desc: 'View regional analytics and aggregated reports', color: 'warning' },
              { role: 'FEDERAL_ADMIN', label: 'Federal Administrator', desc: 'System-wide access, manage centers, all analytics', color: 'danger' },
            ].map(r => (
              <div key={r.role} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Badge variant={r.color}>{r.label}</Badge>
                <p className="text-sm text-slate-600">{r.desc}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New User">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Full Name *" required value={form.fullName} onChange={set('fullName')} placeholder="Abebe Kebede" />
          <Input label="Email *" required type="email" value={form.email} onChange={set('email')} placeholder="user@mesob.local" />
          <Input label="Password *" required type="password" value={form.password} onChange={set('password')} placeholder="Min 8 chars, uppercase, number" />
          <Select label="Role *" required value={form.role} onChange={set('role')}>
            {allowedRoles.map(r => (
              <option key={r} value={r}>{r.replace('_',' ')}</option>
            ))}
          </Select>
          <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+251..." />
          <Input label="Center ID" value={form.centerId} onChange={set('centerId')} placeholder="UUID of center (required for MANAGER)" />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={submitting}>Create User</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
