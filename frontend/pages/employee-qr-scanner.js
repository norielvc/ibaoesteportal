import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout/Layout';
import { 
  QrCode, Camera, CheckCircle, AlertCircle, 
  RefreshCw, User, Clock, Database, Smartphone,
  Zap, Users, Activity, Calendar
} from 'lucide-react';
import { isAuthenticated, getAuthToken } from '@/lib/auth';
import { API_URL } from '@/lib/api';

export default function EmployeeQRScannerPage() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [stats, setStats] = useState({ today: 0, total: 0 });
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    loadScanHistory();
    loadStats();
  }, []);

  const loadScanHistory = () => {
    const history = localStorage.getItem('employeeScanHistory');
    if (history) {
      setScanHistory(JSON.parse(history));
    }
  };

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

    console.log('📱 Mobile QR Scan - File selected:', file.name);
    
    setError(null);
    setScanResult(null);
    setEmployeeData(null);
    setProcessing(true);

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      // Mobile-optimized detection
      const result = await detectQRMobile(file);
      if (result) {
        await handleScanSuccess(result);
      } else {
        setError('No QR code found. Please:\n• Ensure good lighting\n• Hold camera steady\n• Get close to the QR code\n• Make sure QR code is not damaged');
      }

    } catch (err) {
      console.error('❌ Mobile scan error:', err);
      setError(`Scan failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }

    event.target.value = '';
  };

  const detectQRMobile = async (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = canvasRef.current;
      
      if (!canvas) {
        reject(new Error('Scanner not ready'));
        return;
      }

      img.onload = async () => {
        try {
          const ctx = canvas.getContext('2d');
          
          // Mobile-optimized canvas size
          const maxSize = 800; // Smaller for mobile performance
          let { width, height } = img;
          
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;
          
          // High quality drawing for mobile
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          const imageData = ctx.getImageData(0, 0, width, height);
          
          // Try multiple detection methods optimized for mobile
          let result = null;
          
          // Method 1: jsQR (most reliable for mobile)
          try {
            const jsQR = (await import('jsqr')).default;
            if (typeof jsQR === 'function') {
              console.log('📱 Trying jsQR detection...');
              result = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "attemptBoth",
              });
              if (result && result.data) {
                console.log('✅ jsQR success:', result.data);
                resolve(result.data);
                return;
              }
            }
          } catch (jsqrError) {
            console.log('❌ jsQR failed:', jsqrError.message);
          }

          // Method 2: Html5Qrcode fallback
          try {
            console.log('📱 Trying Html5Qrcode fallback...');
            const { Html5Qrcode } = await import('html5-qrcode');
            
            const tempId = 'mobile-qr-' + Date.now();
            const tempDiv = document.createElement('div');
            tempDiv.id = tempId;
            tempDiv.style.display = 'none';
            document.body.appendChild(tempDiv);

            try {
              const html5QrCode = new Html5Qrcode(tempId);
              const scanResult = await html5QrCode.scanFile(file, true);
              console.log('✅ Html5Qrcode success:', scanResult);
              resolve(scanResult);
              return;
            } finally {
              if (tempDiv.parentNode) {
                tempDiv.parentNode.removeChild(tempDiv);
              }
            }
          } catch (html5Error) {
            console.log('❌ Html5Qrcode failed:', html5Error.message);
          }

          // Method 3: Enhanced contrast detection for mobile
          try {
            console.log('📱 Trying enhanced contrast detection...');
            const enhancedImageData = ctx.createImageData(imageData.width, imageData.height);
            const originalData = imageData.data;
            const enhancedData = enhancedImageData.data;
            
            // Mobile-optimized contrast enhancement
            for (let i = 0; i < originalData.length; i += 4) {
              const gray = 0.299 * originalData[i] + 0.587 * originalData[i + 1] + 0.114 * originalData[i + 2];
              const enhanced = gray > 120 ? 255 : 0; // Adjusted threshold for mobile
              enhancedData[i] = enhanced;
              enhancedData[i + 1] = enhanced;
              enhancedData[i + 2] = enhanced;
              enhancedData[i + 3] = originalData[i + 3];
            }
            
            const jsQR = (await import('jsqr')).default;
            if (typeof jsQR === 'function') {
              result = jsQR(enhancedData.data, enhancedImageData.width, enhancedImageData.height, {
                inversionAttempts: "attemptBoth",
              });
              if (result && result.data) {
                console.log('✅ Enhanced contrast success:', result.data);
                resolve(result.data);
                return;
              }
            }
          } catch (contrastError) {
            console.log('❌ Enhanced contrast failed:', contrastError.message);
          }

          console.log('❌ All mobile detection methods failed');
          resolve(null);
          
        } catch (err) {
          console.error('❌ Mobile detection error:', err);
          reject(err);
        }
      };

      img.onerror = () => reject(new Error('Image load failed'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleScanSuccess = async (qrData) => {
    console.log('🎉 Employee QR Scanned:', qrData);
    setScanResult(qrData);
    
    // Save to database
    await saveEmployeeScan(qrData);
    
    // Update local history
    const newScan = {
      qrData,
      timestamp: new Date().toISOString(),
      id: Date.now()
    };
    
    const updatedHistory = [newScan, ...scanHistory.slice(0, 9)];
    setScanHistory(updatedHistory);
    localStorage.setItem('employeeScanHistory', JSON.stringify(updatedHistory));
    
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
          scanner_type: 'mobile',
          device_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
          }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('✅ Scan saved to database:', result.scan_id);
      } else {
        console.error('❌ Failed to save scan:', result.error);
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
      <div className="p-4 max-w-md mx-auto space-y-6 min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="text-center bg-white rounded-2xl p-6 shadow-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Employee QR Scanner</h1>
          <p className="text-gray-600 text-sm">Scan employee ID QR codes</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
            <div className="text-xs text-gray-500">Today</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-green-600">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>

        {/* Scan Result */}
        {scanResult && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-green-800">Scan Successful!</h3>
            </div>

            <div className="bg-white rounded-xl p-4 border border-green-200">
              <div className="text-xs font-semibold text-green-700 mb-2">QR DATA:</div>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="font-mono text-sm text-gray-900 break-all">{scanResult}</p>
              </div>
              
              {employeeData && (
                <div className="border-t border-green-200 pt-4">
                  <div className="text-xs font-semibold text-green-700 mb-2">EMPLOYEE:</div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{employeeData.name}</div>
                      <div className="text-sm text-gray-600">{employeeData.position}</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={resetScanner}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold text-sm"
                >
                  Scan Another
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scanner Interface */}
        {!scanResult && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {!processing ? (
              <div className="p-8 text-center">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mb-6 border-2 border-dashed border-blue-300">
                  <Camera className="w-12 h-12 text-blue-400" />
                </div>
                
                <button
                  onClick={triggerCamera}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3"
                >
                  <Camera className="w-6 h-6" />
                  Scan QR Code
                </button>
                
                <p className="text-xs text-gray-500 mt-4 flex items-center justify-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  Optimized for mobile devices
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
                <div className="w-32 h-32 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
                <p className="text-blue-600 font-semibold">Processing QR Code...</p>
                <p className="text-blue-500 text-sm mt-2">Please wait...</p>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-semibold text-sm">Scan Failed</p>
                <p className="text-red-600 text-sm mt-1 whitespace-pre-line">{error}</p>
                <button
                  onClick={() => { setError(null); triggerCamera(); }}
                  className="mt-3 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Scans */}
        {scanHistory.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-500" />
                Recent Scans
              </h3>
            </div>
            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
              {scanHistory.slice(0, 5).map((scan) => (
                <div key={scan.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <QrCode className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-mono text-xs text-gray-900 truncate max-w-32">
                        {scan.qrData}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(scan.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Quick Tips
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Hold camera 6-12 inches from QR code</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Ensure good lighting</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Keep camera steady</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Make sure QR code is not damaged</span>
            </li>
          </ul>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </Layout>
  );
}