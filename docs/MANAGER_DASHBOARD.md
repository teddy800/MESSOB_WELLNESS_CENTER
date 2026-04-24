# Manager Dashboard Documentation

## Overview

The Manager Dashboard is a comprehensive system control center designed for MANAGER role and above, providing advanced analytics, user management, and system administration capabilities.

## Access Requirements

- **Roles**: MANAGER, REGIONAL_OFFICE, FEDERAL_ADMIN
- **Route**: `/manager`
- **Authentication**: JWT token required

## Features

### 1. 📊 Overview Tab

**Real-time System Metrics**
- Daily capacity utilization
- Current queue size and wait times
- High-risk patient count
- Active staff performance

**Key Statistics**
- Total appointments today
- No-show rates
- Average service time
- Completion rates
- Health risk distribution

### 2. 🎛️ Capacity Management Tab

**Capacity Control**
- View current daily slot limit
- Monitor slots used vs remaining
- Real-time capacity tracking
- Historical capacity data

**Visual Indicators**
- Capacity utilization charts
- Color-coded status indicators
- Progress bars for slot usage

### 3. 📈 Analytics Tab

**Queue Analytics**
- Current queue size
- Average wait times
- Peak hours analysis
- Efficiency metrics
- Real-time queue monitoring

**Health Analytics**
- Risk distribution visualization
- Average vital signs across center
- Health KPIs and trends
- Department-wise health metrics

### 4. 👥 Users Management Tab

**User Administration**
- View all users with filtering
- Search by name or email
- Filter by role and status
- User activity monitoring

**User Creation**
- Create new nurse accounts
- Create new manager accounts
- Assign users to centers
- Set initial user permissions

**User Status Management**
- Activate/deactivate users
- View last login times
- Monitor user activity

### 5. 🔒 Audit Trail Tab

**Compliance Logging**
- Secure log of all health record access
- Track who accessed what data
- Timestamp all access events
- Compliance with Proclamation 1321/2024

**Audit Features**
- Detailed access logs
- User action tracking
- Export capabilities
- Security compliance

### 6. ⚙️ Settings Tab

**System Configuration**
- Daily slot limit adjustment
- Appointment interval settings
- Walk-in registration toggle
- Auto-confirmation settings

**Settings Management**
- Real-time settings updates
- Configuration validation
- Settings history tracking

## API Endpoints

### Analytics Endpoints

```bash
# System Settings
GET    /api/v1/analytics/settings
PUT    /api/v1/analytics/settings

# Capacity Management
GET    /api/v1/analytics/capacity

# Statistics
GET    /api/v1/analytics/appointments/stats
GET    /api/v1/analytics/queue/analytics
GET    /api/v1/analytics/health/analytics
GET    /api/v1/analytics/staff/performance

# Audit Trail
GET    /api/v1/analytics/audit-trail

# Reports
POST   /api/v1/analytics/reports/generate
GET    /api/v1/analytics/reports/monthly/:year/:month
GET    /api/v1/analytics/reports/quarterly/:year/:quarter
```

### User Management Endpoints

```bash
# User Management
GET    /api/v1/users                    # Get all users
POST   /api/v1/users                    # Create new user
PUT    /api/v1/users/:userId/status     # Update user status
```

## Usage Examples

### 1. Get System Analytics

```javascript
// Frontend usage
import { analyticsService } from '../services/analyticsService';

const loadAnalytics = async () => {
  const capacity = await analyticsService.getCapacityInfo();
  const stats = await analyticsService.getBookingStats();
  const queue = await analyticsService.getQueueAnalytics();
  const health = await analyticsService.getHealthAnalytics();
};
```

### 2. Create New User

```javascript
// Frontend usage
import { userManagementService } from '../services/userManagementService';

const createNurse = async () => {
  const userData = {
    email: 'new.nurse@mesob.et',
    password: 'SecurePass123!',
    fullName: 'New Nurse Officer',
    role: 'NURSE_OFFICER',
    phone: '+251911234567'
  };
  
  const newUser = await userManagementService.createUser(userData);
};
```

### 3. Update System Settings

