import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout/Layout';
import { 
  Users, 
  UserCheck, 
  Shield, 
  TrendingUp, 
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  UserX
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      window.location.href = '/login';
      return;
    }

    fetchStats(token);
  }, []);

  useEffect(() => {
    if (stats?.recentActivity?.recentUsers) {
      const filtered = stats.recentActivity.recentUsers.filter(emp =>
        emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [stats, searchTerm]);

  const fetchStats = async (token) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004/api';
      const response = await fetch(`${apiUrl}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        console.error('Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, icon: Icon, trend, trendValue, color = "blue", description }) => {
    const colorClasses = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
      green: { bg: 'bg-green-100', text: 'text-green-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600' }
    };
    
    const colors = colorClasses[color] || colorClasses.blue;
    
    return (
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${colors.bg} mr-3`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{title}</p>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
              </div>
              {description && (
                <p className="text-xs text-gray-500 mt-2">{description}</p>
              )}
            </div>
            {trend && (
              <div className="flex items-center">
                {trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {trendValue}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const EmployeeTable = ({ employees }) => {
    const getStatusBadge = (status) => {
      const badges = {
        active: 'badge-success',
        inactive: 'badge-warning', 
        suspended: 'badge-danger'
      };
      return badges[status] || 'badge-info';
    };

    const getRoleBadge = (role) => {
      return role === 'admin' ? 'badge-info' : 'badge bg-gray-100 text-gray-800';
    };

    const formatLastLogin = (date) => {
      if (!date) return 'Never';
      const now = new Date();
      const loginDate = new Date(date);
      const diffTime = Math.abs(now - loginDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Today';
      if (diffDays === 2) return 'Yesterday';
      if (diffDays <= 7) return `${diffDays - 1} days ago`;
      return loginDate.toLocaleDateString();
    };

    if (!employees || employees.length === 0) {
      return (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-500">Get started by adding your first team member.</p>
        </div>
      );
    }

    return (
      <div className="overflow-hidden">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Employee</th>
              <th className="table-header-cell">Role</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Last Login</th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {employees.map((employee, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="table-cell">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-gray-600">
                        {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{employee.email}</div>
                    </div>
                  </div>
                </td>
                <td className="table-cell">
                  <span className={`badge ${getRoleBadge(employee.role)}`}>
                    {employee.role}
                  </span>
                </td>
                <td className="table-cell">
                  <span className={`badge ${getStatusBadge(employee.status)}`}>
                    {employee.status}
                  </span>
                </td>
                <td className="table-cell text-gray-500">
                  {formatLastLogin(employee.lastLogin)}
                </td>
                <td className="table-cell">
                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const SystemAlerts = () => (
    <div className="space-y-3">
      <div className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-yellow-800">Pending Security Review</h4>
          <p className="text-sm text-yellow-700">3 employees require security clearance updates</p>
        </div>
      </div>
      
      <div className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-blue-800">System Backup Complete</h4>
          <p className="text-sm text-blue-700">Daily backup completed successfully at 2:00 AM</p>
        </div>
      </div>
      
      <div className="flex items-start p-3 bg-green-50 border border-green-200 rounded-lg">
        <Activity className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-green-800">Performance Update</h4>
          <p className="text-sm text-green-700">System performance improved by 15% this week</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout title="Dashboard" subtitle="Company Internal Management System">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card">
                <div className="card-body">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-body">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard" subtitle="Company Internal Management System" onSearch={setSearchTerm} searchTerm={searchTerm}>
      <div className="space-y-6">
        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Employees"
            value={stats?.overview?.totalUsers || 0}
            icon={Users}
            trend="up"
            trendValue="12"
            color="blue"
            description="All registered employees"
          />
          
          <MetricCard
            title="Active Employees"
            value={stats?.overview?.activeUsers || 0}
            icon={UserCheck}
            trend="up"
            trendValue="8"
            color="green"
            description="Currently active staff"
          />
          
          <MetricCard
            title="Administrators"
            value={stats?.overview?.adminUsers || 0}
            icon={Shield}
            color="purple"
            description="System administrators"
          />
          
          <MetricCard
            title="New This Month"
            value={stats?.overview?.currentMonthUsers || 0}
            icon={TrendingUp}
            trend="up"
            trendValue="25"
            color="orange"
            description="Recently onboarded"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee Management Table */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Employee Directory</h3>
                    <p className="text-sm text-gray-500">Manage your team members and their access</p>
                  </div>
                  <button 
                    onClick={() => router.push('/employees')}
                    className="btn-primary"
                  >
                    Add Employee
                  </button>
                </div>
              </div>
              <div className="card-body p-0">
                <EmployeeTable employees={filteredEmployees} />
              </div>
            </div>
          </div>

          {/* System Alerts */}
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">System Alerts</h3>
                <p className="text-sm text-gray-500">Important notifications and updates</p>
              </div>
              <div className="card-body">
                <SystemAlerts />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="card-body space-y-3">
                <button 
                  onClick={() => router.push('/employees')}
                  className="w-full btn-secondary justify-start"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </button>
                <button 
                  onClick={() => router.push('/settings')}
                  className="w-full btn-secondary justify-start"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Security Settings
                </button>
                <button 
                  onClick={() => router.push('/reports')}
                  className="w-full btn-secondary justify-start"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  View Reports
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
