import { useState } from 'react';
import { Pen, Upload, Check } from 'lucide-react';
import SignaturePad from './SignaturePad';
import SignatureUpload from './SignatureUpload';

export default function SignatureInput({ 
  onSignatureChange, 
  required = false,
  label = "Digital Signature",
  defaultMethod = 'draw' // 'draw' or 'upload'
}) {
  const [method, setMethod] = useState(defaultMethod);
  const [signature, setSignature] = useState(null);

  const handleSignatureChange = (signatureData) => {
    setSignature(signatureData);
    onSignatureChange(signatureData);
  };

  const switchMethod = (newMethod) => {
    setMethod(newMethod);
    setSignature(null);
    onSignatureChange(null);
  };

  return (
    <div className="signature-input-container">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {/* Method Selection Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
          <button
            type="button"
            onClick={() => switchMethod('draw')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              method === 'draw'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Pen className="w-4 h-4" />
            Draw Signature
          </button>
          <button
            type="button"
            onClick={() => switchMethod('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              method === 'upload'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload Image
          </button>
        </div>
      </div>

      {/* Signature Input Component */}
      <div className="signature-input-area">
        {method === 'draw' ? (
          <SignaturePad
            onSignatureChange={handleSignatureChange}
            width={400}
            height={200}
            required={required}
            label=""
          />
        ) : (
          <SignatureUpload
            onSignatureChange={handleSignatureChange}
            required={required}
            label=""
            maxSize={1024 * 1024} // 1MB
          />
        )}
      </div>

      {/* Status Indicator */}
      {signature && (
        <div className="mt-3 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
          <Check className="w-4 h-4" />
          <span>Signature captured successfully</span>
        </div>
      )}
    </div>
  );
}