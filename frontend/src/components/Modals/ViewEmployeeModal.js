import { X, Mail, Calendar, Clock, Shield, AlertCircle } from 'lucide-react';

export default function ViewEmployeeModal({ employee, onClose }) {
  if (!employee) return null;

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (role) => {
    return role === 'admin' ? 'badge-admin' : 'badge-user';
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'inactive':
        return 'badge-warning';
      case 'suspended':
        return 'badge-danger';
      default:
        return 'badge-default';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-6 flex items-center justify-between text-white">
          <h2 className="text-xl font-bold">Employee Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar and Name */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-600">
                {employee.firstName?.[0]}{employee.lastName?.[0]}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {employee.firstName} {employee.lastName}
            </h3>
            <p className="text-gray-600 mt-1">{employee.email}</p>
          </div>

          {/* Status and Role */}
          <div className="flex gap-3 justify-center">
            <span className={`badge ${getRoleBadgeColor(employee.role)}`}>
              {employee.role}
            </span>
            <span className={`badge ${getStatusBadgeColor(employee.status)}`}>
              {employee.status}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Details */}
          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600">Email Address</p>
                <p className="font-medium text-gray-900">{employee.email}</p>
              </div>
            </div>

            {/* Created Date */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-medium text-gray-900">{formatDate(employee.createdAt)}</p>
              </div>
            </div>

            {/* Last Login */}
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600">Last Login</p>
                <p className="font-medium text-gray-900">{formatDate(employee.lastLogin)}</p>
              </div>
            </div>

            {/* Login Count */}
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600">Total Logins</p>
                <p className="font-medium text-gray-900">{employee.loginCount || 0}</p>
              </div>
            </div>
          </div>

          {/* Status Alert */}
          {employee.status !== 'active' && (
            <div className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-700">
                This employee account is {employee.status}. They cannot access the system.
              </p>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
