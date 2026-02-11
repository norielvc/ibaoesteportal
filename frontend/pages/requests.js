import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';
import {
  FileText, Search, Eye, CheckCircle, XCircle, RotateCcw,
  Clock, User, Calendar, ChevronDown, X, AlertTriangle,
  FileCheck, History, Filter, Shield, Printer, Download, PenTool, ShieldAlert, Info, Edit, Save, RefreshCw,
  Skull, Activity, Heart, Phone
} from 'lucide-react';
import { getAuthToken, getUserData } from '@/lib/auth';
import SignaturePad from '@/components/UI/SignaturePad';
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
  const [historyGroup, setHistoryGroup] = useState('all'); // 'all', 'active', 'closed'
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'daily', 'weekly', 'monthly', 'yearly', 'custom'
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [viewMode, setViewMode] = useState('assigned'); // 'assigned' or 'all'
  const [totalCount, setTotalCount] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [processing, setProcessing] = useState(false);

  // Pickup Verification State
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickupName, setPickupName] = useState('');

  const [userSignature, setUserSignature] = useState(null);
  const [requestHistory, setRequestHistory] = useState([]);

  // Fetch history when selectedRequest changes
  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedRequest) {
        setRequestHistory([]);
        return;
      }

      try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/api/workflow-assignments/history/${selectedRequest.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        if (data.success) {
          setRequestHistory(Array.isArray(data.history) ? data.history : []);
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      }
    };

    fetchHistory();
  }, [selectedRequest]);

  // Load current user and workflows
  useEffect(() => {
    const user = getUserData();
    setCurrentUser(user);

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
      }
    };

    loadWorkflows();
    fetchRequests();
    fetchUserSignature();
  }, []);

  const fetchUserSignature = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/user/signatures`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success && data.signatures && data.signatures.length > 0) {
        // Find default or use the first one
        const defaultSig = data.signatures.find(s => s.id === data.defaultSignatureId) || data.signatures[0];
        setUserSignature(defaultSig.signatureData);
      }
    } catch (error) {
      console.error('Error fetching user signature:', error);
    }
  };

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

      // Always fetch BOTH or at least counts to keep badges accurate
      // 1. Fetch My Assignments
      const assignedRes = await fetch(`${API_URL}/api/workflow-assignments/my-assignments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const assignedData = await assignedRes.json();
      const myAssigned = assignedData.success ? (assignedData.certificates || []) : [];
      setAssignedCount(myAssigned.length);

      // 2. Fetch All Requests
      const allRes = await fetch(`${API_URL}/api/certificates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const allData = await allRes.json();
      const allCertificates = allData.success ? (allData.certificates || []) : [];
      setTotalCount(allCertificates.length);

      // 3. Set the active requests list based on viewMode
      if (viewMode === 'assigned') {
        setRequests(myAssigned);
      } else {
        setRequests(allCertificates);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setHistoryGroup('all');
    setTimeRange('all');
    setDateRange({ start: '', end: '' });
  };

  // Handle Deep Linking from URL
  useEffect(() => {
    if (router.query.id && requests.length > 0 && !selectedRequest) {
      const target = requests.find(r => r.id === router.query.id);
      if (target) {
        setSelectedRequest(target);
      }
    }
  }, [router.query.id, requests]);

  // Check if current user is assigned to approve a request at its current step
  const isUserAssignedToRequest = (request) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;

    // Use the workflow_assignment data attached by the backend if available
    if (request.workflow_assignment) {
      const assignedId = request.workflow_assignment.assigned_user_id || request.workflow_assignment.userId;
      const currentUserId = currentUser._id || currentUser.id;
      return String(assignedId) === String(currentUserId);
    }

    // Fallback: Check based on current status and global workflows
    if (!currentUser) return false;

    // 1. Trust explicit backend assignment if available
    if (request.workflow_assignment && String(request.workflow_assignment.assigned_user_id) === String(currentUser._id || currentUser.id)) {
      return true;
    }

    // 2. Fallback to manual check based on current workflows
    if (!workflows) return false;
    const workflowSteps = workflows[request.certificate_type] || Object.values(workflows)[0];
    if (!workflowSteps) return false;

    let currentStep;
    const s = (request.status || '').toLowerCase();

    if (['staff_review', 'pending', 'returned', 'submitted'].includes(s)) {
      currentStep = workflowSteps.find(step => step.status === 'staff_review');
    } else if (['oic_review', 'ready', 'ready_for_pickup'].includes(s)) {
      currentStep = workflowSteps.find(step => step.status === 'oic_review');
    } else if (s === 'captain_approval') {
      currentStep = workflowSteps.find(step => step.status === 'captain_approval');
    } else if (s === 'secretary_approval') {
      currentStep = workflowSteps.find(step => step.status === 'secretary_approval');
    } else if (s === 'processing') {
      // Find the first step that requires approval and isn't staff/oic
      currentStep = workflowSteps.find(step =>
        step.requiresApproval &&
        step.status !== 'staff_review' &&
        step.status !== 'oic_review'
      );
    }

    if (!currentStep) return false;
    const userId = currentUser._id || currentUser.id;
    return (currentStep.assignedUsers || []).some(id => String(id) === String(userId));
  };

  // Get the current workflow step for a request
  const getCurrentWorkflowStep = (request) => {
    // 🛡️ ENFORCED SEQUENTIAL FLOW: Initial requests ALWAYS go to the first step
    const currentStatus = (request.status || 'pending').toLowerCase();
    const workflowSteps = workflows[request.certificate_type] || Object.values(workflows)[0];

    if (workflowSteps && Array.isArray(workflowSteps) && ['pending', 'submitted', 'staff_review', 'returned'].includes(currentStatus)) {
      return workflowSteps[0];
    }

    // 1. Prioritize explicit assignment data from the backend
    if (request.workflow_assignment && request.workflow_assignment.step_name) {
      const step = workflowSteps.find(s => s.name === request.workflow_assignment.step_name);
      return step || { name: request.workflow_assignment.step_name };
    }

    // 2. Fallback to status-based search
    // Note: workflowSteps and currentStatus are already defined above

    // Special case: if processing, we might be at secretary or captain
    // This part is hard to guess without assignment data, but we look for the first step
    // that is NOT staff_review and not oic_review
    if (currentStatus === 'processing') {
      const activeStep = workflowSteps.find(s =>
        s.status !== 'staff_review' &&
        s.status !== 'oic_review' &&
        s.requiresApproval
      );
      return activeStep || workflowSteps[1] || null;
    }

    // Find the step that matches the current status
    const matchingStep = workflowSteps.find(s =>
      s.status?.toLowerCase() === currentStatus ||
      s.name?.toLowerCase().includes(currentStatus.replace('_', ' '))
    );

    return matchingStep || workflowSteps[0] || null;
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
      'staff_review': 'bg-green-100 text-green-800 border-green-200',
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
    if (!type) return 'N/A';
    const s = String(type).toLowerCase().trim().replace(/[-_ ]/g, '_');

    // Precise matches
    if (s.includes('natural_death')) return 'Natural Death Certificate';
    if (s.includes('clearance')) return 'Barangay Clearance';
    if (s.includes('indigency')) return 'Certificate of Indigency';
    if (s.includes('residency')) return 'Barangay Residency';

    // Fallback: remove all underscores/dashes and capitalize
    return String(type)
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  };

  const getTypeColor = (type) => {
    const s = String(type || '').toLowerCase();
    if (s.includes('death')) return 'bg-gray-800';
    if (s.includes('clearance')) return 'bg-blue-500';
    if (s.includes('indigency')) return 'bg-green-500';
    if (s.includes('residency')) return 'bg-orange-500';
    return 'bg-gray-500';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleAction = (request, action) => {
    // ⚡ DIRECT ACTION: Skip modal for "Ready to Pickup" (OIC approve)
    if (action === 'approve' && request.status === 'oic_review') {
      submitAction(null, request, action);
      return;
    }

    // 📦 PICKUP MODAL: Show specialized pickup modal for final release
    if (action === 'approve' && ['ready', 'ready_for_pickup'].includes(request.status)) {
      setSelectedRequest(request);
      setPickupName(request.applicant_name || request.full_name || '');
      setShowPickupModal(true);
      return;
    }

    setSelectedRequest(request);
    setActionType(action);
    setActionComment('');
    setShowActionModal(true);
  };

  const handlePickupConfirm = async () => {
    if (!pickupName.trim()) return;

    // Process release via the specialized pickup comment
    const comment = `Manually released to: ${pickupName}`;
    await submitAction(null, selectedRequest, 'approve', comment);

    setShowPickupModal(false);
    setPickupName('');
  };

  const getNextStatus = (currentStatus, action, request) => {
    if (action === 'reject') return 'rejected';
    if (action === 'return') return 'returned'; // Return to Review Team as 'Returned'

    // For approve action, move to next workflow step
    if (action === 'approve') {
      const workflowSteps = workflows[request.certificate_type];

      // Status progression:
      const statusFlow = {
        'pending': 'processing',
        'staff_review': 'processing',
        'returned': 'processing', // Returned requests go to processing (or next step) when approved
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
    if (action === 'return') return 'returned';

    return 'ready';
  };

  const submitAction = async (signatureData = null, overrideRequest = null, overrideAction = null, overrideComment = null) => {
    const req = overrideRequest || selectedRequest;
    const act = overrideAction || actionType;
    if (!req || !act) return;

    setProcessing(true);
    try {
      const token = getAuthToken();
      const newStatus = getNextStatus(req.status, act, req);

      let url = `${API_URL}/api/certificates/${req.id}/status`;
      let method = 'PUT';
      let body = {
        status: newStatus,
        comment: (overrideComment !== undefined && overrideComment !== null) ? overrideComment : (overrideAction ? '' : actionComment),
        action: act,
        approvedBy: currentUser?.email,
        signatureData: signatureData
      };

      // If this is a workflow assignment, use the assignment-specific endpoint
      if (req.workflow_assignment) {
        url = `${API_URL}/api/workflow-assignments/${req.workflow_assignment.id}/status`;
        body = {
          action: act,
          comment: (overrideComment !== undefined && overrideComment !== null) ? overrideComment : (overrideAction ? '' : actionComment),
          signatureData: signatureData
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
        // Use actual status from backend if available (workflow returns newStatus, regular returns data.status)
        const confirmedStatus = data.newStatus || data.data?.status || newStatus;

        setRequests(prev => prev.map(r =>
          r.id === req.id ? { ...r, status: confirmedStatus } : r
        ));

        // Update selected request in-place if it matches, so the details modal stays current
        setSelectedRequest(prev => prev && prev.id === req.id ? { ...prev, status: confirmedStatus } : prev);

        setShowActionModal(false);
        setShowPickupModal(false);

        // Wipe selected request only if it wasn't a direct action in the details modal
        if (!overrideAction) {
          setSelectedRequest(null);
        }
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

  const submitNote = async (note) => {
    if (!selectedRequest || !note.trim()) return;

    try {
      const token = getAuthToken();

      // Use history endpoint to insert a note/comment (we'll implement this backend route shortly)
      // Or use a dedicated endpoint
      const response = await fetch(`${API_URL}/api/workflow-assignments/add-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          requestType: selectedRequest.certificate_type,
          comment: note,
          stepId: selectedRequest.workflow_assignment?.step_id,
          stepName: selectedRequest.workflow_assignment?.step_name || 'Internal Note'
        })
      });

      const data = await response.json();
      if (data.success) {
        // Refresh history
        const historyRes = await fetch(`${API_URL}/api/workflow-assignments/history/${selectedRequest.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const historyData = await historyRes.json();
        if (historyData.success) {
          setRequestHistory(historyData.history || []);
        }
        return true;
      }
      alert(data.message || 'Failed to add note');
      return false;
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Error adding note');
      return false;
    }
  };

  const handleUpdateDetails = async (requestId, updatedData) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/certificates/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });

      const data = await response.json();
      if (data.success) {
        setRequests(prev => prev.map(r =>
          r.id === requestId ? { ...r, ...data.data } : r
        ));
        setSelectedRequest({ ...selectedRequest, ...data.data });
        return true;
      }
      alert(data.message || 'Update failed');
      return false;
    } catch (error) {
      console.error('Error updating certificate:', error);
      alert('Error updating certificate');
      return false;
    }
  };

  // Filter requests based on view mode and other filters
  const filteredRequests = requests.filter(req => {
    // View mode filter
    if (viewMode === 'assigned' && !isUserAssignedToRequest(req)) {
      return false;
    }

    // History group filter (Active/Closed)
    if (historyGroup === 'active') {
      const isActive = !['released', 'cancelled', 'rejected'].includes(req.status);
      if (!isActive) return false;
    } else if (historyGroup === 'closed') {
      const isClosed = ['released', 'cancelled', 'rejected'].includes(req.status);
      if (!isClosed) return false;
    }

    // Time range filter
    if (timeRange !== 'all') {
      const reqDate = new Date(req.created_at);
      const now = new Date();

      if (timeRange === 'daily') {
        const reqDateStr = reqDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
        const nowDateStr = now.toLocaleDateString('en-CA');
        if (reqDateStr !== nowDateStr) return false;
      } else if (timeRange === 'weekly') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        if (reqDate < oneWeekAgo) return false;
      } else if (timeRange === 'monthly') {
        if (reqDate.getMonth() !== now.getMonth() || reqDate.getFullYear() !== now.getFullYear()) return false;
      } else if (timeRange === 'yearly') {
        if (reqDate.getFullYear() !== now.getFullYear()) return false;
      } else if (timeRange === 'custom') {
        if (dateRange.start && new Date(req.created_at) < new Date(dateRange.start)) return false;
        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          if (new Date(req.created_at) > endDate) return false;
        }
      }
    }

    const matchesSearch =
      req.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.applicant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'pending' ? ['pending', 'staff_review', 'submitted', 'returned'].includes(req.status) :
        statusFilter === 'ready' ? ['ready', 'ready_for_pickup'].includes(req.status) :
          req.status === statusFilter);
    const matchesType = typeFilter === 'all' || req.certificate_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Count requests assigned to current user
  const [pendingActionCount, setPendingActionCount] = useState(0);

  // Fetch assignment counts for the floating orange badge
  useEffect(() => {
    const visibleAssigned = requests.filter(r => isUserAssignedToRequest(r));

    const pending = visibleAssigned.filter(r =>
      ['staff_review', 'processing', 'oic_review', 'pending', 'captain_approval', 'secretary_approval', 'ready', 'ready_for_pickup'].includes(r.status)
    ).length;

    setPendingActionCount(pending);
  }, [requests, viewMode, currentUser]);

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

        {/* Tabs and Filters Navigation */}
        <div className="space-y-4">
          {/* Top Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setViewMode('assigned')}
              className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${viewMode === 'assigned'
                ? 'border-blue-600 text-blue-600 bg-blue-50/30'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <FileCheck className="w-4 h-4" />
              My Assignments
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${viewMode === 'assigned' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                {assignedCount}
              </span>
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${viewMode === 'all'
                ? 'border-blue-600 text-blue-600 bg-blue-50/30'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <History className="w-4 h-4" />
              Certificate Request History
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${viewMode === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                {totalCount}
              </span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center w-full">
                {/* Search */}
                <div className="relative flex-1 min-w-[300px] md:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by Reference, Applicant Name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
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
                    <option value="staff_review">Staff Review</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="oic_review">Releasing Team</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="returned">Returned</option>
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
                    <option value="natural_death">Natural Death</option>
                    <option value="barangay_guardianship">Guardianship</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                {/* History Group */}
                <div className="relative">
                  <select
                    value={historyGroup}
                    onChange={(e) => setHistoryGroup(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-blue-50/50 text-sm font-medium text-blue-700"
                  >
                    <option value="all">All Records</option>
                    <option value="active">Active Requests</option>
                    <option value="closed">Closed / Archive</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
                </div>

                {/* Time Range */}
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="appearance-none pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                      >
                        <option value="all">Any Time</option>
                        <option value="daily">Today</option>
                        <option value="weekly">This Week</option>
                        <option value="monthly">This Month</option>
                        <option value="yearly">This Year</option>
                        <option value="custom">Custom Date</option>
                      </select>
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {timeRange === 'custom' && (
                      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300 bg-gray-50 p-1 rounded-lg border border-gray-200">
                        <input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                          className="px-2 py-1 border-none bg-transparent text-xs focus:ring-0"
                        />
                        <span className="text-gray-400 text-[10px] font-bold uppercase">to</span>
                        <input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                          className="px-2 py-1 border-none bg-transparent text-xs focus:ring-0"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Clear Filter Button */}
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all ml-auto"
                  title="Clear all filters"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRequests.map((request) => {
                    const currentStep = getCurrentWorkflowStep(request);
                    const canAct = canUserTakeAction(request);

                    return (
                      <tr
                        key={request.id}
                        onClick={() => setSelectedRequest(request)}
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${canAct ? 'bg-blue-50/30' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <Link
                            href={`/requests?id=${request.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
                                e.preventDefault();
                                setSelectedRequest(request);
                                router.push(
                                  { pathname: router.pathname, query: { ...router.query, id: request.id } },
                                  undefined,
                                  { shallow: true }
                                );
                              }
                            }}
                            className="font-mono font-semibold text-blue-600 hover:underline relative z-10"
                          >
                            {request.reference_number}
                          </Link>
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
                            {formatDate(request.updated_at || request.created_at)}
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
            onClose={() => {
              setSelectedRequest(null);
              const { id, ...rest } = router.query;
              if (id) {
                router.push({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
              }
            }}
            onAction={handleAction}
            onUpdate={handleUpdateDetails}
            getStatusColor={getStatusColor}
            getTypeLabel={getTypeLabel}
            formatDate={formatDate}
            canUserTakeAction={canUserTakeAction}
            getCurrentWorkflowStep={getCurrentWorkflowStep}
            history={requestHistory}
          />
        )}

        {/* Status Confirmation Modal */}
        {showActionModal && selectedRequest && (
          <ActionModal
            request={selectedRequest}
            actionType={actionType}
            comment={actionComment}
            setComment={setActionComment}
            onSubmit={submitAction}
            onClose={() => setShowActionModal(false)}
            processing={processing}
            currentStep={workflows[selectedRequest.certificate_type]?.find(s => s.status === (selectedRequest.status === 'processing' ? 'processing' : selectedRequest.status))}
            history={requestHistory}
            userSignature={userSignature}
          />
        )}

        {/* Pickup Verification Modal */}
        {showPickupModal && selectedRequest && (
          <ConfirmPickupModal
            certificate={selectedRequest}
            onClose={() => setShowPickupModal(false)}
            onConfirm={handlePickupConfirm}
            pickupName={pickupName}
            setPickupName={setPickupName}
            confirming={processing}
            getTypeLabel={getTypeLabel}
          />
        )}
      </div>
    </Layout>
  );
}


