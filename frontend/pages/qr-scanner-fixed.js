import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout/Layout';
import { 
  QrCode, CheckCircle, AlertCircle, 
  RefreshCw, Copy, ExternalLink, FileText,
  Image, Camera as CameraIcon
} from 'lucide-react';
import { isAuthenticated, getAuthToken } from '@/lib/auth';
import { API_URL } from '@/lib/api';

export default function QRScannerFixedPage() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [certificateData, setCertificateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, []);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('📁 File selected:', file.name, file.size, file.type);

    setError(null);
    setScanResult(null);
    setCertificateData(null);
    setProcessing(true);

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image file is too large (max 10MB)');
      }

      // Try multiple detection methods in sequence
      let detected = false;

      // Method 1: Try jsQR
      try {
        console.log('🔍 Trying jsQR...');
        const result = await detectWithJsQR(file);
        if (result) {
          console.log('✅ jsQR success:', result);
          handleScanSuccess(result);
          detected = true;
        }
      } catch (jsqrError) {
        console.log('❌ jsQR failed:', jsqrError.message);
      }

      // Method 2: Try Html5Qrcode if jsQR failed
      if (!detected) {
        try {
          console.log('🔍 Trying Html5Qrcode...');
          const result = await detectWithHtml5Qrcode(file);
          if (result) {
            console.log('✅ Html5Qrcode success:', result);
            handleScanSuccess(result);
            detected = true;
          }
        } catch (html5Error) {
          console.log('❌ Html5Qrcode failed:', html5Error.message);
        }
      }

      // Method 3: Try ZXing if others failed
      if (!detected) {
        try {
          console.log('🔍 Trying ZXing...');
          const result = await detectWithZXing(file);
          if (result) {
            console.log('✅ ZXing success:', result);
            handleScanSuccess(result);
            detected = true;
          }
        } catch (zxingError) {
          console.log('❌ ZXing failed:', zxingError.message);
        }
      }

      if (!detected) {
        setError('No QR code found in the image.\n\nTips:\n• Ensure good lighting\n• Make sure the QR code is clear and complete\n• Try different angles\n• Check if the QR code is damaged');
      }

    } catch (err) {
      console.error('❌ Processing error:', err);
      setError(`Processing failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }

    event.target.value = '';
  };

  const detectWithJsQR = async (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = canvasRef.current;
      
      if (!canvas) {
        reject(new Error('Canvas not available'));
        return;
      }

      img.onload = async () => {
        try {
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Import jsQR
          const jsQR = (await import('jsqr')).default;
          
          if (typeof jsQR !== 'function') {
            reject(new Error('jsQR not properly loaded'));
            return;
          }

          // Try different detection options
          let code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });

          if (code && code.data) {
            resolve(code.data);
          } else {
            reject(new Error('No QR code detected'));
          }
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error('Image load failed'));
      img.src = URL.createObjectURL(file);
    });
  };

  const detectWithHtml5Qrcode = async (file) => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      
      // Create temporary element
      const tempId = 'temp-qr-' + Date.now();
      const tempDiv = document.createElement('div');
      tempDiv.id = tempId;
      tempDiv.style.display = 'none';
      document.body.appendChild(tempDiv);

      try {
        const html5QrCode = new Html5Qrcode(tempId);
        const result = await html5QrCode.scanFile(file, true);
        return result;
      } finally {
        // Clean up
        if (tempDiv.parentNode) {
          tempDiv.parentNode.removeChild(tempDiv);
        }
      }
    } catch (err) {
      throw new Error(`Html5Qrcode error: ${err.message}`);
    }
  };

  const detectWithZXing = async (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = async () => {
        try {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const { BrowserQRCodeReader } = await import('@zxing/library');
          const codeReader = new BrowserQRCodeReader();

          canvas.toBlob(async (blob) => {
            try {
              const imageUrl = URL.createObjectURL(blob);
              const result = await codeReader.decodeFromImageUrl(imageUrl);
              URL.revokeObjectURL(imageUrl);
              resolve(result.getText());
            } catch (err) {
              reject(err);
            }
          }, 'image/png');
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error('Image load failed'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleScanSuccess = async (decodedText) => {
    console.log('🎉 QR CODE DETECTED:', decodedText);
    setScanResult(decodedText);

    // Check if it's a certificate reference
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
      navigator.clipboard.writeText(scanResult).then(() => {
        alert('✅ Content copied to clipboard!');
      }).catch(() => {
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

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg mb-4">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Fixed QR Scanner</h1>
          <p className="text-gray-500 mt-1">Improved detection with multiple libraries</p>
        </div>

        {/* Scan Results Display */}
        {scanResult && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">🎉 QR Code Detected!</h2>
              <p className="text-green-600">Successfully scanned QR code content</p>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-sm">
              <label className="text-sm font-bold text-green-700 uppercase tracking-wide mb-3 block">📱 SCANNED CONTENT:</label>
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
                  Scan Another
                </button>
              </div>
            </div>

            {/* Certificate Data */}
            {loading && (
              <div className="text-center py-4 mt-4">
                <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-green-600 mt-2">Fetching certificate details...</p>
              </div>
            )}

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
          {!scanResult && !processing && (
            <div className="p-8 text-center">
              <div className="w-64 h-64 mx-auto bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center mb-6 border-2 border-dashed border-emerald-300">
                <div className="text-center">
                  <Image className="w-16 h-16 text-emerald-400 mx-auto mb-3" />
                  <p className="text-emerald-600 font-medium">Fixed QR Scanner</p>
                  <p className="text-emerald-500 text-sm mt-1">Multiple detection methods</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={triggerFileInput}
                  className="w-full px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                >
                  <CameraIcon className="w-5 h-5" />
                  Take Photo / Choose Image
                </button>
                
                <p className="text-xs text-gray-400">
                  Tries jsQR → Html5Qrcode → ZXing in sequence
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
          )}

          {processing && (
            <div className="p-8 text-center">
              <div className="w-64 h-64 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 border-2 border-emerald-200">
                <div className="text-center">
                  <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-emerald-600 font-medium">Processing Image...</p>
                  <p className="text-emerald-500 text-sm mt-2">Trying multiple detection methods...</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border-t border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 font-medium">Detection Failed</p>
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

        {/* Test QR Code */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-4">🧪 Test QR Code</h3>
          <p className="text-blue-800 text-sm mb-4">
            Use this test QR code to verify the scanner is working:
          </p>
          
          <div className="bg-white p-4 rounded-xl border-2 border-blue-200 text-center">
            <img 
              src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TEST-QR-SCANNER-WORKING-2024" 
              alt="Test QR Code" 
              className="mx-auto mb-3"
              style={{ imageRendering: 'pixelated' }}
            />
            <p className="text-xs text-gray-600 font-mono">Test Content: "TEST-QR-SCANNER-WORKING-2024"</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200">
          <h3 className="font-semibold text-emerald-900 mb-3">📱 How to Use</h3>
          <ol className="space-y-2 text-sm text-emerald-800">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-emerald-200 rounded-full flex items-center justify-center text-xs font-bold text-emerald-700 flex-shrink-0">1</span>
              <span>Tap "Take Photo / Choose Image" button</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-emerald-200 rounded-full flex items-center justify-center text-xs font-bold text-emerald-700 flex-shrink-0">2</span>
              <span>Take a clear photo of the QR code or select from gallery</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-emerald-200 rounded-full flex items-center justify-center text-xs font-bold text-emerald-700 flex-shrink-0">3</span>
              <span>The scanner will try multiple detection methods automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-emerald-200 rounded-full flex items-center justify-center text-xs font-bold text-emerald-700 flex-shrink-0">4</span>
              <span>Check browser console for detailed detection logs</span>
            </li>
          </ol>
          
          <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-200">
            <p className="text-green-800 text-sm font-medium">✅ Enhanced with proper library imports and error handling!</p>
          </div>
        </div>

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </Layout>
  );
}