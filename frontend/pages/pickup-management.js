import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import Layout from '@/components/Layout/Layout';
import {
  FileCheck, Search, Eye, Calendar, User, Phone, MapPin,
  Shield, Clock, CheckCircle, AlertTriangle, QrCode,
  ExternalLink, RefreshCw, Package, History, XCircle, X, ChevronDown
} from 'lucide-react';
import { getAuthToken } from '@/lib/auth';

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

export default function PickupManagementPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState([]);
  const [pickupRecords, setPickupRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ready');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmingCertificate, setConfirmingCertificate] = useState(null);
  const [confirmingPickup, setConfirmingPickup] = useState(false);
  const [pickupName, setPickupName] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const handleManualRelease = async (certificateId, pickedUpBy) => {
    if (!pickedUpBy?.trim()) {
      toast.error('Please enter the name of the person picking up the certificate');
      return;
    }

    setConfirmingPickup(true);
    try {
      const token = getAuthToken();
      // Using the standard status update endpoint for manual release
      const response = await fetch(`${API_URL}/api/certificates/${certificateId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'released',
          action: 'pickup',
          comment: `Manually released to: ${pickedUpBy}`
        })
      });

      const data = await response.json();
      if (data.success) {
        setIsConfirmModalOpen(false);
        const refNum = confirmingCertificate?.reference_number;
        setPickupName('');
        setSelectedCertificate(null);
        handleRefresh();

        // Custom enhanced notification box
        toast.success(`Success! Certificate ${refNum || ''} has been marked as picked up.`, {
          duration: 5000,
          style: {
            minWidth: '350px',
            padding: '20px',
            borderRadius: '16px',
            background: '#FFFFFF',
            color: '#1F2937',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            borderLeft: '6px solid #10B981',
            fontWeight: '600'
          },
        });
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to process pickup. Please try again.');
    } finally {
      setConfirmingPickup(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
    fetchPickupRecords();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/certificates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCertificates(data.certificates || []);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPickupRecords = async () => {
    try {
      const token = getAuthToken();
      // This would be a new endpoint to get all pickup records
      const response = await fetch(`${API_URL}/api/pickup/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPickupRecords(data.pickups || []);
        }
      }
    } catch (error) {
      console.error('Error fetching pickup records:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchCertificates(), fetchPickupRecords()]);
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'submitted': 'bg-blue-100 text-blue-800 border-blue-200',
      'under_review': 'bg-purple-100 text-purple-800 border-purple-200',
      'processing': 'bg-purple-100 text-purple-800 border-purple-200',
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

  const openPickupVerification = (certificate) => {
    setConfirmingCertificate(certificate);
    setPickupName(certificate.full_name || certificate.applicant_name || '');
    setIsConfirmModalOpen(true);
  };

  // Filter certificates
  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch =
      cert.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.applicant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'ready' ? ['ready', 'ready_for_pickup'].includes(cert.status) : cert.status === statusFilter);

    const matchesType = typeFilter === 'all' || cert.certificate_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Get statistics
  const stats = {
    readyForPickup: certificates.filter(c => ['ready', 'ready_for_pickup'].includes(c.status)).length,
    released: certificates.filter(c => c.status === 'released').length,
    totalProcessed: certificates.filter(c => ['ready', 'ready_for_pickup', 'released'].includes(c.status)).length
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Certificate Pickup Management</h1>
            <p className="text-gray-500 mt-1">Manage certificate pickups and verification</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-100 text-sm">Ready for Pickup</p>
                <p className="text-3xl font-bold">{stats.readyForPickup}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Package className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Released</p>
                <p className="text-3xl font-bold">{stats.released}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Processed</p>
                <p className="text-3xl font-bold">{stats.totalProcessed}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <History className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter('ready')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${statusFilter === 'ready'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <Package className="w-4 h-4" />
                Ready for Pickup ({stats.readyForPickup})
              </button>
              <button
                onClick={() => setStatusFilter('released')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${statusFilter === 'released'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <CheckCircle className="w-4 h-4" />
                Released ({stats.released})
              </button>
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
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-48 text-sm"
                />
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

        {/* Certificates Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading certificates...</p>
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No certificates found</p>
              <p className="text-gray-400 text-sm mt-1">
                {statusFilter === 'ready'
                  ? 'No certificates are currently ready for pickup'
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
                <tbody className="divide-y divide-gray-200">
                  {filteredCertificates.map((certificate) => (
                    <tr key={certificate.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-blue-600">{certificate.reference_number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{certificate.applicant_name || certificate.full_name}</p>
                            <p className="text-xs text-gray-500">{certificate.contact_number || 'No contact'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getTypeColor(certificate.certificate_type)}`}></div>
                          <span className="text-sm font-medium text-gray-700">{getTypeLabel(certificate.certificate_type)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(certificate.status)}`}>
                          {certificate.status?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 font-medium">
                          {certificate.status === 'released' ? 'Distribution Complete' : 'Verification Ready'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {formatDate(certificate.updated_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedCertificate(certificate)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>

                          {['ready', 'ready_for_pickup'].includes(certificate.status) && (
                            <button
                              onClick={() => openPickupVerification(certificate)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 text-sm shadow-sm transition-all active:scale-95"
                              title="Confirm Pickup"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Confirm Pickup
                            </button>
                          )}

                          {certificate.status === 'released' && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold border border-gray-200">
                              PICKED UP
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Certificate Details Modal */}
        {selectedCertificate && (
          <CertificateDetailsModal
            certificate={selectedCertificate}
            onClose={() => setSelectedCertificate(null)}
            getStatusColor={getStatusColor}
            getTypeLabel={getTypeLabel}
            formatDate={formatDate}
            openPickupVerification={() => openPickupVerification(selectedCertificate)}
            handleManualRelease={handleManualRelease}
          />
        )}

        {/* Pickup Confirmation Modal */}
        {isConfirmModalOpen && confirmingCertificate && (
          <ConfirmPickupModal
            certificate={confirmingCertificate}
            onClose={() => setIsConfirmModalOpen(false)}
            onConfirm={handleManualRelease}
            pickupName={pickupName}
            setPickupName={setPickupName}
            confirming={confirmingPickup}
            getTypeLabel={getTypeLabel}
          />
        )}
      </div>
    </Layout>
  );
}

// Certificate Details Modal Component
function CertificateDetailsModal({ certificate, onClose, getStatusColor, getTypeLabel, formatDate, openPickupVerification, handleManualRelease }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <FileCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Certificate Details</h2>
                <p className="text-blue-200 text-sm">{certificate.reference_number}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg">
              <ExternalLink className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)] space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(certificate.status)}`}>
                {certificate.status?.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span className="text-sm text-gray-500">{getTypeLabel(certificate.certificate_type)}</span>
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
                    <p className="font-medium text-gray-900">{certificate.applicant_name || certificate.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Contact Number</p>
                    <p className="font-medium text-gray-900">{certificate.contact_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Age</p>
                    <p className="font-medium text-gray-900">{certificate.age || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Sex</p>
                    <p className="font-medium text-gray-900">{certificate.sex || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Address</p>
                    <p className="font-medium text-gray-900">{certificate.address || 'N/A'}</p>
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
                  <p className="text-gray-700">{certificate.purpose || 'Not specified'}</p>
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
                      <span className="font-medium">{formatDate(certificate.created_at)}</span>
                    </div>
                    {certificate.updated_at && certificate.updated_at !== certificate.created_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Last Updated</span>
                        <span className="font-medium">{formatDate(certificate.updated_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Pickup Instructions */}
            {['ready', 'ready_for_pickup'].includes(certificate.status) && (
              <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
                <h3 className="font-semibold text-cyan-900 flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5" />
                  Pickup Instructions
                </h3>
                <ul className="text-sm text-cyan-800 space-y-1">
                  <li>• Certificate is ready for collection at the barangay office</li>
                  <li>• Applicant should bring valid government-issued ID</li>
                  <li>• Use the "Verify Pickup" button to process collection</li>
                  <li>• Office hours: Monday to Friday, 8:00 AM - 5:00 PM</li>
                </ul>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t bg-gray-50 px-6 py-4 flex gap-3 justify-end">
            {['ready', 'ready_for_pickup'].includes(certificate.status) && (
              <button
                onClick={openPickupVerification}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm Pickup & Release
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700"
            >
              Close
            </button>
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
                  onKeyPress={(e) => e.key === 'Enter' && pickupName.trim() && onConfirm(certificate.id, pickupName)}
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
                onClick={() => onConfirm(certificate.id, pickupName)}
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