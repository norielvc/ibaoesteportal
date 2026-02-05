import { useState, useEffect, useRef } from 'react';
import { X, FileText, Eye, Send, Printer, CheckCircle, AlertCircle, Info, Download, Search } from 'lucide-react';
import ResidentSearchModal from '../Modals/ResidentSearchModal';
// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

// Default officials data (fallback)
const defaultOfficials = {
  chairman: 'ALEXANDER C. MANIO',
  secretary: 'ROYCE ANN C. GALVEZ',
  treasurer: 'MA. LUZ S. REYES',
  skChairman: 'JOHN RUZZEL C. SANTOS',
  councilors: [
    'JOELITO C. MANIO', 'ENGELBERT M. INDUCTIVO', 'NORMANDO T. SANTOS',
    'JOPHET M. TURLA', 'JOHN BRYAN C. CRUZ', 'ARNEL D. BERNARDINO', 'LORENA G. LOPEZ'
  ],
  administrator: 'ROBERT D. SANTOS',
  assistantSecretary: 'PERLITA C. DE JESUS',
  assistantAdministrator: 'KHINZ JANZL V. BARROGA',
  recordKeeper: 'EMIL D. ROBLES',
  clerk: 'CIELITO B. DE LEON',
  contactInfo: {
    address: 'Purok 2 (Sitio Banawe) Barangay Iba O\' Este, Calumpit, Bulacan',
    contactPerson: 'Sec. Royce Ann C. Galvez',
    telephone: '0967 631 9168',
    email: 'anneseriousme@gmail.com'
  },
  headerInfo: {
    country: 'Republic of the Philippines',
    province: 'Province of Bulacan',
    municipality: 'Municipality of Calumpit',
    barangayName: 'BARANGAY IBA O\' ESTE',
    officeName: 'Office of the Punong Barangay'
  },
  logos: { leftLogo: '/iba-o-este.png', rightLogo: '/calumpit.png', logoSize: 80, captainImage: '/images/brgycaptain.png' },
  headerStyle: { bgColor: '#ffffff', borderColor: '#1e40af', fontFamily: 'default' },
  countryStyle: { color: '#4b5563', size: 12, fontWeight: 'normal', fontFamily: 'default' },
  provinceStyle: { color: '#4b5563', size: 12, fontWeight: 'normal', fontFamily: 'default' },
  municipalityStyle: { color: '#4b5563', size: 12, fontWeight: 'normal', fontFamily: 'default' },
  barangayNameStyle: { color: '#1e40af', size: 20, fontWeight: 'bold', fontFamily: 'default' },
  officeNameStyle: { color: '#6b7280', size: 11, fontWeight: 'normal', fontFamily: 'default' },
  sidebarStyle: { bgColor: '#1e40af', gradientEnd: '#1e3a8a', textColor: '#ffffff', labelColor: '#fde047', titleSize: 14, textSize: 11, fontFamily: 'default' },
  bodyStyle: { bgColor: '#ffffff', textColor: '#1f2937', titleColor: '#1e3a8a', titleSize: 24, textSize: 14, fontFamily: 'default' },
  footerStyle: { bgColor: '#f9fafb', textColor: '#374151', borderColor: '#d1d5db', textSize: 9, fontFamily: 'default' }
};

