import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  CheckCircle, XCircle, Clock, User, FileText,
  Calendar, Phone, MapPin, AlertTriangle, Shield
} from 'lucide-react';

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

export default function VerifyPickupPage() {
  const router = useRouter();
  const { token, ref } = router.query;

  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [pickedUpBy, setPickedUpBy] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (ref) {
      verifyPickup();
    } else {
      setLoading(false);
    }
  }, [token, ref]);

  const verifyPickup = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/pickup/verify?token=${token}&ref=${ref}`;

      // If token is missing, use an authenticated reference lookup
      if (!token && ref) {
        console.log('Token missing, using reference-only lookup');
        url = `${API_URL}/api/pickup/verify-ref?ref=${ref}`;
      }

      const headers = {};
      const authToken = getAuthToken();
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(url, { headers });
      const data = await response.json();

      setVerification(data);
    } catch (error) {
      console.error('Error verifying pickup:', error);
      setVerification({
        valid: false,
        message: 'Failed to verify pickup code'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPickup = async () => {
    if (!pickedUpBy.trim()) {
      alert('Please enter the name of the person picking up the certificate');
      return;
    }

    setConfirming(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      const authToken = getAuthToken();
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      // If we have a token, use the secure confirm endpoint
      // Otherwise use the manual confirm by reference endpoint
      const endpoint = token ? 'confirm' : 'confirm-manual';
      const body = token ? { token, pickedUpBy: pickedUpBy.trim() } : { ref, pickedUpBy: pickedUpBy.trim() };

      const response = await fetch(`${API_URL}/api/pickup/${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        setShowConfirmation(true);
      } else {
        alert(data.message || 'Failed to confirm pickup');
      }
    } catch (error) {
      console.error('Error confirming pickup:', error);
      alert('Failed to confirm pickup');
    } finally {
      setConfirming(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCertificateTypeLabel = (type) => {
    const labels = {
      'barangay_clearance': 'Barangay Clearance',
      'certificate_of_indigency': 'Certificate of Indigency',
      'barangay_residency': 'Barangay Residency Certificate'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Pickup Token</h2>
          <p className="text-gray-500">Please wait while we verify your certificate pickup code...</p>
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pickup Confirmed!</h2>
          <p className="text-gray-600 mb-6">
            The certificate has been successfully marked as picked up by <strong>{pickedUpBy}</strong>.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>Reference:</strong> {ref}<br />
              <strong>Picked up at:</strong> {formatDate(new Date())}
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Return to Portal
          </button>
        </div>
      </div>
    );
  }

  if (!verification?.valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Pickup Code</h2>
          <p className="text-gray-600 mb-6">
            {verification?.message || 'The pickup code is invalid or has expired.'}
          </p>
          {verification?.pickedUpAt && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                This certificate was already picked up on {formatDate(verification.pickedUpAt)}.
              </p>
            </div>
          )}
          <button
            onClick={() => router.push('/')}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700"
          >
            Return to Portal
          </button>
        </div>
      </div>
    );
  }

  const { request, pickup } = verification;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Certificate Pickup Verification</h1>
            <p className="text-green-100">Verify and confirm certificate pickup</p>
          </div>
        </div>

        {/* Certificate Details */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Certificate Details</h2>
              <p className="text-gray-500">Ready for pickup</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Reference Number</label>
                <p className="font-mono font-semibold text-blue-600 text-lg">{request.reference_number}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Certificate Type</label>
                <p className="font-medium text-gray-900">{getCertificateTypeLabel(request.certificate_type)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Applicant Name</label>
                <p className="font-medium text-gray-900">{request.full_name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Contact Number</label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">{request.contact_number}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <p className="text-gray-900">{request.address}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Date Requested</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">{formatDate(request.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pickup Information */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Pickup Information</h2>
              <p className="text-gray-500">Valid until {formatDate(pickup.expires_at)}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">Important Pickup Instructions</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Please bring a valid government-issued ID</li>
                  <li>• Only the applicant or authorized representative can pick up</li>
                  <li>• Office hours: Monday to Friday, 8:00 AM - 5:00 PM</li>
                  <li>• Certificate must be picked up within 30 days</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Pickup Confirmation Form */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Pickup</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name of Person Picking Up Certificate *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={pickedUpBy}
                    onChange={(e) => setPickedUpBy(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This should match the name on the ID presented
                </p>
              </div>

              <button
                onClick={handleConfirmPickup}
                disabled={confirming || !pickedUpBy.trim()}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {confirming ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Confirming Pickup...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirm Certificate Pickup
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Barangay Iba O' Este - Certificate Pickup System</p>
          <p>For assistance, contact the barangay office during office hours</p>
        </div>
      </div>
    </div>
  );
}