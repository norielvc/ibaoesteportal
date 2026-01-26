import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, KeyRound } from 'lucide-react';
import Layout from '@/components/Layout/Layout';
import AddEmployeeModal from '@/components/Modals/AddEmployeeModal';
import EditEmployeeModal from '@/components/Modals/EditEmployeeModal';
import ViewEmployeeModal from '@/components/Modals/ViewEmployeeModal';
import DeleteConfirmModal from '@/components/Modals/DeleteConfirmModal';
import { getAuthToken } from '@/lib/auth';
// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const apiUrl = `${API_URL}/api`;

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch employees');
      
      const data = await response.json();
      setEmployees(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEmployee = async (employeeData) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(employeeData)
      });

      if (!response.ok) throw new Error('Failed to add employee');
      
      const data = await response.json();
      setEmployees([...employees, data.data]);
      setShowAddModal(false);
      setSuccessMessage('Employee added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
      console.error('Error adding employee:', err);
    }
  };

  const handleEditEmployee = async (employeeId, employeeData) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/users/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(employeeData)
      });

      if (!response.ok) throw new Error('Failed to update employee');
      
      const data = await response.json();
      setEmployees(employees.map(emp => emp._id === employeeId ? data.data : emp));
      setShowEditModal(false);
      setSelectedEmployee(null);
      setSuccessMessage('Employee updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
      console.error('Error updating employee:', err);
    }
  };

  const handleDeleteEmployee = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/users/${selectedEmployee._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete employee');
      
      setEmployees(employees.filter(emp => emp._id !== selectedEmployee._id));
      setShowDeleteModal(false);
      setSelectedEmployee(null);
      setSuccessMessage('Employee deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
      console.error('Error deleting employee:', err);
    }
  };

  const openViewModal = (employee) => {
    setSelectedEmployee(employee);
    setShowViewModal(true);
  };

  const openEditModal = (employee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const openDeleteModal = (employee) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  const openResetPasswordModal = (employee) => {
    setSelectedEmployee(employee);
    setShowResetPasswordModal(true);
  };

  const handleResetPassword = async (newPassword) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/users/${selectedEmployee._id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword })
      });

      if (!response.ok) throw new Error('Failed to reset password');
      
      setShowResetPasswordModal(false);
      setSelectedEmployee(null);
      setSuccessMessage('Password reset successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
      console.error('Error resetting password:', err);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
            <p className="text-gray-600 mt-1">Manage your team members and their access</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Employee
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {successMessage}
          </div>
        )}

        {/* Employees Table */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="text-gray-600 mt-2">Loading employees...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 mb-4">No employees found</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary"
              >
                Add First Employee
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Last Login</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary-600">
                              {emp.firstName?.[0]}{emp.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{emp.email}</td>
                      <td className="px-6 py-4">
                        <span className={`badge ${emp.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                          {emp.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${emp.status === 'active' ? 'badge-success' : emp.status === 'inactive' ? 'badge-warning' : 'badge-danger'}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {emp.lastLogin ? new Date(emp.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openViewModal(emp)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition" 
                            title="View"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          <button 
                            onClick={() => openEditModal(emp)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition" 
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button 
                            onClick={() => openResetPasswordModal(emp)}
                            className="p-2 hover:bg-blue-100 rounded-lg transition" 
                            title="Reset Password"
                          >
                            <KeyRound className="w-4 h-4 text-blue-600" />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(emp)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition" 
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats */}
        {filteredEmployees.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4">
              <p className="text-gray-600 text-sm">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
            </div>
            <div className="card p-4">
              <p className="text-gray-600 text-sm">Active</p>
              <p className="text-2xl font-bold text-green-600">{employees.filter(e => e.status === 'active').length}</p>
            </div>
            <div className="card p-4">
              <p className="text-gray-600 text-sm">Administrators</p>
              <p className="text-2xl font-bold text-blue-600">{employees.filter(e => e.role === 'admin').length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddEmployee}
        />
      )}

      {/* View Employee Modal */}
      {showViewModal && selectedEmployee && (
        <ViewEmployeeModal
          employee={selectedEmployee}
          onClose={() => {
            setShowViewModal(false);
            setSelectedEmployee(null);
          }}
        />
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <EditEmployeeModal
          employee={selectedEmployee}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEmployee(null);
          }}
          onSubmit={handleEditEmployee}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEmployee && (
        <DeleteConfirmModal
          title="Delete Employee"
          message={`Are you sure you want to delete ${selectedEmployee.firstName} ${selectedEmployee.lastName}? This action cannot be undone.`}
          onConfirm={handleDeleteEmployee}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedEmployee(null);
          }}
          isLoading={false}
        />
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedEmployee && (
        <ResetPasswordModal
          employee={selectedEmployee}
          onClose={() => {
            setShowResetPasswordModal(false);
            setSelectedEmployee(null);
          }}
          onSubmit={handleResetPassword}
        />
      )}
    </Layout>
  );
}

// Reset Password Modal Component
function ResetPasswordModal({ employee, onClose, onSubmit }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
    setConfirmPassword(password);
    setShowPassword(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(newPassword);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Reset Password</h2>
                <p className="text-blue-200 text-sm">{employee.firstName} {employee.lastName}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{employee.email}</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-24"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm new password"
                required
              />
            </div>

            {/* Generate Password Button */}
            <button
              type="button"
              onClick={generatePassword}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              🔐 Generate Strong Password
            </button>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Resetting...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Reset Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