function Notification({ type, title, message, onClose }) {
  const styles = {
    success: { bg: 'bg-gradient-to-r from-green-50 to-emerald-50', border: 'border-green-200', icon: 'bg-green-100 text-green-600', title: 'text-green-800', message: 'text-green-700' },
    error: { bg: 'bg-gradient-to-r from-red-50 to-rose-50', border: 'border-red-200', icon: 'bg-red-100 text-red-600', title: 'text-red-800', message: 'text-red-700' },
    info: { bg: 'bg-gradient-to-r from-blue-50 to-indigo-50', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-600', title: 'text-blue-800', message: 'text-blue-700' }
  };
  const s = styles[type] || styles.info;
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : Info;
  return (
    <div className={`${s.bg} ${s.border} border rounded-xl p-4 shadow-sm animate-fade-in`}>
      <div className="flex items-start gap-3">
        <div className={`${s.icon} p-2 rounded-lg flex-shrink-0`}><Icon className="w-5 h-5" /></div>
        <div className="flex-1 min-w-0">
          <h4 className={`${s.title} font-semibold text-sm`}>{title}</h4>
          <p className={`${s.message} text-sm mt-0.5`}>{message}</p>
        </div>
        {onClose && <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
      </div>
    </div>
  );
}

export default function IndigencyCertificateModal({ isOpen, onClose }) {
  const [formCounter, setFormCounter] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [officials, setOfficials] = useState(defaultOfficials);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [referenceNumber, setReferenceNumber] = useState(''); // Will be set after submission
  const [submittedReferenceNumber, setSubmittedReferenceNumber] = useState(''); // For success display
  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
  const certificateRef = useRef(null);

  const handleResidentSelect = (resident) => {
    setFormData(prev => ({
      ...prev,
      fullName: resident.full_name,
      age: resident.age || '',
      gender: resident.gender || '',
      civilStatus: resident.civil_status || '',
      address: resident.residential_address || '',
      dateOfBirth: resident.date_of_birth ? new Date(resident.date_of_birth).toISOString().split('T')[0] : '',
      placeOfBirth: resident.place_of_birth || '',
      contactNumber: resident.contact_number || prev.contactNumber,
      residentId: resident.id
    }));
    setIsResidentModalOpen(false);
    setNotification({
      type: 'success',
      title: 'Profile Found',
      message: `${resident.full_name}'s details have been auto-filled.`
    });
  };
  const [formData, setFormData] = useState({
    fullName: '', age: '', gender: '', civilStatus: '',
    address: '', dateOfBirth: '', placeOfBirth: '',
    purpose: '', contactNumber: '', residentId: null
  });

  // Generate current date dynamically
  useEffect(() => {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(now.toLocaleDateString('en-US', options));
  }, [isOpen]);

  useEffect(() => {
    const savedOfficials = localStorage.getItem('barangayOfficials');
    if (savedOfficials) {
      const parsed = JSON.parse(savedOfficials);
      setOfficials({
        ...defaultOfficials, ...parsed,
        contactInfo: { ...defaultOfficials.contactInfo, ...parsed.contactInfo },
        headerInfo: { ...defaultOfficials.headerInfo, ...parsed.headerInfo },
        logos: { ...defaultOfficials.logos, ...parsed.logos },
        headerStyle: { ...defaultOfficials.headerStyle, ...parsed.headerStyle },
        countryStyle: { ...defaultOfficials.countryStyle, ...parsed.countryStyle },
        provinceStyle: { ...defaultOfficials.provinceStyle, ...parsed.provinceStyle },
        municipalityStyle: { ...defaultOfficials.municipalityStyle, ...parsed.municipalityStyle },
        barangayNameStyle: { ...defaultOfficials.barangayNameStyle, ...parsed.barangayNameStyle },
        officeNameStyle: { ...defaultOfficials.officeNameStyle, ...parsed.officeNameStyle },
        sidebarStyle: { ...defaultOfficials.sidebarStyle, ...parsed.sidebarStyle },
        bodyStyle: { ...defaultOfficials.bodyStyle, ...parsed.bodyStyle },
        footerStyle: { ...defaultOfficials.footerStyle, ...parsed.footerStyle }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const required = ['fullName', 'age', 'gender', 'civilStatus', 'dateOfBirth', 'placeOfBirth', 'address', 'purpose', 'contactNumber'];
    for (const field of required) {
      if (!formData[field]) {
        setNotification({ type: 'error', title: 'Validation Error', message: 'Please fill in all required fields.' });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Show PDF confirmation popup instead of directly submitting
    setShowConfirmationPopup(true);
  };

  const handleProceedSubmission = async () => {
    setShowConfirmationPopup(false);
    setNotification({ type: 'info', title: 'Submitting...', message: 'Please wait while we process your application.' });

    try {
      console.log('Submitting form with data:', formData);
      const response = await fetch(`${API_URL}/api/certificates/indigency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        // Set the reference number received from the server
        setSubmittedReferenceNumber(result.referenceNumber);
        setReferenceNumber(result.referenceNumber); // For PDF generation
        setNotification(null); // Clear any existing notifications
        setShowSuccessModal(true); // Show success modal
      } else {
        throw new Error(result.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setNotification({ type: 'error', title: 'Submission Failed', message: error.message || 'Could not submit application. Please try again.' });
    }
  };

  const handleCustomizeForm = () => {
    setShowConfirmationPopup(false);
    // Form remains open for editing
  };

  const resetForm = () => {
    setFormData({ fullName: '', age: '', gender: '', civilStatus: '', address: '', dateOfBirth: '', placeOfBirth: '', purpose: '', contactNumber: '' });
    setShowPreview(false);
    setShowConfirmationPopup(false);
    setShowSuccessModal(false);
    setNotification(null);
    setReferenceNumber('');
    setSubmittedReferenceNumber('');
  };

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;
    setIsDownloading(true);
    setNotification({ type: 'info', title: 'Generating PDF...', message: 'Please wait while we prepare your certificate.' });
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      const element = certificateRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      pdf.addImage(imgData, 'PNG', imgX, 10, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Certificate_of_Indigency_${referenceNumber}.pdf`);
      setNotification({ type: 'success', title: 'PDF Downloaded!', message: `Certificate ${referenceNumber} has been saved.` });
    } catch (error) {
      console.error('PDF generation error:', error);
      setNotification({ type: 'error', title: 'Download Failed', message: 'Could not generate PDF. Please try printing instead.' });
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg"><FileText className="w-6 h-6 text-white" /></div>
              <div>
                <h2 className="text-xl font-bold text-white">New Certificate of Indigency Application</h2>
                <p className="text-green-200 text-sm">Reference: {referenceNumber || 'Will be assigned after submission'}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg"><X className="w-6 h-6" /></button>
          </div>

          {notification && <div className="px-6 pt-4"><Notification type={notification.type} title={notification.title} message={notification.message} onClose={() => setNotification(null)} /></div>}

          <div className="flex-1 overflow-y-auto">
            {!showPreview ? (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-lg shrink-0"><Info className="w-5 h-5 text-green-600" /></div>
                    <div className="space-y-1">
                      <p className="text-xs font-black text-green-700 uppercase tracking-widest">Public Notice</p>
                      <p className="text-sm text-green-800 leading-relaxed font-medium">
                        Only residents registered in the <strong>latest census</strong> can request online. If you are not in the census, please coordinate with the Barangay Office for record updating.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                    <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                    Personal Information
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between items-center">
                      <span>Full Name <span className="text-red-500">*</span></span>
                      <button
                        type="button"
                        onClick={() => setIsResidentModalOpen(true)}
                        className="text-green-600 hover:text-green-700 text-xs font-semibold flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md transition-colors"
                      >
                        <Search className="w-3 h-3" /> Search Database
                      </button>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        readOnly
                        onClick={() => setIsResidentModalOpen(true)}
                        placeholder="CLICK HERE TO SEARCH RESIDENT..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 uppercase pr-10 cursor-pointer bg-gray-50 hover:bg-white transition-colors font-bold text-green-700"
                      />
                      <Search
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 w-5 h-5 cursor-pointer"
                        onClick={() => setIsResidentModalOpen(true)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age <span className="text-red-500">*</span></label>
                      <input type="number" name="age" value={formData.age} readOnly disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 font-semibold" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label>
                      <select name="gender" value={formData.gender} disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 uppercase font-semibold appearance-none">
                        <option value="">Select...</option>
                        <option value="MALE">MALE</option>
                        <option value="FEMALE">FEMALE</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status <span className="text-red-500">*</span></label>
                      <select name="civilStatus" value={formData.civilStatus} disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 uppercase font-semibold appearance-none">
                        <option value="">Select...</option>
                        <option value="SINGLE">SINGLE</option>
                        <option value="MARRIED">MARRIED</option>
                        <option value="WIDOWED">WIDOWED</option>
                        <option value="SEPARATED">SEPARATED</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth <span className="text-red-500">*</span></label>
                      <input type="date" name="dateOfBirth" value={formData.dateOfBirth} readOnly disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 font-semibold" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Place of Birth <span className="text-red-500">*</span></label>
                      <input type="text" name="placeOfBirth" value={formData.placeOfBirth} readOnly disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 uppercase font-semibold" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Residential Address <span className="text-red-500">*</span></label>
                    <input type="text" name="address" value={formData.address} readOnly disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 uppercase font-semibold" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purpose(s) <span className="text-red-500">*</span></label>
                    <textarea name="purpose" value={formData.purpose} onChange={handleInputChange} rows={3}
                      placeholder="e.g., Medical Assistance, Educational Assistance, Financial Assistance, etc."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none uppercase" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="bg-gray-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                    Administrative Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white rounded-lg p-3 border">
                      <span className="text-gray-500 text-xs uppercase">Punong Barangay</span>
                      <p className="font-semibold text-gray-900 mt-1">{officials.chairman}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <span className="text-gray-500 text-xs uppercase">Date of Issue</span>
                      <p className="font-semibold text-gray-900 mt-1">{currentDate}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                    Contact for Pickup Notification
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number <span className="text-red-500">*</span></label>
                    <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange}
                      placeholder="e.g., 09XX XXX XXXX"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white" />
                    <p className="text-xs text-green-700 mt-1">We will send a message when your certificate is ready for pickup.</p>
                  </div>
                </div>
              </form>
            ) : (
              <IndigencyPreview formData={formData} referenceNumber={referenceNumber || 'PENDING'} currentDate={currentDate} officials={officials} certificateRef={certificateRef} />
            )}
          </div>

          <div className="border-t bg-gray-50 px-6 py-4 sm:py-5 flex flex-col sm:flex-row gap-3 justify-end pb-10 sm:pb-5">
            {!showPreview && (
              <button type="submit" onClick={handleSubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium flex items-center justify-center gap-2 shadow-lg">
                <Send className="w-5 h-5" />Submit Application
              </button>
            )}
            {showPreview && (
              <button type="button" onClick={() => setShowPreview(false)}
                className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 flex items-center justify-center gap-2">
                <Eye className="w-5 h-5" />Back to Form
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PDF Confirmation Popup */}
      {showConfirmationPopup && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowConfirmationPopup(false)} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
              {/* Popup Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg"><FileText className="w-6 h-6 text-white" /></div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Review Your Application</h2>
                    <p className="text-green-200 text-sm">Please double-check all information before proceeding</p>
                  </div>
                </div>
                <button onClick={() => setShowConfirmationPopup(false)} className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* PDF Preview */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
                <div className="flex justify-center">
                  <IndigencyPreview
                    formData={formData}
                    referenceNumber={referenceNumber || 'PENDING'}
                    currentDate={currentDate}
                    officials={officials}
                    certificateRef={certificateRef}
                  />
                </div>
              </div>

              {/* Popup Actions */}
              <div className="border-t bg-white px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end pb-10 sm:pb-4">
                <button
                  type="button"
                  onClick={handleCustomizeForm}
                  className="px-6 py-2.5 border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-medium flex items-center justify-center gap-2 shadow-sm">
                  <Eye className="w-5 h-5" />
                  Edit Information
                </button>
                <button
                  type="button"
                  onClick={handleProceedSubmission}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium flex items-center justify-center gap-2 shadow-lg">
                  <CheckCircle className="w-5 h-5" />
                  Proceed with Submission
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-70 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
              {/* Success Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Application Submitted!</h2>
                <p className="text-green-100 text-sm">Your request has been processed successfully</p>
              </div>

              {/* Success Content */}
              <div className="p-6 text-center">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-green-800 mb-2">Your Reference Number:</p>
                  <p className="text-2xl font-bold text-green-900 font-mono tracking-wider">
                    {submittedReferenceNumber}
                  </p>
                  <p className="text-xs text-green-600 mt-2">Please keep this reference number safe</p>
                </div>

                <div className="space-y-4 text-left">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Important Instructions:
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Our Barangay staff will contact you via SMS regarding your request status</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Please ensure your mobile number <strong>({formData.contactNumber})</strong> is correct and active</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Processing time is typically 1-3 business days</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Bring a valid ID when picking up your certificate</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Success Actions */}
              <div className="border-t bg-gray-50 px-6 py-4 pb-10 sm:pb-4">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    resetForm();
                    onClose();
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-lg">
                  <CheckCircle className="w-5 h-5" />
                  Got it, Thanks!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ResidentSearchModal
        isOpen={isResidentModalOpen}
        onClose={() => setIsResidentModalOpen(false)}
        onSelect={handleResidentSelect}
      />

      <style jsx>{`@keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in { animation: fade-in 0.3s ease-out; }`}</style>
    </div>
  );
}


// Certificate Preview - A4 Size Layout with Responsive Scaling
function IndigencyPreview({ formData, referenceNumber, currentDate, officials, certificateRef }) {
  const logos = officials.logos || {};
  const headerStyle = officials.headerStyle || {};
  const countryStyle = officials.countryStyle || {};
  const provinceStyle = officials.provinceStyle || {};
  const municipalityStyle = officials.municipalityStyle || {};
  const barangayNameStyle = officials.barangayNameStyle || {};
  const officeNameStyle = officials.officeNameStyle || {};
  const sidebarStyle = officials.sidebarStyle || {};
  const bodyStyle = officials.bodyStyle || {};
  const footerStyle = officials.footerStyle || {};

  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const targetWidth = 794; // A4 width at 96 DPI
        if (containerWidth < targetWidth) {
          setScale(containerWidth / targetWidth);
        } else {
          setScale(1);
        }
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const getFontClass = (font) => ({ 'default': '', 'serif': 'font-serif', 'sans': 'font-sans', 'mono': 'font-mono' }[font] || '');

  return (
    <div ref={containerRef} className="w-full flex justify-center overflow-hidden p-1 sm:p-4">
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          width: '794px',
          height: `${1090 * scale}px`, // Adjust parent height to prevent whitespace
          minHeight: '1090px',
          transition: 'transform 0.2s ease-out'
        }}
        className="flex-shrink-0"
      >
        <div ref={certificateRef} className={`certificate-container bg-white shadow-lg print:shadow-none flex flex-col ${getFontClass(bodyStyle.fontFamily)}`} style={{ width: '794px', height: '1090px', padding: '15px', boxSizing: 'border-box' }}>

          {/* Header with Logos */}
          <div className={`flex items-center justify-between pb-2 border-b-2 flex-shrink-0 ${getFontClass(headerStyle.fontFamily)}`}
            style={{ backgroundColor: headerStyle.bgColor, borderColor: headerStyle.borderColor }}>
            <div className="flex-shrink-0" style={{ width: `${logos.logoSize || 70}px`, height: `${logos.logoSize || 70}px` }}>
              {logos.leftLogo && <img src={logos.leftLogo} alt="Left Logo" className="w-full h-full object-contain" />}
            </div>
            <div className="text-center flex-1 px-4">
              <p className={getFontClass(countryStyle.fontFamily)} style={{ color: countryStyle.color || '#4b5563', fontSize: `${countryStyle.size || 13}px`, fontWeight: countryStyle.fontWeight || 'normal', lineHeight: '1.3' }}>
                {officials.headerInfo?.country || 'Republic of the Philippines'}
              </p>
              <p className={getFontClass(provinceStyle.fontFamily)} style={{ color: provinceStyle.color || '#4b5563', fontSize: `${provinceStyle.size || 13}px`, fontWeight: provinceStyle.fontWeight || 'normal', lineHeight: '1.3' }}>
                {officials.headerInfo?.province || 'Province of Bulacan'}
              </p>
              <p className={getFontClass(municipalityStyle.fontFamily)} style={{ color: municipalityStyle.color || '#4b5563', fontSize: `${municipalityStyle.size || 13}px`, fontWeight: municipalityStyle.fontWeight || 'normal', lineHeight: '1.3' }}>
                {officials.headerInfo?.municipality || 'Municipality of Calumpit'}
              </p>
              <p className={getFontClass(barangayNameStyle.fontFamily)} style={{ color: barangayNameStyle.color || '#1e40af', fontSize: `${barangayNameStyle.size || 22}px`, fontWeight: barangayNameStyle.fontWeight || 'bold', lineHeight: '1.3' }}>
                {officials.headerInfo?.barangayName || 'BARANGAY IBA O\' ESTE'}
              </p>
              <p className={getFontClass(officeNameStyle.fontFamily)} style={{ color: officeNameStyle.color || '#6b7280', fontSize: `${officeNameStyle.size || 12}px`, fontWeight: officeNameStyle.fontWeight || 'normal', lineHeight: '1.3' }}>
                {officials.headerInfo?.officeName || 'Office of the Punong Barangay'}
              </p>
            </div>
            <div className="flex-shrink-0" style={{ width: `${logos.logoSize || 80}px`, height: `${logos.logoSize || 80}px` }}>
              {logos.rightLogo && <img src={logos.rightLogo} alt="Right Logo" className="w-full h-full object-contain" />}
            </div>
          </div>

          <div className="flex flex-1 mt-2">
            {/* Left Sidebar - Officials */}
            <div className={`text-white p-4 flex-shrink-0 ${getFontClass(sidebarStyle.fontFamily)}`}
              style={{ width: '220px', background: `linear-gradient(to bottom, ${sidebarStyle.bgColor || '#1e40af'}, ${sidebarStyle.gradientEnd || '#1e3a8a'})` }}>
              <div className="text-center mb-4">
                <p className="font-bold" style={{ fontSize: `${(sidebarStyle.titleSize || 16) + 4}px`, color: sidebarStyle.textColor }}>BARANGAY</p>
                <p className="font-bold" style={{ fontSize: `${(sidebarStyle.titleSize || 16) + 4}px`, color: sidebarStyle.textColor }}>IBA O' ESTE</p>
              </div>

              <div className="border-t pt-3" style={{ borderColor: `${sidebarStyle.bgColor}88` }}>
                <p className="font-bold mb-3" style={{ color: sidebarStyle.labelColor, fontSize: `${(sidebarStyle.titleSize || 13) + 2}px` }}>BARANGAY COUNCIL</p>
                <div className="mb-3 text-center">
                  <div
                    className="mb-2 w-[140px] h-[186px] mx-auto rounded-lg border-2 border-white/20 shadow-inner bg-black/10"
                    style={{
                      backgroundImage: `url(${logos.captainImage || '/images/brgycaptain.png'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  />
                  <p style={{ color: `${sidebarStyle.labelColor}cc`, fontSize: `${(sidebarStyle.textSize || 11)}px` }}>Punong Barangay</p>
                  <p className="font-semibold" style={{ color: sidebarStyle.textColor, fontSize: `${(sidebarStyle.textSize || 11) + 1}px` }}>{officials.chairman}</p>
                </div>
                <div className="border-t py-2" style={{ borderColor: `${sidebarStyle.bgColor}88` }}>
                  <p style={{ color: `${sidebarStyle.labelColor}cc`, fontSize: `${(sidebarStyle.textSize || 11)}px` }}>Kagawad</p>
                  {officials.councilors.map((c, i) => <p key={i} style={{ color: sidebarStyle.textColor, fontSize: `${(sidebarStyle.textSize || 11)}px`, lineHeight: '1.4' }}>{c}</p>)}
                </div>
                <div className="border-t py-2" style={{ borderColor: `${sidebarStyle.bgColor}88` }}>
                  <p style={{ color: `${sidebarStyle.labelColor}cc`, fontSize: `${(sidebarStyle.textSize || 11)}px` }}>SK Chairman</p>
                  <p style={{ color: sidebarStyle.textColor, fontSize: `${(sidebarStyle.textSize || 11)}px` }}>{officials.skChairman}</p>
                </div>
                <div className="border-t py-2" style={{ borderColor: `${sidebarStyle.bgColor}88` }}>
                  <p style={{ color: `${sidebarStyle.labelColor}cc`, fontSize: `${(sidebarStyle.textSize || 11)}px` }}>Barangay Secretary</p>
                  <p style={{ color: sidebarStyle.textColor, fontSize: `${(sidebarStyle.textSize || 11)}px` }}>{officials.secretary}</p>
                </div>
                <div className="border-t py-2" style={{ borderColor: `${sidebarStyle.bgColor}88` }}>
                  <p style={{ color: `${sidebarStyle.labelColor}cc`, fontSize: `${(sidebarStyle.textSize || 11)}px` }}>Barangay Treasurer</p>
                  <p style={{ color: sidebarStyle.textColor, fontSize: `${(sidebarStyle.textSize || 11)}px` }}>{officials.treasurer}</p>
                </div>
                <div className="border-t py-2" style={{ borderColor: `${sidebarStyle.bgColor}88` }}>
                  <p style={{ color: `${sidebarStyle.labelColor}cc`, fontSize: `${(sidebarStyle.textSize || 11)}px` }}>Barangay Administrator</p>
                  <p style={{ color: sidebarStyle.textColor, fontSize: `${(sidebarStyle.textSize || 11)}px` }}>{officials.administrator}</p>
                </div>
                <div className="border-t py-2" style={{ borderColor: `${sidebarStyle.bgColor}88` }}>
                  <p style={{ color: `${sidebarStyle.labelColor}cc`, fontSize: `${(sidebarStyle.textSize || 11)}px` }}>Assistant Secretary</p>
                  <p style={{ color: sidebarStyle.textColor, fontSize: `${(sidebarStyle.textSize || 11)}px` }}>{officials.assistantSecretary}</p>
                </div>
                <div className="border-t py-2" style={{ borderColor: `${sidebarStyle.bgColor}88` }}>
                  <p style={{ color: `${sidebarStyle.labelColor}cc`, fontSize: `${(sidebarStyle.textSize || 11)}px` }}>Brgy. Asst. Administrator</p>
                  <p style={{ color: sidebarStyle.textColor, fontSize: `${(sidebarStyle.textSize || 11)}px` }}>{officials.assistantAdministrator}</p>
                </div>
                <div className="border-t py-2" style={{ borderColor: `${sidebarStyle.bgColor}88` }}>
                  <p style={{ color: `${sidebarStyle.labelColor}cc`, fontSize: `${(sidebarStyle.textSize || 11)}px` }}>Barangay Record Keeper</p>
                  <p style={{ color: sidebarStyle.textColor, fontSize: `${(sidebarStyle.textSize || 11)}px` }}>{officials.recordKeeper}</p>
                </div>
                <div className="border-t py-2" style={{ borderColor: `${sidebarStyle.bgColor}88` }}>
                  <p style={{ color: `${sidebarStyle.labelColor}cc`, fontSize: `${(sidebarStyle.textSize || 11)}px` }}>Barangay Clerk</p>
                  <p style={{ color: sidebarStyle.textColor, fontSize: `${(sidebarStyle.textSize || 11)}px` }}>{officials.clerk}</p>
                </div>
              </div>
            </div>

            {/* Main Content - Certificate Body */}
            <div className={`flex-1 p-6 flex flex-col relative ${getFontClass(bodyStyle.fontFamily)}`} style={{ backgroundColor: bodyStyle.bgColor }}>
              {/* Background Watermark */}
              <div className="absolute inset-0 flex justify-center pointer-events-none opacity-[0.15] z-0 pt-24">
                <img
                  src={logos.leftLogo || '/iba-o-este.png'}
                  alt="Watermark"
                  style={{ width: '550px', height: '550px', objectFit: 'contain' }}
                />
              </div>

              {/* Title */}
              <div className="text-center mb-6 relative z-10">
                <h1 className="font-bold underline" style={{ color: '#16a34a', fontSize: `${bodyStyle.titleSize || 24}px` }}>
                  CERTIFICATE OF INDIGENCY
                </h1>
              </div>

              {/* Body Content */}
              <div className="flex-1 relative z-10" style={{ color: bodyStyle.textColor, fontSize: `${bodyStyle.textSize || 14}px` }}>
                <p className="font-bold mb-6">TO WHOM IT MAY CONCERN:</p>

                <p className="mb-6 text-justify leading-relaxed">
                  This is to certify that below mentioned person is a bona fide resident and their family belongs to the "<strong>Indigent Families</strong>" of this barangay as of date mentioned below. Further certifying that their income is not enough to sustain and support their basic needs:
                </p>

                {/* Personal Details Table */}
                <div className="mb-6 space-y-2">
                  <div className="flex">
                    <span className="w-40 font-semibold">Name</span>
                    <span className="mr-2">:</span>
                    <span className="flex-1 font-bold underline">{formData.fullName?.toUpperCase() || '_________________'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-40 font-semibold">Age</span>
                    <span className="mr-2">:</span>
                    <span className="flex-1">{formData.age || '_________________'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-40 font-semibold">Gender</span>
                    <span className="mr-2">:</span>
                    <span className="flex-1">{formData.gender?.toUpperCase() || '_________________'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-40 font-semibold">Civil Status</span>
                    <span className="mr-2">:</span>
                    <span className="flex-1">{formData.civilStatus?.toUpperCase() || '_________________'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-40 font-semibold">Residential Address</span>
                    <span className="mr-2">:</span>
                    <span className="flex-1">{formData.address?.toUpperCase() || '_________________'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-40 font-semibold">Date of Birth</span>
                    <span className="mr-2">:</span>
                    <span className="flex-1">{formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : '_________________'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-40 font-semibold">Place of Birth</span>
                    <span className="mr-2">:</span>
                    <span className="flex-1">{formData.placeOfBirth?.toUpperCase() || '_________________'}</span>
                  </div>
                </div>

                <p className="mb-4">
                  This certification is being issued upon the request of above mentioned person for below purpose(s):
                </p>

                <p className="mb-8 font-semibold pl-4">
                  {formData.purpose?.toUpperCase() || '_________________________________'}
                </p>

                <p className="mb-8">
                  Issued this <strong>{currentDate}</strong> at Barangay Iba O' Este, Calumpit, Bulacan.
                </p>

                {/* Resident's Signature */}
                <div className="mb-12">
                  <div className="h-16"></div> {/* Space for 3-4 lines signature */}
                  <div className="w-64 border-b border-black"></div>
                  <p className="text-sm mt-1">Resident's Signature / Thumb Mark</p>
                </div>

                <p className="mb-8 font-semibold">TRULY YOURS,</p>

                {/* Signatures Grid */}
                <div className="mt-8 flex justify-between items-end w-full pr-4">
                  {/* Secretary Signature */}
                  <div className="w-48 text-center bg-transparent">
                    <p className="font-bold text-base uppercase whitespace-nowrap">{officials.secretary}</p>
                    <p className="text-xs">Barangay Secretary</p>
                  </div>

                  {/* Chairman Signature */}
                  <div className="w-48 text-center bg-transparent">
                    <p className="font-bold text-base uppercase whitespace-nowrap">{officials.chairman}</p>
                    <p className="text-sm">Punong Barangay</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`mt-auto pt-2 border-t text-center flex-shrink-0 ${getFontClass(footerStyle.fontFamily)}`}
            style={{ backgroundColor: footerStyle.bgColor, borderColor: footerStyle.borderColor }}>
            <p className="font-semibold" style={{ color: footerStyle.textColor, fontSize: `${footerStyle.textSize || 9}px` }}>
              {officials.contactInfo?.address}
            </p>
            <p style={{ color: footerStyle.textColor, fontSize: `${footerStyle.textSize || 9}px` }}>
              <strong>Contact:</strong> {officials.contactInfo?.contactPerson} | <strong>Tel:</strong> {officials.contactInfo?.telephone} | <strong>Email:</strong> {officials.contactInfo?.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
