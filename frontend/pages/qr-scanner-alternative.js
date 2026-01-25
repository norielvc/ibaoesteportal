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

export default function QRScannerAlternativePage() {
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

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image file is too large. Please select a smaller image (max 10MB)');
      }

      console.log('🔍 Using Html5Qrcode library for detection...');
      
      // Use Html5Qrcode library - import it properly
      const { Html5Qrcode } = await import('html5-qrcode');
      
      // Create a temporary element for scanning
      const tempElement = document.createElement('div');
      tempElement.id = 'temp-qr-reader-' + Date.now();
      tempElement.style.display = 'none';
      document.body.appendChild(tempElement);
      
      // Create a temporary HTML5 QR Code scanner
      const html5QrCode = new Html5Qrcode(tempElement.id);
      
      try {
        console.log('📸 Scanning file with Html5Qrcode...');
        const qrCodeMessage = await html5QrCode.scanFile(file, true);
        console.log('✅ QR Code detected with Html5Qrcode:', qrCodeMessage);
        handleScanSuccess(qrCodeMessage);
      } catch (html5Error) {
        console.log('❌ Html5Qrcode failed, trying fallback method...');
        console.error('Html5Qrcode error:', html5Error);
        
        // Fallback to manual canvas method
        await tryCanvasMethod(file);
      } finally {
        // Clean up the temporary element
        if (tempElement && tempElement.parentNode) {
          tempElement.parentNode.removeChild(tempElement);
        }
      }
      
    } catch (err) {
      console.error('❌ File processing error:', err);
      setError(`Failed to process the selected file: ${err.message}`);
      setProcessing(false);
    }

    // Reset file input
    event.target.value = '';
  };

  const tryCanvasMethod = async (file) => {
    console.log('🎨 Trying canvas-based detection as fallback...');
    
    const img = new Image();
    const canvas = canvasRef.current;
    
    if (!canvas) {
      throw new Error('Canvas element not found');
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          console.log('🖼️ Image loaded for canvas method');
          
          // Set canvas size
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image
          ctx.drawImage(img, 0, 0);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Try with ZXing-js as another alternative
          try {
            console.log('🔍 Trying ZXing-js library...');
            const { BrowserQRCodeReader } = await import('@zxing/library');
            const codeReader = new BrowserQRCodeReader();
            
            // Convert canvas to blob and then to image source
            canvas.toBlob(async (blob) => {
              try {
                const imageUrl = URL.createObjectURL(blob);
                const result = await codeReader.decodeFromImageUrl(imageUrl);
                console.log('✅ QR Code detected with ZXing-js:', result.getText());
                handleScanSuccess(result.getText());
                URL.revokeObjectURL(imageUrl);
                resolve();
              } catch (zxingError) {
                console.log('❌ ZXing-js also failed:', zxingError);
                
                // Try jsQR as final fallback
                try {
                  console.log('🔍 Trying jsQR as final fallback...');
                  const jsQR = (await import('jsqr')).default;
                  
                  if (typeof jsQR === 'function') {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                      inversionAttempts: "attemptBoth",
                    });
                    
                    if (code) {
                      console.log('✅ QR Code detected with jsQR fallback:', code.data);
                      handleScanSuccess(code.data);
                      resolve();
                    } else {
                      console.log('❌ All detection methods failed');
                      setError('No QR code could be detected in this image. Please try:\n• Taking a clearer photo\n• Ensuring good lighting\n• Making sure the entire QR code is visible\n• Using a different QR code');
                      setProcessing(false);
                      reject(new Error('All detection methods failed'));
                    }
                  } else {
                    throw new Error('jsQR not available');
                  }
                } catch (jsqrError) {
                  console.log('❌ jsQR fallback also failed:', jsqrError);
                  setError('No QR code could be detected in this image. Please try:\n• Taking a clearer photo\n• Ensuring good lighting\n• Making sure the entire QR code is visible\n• Using a different QR code');
                  setProcessing(false);
                  reject(jsqrError);
                }
              }
            }, 'image/png');
            
          } catch (zxingImportError) {
            console.error('❌ Could not load ZXing-js:', zxingImportError);
            setError('QR detection libraries failed to load. Please refresh the page and try again.');
            setProcessing(false);
            reject(zxingImportError);
          }
          
        } catch (canvasError) {
          console.error('❌ Canvas processing error:', canvasError);
          setError('Failed to process image. Please try a different image.');
          setProcessing(false);
          reject(canvasError);
        }
      };

      img.onerror = (imgError) => {
        console.error('❌ Image load error:', imgError);
        setError('Failed to load the image. Please select a valid image file.');
        setProcessing(false);
        reject(imgError);
      };

      img.src = URL.createObjectURL(file);
    });
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
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Alternative QR Scanner</h1>
          <p className="text-gray-500 mt-1">Using Html5Qrcode & ZXing libraries</p>
        </div>

        {/* Scanner Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Scan Results Display - Priority Section */}
          {scanResult && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-800 mb-2">🎉 QR Code Detected!</h2>
                <p className="text-green-600">Successfully scanned QR code content</p>
              </div>

              {/* Large Scanned Content Display */}
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
            </div>
          )}

          {/* Upload Area */}
          <div className="relative">
            {!scanResult && !processing && (
              <div className="p-8 text-center">
                <div className="w-64 h-64 mx-auto bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center mb-6 border-2 border-dashed border-green-300">
                  <div className="text-center">
                    <QrCode className="w-16 h-16 text-green-400 mx-auto mb-3" />
                    <p className="text-green-600 font-medium">Alternative QR Scanner</p>
                    <p className="text-green-500 text-sm mt-1">Using multiple detection libraries</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <button
                    onClick={triggerFileInput}
                    className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                  >
                    <CameraIcon className="w-5 h-5" />
                    Take Photo / Choose Image
                  </button>
                  
                  <p className="text-xs text-gray-400">
                    <Smartphone className="w-4 h-4 inline mr-1" />
                    Enhanced detection with Html5Qrcode & ZXing
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
                <div className="w-64 h-64 mx-auto bg-green-50 rounded-2xl flex items-center justify-center mb-6 border-2 border-green-200">
                  <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-green-600 font-medium">Processing Image...</p>
                    <p className="text-green-500 text-sm mt-2">Trying Html5Qrcode & ZXing...</p>
                  </div>
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

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </Layout>
  );
}