```javascript
// Frontend usage
const updateSettings = async () => {
  const newSettings = {
    dailySlotLimit: 120,
    appointmentIntervalMinutes: 30,
    walkInEnabled: true
  };
  
  const updated = await analyticsService.updateSystemSettings(newSettings);
};
```

### 4. Generate Reports

```javascript
// Frontend usage
const generateReport = async () => {
  const report = await analyticsService.generateReport(
    '2024-01-01',
    '2024-12-31',
    'custom'
  );
  
  // Or generate monthly report
  const monthlyReport = await analyticsService.generateMonthlyReport(2024, 12);
};
```

## Data Models

### Capacity Information
```typescript
interface CapacityInfo {
  dailyLimit: number;
  slotsUsed: number;
  slotsRemaining: number;
  date: string;
}
```

### Booking Statistics
```typescript
interface BookingStats {
  totalAppointments: number;
  onlineBookings: number;
  walkInBookings: number;
  noShowRate: number;
  averageServiceTime: number;
  date: string;
}
```

### Health Analytics
```typescript
interface HealthAnalytics {
  totalPatients: number;
  highRiskCount: number;
  averageBP: { systolic: number; diastolic: number };
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
}
```

### Staff Performance
```typescript
interface StaffPerformance {
  id: string;
  fullName: string;
  role: string;
  vitalsRecorded: number;
  averageServiceTime: number;
  appointmentsHandled: number;
  performanceScore: number;
}
```

## Security & Permissions

### Role-Based Access Control

| Feature | Manager | Regional Office | Federal Admin |
|---------|---------|-----------------|---------------|
| View Analytics | Own Center | Region | All Centers |
| User Management | Create Nurses | Create Nurses | Create All Roles |
| System Settings | Own Center | Region | Global |
| Audit Trail | Own Center | Region | All Centers |
| Reports | Own Center | Region | All Centers |

### Authentication Requirements

- Valid JWT token required for all endpoints
- Token must contain user role information
- Role validation performed on each request
- Session timeout: 1 hour

### Data Security

- All sensitive data encrypted in transit
- Audit logs for all data access
- Compliance with Proclamation 1321/2024
- Role-based data filtering

## Testing

### Manual Testing

1. **Login as Manager**
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"manager@mesob.et","password":"Manager123!"}'
   ```

2. **Test Analytics Endpoint**
   ```bash
   curl -X GET http://localhost:5000/api/v1/analytics/capacity \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Test User Creation**
   ```bash
   curl -X POST http://localhost:5000/api/v1/users \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"email":"test@mesob.et","password":"Test123!","fullName":"Test User","role":"NURSE_OFFICER"}'
   ```

### Automated Testing

Run the comprehensive test suite:
```bash
cd docs
bash test-manager-dashboard.sh
```

## Troubleshooting

### Common Issues

1. **403 Forbidden Error**
   - Check user role (must be MANAGER+)
   - Verify JWT token is valid
   - Ensure token includes role information

2. **Analytics Data Not Loading**
   - Check database connection
   - Verify appointments and vitals data exists
   - Check service logs for errors

3. **User Creation Fails**
   - Verify email is unique
   - Check password meets requirements
   - Ensure role is valid

### Debug Mode

Enable debug logging in backend:
```env
NODE_ENV=development
LOG_LEVEL=debug
```

## Performance Considerations

### Database Optimization

- Analytics queries use efficient indexes
- Pagination implemented for large datasets
- Caching for frequently accessed data

### Frontend Optimization

- Lazy loading for dashboard tabs
- Efficient state management
- Optimized re-renders

### API Rate Limiting

- Rate limiting implemented for user creation
- Bulk operations optimized
- Connection pooling for database

## Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Rate limiting configured
- [ ] Monitoring setup
- [ ] Backup procedures in place

### Environment Variables

```env
# Required for Manager Dashboard
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_key
NODE_ENV=production
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check application logs
4. Contact system administrator

## Changelog

### Version 1.0.0 (Current)
- Initial Manager Dashboard implementation
- Complete analytics suite
- User management system
- Audit trail functionality
- Report generation
- System settings management