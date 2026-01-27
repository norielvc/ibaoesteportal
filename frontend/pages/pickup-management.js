import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout/Layout';
import {
  FileCheck, Search, Eye, Calendar, User, Phone, MapPin,
  Shield, Clock, CheckCircle, AlertTriangle, QrCode,
  ExternalLink, RefreshCw, Package, History
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

  const handleManualRelease = async (certificateId, pickedUpBy) => {
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
        alert('Certificate successfully marked as picked up');
        setSelectedCertificate(null);
        handleRefresh();
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process pickup');
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
      'ready': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'ready_for_pickup': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'released': 'bg-green-100 text-green-800 border-green-200',
      'expired': 'bg-red-100 text-red-800 border-red-200'
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const openPickupVerification = (referenceNumber) => {
    const url = `/verify-pickup?ref=${referenceNumber}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Filter certificates
  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch =
      cert.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.applicant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'ready' ? ['ready', 'ready_for_pickup'].includes(cert.status) : cert.status === statusFilter);

    return matchesSearch && matchesStatus;
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
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${statusFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <History className="w-4 h-4" />
                All ({stats.totalProcessed})
              </button>
            </div>

            <div className="flex gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search certificates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Certificates List */}
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
            <div className="divide-y divide-gray-100">
              {filteredCertificates.map((certificate) => (
                <div key={certificate.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    {/* Left side - Icon, Name, Type, and Status in one line */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileCheck className="w-5 h-5 text-blue-600" />
                      </div>

                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {certificate.applicant_name || certificate.full_name}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(certificate.status)} flex-shrink-0`}>
                            {certificate.status?.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="truncate">{getTypeLabel(certificate.certificate_type)}</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(certificate.updated_at)}
                          </div>
                          {certificate.contact_number && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {certificate.contact_number}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side - Reference number and actions */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-mono font-semibold text-blue-600 text-lg">
                          {certificate.reference_number}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedCertificate(certificate)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>

                        {['ready', 'ready_for_pickup'].includes(certificate.status) && (
                          <button
                            onClick={() => openPickupVerification(certificate.reference_number)}
                            className="px-3 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 flex items-center gap-2 text-sm"
                            title="Open Pickup Verification"
                          >
                            <QrCode className="w-4 h-4" />
                            Verify
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}

                        {certificate.status === 'released' && (
                          <div className="px-3 py-2 bg-green-100 text-green-700 rounded-lg font-medium flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Released
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
            openPickupVerification={openPickupVerification}
            handleManualRelease={handleManualRelease}
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
              <>
                <button
                  onClick={() => {
                    const name = prompt("Enter the name of the person picking up the certificate:", certificate.applicant_name || certificate.full_name);
                    if (name) {
                      handleManualRelease(certificate.id, name);
                    }
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Picked Up
                </button>
                <button
                  onClick={() => openPickupVerification(certificate.reference_number)}
                  className="px-6 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  Verify with QR
                  <ExternalLink className="w-3 h-3" />
                </button>
              </>
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