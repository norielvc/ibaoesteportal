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
    'JOELITO C. MANIO',
    'ENGELBERT M. INDUCTIVO',
    'NORMANDO T. SANTOS',
    'JOPHET M. TURLA',
    'JOHN BRYAN C. CRUZ',
    'ARNEL D. BERNARDINO',
    'LORENA G. LOPEZ'
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

// Enhanced Notification Component
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

export default function BarangayClearanceModal({ isOpen, onClose }) {
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
      sex: resident.gender || '',
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
    fullName: '', age: '', sex: '', civilStatus: '',
    address: '', contactNumber: '',
    dateOfBirth: '', placeOfBirth: '', purpose: '', residentId: null
  });

  // Generate current date dynamically
  useEffect(() => {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(now.toLocaleDateString('en-US', options));
  }, [isOpen]);

  useEffect(() => {
    // Load officials from localStorage (merge with defaults to ensure all fields exist)
    const savedOfficials = localStorage.getItem('barangayOfficials');
    if (savedOfficials) {
      const parsed = JSON.parse(savedOfficials);
      setOfficials({
        ...defaultOfficials,
        ...parsed,
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
    const required = ['fullName', 'age', 'sex', 'civilStatus', 'dateOfBirth', 'placeOfBirth', 'purpose', 'contactNumber'];
    for (const field of required) {
      if (!formData[field]) {
        setNotification({ type: 'error', title: 'Validation Error', message: `Please fill in all required fields.` });
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ... (existing useEffects and handlers)

  const handleProceedSubmission = async () => {
    // REMOVED: setShowConfirmationPopup(false); // keep open
    setIsSubmitting(true);
    // REMOVED: setNotification(...) // No need for notification on main form if we stay in modal

    try {
      const response = await fetch(`${API_URL}/api/certificates/clearance`, {
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
        setShowConfirmationPopup(false); // Close preview only on success
        setShowSuccessModal(true); // Show success modal
      } else {
        throw new Error(result.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Submission error:', error);
      // If error, we might want to show it on the modal itself, or close and show notification
      setShowConfirmationPopup(false);
      setNotification({ type: 'error', title: 'Submission Failed', message: error.message || 'Could not submit application. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomizeForm = () => {
    setShowConfirmationPopup(false);
    // Form remains open for editing
  };

  const resetForm = () => {
    setFormData({ fullName: '', age: '', sex: '', civilStatus: '', address: '', contactNumber: '', dateOfBirth: '', placeOfBirth: '', purpose: '' });
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
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Barangay_Clearance_${referenceNumber}.pdf`);

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
          <div className="bg-gradient-to-r from-[#112e1f] via-[#2d5a3d] to-[#112117] px-8 py-6 flex items-center justify-between border-b border-white/10 relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

            <div className="flex items-center gap-4 relative z-10">
              <div className="bg-white/15 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-inner">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Barangay Clearance</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <p className="text-green-100/80 text-sm font-medium">Digital Application Portal • {referenceNumber || 'New Request'}</p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all duration-300 group"
            >
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {notification && <div className="px-6 pt-4"><Notification type={notification.type} title={notification.title} message={notification.message} onClose={() => setNotification(null)} /></div>}

          <div className="flex-1 overflow-y-auto">
            {!showPreview ? (
              <form onSubmit={handleSubmit} className="p-8 space-y-10">
                {/* Status/Info Integrated Section */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="bg-emerald-100 p-3 rounded-xl border border-emerald-200 shadow-sm"><Info className="w-6 h-6 text-emerald-600" /></div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                        Official Requirement Notice
                      </h4>
                      <p className="text-emerald-800/90 leading-relaxed text-sm">
                        Online processing is exclusively for residents registered in the <strong>latest barangay census</strong>.
                        New residents or those with outdated records are requested to visit the <span className="font-bold underline decoration-emerald-300/50">Barangay Secretariat</span> for manual verification.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#112e1f] text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">1</div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                        <p className="text-sm text-gray-500 font-medium">Auto-filled via community database</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsResidentModalOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-[#2d5a3d]/20 text-[#2d5a3d] hover:bg-[#2d5a3d] hover:text-white rounded-xl text-sm font-bold transition-all duration-300 shadow-sm hover:shadow-md group"
                    >
                      <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      Verify Identity Profile
                    </button>
                  </div>

                  <div className="relative group">
                    <div className={`absolute inset-0 bg-emerald-500/5 rounded-2xl blur-xl opacity-0 ${formData.fullName ? 'opacity-100' : ''} transition-opacity duration-500`}></div>
                    <div className="relative">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Resident Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        readOnly
                        onClick={() => setIsResidentModalOpen(true)}
                        placeholder="TAP HERE TO SELECT FROM RESIDENT DIRECTORY..."
                        className={`w-full px-6 py-5 bg-white border-2 ${formData.fullName ? 'border-emerald-200 ring-2 ring-emerald-50 text-emerald-900' : 'border-gray-100 text-gray-400 italic'} rounded-2xl transition-all duration-300 font-extrabold text-lg cursor-pointer hover:border-emerald-300 text-center tracking-wide shadow-sm`}
                      />
                      {formData.fullName && (
                        <div className="absolute right-6 top-1/2 -translate-y-1/2">
                          <CheckCircle className="w-6 h-6 text-emerald-500" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Age</label>
                      <input type="number" name="age" value={formData.age} readOnly disabled
                        className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-600 font-bold focus:outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sex</label>
                      <input type="text" value={formData.sex || 'N/A'} readOnly disabled
                        className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-600 font-bold uppercase focus:outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Civil Status</label>
                      <input type="text" value={formData.civilStatus || 'N/A'} readOnly disabled
                        className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-600 font-bold uppercase focus:outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date of Birth</label>
                      <input type="text" value={formData.dateOfBirth || 'N/A'} readOnly disabled
                        className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-600 font-bold focus:outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Place of Birth</label>
                      <input type="text" value={formData.placeOfBirth || 'N/A'} readOnly disabled
                        className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-600 font-bold uppercase focus:outline-none" />
                    </div>
                  </div>

                  <div className="space-y-2 pb-6">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Registered Residential Address</label>
                    <input type="text" value={formData.address || 'N/A'} readOnly disabled
                      className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-600 font-bold uppercase focus:outline-none" />
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-[#2d5a3d] text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">2</div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Application Details</h3>
                        <p className="text-sm text-gray-500 font-medium tracking-wide">Please specify the official intent of your request</p>
                      </div>
                    </div>

                    <div className="space-y-2 relative">
                      <label className="text-xs font-bold text-[#2d5a3d] uppercase tracking-widest ml-1 block">Request Purpose <span className="text-red-500">*</span></label>
                      <textarea
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Why do you need this clearance? (e.g. Employment Application, Business Registration, ID Enrollment)"
                        className="w-full px-6 py-5 bg-white border-2 border-gray-100 rounded-2xl focus:border-[#2d5a3d] focus:ring-4 focus:ring-[#2d5a3d]/5 transition-all outline-none uppercase font-extrabold text-gray-800 placeholder:text-gray-300 placeholder:italic shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
                    {/* Admin Column */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center font-bold text-xs">A</div>
                        <h4 className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Processing Log</h4>
                      </div>
                      <div className="space-y-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Signatory Authority</span>
                          <p className="font-bold text-gray-700 text-sm italic">{officials.chairman}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Filing Date</span>
                          <p className="font-bold text-gray-700 text-sm">{currentDate}</p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Column */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-xs border border-emerald-200">B</div>
                        <h4 className="font-bold text-emerald-900 uppercase tracking-widest text-[10px]">Digital Alerts</h4>
                      </div>
                      <div className="space-y-4 bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/50">
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-[#2d5a3d] uppercase tracking-widest ml-1">SMS Contact Number <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <input
                              type="tel"
                              name="contactNumber"
                              value={formData.contactNumber}
                              onChange={handleInputChange}
                              placeholder="09XX XXX XXXX"
                              className="w-full px-4 py-3 bg-white border-2 border-emerald-100 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none font-black text-emerald-900 transition-all shadow-sm"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                            </div>
                          </div>
                          <p className="text-[9px] text-emerald-700/60 font-medium leading-tight">We will send an instant SMS notification for record pickup.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <ClearancePreview formData={formData} referenceNumber={referenceNumber || 'PENDING'} currentDate={currentDate} officials={officials} certificateRef={certificateRef} />
            )}
          </div>

          <div className="border-t bg-gray-50/80 backdrop-blur-md px-8 py-6 flex flex-col sm:flex-row gap-4 justify-between items-center no-print pb-12 sm:pb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Please check all entries before final submission</p>

            <div className="flex gap-3 w-full sm:w-auto">
              {!showPreview && (
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="flex-1 sm:flex-none px-8 py-4 bg-gradient-to-r from-[#112e1f] to-[#2d5a3d] hover:from-[#2d5a3d] hover:to-[#112e1f] text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-xl hover:shadow-emerald-900/20 transform hover:-translate-y-1 transition-all duration-300 group"
                >
                  <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  Submit Application
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Confirmation Popup */}
      {
        showConfirmationPopup && (
          <div className="fixed inset-0 z-60 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowConfirmationPopup(false)} />

              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
                {/* Popup Header */}
                <div className="bg-gradient-to-r from-[#112e1f] via-[#2d5a3d] to-[#112117] px-8 py-6 flex items-center justify-between border-b border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="bg-white/15 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-inner">
                      <FileText className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Review Application</h2>
                      <p className="text-green-100/80 text-sm font-medium">Verify your final document preview below</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowConfirmationPopup(false)}
                    className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all duration-300 group"
                  >
                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>

                {/* PDF Preview */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
                  <div className="flex justify-center">
                    <ClearancePreview
                      formData={formData}
                      referenceNumber={referenceNumber || 'PENDING'}
                      currentDate={currentDate}
                      officials={officials}
                      certificateRef={certificateRef}
                    />
                  </div>
                </div>

                {/* Popup Actions */}
                <div className="border-t bg-gray-50/80 backdrop-blur-md px-8 py-6 flex flex-col sm:flex-row gap-4 justify-between items-center no-print">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Please check all entries before final submission</p>

                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleCustomizeForm}
                      disabled={isSubmitting}
                      className="px-8 py-3.5 border-2 border-[#2d5a3d]/20 text-[#2d5a3d] hover:bg-[#2d5a3d]/5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all outline-none disabled:opacity-50">
                      <Eye className="w-5 h-5" />
                      Go Back & Edit
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedSubmission}
                      disabled={isSubmitting}
                      className="px-8 py-3.5 bg-gradient-to-r from-[#112e1f] to-[#2d5a3d] hover:from-[#2d5a3d] hover:to-[#112e1f] text-white rounded-2xl font-extrabold flex items-center justify-center gap-3 shadow-xl hover:shadow-emerald-900/20 transform hover:-translate-y-0.5 transition-all disabled:opacity-75">
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Confirm & Submit
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Success Modal */}
      {
        showSuccessModal && (
          <div className="fixed inset-0 z-70 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />

              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                {/* Success Header */}
                <div className="bg-gradient-to-r from-[#112e1f] to-[#214431] px-8 py-10 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                  <div className="w-20 h-20 bg-emerald-500/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                    <CheckCircle className="w-12 h-12 text-emerald-400 animate-bounce" />
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Filing Complete!</h2>
                  <p className="text-green-100/70 text-sm font-medium">Your request has been successfully queued</p>
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
        )
      }

      <ResidentSearchModal
        isOpen={isResidentModalOpen}
        onClose={() => setIsResidentModalOpen(false)}
        onSelect={handleResidentSelect}
      />

      <style jsx>{`@keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in { animation: fade-in 0.3s ease-out; }`}</style>
    </div >
  );
}


// Certificate Preview - A4 Size MAXIMIZED Layout with Responsive Scaling
function ClearancePreview({ formData, referenceNumber, currentDate, officials, certificateRef }) {
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
    <div ref={containerRef} className="w-full flex justify-center relative">
      <div
        style={{
          width: `${794 * scale}px`,
          height: `${1123 * scale}px`,
          position: 'relative',
          flexShrink: 0
        }}
      >
        <div ref={certificateRef} className={`certificate-container bg-white shadow-lg print:shadow-none flex flex-col ${getFontClass(bodyStyle.fontFamily)}`}
          style={{
            width: '794px',
            height: '1123px',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
            padding: '0',
            boxSizing: 'border-box'
          }}>

          {/* Header Section */}
          <div className={`w-full border-b flex justify-center items-center p-8 flex-shrink-0 ${getFontClass(headerStyle.fontFamily)}`}
            style={{
              backgroundColor: headerStyle.bgColor,
              borderColor: headerStyle.borderColor
            }}>
            {/* Left Logo */}
            <div style={{
              width: `${logos.logoSize || 80}px`,
              height: `${logos.logoSize || 80}px`,
              marginRight: `${headerStyle.logoSpacing || 0}px`
            }} className="flex-shrink-0">
              {logos.leftLogo && <img src={logos.leftLogo} className="w-full h-full object-contain" alt="Left" />}
            </div>

            {/* Text Content */}
            <div className="text-center flex flex-col justify-center">
              <p className={getFontClass(countryStyle.fontFamily)} style={{ color: countryStyle.color, fontSize: '13px', fontWeight: countryStyle.fontWeight, lineHeight: '1.2' }}>{officials.headerInfo?.country || 'Republic of the Philippines'}</p>
              <p className={getFontClass(provinceStyle.fontFamily)} style={{ color: provinceStyle.color, fontSize: '13px', fontWeight: provinceStyle.fontWeight, lineHeight: '1.2' }}>{officials.headerInfo?.province || 'Province of Bulacan'}</p>
              <p className={getFontClass(municipalityStyle.fontFamily)} style={{ color: municipalityStyle.color, fontSize: '13px', fontWeight: municipalityStyle.fontWeight, lineHeight: '1.2' }}>{officials.headerInfo?.municipality || 'Municipality of Calumpit'}</p>
              <p className="mt-1 uppercase text-blue-800" style={{ fontSize: '18px', fontWeight: 'bold', lineHeight: '1.2' }}>{officials.headerInfo?.barangayName || "BARANGAY IBA O' ESTE"}</p>
              <p className="mt-2 text-red-700 font-extrabold uppercase tracking-wider" style={{ fontSize: '14px' }}>OFFICE OF THE BARANGAY CHAIRMAN</p>
            </div>

            {/* Right Logo */}
            <div style={{
              width: `${logos.logoSize || 80}px`,
              height: `${logos.logoSize || 80}px`,
              marginLeft: `${headerStyle.logoSpacing || 0}px`
            }} className="flex-shrink-0">
              {logos.rightLogo && <img src={logos.rightLogo} className="w-full h-full object-contain" alt="Right" />}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex flex-1 relative">
            {/* Sidebar */}
            <div className={`w-64 p-6 flex flex-col text-center flex-shrink-0 ${getFontClass(sidebarStyle.fontFamily)}`} style={{
              background: `linear-gradient(to bottom, ${sidebarStyle.bgColor || '#1e40af'}, ${sidebarStyle.gradientEnd || '#1e3a8a'})`,
              color: sidebarStyle.textColor || '#ffffff'
            }}>
              <div className="text-center mb-4">
                <p className="font-bold" style={{ fontSize: '20px' }}>BARANGAY</p>
                <p className="font-bold" style={{ fontSize: '20px' }}>IBA O' ESTE</p>
              </div>

              <div className="border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                <p className="font-bold mb-3" style={{ fontSize: '15px', color: sidebarStyle.labelColor || '#fde047' }}>BARANGAY COUNCIL</p>
                <div className="mb-3">
                  <div className="mb-2 w-24 h-32 mx-auto bg-black/10 rounded overflow-hidden shadow-inner border border-white/20">
                    {logos.captainImage && <img src={logos.captainImage} className="w-full h-full object-cover" />}
                  </div>
                  <p className="text-xs opacity-80" style={{ color: sidebarStyle.labelColor || '#fde047' }}>Punong Barangay</p>
                  <p className="font-bold text-sm tracking-wide">{officials.chairman}</p>
                </div>

                <div className="space-y-1 mb-4">
                  <p className="text-[10px] uppercase opacity-60 mb-1" style={{ color: sidebarStyle.labelColor || '#fde047' }}>Kagawad</p>
                  {officials.councilors?.slice(0, 7).map((c, i) => (
                    <p key={i} className="text-[11px] leading-tight font-medium">{c}</p>
                  ))}
                </div>

                <div className="space-y-2 text-[11px] border-t border-white/10 pt-2">
                  <div>
                    <p className="opacity-60 text-[9px]" style={{ color: sidebarStyle.labelColor || '#fde047' }}>SK Chairman</p>
                    <p className="font-medium">{officials.skChairman}</p>
                  </div>
                  <div>
                    <p className="opacity-60 text-[9px]" style={{ color: sidebarStyle.labelColor || '#fde047' }}>Secretary</p>
                    <p className="font-medium">{officials.secretary}</p>
                  </div>
                  <div>
                    <p className="opacity-60 text-[9px]" style={{ color: sidebarStyle.labelColor || '#fde047' }}>Treasurer</p>
                    <p className="font-medium">{officials.treasurer}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Body */}
            <div className="flex-1 px-16 py-12 relative flex flex-col" style={{ backgroundColor: bodyStyle.bgColor || '#ffffff', color: bodyStyle.textColor || '#000000' }}>
              {/* Watermark */}
              {logos.leftLogo && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
                  <img src={logos.leftLogo} className="w-3/4 object-contain" alt="Watermark" />
                </div>
              )}

              <div className="relative z-10 flex flex-col items-center flex-1">
                <h2 className="text-center font-bold mb-10 border-b-4 border-black inline-block pb-1 px-4 uppercase leading-normal" style={{
                  color: '#004d40',
                  fontSize: '24px',
                }}>
                  BARANGAY CLEARANCE CERTIFICATE
                </h2>

                <div className="w-full space-y-6 text-justify" style={{ fontSize: '15px' }}>
                  <div className="flex justify-between items-center mb-6">
                    <p className="font-bold text-lg">TO WHOM IT MAY CONCERN:</p>
                  </div>

                  <p className="text-left mb-6 leading-relaxed">
                    This is to certify that below mentioned person is a bona fide resident of this barangay and has no derogatory record as of date mentioned below:
                  </p>

                  <div className="mb-6 space-y-1">
                    {[
                      ['Name', formData.fullName?.toUpperCase()],
                      ['Age', formData.age],
                      ['Sex', formData.sex?.toUpperCase()],
                      ['Civil Status', formData.civilStatus?.toUpperCase()],
                      ['Residential Address', formData.address?.toUpperCase()],
                      ['Date of Birth', formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : ''],
                      ['Place of Birth', formData.placeOfBirth?.toUpperCase()]
                    ].map(([label, value]) => (
                      <div key={label} className="grid grid-cols-[180px_10px_1fr] items-baseline text-black">
                        <span className="font-normal">{label}</span>
                        <span className="font-normal text-center">:</span>
                        <span className={label === 'Name' ? 'font-bold text-lg' : 'font-semibold'}>{value || '_________________'}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mb-6">
                    <p className="mb-2">
                      Being issued upon the request of above mentioned person for below purpose(s):
                    </p>
                    <div className="pl-8 font-bold">
                      {formData.purpose ? (
                        <div className="flex gap-2 text-lg">
                          <span>1.</span>
                          <span>{formData.purpose.toUpperCase()}</span>
                        </div>
                      ) : (
                        <p>• PURPOSE NOT SPECIFIED</p>
                      )}
                    </div>
                  </div>

                  <p className="mb-12 text-left">
                    Issued this {currentDate} at Barangay Iba O' Este, Calumpit, Bulacan.
                  </p>

                  {/* Signature Section */}
                  <div className="mt-16 relative">
                    <div className="mb-12">
                      <div className="h-16"></div>
                      <div className="border-t border-black w-64 pt-1">
                        <p className="text-sm">Resident's Signature / Thumb Mark</p>
                      </div>
                    </div>

                    <div className="text-left mb-8 self-start">
                      <p className="font-bold text-[15px] mb-8 uppercase">Truly Yours,</p>
                      <p className="uppercase font-bold mb-1" style={{ fontSize: '20px' }}>{officials.chairman}</p>
                      <p className="text-sm font-bold">BARANGAY CHAIRMAN</p>
                    </div>
                  </div>

                  {/* Reference Number */}
                  <div className="w-full text-right mt-auto mb-1 text-[10px] opacity-60">
                    <p>Reference No.: <strong>{referenceNumber}</strong></p>
                  </div>

                  {/* Footer */}
                  <div className="clear-both pt-2 border-t border-gray-200 w-full text-[10px] text-gray-500 italic">
                    <p>Address: {officials.contactInfo?.address || "Barangay Iba O' Este, Calumpit, Bulacan"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
