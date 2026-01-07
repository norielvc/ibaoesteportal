import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout/Layout';
import { 
  QrCode, Camera, X, CheckCircle, AlertCircle, 
  Smartphone, RefreshCw, Copy, ExternalLink, FileText,
  Search, Clock, User
} from 'lucide-react';
import { isAuthenticated, getAuthToken } from '@/lib/auth';
import { API_URL } from '@/lib/api';

export default function QRScannerPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [certificateData, setCertificateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Load scan history from localStorage
    const history = localStorage.getItem('qrScanHistory');
    if (history) {
      setScanHistory(JSON.parse(history));
    }

    // Cleanup on unmount
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setError(null);
    setScanResult(null);
    setCertificateData(null);
    
    try {
      // Dynamically import html5-qrcode (client-side only)
      const { Html5Qrcode } = await import('html5-qrcode');
      
      // Check camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission(true);

      // Initialize scanner
      html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        config,
        onScanSuccess,
        onScanFailure
      );

      setScanning(true);
    } catch (err) {
      console.error('Scanner error:', err);
      setCameraPermission(false);
      
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError(`Failed to start scanner: ${err.message}`);
      }
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScanning(false);
  };

  const onScanSuccess = async (decodedText, decodedResult) => {
    // Stop scanner after successful scan
    await stopScanner();
    setScanResult(decodedText);
    
    // Add to history
    const newHistory = [
      { text: decodedText, timestamp: new Date().toISOString() },
      ...scanHistory.slice(0, 9) // Keep last 10 scans
    ];
    setScanHistory(newHistory);
    localStorage.setItem('qrScanHistory', JSON.stringify(newHistory));

    // Try to fetch certificate data if it looks like a reference number
    if (decodedText.match(/^(BC|CI|BR)-\d{4}-\d{5}$/)) {
      await fetchCertificateData(decodedText);
    }
  };

  const onScanFailure = (error) => {
    // Ignore scan failures (no QR code in frame)
  };

  const fetchCertificateData = async (referenceNumber) => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/certificates?reference=${referenceNumber}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && data.certificates) {
        const cert = data.certificates.find(c => c.reference_number === referenceNumber);
        if (cert) {
          setCertificateData(cert);
        }
      }
    } catch (err) {
      console.error('Error fetching certificate:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (scanResult) {
      navigator.clipboard.writeText(scanResult);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setCertificateData(null);
    setError(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-purple-100 text-purple-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'released': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type) => {
    const labels = {
      'barangay_clearance': 'Barangay Clearance',
      'certificate_of_indigency': 'Certificate of Indigency',
      'barangay_residency': 'Barangay Residency'
    };
    return labels[type] || type;
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">QR Code Scanner</h1>
          <p className="text-gray-500 mt-1">Scan certificate QR codes to verify and view details</p>
        </div>

        {/* Scanner Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Scanner Area */}
          <div className="relative">
            {!scanning && !scanResult && (
              <div className="p-8 text-center">
                <div className="w-64 h-64 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-6 border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <Camera className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Camera preview will appear here</p>
                  </div>
                </div>
                
                <button
                  onClick={startScanner}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-3 mx-auto"
                >
                  <Camera className="w-5 h-5" />
                  Start Scanning
                </button>

                <p className="text-xs text-gray-400 mt-4">
                  <Smartphone className="w-4 h-4 inline mr-1" />
                  Works best on mobile devices with camera
                </p>
              </div>
            )}

            {scanning && (
              <div className="relative">
                <div id="qr-reader" ref={scannerRef} className="w-full"></div>
                
                {/* Scanning overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Scanning...</span>
                    </div>
                    <button
                      onClick={stopScanner}
                      className="px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg text-sm font-medium hover:bg-white/30 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {scanResult && (
              <div className="p-6">
                {/* Success indicator */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">QR Code Scanned!</h3>
                </div>

                {/* Scanned Result */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Scanned Content</label>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="flex-1 font-mono text-lg text-blue-600 font-semibold break-all">{scanResult}</p>
                    <button
                      onClick={copyToClipboard}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Certificate Data */}
                {loading && (
                  <div className="text-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Fetching certificate details...</p>
                  </div>
                )}

                {certificateData && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-900">Certificate Found</h4>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Type:</span>
                        <span className="font-medium text-blue-900">{getTypeLabel(certificateData.certificate_type)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Applicant:</span>
                        <span className="font-medium text-blue-900">{certificateData.full_name || certificateData.applicant_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(certificateData.status)}`}>
                          {certificateData.status?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Date Issued:</span>
                        <span className="font-medium text-blue-900">
                          {certificateData.date_issued ? new Date(certificateData.date_issued).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/requests?search=${scanResult}`)}
                      className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Full Details
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={resetScanner}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Scan Another
                  </button>
                  <button
                    onClick={startScanner}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Scan Again
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-t border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Scanner Error</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                  <button
                    onClick={() => { setError(null); startScanner(); }}
                    className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                Recent Scans
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {scanHistory.slice(0, 5).map((scan, index) => (
                <div 
                  key={index} 
                  className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                  onClick={() => {
                    setScanResult(scan.text);
                    if (scan.text.match(/^(BC|CI|BR)-\d{4}-\d{5}$/)) {
                      fetchCertificateData(scan.text);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-medium text-gray-900">{scan.text}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(scan.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">How to Use</h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">1</span>
              <span>Tap "Start Scanning" to activate your camera</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">2</span>
              <span>Allow camera access when prompted by your browser</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">3</span>
              <span>Point your camera at the QR code on the certificate</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">4</span>
              <span>The certificate details will be displayed automatically</span>
            </li>
          </ol>
        </div>
      </div>

      {/* Custom styles for html5-qrcode */}
      <style jsx global>{`
        #qr-reader {
          border: none !important;
          width: 100% !important;
        }
        #qr-reader video {
          width: 100% !important;
          border-radius: 0 !important;
        }
        #qr-reader__scan_region {
          min-height: 300px;
        }
        #qr-reader__dashboard {
          padding: 10px !important;
        }
        #qr-reader__dashboard_section_swaplink {
          display: none !important;
        }
      `}</style>
    </Layout>
  );
}
