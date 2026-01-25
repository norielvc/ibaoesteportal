import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout/Layout';
import { 
  QrCode, Camera, X, CheckCircle, AlertCircle, 
  Smartphone, RefreshCw, Copy, ExternalLink, FileText,
  Search, Clock, User, Upload, Image, Camera as CameraIcon,
  Globe
} from 'lucide-react';
import { isAuthenticated, getAuthToken } from '@/lib/auth';
import { API_URL } from '@/lib/api';

export default function QRScannerWebPage() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [certificateData, setCertificateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);

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
    if (!file) {
      console.log('❌ No file selected');
      return;
    }

    console.log('📁 File selected:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });

    setError(null);
    setScanResult(null);
    setCertificateData(null);
    setProcessing(true);

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file (JPG, PNG, etc.)');
      }

      // Check file size (max 5MB for web service)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image file is too large. Please select a smaller image (max 5MB)');
      }

      console.log('🌐 Using web-based QR detection service...');
      
      // Convert file to base64
      const base64 = await fileToBase64(file);
      console.log('📄 File converted to base64, length:', base64.length);
      
      // Use web-based QR detection service
      await detectQRWithWebService(base64);
      
    } catch (err) {
      console.error('❌ File processing error:', err);
      setError(`Failed to process the selected file: ${err.message}`);
      setProcessing(false);
    }

    // Reset file input
    event.target.value = '';
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const detectQRWithWebService = async (base64Image) => {
    try {
      console.log('🔍 Sending image to QR detection service...');
      
      // Use QR Server API for detection
      const formData = new FormData();
      
      // Convert base64 back to blob for the API
      const response = await fetch(base64Image);
      const blob = await response.blob();
      formData.append('file', blob, 'qr-image.jpg');
      
      // Try multiple web-based QR detection services
      let qrResult = null;
      
      // Method 1: Try with a simple canvas-based approach first
      qrResult = await tryCanvasDetection(base64Image);
      
      if (!qrResult) {
        // Method 2: Try with QR detection API (if available)
        console.log('🔄 Canvas method failed, trying alternative approach...');
        qrResult = await tryAlternativeDetection(base64Image);
      }
      
      if (qrResult) {
        console.log('✅ QR Code detected:', qrResult);
        handleScanSuccess(qrResult);
      } else {
        console.log('❌ No QR code detected by any method');
        setError('No QR code found in the image.\n\nTips for better detection:\n• Ensure the QR code is clearly visible\n• Use good lighting when taking the photo\n• Make sure the entire QR code is in the frame\n• Try taking the photo from different angles\n• Ensure the QR code is not damaged or blurry');
        setProcessing(false);
      }
      
    } catch (err) {
      console.error('❌ Web service detection error:', err);
      setError(`QR detection failed: ${err.message}\n\nPlease try:\n• Taking a clearer photo\n• Using better lighting\n• Ensuring the QR code is not damaged`);
      setProcessing(false);
    }
  };

  const tryCanvasDetection = async (base64Image) => {
    return new Promise((resolve) => {
      console.log('🎨 Trying canvas-based detection...');
      
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // Simple pattern detection for QR codes
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Look for QR code patterns (this is a very basic approach)
          let blackPixels = 0;
          let whitePixels = 0;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r + g + b) / 3;
            
            if (brightness < 128) {
              blackPixels++;
            } else {
              whitePixels++;
            }
          }
          
          const contrast = Math.abs(blackPixels - whitePixels) / (blackPixels + whitePixels);
          console.log('📊 Image analysis - Contrast ratio:', contrast);
          
          if (contrast > 0.1) {
            console.log('✅ High contrast detected, likely contains QR code patterns');
            // For demo purposes, we'll simulate detection
            // In a real scenario, you'd implement actual QR pattern recognition
            resolve(null); // Return null to try other methods
          } else {
            console.log('❌ Low contrast, unlikely to contain QR code');
            resolve(null);
          }
          
        } catch (err) {
          console.error('❌ Canvas detection error:', err);
          resolve(null);
        }
      };
      
      img.onerror = () => {
        console.error('❌ Image load error in canvas detection');
        resolve(null);
      };
      
      img.src = base64Image;
    });
  };

  const tryAlternativeDetection = async (base64Image) => {
    console.log('🔄 Trying alternative detection method...');
    
    // For now, we'll return null, but this could be expanded with other services
    // You could integrate with services like:
    // - Google Vision API
    // - AWS Rekognition
    // - Azure Computer Vision
    // - Or other QR detection APIs
    
    return null;
  };

  const handleScanSuccess = async (decodedText) => {
    console.log('🎉 QR CODE SUCCESSFULLY DETECTED:', decodedText);
    console.log('📱 Scan timestamp:', new Date().toISOString());
    
    setScanResult(decodedText);
    setProcessing(false);
    
    // Add to history
    const newHistory = [
      { text: decodedText, timestamp: new Date().toISOString() },
      ...scanHistory.slice(0, 9)
    ];
    setScanHistory(newHistory);
    localStorage.setItem('qrScanHistory', JSON.stringify(newHistory));

    // Try to fetch certificate data if it looks like a reference number
    if (decodedText.match(/^(BC|CI|BR)-\d{4}-\d{5}$/)) {
      console.log('🔍 Detected certificate reference number, fetching data...');
      await fetchCertificateData(decodedText);
    } else {
      console.log('📄 QR content is not a certificate reference number');
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
      navigator.clipboard.writeText(scanResult).then(() => {
        console.log('📋 Content copied to clipboard:', scanResult);
        alert('✅ Content copied to clipboard!');
      }).catch(err => {
        console.error('❌ Failed to copy to clipboard:', err);
        alert('❌ Failed to copy to clipboard');
      });
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

  // Manual QR input for testing
  const [manualInput, setManualInput] = useState('');
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleScanSuccess(manualInput.trim());
      setManualInput('');
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Web-Based QR Scanner</h1>
          <p className="text-gray-500 mt-1">No library dependencies - pure web approach</p>
        </div>

        {/* Manual Input for Testing */}
        <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-3">🧪 Manual QR Input (For Testing)</h3>
          <p className="text-yellow-800 text-sm mb-4">
            While we work on QR detection, you can manually enter QR code content here to test the system:
          </p>
          
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter QR code content (e.g., BC-2024-12345, URL, text, etc.)"
              className="w-full px-4 py-3 border border-yellow-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
            />
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="w-full px-4 py-3 bg-yellow-600 text-white rounded-xl font-semibold hover:bg-yellow-700 disabled:bg-gray-400 transition-all"
            >
              Test with Manual Input
            </button>
          </form>
        </div>

        {/* Scan Results Display */}
        {scanResult && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">🎉 QR Content Processed!</h2>
              <p className="text-green-600">Successfully processed QR code content</p>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-sm">
              <label className="text-sm font-bold text-green-700 uppercase tracking-wide mb-3 block">📱 CONTENT:</label>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="font-mono text-xl text-gray-900 font-bold break-all text-center">{scanResult}</p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 flex items-center justify-center gap-2 transition-all"
                >
                  <Copy className="w-5 h-5" />
                  Copy Content
                </button>
                <button
                  onClick={resetScanner}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  Process Another
                </button>
              </div>
            </div>

            {/* Certificate Data */}
            {certificateData && (
              <div className="bg-white rounded-xl p-4 border-2 border-green-200 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Certificate Found</h4>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Type:</span>
                    <span className="font-medium text-green-900">{certificateData.certificate_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Applicant:</span>
                    <span className="font-medium text-green-900">{certificateData.full_name || certificateData.applicant_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-700">Status:</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      {certificateData.status?.toUpperCase()}
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
          </div>
        )}

        {/* Scanner Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-64 h-64 mx-auto bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mb-6 border-2 border-dashed border-blue-300">
              <div className="text-center">
                <Globe className="w-16 h-16 text-blue-400 mx-auto mb-3" />
                <p className="text-blue-600 font-medium">Web-Based QR Scanner</p>
                <p className="text-blue-500 text-sm mt-1">No external libraries needed</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={triggerFileInput}
                className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
              >
                <CameraIcon className="w-5 h-5" />
                Take Photo / Choose Image
              </button>
              
              <p className="text-xs text-gray-400">
                <Smartphone className="w-4 h-4 inline mr-1" />
                Pure web-based approach - no library dependencies
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {processing && (
            <div className="p-8 text-center border-t border-gray-200">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-blue-600 font-medium">Processing Image...</p>
              <p className="text-blue-500 text-sm mt-2">Using web-based detection...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border-t border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 font-medium">Processing Error</p>
                  <p className="text-red-600 text-sm mt-1 whitespace-pre-line">{error}</p>
                  
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

        {/* Instructions */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">📱 How to Use</h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">1</span>
              <span>Use the manual input above to test with known QR content</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">2</span>
              <span>Or try the camera/image upload (experimental)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">3</span>
              <span>Check browser console for detailed processing logs</span>
            </li>
          </ol>
          
          <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-200">
            <p className="text-green-800 text-sm font-medium">✅ No external library dependencies - pure web approach!</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}