import { useEffect, useState } from 'react';
import { 
  Settings, 
  Users, 
  BarChart3, 
  Clock, 
  Heart, 
  Shield, 
  FileText, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity,
  Calendar,
  UserPlus,
  Download,
  Filter,
  Search,
  Sliders
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analyticsService';
import { userManagementService } from '../services/userManagementService';
import StatCard from '../components/ui/StatCard';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { format } from 'date-fns';

const statusVariant = {
  PENDING: 'warning', CONFIRMED: 'info', IN_PROGRESS: 'info',
  COMPLETED: 'success', CANCELLED: 'danger', NO_SHOW: 'neutral',
};

const roleColors = {
  PATIENT: 'bg-blue-100 text-blue-800',
  NURSE_OFFICER: 'bg-green-100 text-green-800',
  MANAGER: 'bg-purple-100 text-purple-800',
  REGIONAL_OFFICE: 'bg-orange-100 text-orange-800',
  FEDERAL_ADMIN: 'bg-red-100 text-red-800',
};

export default function ManagerDashboard() {
  const { user, isManagerOrAbove } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Dashboard data
  const [capacityInfo, setCapacityInfo] = useState(null);
  const [bookingStats, setBookingStats] = useState(null);
  const [queueAnalytics, setQueueAnalytics] = useState(null);
  const [healthAnalytics, setHealthAnalytics] = useState(null);
  const [staffPerformance, setStaffPerformance] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [systemSettings, setSystemSettings] = useState(null);
  
  // User management
  const [users, setUsers] = useState([]);
  const [userFilters, setUserFilters] = useState({});
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'NURSE_OFFICER',
    phone: '',
  });

  // Check access
  if (!isManagerOrAbove()) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">Manager role required to access this dashboard.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [capacity, booking, queue, health, staff, audit, settings] = await Promise.allSettled([
        analyticsService.getCapacityInfo(),
        analyticsService.getBookingStats(),
        analyticsService.getQueueAnalytics(),
        analyticsService.getHealthAnalytics(),
        analyticsService.getStaffPerformance(),
        analyticsService.getAuditTrail(20),
        analyticsService.getSystemSettings(),
      ]);

      if (capacity.status === 'fulfilled') setCapacityInfo(capacity.value.data);
      if (booking.status === 'fulfilled') setBookingStats(booking.value.data);
      if (queue.status === 'fulfilled') setQueueAnalytics(queue.value.data);
      if (health.status === 'fulfilled') setHealthAnalytics(health.value.data);
      if (staff.status === 'fulfilled') setStaffPerformance(staff.value.data);
      if (audit.status === 'fulfilled') setAuditTrail(audit.value.data);
      if (settings.status === 'fulfilled') setSystemSettings(settings.value.data);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userManagementService.getAllUsers(userFilters);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await userManagementService.createUser(newUser);
      setShowCreateUserModal(false);
      setNewUser({ email: '', password: '', fullName: '', role: 'NURSE_OFFICER', phone: '' });
      loadUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleUpdateUserStatus = async (userId, isActive) => {
    try {
      await userManagementService.updateUserStatus(userId, isActive);
      loadUsers();
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  const handleUpdateSettings = async (newSettings) => {
    try {
      const response = await analyticsService.updateSystemSettings(newSettings);
      setSystemSettings(response.data);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'capacity', label: 'Capacity', icon: Sliders },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'audit', label: 'Audit Trail', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-purple-200 text-sm font-medium">Manager Dashboard</p>
            <h2 className="text-2xl font-bold mt-0.5">System Control Center</h2>
            <p className="text-purple-200 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <BarChart3 size={28} className="text-white" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'users') loadUsers();
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab 
          loading={loading}
          capacityInfo={capacityInfo}
          bookingStats={bookingStats}
          queueAnalytics={queueAnalytics}
          healthAnalytics={healthAnalytics}
          staffPerformance={staffPerformance}
        />
      )}

      {activeTab === 'capacity' && (
        <CapacityTab 
          loading={loading}
          capacityInfo={capacityInfo}
          systemSettings={systemSettings}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsTab 
          loading={loading}
          queueAnalytics={queueAnalytics}
          healthAnalytics={healthAnalytics}
          bookingStats={bookingStats}
        />
      )}

      {activeTab === 'users' && (
        <UsersTab 
          users={users}
          userFilters={userFilters}
          setUserFilters={setUserFilters}
          onLoadUsers={loadUsers}
          onCreateUser={() => setShowCreateUserModal(true)}
          onUpdateUserStatus={handleUpdateUserStatus}
        />
      )}

      {activeTab === 'audit' && (
        <AuditTab auditTrail={auditTrail} loading={loading} />
      )}

      {activeTab === 'settings' && (
        <SettingsTab 
          systemSettings={systemSettings}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {/* Create User Modal */}
      <Modal 
        isOpen={showCreateUserModal} 
        onClose={() => setShowCreateUserModal(false)}
        title="Create New User"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Full Name"
            value={newUser.fullName}
            onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
            required
          />
          <Input
            label="Email"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
            required
          />
          <Input
            label="Password"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="NURSE_OFFICER">Nurse Officer</option>
              <option value="MANAGER">Manager</option>
            </select>
          </div>
          <Input
            label="Phone (Optional)"
            value={newUser.phone}
            onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
          />
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">Create User</Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowCreateUserModal(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ loading, capacityInfo, bookingStats, queueAnalytics, healthAnalytics, staffPerformance }) {
  if (loading) {
    return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />)}
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Calendar} 
          label="Daily Capacity" 
          color="blue"
          value={capacityInfo?.slotsUsed || 0}
          sub={`of ${capacityInfo?.dailyLimit || 100} slots`} 
        />
        <StatCard 
          icon={Clock} 
          label="Queue Size" 
          color="orange"
          value={queueAnalytics?.currentQueueSize || 0}
          sub={`${queueAnalytics?.averageWaitTime || 0}min avg wait`} 
        />
        <StatCard 
          icon={Heart} 
          label="High Risk Patients" 
          color="red"
          value={healthAnalytics?.highRiskCount || 0}
          sub={`of ${healthAnalytics?.totalPatients || 0} total`} 
        />
        <StatCard 
          icon={Users} 
          label="Staff Performance" 
          color="green"
          value={staffPerformance?.length || 0}
          sub="active staff members" 
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 size={17} className="text-blue-600" /> Today's Statistics
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Appointments</span>
                <span className="font-semibold">{bookingStats?.totalAppointments || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">No-Show Rate</span>
                <span className="font-semibold">{bookingStats?.noShowRate || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Service Time</span>
                <span className="font-semibold">{bookingStats?.averageServiceTime || 0} min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completion Rate</span>
                <span className="font-semibold">{queueAnalytics?.efficiencyMetrics?.completionRate || 0}%</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Heart size={17} className="text-red-600" /> Health Overview
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average BP</span>
                <span className="font-semibold">
                  {healthAnalytics?.averageBP?.systolic || 0}/{healthAnalytics?.averageBP?.diastolic || 0}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Low Risk</span>
                  <span>{healthAnalytics?.riskDistribution?.low || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Medium Risk</span>
                  <span>{healthAnalytics?.riskDistribution?.medium || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>High Risk</span>
                  <span>{healthAnalytics?.riskDistribution?.high || 0}</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

// Additional tab components would be implemented here...
// For brevity, I'll create placeholder components

function CapacityTab({ loading, capacityInfo, systemSettings, onUpdateSettings }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="font-bold text-slate-800">Capacity Management</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{capacityInfo?.dailyLimit || 100}</div>
                <div className="text-sm text-gray-600">Daily Limit</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{capacityInfo?.slotsUsed || 0}</div>
                <div className="text-sm text-gray-600">Slots Used</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{capacityInfo?.slotsRemaining || 0}</div>
                <div className="text-sm text-gray-600">Remaining</div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function AnalyticsTab({ loading, queueAnalytics, healthAnalytics, bookingStats }) {
  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-bold text-slate-800">Queue Analytics</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Current Queue</span>
                <span className="font-semibold">{queueAnalytics?.currentQueueSize || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Wait</span>
                <span className="font-semibold">{queueAnalytics?.averageWaitTime || 0} min</span>
              </div>
              <div className="flex justify-between">
                <span>Completion Rate</span>
                <span className="font-semibold">{queueAnalytics?.efficiencyMetrics?.completionRate || 0}%</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-bold text-slate-800">Risk Distribution</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Low Risk</span>
                <Badge variant="success">{healthAnalytics?.riskDistribution?.low || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Medium Risk</span>
                <Badge variant="warning">{healthAnalytics?.riskDistribution?.medium || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>High Risk</span>
                <Badge variant="danger">{healthAnalytics?.riskDistribution?.high || 0}</Badge>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function UsersTab({ users, userFilters, setUserFilters, onLoadUsers, onCreateUser, onUpdateUserStatus }) {
  useEffect(() => {
    onLoadUsers();
  }, [userFilters]);

  return (
    <div className="space-y-6">
      {/* User Management Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">User Management</h3>
        <Button onClick={onCreateUser} className="flex items-center gap-2">
          <UserPlus size={16} />
          Create User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search users..."
          value={userFilters.search || ''}
          onChange={(e) => setUserFilters({...userFilters, search: e.target.value})}
          className="max-w-xs"
        />
        <select
          value={userFilters.role || ''}
          onChange={(e) => setUserFilters({...userFilters, role: e.target.value})}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">All Roles</option>
          <option value="PATIENT">Patient</option>
          <option value="NURSE_OFFICER">Nurse Officer</option>
          <option value="MANAGER">Manager</option>
        </select>
      </div>

      {/* Users Table */}
      <Card>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Last Login</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="py-3 px-4 font-medium">{user.fullName}</td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={user.isActive ? 'success' : 'danger'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {user.lastLoginAt ? format(new Date(user.lastLoginAt), 'MMM d, yyyy') : 'Never'}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant={user.isActive ? 'outline' : 'primary'}
                        onClick={() => onUpdateUserStatus(user.id, !user.isActive)}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function AuditTab({ auditTrail, loading }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Shield size={17} className="text-purple-600" /> Audit Trail
          </h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {auditTrail.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Activity size={14} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{entry.details}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      By {entry.performedByName} • {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function SettingsTab({ systemSettings, onUpdateSettings }) {
  const [settings, setSettings] = useState(systemSettings || {});

  useEffect(() => {
    if (systemSettings) {
      setSettings(systemSettings);
    }
  }, [systemSettings]);

  const handleSave = () => {
    onUpdateSettings(settings);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="font-bold text-slate-800">System Settings</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daily Slot Limit
              </label>
              <Input
                type="number"
                value={settings.dailySlotLimit || 100}
                onChange={(e) => setSettings({...settings, dailySlotLimit: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appointment Interval (minutes)
              </label>
              <Input
                type="number"
                value={settings.appointmentIntervalMinutes || 30}
                onChange={(e) => setSettings({...settings, appointmentIntervalMinutes: parseInt(e.target.value)})}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="walkInEnabled"
                checked={settings.walkInEnabled || false}
                onChange={(e) => setSettings({...settings, walkInEnabled: e.target.checked})}
              />
              <label htmlFor="walkInEnabled" className="text-sm font-medium text-gray-700">
                Enable Walk-in Registration
              </label>
            </div>
            <Button onClick={handleSave}>Save Settings</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}