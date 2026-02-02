import { useState } from 'react';
import { X, GraduationCap, User, MapPin, Phone, Award, FileText, AlertCircle, CheckCircle, Pen } from 'lucide-react';
import SignatureInput from '../UI/SignatureInput';

export default function EducationalAssistanceModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    age: '',
    gender: '',
    civilStatus: '',
    purok: '',
    houseNumber: '',
    phaseNumber: '',
    blockNumber: '',
    lotNumber: '',
    cellphoneNumber: '',
    yearGrade: '',
    schoolToAttend: '',
    schoolAttending: '',
    academicAwards: '',
    gwa: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [signature, setSignature] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateFullAddress = () => {
    const { purok, houseNumber, phaseNumber, blockNumber, lotNumber } = formData;
    let address = '';

    if (purok === 'NV9') {
      address = `Phase ${phaseNumber}, Block ${blockNumber}, Lot ${lotNumber}, NV9`;
    } else {
      address = `House #${houseNumber}, ${purok}`;
    }

    return `${address}, Iba O' Este, Calumpit, Bulacan`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate signature
    if (!signature) {
      setSubmitStatus('error');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

      const submissionData = {
        ...formData,
        fullAddress: generateFullAddress(),
        age: parseInt(formData.age),
        gwa: formData.gwa ? parseFloat(formData.gwa) : null,
        signature: signature // Include signature data
      };

      const response = await fetch(`${API_URL}/api/educational-assistance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus('success');
        setReferenceNumber(result.data.reference_number);
        // Reset form
        setFormData({
          firstName: '', middleName: '', lastName: '', age: '', gender: '', civilStatus: '',
          purok: '', houseNumber: '', phaseNumber: '', blockNumber: '', lotNumber: '',
          cellphoneNumber: '', yearGrade: '', schoolToAttend: '', schoolAttending: '',
          academicAwards: '', gwa: ''
        });
        setSignature(null);
      } else {
        setSubmitStatus('error');
        console.error('Submission error:', result.message);
      }
    } catch (error) {
      setSubmitStatus('error');
      console.error('Network error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">𝐄𝐃𝐔𝐂𝐀𝐓𝐈𝐎𝐍𝐀𝐋 𝐀𝐒𝐒𝐈𝐒𝐓𝐀𝐍𝐂𝐄 𝐏𝐑𝐎𝐆𝐑𝐀𝐌</h2>
                <p className="text-blue-100">Barangay Iba O' Este Scholarship Application</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Notification */}
          <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 font-medium">
                📞 KAMI PO AY MAKIKIPAG-UGNAYAN SA INYO KUNG KAYO PO AY KUWALIPIKADO.
              </p>
            </div>
          </div>

          {/* Messages */}
          {(submitStatus === 'success' || submitStatus === 'error') && (
            <div className="px-6 pt-6">
              {submitStatus === 'success' ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <h3 className="font-bold text-green-800">Application Submitted Successfully!</h3>
                      <p className="text-green-700">Reference Number: <strong>{referenceNumber}</strong></p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <h3 className="font-bold text-red-800">Submission Failed</h3>
                      <p className="text-red-700">Please check your information and try again.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inner Form content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Personal Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">𝐅𝐈𝐑𝐒𝐓 𝐍𝐀𝐌𝐄 *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">𝐌𝐈𝐃𝐃𝐋𝐄 𝐍𝐀𝐌𝐄</label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">𝐋𝐀𝐒𝐓 𝐍𝐀𝐌𝐄 *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">𝐀𝐆𝐄 *</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    min="12"
                    max="30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">𝐆𝐄𝐍𝐃𝐄𝐑 *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">𝐂𝐈𝐕𝐈𝐋 𝐒𝐓𝐀𝐓𝐔𝐒 *</label>
                  <select
                    name="civilStatus"
                    value={formData.civilStatus}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-800">𝐀𝐃𝐃𝐑𝐄𝐒𝐒</h3>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Purok / Area *</label>
                <select
                  name="purok"
                  value={formData.purok}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Purok</option>
                  <option value="Purok 1">Purok 1</option>
                  <option value="Purok 2">Purok 2</option>
                  <option value="Purok 3">Purok 3</option>
                  <option value="Purok 4">Purok 4</option>
                  <option value="Purok 5">Purok 5</option>
                  <option value="Purok 6">Purok 6</option>
                  <option value="NV9">NV9</option>
                </select>
              </div>

              {formData.purok && formData.purok !== 'NV9' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">House Number *</label>
                  <input
                    type="text"
                    name="houseNumber"
                    value={formData.houseNumber}
                    onChange={handleInputChange}
                    placeholder="Enter house number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              )}

              {formData.purok === 'NV9' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phase Number *</label>
                    <input
                      type="text"
                      name="phaseNumber"
                      value={formData.phaseNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., 1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Block Number *</label>
                    <input
                      type="text"
                      name="blockNumber"
                      value={formData.blockNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., 5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lot Number *</label>
                    <input
                      type="text"
                      name="lotNumber"
                      value={formData.lotNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., 10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Phone className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-800">Contact Information</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">𝐂𝐄𝐋𝐋𝐏𝐇𝐎𝐍𝐄 𝐍𝐔𝐌𝐁𝐄𝐑 *</label>
                <input
                  type="tel"
                  name="cellphoneNumber"
                  value={formData.cellphoneNumber}
                  onChange={handleInputChange}
                  placeholder="09XX XXX XXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Academic Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-800">Academic Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">𝐘𝐄𝐀𝐑 / 𝐆𝐑𝐀𝐃𝐄 (𝐀.𝐘. 𝟐𝟎𝟐𝟒 - 𝟐𝟎𝟐𝟓) *</label>
                  <select
                    name="yearGrade"
                    value={formData.yearGrade}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Year/Grade</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                    <option value="1st Year College">1st Year College</option>
                    <option value="2nd Year College">2nd Year College</option>
                    <option value="3rd Year College">3rd Year College</option>
                    <option value="4th Year College">4th Year College</option>
                    <option value="5th Year College">5th Year College</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">𝐆𝐄𝐍𝐄𝐑𝐀𝐋 𝐖𝐄𝐈𝐆𝐇𝐓𝐄𝐃 𝐀𝐕𝐄𝐑𝐀𝐆𝐄 (𝐆𝐖𝐀) *</label>
                  <input
                    type="number"
                    name="gwa"
                    value={formData.gwa}
                    onChange={handleInputChange}
                    step="0.01"
                    min="1.00"
                    max="5.00"
                    placeholder="e.g., 1.25"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">𝐏𝐀𝐀𝐑𝐀𝐋𝐀𝐍𝐆 𝐏𝐀𝐏𝐀𝐒𝐔𝐊𝐀𝐍 *</label>
                  <input
                    type="text"
                    name="schoolToAttend"
                    value={formData.schoolToAttend}
                    onChange={handleInputChange}
                    placeholder="School you plan to attend"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">𝐏𝐀𝐀𝐑𝐀𝐋𝐀𝐍𝐆 𝐏𝐈𝐍𝐀𝐏𝐀𝐒𝐔𝐊𝐀𝐍</label>
                  <input
                    type="text"
                    name="schoolAttending"
                    value={formData.schoolAttending}
                    onChange={handleInputChange}
                    placeholder="Current school (if transferring)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  𝐀𝐂𝐀𝐃𝐄𝐌𝐈𝐂 𝐀𝐖𝐀𝐑𝐃𝐒 𝐑𝐄𝐂𝐄𝐈𝐕𝐄𝐃
                </label>
                <input
                  type="text"
                  name="academicAwards"
                  value={formData.academicAwards}
                  onChange={handleInputChange}
                  placeholder="EXAMPLE: DEAN'S LISTER, WITH HIGH HONOR AND WITH HONOR"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Digital Signature */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Pen className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-800">Digital Signature</h3>
              </div>

              <SignatureInput
                onSignatureChange={setSignature}
                label="Applicant's Signature"
                required={true}
              />

              <div className="mt-3 text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="font-medium text-yellow-800 mb-1">Important:</p>
                <p className="text-yellow-700">
                  By providing your digital signature, you certify that all information provided is true and accurate. 
                  This signature has the same legal effect as a handwritten signature.
                </p>
              </div>
            </div>

          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="border-t bg-gray-50 px-6 py-4 sm:py-5 flex flex-col sm:flex-row gap-3 justify-end pb-10 sm:pb-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !signature}
            className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Submit Application
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}