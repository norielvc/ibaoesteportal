import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout/Layout';
import {
  FileText, Search, Eye, CheckCircle, XCircle, RotateCcw,
  Clock, User, Calendar, ChevronDown, X, AlertTriangle,
  FileCheck, History, Filter, Shield, Printer, Download
} from 'lucide-react';
import { getAuthToken, getUserData } from '@/lib/auth';
// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [workflows, setWorkflows] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('assigned'); // 'assigned' or 'all'
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [processing, setProcessing] = useState(false);

  // Load current user and workflows
  useEffect(() => {
    const user = getUserData();
    setCurrentUser(user);
    console.log('Current user loaded:', user);

    // Load workflows from API first, then fallback to localStorage
    const loadWorkflows = async () => {
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
          console.log('Workflows loaded from database:', data.data);
          return;
        }
      } catch (error) {
        console.log('Could not load workflows from API:', error);
      }

      // Fallback to localStorage
      const savedWorkflows = localStorage.getItem('certificateWorkflows');
      if (savedWorkflows) {
        const parsedWorkflows = JSON.parse(savedWorkflows);
        setWorkflows(parsedWorkflows);
        console.log('Workflows loaded from localStorage:', parsedWorkflows);
      } else {
        console.log('No workflows found');
      }
    };

    loadWorkflows();
    fetchRequests();
  }, []);

  // Re-fetch requests when view mode changes
  useEffect(() => {
    if (currentUser) {
      fetchRequests();
    }
  }, [viewMode, currentUser]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();

      // If viewing "My Assignments", use the workflow assignments API
      if (viewMode === 'assigned') {
        const response = await fetch(`${API_URL}/api/workflow-assignments/my-assignments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setRequests(data.certificates || []);
        }
      } else {
        // For "All Requests" view, use the regular certificates API
        const response = await fetch(`${API_URL}/api/certificates`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setRequests(data.certificates || []);
        }
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if current user is assigned to approve a request at its current step
  const isUserAssignedToRequest = (request) => {
    if (!currentUser) {
      return false;
    }

    // Admin can see all
    if (currentUser.role === 'admin') return true;

    // If we're in "My Assignments" view, all requests are already filtered to assigned ones
    if (viewMode === 'assigned') {
      return true;
    }

    // For "All Requests" view, use the original workflow logic as fallback
    if (!workflows) {
      return false;
    }

    // Get workflow for this certificate type - it's an array of steps directly
    const workflowSteps = workflows[request.certificate_type];
    if (!workflowSteps || !Array.isArray(workflowSteps) || workflowSteps.length === 0) {
      return false;
    }

    // Determine current step index based on status
    const statusToStepIndex = {
      'pending': 1,      // Pending requests need Staff Review (step index 1)
      'submitted': 1,    // Same as pending
      'processing': 2,   // Processing means staff approved, now needs Captain (step index 2)
      'staff_review': 1, // At staff review step
      'captain_approval': 2, // At captain approval step
      'oic_review': 3,   // NEW: Needs OIC processing (step index 3)
      'ready': 4,        // Ready for pickup
      'ready_for_pickup': 4,
      'released': 5      // Released, final step
    };

    const stepIndex = statusToStepIndex[request.status] || 0;
    const currentStep = workflowSteps[stepIndex];

    if (!currentStep || !currentStep.requiresApproval) {
      return false;
    }

    // Check if user is assigned to this step
    const userId = currentUser._id || currentUser.id;
    const assignedUsers = currentStep.assignedUsers || [];

    return assignedUsers.some(assignedId => String(assignedId) === String(userId));
  };

  // Get the current workflow step for a request
  const getCurrentWorkflowStep = (request) => {
    const workflowSteps = workflows[request.certificate_type];
    if (!workflowSteps || !Array.isArray(workflowSteps)) return null;

    // Status to step index mapping
    const statusToStepIndex = {
      'pending': 1,
      'submitted': 1,
      'processing': 2,
      'staff_review': 1,
      'captain_approval': 2,
      'oic_review': 3,
      'ready': 4,
      'ready_for_pickup': 4,
      'released': 5
    };

    const index = statusToStepIndex[request.status] || 0;
    return workflowSteps[index] || null;
  };

  // Check if user can take action on request
  const canUserTakeAction = (request) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return isUserAssignedToRequest(request);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'submitted': 'bg-blue-100 text-blue-800 border-blue-200',
      'under_review': 'bg-purple-100 text-purple-800 border-purple-200',
      'processing': 'bg-purple-100 text-purple-800 border-purple-200',
      'oic_review': 'bg-indigo-100 text-indigo-800 border-indigo-200', // Color for Releasing Team step
      'approved': 'bg-green-100 text-green-800 border-green-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200',
      'returned': 'bg-orange-100 text-orange-800 border-orange-200',
      'ready': 'bg-green-100 text-green-800 border-green-200',
      'ready_for_pickup': 'bg-green-100 text-green-800 border-green-200',
      'released': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTypeLabel = (type) => {
    const labels = {
      'barangay_clearance': 'Barangay Clearance',
      'certificate_of_indigency': 'Certificate of Indigency',
      'barangay_residency': 'Barangay Residency'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      'barangay_clearance': 'bg-blue-500',
      'certificate_of_indigency': 'bg-green-500',
      'barangay_residency': 'bg-orange-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleAction = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setActionComment('');
    setShowActionModal(true);
  };

  const getNextStatus = (currentStatus, action, request) => {
    if (action === 'reject') return 'rejected';
    if (action === 'return') return 'pending'; // Return to pending for revision

    // For approve action, move to next workflow step
    if (action === 'approve') {
      const workflowSteps = workflows[request.certificate_type];

      // Status progression:
      const statusFlow = {
        'pending': 'processing',
        'submitted': 'processing',
        'processing': 'oic_review', // After Captain, go to OIC
        'oic_review': 'ready',      // After OIC, go to Ready
        'approved': 'released',
        'ready': 'released',
        'ready_for_pickup': 'released'
      };

      return statusFlow[currentStatus] || 'ready';
    }

    if (action === 'reject') return 'cancelled';
    if (action === 'return') return 'pending';

    return 'ready';
  };

  const submitAction = async () => {
    if (!selectedRequest || !actionType) return;

    setProcessing(true);
    try {
      const token = getAuthToken();
      const newStatus = getNextStatus(selectedRequest.status, actionType, selectedRequest);

      let url = `${API_URL}/api/certificates/${selectedRequest.id}/status`;
      let method = 'PUT';
      let body = {
        status: newStatus,
        comment: actionComment,
        action: actionType,
        approvedBy: currentUser?.email
      };

      // If this is a workflow assignment, use the assignment-specific endpoint
      // This is crucial for triggering post-approval workflows (certificate generation)
      if (selectedRequest.workflow_assignment) {
        console.log('Using workflow assignment update route');
        url = `${API_URL}/api/workflow-assignments/${selectedRequest.workflow_assignment.id}/status`;
        body = {
          action: actionType,
          comment: actionComment
        };
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (data.success) {
        setRequests(prev => prev.map(r =>
          r.id === selectedRequest.id ? { ...r, status: newStatus } : r
        ));
        setShowActionModal(false);
        setSelectedRequest(null);
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process action');
    } finally {
      setProcessing(false);
    }
  };

  // Filter requests based on view mode and other filters
  const filteredRequests = requests.filter(req => {
    // View mode filter
    if (viewMode === 'assigned' && !isUserAssignedToRequest(req)) {
      return false;
    }

    const matchesSearch =
      req.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.applicant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'ready' ? ['ready', 'ready_for_pickup'].includes(req.status) : req.status === statusFilter);
    const matchesType = typeFilter === 'all' || req.certificate_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Count requests assigned to current user
  const [assignedCount, setAssignedCount] = useState(0);
  const [pendingActionCount, setPendingActionCount] = useState(0);

  // Fetch assignment counts
  useEffect(() => {
    const fetchAssignmentCounts = async () => {
      if (!currentUser) return;

      try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/api/workflow-assignments/user/${currentUser._id || currentUser.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
          const totalAssigned = data.count || 0;
          const pendingActions = data.assignments?.filter(a =>
            a.status === 'pending' &&
            ['pending', 'processing'].includes(a.certificate_requests?.status)
          ).length || 0;

          setAssignedCount(totalAssigned);
          setPendingActionCount(pendingActions);
        }
      } catch (error) {
        console.error('Error fetching assignment counts:', error);
      }
    };

    fetchAssignmentCounts();
  }, [currentUser]);

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Certificate Requests</h1>
            <p className="text-gray-500 mt-1">Manage and process certificate applications</p>
          </div>
          <div className="flex items-center gap-3">
            {pendingActionCount > 0 && (
              <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {pendingActionCount} Pending Your Action
              </span>
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('assigned')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${viewMode === 'assigned'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <User className="w-4 h-4" />
                My Assignments ({assignedCount})
              </button>
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${viewMode === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  <Shield className="w-4 h-4" />
                  All Requests ({requests.length})
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-3">


              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-48"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>

                  <option value="released">Released</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Type Filter */}
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="barangay_clearance">Clearance</option>
                  <option value="certificate_of_indigency">Indigency</option>
                  <option value="barangay_residency">Residency</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>



        {/* Requests Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                {viewMode === 'assigned' ? 'No requests assigned to you' : 'No requests found'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {viewMode === 'assigned'
                  ? 'Requests will appear here when you are assigned as an approver'
                  : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Applicant</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Step</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRequests.map((request) => {
                    const currentStep = getCurrentWorkflowStep(request);
                    const canAct = canUserTakeAction(request);

                    return (
                      <tr key={request.id} className={`hover:bg-gray-50 transition-colors ${canAct ? 'bg-blue-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <span className="font-mono font-semibold text-blue-600">{request.reference_number}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{request.applicant_name || request.full_name || 'N/A'}</p>
                              <p className="text-sm text-gray-500">{request.contact_number || 'No contact'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getTypeColor(request.certificate_type)}`}></div>
                            <span className="text-sm font-medium text-gray-700">{getTypeLabel(request.certificate_type)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}>
                            {request.status?.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {currentStep ? (
                            <span className="text-sm text-gray-600">{currentStep.name}</span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {formatDate(request.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedRequest(request)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            {canAct && ['pending', 'processing'].includes(request.status) && (
                              <>
                                <button
                                  onClick={() => handleAction(request, 'approve')}
                                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Approve"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleAction(request, 'reject')}
                                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Reject"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleAction(request, 'return')}
                                  className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                  title="Send Back"
                                >
                                  <RotateCcw className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Request Details Modal */}
        {selectedRequest && !showActionModal && (
          <RequestDetailsModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onAction={handleAction}
            getStatusColor={getStatusColor}
            getTypeLabel={getTypeLabel}
            formatDate={formatDate}
            canUserTakeAction={canUserTakeAction}
            getCurrentWorkflowStep={getCurrentWorkflowStep}
          />
        )}

        {/* Action Modal */}
        {showActionModal && selectedRequest && (
          <ActionModal
            request={selectedRequest}
            actionType={actionType}
            comment={actionComment}
            setComment={setActionComment}
            onSubmit={submitAction}
            onClose={() => { setShowActionModal(false); setSelectedRequest(null); }}
            processing={processing}
          />
        )}
      </div>
    </Layout>
  );
}


// Request Details Modal Component
function RequestDetailsModal({ request, onClose, onAction, getStatusColor, getTypeLabel, formatDate, canUserTakeAction, getCurrentWorkflowStep }) {
  const currentStep = getCurrentWorkflowStep(request);
  const canAct = canUserTakeAction(request);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  if (showPdfPreview) {
    return (
      <CertificatePreviewModal
        request={request}
        onClose={() => setShowPdfPreview(false)}
        onBack={() => setShowPdfPreview(false)}
        getTypeLabel={getTypeLabel}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Request Details</h2>
                <p className="text-blue-200 text-sm">{request.reference_number}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)] space-y-6">
            {/* Status and Step */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(request.status)}`}>
                {request.status?.replace(/_/g, ' ').toUpperCase()}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{getTypeLabel(request.certificate_type)}</span>
                {currentStep && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-sm text-blue-600 font-medium">{currentStep.name}</span>
                  </>
                )}
              </div>
            </div>

            {/* Preview Certificate Button */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Eye className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900">Certificate Preview</h3>
                    <p className="text-sm text-purple-600">View how the certificate will look when printed</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPdfPreview(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 flex items-center gap-2 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Preview PDF
                </button>
              </div>
            </div>

            {/* Applicant Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  Applicant Information
                </h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Full Name</p>
                    <p className="font-medium text-gray-900">{request.applicant_name || request.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Contact Number</p>
                    <p className="font-medium text-gray-900">{request.contact_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Age</p>
                    <p className="font-medium text-gray-900">{request.age || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Sex</p>
                    <p className="font-medium text-gray-900">{request.sex || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Civil Status</p>
                    <p className="font-medium text-gray-900">{request.civil_status || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date of Birth</p>
                    <p className="font-medium text-gray-900">{request.date_of_birth || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Address</p>
                    <p className="font-medium text-gray-900">{request.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Purpose */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                    <FileCheck className="w-5 h-5 text-blue-500" />
                    Purpose
                  </h3>
                  <p className="text-gray-700">{request.purpose || 'Not specified'}</p>
                </div>

                {/* Timeline */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                    <History className="w-5 h-5 text-blue-500" />
                    Timeline
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Submitted</span>
                      <span className="font-medium">{formatDate(request.created_at)}</span>
                    </div>
                    {request.updated_at && request.updated_at !== request.created_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Last Updated</span>
                        <span className="font-medium">{formatDate(request.updated_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Comment if any */}
                {request.admin_comment && (
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                    <h3 className="font-semibold text-orange-800 flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5" />
                      Admin Notes
                    </h3>
                    <p className="text-orange-700">{request.admin_comment}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          {canAct && ['pending', 'processing'].includes(request.status) && (
            <div className="border-t bg-gray-50 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => onAction(request, 'return')}
                className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium hover:bg-orange-200 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Send Back
              </button>
              <button
                onClick={() => onAction(request, 'reject')}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={() => onAction(request, 'approve')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Action Modal Component
function ActionModal({ request, actionType, comment, setComment, onSubmit, onClose, processing }) {
  const config = {
    approve: {
      title: 'Approve Request',
      description: 'Are you sure you want to approve this certificate request?',
      icon: CheckCircle,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonBg: 'bg-green-600 hover:bg-green-700',
      buttonText: 'Approve Request'
    },
    reject: {
      title: 'Reject Request',
      description: 'Please provide a reason for rejecting this request.',
      icon: XCircle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonBg: 'bg-red-600 hover:bg-red-700',
      buttonText: 'Reject Request'
    },
    return: {
      title: 'Send Back for Revision',
      description: 'Please specify what needs to be corrected or updated.',
      icon: RotateCcw,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      buttonBg: 'bg-orange-600 hover:bg-orange-700',
      buttonText: 'Send Back'
    }
  };

  const cfg = config[actionType];
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
          <div className="p-6">
            {/* Icon */}
            <div className={`w-16 h-16 ${cfg.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <Icon className={`w-8 h-8 ${cfg.iconColor}`} />
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">{cfg.title}</h2>
            <p className="text-gray-500 text-center mb-6">{cfg.description}</p>

            {/* Request Info */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-500">Reference Number</p>
              <p className="font-mono font-semibold text-blue-600">{request.reference_number}</p>
              <p className="text-sm text-gray-500 mt-2">Applicant</p>
              <p className="font-medium text-gray-900">{request.applicant_name || request.full_name}</p>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {actionType === 'approve' ? 'Comments (Optional)' : 'Reason / Comments *'}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder={actionType === 'approve'
                  ? 'Add any notes or comments...'
                  : 'Please provide a reason...'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={processing}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={processing || (actionType !== 'approve' && !comment.trim())}
                className={`flex-1 px-4 py-3 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 ${cfg.buttonBg}`}
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Icon className="w-4 h-4" />
                    {cfg.buttonText}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Default officials data (fallback) - Same as BarangayClearanceModal
const defaultOfficials = {
  chairman: 'ALEXANDER C. MANIO',
  secretary: 'ROYCE ANN C. GALVEZ',
  treasurer: 'MA. LUZ S. REYES',
  skChairman: 'JOHN RUZZEL C. SANTOS',
  councilors: [
    'JOELITO C. MANIO',
    'ENGELBERT M. INDUCTIVO',
    'NORMANDO T. SANTOS',
    'JOPHET M. TURLA',
    'JOHN BRYAN C. CRUZ',
    'ARNEL D. BERNARDINO',
    'LORENA G. LOPEZ'
  ],
  administrator: 'ROBERT D. SANTOS',
  assistantSecretary: 'PERLITA C. DE JESUS',
  assistantAdministrator: 'KHINZ JANZL V. BARROGA',
  recordKeeper: 'EMIL D. ROBLES',
  clerk: 'CIELITO B. DE LEON',
  contactInfo: {
    address: 'Purok 2 (Sitio Banawe) Barangay Iba O\' Este, Calumpit, Bulacan',
    contactPerson: 'Sec. Royce Ann C. Galvez',
    telephone: '0967 631 9168',
    email: 'anneseriousme@gmail.com'
  },
  headerInfo: {
    country: 'Republic of the Philippines',
    province: 'Province of Bulacan',
    municipality: 'Municipality of Calumpit',
    barangayName: 'BARANGAY IBA O\' ESTE',
    officeName: 'Office of the Punong Barangay'
  },
  logos: { leftLogo: '/iba-o-este.png', rightLogo: '/calumpit.png', logoSize: 80, captainImage: '/images/brgycaptain.png' },
  headerStyle: { bgColor: '#ffffff', borderColor: '#1e40af', fontFamily: 'default' },
  countryStyle: { color: '#4b5563', size: 12, fontWeight: 'normal', fontFamily: 'default' },
  provinceStyle: { color: '#4b5563', size: 12, fontWeight: 'normal', fontFamily: 'default' },
  municipalityStyle: { color: '#4b5563', size: 12, fontWeight: 'normal', fontFamily: 'default' },
  barangayNameStyle: { color: '#1e40af', size: 20, fontWeight: 'bold', fontFamily: 'default' },
  officeNameStyle: { color: '#6b7280', size: 11, fontWeight: 'normal', fontFamily: 'default' },
  sidebarStyle: { bgColor: '#1e40af', gradientEnd: '#1e3a8a', textColor: '#ffffff', labelColor: '#fde047', titleSize: 14, textSize: 11, fontFamily: 'default' },
  bodyStyle: { bgColor: '#ffffff', textColor: '#1f2937', titleColor: '#1e3a8a', titleSize: 24, textSize: 14, fontFamily: 'default' },
  footerStyle: { bgColor: '#f9fafb', textColor: '#374151', borderColor: '#d1d5db', textSize: 9, fontFamily: 'default' }
};

// Certificate Preview Modal Component
function CertificatePreviewModal({ request, onClose, onBack, getTypeLabel }) {
  const certificateRef = useRef(null);
  const [officials, setOfficials] = useState(defaultOfficials);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    // Fetch officials from API for real-time sync
    const fetchOfficials = async () => {
      try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/api/officials/config`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();

        if (data.success && data.data) {
          // Merge with defaults to ensure structure
          setOfficials(prev => ({ ...defaultOfficials, ...data.data }));

          // Also update localStorage to keep it fresh
          localStorage.setItem('barangayOfficials', JSON.stringify({ ...defaultOfficials, ...data.data }));
        } else {
          // Fallback to localStorage
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('Error fetching officials config:', error);
        loadFromLocalStorage();
      }
    };

    const loadFromLocalStorage = () => {
      const savedOfficials = localStorage.getItem('barangayOfficials');
      if (savedOfficials) {
        try {
          const parsed = JSON.parse(savedOfficials);
          setOfficials(prev => ({ ...defaultOfficials, ...parsed }));
        } catch (e) {
          console.error('Error parsing saved officials', e);
        }
      }
    };

    fetchOfficials();

    // Set current date
    const now = new Date();
    setCurrentDate(now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  const handlePrint = () => {
    const printContent = certificateRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${getTypeLabel(request.certificate_type)} - ${request.reference_number}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          @page { size: A4 portrait; margin: 0; }
          @media print {
            html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
          body { margin: 0; padding: 0; display: flex; justify-content: center; }
          .certificate { width: 210mm; min-height: 297mm; padding: 8mm; box-sizing: border-box; background: white; }
        </style>
      </head>
      <body>
        <div class="certificate">${printContent.innerHTML}</div>
        <script>
          window.onload = function() { 
            setTimeout(function() { 
              window.print(); 
              window.close(); 
            }, 500); 
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;

    setIsDownloading(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const element = certificateRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${request.reference_number}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Could not generate PDF. Please try printing instead.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/80">
      <div className="flex min-h-screen items-start justify-center p-4 pt-8">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-7xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg mr-2"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <div className="bg-white/20 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Certificate Preview</h2>
                <p className="text-purple-200 text-sm">{request.reference_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="px-4 py-2 bg-white text-purple-700 rounded-lg font-medium hover:bg-purple-50 flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isDownloading ? 'Generating...' : 'Download PDF'}
              </button>
              <button onClick={onClose} className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg ml-2">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Certificate Preview - Using exact same template as BarangayClearanceModal */}
          <div className="p-6 bg-gray-100 overflow-y-auto max-h-[calc(100vh-150px)]">
            <ClearancePreviewForRequests
              request={request}
              currentDate={currentDate}
              officials={officials}
              certificateRef={certificateRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Certificate Preview Component - Exact copy from BarangayClearanceModal
function ClearancePreviewForRequests({ request, currentDate, officials, certificateRef }) {
  const logos = officials.logos || {};
  const headerStyle = officials.headerStyle || {};
  const countryStyle = officials.countryStyle || {};
  const provinceStyle = officials.provinceStyle || {};
  const municipalityStyle = officials.municipalityStyle || {};
  const barangayNameStyle = officials.barangayNameStyle || {};
  const officeNameStyle = officials.officeNameStyle || {};
  const sidebarStyle = officials.sidebarStyle || {};
  const bodyStyle = officials.bodyStyle || {};
  const footerStyle = officials.footerStyle || {};

  const getFontClass = (font) => ({ 'default': '', 'serif': 'font-serif', 'sans': 'font-sans', 'mono': 'font-mono' }[font] || '');

  // Map request data to formData format
  const formData = {
    fullName: request.applicant_name || request.full_name || '',
    age: request.age || '',
    sex: request.sex || '',
    civilStatus: request.civil_status || '',
    address: request.address || '',
    dateOfBirth: request.date_of_birth || '',
    placeOfBirth: request.place_of_birth || '',
    purpose: request.purpose || ''
  };

  return (
    <div className="p-1 flex justify-center print:p-0">
      {/* A4 Size Container */}
      <div ref={certificateRef} className={`certificate-container bg-white shadow-lg print:shadow-none flex flex-col ${getFontClass(bodyStyle.fontFamily)}`} style={{ width: '794px', height: '1090px', padding: '15px', boxSizing: 'border-box' }}>

        {/* Header with Logos */}
        <div className={`flex items-center justify-between pb-2 border-b-2 flex-shrink-0 ${getFontClass(headerStyle.fontFamily)}`}
          style={{ backgroundColor: headerStyle.bgColor, borderColor: headerStyle.borderColor }}>
          <div className="flex-shrink-0" style={{ width: `${logos.logoSize || 70}px`, height: `${logos.logoSize || 70}px` }}>
            {logos.leftLogo && <img src={logos.leftLogo} alt="Left Logo" className="w-full h-full object-contain" />}
          </div>
          <div className="text-center flex-1 px-4">
            <p className={getFontClass(countryStyle.fontFamily)} style={{ color: countryStyle.color || '#4b5563', fontSize: `${countryStyle.size || 13}px`, fontWeight: countryStyle.fontWeight || 'normal', lineHeight: '1.3' }}>
              {officials.headerInfo?.country || 'Republic of the Philippines'}
            </p>
            <p className={getFontClass(provinceStyle.fontFamily)} style={{ color: provinceStyle.color || '#4b5563', fontSize: `${provinceStyle.size || 13}px`, fontWeight: provinceStyle.fontWeight || 'normal', lineHeight: '1.3' }}>
              {officials.headerInfo?.province || 'Province of Bulacan'}
            </p>
            <p className={getFontClass(municipalityStyle.fontFamily)} style={{ color: municipalityStyle.color || '#4b5563', fontSize: `${municipalityStyle.size || 13}px`, fontWeight: municipalityStyle.fontWeight || 'normal', lineHeight: '1.3' }}>
              {officials.headerInfo?.municipality || 'Municipality of Calumpit'}
            </p>
            <p className={getFontClass(barangayNameStyle.fontFamily)} style={{ color: barangayNameStyle.color || '#1e40af', fontSize: `${barangayNameStyle.size || 22}px`, fontWeight: barangayNameStyle.fontWeight || 'bold', lineHeight: '1.3' }}>
              {officials.headerInfo?.barangayName || 'BARANGAY IBA O\' ESTE'}
            </p>
            <p className={getFontClass(officeNameStyle.fontFamily)} style={{ color: officeNameStyle.color || '#6b7280', fontSize: `${officeNameStyle.size || 12}px`, fontWeight: officeNameStyle.fontWeight || 'normal', lineHeight: '1.3' }}>
              {officials.headerInfo?.officeName || 'Office of the Punong Barangay'}
            </p>
          </div>
          <div className="flex-shrink-0" style={{ width: `${logos.logoSize || 80}px`, height: `${logos.logoSize || 80}px` }}>
            {logos.rightLogo && <img src={logos.rightLogo} alt="Right Logo" className="w-full h-full object-contain" />}
          </div>
        </div>

        <div className="flex flex-1 mt-2">
          {/* Left Sidebar - Officials */}
          {/* Left Sidebar - Officials */}
          <div className={`p-4 flex-shrink-0 flex flex-col ${getFontClass(sidebarStyle.fontFamily)}`}
            style={{
              width: '240px',
              background: `linear-gradient(to bottom, ${sidebarStyle.bgColor || '#ffffff'}, ${sidebarStyle.gradientEnd || sidebarStyle.bgColor || '#ffffff'})`,
              borderRight: `2px solid ${sidebarStyle.labelColor || sidebarStyle.textColor || '#000000'}`,
              color: sidebarStyle.textColor || '#000000',
              letterSpacing: sidebarStyle.letterSpacing === 'tighter' ? '-0.05em' : sidebarStyle.letterSpacing === 'wide' ? '0.025em' : sidebarStyle.letterSpacing === 'widest' ? '0.1em' : 'normal'
            }}>
            <div className="flex-1 space-y-4 text-center mt-6">
              {/* Captain's Portrait */}
              <div className="mb-2 mx-auto overflow-hidden rounded-lg" style={{ width: '100px', height: '120px' }}>
                {logos.captainImage ? (
                  <img src={logos.captainImage} alt="Captain" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">No Photo</div>
                )}
              </div>

              <div>
                <p className="text-xs mb-1" style={{
                  color: sidebarStyle.labelColor || '#000000',
                  fontWeight: sidebarStyle.titleWeight === 'normal' ? '400' : sidebarStyle.titleWeight === 'medium' ? '500' : sidebarStyle.titleWeight === 'bold' ? '700' : sidebarStyle.titleWeight === 'extrabold' ? '800' : '700'
                }}>PUNONG BARANGAY</p>
                <p style={{
                  fontSize: '13px',
                  color: sidebarStyle.textColor || '#000000',
                  fontWeight: sidebarStyle.nameWeight === 'normal' ? '400' : sidebarStyle.nameWeight === 'medium' ? '500' : sidebarStyle.nameWeight === 'semibold' ? '600' : sidebarStyle.nameWeight === 'bold' ? '700' : sidebarStyle.nameWeight === 'extrabold' ? '800' : '700'
                }}>{officials.chairman}</p>
              </div>

              <div>
                <p className="text-xs mb-1" style={{
                  color: sidebarStyle.labelColor || '#000000',
                  fontWeight: sidebarStyle.titleWeight === 'normal' ? '400' : sidebarStyle.titleWeight === 'medium' ? '500' : sidebarStyle.titleWeight === 'bold' ? '700' : sidebarStyle.titleWeight === 'extrabold' ? '800' : '700'
                }}>SANGGUNIANG BARANGAY MEMBERS</p>
                <div className="space-y-1">
                  {officials.councilors?.map((c, i) => (
                    <p key={i} style={{
                      fontSize: '11px',
                      color: sidebarStyle.textColor || '#000000',
                      fontWeight: sidebarStyle.nameWeight === 'normal' ? '400' : sidebarStyle.nameWeight === 'medium' ? '500' : sidebarStyle.nameWeight === 'semibold' ? '600' : sidebarStyle.nameWeight === 'bold' ? '700' : sidebarStyle.nameWeight === 'extrabold' ? '800' : '700'
                    }}>{c}</p>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs mb-1" style={{
                  color: sidebarStyle.labelColor || '#000000',
                  fontWeight: sidebarStyle.titleWeight === 'normal' ? '400' : sidebarStyle.titleWeight === 'medium' ? '500' : sidebarStyle.titleWeight === 'bold' ? '700' : sidebarStyle.titleWeight === 'extrabold' ? '800' : '700'
                }}>SK CHAIRPERSON</p>
                <p style={{
                  fontSize: '11px',
                  color: sidebarStyle.textColor || '#000000',
                  fontWeight: sidebarStyle.nameWeight === 'normal' ? '400' : sidebarStyle.nameWeight === 'medium' ? '500' : sidebarStyle.nameWeight === 'semibold' ? '600' : sidebarStyle.nameWeight === 'bold' ? '700' : sidebarStyle.nameWeight === 'extrabold' ? '800' : '700'
                }}>{officials.skChairman}</p>
              </div>

              <div>
                <p className="text-xs mb-1" style={{
                  color: sidebarStyle.labelColor || '#000000',
                  fontWeight: sidebarStyle.titleWeight === 'normal' ? '400' : sidebarStyle.titleWeight === 'medium' ? '500' : sidebarStyle.titleWeight === 'bold' ? '700' : sidebarStyle.titleWeight === 'extrabold' ? '800' : '700'
                }}>BARANGAY SECRETARY</p>
                <p style={{
                  fontSize: '11px',
                  color: sidebarStyle.textColor || '#000000',
                  fontWeight: sidebarStyle.nameWeight === 'normal' ? '400' : sidebarStyle.nameWeight === 'medium' ? '500' : sidebarStyle.nameWeight === 'semibold' ? '600' : sidebarStyle.nameWeight === 'bold' ? '700' : sidebarStyle.nameWeight === 'extrabold' ? '800' : '700'
                }}>{officials.secretary}</p>
              </div>

              <div>
                <p className="text-xs mb-1" style={{
                  color: sidebarStyle.labelColor || '#000000',
                  fontWeight: sidebarStyle.titleWeight === 'normal' ? '400' : sidebarStyle.titleWeight === 'medium' ? '500' : sidebarStyle.titleWeight === 'bold' ? '700' : sidebarStyle.titleWeight === 'extrabold' ? '800' : '700'
                }}>BARANGAY TREASURER</p>
                <p style={{
                  fontSize: '11px',
                  color: sidebarStyle.textColor || '#000000',
                  fontWeight: sidebarStyle.nameWeight === 'normal' ? '400' : sidebarStyle.nameWeight === 'medium' ? '500' : sidebarStyle.nameWeight === 'semibold' ? '600' : sidebarStyle.nameWeight === 'bold' ? '700' : sidebarStyle.nameWeight === 'extrabold' ? '800' : '700'
                }}>{officials.treasurer}</p>
              </div>

              <div>
                <p className="text-xs mb-1" style={{
                  color: sidebarStyle.labelColor || '#000000',
                  fontWeight: sidebarStyle.titleWeight === 'normal' ? '400' : sidebarStyle.titleWeight === 'medium' ? '500' : sidebarStyle.titleWeight === 'bold' ? '700' : sidebarStyle.titleWeight === 'extrabold' ? '800' : '700'
                }}>BARANGAY ADMINISTRATOR</p>
                <p style={{
                  fontSize: '11px',
                  color: sidebarStyle.textColor || '#000000',
                  fontWeight: sidebarStyle.nameWeight === 'normal' ? '400' : sidebarStyle.nameWeight === 'medium' ? '500' : sidebarStyle.nameWeight === 'semibold' ? '600' : sidebarStyle.nameWeight === 'bold' ? '700' : sidebarStyle.nameWeight === 'extrabold' ? '800' : '700'
                }}>{officials.administrator}</p>
              </div>

              <div>
                <p className="text-xs mb-1" style={{
                  color: sidebarStyle.labelColor || '#000000',
                  fontWeight: sidebarStyle.titleWeight === 'normal' ? '400' : sidebarStyle.titleWeight === 'medium' ? '500' : sidebarStyle.titleWeight === 'bold' ? '700' : sidebarStyle.titleWeight === 'extrabold' ? '800' : '700'
                }}>ASST. BRGY. SECRETARY</p>
                <p style={{
                  fontSize: '11px',
                  color: sidebarStyle.textColor || '#000000',
                  fontWeight: sidebarStyle.nameWeight === 'normal' ? '400' : sidebarStyle.nameWeight === 'medium' ? '500' : sidebarStyle.nameWeight === 'semibold' ? '600' : sidebarStyle.nameWeight === 'bold' ? '700' : sidebarStyle.nameWeight === 'extrabold' ? '800' : '700'
                }}>{officials.assistantSecretary}</p>
              </div>

              <div>
                <p className="text-xs mb-1" style={{
                  color: sidebarStyle.labelColor || '#000000',
                  fontWeight: sidebarStyle.titleWeight === 'normal' ? '400' : sidebarStyle.titleWeight === 'medium' ? '500' : sidebarStyle.titleWeight === 'bold' ? '700' : sidebarStyle.titleWeight === 'extrabold' ? '800' : '700'
                }}>ASST. BRGY. ADMINISTRATOR</p>
                <p style={{
                  fontSize: '11px',
                  color: sidebarStyle.textColor || '#000000',
                  fontWeight: sidebarStyle.nameWeight === 'normal' ? '400' : sidebarStyle.nameWeight === 'medium' ? '500' : sidebarStyle.nameWeight === 'semibold' ? '600' : sidebarStyle.nameWeight === 'bold' ? '700' : sidebarStyle.nameWeight === 'extrabold' ? '800' : '700'
                }}>{officials.assistantAdministrator}</p>
              </div>

              <div>
                <p className="text-xs mb-1" style={{
                  color: sidebarStyle.labelColor || '#000000',
                  fontWeight: sidebarStyle.titleWeight === 'normal' ? '400' : sidebarStyle.titleWeight === 'medium' ? '500' : sidebarStyle.titleWeight === 'bold' ? '700' : sidebarStyle.titleWeight === 'extrabold' ? '800' : '700'
                }}>BRGY. RECORD KEEPER</p>
                <p style={{
                  fontSize: '11px',
                  color: sidebarStyle.textColor || '#000000',
                  fontWeight: sidebarStyle.nameWeight === 'normal' ? '400' : sidebarStyle.nameWeight === 'medium' ? '500' : sidebarStyle.nameWeight === 'semibold' ? '600' : sidebarStyle.nameWeight === 'bold' ? '700' : sidebarStyle.nameWeight === 'extrabold' ? '800' : '700'
                }}>{officials.recordKeeper}</p>
              </div>

              <div>
                <p className="text-xs mb-1" style={{
                  color: sidebarStyle.labelColor || '#000000',
                  fontWeight: sidebarStyle.titleWeight === 'normal' ? '400' : sidebarStyle.titleWeight === 'medium' ? '500' : sidebarStyle.titleWeight === 'bold' ? '700' : sidebarStyle.titleWeight === 'extrabold' ? '800' : '700'
                }}>BRGY. CLERK</p>
                <p style={{
                  fontSize: '11px',
                  color: sidebarStyle.textColor || '#000000',
                  fontWeight: sidebarStyle.nameWeight === 'normal' ? '400' : sidebarStyle.nameWeight === 'medium' ? '500' : sidebarStyle.nameWeight === 'semibold' ? '600' : sidebarStyle.nameWeight === 'bold' ? '700' : sidebarStyle.nameWeight === 'extrabold' ? '800' : '700'
                }}>{officials.clerk}</p>
              </div>
            </div>
          </div>


          {/* Main Content - Certificate Body */}
          <div className={`flex-1 p-6 flex flex-col relative ${getFontClass(bodyStyle.fontFamily)}`} style={{ backgroundColor: bodyStyle.bgColor }}>
            {/* Background Watermark */}
            <div className="absolute inset-0 flex justify-center pointer-events-none opacity-[0.15] z-0 pt-24">
              <img
                src={logos.leftLogo || '/iba-o-este.png'}
                alt="Watermark"
                style={{ width: '550px', height: '550px', objectFit: 'contain' }}
              />
            </div>

            {/* Title */}
            <div className="text-center mb-6 relative z-10">
              <h1 className="font-bold underline" style={{ color: '#16a34a', fontSize: `${bodyStyle.titleSize || 24}px` }}>
                {request.certificate_type === 'barangay_clearance' ? 'BARANGAY CLEARANCE CERTIFICATE' :
                  request.certificate_type === 'certificate_of_indigency' ? 'CERTIFICATE OF INDIGENCY' :
                    request.certificate_type === 'barangay_residency' ? 'BARANGAY RESIDENCY CERTIFICATE' :
                      'CERTIFICATE'}
              </h1>
            </div>

            {/* Body Content */}
            <div className="flex-1 relative z-10" style={{ color: bodyStyle.textColor, fontSize: `${bodyStyle.textSize || 14}px` }}>
              <p className="font-bold mb-6">To Whom It May Concern:</p>

              <p className="mb-6 text-justify leading-relaxed">
                This is to certify that below mentioned person is a bona fide resident of this barangay and has no derogatory record as of date mentioned below:
              </p>

              {/* Personal Details Table */}
              <div className="mb-6 space-y-2">
                <div className="flex">
                  <span className="w-40 font-semibold">Name</span>
                  <span className="mr-2">:</span>
                  <span className="flex-1 font-bold underline">{formData.fullName || '_________________'}</span>
                </div>
                <div className="flex">
                  <span className="w-40 font-semibold">Age</span>
                  <span className="mr-2">:</span>
                  <span className="flex-1">{formData.age || '_________________'}</span>
                </div>
                <div className="flex">
                  <span className="w-40 font-semibold">Sex</span>
                  <span className="mr-2">:</span>
                  <span className="flex-1">{formData.sex || '_________________'}</span>
                </div>
                <div className="flex">
                  <span className="w-40 font-semibold">Civil Status</span>
                  <span className="mr-2">:</span>
                  <span className="flex-1">{formData.civilStatus || '_________________'}</span>
                </div>
                <div className="flex">
                  <span className="w-40 font-semibold">Residential Address</span>
                  <span className="mr-2">:</span>
                  <span className="flex-1">{formData.address || '_________________'}</span>
                </div>
                <div className="flex">
                  <span className="w-40 font-semibold">Date of Birth</span>
                  <span className="mr-2">:</span>
                  <span className="flex-1">{formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '_________________'}</span>
                </div>
                <div className="flex">
                  <span className="w-40 font-semibold">Place of Birth</span>
                  <span className="mr-2">:</span>
                  <span className="flex-1">{formData.placeOfBirth || '_________________'}</span>
                </div>
              </div>

              <p className="mb-4">
                This certification is being issued upon the request of above mentioned person for below purpose(s):
              </p>

              <p className="mb-8 font-semibold pl-4">
                {formData.purpose || '_________________________________'}
              </p>

              <p className="mb-8">
                Issued this <strong>{currentDate}</strong> at Barangay Iba O' Este, Calumpit, Bulacan.
              </p>

              {/* Resident's Signature */}
              <div className="mb-8">
                <div className="w-64 border-b border-black"></div>
                <p className="text-sm mt-1">Resident's Signature / Thumb Mark</p>
              </div>

              <p className="mb-12 font-semibold">TRULY YOURS,</p>

              {/* Chairman Signature */}
              <div className="mt-auto">
                <div className="w-64">
                  <p className="font-bold text-lg border-b border-black pb-1">{officials.chairman}</p>
                  <p className="text-sm">BARANGAY CHAIRMAN</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`mt-auto pt-2 border-t text-center flex-shrink-0 ${getFontClass(footerStyle.fontFamily)}`}
          style={{ backgroundColor: footerStyle.bgColor, borderColor: footerStyle.borderColor }}>
          <p className="font-semibold" style={{ color: footerStyle.textColor, fontSize: `${footerStyle.textSize || 9}px` }}>
            {officials.contactInfo?.address}
          </p>
          <p style={{ color: footerStyle.textColor, fontSize: `${footerStyle.textSize || 9}px` }}>
            <strong>Contact:</strong> {officials.contactInfo?.contactPerson} | <strong>Tel:</strong> {officials.contactInfo?.telephone} | <strong>Email:</strong> {officials.contactInfo?.email}
          </p>
        </div>
      </div >
    </div >
  );
}
