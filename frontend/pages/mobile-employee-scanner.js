import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout/Layout';
import { 
  Camera, CheckCircle, AlertCircle, RefreshCw, 
  User, Clock, Smartphone, Zap
} from 'lucide-react';
import { isAuthenticated, getAuthToken } from '@/lib/auth';
import { API_URL } from '@/lib/api';

export default function MobileEmployeeScannerPage() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({ today: 0, total: 0 });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/employee-scans/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('📱 Mobile scan started:', file.name);
    
    setError(null);
    setScanResult(null);
    setEmployeeData(null);
    setProcessing(true);

    try {
      // Use the most reliable detection method for mobile
      const result = await detectQRSimple(file);
      if (result) {
        await handleScanSuccess(result);
      } else {
        setError('No QR code detected. Please try again with better lighting and make sure the QR code is clearly visible.');
      }
    } catch (err) {
      console.error('❌ Scan error:', err);
      setError(`Scan failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }

    event.target.value = '';
  };

  const detectQRSimple = async (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = async () => {
        try {
          console.log('📱 Processing image for QR detection...');
          
          // Create canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Optimize size for mobile
          const maxSize = 600;
          let { width, height } = img;
          
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          const imageData = ctx.getImageData(0, 0, width, height);
          
          // Try jsQR with simple import
          try {
            console.log('🔍 Trying jsQR detection...');
            
            // Use dynamic import with CDN fallback
            let jsQR;
            try {
              const jsQRModule = await import('jsqr');
              jsQR = jsQRModule.default;
            } catch (importError) {
              console.log('📦 Local import failed, trying CDN...');
              // Fallback to CDN
              const script = document.createElement('script');
              script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
              document.head.appendChild(script);
              
              await new Promise((resolve, reject) => {
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('CDN load failed'));
              });
              
              jsQR = window.jsQR;
            }
            
            if (typeof jsQR === 'function') {
              // Try multiple detection settings
              const detectionOptions = [
                { inversionAttempts: "dontInvert" },
                { inversionAttempts: "onlyInvert" },
                { inversionAttempts: "attemptBoth" }
              ];
              
              for (const options of detectionOptions) {
                console.log('🔍 Trying detection with options:', options);
                const code = jsQR(imageData.data, imageData.width, imageData.height, options);
                
                if (code && code.data) {
                  console.log('✅ QR Code detected:', code.data);
                  resolve(code.data);
                  return;
                }
              }
              
              console.log('❌ No QR code found with jsQR');
            } else {
              console.log('❌ jsQR not available');
            }
          } catch (jsqrError) {
            console.log('❌ jsQR error:', jsqrError.message);
          }
          
          // If jsQR fails, try a simple pattern matching approach
          console.log('🔍 Trying pattern matching fallback...');
          
          // Convert to grayscale and look for QR-like patterns
          const grayData = new Uint8ClampedArray(width * height);
          for (let i = 0; i < imageData.data.length; i += 4) {
            const gray = 0.299 * imageData.data[i] + 0.587 * imageData.data[i + 1] + 0.114 * imageData.data[i + 2];
            grayData[i / 4] = gray;
          }
          
          // Look for high contrast patterns that might indicate QR codes
          let hasHighContrast = false;
          let blackPixels = 0;
          let whitePixels = 0;
          
          for (let i = 0; i < grayData.length; i++) {
            if (grayData[i] < 100) blackPixels++;
            else if (grayData[i] > 155) whitePixels++;
          }
          
          const contrastRatio = Math.abs(blackPixels - whitePixels) / grayData.length;
          hasHighContrast = contrastRatio > 0.1;
          
          console.log('📊 Image analysis:', { 
            blackPixels, 
            whitePixels, 
            contrastRatio, 
            hasHighContrast 
          });
          
          if (hasHighContrast) {
            console.log('⚠️ High contrast detected but no QR found - image might contain QR code');
          }
          
          resolve(null);
          
        } catch (err) {
          console.error('❌ Detection error:', err);
          resolve(null);
        }
      };

      img.onerror = () => {
        console.error('❌ Image load failed');
        resolve(null);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleScanSuccess = async (qrData) => {
    console.log('🎉 QR Code Scanned:', qrData);
    setScanResult(qrData);
    
    // Save to database
    await saveEmployeeScan(qrData);
    
    // Try to get employee details
    await fetchEmployeeData(qrData);
    
    // Update stats
    setStats(prev => ({ ...prev, today: prev.today + 1, total: prev.total + 1 }));
  };

  const saveEmployeeScan = async (qrData) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/employee-scans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          qr_data: qrData,
          scan_timestamp: new Date().toISOString(),
          scanner_type: 'mobile-simple',
          device_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenWidth: screen.width,
            screenHeight: screen.height
          }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('✅ Scan saved to database');
      }
    } catch (err) {
      console.error('❌ Database save error:', err);
    }
  };

  const fetchEmployeeData = async (qrData) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/employees/by-qr?qr=${encodeURIComponent(qrData)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success && data.employee) {
        setEmployeeData(data.employee);
      }
    } catch (err) {
      console.error('Error fetching employee data:', err);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setEmployeeData(null);
    setError(null);
  };

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto space-y-6">
          
          {/* Header */}
          <div className="text-center bg-white rounded-3xl p-6 shadow-lg">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Smartphone className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Employee Scanner</h1>
            <p className="text-gray-600">Mobile-optimized QR scanner</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{stats.today}</div>
              <div className="text-sm text-gray-500">Today</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{stats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>

          {/* Success Result */}
          {scanResult && (
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl p-6 text-white shadow-xl">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold">Scan Successful!</h3>
                <p className="text-green-100">Employee QR code detected</p>
              </div>

              <div className="bg-white bg-opacity-20 rounded-2xl p-4 mb-4">
                <div className="text-sm font-semibold text-green-100 mb-2">QR CODE DATA:</div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3 mb-3">
                  <p className="font-mono text-white font-bold break-all">{scanResult}</p>
                </div>
                
                {employeeData && (
                  <div className="border-t border-white border-opacity-20 pt-3">
                    <div className="text-sm font-semibold text-green-100 mb-2">EMPLOYEE:</div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-white">{employeeData.name}</div>
                        <div className="text-green-100">{employeeData.position}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={resetScanner}
                className="w-full bg-white bg-opacity-20 text-white py-4 rounded-2xl font-bold text-lg backdrop-blur-sm border border-white border-opacity-30 active:scale-95 transition-transform"
              >
                Scan Another Employee
              </button>
            </div>
          )}

          {/* Scanner Interface */}
          {!scanResult && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              {!processing ? (
                <div className="p-8 text-center">
                  <div className="w-40 h-40 mx-auto bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl flex items-center justify-center mb-6 border-4 border-dashed border-blue-300">
                    <Camera className="w-16 h-16 text-blue-400" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Scan</h3>
                  <p className="text-gray-600 mb-6">Tap the button to take a photo of the employee QR code</p>
                  
                  <button
                    onClick={triggerCamera}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-5 px-8 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <Camera className="w-6 h-6" />
                    Take Photo & Scan
                  </button>
                  
                  <p className="text-xs text-gray-500 mt-4 flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3" />
                    Optimized for mobile phones
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-40 h-40 mx-auto bg-blue-50 rounded-3xl flex items-center justify-center mb-6">
                    <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                  <h3 className="text-xl font-bold text-blue-600 mb-2">Processing...</h3>
                  <p className="text-blue-500">Detecting QR code in your photo</p>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-800 mb-2">Scan Failed</h3>
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={() => { setError(null); triggerCamera(); }}
                    className="bg-red-100 text-red-700 px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Scanning Tips
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Hold phone 6-12 inches from QR code</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Ensure good lighting (avoid shadows)</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Keep camera steady when taking photo</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Make sure entire QR code is visible</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}