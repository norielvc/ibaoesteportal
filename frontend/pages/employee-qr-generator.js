import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout/Layout';
import { 
  QrCode, Download, Copy, RefreshCw, User, 
  Building2, Mail, Phone, Calendar, Hash
} from 'lucide-react';
import { isAuthenticated } from '@/lib/auth';

export default function EmployeeQRGeneratorPage() {
  const router = useRouter();
  const [employeeData, setEmployeeData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    position: '',
    department: '',
    email: '',
    phone: ''
  });
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrData, setQrData] = useState('');

  useState(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, []);

  const generateQRCode = () => {
    if (!employeeData.employeeId) {
      alert('Employee ID is required');
      return;
    }

    // Create QR data string
    const qrContent = employeeData.employeeId;
    setQrData(qrContent);

    // Generate QR code using QR Server API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrContent)}&format=png&ecc=M`;
    setQrCodeUrl(qrUrl);
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `employee-qr-${employeeData.employeeId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyQRData = () => {
    if (!qrData) return;
    
    navigator.clipboard.writeText(qrData).then(() => {
      alert('QR data copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy QR data');
    });
  };

  const generateRandomId = () => {
    const randomId = 'EMP' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setEmployeeData(prev => ({ ...prev, employeeId: randomId }));
  };

  const clearForm = () => {
    setEmployeeData({
      employeeId: '',
      firstName: '',
      lastName: '',
      position: '',
      department: '',
      email: '',
      phone: ''
    });
    setQrCodeUrl('');
    setQrData('');
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee QR Generator</h1>
          <p className="text-gray-600">Generate QR codes for employee identification</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Employee Form */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              Employee Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee ID *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={employeeData.employeeId}
                    onChange={(e) => setEmployeeData(prev => ({ ...prev, employeeId: e.target.value }))}
                    placeholder="EMP0001"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <button
                    onClick={generateRandomId}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Generate random ID"
                  >
                    <Hash className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={employeeData.firstName}
                    onChange={(e) => setEmployeeData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={employeeData.lastName}
                    onChange={(e) => setEmployeeData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <input
                  type="text"
                  value={employeeData.position}
                  onChange={(e) => setEmployeeData(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="Software Developer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={employeeData.department}
                  onChange={(e) => setEmployeeData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="IT Department"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={employeeData.email}
                  onChange={(e) => setEmployeeData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john.doe@company.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={employeeData.phone}
                  onChange={(e) => setEmployeeData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={generateQRCode}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all flex items-center justify-center gap-2"
                >
                  <QrCode className="w-5 h-5" />
                  Generate QR Code
                </button>
                <button
                  onClick={clearForm}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* QR Code Display */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-purple-600" />
              Generated QR Code
            </h3>

            {qrCodeUrl ? (
              <div className="space-y-6">
                {/* QR Code Image */}
                <div className="text-center">
                  <div className="inline-block p-6 bg-white border-2 border-gray-200 rounded-2xl shadow-sm">
                    <img 
                      src={qrCodeUrl} 
                      alt="Employee QR Code"
                      className="w-64 h-64 mx-auto"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                </div>

                {/* QR Data */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QR Code Data:
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="font-mono text-lg text-gray-900 break-all text-center">
                      {qrData}
                    </p>
                  </div>
                </div>

                {/* Employee Summary */}
                {(employeeData.firstName || employeeData.lastName || employeeData.position) && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-3">Employee Summary</h4>
                    <div className="space-y-2 text-sm">
                      {(employeeData.firstName || employeeData.lastName) && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-purple-600" />
                          <span className="text-purple-800">
                            {employeeData.firstName} {employeeData.lastName}
                          </span>
                        </div>
                      )}
                      {employeeData.position && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-purple-600" />
                          <span className="text-purple-800">{employeeData.position}</span>
                        </div>
                      )}
                      {employeeData.department && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-purple-600" />
                          <span className="text-purple-800">{employeeData.department}</span>
                        </div>
                      )}
                      {employeeData.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-purple-600" />
                          <span className="text-purple-800">{employeeData.email}</span>
                        </div>
                      )}
                      {employeeData.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-purple-600" />
                          <span className="text-purple-800">{employeeData.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={downloadQRCode}
                    className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download PNG
                  </button>
                  <button
                    onClick={copyQRData}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy className="w-5 h-5" />
                    Copy Data
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium">No QR Code Generated</p>
                <p className="text-gray-400 text-sm mt-1">Fill in the employee information and click "Generate QR Code"</p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
          <h3 className="font-semibold text-purple-900 mb-4">📋 How to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-purple-800 mb-2">Creating QR Codes:</h4>
              <ul className="space-y-1 text-sm text-purple-700">
                <li>• Enter Employee ID (required)</li>
                <li>• Fill in additional employee details</li>
                <li>• Click "Generate QR Code"</li>
                <li>• Download the PNG image</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-purple-800 mb-2">Using QR Codes:</h4>
              <ul className="space-y-1 text-sm text-purple-700">
                <li>• Print QR codes on employee ID cards</li>
                <li>• Use Mobile Employee Scanner to scan</li>
                <li>• Track attendance and access</li>
                <li>• Monitor scan activity in dashboard</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}