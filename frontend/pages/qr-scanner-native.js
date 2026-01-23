import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout/Layout';
import { 
  QrCode, Camera, X, CheckCircle, AlertCircle, 
  Smartphone, RefreshCw, Copy, ExternalLink, FileText,
  Search, Clock, User, Upload, Zap
} from 'lucide-react';
import { isAuthenticated, getAuthToken } from '@/lib/auth';
import { API_URL } from '@/lib/api';

export default function QRScannerNativePage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [certificateData, setCertificateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [cameraLoading, setCameraLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

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
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    setScanResult(null);
    setCertificateData(null);
    setCameraLoading(true);
    
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraPermission(true);
        setScanning(true);
        setCameraLoading(false);
        
        // Start scanning for QR codes
        startQRScanning();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraLoading(false);
      setCameraPermission(false);
      
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is being used by another app. Please close other apps and try again.');
      } else {
        setError(`Camera error: ${err.message}`);
      }
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setScanning(false);
  };

  const startQRScanning = async () => {
    try {
      // Import jsQR library for QR code detection
      const { default: jsQR } = await import('jsqr');
      
      scanIntervalRef.current = setInterval(() => {
        if (videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            stopCamera();
            handleScanSuccess(code.data);
          }
        }
      }, 500); // Scan every 500ms
    } catch (err) {
      console.error('QR scanning setup error:', err);
      setError('Failed to initialize QR code detection. Please refresh and try again.');
    }
  };

  const handleScanSuccess = async (decodedText) => {
    setScanResult(decodedText);
    
    // Add to history
    const newHistory = [
      { text: decodedText, timestamp: new Date().toISOString() },
      ...scanHistory.slice(0, 9)
    ];
    setScanHistory(newHistory);
    localStorage.setItem('qrScanHistory', JSON.stringify(newHistory));

    // Try to fetch certificate data if it looks like a reference number
    if (decodedText.match(/^(BC|CI|BR)-\d{4}-\d{5}$/)) {
      await fetchCertificateData(decodedText);
    }
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Native QR Scanner</h1>
          <p className="text-gray-500 mt-1">iPhone-optimized QR code scanner</p>
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
                    <p className="text-gray-500 text-sm">Native camera preview</p>
                  </div>
                </div>
                
                <button
                  onClick={startCamera}
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-3 mx-auto"
                >
                  <Zap className="w-5 h-5" />
                  Start Native Scanner
                </button>

                <p className="text-xs text-gray-400 mt-4">
                  <Smartphone className="w-4 h-4 inline mr-1" />
                  Optimized for iPhone Safari
                </p>
              </div>
            )}

            {cameraLoading && (
              <div className="p-8 text-center">
                <div className="w-64 h-64 mx-auto bg-green-50 rounded-2xl flex items-center justify-center mb-6 border-2 border-green-200">
                  <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-green-600 font-medium">Starting Camera...</p>
                    <p className="text-green-500 text-sm mt-2">Please allow camera access</p>
                  </div>
                </div>
                
                <button
                  onClick={() => { setCameraLoading(false); setError('Camera start cancelled'); }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center gap-2 mx-auto"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            )}

            {scanning && (
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-80 object-cover rounded-t-2xl"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* QR Code targeting square */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-4 border-green-500 rounded-2xl bg-green-500/10 backdrop-blur-sm">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                    </div>
                  </div>
                </div>
                
                {/* Controls overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Scanning for QR codes...</span>
                    </div>
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg text-sm font-medium hover:bg-white/30 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Stop
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
                  <h3 className="text-lg font-semibold text-gray-900">QR Code Detected!</h3>
                </div>

                {/* Scanned Result */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Scanned Content</label>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="flex-1 font-mono text-lg text-green-600 font-semibold break-all">{scanResult}</p>
                    <button
                      onClick={copyToClipboard}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Certificate Data */}
                {loading && (
                  <div className="text-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Fetching certificate details...</p>
                  </div>
                )}

                {certificateData && (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-green-900">Certificate Found</h4>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">Type:</span>
                        <span className="font-medium text-green-900">{getTypeLabel(certificateData.certificate_type)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Applicant:</span>
                        <span className="font-medium text-green-900">{certificateData.full_name || certificateData.applicant_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-green-700">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(certificateData.status)}`}>
                          {certificateData.status?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Date Issued:</span>
                        <span className="font-medium text-green-900">
                          {certificateData.date_issued ? new Date(certificateData.date_issued).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/requests?search=${scanResult}`)}
                      className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
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
                    Reset
                  </button>
                  <button
                    onClick={startCamera}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 flex items-center justify-center gap-2"
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
                  <p className="text-red-800 font-medium">Camera Error</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                  
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { setError(null); startCamera(); }}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => router.push('/qr-scanner')}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200"
                    >
                      Use Standard Scanner
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <h3 className="font-semibold text-green-900 mb-3">iPhone Users</h3>
          <ol className="space-y-2 text-sm text-green-800">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center text-xs font-bold text-green-700 flex-shrink-0">1</span>
              <span>Tap "Start Native Scanner" to use your device camera</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center text-xs font-bold text-green-700 flex-shrink-0">2</span>
              <span>Allow camera access when Safari prompts you</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center text-xs font-bold text-green-700 flex-shrink-0">3</span>
              <span>Point your camera at the QR code within the green square</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center text-xs font-bold text-green-700 flex-shrink-0">4</span>
              <span>The QR code will be detected automatically</span>
            </li>
          </ol>
        </div>
      </div>
    </Layout>
  );
}