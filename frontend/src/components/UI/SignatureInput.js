import { useState } from "react";
import { Upload, Check } from "lucide-react";
import SignatureUpload from "./SignatureUpload";

export default function SignatureInput({
  onSignatureChange,
  required = false,
  label = "Digital Signature",
}) {
  const [signature, setSignature] = useState(null);

  const handleSignatureChange = (signatureData) => {
    setSignature(signatureData);
    onSignatureChange(signatureData);
  };

  return (
    <div className="signature-input-container">
      <div className="mb-4">
        <label className="block text-[10px] font-black text-emerald-900 uppercase tracking-[0.2em] mb-4">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-900/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-700 border border-emerald-900/10">
          <Upload className="w-3.5 h-3.5" />
          Secure Asset Upload
        </div>
      </div>

      {/* Signature Input Component */}
      <div className="signature-input-area">
        <SignatureUpload
          onSignatureChange={handleSignatureChange}
          required={required}
          label=""
          maxSize={1024 * 1024} // 1MB
        />
      </div>

      {/* Status Indicator */}
      {signature && (
        <div className="mt-4 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl animate-fade-in shadow-sm">
          <div className="bg-emerald-500 rounded-full p-0.5 shadow-sm">
            <Check className="w-3 h-3 text-white" />
          </div>
          <span>Digital Identity Verified Successfully</span>
        </div>
      )}
    </div>
  );
}
