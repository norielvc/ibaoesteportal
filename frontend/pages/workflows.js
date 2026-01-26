import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout/Layout';
import { 
  GitBranch, Plus, Edit2, Trash2, Save, X, ChevronRight, 
  CheckCircle, Clock, UserCheck, FileText, AlertCircle,
  ArrowUp, ArrowDown, GripVertical, Settings, Eye, Users, Mail
} from 'lucide-react';
import { isAuthenticated, getUserData, getAuthToken } from '@/lib/auth';
// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

// Certificate types
const certificateTypes = [
  { id: 'barangay_clearance', name: 'Barangay Clearance', color: 'blue' },
  { id: 'certificate_of_indigency', name: 'Certificate of Indigency', color: 'green' },
  { id: 'barangay_residency', name: 'Barangay Residency', color: 'orange' }
];

// Default workflow steps
const defaultSteps = [
  { id: 1, name: 'Submitted', description: 'Application received', status: 'pending', icon: 'FileText', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: false },
  { id: 2, name: 'Staff Review', description: 'Being reviewed by assigned staff', status: 'staff_review', icon: 'Clock', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true },
  { id: 3, name: 'Barangay Captain Approval', description: 'Awaiting Barangay Captain approval', status: 'captain_approval', icon: 'UserCheck', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true },
  { id: 4, name: 'Ready for Pickup', description: 'Certificate is ready', status: 'ready', icon: 'CheckCircle', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: false },
  { id: 5, name: 'Released', description: 'Certificate released to applicant', status: 'released', icon: 'CheckCircle', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: false }
];

const iconOptions = [
  { name: 'FileText', icon: FileText },
  { name: 'Clock', icon: Clock },
  { name: 'UserCheck', icon: UserCheck },
  { name: 'CheckCircle', icon: CheckCircle },
  { name: 'AlertCircle', icon: AlertCircle },
  { name: 'Settings', icon: Settings },
  { name: 'Eye', icon: Eye }
];

const getIcon = (iconName) => {
  const found = iconOptions.find(i => i.name === iconName);
  return found ? found.icon : FileText;
};

