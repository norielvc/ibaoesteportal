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
  const [cameraLoading, setCameraLoading] = useState(false);
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
    setCameraLoading(true);
    
    try {
      // Dynamically import html5-qrcode (client-side only)
      const { Html5Qrcode } = await import('html5-qrcode');
      
      // Check if we're on iOS Safari
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      console.log('Starting scanner on iOS:', isIOS);
      
      // For iOS, use a simpler approach
      if (isIOS) {
        try {
          // Simple permission check for iOS
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment',
              width: 320,
              height: 240
            } 
          });
          stream.getTracks().forEach(track => track.stop());
          setCameraPermission(true);
          console.log('iOS camera permission granted');
        } catch (iosError) {
          console.error('iOS camera error:', iosError);
          throw new Error('Camera permission required. Please allow camera access and refresh the page.');
        }
      } else {
        // Standard permission check for other devices
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        stream.getTracks().forEach(track => track.stop());
        setCameraPermission(true);
      }

      // Initialize scanner
      html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      
      // Simpler config for iOS
      const config = isIOS ? {
        fps: 5,
        qrbox: 200,
        aspectRatio: 1.0,
        disableFlip: false
      } : {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false
      };

      console.log('Scanner config:', config);

      // Start scanner with simpler camera selection
      if (isIOS) {
        // For iOS, try the simplest approach first
        await html5QrCodeRef.current.start(
          { facingMode: 'environment' },
          config,
          onScanSuccess,
          onScanFailure
        );
      } else {
        // For other devices, try to get specific camera
        try {
          const devices = await Html5Qrcode.getCameras();
          console.log('Available cameras:', devices);
          
          let cameraId = { facingMode: 'environment' };
          
          if (devices && devices.length > 0) {
            const rearCamera = devices.find(device => 
              device.label.toLowerCase().includes('back') || 
              device.label.toLowerCase().includes('rear') ||
              device.label.toLowerCase().includes('environment')
            );
            
            if (rearCamera) {
              cameraId = rearCamera.id;
            } else {
              cameraId = devices[devices.length - 1].id;
            }
          }
          
          await html5QrCodeRef.current.start(
            cameraId,
            config,
            onScanSuccess,
            onScanFailure
          );
        } catch (deviceError) {
          console.warn('Device enumeration failed, using facingMode:', deviceError);
          await html5QrCodeRef.current.start(
            { facingMode: 'environment' },
            config,
            onScanSuccess,
            onScanFailure
          );
        }
      }

      setScanning(true);
      setCameraLoading(false);
      console.log('Scanner started successfully');
      
    } catch (err) {
      console.error('Scanner error:', err);
      setCameraPermission(false);
      setCameraLoading(false);
      
      let errorMessage = 'Failed to start camera';
      
      if (err.name === 'NotAllowedError' || err.message.includes('denied') || err.message.includes('permission')) {
        errorMessage = 'Camera permission denied. Please refresh the page and allow camera access.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another app. Please close other camera apps and try again.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera settings not supported. Please refresh the page.';
      } else if (err.message.includes('QR code scanner')) {
        errorMessage = 'Scanner initialization failed. Please refresh the page and try again.';
      } else {
        errorMessage = `Camera error: ${err.message || 'Unknown error'}`;
      }
      
      setError(errorMessage);
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
            {!scanning && !scanResult && !cameraLoading && (
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

            {cameraLoading && (
              <div className="p-8 text-center">
                <div className="w-64 h-64 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border-2 border-blue-200">
                  <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-blue-600 font-medium">Initializing Camera...</p>
                    <p className="text-blue-500 text-sm mt-2">Please wait while we access your camera</p>
                  </div>
                </div>
                
                <button
                  onClick={() => { setCameraLoading(false); setError('Camera initialization cancelled'); }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center gap-2 mx-auto"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
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
                <div className="flex-1">
                  <p className="text-red-800 font-medium">Scanner Error</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                  
                  {/* iOS-specific help */}
                  {/iPad|iPhone|iPod/.test(navigator.userAgent) && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-blue-800 font-medium text-sm mb-2">📱 iPhone/iPad Users:</p>
                      <ul className="text-blue-700 text-xs space-y-1">
                        <li>• Make sure you're using Safari browser</li>
                        <li>• Tap the camera icon in the address bar and allow camera access</li>
                        <li>• Try refreshing the page and allowing camera permission again</li>
                        <li>• Check Settings → Safari → Camera and ensure it's allowed</li>
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { setError(null); startScanner(); }}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200"
                    >
                      Refresh Page
                    </button>
                  </div>
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
