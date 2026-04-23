import { useEffect, useState } from 'react';
import { Building2, Plus, MapPin, Phone, Mail, Users, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { centersService } from '../services/centersService';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

const statusVariant = { ACTIVE: 'success', INACTIVE: 'neutral', MAINTENANCE: 'warning' };

export default function Centers() {
  const { user, isFederalAdmin } = useAuth();
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', code: '', region: '', city: '', address: '', phone: '', email: '', capacity: '',
  });

  const canManage = isFederalAdmin();

  const load = async () => {
    setLoading(true);
    try {
      const res = await centersService.getAll();
      setCenters(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load centers');
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
      await centersService.create({
        ...form,
        capacity: form.capacity ? parseInt(form.capacity) : undefined,
      });
      toast.success('Center created successfully');
      setCreateOpen(false);
      setForm({ name: '', code: '', region: '', city: '', address: '', phone: '', email: '', capacity: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create center');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await centersService.delete(id);
      toast.success('Center deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete center');
    }
  };

  const filtered = centers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.region.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Wellness Centers</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {canManage ? 'Manage health center locations nationwide' : 'View assigned wellness centers'}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Add Center
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, region, city, code..."
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
        />
      </div>

      {/* Summary */}
      <div className="flex gap-4 text-sm text-slate-500">
        <span><strong className="text-slate-800">{centers.length}</strong> total</span>
        <span><strong className="text-emerald-600">{centers.filter(c => c.status === 'ACTIVE').length}</strong> active</span>
        <span><strong className="text-amber-600">{centers.filter(c => c.status === 'MAINTENANCE').length}</strong> maintenance</span>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-52 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-slate-400">
          <Building2 size={48} className="mb-3 opacity-40" />
          <p className="text-lg font-semibold text-slate-600">
            {search ? 'No centers match your search' : 'No centers found'}
          </p>
          {canManage && !search && <p className="text-sm mt-1">Add the first wellness center</p>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(center => (
            <Card key={center.id}>
              <CardBody>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                    ${center.id === user?.centerId ? 'bg-teal-100' : 'bg-slate-100'}`}>
                    <Building2 size={20} className={center.id === user?.centerId ? 'text-teal-600' : 'text-slate-500'} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {center.id === user?.centerId && (
                      <Badge variant="info">Your Center</Badge>
                    )}
                    <Badge variant={statusVariant[center.status]}>{center.status}</Badge>
                  </div>
                </div>

                <h3 className="font-bold text-slate-800">{center.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{center.code}</p>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin size={12} className="flex-shrink-0" />
                    {center.city}, {center.region}
                  </div>
                  {center.phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone size={12} className="flex-shrink-0" /> {center.phone}
                    </div>
                  )}
                  {center.email && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Mail size={12} className="flex-shrink-0" /> {center.email}
                    </div>
                  )}
                  {center.capacity && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Users size={12} className="flex-shrink-0" /> Capacity: {center.capacity}/day
                    </div>
                  )}
                  {center._count?.staff !== undefined && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Users size={12} className="flex-shrink-0" /> Staff: {center._count.staff}
                    </div>
                  )}
                </div>

                {canManage && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                    <Button size="sm" variant="secondary" className="flex-1">Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(center.id, center.name)}>
                      Delete
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Wellness Center" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Center Name *" required value={form.name} onChange={set('name')} placeholder="Addis Ababa Wellness Center" />
            <Input label="Center Code *" required value={form.code} onChange={set('code')} placeholder="AAW-001" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Region *" required value={form.region} onChange={set('region')} placeholder="Addis Ababa" />
            <Input label="City *" required value={form.city} onChange={set('city')} placeholder="Addis Ababa" />
          </div>
          <Input label="Address *" required value={form.address} onChange={set('address')} placeholder="Full address" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+251..." />
            <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="center@mesob.gov.et" />
          </div>
          <Input label="Daily Capacity" type="number" value={form.capacity} onChange={set('capacity')} placeholder="200" />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={submitting}>Create Center</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
