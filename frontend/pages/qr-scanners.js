import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout/Layout';
import { 
  QrCode, Camera, Smartphone, Zap, Settings, 
  CheckCircle, ArrowRight, Globe, Image, Wrench
} from 'lucide-react';
import { isAuthenticated } from '@/lib/auth';

export default function QRScannersPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, []);

  const scanners = [
    {
      id: 'fixed',
      name: 'Fixed QR Scanner',
      description: 'Most reliable scanner with multiple detection methods. Tries jsQR → Html5Qrcode → ZXing in sequence.',
      icon: CheckCircle,
      color: 'emerald',
      status: 'Recommended',
      features: ['Multiple Libraries', 'Sequential Detection', 'Best Success Rate', 'Enhanced Error Handling'],
      path: '/qr-scanner-fixed'
    },
    {
      id: 'simple',
      name: 'Simple QR Scanner',
      description: 'Original scanner with improved jsQR library imports and multiple detection attempts.',
      icon: QrCode,
      color: 'purple',
      status: 'Updated',
      features: ['jsQR Library', '4 Detection Methods', 'Contrast Enhancement', 'Test QR Code'],
      path: '/qr-scanner-simple'
    },
    {
      id: 'alternative',
      name: 'Alternative QR Scanner',
      description: 'Uses Html5Qrcode and ZXing libraries with jsQR fallback for maximum compatibility.',
      icon: Settings,
      color: 'green',
      status: 'Enhanced',
      features: ['Html5Qrcode', 'ZXing Library', 'jsQR Fallback', 'Dynamic Elements'],
      path: '/qr-scanner-alternative'
    },
    {
      id: 'web',
      name: 'Web-Based QR Scanner',
      description: 'Pure web approach with manual input option for testing. No external library dependencies.',
      icon: Globe,
      color: 'blue',
      status: 'Experimental',
      features: ['No Dependencies', 'Manual Input', 'Web-Based Detection', 'Testing Friendly'],
      path: '/qr-scanner-web'
    },
    {
      id: 'native',
      name: 'Native QR Scanner',
      description: 'Camera-based scanner using device camera directly (if available).',
      icon: Camera,
      color: 'orange',
      status: 'Legacy',
      features: ['Direct Camera', 'Real-time Scanning', 'Native Support', 'Device Dependent'],
      path: '/qr-scanner-native'
    }
  ];

  const colorClasses = {
    emerald: {
      bg: 'from-emerald-500 to-emerald-600',
      light: 'from-emerald-50 to-emerald-100',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      button: 'bg-emerald-600 hover:bg-emerald-700',
      badge: 'bg-emerald-100 text-emerald-800'
    },
    purple: {
      bg: 'from-purple-500 to-purple-600',
      light: 'from-purple-50 to-purple-100',
      text: 'text-purple-600',
      border: 'border-purple-200',
      button: 'bg-purple-600 hover:bg-purple-700',
      badge: 'bg-purple-100 text-purple-800'
    },
    green: {
      bg: 'from-green-500 to-green-600',
      light: 'from-green-50 to-green-100',
      text: 'text-green-600',
      border: 'border-green-200',
      button: 'bg-green-600 hover:bg-green-700',
      badge: 'bg-green-100 text-green-800'
    },
    blue: {
      bg: 'from-blue-500 to-blue-600',
      light: 'from-blue-50 to-blue-100',
      text: 'text-blue-600',
      border: 'border-blue-200',
      button: 'bg-blue-600 hover:bg-blue-700',
      badge: 'bg-blue-100 text-blue-800'
    },
    orange: {
      bg: 'from-orange-500 to-orange-600',
      light: 'from-orange-50 to-orange-100',
      text: 'text-orange-600',
      border: 'border-orange-200',
      button: 'bg-orange-600 hover:bg-orange-700',
      badge: 'bg-orange-100 text-orange-800'
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-lg mb-6">
            <QrCode className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">QR Code Scanners</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Choose from our collection of QR code scanners. Each scanner uses different detection methods and libraries for maximum compatibility.
          </p>
        </div>

        {/* Status Banner */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900">QR Detection Issues Fixed!</h3>
              <p className="text-green-700">
                All scanners have been updated with improved library imports and better error handling. 
                The <strong>Fixed QR Scanner</strong> is recommended for best results.
              </p>
            </div>
          </div>
        </div>

        {/* Scanners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scanners.map((scanner) => {
            const Icon = scanner.icon;
            const colors = colorClasses[scanner.color];
            
            return (
              <div
                key={scanner.id}
                className={`bg-white rounded-2xl shadow-lg border-2 ${colors.border} hover:shadow-xl transition-all duration-300 overflow-hidden group hover:-translate-y-1`}
              >
                {/* Header */}
                <div className={`bg-gradient-to-r ${colors.bg} p-6 text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className={`px-3 py-1 ${colors.badge} text-xs font-semibold rounded-full`}>
                        {scanner.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{scanner.name}</h3>
                    <p className="text-white/90 text-sm leading-relaxed">
                      {scanner.description}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Features */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Features:</h4>
                    <div className="space-y-2">
                      {scanner.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 ${colors.button} rounded-full`}></div>
                          <span className="text-sm text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => router.push(scanner.path)}
                    className={`w-full ${colors.button} text-white py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group-hover:scale-105`}
                  >
                    <span>Open Scanner</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Test QR Code Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Image className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-blue-900 mb-4">Test QR Code</h3>
            <p className="text-blue-800 mb-6 max-w-2xl mx-auto">
              Use this test QR code to verify any scanner is working. Take a screenshot or photo and try scanning it.
            </p>
            
            <div className="bg-white p-6 rounded-xl border-2 border-blue-200 inline-block">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=QR-SCANNER-TEST-SUCCESS-2024" 
                alt="Test QR Code" 
                className="mx-auto"
                style={{ imageRendering: 'pixelated' }}
              />
              <p className="text-sm text-gray-600 font-mono mt-3">
                Expected: "QR-SCANNER-TEST-SUCCESS-2024"
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <Wrench className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">How to Use</h3>
              <ol className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                  <span><strong>Choose a scanner</strong> - Start with the "Fixed QR Scanner" for best results</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                  <span><strong>Test with the QR code above</strong> - Take a screenshot and try scanning it</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                  <span><strong>Check browser console</strong> - All scanners provide detailed logging for troubleshooting</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                  <span><strong>Try different scanners</strong> - If one doesn't work, try another with different detection methods</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => router.push('/qr-scanner-fixed')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Recommended Scanner
            </button>
            <button
              onClick={() => window.open('/test-qr-detection.html', '_blank')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Wrench className="w-4 h-4" />
              Test Page
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}