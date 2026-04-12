import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout/Layout";
import {
  Camera,
  CheckCircle,
  AlertCircle,
  Clock,
  Smartphone,
  Zap,
  User,
} from "lucide-react";
import { isAuthenticated, getAuthToken } from "@/lib/auth";

const API_URL = "/api";

export default function MobileQRScannerPage() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState(null);
  const [scanTimestamp, setScanTimestamp] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({ today: 0, total: 0 });
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [awaitingAcknowledgment, setAwaitingAcknowledgment] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadStats();
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/scan-events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setEvents(data.data.filter((e) => e.status === "ACTIVE") || []);
      }
    } catch (err) {
      console.error("Error loading events:", err);
    }
  };

  const loadStats = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/qr-scans/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(
          `❌ Stats Error\n\nHTTP ${response.status}: ${data.error || "Failed to load stats"}\nURL: ${API_URL}/qr-scans/stats`,
        );
      }
    } catch (err) {
      console.error("Error loading stats:", err);
      if (err.name === "TypeError") {
        setError(
          `❌ Connection Error\n\nCannot connect to server at ${API_URL}. Please check your connection.`,
        );
      }
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Prevent scanning if awaiting acknowledgment
    if (awaitingAcknowledgment) {
      event.target.value = "";
      return;
    }

    console.log("📱 Mobile QR scan started:", file.name);

    setError(null);
    setScanResult(null);
    setScanTimestamp(null);
    setProcessing(true);

    try {
      // Use the most reliable detection method for mobile
      const result = await detectQRSimple(file);
      if (result) {
        await handleScanSuccess(result);
      } else {
        setError(
          "No QR code detected. Please try again with better lighting and make sure the QR code is clearly visible.",
        );
      }
    } catch (err) {
      console.error("❌ Scan error:", err);
      setError(`Scan failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }

    event.target.value = "";
  };

  const detectQRSimple = async (file) => {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = async () => {
        try {
          console.log("📱 Processing image for QR detection...");

          // Create canvas
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

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
            console.log("🔍 Trying jsQR detection...");

            // Use dynamic import with CDN fallback
            let jsQR;
            try {
              const jsQRModule = await import("jsqr");
              jsQR = jsQRModule.default;
            } catch (importError) {
              console.log("📦 Local import failed, trying CDN...");
              // Fallback to CDN
              const script = document.createElement("script");
              script.src =
                "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
              document.head.appendChild(script);

              await new Promise((resolve, reject) => {
                script.onload = () => resolve();
                script.onerror = () => reject(new Error("CDN load failed"));
              });

              jsQR = window.jsQR;
            }

            if (typeof jsQR === "function") {
              // Try multiple detection settings
              const detectionOptions = [
                { inversionAttempts: "dontInvert" },
                { inversionAttempts: "onlyInvert" },
                { inversionAttempts: "attemptBoth" },
              ];

              for (const options of detectionOptions) {
                console.log("🔍 Trying detection with options:", options);
                const code = jsQR(
                  imageData.data,
                  imageData.width,
                  imageData.height,
                  options,
                );

                if (code && code.data) {
                  console.log("✅ QR Code detected:", code.data);
                  resolve(code.data);
                  return;
                }
              }

              console.log("❌ No QR code found with jsQR");
            } else {
              console.log("❌ jsQR not available");
            }
          } catch (jsqrError) {
            console.log("❌ jsQR error:", jsqrError.message);
          }

          resolve(null);
        } catch (err) {
          console.error("❌ Detection error:", err);
          resolve(null);
        }
      };

      img.onerror = () => {
        console.error("❌ Image load failed");
        resolve(null);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleScanSuccess = async (qrData) => {
    const timestamp = new Date();
    console.log("🎉 QR Code Scanned:", qrData);

    // Save to database and check for duplicates
    const saved = await saveQRScan(qrData, timestamp);

    // Only show success and update stats if successfully saved (not a duplicate)
    if (saved) {
      setScanResult(qrData);
      setScanTimestamp(timestamp);
      setStats((prev) => ({
        ...prev,
        today: prev.today + 1,
        total: prev.total + 1,
      }));
      console.log("✅ QR scan successful and saved to database");
    } else {
      console.log("❌ QR scan detected but not saved to database");
      // Error message is already set by saveQRScan function
      // This covers both duplicates and database save failures
    }
  };

  const saveQRScan = async (qrData, timestamp) => {
    try {
      const token = getAuthToken();

      if (!token) {
        setError(
          "❌ Authentication Error\n\nYou are not logged in. Please login and try again.",
        );
        return false;
      }

      const response = await fetch(`${API_URL}/qr-scans`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qr_data: qrData,
          event_id: selectedEventId,
          scan_timestamp: timestamp.toISOString(),
          scanner_type: "mobile-qr",
          device_info: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenWidth: screen.width,
            screenHeight: screen.height,
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError(
            "❌ Authentication Error\n\nYour session has expired. Please login again.",
          );
          return false;
        } else if (response.status === 500) {
          setError(
            "❌ Server Error\n\nDatabase connection failed. Please try again later.",
          );
          return false;
        } else if (response.status === 409) {
          // Handle duplicate - this will be processed below (result.isDuplicate)
        } else {
          setError(
            `❌ Network Error\n\nHTTP ${response.status}: Failed to connect to server.\nURL: ${API_URL}/qr-scans`,
          );
          return false;
        }
      }

      const result = await response.json();

      if (response.status === 409 && result.isDuplicate) {
        // Handle duplicate QR code - require acknowledgment
        console.log("⚠️ Duplicate QR code detected");
        setDuplicateInfo({
          qrData: qrData,
          message: result.message,
          existingScan: result.existingScan,
        });
        setAwaitingAcknowledgment(true);
        return false;
      } else if (result.success) {
        console.log("✅ QR scan saved to database");
        return true;
      } else {
        console.error("❌ Failed to save scan:", result.error);
        setError(
          `❌ Database Save Failed\n\n${result.error || "Unknown error occurred"}\n\nQR code was detected but not saved to database.`,
        );
        return false;
      }
    } catch (err) {
      console.error("❌ Database save error:", err);
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setError(
          "❌ Connection Error\n\nCannot connect to server. Please check your internet connection and try again.",
        );
      } else {
        setError(
          `❌ Unexpected Error\n\n${err.message}\n\nQR code was detected but not saved to database.`,
        );
      }
      return false;
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setScanTimestamp(null);
    setError(null);
    setDuplicateInfo(null);
    setAwaitingAcknowledgment(false);
  };

  const acknowledgeDuplicate = () => {
    setDuplicateInfo(null);
    setAwaitingAcknowledgment(false);
    // Scanner is now ready for new scans
  };

  const triggerCamera = () => {
    // Prevent new scans if awaiting acknowledgment
    if (awaitingAcknowledgment) {
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2">
        <div className="max-w-md mx-auto space-y-3">
          {/* Header */}
          <div className="text-center bg-white rounded-2xl p-3 shadow-lg">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-1">
              Mobile QR Scanner
            </h1>
            <p className="text-xs text-gray-600">
              Scan any QR code with your mobile device
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-xl p-3 shadow-sm text-center">
              <div className="text-xl font-bold text-blue-600 mb-1">
                {stats.today}
              </div>
              <div className="text-xs text-gray-500">Today</div>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm text-center">
              <div className="text-xl font-bold text-green-600 mb-1">
                {stats.total}
              </div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>

          {/* Event Selection */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-indigo-100">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">
              Scanning For Event:
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="" disabled>
                -- Select an Active Event --
              </option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name}
                </option>
              ))}
            </select>
            {events.length === 0 && (
              <p className="text-red-500 text-xs mt-2 italic">
                ⚠️ No active events found. Please create one on the dashboard.
              </p>
            )}
          </div>

          {/* Duplicate Warning Modal */}
          {duplicateInfo && awaitingAcknowledgment && (
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-5 text-white shadow-2xl animate-in zoom-in duration-300">
              <div className="text-center mb-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-black">Hold On!</h3>
                <p className="text-sm text-amber-100 font-medium">
                  This QR code was already scanned
                </p>
              </div>
    
              <div className="bg-black/10 rounded-2xl p-4 mb-4 border border-white/10">
                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] font-bold text-amber-200 uppercase tracking-widest mb-1">
                      SCANNING CONTEXT
                    </div>
                    <p className="text-sm text-white font-bold break-all bg-white/10 p-2 rounded-lg">
                      {duplicateInfo.qrData}
                    </p>
                  </div>
    
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                    <div>
                      <div className="text-[10px] font-bold text-amber-200 uppercase tracking-widest mb-1">
                        BY STAFF
                      </div>
                      <div className="flex items-center gap-2 text-white">
                        <User className="w-3 h-3" />
                        <span className="text-xs font-bold">{duplicateInfo.existingScan.scanned_by_name || "Unknown"}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-amber-200 uppercase tracking-widest mb-1">
                        TIMESTAMP
                      </div>
                      <div className="flex items-center gap-2 text-white">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs font-bold">
                          {new Date(duplicateInfo.existingScan.scan_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
    
              <button
                onClick={acknowledgeDuplicate}
                className="w-full bg-white text-orange-600 py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Acknowledge & Continue
              </button>
            </div>
          )}

          {/* Success Result - Only show for successful, non-duplicate scans */}
          {scanResult && !duplicateInfo && !awaitingAcknowledgment && (
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-3 text-white shadow-xl">
              <div className="text-center mb-2">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-bold">✅ QR Code Saved!</h3>
                <p className="text-xs text-green-100">
                  Successfully scanned and saved to database
                </p>
              </div>

              <div className="bg-white bg-opacity-20 rounded-xl p-2 mb-2">
                <div className="text-xs font-semibold text-green-100 mb-1">
                  QR CODE DATA:
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-2 mb-2">
                  <p className="font-mono text-white text-xs font-bold break-all">
                    {scanResult}
                  </p>
                </div>

                {scanTimestamp && (
                  <div className="border-t border-white border-opacity-20 pt-2">
                    <div className="text-xs font-semibold text-green-100 mb-1">
                      SCAN TIME:
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <Clock className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">
                          {scanTimestamp.toLocaleTimeString()}
                        </div>
                        <div className="text-green-100 text-xs">
                          {scanTimestamp.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-white border-opacity-20 pt-2 mt-2">
                  <div className="flex items-center justify-center gap-2 text-green-100">
                    <CheckCircle className="w-3 h-3" />
                    <span className="text-xs">
                      Saved to database successfully
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={resetScanner}
                className="w-full bg-white bg-opacity-20 text-white py-2 rounded-xl font-bold text-xs backdrop-blur-sm border border-white border-opacity-30 active:scale-95 transition-transform"
              >
                Scan Another QR Code
              </button>
            </div>
          )}

          {/* Scanner Interface - Show when no scan result and no duplicate warning */}
          {!scanResult && !duplicateInfo && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {!processing ? (
                <div className="p-4 text-center">
                  <div
                    className={`w-24 h-24 mx-auto rounded-2xl flex items-center justify-center mb-3 border-4 border-dashed ${
                      awaitingAcknowledgment
                        ? "bg-gray-100 border-gray-300"
                        : "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300"
                    }`}
                  >
                    <Camera
                      className={`w-10 h-10 ${
                        awaitingAcknowledgment
                          ? "text-gray-400"
                          : "text-blue-400"
                      }`}
                    />
                  </div>

                  <h3
                    className={`text-base font-bold mb-2 ${
                      awaitingAcknowledgment ? "text-gray-500" : "text-gray-900"
                    }`}
                  >
                    {awaitingAcknowledgment
                      ? "Scanner Disabled"
                      : !selectedEventId
                        ? "Event Required"
                        : "Ready to Scan"}
                  </h3>
                  <p
                    className={`mb-3 text-xs ${
                      awaitingAcknowledgment ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {awaitingAcknowledgment
                      ? "Please acknowledge the duplicate warning above to continue"
                      : !selectedEventId
                        ? "Please select an event above before scanning"
                        : "Tap the button to take a photo of any QR code"}
                  </p>

                  <button
                    onClick={triggerCamera}
                    disabled={awaitingAcknowledgment || !selectedEventId}
                    className={`w-full py-3 px-6 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                      awaitingAcknowledgment || !selectedEventId
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white active:scale-95"
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    {awaitingAcknowledgment
                      ? "Scanner Disabled"
                      : !selectedEventId
                        ? "Select Event First"
                        : "Take Photo & Scan"}
                  </button>

                  <p
                    className={`text-xs mt-2 flex items-center justify-center gap-1 ${
                      awaitingAcknowledgment ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    {awaitingAcknowledgment
                      ? "Acknowledge duplicate to continue"
                      : "Optimized for mobile phones"}
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={awaitingAcknowledgment}
                  />
                </div>
              ) : (
                <div className="p-4 text-center">
                  <div className="w-24 h-24 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                  <h3 className="text-base font-bold text-blue-600 mb-2">
                    Processing...
                  </h3>
                  <p className="text-blue-500 text-xs">
                    Detecting QR code in your photo
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && !duplicateInfo && (
            <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-red-100 animate-in slide-in-from-bottom duration-300">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4 border border-red-100 shadow-sm">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Scan Failed</h3>
                <div className="text-gray-500 mb-6 text-sm font-medium leading-relaxed max-w-[280px]">
                  {error}
                </div>
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    onClick={() => {
                      setError(null);
                      triggerCamera();
                    }}
                    className="bg-red-500 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setError(null)}
                    className="bg-gray-100 text-gray-700 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              Scanning Tips
            </h3>
            <div className="space-y-2 text-xs text-gray-700">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Hold phone 6-12 inches from QR code</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Ensure good lighting (avoid shadows)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Keep camera steady when taking photo</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Make sure entire QR code is visible</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