export default function WorkflowsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState('barangay_clearance');
  const [workflows, setWorkflows] = useState({});
  const [editingStep, setEditingStep] = useState(null);
  const [showAddStep, setShowAddStep] = useState(false);
  const [notification, setNotification] = useState(null);
  const [newStep, setNewStep] = useState({ name: '', description: '', status: '', icon: 'FileText', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: false });
  const [users, setUsers] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    const user = getUserData();
    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    loadWorkflows();
    loadUsers();
    setLoading(false);
  }, []);

  const loadUsers = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No auth token found');
        return;
      }
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('Users loaded:', data);
      if (data.success) {
        setUsers(data.data || []);
      } else {
        console.error('Failed to load users:', data.message);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadWorkflows = async () => {
    // First try to load from API (database)
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/workflows`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success && data.data && Object.keys(data.data).length > 0) {
        setWorkflows(data.data);
        // Also save to localStorage as backup
        localStorage.setItem('certificateWorkflows', JSON.stringify(data.data));
        console.log('Workflows loaded from database');
        return;
      }
    } catch (error) {
      console.log('Could not load workflows from API, falling back to localStorage');
    }

    // Fallback to localStorage
    const saved = localStorage.getItem('certificateWorkflows');
    if (saved) {
      setWorkflows(JSON.parse(saved));
    } else {
      const initial = {};
      certificateTypes.forEach(cert => {
        initial[cert.id] = JSON.parse(JSON.stringify(defaultSteps));
      });
      setWorkflows(initial);
      localStorage.setItem('certificateWorkflows', JSON.stringify(initial));
    }
  };

  const saveWorkflows = async (updated) => {
    setWorkflows(updated);
    localStorage.setItem('certificateWorkflows', JSON.stringify(updated));
    
    // Also save to API (database) so other users can access
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/workflows`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ workflows: updated })
      });
      const data = await response.json();
      if (data.success) {
        showNotificationMsg('success', 'Workflow saved to database!');
      } else {
        showNotificationMsg('success', 'Workflow saved locally (database save failed)');
      }
    } catch (error) {
      console.error('Error saving to API:', error);
      showNotificationMsg('success', 'Workflow saved locally');
    }
  };

  const syncWorkflowAssignments = async () => {
    setSyncing(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/workflows/sync-assignments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        showNotificationMsg('success', `Workflow assignments synced! Created ${data.data.totalAssignments} assignments across ${data.data.updatedSteps} steps.`);
        if (data.data.errors && data.data.errors.length > 0) {
          console.warn('Sync completed with errors:', data.data.errors);
          showNotificationMsg('warning', `Sync completed with ${data.data.errors.length} warnings. Check console for details.`);
        }
      } else {
        showNotificationMsg('error', data.message || 'Failed to sync workflow assignments');
      }
    } catch (error) {
      console.error('Error syncing workflow assignments:', error);
      showNotificationMsg('error', 'Failed to sync workflow assignments');
    } finally {
      setSyncing(false);
    }
  };

  const showNotificationMsg = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), type === 'success' ? 5000 : 3000);
  };

  const getCurrentSteps = () => workflows[selectedCertificate] || [];

  const handleAddStep = () => {
    if (!newStep.name || !newStep.status) {
      showNotificationMsg('error', 'Please fill in step name and status');
      return;
    }
    const steps = getCurrentSteps();
    const updated = {
      ...workflows,
      [selectedCertificate]: [...steps, { ...newStep, id: Date.now(), assignedUsers: [] }]
    };
    saveWorkflows(updated);
    setNewStep({ name: '', description: '', status: '', icon: 'FileText', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: false });
    setShowAddStep(false);
  };

  const handleAssignUsers = (stepId, selectedUserIds) => {
    const steps = getCurrentSteps();
    const updated = {
      ...workflows,
      [selectedCertificate]: steps.map(s => s.id === stepId ? { ...s, assignedUsers: selectedUserIds } : s)
    };
    saveWorkflows(updated);
    setShowAssignModal(null);
  };

  const handleUpdateStep = (stepId, updates) => {
    const steps = getCurrentSteps();
    const updated = {
      ...workflows,
      [selectedCertificate]: steps.map(s => s.id === stepId ? { ...s, ...updates } : s)
    };
    saveWorkflows(updated);
    setEditingStep(null);
  };

  const handleDeleteStep = (stepId) => {
    if (!confirm('Are you sure you want to delete this step?')) return;
    const steps = getCurrentSteps();
    const updated = {
      ...workflows,
      [selectedCertificate]: steps.filter(s => s.id !== stepId)
    };
    saveWorkflows(updated);
  };

  const handleMoveStep = (stepId, direction) => {
    const steps = [...getCurrentSteps()];
    const index = steps.findIndex(s => s.id === stepId);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === steps.length - 1)) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [steps[index], steps[newIndex]] = [steps[newIndex], steps[index]];
    const updated = { ...workflows, [selectedCertificate]: steps };
    saveWorkflows(updated);
  };

  const handleResetToDefault = () => {
    if (!confirm('Reset workflow to default? This will remove all custom steps and assignments.')) return;
    const updated = { ...workflows, [selectedCertificate]: JSON.parse(JSON.stringify(defaultSteps)) };
    saveWorkflows(updated);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  const currentCert = certificateTypes.find(c => c.id === selectedCertificate);
  const steps = getCurrentSteps();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <GitBranch className="w-7 h-7 text-blue-600" />
              Approval Workflows
            </h1>
            <p className="text-gray-600 mt-1">Configure approval flow for each certificate type. Click "Save & Sync Assignments" to update the database with current assignments.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={syncWorkflowAssignments}
              disabled={syncing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              {syncing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Syncing...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save & Sync Assignments
                </>
              )}
            </button>
            <button
              onClick={handleResetToDefault}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Reset to Default
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
            notification.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
            'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : 
             notification.type === 'warning' ? <AlertCircle className="w-5 h-5" /> :
             <AlertCircle className="w-5 h-5" />}
            {notification.message}
          </div>
        )}

        {/* Certificate Type Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">Select Certificate Type</label>
          <div className="flex flex-wrap gap-3">
            {certificateTypes.map(cert => (
              <button
                key={cert.id}
                onClick={() => setSelectedCertificate(cert.id)}
                className="px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: selectedCertificate === cert.id 
                    ? (cert.color === 'blue' ? '#2563eb' : cert.color === 'green' ? '#16a34a' : '#ea580c')
                    : (cert.color === 'blue' ? '#dbeafe' : cert.color === 'green' ? '#dcfce7' : '#ffedd5'),
                  color: selectedCertificate === cert.id ? 'white' : (cert.color === 'blue' ? '#1d4ed8' : cert.color === 'green' ? '#15803d' : '#c2410c')
                }}
              >
                {cert.name}
              </button>
            ))}
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{currentCert?.name} Workflow</h2>
                <p className="text-sm text-gray-500 mt-1">{steps.length} steps configured</p>
              </div>
              <button
                onClick={() => setShowAddStep(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" /> Add Step
              </button>
            </div>
          </div>

          {/* Steps List */}
          <div className="p-6 space-y-4">
            {steps.map((step, index) => {
              const StepIcon = getIcon(step.icon);
              const isEditing = editingStep === step.id;

              return (
                <div key={step.id} className="relative">
                  {index < steps.length - 1 && (
                    <div className="absolute left-6 top-20 w-0.5 h-6 bg-gray-300"></div>
                  )}

                  <div className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
                    isEditing ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}>
                    {/* Reorder Buttons - Left Side */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleMoveStep(step.id, 'up')}
                        disabled={index === 0}
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleMoveStep(step.id, 'down')}
                        disabled={index === steps.length - 1}
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    {/* Step Number */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                        {index + 1}
                      </div>
                      <StepIcon className="w-5 h-5 text-gray-400" />
                    </div>

                    {/* Step Content */}
                    <div className="flex-1">
                      {isEditing ? (
                        <EditStepForm
                          step={step}
                          onSave={(updates) => handleUpdateStep(step.id, updates)}
                          onCancel={() => setEditingStep(null)}
                        />
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900">{step.name}</h3>
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                              {step.status}
                            </span>
                            {step.requiresApproval && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                                Requires Approval
                              </span>
                            )}
                            {step.sendEmail && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                                <Mail className="w-3 h-3" /> Email Notify
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                          
                          {/* Assigned Users Section */}
                          {step.requiresApproval && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-blue-800 uppercase flex items-center gap-1">
                                  <Users className="w-3 h-3" /> Assigned Approvers
                                </span>
                                <button
                                  onClick={() => setShowAssignModal(step.id)}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 font-medium flex items-center gap-1"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  Assign Users
                                </button>
                              </div>
                              {step.assignedUsers && step.assignedUsers.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {step.assignedUsers.map(userId => {
                                    const user = users.find(u => u._id === userId || u.id === userId);
                                    return user ? (
                                      <span key={userId} className="inline-flex items-center gap-1 px-2 py-1 bg-white text-blue-800 rounded-full text-xs border border-blue-200">
                                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-medium">
                                          {user.firstName?.charAt(0) || user.email?.charAt(0)}
                                        </div>
                                        {user.firstName} {user.lastName}
                                      </span>
                                    ) : null;
                                  })}
                                </div>
                              ) : (
                                <p className="text-xs text-blue-600 italic">Click "Assign Users" to add approvers</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Edit/Delete Actions */}
                    {!isEditing && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingStep(step.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStep(step.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {steps.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No workflow steps configured</p>
                <button onClick={() => setShowAddStep(true)} className="mt-4 text-blue-600 hover:underline">
                  Add your first step
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Workflow Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Preview</h3>
          <div className="flex items-center gap-2 overflow-x-auto pb-4">
            {steps.map((step, index) => {
              const StepIcon = getIcon(step.icon);
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[100px]">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step.requiresApproval ? 'bg-orange-100' : 'bg-blue-100'}`}>
                      <StepIcon className={`w-5 h-5 ${step.requiresApproval ? 'text-orange-600' : 'text-blue-600'}`} />
                    </div>
                    <p className="text-xs font-medium text-gray-700 mt-2 text-center">{step.name}</p>
                    {step.requiresApproval && <span className="text-[10px] text-orange-600">Approval</span>}
                  </div>
                  {index < steps.length - 1 && <ChevronRight className="w-5 h-5 text-gray-400 mx-1" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Step Modal */}
        {showAddStep && (
          <AddStepModal
            newStep={newStep}
            setNewStep={setNewStep}
            onAdd={handleAddStep}
            onClose={() => {
              setShowAddStep(false);
              setNewStep({ name: '', description: '', status: '', icon: 'FileText', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: false });
            }}
          />
        )}

        {/* Assign Users Modal */}
        {showAssignModal && (
          <AssignUsersModal
            step={getCurrentSteps().find(s => s.id === showAssignModal)}
            users={users}
            onSave={(selectedUserIds) => handleAssignUsers(showAssignModal, selectedUserIds)}
            onClose={() => setShowAssignModal(null)}
          />
        )}
      </div>
    </Layout>
  );
}


// Edit Step Form Component
function EditStepForm({ step, onSave, onCancel }) {
  const [form, setForm] = useState({ ...step });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Step Name"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          placeholder="Status Key"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <input
        type="text"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Description"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={form.icon}
          onChange={(e) => setForm({ ...form, icon: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {iconOptions.map(opt => (
            <option key={opt.name} value={opt.name}>{opt.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
          <input
            type="checkbox"
            checked={form.requiresApproval}
            onChange={(e) => setForm({ ...form, requiresApproval: e.target.checked })}
            className="w-4 h-4 text-orange-600 rounded"
          />
          <span className="text-orange-700 font-medium">Requires Approval</span>
        </label>
        <label className="flex items-center gap-2 text-sm bg-green-50 px-3 py-2 rounded-lg border border-green-200">
          <input
            type="checkbox"
            checked={form.sendEmail}
            onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })}
            className="w-4 h-4 text-green-600 rounded"
          />
          <span className="text-green-700 font-medium flex items-center gap-1">
            <Mail className="w-3 h-3" /> Send Email
          </span>
        </label>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave(form)}
          className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <Save className="w-4 h-4" /> Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
        >
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>
    </div>
  );
}

// Add Step Modal Component
function AddStepModal({ newStep, setNewStep, onAdd, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Workflow Step</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Step Name *</label>
            <input
              type="text"
              value={newStep.name}
              onChange={(e) => setNewStep({ ...newStep, name: e.target.value })}
              placeholder="e.g., Document Verification"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status Key *</label>
            <input
              type="text"
              value={newStep.status}
              onChange={(e) => setNewStep({ ...newStep, status: e.target.value })}
              placeholder="e.g., verifying"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={newStep.description}
              onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
              placeholder="Brief description of this step"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
            <select
              value={newStep.icon}
              onChange={(e) => setNewStep({ ...newStep, icon: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {iconOptions.map(opt => (
                <option key={opt.name} value={opt.name}>{opt.name}</option>
              ))}
            </select>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={newStep.requiresApproval}
                onChange={(e) => setNewStep({ ...newStep, requiresApproval: e.target.checked })}
                className="w-4 h-4 text-orange-600 rounded"
              />
              <span className="text-orange-800 font-medium">Requires user approval</span>
            </label>
            <p className="text-xs text-orange-600 mt-1 ml-6">Enable this to assign approvers to this step</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={newStep.sendEmail}
                onChange={(e) => setNewStep({ ...newStep, sendEmail: e.target.checked })}
                className="w-4 h-4 text-green-600 rounded"
              />
              <span className="text-green-800 font-medium flex items-center gap-1">
                <Mail className="w-4 h-4" /> Send email notification
              </span>
            </label>
            <p className="text-xs text-green-600 mt-1 ml-6">Notify assigned users when request reaches this step</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onAdd}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Add Step
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Assign Users Modal Component
function AssignUsersModal({ step, users, onSave, onClose }) {
  const [selectedUsers, setSelectedUsers] = useState(step?.assignedUsers || []);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Assign Approvers</h3>
            <p className="text-sm text-gray-500">Step: <span className="font-medium text-blue-600">{step?.name}</span></p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length > 0 ? (
            <div className="space-y-2">
              {filteredUsers.map(user => {
                // Users from API have _id (Supabase UUID), not id
                const userId = user._id || user.id;
                const isSelected = selectedUsers.includes(userId);
                return (
                  <div
                    key={userId}
                    onClick={() => toggleUser(userId)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                      isSelected ? 'bg-blue-600' : 'bg-gray-400'
                    }`}>
                      {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                    }`}>
                      {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : users.length > 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="font-medium">No users found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="font-medium">No users available</p>
              <p className="text-sm">Add users in the Employees page first</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4 pt-4 border-t">
          <button
            onClick={() => onSave(selectedUsers)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save ({selectedUsers.length} selected)
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