// Request Details Modal Component
// RequestDetailsModal Component
function RequestDetailsModal({ request, onClose, onAction, onUpdate, getStatusColor, getTypeLabel, formatDate, canUserTakeAction, getCurrentWorkflowStep, history = [] }) {
  const currentStep = getCurrentWorkflowStep(request);
  const canAct = canUserTakeAction(request);
  const isGuardianship = String(request.certificate_type || '').toLowerCase().includes('guardian') || String(request.reference_number || '').toUpperCase().startsWith('GD');

  // Helper to calculate age from date string
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    if (isNaN(birthDate.getTime())) return null;
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const displayAge = calculateAge(request.date_of_birth) || request.age;
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: request.first_name || '',
    middle_name: request.middle_name || '',
    last_name: request.last_name || '',
    suffix: request.suffix || '',
    full_name: request.full_name || request.applicant_name || '',
    contact_number: request.contact_number || '',
    age: request.age || '',
    sex: request.sex || '',
    civil_status: request.civil_status || '',
    date_of_birth: request.date_of_birth || '',
    address: request.address || '',
    purpose: request.purpose || '',
    date_of_death: request.date_of_death || '',
    cause_of_death: request.cause_of_death || '',
    covid_related: request.covid_related || false,
    requestor_name: request.requestor_name || '',
    guardian_name: request.guardian_name || '',
    guardian_relationship: request.guardian_relationship || ''
  });

  // Split name if fields are empty but full_name exists
  useEffect(() => {
    if (isEditing && !editFormData.first_name && !editFormData.last_name && editFormData.full_name) {
      const parts = editFormData.full_name.trim().split(' ');
      if (parts.length >= 2) {
        setEditFormData(prev => ({
          ...prev,
          first_name: parts[0],
          last_name: parts[parts.length - 1],
          middle_name: parts.length > 2 ? parts.slice(1, -1).join(' ') : ''
        }));
      }
    }
  }, [isEditing]);

  // Calculate age when date_of_birth changes
  useEffect(() => {
    if (editFormData.date_of_birth) {
      const birthDate = new Date(editFormData.date_of_birth);
      const today = new Date();
      if (!isNaN(birthDate.getTime())) {
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        setEditFormData(prev => ({ ...prev, age: age >= 0 ? age : '' }));
      }
    }
  }, [editFormData.date_of_birth]);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Combine names for full_name
    const combinedName = `${editFormData.first_name} ${editFormData.middle_name} ${editFormData.last_name} ${editFormData.suffix}`.replace(/\s+/g, ' ').trim();
    const dataToSave = { ...editFormData, full_name: combinedName };

    const success = await onUpdate(request.id, dataToSave);
    if (success) {
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const hasComments = (Array.isArray(history) && history.some(h => h.comment || h.comments)) || !!request.admin_comment;

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

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Request Details</h2>
                <p className="text-blue-200 text-sm">{request.reference_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && canAct && !['oic_review', 'ready', 'ready_for_pickup'].includes(request.status) && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm font-medium hover:bg-white/30 flex items-center gap-2 transition-colors"
                  title="Edit Request Details"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Details</span>
                </button>
              )}
              {isEditing && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <Save className="w-4 h-4" />}
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditFormData({
                        full_name: request.full_name || request.applicant_name || '',
                        contact_number: request.contact_number || '',
                        age: request.age || '',
                        sex: request.sex || '',
                        civil_status: request.civil_status || '',
                        date_of_birth: request.date_of_birth || '',
                        address: request.address || '',
                        purpose: request.purpose || '',
                        date_of_death: request.date_of_death || '',
                        cause_of_death: request.cause_of_death || '',
                        covid_related: request.covid_related || false,
                        requestor_name: request.requestor_name || '',
                        guardian_name: request.guardian_name || '',
                        guardian_relationship: request.guardian_relationship || ''
                      });
                    }}
                    className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 flex items-center transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
              <button
                onClick={() => setShowPdfPreview(true)}
                className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm font-medium hover:bg-white/30 flex items-center gap-2 transition-colors"
                title="View Certificate Preview"
              >
                <Eye className="w-4 h-4" />
                <span>Preview PDF</span>
              </button>
              <button onClick={onClose} className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-100 bg-gray-50/50 px-6 pt-2 shrink-0">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 pt-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Request Details
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 pt-2 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <span>History & Comments</span>
              {hasComments && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              )}
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {activeTab === 'details' && (
              <>
                {/* OIC / Ready Guidance Banner */}
                {['oic_review', 'ready', 'ready_for_pickup'].includes(request.status) && (
                  <div className="bg-green-600 p-4 rounded-xl shadow-lg border-2 border-green-400 text-white mb-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Printer className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-black uppercase leading-tight">APPROVED REQUEST</h4>
                        <p className="text-sm font-bold opacity-90">Please print the certificate and contact the requestor for collection.</p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Status and Step */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}>
                      {request.status?.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="font-medium text-gray-700">{getTypeLabel(request.certificate_type)}</span>
                      {currentStep && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-blue-600 font-medium">{currentStep.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {request.residents?.pending_case && (
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black animate-pulse flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      CRITICAL: PENDING CASE RECORDED
                    </span>
                  )}
                </div>

                {/* Compact Applicant Info Grid */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-blue-500" />
                      Applicant Information
                    </h3>
                    {isEditing && (
                      <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100 italic flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Note: Changes will sync with the Residents Database
                      </span>
                    )}
                  </div>
                  <div className={`grid gap-4 text-sm ${['oic_review', 'ready', 'ready_for_pickup'].includes(request.status) ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
                    {isEditing ? (
                      <>
                        <div className="col-span-1">
                          <p className="text-xs text-gray-500 uppercase mb-0.5 font-semibold text-blue-600">First Name</p>
                          <input
                            type="text"
                            name="first_name"
                            value={editFormData.first_name}
                            onChange={handleInputChange}
                            placeholder="First Name"
                            className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold uppercase mt-1"
                          />
                        </div>
                        <div className="col-span-1">
                          <p className="text-xs text-gray-500 uppercase mb-0.5 font-semibold text-blue-600">Middle Name</p>
                          <input
                            type="text"
                            name="middle_name"
                            value={editFormData.middle_name}
                            onChange={handleInputChange}
                            placeholder="Middle Name"
                            className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold uppercase mt-1"
                          />
                        </div>
                        <div className="col-span-1">
                          <p className="text-xs text-gray-500 uppercase mb-0.5 font-semibold text-blue-600">Last Name</p>
                          <input
                            type="text"
                            name="last_name"
                            value={editFormData.last_name}
                            onChange={handleInputChange}
                            placeholder="Last Name"
                            className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold uppercase mt-1"
                          />
                        </div>
                        <div className="col-span-1">
                          <p className="text-xs text-gray-500 uppercase mb-0.5 font-semibold text-blue-600">Suffix</p>
                          <input
                            type="text"
                            name="suffix"
                            value={editFormData.suffix}
                            onChange={handleInputChange}
                            placeholder="e.g. Jr., III"
                            className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold uppercase mt-1"
                          />
                        </div>

                      </>
                    ) : (
                      <div className={['oic_review', 'ready', 'ready_for_pickup'].includes(request.status) ? "col-span-1" : "col-span-2 md:col-span-2"}>
                        <p className="text-xs text-gray-500 uppercase mb-0.5">Full Name</p>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 uppercase truncate text-base" title={request.applicant_name || request.full_name}>
                            {request.applicant_name || request.full_name || 'N/A'}
                          </p>
                          {request.residents?.pending_case && (
                            <div className="text-red-600" title="With Pending Case">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-0.5">Contact</p>
                      <p className="font-medium text-gray-900 truncate">{request.contact_number || 'N/A'}</p>
                    </div>
                    {!['oic_review', 'ready', 'ready_for_pickup'].includes(request.status) && (
                      <>
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-0.5">Date of Birth</p>
                          <p className="font-medium text-gray-900">{request.date_of_birth || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-0.5">Civil Status</p>
                          <p className="font-medium text-gray-900 uppercase">{request.civil_status || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-0.5">Age / Sex</p>
                          <p className="font-medium text-gray-900">{displayAge || '-'} / {request.sex || '-'}</p>
                        </div>
                        <div className="col-span-2 md:col-span-2">
                          <p className="text-xs text-gray-500 uppercase mb-0.5">Address</p>
                          <p className="font-medium text-gray-900 whitespace-pre-line leading-relaxed" title={request.address}>
                            {request.address || 'N/A'}
                          </p>
                        </div>

                      </>
                    )}
                  </div>
                </div>

                {/* Purpose & Timeline */}
                {!['oic_review', 'ready', 'ready_for_pickup'].includes(request.status) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isGuardianship ? (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2 text-sm uppercase">
                          <User className="w-4 h-4 text-blue-500" />
                          Guardian Information
                        </h3>
                        <div className="space-y-3 mt-1">
                          {isEditing ? (
                            <>
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Guardian's Full Name</p>
                                <input
                                  type="text"
                                  name="guardian_name"
                                  value={editFormData.guardian_name}
                                  onChange={handleInputChange}
                                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold uppercase text-sm"
                                />
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Relationship</p>
                                <select
                                  name="guardian_relationship"
                                  value={editFormData.guardian_relationship}
                                  onChange={handleInputChange}
                                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold uppercase text-sm bg-white cursor-pointer"
                                >
                                  <option value="">SELECT RELATIONSHIP...</option>
                                  <option value="PARENT">PARENT</option>
                                  <option value="GRANDPARENT">GRANDPARENT</option>
                                  <option value="SIBLING">SIBLING</option>
                                  <option value="AUNT/UNCLE">AUNT/UNCLE</option>
                                  <option value="COUSIN">COUSIN</option>
                                  <option value="STEP-PARENT">STEP-PARENT</option>
                                  <option value="LEGAL GUARDIAN">LEGAL GUARDIAN</option>
                                  <option value="OTHER">OTHER</option>
                                </select>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Guardian's Full Name</p>
                                <p className="font-bold text-gray-900 uppercase">{request.guardian_name || 'NOT SPECIFIED'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Relationship</p>
                                <p className="font-bold text-gray-900 uppercase">{request.guardian_relationship || 'NOT SPECIFIED'}</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-col">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2 text-sm">
                          <FileCheck className="w-4 h-4 text-blue-500" />
                          Purpose
                        </h3>
                        {isEditing ? (
                          <textarea
                            name="purpose"
                            value={editFormData.purpose}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-sm mt-1 uppercase h-24"
                          />
                        ) : (
                          <p className="text-sm text-gray-700 leading-relaxed font-medium mt-1 flex-1">
                            {request.purpose || 'Not specified'}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2 text-sm">
                        <History className="w-4 h-4 text-blue-500" />
                        Timeline
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Submitted</span>
                          <span className="font-medium">{formatDate(request.created_at)}</span>
                        </div>
                        {request.updated_at && request.updated_at !== request.created_at && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Updated</span>
                            <span className="font-medium">{formatDate(request.updated_at)}</span>
                          </div>
                        )}
                        {request.admin_comment && (
                          <div className="mt-2 text-xs bg-orange-50 text-orange-800 p-2 rounded border border-orange-100 italic">
                            <span className="font-bold not-italic">Admin Note:</span> {request.admin_comment}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {(request.certificate_type === 'natural_death' || request.certificate_type === 'natural-death' || request.certificate_type?.toLowerCase().includes('death') || request.purpose?.toLowerCase().includes('death')) && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mt-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                        <Activity className="w-4 h-4 text-blue-500" />
                        Death Certification Details
                      </h3>
                    </div>

                    <div className="grid gap-4 text-sm grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                      {isEditing ? (
                        <>
                          <div className="col-span-1">
                            <p className="text-xs text-gray-500 uppercase mb-0.5 font-semibold text-blue-600">Date of Death</p>
                            <input
                              type="date"
                              name="date_of_death"
                              value={editFormData.date_of_death ? new Date(editFormData.date_of_death).toISOString().split('T')[0] : ''}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold uppercase mt-1"
                            />
                          </div>
                          <div className="col-span-1">
                            <p className="text-xs text-gray-500 uppercase mb-0.5 font-semibold text-blue-600">Cause of Death</p>
                            <input
                              type="text"
                              name="cause_of_death"
                              value={editFormData.cause_of_death}
                              onChange={handleInputChange}
                              placeholder="Cause of Death"
                              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold uppercase mt-1"
                            />
                          </div>
                          <div className="col-span-1">
                            <p className="text-xs text-gray-500 uppercase mb-0.5 font-semibold text-blue-600">COVID-19 Related</p>
                            <select
                              name="covid_related"
                              value={editFormData.covid_related ? 'true' : 'false'}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, covid_related: e.target.value === 'true' }))}
                              className="w-full px-3 py-1.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold uppercase mt-1 bg-white"
                            >
                              <option value="false">NO / NEGATIVE</option>
                              <option value="true">YES / POSITIVE</option>
                            </select>
                          </div>
                          <div className="col-span-1">
                            <p className="text-xs text-gray-500 uppercase mb-0.5 font-semibold text-blue-600">Requestor Name</p>
                            <input
                              type="text"
                              name="requestor_name"
                              value={editFormData.requestor_name}
                              onChange={handleInputChange}
                              placeholder="Requestor Name"
                              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold uppercase mt-1"
                            />
                          </div>
                          <div className="col-span-1">
                            <p className="text-xs text-gray-500 uppercase mb-0.5 font-semibold text-blue-600">Requestor Contact</p>
                            <input
                              type="text"
                              name="contact_number"
                              value={editFormData.contact_number}
                              onChange={handleInputChange}
                              placeholder="Contact Number"
                              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold uppercase mt-1"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-0.5">Date of Death</p>
                            <p className="font-bold text-gray-900 uppercase">
                              {(request.date_of_death || request.residents?.date_of_death) ? new Date(request.date_of_death || request.residents.date_of_death).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'NOT RECORDED'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-0.5">Cause of Death</p>
                            <p className="font-bold text-gray-900 uppercase truncate" title={request.cause_of_death || request.residents?.cause_of_death || 'NOT STATED'}>
                              {request.cause_of_death || request.residents?.cause_of_death || 'NOT STATED'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-0.5">COVID-19 Related</p>
                            <div className="mt-1">
                              {(() => {
                                const covidVal = request.covid_related ?? request.residents?.covid_related;
                                const isCovid = covidVal === true || covidVal === 'true' || covidVal === 'Yes';
                                return (
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${isCovid ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                                    {isCovid ? 'YES / POSITIVE' : 'NO / NEGATIVE'}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-0.5">Requestor Name</p>
                            <p className="font-bold text-gray-900 uppercase truncate" title={request.requestor_name || 'NOT SPECIFIED'}>
                              {request.requestor_name || 'NOT SPECIFIED'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-0.5">Requestor Contact</p>
                            <p className="font-bold text-gray-900">
                              {request.contact_number || 'NOT SPECIFIED'}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'history' && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 min-h-[400px]">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3 text-sm">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Request History & Comments
                </h3>

                {Array.isArray(history) && history.length > 0 ? (
                  <div className="space-y-4">
                    {history.map((entry, index) => (
                      <div key={index} className="flex gap-3 text-sm">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${entry.action === 'approve' ? 'bg-green-100 text-green-600' :
                            entry.action === 'reject' ? 'bg-red-100 text-red-600' :
                              entry.action === 'return' ? 'bg-orange-100 text-orange-600' :
                                'bg-blue-100 text-blue-600'
                            }`}>
                            {entry.action === 'approve' ? <CheckCircle className="w-4 h-4" /> :
                              entry.action === 'reject' ? <XCircle className="w-4 h-4" /> :
                                entry.action === 'return' ? <RotateCcw className="w-4 h-4" /> :
                                  <FileText className="w-4 h-4" />}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-gray-900">
                              {entry.users
                                ? `${entry.users.first_name || ''} ${entry.users.last_name || ''}`.trim() || entry.users.email
                                : (entry.performed_by_name || entry.performed_by_email || 'System Log')}
                            </p>
                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                              {new Date(entry.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">
                            {entry.action === 'approve' ? 'Approved -' :
                              entry.action === 'reject' ? 'Rejected -' :
                                entry.action === 'return' ? 'Returned -' :
                                  'Updated -'} {entry.step_name}
                          </p>
                          {(entry.comments || entry.comment) && (
                            <div className="bg-white p-2 rounded border border-gray-200 text-gray-700 italic">
                              "{entry.comments || entry.comment}"
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm italic">
                    No activity or comments recorded yet.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {canAct && ['pending', 'processing', 'staff_review', 'secretary_approval', 'captain_approval', 'oic_review', 'ready', 'ready_for_pickup', 'returned'].includes(request.status) && (
            <div className="border-t bg-gray-50 px-6 py-4 pb-6 shrink-0 mt-auto">
              {request.residents?.pending_case && (
                <div className="bg-red-600 p-4 rounded-xl shadow-lg border-2 border-red-400 text-white mb-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <ShieldAlert className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Legal Hold Notification</p>
                      <h4 className="text-lg font-black uppercase leading-tight">This applicant has a PENDING CASE</h4>
                      <div className="mt-3 p-3 bg-black/20 rounded-lg border border-white/20">
                        <p className="text-[10px] font-bold uppercase mb-1 opacity-70">Official Record History / Remarks:</p>
                        <p className="text-sm font-semibold italic">"{request.residents.case_record_history || 'No detail remarks provided.'}"</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep?.status === 'staff_review' ? (
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => onAction(request, 'reject')}
                    disabled={isEditing}
                    className={`px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium flex items-center gap-2 transition-all ${isEditing ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-red-200'}`}
                  >
                    <XCircle className="w-4 h-4" />
                    Not Legitimate
                  </button>
                  <button
                    onClick={() => onAction(request, 'approve')}
                    disabled={isEditing}
                    className={`px-4 py-2 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 transition-all ${isEditing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Verify & Forward
                  </button>
                </div>
              ) : (
                <div className="flex gap-3 justify-end">
                  {['ready', 'ready_for_pickup'].includes(request.status) ? (
                    <button
                      onClick={() => onAction(request, 'approve')}
                      disabled={isEditing}
                      className={`px-4 py-2 bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 transition-all ${isEditing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Released
                    </button>
                  ) : (
                    <>
                      {!['oic_review', 'ready', 'ready_for_pickup'].includes(request.status) && (
                        <>
                          <button
                            onClick={() => onAction(request, 'return')}
                            disabled={isEditing}
                            className={`px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium flex items-center gap-2 transition-all ${isEditing ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-orange-200'}`}
                          >
                            <RotateCcw className="w-4 h-4" />
                            Send Back
                          </button>
                          <button
                            onClick={() => onAction(request, 'reject')}
                            disabled={isEditing}
                            className={`px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium flex items-center gap-2 transition-all ${isEditing ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-red-200'}`}
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => onAction(request, 'approve')}
                        disabled={isEditing}
                        className={`px-4 py-2 bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 transition-all ${isEditing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {request.status === 'captain_approval' ? 'Approve' : (request.status === 'oic_review' ? 'Ready to Pickup' : 'Forward')}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Action Modal Component
function ActionModal({ request, actionType, comment, setComment, onSubmit, onClose, processing, currentStep, userSignature, history = [] }) {
  const [tempSignature, setTempSignature] = useState(null);
  const [showSignPad, setShowSignPad] = useState(false);

  // Dynamic config based on current step
  const isReviewStep = currentStep?.status === 'staff_review';

  const config = {
    approve: isReviewStep ? {
      title: 'Verify & Forward Request',
      description: 'I confirm that the resident is legitimate and the request is valid.',
      icon: CheckCircle,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonBg: 'bg-blue-600 hover:bg-blue-700',
      buttonText: 'Verify & Forward'
    } : (request.status === 'oic_review') ? {
      title: 'Ready for Pickup',
      description: 'Mark this certificate as ready for the resident to collect.',
      icon: CheckCircle,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      buttonBg: 'bg-indigo-600 hover:bg-indigo-700',
      buttonText: 'Ready to Pickup'
    } : (['ready', 'ready_for_pickup'].includes(request.status)) ? {
      title: 'Release Certificate',
      description: 'Confirm that this certificate has been officially released to the resident.',
      icon: CheckCircle,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonBg: 'bg-green-600 hover:bg-green-700',
      buttonText: 'Confirm Release'
    } : {
      title: 'Approve Request',
      description: 'Are you sure you want to approve this certificate request?',
      icon: CheckCircle,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonBg: 'bg-green-600 hover:bg-green-700',
      buttonText: (currentStep?.status === 'captain_approval' || request.status === 'captain_approval') ? 'Approve Request' : 'Forward Request'
    },
    reject: isReviewStep ? {
      title: 'Mark as Not Legitimate',
      description: 'Please provide a reason why this request is not legitimate.',
      icon: XCircle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonBg: 'bg-red-600 hover:bg-red-700',
      buttonText: 'Reject Request'
    } : {
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

  const isEsignRole = currentStep && currentStep.officialRole && currentStep.officialRole !== 'None';
  const canUseEsign = actionType === 'approve' && !['oic_review', 'ready', 'ready_for_pickup'].includes(request.status); // Disable sign pad for OIC/Ready steps

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

            {/* Signature Section - Unified and Clear */}
            {canUseEsign && (
              <div className="mb-6 border-t pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-900">Digital Signature Preview</span>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-medium text-blue-600 flex items-center gap-1 uppercase tracking-wider">
                      {isEsignRole ? `Signing as: ${currentStep.officialRole}` : 'Digital Signature'}
                    </p>

                  </div>

                  {!showSignPad && (userSignature || tempSignature) ? (
                    <div className="bg-white rounded-lg h-24 flex items-center justify-center border border-blue-200 relative group">
                      <img
                        src={tempSignature || userSignature}
                        alt="Signature Preview"
                        className="max-h-full max-w-full object-contain p-2"
                      />
                      <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors pointer-events-none rounded-lg" />
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg overflow-hidden border border-blue-200">
                      <SignaturePad
                        onSignatureChange={(sig) => setTempSignature(sig)}
                        height={120}
                        label=""
                      />
                      <div className="bg-blue-100 p-2 text-center">
                        <button
                          type="button"
                          onClick={() => setShowSignPad(false)}
                          disabled={!tempSignature}
                          className="text-xs font-bold text-blue-700 hover:text-blue-900 disabled:opacity-50"
                        >
                          USE THIS SIGNATURE
                        </button>
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-500 mt-2 text-center text-italic">
                    Your signature will be attached only if you click "Sign & {currentStep?.status === 'captain_approval' ? 'Approve' : 'Forward'}".
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={onClose}
                disabled={processing}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 order-3 sm:order-1"
              >
                Cancel
              </button>

              {actionType === 'approve' && canUseEsign ? (
                <>
                  <button
                    onClick={() => onSubmit(null)}
                    disabled={processing}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 order-2"
                  >
                    {(currentStep?.status === 'captain_approval' || request.status === 'captain_approval') ? 'Approve Only' : 'Forward Only'}
                  </button>
                  <button
                    onClick={() => onSubmit(tempSignature || userSignature)}
                    disabled={processing || (!tempSignature && !userSignature)}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50 order-1"
                  >
                    {processing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <PenTool className="w-4 h-4" />
                    )}
                    {(currentStep?.status === 'captain_approval' || request.status === 'captain_approval') ? 'Sign & Approve' : 'Sign & Forward'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onSubmit(null)}
                  disabled={processing || (['reject', 'return'].includes(actionType) && !comment.trim())}
                  className={`flex-1 px-4 py-3 ${cfg.buttonBg} text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 order-1`}
                >
                  {processing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <cfg.icon className="w-4 h-4" />
                  )}
                  {cfg.buttonText}
                </button>
              )}
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
  logos: { leftLogo: '/iba-o-este.png', rightLogo: '/calumpit.png', logoSize: 115, captainImage: '/images/brgycaptain.png' },
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
  const [history, setHistory] = useState([]);
  const [currentDate, setCurrentDate] = useState('');

  const fetchHistory = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/workflow-assignments/history/${request.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

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
    fetchHistory();

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
              @page {size: A4 portrait; margin: 0; }
              @media print {
                html, body {width: 210mm; height: 297mm; margin: 0; padding: 0; }
              * {-webkit - print - color - adjust: exact !important; print-color-adjust: exact !important; }
          }
              body {margin: 0; padding: 0; display: flex; justify-content: center; }
              .certificate {width: 210mm; min-height: 297mm; padding: 8mm; box-sizing: border-box; background: white; }
            </style>
        </head>
        <body>
          <div class="certificate">${printContent.innerHTML}</div>
          <script>
            window.onload = function() {
              setTimeout(function () {
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
      const imgY = 0;

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
              {(request.status === 'oic_review' || (history?.some(h => h.step_name?.toLowerCase().includes('oic')) && request.status === 'ready')) && (
                <>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all font-medium text-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all font-medium text-sm disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Download
                  </button>
                </>
              )}              <button onClick={onClose} className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg ml-2">
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
              history={history}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Certificate Preview Component - Exact copy from BarangayClearanceModal
function ClearancePreviewForRequests({ request, currentDate, officials, certificateRef, history = [] }) {
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
    dateOfDeath: request.date_of_death || request.residents?.date_of_death || '',
    causeOfDeath: request.cause_of_death || request.residents?.cause_of_death || '',
    covidRelated: (request.covid_related ?? request.residents?.covid_related) ? 'Yes' : 'No',
    requestorName: request.requestor_name || '',
    guardianName: request.guardian_name || '',
    guardianRelationship: request.guardian_relationship || '',
    purpose: Array.isArray(request.purpose) ? request.purpose.join('\n') : (request.purpose || '')
  };

  const isNaturalDeath =
    String(request.certificate_type || '').toLowerCase().includes('death') ||
    String(request.purpose || '').toLowerCase().includes('death') ||
    String(request.reference_number || '').toUpperCase().startsWith('ND');

  const isGuardianship =
    String(request.certificate_type || '').toLowerCase().includes('guardian') ||
    String(request.reference_number || '').toUpperCase().startsWith('GD');

  // Determine Issued Date (Final Approval Date or Current Date)
  const captainApproval = history?.find(h =>
    h.action === 'approve' &&
    (h.step_name?.toLowerCase().includes('captain') || h.step_name?.toLowerCase().includes('chairman') || h.officialRole === 'Brgy. Captain' || h.official_role === 'Brgy. Captain')
  );

  const issuedDate = captainApproval?.created_at
    ? new Date(captainApproval.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="p-1 flex justify-center print:p-0">
      {/* A4 Size Container - 210mm x 297mm */}
      <div ref={certificateRef} className={`certificate-container bg-white shadow-lg print:shadow-none flex flex-col ${getFontClass(bodyStyle.fontFamily)}`} style={{ width: '210mm', minHeight: '297mm', padding: '0', boxSizing: 'border-box' }}>

        {/* Header Section */}
        <div className={`w-full border-b flex justify-center items-center pt-4 pb-6 px-8 flex-shrink-0 ${getFontClass(headerStyle.fontFamily)}`}
          style={{
            backgroundColor: headerStyle.bgColor,
            borderColor: headerStyle.borderColor
          }}>
          {/* Left Logo */}
          <div style={{
            width: `${(logos.logoSize && logos.logoSize > 80) ? logos.logoSize : 130}px`,
            height: `${(logos.logoSize && logos.logoSize > 80) ? logos.logoSize : 130}px`,
            marginRight: `${headerStyle.logoSpacing || 0}px`
          }} className="flex-shrink-0">
            {logos.leftLogo && <img src={logos.leftLogo} className="w-full h-full object-contain" alt="Left" />}
          </div>

          {/* Text Content */}
          <div className="text-center flex flex-col justify-center">
            <p className={getFontClass(countryStyle.fontFamily)} style={{ color: countryStyle.color, fontSize: '13px', fontWeight: countryStyle.fontWeight, lineHeight: '1.2' }}>{officials.headerInfo?.country || 'Republic of the Philippines'}</p>
            <p className={getFontClass(provinceStyle.fontFamily)} style={{ color: provinceStyle.color, fontSize: '13px', fontWeight: provinceStyle.fontWeight, lineHeight: '1.2' }}>{officials.headerInfo?.province || 'Province of Bulacan'}</p>
            <p className={getFontClass(municipalityStyle.fontFamily)} style={{ color: municipalityStyle.color, fontSize: '13px', fontWeight: municipalityStyle.fontWeight, lineHeight: '1.2' }}>{officials.headerInfo?.municipality || 'Municipality of Calumpit'}</p>
            <p className="mt-1 uppercase" style={{ color: barangayNameStyle.color || '#1e40af', fontSize: '18px', fontWeight: 'bold', lineHeight: '1.2' }}>{officials.headerInfo?.barangayName || "BARANGAY IBA O' ESTE"}</p>
            <p className="mt-2 text-red-700 font-bold uppercase tracking-wider" style={{ fontSize: '14px' }}>OFFICE OF THE BARANGAY CHAIRMAN</p>
          </div>

          {/* Right Logo */}
          <div style={{
            width: `${(logos.logoSize && logos.logoSize > 80) ? logos.logoSize : 130}px`,
            height: `${(logos.logoSize && logos.logoSize > 80) ? logos.logoSize : 130}px`,
            marginLeft: `${headerStyle.logoSpacing || 0}px`
          }} className="flex-shrink-0">
            {logos.rightLogo && <img src={logos.rightLogo} className="w-full h-full object-contain" alt="Right" />}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 relative">
          {/* Sidebar (Conditional) - Only show if enabled AND content exists */}
          {sidebarStyle.showSidebar && (
            <div className={`w-64 p-6 flex flex-col text-center flex-shrink-0 ${getFontClass(sidebarStyle.fontFamily)}`} style={{
              background: `linear-gradient(to bottom, ${sidebarStyle.bgColor || '#1e40af'}, ${sidebarStyle.gradientEnd || '#1e3a8a'})`,
              color: sidebarStyle.textColor || '#ffffff'
            }}>
              {/* Reuse existing sidebar structure if needed, or simplify to match layout. Keeping simple consistency. */}
              <div className="text-center mb-4">
                <p className="font-bold" style={{ fontSize: `${(sidebarStyle.titleSize || 16) + 4}px` }}>BARANGAY</p>
                <p className="font-bold" style={{ fontSize: `${(sidebarStyle.titleSize || 16) + 4}px` }}>IBA O' ESTE</p>
              </div>
              {/* ... officials list preserved in simplified form or assume existing structure matches ... */}
              {/* For brevity in this large replacement, I'll render the key officials similar to before */}
              <div className="border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                <p className="font-bold mb-3" style={{ fontSize: `${(sidebarStyle.titleSize || 13) + 2}px`, color: sidebarStyle.labelColor }}>BARANGAY COUNCIL</p>
                <div className="mb-3">
                  <div className="mb-2 w-24 h-32 mx-auto bg-black/10 rounded overflow-hidden">
                    {logos.captainImage && <img src={logos.captainImage} className="w-full h-full object-cover" />}
                  </div>
                  <p className="text-xs opacity-80">Punong Barangay</p>
                  <p className="font-semibold text-sm">{officials.chairman}</p>
                </div>
                {officials.councilors?.slice(0, 7).map((c, i) => <p key={i} className="text-xs leading-snug">{c}</p>)}
              </div>
            </div>
          )}

          {/* Document Body */}
          <div className="flex-1 px-20 pt-6 pb-2 relative flex flex-col" style={{ backgroundColor: bodyStyle.bgColor || '#ffffff', color: bodyStyle.textColor || '#000000', fontFamily: bodyStyle.fontFamily }}>
            {/* Watermark */}
            {logos.leftLogo && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
                <img src={logos.leftLogo} className="w-3/4 object-contain" alt="Watermark" />
              </div>
            )}

            <div className="relative z-10 flex flex-col items-center flex-1">
              <h2 className="text-center font-bold mb-10 border-b-4 border-black inline-block pb-1 px-4 uppercase leading-normal" style={{
                color: '#004d40',
                fontSize: '24px',
              }}>
                {isNaturalDeath ? 'NATURAL DEATH CERTIFICATION' :
                  isGuardianship ? 'BARANGAY CERTIFICATION FOR GUARDIANSHIP' :
                    request.certificate_type === 'barangay_clearance' ? 'BARANGAY CLEARANCE CERTIFICATE' :
                      request.certificate_type === 'certificate_of_indigency' ? 'CERTIFICATE OF INDIGENCY' :
                        request.certificate_type === 'barangay_residency' ? 'BARANGAY RESIDENCY CERTIFICATE' : 'CERTIFICATE'}
              </h2>

              <div className="w-full space-y-6 text-justify" style={{ fontSize: '15px' }}>
                <div className="flex justify-between items-center mb-6">
                  <p className="font-bold text-lg">TO WHOM IT MAY CONCERN:</p>
                </div>  {/* Date removed for Indigency as per new layout */}

                <>
                  <div className="text-left mb-6 leading-relaxed">
                    {isNaturalDeath ? (
                      <p>This is to certify that below mentioned person, a bona fide resident of this barangay has died at his residence and classified as "Natural Death":</p>
                    ) : isGuardianship ? (
                      <p className="uppercase">
                        THIS IS TO CERTIFY THAT BELOW PERSON IS UNDER THE GUARDIANSHIP OF <span className="font-bold">{formData.guardianName?.toUpperCase() || "_________________________________"}</span>, BOTH BONA FIDE RESIDENTS OF THIS BARANGAY:
                      </p>
                    ) : (
                      <p>
                        {request.certificate_type === 'barangay_clearance' ?
                          'This is to certify that below mentioned person is a bona fide resident of this barangay and has no derogatory record as of date mentioned below:' :
                          request.certificate_type === 'certificate_of_indigency' ?
                            'This is to certify that below mentioned person is a bona fide resident and their family belongs to the "Indigent Families" of this barangay as of date mentioned below. Further certifying that their income is not enough to sustain and support their basic needs:' :
                            'This is to certify that below mentioned person is a bona fide resident of this barangay as detailed below:'}
                      </p>
                    )}
                  </div>

                  <div className="mb-6 space-y-1">
                    {([
                      ['Name', formData.fullName?.toUpperCase()],
                      ['Age', formData.age],
                      ['Sex', formData.sex?.toUpperCase()],
                      ['Civil Status', formData.civilStatus?.toUpperCase()],
                      ['Residential Address', formData.address?.toUpperCase()],
                    ]
                      .concat(isNaturalDeath ? [
                        ['Date of Death', formData.dateOfDeath ? new Date(formData.dateOfDeath).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : ''],
                        ['Cause of Death', formData.causeOfDeath?.toUpperCase()],
                        ['COVID-19 Related', formData.covidRelated?.toUpperCase()]
                      ] : isGuardianship ? [
                        ['Date of Birth', formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : ''],
                        ["Guardian's Relationship", formData.guardianRelationship?.toUpperCase()]
                      ] : [
                        ['Date of Birth', formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : ''],
                        ['Place of Birth', formData.placeOfBirth?.toUpperCase()]
                      ])
                    ).map(([label, value]) => (
                      <div key={label} className="grid grid-cols-[180px_10px_1fr] items-baseline text-black">
                        <span className="font-normal">{label}</span>
                        <span className="font-normal">:</span>
                        <span className={label === 'Name' ? 'font-bold' : 'font-normal'}>{value || '_________________'}</span>
                      </div>
                    ))}
                  </div>

                  {isNaturalDeath || isGuardianship ? (
                    <p className={`mb-10 text-left leading-relaxed ${isGuardianship ? 'uppercase' : ''}`}>
                      Issued this {issuedDate.toUpperCase()} at Barangay Iba O' Este, Calumpit, Bulacan upon the request of <span className={isGuardianship ? "" : "font-bold"}>{isGuardianship ? "ABOVE MENTIONED PERSONS" : (formData.requestorName ? formData.requestorName.toUpperCase() : "THE ABOVE PERSON'S RELATIVES")}</span> for any legal purposes it may serve.
                    </p>
                  ) : (
                    <>
                      <div className="mb-6">
                        <p className="mb-3">
                          Being issued upon the request of above mentioned person for below purpose(s):
                        </p>
                        <div className="pl-8 space-y-1 font-bold">
                          {formData.purpose ? (
                            formData.purpose.split('\n').map((line, idx) => (
                              <div key={idx} className="flex gap-2">
                                <span>{idx + 1}.</span>
                                <span>{line.toUpperCase()}</span>
                              </div>
                            ))
                          ) : (
                            <p>• PURPOSE NOT SPECIFIED</p>
                          )}
                        </div>
                      </div>

                      <p className="mb-10 text-left">
                        Issued this {issuedDate} at Barangay Iba O' Este, Calumpit, Bulacan.
                      </p>
                    </>
                  )}

                  {/* Unified Signature Section (Left Aligned for All) */}
                  <div
                    className="relative text-left"
                    style={{
                      marginTop: isGuardianship ? '120px' : (request.certificate_type === 'certificate_of_indigency' ? '32px' : '64px')
                    }}
                  >
                    {isNaturalDeath && <div className="h-10"></div>}
                    {!isNaturalDeath && !isGuardianship && (
                      <div className={`${request.certificate_type === 'certificate_of_indigency' ? 'mb-8' : 'mb-12'}`}>
                        <div className={`${request.certificate_type === 'certificate_of_indigency' ? 'h-12' : 'h-16'}`}></div>
                        <div className="border-t border-black w-64 pt-1">
                          <p className="text-[15px]">Resident's Signature / Thumb Mark</p>
                        </div>
                      </div>
                    )}

                    <div className="text-left mb-4 self-start">
                      <p className="font-bold text-[15px] mb-12">TRULY YOURS,</p>

                      <div className="relative inline-block">
                        {/* Big Backdrop Signature centered horizontally but positioned above name */}
                        {captainApproval?.signature_data && (
                          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[80%] w-60 h-32 pointer-events-none flex items-center justify-center z-20" style={{ mixBlendMode: 'multiply' }}>
                            <img src={captainApproval.signature_data} className="w-full h-full object-contain" alt="Captain Sig" />
                          </div>
                        )}

                        <p className="uppercase font-bold mb-1 relative z-10" style={{ fontSize: '20px' }}>
                          {officials.chairman}
                        </p>

                        <div className="relative flex items-center z-10">
                          <p className="text-[15px] font-bold shrink-0">BARANGAY CHAIRMAN</p>

                          {/* Additional Forwarder Signatures (Backdrop Overlay - does not affect text layout) */}
                          <div className="absolute left-32 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none" style={{ mixBlendMode: 'multiply' }}>
                            {(() => {
                              const seenSignatories = new Set();
                              return history
                                ?.filter(h => {
                                  if (h.action !== 'approve' || !h.signature_data) return false;

                                  // Skip captain/chairman signatures as they are handled separately above
                                  const isCaptain = h.step_name?.toLowerCase().includes('captain') ||
                                    h.step_name?.toLowerCase().includes('chairman') ||
                                    h.officialRole === 'Brgy. Captain' ||
                                    h.official_role === 'Brgy. Captain';
                                  if (isCaptain) return false;

                                  // Unique per person
                                  if (seenSignatories.has(h.performed_by)) return false;
                                  seenSignatories.add(h.performed_by);
                                  return true;
                                })
                                .map((sigEntry, idx) => (
                                  <div key={idx} className="h-12 w-28">
                                    <img
                                      src={sigEntry.signature_data}
                                      className="h-full w-full object-contain"
                                      alt="Official Sig"
                                    />
                                  </div>
                                ));
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              </div>

              {/* Reference Number Section */}
              <div className="w-full text-right mt-auto mb-2">
                <p className="text-sm">Reference No: <strong>{request.reference_number || request.id}</strong></p>
              </div>

              {/* Footer Divider and info */}
              <div className="w-full border-t border-gray-400 pt-1 text-[11px] leading-tight pb-4">
                <div className="flex flex-col items-start text-gray-700 gap-0.5">
                  <p><strong>Address:</strong> {officials.contactInfo?.address}</p>
                  <p><strong>Contact:</strong> {officials.contactInfo?.contactPerson} Tel No.: {officials.contactInfo?.telephone} email: {officials.contactInfo?.email}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}


// Confirm Pickup Modal Component
function ConfirmPickupModal({ certificate, onClose, onConfirm, pickupName, setPickupName, confirming, getTypeLabel }) {
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Confirm Certificate Pickup
            </h3>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="text-xs text-green-600 uppercase font-black tracking-wider mb-2">Certificate Details</p>
              <p className="text-xl font-mono font-bold text-green-900 mb-1">{certificate.reference_number}</p>
              <p className="text-sm font-medium text-green-800 mb-3">{getTypeLabel(certificate.certificate_type)}</p>

              <div className="pt-3 border-t border-green-200">
                <p className="text-xs text-green-600 uppercase font-black tracking-wider mb-1">Registered Applicant</p>
                <p className="text-lg font-bold text-green-900">{certificate.full_name || certificate.applicant_name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">
                Name of Person Picking Up *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={pickupName}
                  onChange={(e) => setPickupName(e.target.value)}
                  placeholder="Enter receiver's full name"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none font-medium"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && pickupName.trim() && onConfirm()}
                />
              </div>
              <p className="text-xs text-gray-500 italic">
                Please verify the ID of the person picking up the certificate.
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                disabled={confirming}
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm()}
                disabled={confirming || !pickupName.trim()}
                className="flex-[2] px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-200 transition-all"
              >
                {confirming ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirm Pickup
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
