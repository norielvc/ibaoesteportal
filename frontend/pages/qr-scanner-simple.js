import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout/Layout';
import { 
  QrCode, Camera, X, CheckCircle, AlertCircle, 
  Smartphone, RefreshCw, Copy, ExternalLink, FileText,
  Search, Clock, User, Upload, Image, Camera as CameraIcon
} from 'lucide-react';
import { isAuthenticated, getAuthToken } from '@/lib/auth';
import { API_URL } from '@/lib/api';

export default function QRScannerSimplePage() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [certificateData, setCertificateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

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
  }, []);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError(null);
    setScanResult(null);
    setCertificateData(null);
    setProcessing(true);

    try {
      // Create image element
      const img = new Image();
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      img.onload = async () => {
        try {
          // Set canvas size to image size
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Import and use jsQR
          const { default: jsQR } = await import('jsqr');
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            handleScanSuccess(code.data);
          } else {
            setError('No QR code found in the image. Please try another image or make sure the QR code is clearly visible.');
          }
        } catch (err) {
          console.error('QR processing error:', err);
          setError('Failed to process the image. Please try again.');
        } finally {
          setProcessing(false);
        }
      };

      img.onerror = () => {
        setError('Failed to load the image. Please select a valid image file.');
        setProcessing(false);
      };

      // Load image
      img.src = URL.createObjectURL(file);
      
    } catch (err) {
      console.error('File processing error:', err);
      setError('Failed to process the selected file.');
      setProcessing(false);
    }

    // Reset file input
    event.target.value = '';
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg mb-4">
            <Image className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Simple QR Scanner</h1>
          <p className="text-gray-500 mt-1">Upload or take a photo of QR codes</p>
        </div>

        {/* Scanner Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Upload Area */}
          <div className="relative">
            {!scanResult && !processing && (
              <div className="p-8 text-center">
                <div className="w-64 h-64 mx-auto bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl flex items-center justify-center mb-6 border-2 border-dashed border-purple-300">
                  <div className="text-center">
                    <Image className="w-16 h-16 text-purple-400 mx-auto mb-3" />
                    <p className="text-purple-600 font-medium">Select QR Code Image</p>
                    <p className="text-purple-500 text-sm mt-1">Take a photo or choose from gallery</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <button
                    onClick={triggerFileInput}
                    className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                  >
                    <CameraIcon className="w-5 h-5" />
                    Take Photo / Choose Image
                  </button>
                  
                  <p className="text-xs text-gray-400">
                    <Smartphone className="w-4 h-4 inline mr-1" />
                    Works on all devices - iPhone, Android, Desktop
                  </p>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {processing && (
              <div className="p-8 text-center">
                <div className="w-64 h-64 mx-auto bg-purple-50 rounded-2xl flex items-center justify-center mb-6 border-2 border-purple-200">
                  <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-purple-600 font-medium">Processing Image...</p>
                    <p className="text-purple-500 text-sm mt-2">Scanning for QR codes</p>
                  </div>
                </div>
              </div>
            )}

            {scanResult && (
              <div className="p-6">
                {/* Success indicator */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">QR Code Found!</h3>
                </div>

                {/* Scanned Result */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Scanned Content</label>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="flex-1 font-mono text-lg text-purple-600 font-semibold break-all">{scanResult}</p>
                    <button
                      onClick={copyToClipboard}
                      className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Certificate Data */}
                {loading && (
                  <div className="text-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Fetching certificate details...</p>
                  </div>
                )}

                {certificateData && (
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-purple-900">Certificate Found</h4>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-purple-700">Type:</span>
                        <span className="font-medium text-purple-900">{getTypeLabel(certificateData.certificate_type)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Applicant:</span>
                        <span className="font-medium text-purple-900">{certificateData.full_name || certificateData.applicant_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-700">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(certificateData.status)}`}>
                          {certificateData.status?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Date Issued:</span>
                        <span className="font-medium text-purple-900">
                          {certificateData.date_issued ? new Date(certificateData.date_issued).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/requests?search=${scanResult}`)}
                      className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 flex items-center justify-center gap-2"
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
                    onClick={triggerFileInput}
                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 flex items-center justify-center gap-2"
                  >
                    <CameraIcon className="w-4 h-4" />
                    Scan Another
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
                  <p className="text-red-800 font-medium">Processing Error</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                  
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { setError(null); triggerFileInput(); }}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
                    >
                      Try Another Image
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
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-purple-500" />
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
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
          <h3 className="font-semibold text-purple-900 mb-3">📱 How to Use (iPhone Compatible)</h3>
          <ol className="space-y-2 text-sm text-purple-800">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center text-xs font-bold text-purple-700 flex-shrink-0">1</span>
              <span>Tap "Take Photo / Choose Image" button</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center text-xs font-bold text-purple-700 flex-shrink-0">2</span>
              <span>Choose "Take Photo" to use camera or "Photo Library" to select existing image</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center text-xs font-bold text-purple-700 flex-shrink-0">3</span>
              <span>Take a clear photo of the QR code or select one from your photos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center text-xs font-bold text-purple-700 flex-shrink-0">4</span>
              <span>The QR code will be automatically detected and processed</span>
            </li>
          </ol>
          
          <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-200">
            <p className="text-green-800 text-sm font-medium">✅ Works on ALL devices without camera permission issues!</p>
          </div>
        </div>

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </Layout>
  );
}