import { useState } from 'react';
import Layout from '@/components/Layout/Layout';

// Simple inline signature component for testing
function SimpleSignaturePad({ onSignatureChange }) {
  const [signature, setSignature] = useState(null);

  const handleCanvasClick = () => {
    // Create a simple test signature
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    // Draw a simple signature
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 400, 200);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 100);
    ctx.lineTo(150, 80);
    ctx.lineTo(250, 120);
    ctx.lineTo(350, 100);
    ctx.stroke();
    
    const signatureData = canvas.toDataURL('image/png');
    setSignature(signatureData);
    onSignatureChange(signatureData);
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
      <div 
        className="w-full h-48 bg-white border border-gray-300 rounded cursor-pointer flex items-center justify-center"
        onClick={handleCanvasClick}
      >
        {signature ? (
          <img src={signature} alt="Signature" className="max-w-full max-h-full" />
        ) : (
          <p className="text-gray-500">Click to create test signature</p>
        )}
      </div>
      <div className="mt-2 text-center">
        <button 
          onClick={() => {
            setSignature(null);
            onSignatureChange(null);
          }}
          className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export default function DebugSignature() {
  const [signature, setSignature] = useState(null);
  const [testResult, setTestResult] = useState('');

  const testGetSignatures = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        document.getElementById('getSignaturesResult').innerHTML = 
          '<div class="text-red-600">❌ No auth token found. Please login first.</div>';
        return;
      }

      document.getElementById('getSignaturesResult').innerHTML = 
        '<div class="text-blue-600">🔄 Fetching signatures...</div>';

      const response = await fetch('http://localhost:5005/api/user/signatures', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        let resultHtml = `<div class="text-green-600">✅ Found ${data.signatures.length} signatures:</div>`;
        
        data.signatures.forEach((sig, index) => {
          resultHtml += `
            <div class="mt-2 p-2 bg-white border rounded">
              <p><strong>Signature ${index + 1}:</strong> ${sig.name}</p>
              <p><strong>Created:</strong> ${new Date(sig.created_at).toLocaleString()}</p>
              <p><strong>Has Data:</strong> ${sig.signature_data ? '✅ Yes' : '❌ No'}</p>
              ${sig.signature_data ? `
                <div class="mt-2">
                  <img src="${sig.signature_data}" alt="Signature" class="max-w-full h-16 object-contain border" />
                </div>
              ` : ''}
            </div>
          `;
        });
        
        document.getElementById('getSignaturesResult').innerHTML = resultHtml;
      } else {
        document.getElementById('getSignaturesResult').innerHTML = 
          `<div class="text-red-600">❌ Failed to get signatures: ${data.message}</div>`;
      }
    } catch (error) {
      document.getElementById('getSignaturesResult').innerHTML = 
        `<div class="text-red-600">❌ Network error: ${error.message}</div>`;
    }
  };
    if (!signature) {
      setTestResult('❌ Please create a signature first');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setTestResult('❌ No auth token found. Please login first.');
        return;
      }

      setTestResult('🔄 Testing API...');

      const response = await fetch('http://localhost:5005/api/user/signatures', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signatureData: signature,
          name: 'Debug Test Signature',
          isDefault: false
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setTestResult(`✅ API test successful!\nResponse: ${JSON.stringify(data, null, 2)}`);
      } else {
        setTestResult(`❌ API test failed!\nStatus: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      setTestResult(`❌ Network error: ${error.message}`);
    }
  };

  return (
    <Layout title="Debug Signature" subtitle="Test signature functionality">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🐛 Signature Debug Tool
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">1. Create Test Signature</h3>
              <SimpleSignaturePad onSignatureChange={setSignature} />
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">2. Test API</h3>
              <button
                onClick={testAPI}
                disabled={!signature}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Test Save Signature API
              </button>
            </div>

            {testResult && (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">3. Results</h3>
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto whitespace-pre-wrap">
                  {testResult}
                </pre>
              </div>
            )}

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">4. Debug Info</h3>
              <div className="bg-gray-100 p-4 rounded-lg text-sm space-y-2">
                <p><strong>Auth Token:</strong> {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}</p>
                <p><strong>User Data:</strong> {localStorage.getItem('user') ? '✅ Present' : '❌ Missing'}</p>
                <p><strong>Signature Data:</strong> {signature ? `✅ Present (${signature.length} chars)` : '❌ Missing'}</p>
                <p><strong>API URL:</strong> http://localhost:5005</p>
                
                {signature && (
                  <div className="mt-4">
                    <p><strong>Signature Preview:</strong></p>
                    <div className="mt-2 p-2 bg-white border rounded">
                      <img 
                        src={signature} 
                        alt="Signature preview" 
                        className="max-w-full h-20 object-contain border"
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Data URL: {signature.substring(0, 100)}...
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">5. Test Get Signatures</h3>
              <button
                onClick={testGetSignatures}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mr-2"
              >
                Get All Signatures
              </button>
              <div id="getSignaturesResult" className="mt-2"></div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}