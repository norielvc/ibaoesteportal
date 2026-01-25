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

      console.log('🖼️ Creating image element...');
      
      // Create image element
      const img = new Image();
      const canvas = canvasRef.current;
      
      if (!canvas) {
        throw new Error('Canvas element not found');
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      img.onload = async () => {
        try {
          console.log('🖼️ Image loaded successfully:', {
            width: img.width,
            height: img.height,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
          });

          // Calculate optimal canvas size (max 1200px for better quality)
          const maxSize = 1200;
          let { width, height } = img;
          
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
            console.log('📏 Resizing image:', { originalWidth: img.width, originalHeight: img.height, newWidth: width, newHeight: height });
          }

          // Set canvas size
          canvas.width = width;
          canvas.height = height;
          
          console.log('🎨 Drawing image to canvas...');
          
          // Clear canvas first
          ctx.clearRect(0, 0, width, height);
          
          // Draw image to canvas with better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          console.log('📊 Getting image data...');
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, width, height);
          
          console.log('📊 Image data obtained:', {
            width: imageData.width,
            height: imageData.height,
            dataLength: imageData.data.length
          });
          
          // Import and use jsQR with better options
          console.log('🔍 Loading jsQR library...');
          
          let jsQR;
          try {
            // Import jsQR - it's a default export
            jsQR = (await import('jsqr')).default;
            console.log('✅ jsQR library loaded:', typeof jsQR);
            
            if (typeof jsQR !== 'function') {
              console.error('❌ jsQR is not a function:', typeof jsQR, jsQR);
              throw new Error('QR detection library is not properly loaded. Please refresh the page and try again.');
            }
            
          } catch (importError) {
            console.error('❌ Failed to import jsQR:', importError);
            throw new Error('Failed to load QR detection library. Please refresh the page and try again.');
          }
          
          // Try multiple detection attempts with different settings
          let code = null;
          let attemptCount = 0;
          
          try {
            console.log('🔍 Attempt 1: Normal detection...');
            attemptCount++;
            code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            
            if (code) {
              console.log('✅ QR Code found on attempt', attemptCount, ':', code.data);
            } else {
              console.log('❌ Attempt 1 failed, trying inverted...');
              
              // Second attempt - with inversion
              console.log('🔍 Attempt 2: Inverted detection...');
              attemptCount++;
              code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "onlyInvert",
              });
              
              if (code) {
                console.log('✅ QR Code found on attempt', attemptCount, '(inverted):', code.data);
              } else {
                console.log('❌ Attempt 2 failed, trying both...');
                
                // Third attempt - try both
                console.log('🔍 Attempt 3: Both normal and inverted...');
                attemptCount++;
                code = jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: "attemptBoth",
                });
                
                if (code) {
                  console.log('✅ QR Code found on attempt', attemptCount, '(both):', code.data);
                } else {
                  console.log('❌ Attempt 3 failed, trying contrast enhancement...');
                  
                  // Fourth attempt - enhance contrast and try again
                  console.log('🔍 Attempt 4: Contrast enhancement...');
                  attemptCount++;
                  
                  // Create a copy of image data for contrast enhancement
                  const enhancedImageData = ctx.createImageData(imageData.width, imageData.height);
                  const originalData = imageData.data;
                  const enhancedData = enhancedImageData.data;
                  
                  // Enhance contrast
                  for (let i = 0; i < originalData.length; i += 4) {
                    // Convert to grayscale and enhance contrast
                    const gray = 0.299 * originalData[i] + 0.587 * originalData[i + 1] + 0.114 * originalData[i + 2];
                    const enhanced = gray > 128 ? 255 : 0; // High contrast
                    enhancedData[i] = enhanced;     // Red
                    enhancedData[i + 1] = enhanced; // Green
                    enhancedData[i + 2] = enhanced; // Blue
                    enhancedData[i + 3] = originalData[i + 3]; // Alpha
                  }
                  
                  code = jsQR(enhancedData.data, enhancedImageData.width, enhancedImageData.height, {
                    inversionAttempts: "attemptBoth",
                  });
                  
                  if (code) {
                    console.log('✅ QR Code found on attempt', attemptCount, '(contrast enhanced):', code.data);
                  } else {
                    console.log('❌ All', attemptCount, 'attempts failed');
                  }
                }
              }
            }
          } catch (detectionError) {
            console.error('❌ QR detection error:', detectionError);
            throw new Error(`QR detection failed: ${detectionError.message}`);
          }

          if (code) {
            console.log('🎉 FINAL SUCCESS: QR Code detected after', attemptCount, 'attempts');
            console.log('📱 QR Code data:', code.data);
            console.log('📍 QR Code location:', code.location);
            handleScanSuccess(code.data);
          } else {
            console.log('❌ FINAL FAILURE: No QR code found after', attemptCount, 'attempts');
            setError(`No QR code found in the image after ${attemptCount} detection attempts.\n\nTips for better detection:\n• Ensure the QR code is clearly visible and not blurry\n• Use good lighting (avoid shadows)\n• Make sure the entire QR code is in the photo\n• Try taking the photo from different angles\n• Ensure the QR code is not damaged or distorted`);
          }
        } catch (err) {
          console.error('❌ QR processing error:', err);
          setError(`Failed to process the image: ${err.message}\n\nPlease try:\n• Taking a new photo\n• Using a different image\n• Ensuring good lighting`);
        } finally {
          setProcessing(false);
        }
      };

      img.onerror = (err) => {
        console.error('❌ Image load error:', err);
        setError('Failed to load the image. Please select a valid image file (JPG, PNG, etc.).');
        setProcessing(false);
      };

      console.log('🔄 Loading image...');
      // Load image
      img.src = URL.createObjectURL(file);
      
    } catch (err) {
      console.error('❌ File processing error:', err);
      setError(`Failed to process the selected file: ${err.message}`);
      setProcessing(false);
    }

    // Reset file input
    event.target.value = '';
  };

  const handleScanSuccess = async (decodedText) => {
    console.log('🎉 QR CODE SUCCESSFULLY DETECTED:', decodedText);
    console.log('📱 Scan timestamp:', new Date().toISOString());
    
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
        // You could add a toast notification here if you have one
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg mb-4">
            <Image className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Simple QR Scanner</h1>
          <p className="text-gray-500 mt-1">Upload or take a photo of QR codes</p>
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
            </div>
          )}

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
                    <p className="text-purple-400 text-xs mt-2">🔍 Trying multiple detection methods...</p>
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

        {/* Test QR Code Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-4">🧪 Test QR Code</h3>
          <p className="text-blue-800 text-sm mb-4">
            Use this test QR code to verify the scanner is working. Take a screenshot or photo of this QR code and try scanning it.
          </p>
          
          {/* Simple QR Code using QR Server API */}
          <div className="bg-white p-4 rounded-xl border-2 border-blue-200 text-center">
            <img 
              src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Hello%20World%20-%20Test%20QR%20Code%20-%20Scanner%20Working!" 
              alt="Test QR Code" 
              className="mx-auto mb-3"
              style={{ imageRendering: 'pixelated' }}
            />
            <p className="text-xs text-gray-600 font-mono">Test Content: "Hello World - Test QR Code - Scanner Working!"</p>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-100 rounded-lg border border-yellow-200">
            <p className="text-yellow-800 text-sm font-medium">📱 How to test:</p>
            <ol className="text-yellow-700 text-xs mt-2 space-y-1">
              <li>1. Take a screenshot of the QR code above</li>
              <li>2. Use "Choose Image" and select the screenshot</li>
              <li>3. The scanner should detect: "Hello World - Test QR Code - Scanner Working!"</li>
            </ol>
          </div>
        </div>

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
          
          <div className="mt-3 p-3 bg-blue-100 rounded-lg border border-blue-200">
            <h4 className="text-blue-800 text-sm font-semibold mb-2">💡 Tips for Better QR Detection:</h4>
            <ul className="text-blue-700 text-xs space-y-1">
              <li>• Ensure good lighting when taking photos</li>
              <li>• Hold the camera steady and get close to the QR code</li>
              <li>• Make sure the entire QR code is visible in the frame</li>
              <li>• Avoid shadows or reflections on the QR code</li>
              <li>• Try different angles if the first attempt doesn't work</li>
            </ul>
          </div>
        </div>

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </Layout>
  );
}