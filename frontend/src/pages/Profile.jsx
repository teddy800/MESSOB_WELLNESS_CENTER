import { useState } from 'react';
import { User, Mail, Phone, Calendar, Shield, Edit2, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Select } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const roleColors = {
  CUSTOMER_STAFF:  'info',
  NURSE_OFFICER:   'success',
  MANAGER:         'purple',
  REGIONAL_OFFICE: 'warning',
  FEDERAL_ADMIN:   'danger',
};

const roleLabels = {
  CUSTOMER_STAFF:  'Customer / Staff',
  NURSE_OFFICER:   'Nurse / Officer',
  MANAGER:         'Manager',
  REGIONAL_OFFICE: 'Regional Office',
  FEDERAL_ADMIN:   'Federal Administrator',
};

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const initForm = () => ({
    name: user?.fullName || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
    emergencyContactName: user?.emergencyContactName || '',
    emergencyContactPhone: user?.emergencyContactPhone || '',
  });

  const [form, setForm] = useState(initForm);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/v1/users/me', {
        name: form.name,
        phone: form.phone || undefined,
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        emergencyContactName: form.emergencyContactName || undefined,
        emergencyContactPhone: form.emergencyContactPhone || undefined,
      });
      await refreshUser();
      setForm(initForm());
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(initForm());
    setEditing(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Profile</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage your personal information</p>
        </div>
        {!editing ? (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Edit2 size={15} /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              <Save size={15} /> Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Avatar + role */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {user?.fullName?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">{user?.fullName}</h3>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={roleColors[user?.role] || 'neutral'}>
                  <Shield size={11} /> {roleLabels[user?.role] || user?.role}
                </Badge>
                {user?.isVerified && <Badge variant="success">Verified</Badge>}
                {user?.isActive === false && <Badge variant="danger">Inactive</Badge>}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <User size={16} className="text-teal-600" /> Personal Information
          </h3>
        </CardHeader>
        <CardBody className="space-y-4">
          {editing ? (
            <>
              <Input label="Full Name" value={form.name} onChange={set('name')} />
              <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+251..." />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Gender" value={form.gender} onChange={set('gender')}>
                  <option value="">Not specified</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </Select>
                <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <InfoRow icon={User}     label="Full Name"     value={user?.fullName} />
              <InfoRow icon={Mail}     label="Email"         value={user?.email} />
              <InfoRow icon={Phone}    label="Phone"         value={user?.phone} />
              <InfoRow icon={Calendar} label="Date of Birth"
                value={user?.dateOfBirth ? format(new Date(user.dateOfBirth), 'MMMM d, yyyy') : null} />
              <InfoRow label="Gender"       value={user?.gender?.replace(/_/g, ' ')} />
              <InfoRow label="Member Since"
                value={user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : null} />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-slate-800">Emergency Contact</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          {editing ? (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Contact Name"  value={form.emergencyContactName}  onChange={set('emergencyContactName')}  placeholder="Full name" />
              <Input label="Contact Phone" value={form.emergencyContactPhone} onChange={set('emergencyContactPhone')} placeholder="+251..." />
            </div>
          ) : (
            <div className="space-y-3">
              <InfoRow label="Name"  value={user?.emergencyContactName} />
              <InfoRow label="Phone" value={user?.emergencyContactPhone} />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-slate-800">Account Details</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            <InfoRow label="User ID"        value={user?.id}    mono />
            <InfoRow label="Role"           value={roleLabels[user?.role]} />
            <InfoRow label="Center ID"      value={user?.centerId} mono />
            <InfoRow label="Account Status" value={user?.isActive ? 'Active' : 'Inactive'} />
            <InfoRow label="Last Login"
              value={user?.lastLoginAt ? format(new Date(user.lastLoginAt), 'MMM d, yyyy · h:mm a') : null} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className="text-slate-400" />}
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <span className={`text-sm font-semibold text-slate-800 max-w-xs text-right truncate ${mono ? 'font-mono text-xs' : ''}`}>
        {value || <span className="text-slate-300 font-normal italic text-xs">Not set</span>}
      </span>
    </div>
  );
}
