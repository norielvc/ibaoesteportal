import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout/Layout';
import { Save, Users, UserCog, Shield, Award, Edit2, Check, X, AlertCircle, CheckCircle, MapPin, Phone, Mail, Building, FileText, Globe, Palette, Image, Type, Upload, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { getAuthToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

// Default officials data
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
  // Logos
  logos: {
    leftLogo: '/iba-o-este.png',
    rightLogo: '/calumpit.png',
    logoSize: 80,
    captainImage: '/images/brgycaptain.png'
  },
  // Header Style - General
  headerStyle: {
    bgColor: '#ffffff',
    borderColor: '#1e40af',
    fontFamily: 'default'
  },
  // Individual Header Text Styles
  countryStyle: { color: '#4b5563', size: 12, fontWeight: 'normal', fontFamily: 'default' },
  provinceStyle: { color: '#4b5563', size: 12, fontWeight: 'normal', fontFamily: 'default' },
  municipalityStyle: { color: '#4b5563', size: 12, fontWeight: 'normal', fontFamily: 'default' },
  barangayNameStyle: { color: '#1e40af', size: 20, fontWeight: 'bold', fontFamily: 'default' },
  officeNameStyle: { color: '#6b7280', size: 11, fontWeight: 'normal', fontFamily: 'default' },
  // Sidebar Style
  sidebarStyle: {
    bgColor: '#1e40af',
    gradientEnd: '#1e3a8a',
    textColor: '#ffffff',
    labelColor: '#fde047',
    titleSize: 14,
    textSize: 11,
    fontFamily: 'default'
  },
  // Body Style
  bodyStyle: {
    bgColor: '#ffffff',
    textColor: '#1f2937',
    titleColor: '#1e3a8a',
    titleSize: 24,
    textSize: 14,
    fontFamily: 'default'
  },
  // Footer Style
  footerStyle: {
    bgColor: '#f9fafb',
    textColor: '#374151',
    borderColor: '#d1d5db',
    textSize: 9,
    fontFamily: 'default'
  }
};


export default function OfficialsPage() {
  const [officials, setOfficials] = useState(defaultOfficials);
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [notification, setNotification] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('officials');
  const [isSaving, setIsSaving] = useState(false);
  const leftLogoRef = useRef(null);
  const rightLogoRef = useRef(null);
  const captainImageRef = useRef(null);

  useEffect(() => {
    // Fetch from API
    const fetchConfig = async () => {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_URL}/api/officials/config`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();

        if (data.success && data.data) {
          // Merge API data with defaults to ensure all fields exist
          setOfficials(prev => ({
            ...prev,
            ...data.data,
            // Deep merge essential nested objects if they exist in data.data
            contactInfo: { ...prev.contactInfo, ...(data.data.contactInfo || {}) },
            headerInfo: { ...prev.headerInfo, ...(data.data.headerInfo || {}) },
            logos: { ...prev.logos, ...(data.data.logos || {}) },
            headerStyle: { ...prev.headerStyle, ...(data.data.headerStyle || {}) },
            sidebarStyle: { ...prev.sidebarStyle, ...(data.data.sidebarStyle || {}) },
            bodyStyle: { ...prev.bodyStyle, ...(data.data.bodyStyle || {}) },
            footerStyle: { ...prev.footerStyle, ...(data.data.footerStyle || {}) },
          }));
        }
      } catch (error) {
        console.error('Failed to load officials config', error);
        // Fallback to local storage if API fails
        const saved = localStorage.getItem('barangayOfficials');
        if (saved) {
          setOfficials(prev => ({ ...prev, ...JSON.parse(saved) }));
        }
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const startEditing = (field, value) => { setEditingField(field); setTempValue(value || ''); };
  const cancelEditing = () => { setEditingField(null); setTempValue(''); };

  const saveField = (field) => {
    const value = tempValue.trim();
    if (field.startsWith('councilor_')) {
      const index = parseInt(field.split('_')[1]);
      const newCouncilors = [...officials.councilors];
      newCouncilors[index] = value.toUpperCase();
      setOfficials({ ...officials, councilors: newCouncilors });
    } else if (field.startsWith('contact_')) {
      setOfficials({ ...officials, contactInfo: { ...officials.contactInfo, [field.replace('contact_', '')]: value } });
    } else if (field.startsWith('header_')) {
      setOfficials({ ...officials, headerInfo: { ...officials.headerInfo, [field.replace('header_', '')]: value } });
    } else {
      setOfficials({ ...officials, [field]: value.toUpperCase() });
    }
    setEditingField(null); setTempValue(''); setHasChanges(true);
    setNotification({ type: 'success', message: 'Field updated' });
  };

  const updateStyle = (section, field, value) => {
    setOfficials({ ...officials, [section]: { ...officials[section], [field]: value } });
    setHasChanges(true);
  };

  const handleLogoUpload = (side, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        let fieldName = '';
        if (side === 'left') fieldName = 'leftLogo';
        else if (side === 'right') fieldName = 'rightLogo';
        else if (side === 'captain') fieldName = 'captainImage';

        updateStyle('logos', fieldName, reader.result);
        setNotification({ type: 'success', message: `${side.charAt(0).toUpperCase() + side.slice(1)} image uploaded` });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = (side) => {
    let fieldName = '';
    if (side === 'left') fieldName = 'leftLogo';
    else if (side === 'right') fieldName = 'rightLogo';
    else if (side === 'captain') fieldName = 'captainImage';

    updateStyle('logos', fieldName, '');
    setNotification({ type: 'success', message: `${side.charAt(0).toUpperCase() + side.slice(1)} image removed` });
  };

  const saveAllChanges = async () => {
    setIsSaving(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/api/officials/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(officials)
      });
      const data = await res.json();
      if (data.success) {
        setHasChanges(false);
        setNotification({ type: 'success', message: 'All changes saved to database!' });
        // Also save to local storage as backup
        localStorage.setItem('barangayOfficials', JSON.stringify(officials));
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Failed to save', error);
      setNotification({ type: 'error', message: 'Failed to save changes' });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefault = () => {
    if (confirm('Are you sure? This will revert all changes.')) {
      setOfficials(defaultOfficials);
      setHasChanges(true);
      setNotification({ type: 'success', message: 'Reset to default values. Click Save to apply.' });
    }
  };

  const EditableField = ({ label, field, value, icon: Icon, placeholder = '' }) => {
    const isEditing = editingField === field;
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-blue-100 p-1.5 rounded-lg"><Icon className="w-4 h-4 text-blue-600" /></div>
          <span className="text-sm font-medium text-gray-600">{label}</span>
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input type="text" value={tempValue} onChange={(e) => setTempValue(field.startsWith('contact_') || field.startsWith('header_') ? e.target.value : e.target.value.toUpperCase())}
              className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold" autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') saveField(field); if (e.key === 'Escape') cancelEditing(); }} />
            <button onClick={() => saveField(field)} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"><Check className="w-5 h-5" /></button>
            <button onClick={cancelEditing} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><X className="w-5 h-5" /></button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className={`text-lg font-bold ${value ? 'text-gray-900' : 'text-gray-400 italic'}`}>{value || placeholder || '(Not set)'}</span>
            <button onClick={() => startEditing(field, value)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-5 h-5" /></button>
          </div>
        )}
      </div>
    );
  };

  const ColorPicker = ({ label, value, onChange, section, field }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <label className="text-xs font-medium text-gray-600 block mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(section, field, e.target.value)} className="w-10 h-8 rounded cursor-pointer border-0" />
        <span className="text-xs font-mono text-gray-500">{value}</span>
      </div>
    </div>
  );

  const SizeSlider = ({ label, value, onChange, section, field, min = 8, max = 32 }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <label className="text-xs font-medium text-gray-600 block mb-2">{label}: {value}px</label>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(section, field, parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
    </div>
  );

  const FontSelect = ({ label, value, onChange, section, field }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <label className="text-xs font-medium text-gray-600 block mb-2">{label}</label>
      <select value={value} onChange={(e) => onChange(section, field, e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg">
        <option value="default">Default</option>
        <option value="serif">Serif</option>
        <option value="sans">Sans-serif</option>
        <option value="mono">Monospace</option>
      </select>
    </div>
  );

  const tabs = [
    { id: 'officials', label: 'Officials', icon: Users },
    { id: 'header', label: 'Header & Logos', icon: Image },
    { id: 'sidebar', label: 'Sidebar Style', icon: Palette },
    { id: 'body', label: 'Body Style', icon: Type },
    { id: 'footer', label: 'Footer Style', icon: FileText }
  ];


  return (
    <Layout title="Barangay Officials" subtitle="Manage officials and certificate styling">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Certificate Settings</h1>
            <p className="text-gray-600 mt-1">Manage officials, styling, and logos for certificates</p>
          </div>
          <div className="flex gap-3">
            <button onClick={resetToDefault} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Reset</button>
            <button onClick={saveAllChanges} disabled={!hasChanges}
              className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${hasChanges ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
              <Save className="w-5 h-5" />Save All
            </button>
          </div>
        </div>

        {notification && (
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{notification.message}</span>
          </div>
        )}

        {hasChanges && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="text-amber-800 font-medium">Unsaved changes. Click "Save All" to apply.</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        {/* Officials Tab */}
        {activeTab === 'officials' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EditableField label="Punong Barangay" field="chairman" value={officials.chairman} icon={Shield} />
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" />Kagawad</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {officials.councilors.map((c, i) => <EditableField key={i} label="Brgy. Kagawad" field={`councilor_${i}`} value={c} icon={UserCog} />)}
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" />SK Chairman</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EditableField label="SK Chairman" field="skChairman" value={officials.skChairman} icon={Users} />
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Building className="w-5 h-5 text-blue-600" />Staff</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <EditableField label="Brgy. Secretary" field="secretary" value={officials.secretary} icon={UserCog} />
                <EditableField label="Brgy. Treasurer" field="treasurer" value={officials.treasurer} icon={Award} />
                <EditableField label="Brgy. Administrator" field="administrator" value={officials.administrator} icon={UserCog} />
                <EditableField label="Asst. Brgy. Secretary" field="assistantSecretary" value={officials.assistantSecretary} icon={UserCog} />
                <EditableField label="Asst. Brgy. Administrator" field="assistantAdministrator" value={officials.assistantAdministrator} icon={UserCog} />
                <EditableField label="Brgy. Record Keeper" field="recordKeeper" value={officials.recordKeeper} icon={UserCog} />
                <EditableField label="Brgy. Clerk" field="clerk" value={officials.clerk} icon={UserCog} />
              </div>
            </div>

            <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Phone className="w-5 h-5 text-green-600" />Contact Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><EditableField label="Address" field="contact_address" value={officials.contactInfo.address} icon={MapPin} /></div>
                <EditableField label="Contact Person" field="contact_contactPerson" value={officials.contactInfo.contactPerson} icon={UserCog} />
                <EditableField label="Telephone" field="contact_telephone" value={officials.contactInfo.telephone} icon={Phone} />
                <div className="md:col-span-2"><EditableField label="Email" field="contact_email" value={officials.contactInfo.email} icon={Mail} /></div>
              </div>
            </div>
          </div>
        )}


        {/* Header & Logos Tab */}
        {activeTab === 'header' && (
          <div className="space-y-6">
            {/* Logo Upload */}
            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Image className="w-5 h-5 text-purple-600" />Certificate Logos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Logo */}
                <div className="bg-white rounded-xl p-4 border">
                  <label className="text-sm font-medium text-gray-700 block mb-3">Left Logo (Barangay)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                      {officials.logos?.leftLogo ? (
                        <img src={officials.logos.leftLogo} alt="Left Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Image className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input type="file" ref={leftLogoRef} accept="image/*" onChange={(e) => handleLogoUpload('left', e)} className="hidden" />
                      <button onClick={() => leftLogoRef.current?.click()} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-purple-700">
                        <Upload className="w-4 h-4" />Upload
                      </button>
                      {officials.logos?.leftLogo && (
                        <button onClick={() => removeLogo('left')} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2 hover:bg-red-200">
                          <Trash2 className="w-4 h-4" />Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {/* Right Logo */}
                <div className="bg-white rounded-xl p-4 border">
                  <label className="text-sm font-medium text-gray-700 block mb-3">Right Logo (Municipality)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                      {officials.logos?.rightLogo ? (
                        <img src={officials.logos.rightLogo} alt="Right Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Image className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input type="file" ref={rightLogoRef} accept="image/*" onChange={(e) => handleLogoUpload('right', e)} className="hidden" />
                      <button onClick={() => rightLogoRef.current?.click()} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-purple-700">
                        <Upload className="w-4 h-4" />Upload
                      </button>
                      {officials.logos?.rightLogo && (
                        <button onClick={() => removeLogo('right')} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2 hover:bg-red-200">
                          <Trash2 className="w-4 h-4" />Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Captain's Image */}
                <div className="bg-white rounded-xl p-4 border md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 block mb-3">Punong Barangay Portrait</label>
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden shadow-inner">
                      {officials.logos?.captainImage ? (
                        <img src={officials.logos.captainImage} alt="Captain" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-gray-500 mb-2">This image appears in the certificate sidebar above the Captain's name.<br />Recommended size: 300x400 pixels (3:4 aspect ratio).</p>
                      <div className="flex gap-2">
                        <input type="file" ref={captainImageRef} accept="image/*" onChange={(e) => handleLogoUpload('captain', e)} className="hidden" />
                        <button onClick={() => captainImageRef.current?.click()} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-purple-700">
                          <Upload className="w-4 h-4" />Upload Portrait
                        </button>
                        {officials.logos?.captainImage && (
                          <button onClick={() => removeLogo('captain')} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2 hover:bg-red-200">
                            <Trash2 className="w-4 h-4" />Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <SizeSlider label="Logo Size" value={officials.logos?.logoSize || 80} onChange={updateStyle} section="logos" field="logoSize" min={40} max={120} />
              </div>
            </div>

            {/* Header Text */}
            <div className="bg-pink-50 rounded-2xl p-6 border border-pink-200">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-pink-600" />Header Text</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EditableField label="Country" field="header_country" value={officials.headerInfo?.country} icon={Globe} />
                <EditableField label="Province" field="header_province" value={officials.headerInfo?.province} icon={MapPin} />
                <EditableField label="Municipality" field="header_municipality" value={officials.headerInfo?.municipality} icon={Building} />
                <EditableField label="Barangay Name" field="header_barangayName" value={officials.headerInfo?.barangayName} icon={Shield} />
                <div className="md:col-span-2"><EditableField label="Office Name" field="header_officeName" value={officials.headerInfo?.officeName} icon={Building} /></div>
              </div>
            </div>

            {/* Individual Header Text Styles */}
            <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-200">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Type className="w-5 h-5 text-indigo-600" />Individual Text Styling</h3>

              {/* Country Style */}
              <div className="bg-white rounded-xl p-4 border mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-700">Country: "{officials.headerInfo?.country}"</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ColorPicker label="Color" value={officials.countryStyle?.color || '#4b5563'} onChange={updateStyle} section="countryStyle" field="color" />
                  <SizeSlider label="Size" value={officials.countryStyle?.size || 12} onChange={updateStyle} section="countryStyle" field="size" min={8} max={18} />
                  <div className="bg-white rounded-xl border border-gray-200 p-3">
                    <label className="text-xs font-medium text-gray-600 block mb-2">Weight</label>
                    <select value={officials.countryStyle?.fontWeight || 'normal'} onChange={(e) => updateStyle('countryStyle', 'fontWeight', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg">
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                  <FontSelect label="Font" value={officials.countryStyle?.fontFamily || 'default'} onChange={updateStyle} section="countryStyle" field="fontFamily" />
                </div>
              </div>

              {/* Province Style */}
              <div className="bg-white rounded-xl p-4 border mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-700">Province: "{officials.headerInfo?.province}"</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ColorPicker label="Color" value={officials.provinceStyle?.color || '#4b5563'} onChange={updateStyle} section="provinceStyle" field="color" />
                  <SizeSlider label="Size" value={officials.provinceStyle?.size || 12} onChange={updateStyle} section="provinceStyle" field="size" min={8} max={18} />
                  <div className="bg-white rounded-xl border border-gray-200 p-3">
                    <label className="text-xs font-medium text-gray-600 block mb-2">Weight</label>
                    <select value={officials.provinceStyle?.fontWeight || 'normal'} onChange={(e) => updateStyle('provinceStyle', 'fontWeight', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg">
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                  <FontSelect label="Font" value={officials.provinceStyle?.fontFamily || 'default'} onChange={updateStyle} section="provinceStyle" field="fontFamily" />
                </div>
              </div>

              {/* Municipality Style */}
              <div className="bg-white rounded-xl p-4 border mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-700">Municipality: "{officials.headerInfo?.municipality}"</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ColorPicker label="Color" value={officials.municipalityStyle?.color || '#4b5563'} onChange={updateStyle} section="municipalityStyle" field="color" />
                  <SizeSlider label="Size" value={officials.municipalityStyle?.size || 12} onChange={updateStyle} section="municipalityStyle" field="size" min={8} max={18} />
                  <div className="bg-white rounded-xl border border-gray-200 p-3">
                    <label className="text-xs font-medium text-gray-600 block mb-2">Weight</label>
                    <select value={officials.municipalityStyle?.fontWeight || 'normal'} onChange={(e) => updateStyle('municipalityStyle', 'fontWeight', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg">
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                  <FontSelect label="Font" value={officials.municipalityStyle?.fontFamily || 'default'} onChange={updateStyle} section="municipalityStyle" field="fontFamily" />
                </div>
              </div>

              {/* Barangay Name Style */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-blue-800">Barangay Name: "{officials.headerInfo?.barangayName}"</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ColorPicker label="Color" value={officials.barangayNameStyle?.color || '#1e40af'} onChange={updateStyle} section="barangayNameStyle" field="color" />
                  <SizeSlider label="Size" value={officials.barangayNameStyle?.size || 20} onChange={updateStyle} section="barangayNameStyle" field="size" min={14} max={32} />
                  <div className="bg-white rounded-xl border border-gray-200 p-3">
                    <label className="text-xs font-medium text-gray-600 block mb-2">Weight</label>
                    <select value={officials.barangayNameStyle?.fontWeight || 'bold'} onChange={(e) => updateStyle('barangayNameStyle', 'fontWeight', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg">
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                  <FontSelect label="Font" value={officials.barangayNameStyle?.fontFamily || 'default'} onChange={updateStyle} section="barangayNameStyle" field="fontFamily" />
                </div>
              </div>

              {/* Office Name Style */}
              <div className="bg-white rounded-xl p-4 border">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-700">Office Name: "{officials.headerInfo?.officeName}"</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ColorPicker label="Color" value={officials.officeNameStyle?.color || '#6b7280'} onChange={updateStyle} section="officeNameStyle" field="color" />
                  <SizeSlider label="Size" value={officials.officeNameStyle?.size || 11} onChange={updateStyle} section="officeNameStyle" field="size" min={8} max={16} />
                  <div className="bg-white rounded-xl border border-gray-200 p-3">
                    <label className="text-xs font-medium text-gray-600 block mb-2">Weight</label>
                    <select value={officials.officeNameStyle?.fontWeight || 'normal'} onChange={(e) => updateStyle('officeNameStyle', 'fontWeight', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg">
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                  <FontSelect label="Font" value={officials.officeNameStyle?.fontFamily || 'default'} onChange={updateStyle} section="officeNameStyle" field="fontFamily" />
                </div>
              </div>
            </div>

            {/* Header General Style */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-gray-600" />Header Background & Border</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <ColorPicker label="Background" value={officials.headerStyle?.bgColor || '#ffffff'} onChange={updateStyle} section="headerStyle" field="bgColor" />
                <ColorPicker label="Border Color" value={officials.headerStyle?.borderColor || '#1e40af'} onChange={updateStyle} section="headerStyle" field="borderColor" />
                <FontSelect label="Default Font" value={officials.headerStyle?.fontFamily || 'default'} onChange={updateStyle} section="headerStyle" field="fontFamily" />
              </div>
            </div>

            {/* Header Preview */}
            <div className="bg-white rounded-2xl p-6 border">
              <h3 className="font-bold text-gray-900 mb-4">Header Preview</h3>
              <div className="border-2 rounded-xl p-4" style={{ backgroundColor: officials.headerStyle?.bgColor, borderColor: officials.headerStyle?.borderColor }}>
                <div className="flex items-center justify-between">
                  <div style={{ width: `${officials.logos?.logoSize || 80}px`, height: `${officials.logos?.logoSize || 80}px` }} className="bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {officials.logos?.leftLogo ? <img src={officials.logos.leftLogo} className="w-full h-full object-contain" alt="Left" /> : <Image className="w-8 h-8 text-gray-400" />}
                  </div>
                  <div className="text-center flex-1 px-4">
                    <p style={{ color: officials.countryStyle?.color, fontSize: `${officials.countryStyle?.size}px`, fontWeight: officials.countryStyle?.fontWeight }}>{officials.headerInfo?.country}</p>
                    <p style={{ color: officials.provinceStyle?.color, fontSize: `${officials.provinceStyle?.size}px`, fontWeight: officials.provinceStyle?.fontWeight }}>{officials.headerInfo?.province}</p>
                    <p style={{ color: officials.municipalityStyle?.color, fontSize: `${officials.municipalityStyle?.size}px`, fontWeight: officials.municipalityStyle?.fontWeight }}>{officials.headerInfo?.municipality}</p>
                    <p className="mt-1" style={{ color: officials.barangayNameStyle?.color, fontSize: `${officials.barangayNameStyle?.size}px`, fontWeight: officials.barangayNameStyle?.fontWeight }}>{officials.headerInfo?.barangayName}</p>
                    <p style={{ color: officials.officeNameStyle?.color, fontSize: `${officials.officeNameStyle?.size}px`, fontWeight: officials.officeNameStyle?.fontWeight }}>{officials.headerInfo?.officeName}</p>
                  </div>
                  <div style={{ width: `${officials.logos?.logoSize || 80}px`, height: `${officials.logos?.logoSize || 80}px` }} className="bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {officials.logos?.rightLogo ? <img src={officials.logos.rightLogo} className="w-full h-full object-contain" alt="Right" /> : <Image className="w-8 h-8 text-gray-400" />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Sidebar Style Tab */}
        {activeTab === 'sidebar' && (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-blue-600" />Sidebar Colors</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ColorPicker label="Background Start" value={officials.sidebarStyle?.bgColor || '#1e40af'} onChange={updateStyle} section="sidebarStyle" field="bgColor" />
                <ColorPicker label="Background End" value={officials.sidebarStyle?.gradientEnd || '#1e3a8a'} onChange={updateStyle} section="sidebarStyle" field="gradientEnd" />
                <ColorPicker label="Text Color" value={officials.sidebarStyle?.textColor || '#ffffff'} onChange={updateStyle} section="sidebarStyle" field="textColor" />
                <ColorPicker label="Label Color" value={officials.sidebarStyle?.labelColor || '#fde047'} onChange={updateStyle} section="sidebarStyle" field="labelColor" />
              </div>
            </div>

            <div className="bg-cyan-50 rounded-2xl p-6 border border-cyan-200">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Type className="w-5 h-5 text-cyan-600" />Sidebar Typography</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <SizeSlider label="Title Size" value={officials.sidebarStyle?.titleSize || 14} onChange={updateStyle} section="sidebarStyle" field="titleSize" min={10} max={24} />
                <SizeSlider label="Text Size" value={officials.sidebarStyle?.textSize || 11} onChange={updateStyle} section="sidebarStyle" field="textSize" min={8} max={16} />
                <FontSelect label="Font" value={officials.sidebarStyle?.fontFamily || 'default'} onChange={updateStyle} section="sidebarStyle" field="fontFamily" />

                <div className="bg-white rounded-xl border border-gray-200 p-3">
                  <label className="text-xs font-medium text-gray-600 block mb-2">Title Weight</label>
                  <select value={officials.sidebarStyle?.titleWeight || 'bold'} onChange={(e) => updateStyle('sidebarStyle', 'titleWeight', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg">
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="bold">Bold</option>
                    <option value="extrabold">Extra Bold</option>
                  </select>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-3">
                  <label className="text-xs font-medium text-gray-600 block mb-2">Name Weight</label>
                  <select value={officials.sidebarStyle?.nameWeight || 'bold'} onChange={(e) => updateStyle('sidebarStyle', 'nameWeight', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg">
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="semibold">Semi Bold</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-3">
                  <label className="text-xs font-medium text-gray-600 block mb-2">Letter Spacing</label>
                  <select value={officials.sidebarStyle?.letterSpacing || 'normal'} onChange={(e) => updateStyle('sidebarStyle', 'letterSpacing', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg">
                    <option value="tighter">Tighter</option>
                    <option value="normal">Normal</option>
                    <option value="wide">Wide</option>
                    <option value="widest">Widest</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sidebar Preview */}
            {/* Sidebar Preview */}
            <div className="bg-white rounded-2xl p-6 border">
              <h3 className="font-bold text-gray-900 mb-4">Sidebar Preview</h3>
              <div className="w-56 overflow-hidden flex flex-col p-4"
                style={{
                  background: `linear-gradient(to bottom, ${officials.sidebarStyle?.bgColor}, ${officials.sidebarStyle?.gradientEnd})`,
                  color: officials.sidebarStyle?.textColor,
                  borderRight: `2px solid ${officials.sidebarStyle?.labelColor || officials.sidebarStyle?.textColor}`,
                  letterSpacing: officials.sidebarStyle?.letterSpacing === 'tighter' ? '-0.05em' : officials.sidebarStyle?.letterSpacing === 'wide' ? '0.025em' : officials.sidebarStyle?.letterSpacing === 'widest' ? '0.1em' : 'normal'
                }}>

                {/* Captain Photo */}
                <div className="mb-2 mx-auto overflow-hidden rounded-lg w-24 h-32 bg-gray-200 border-0">
                  <img
                    src={officials.logos?.captainImage || '/images/brgycaptain.png'}
                    alt="Punong Barangay"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="text-center mb-4">
                  <p className="mb-1 text-xs" style={{
                    color: officials.sidebarStyle?.labelColor,
                    fontWeight: officials.sidebarStyle?.titleWeight === 'normal' ? '400' : officials.sidebarStyle?.titleWeight === 'medium' ? '500' : officials.sidebarStyle?.titleWeight === 'bold' ? '700' : officials.sidebarStyle?.titleWeight === 'extrabold' ? '800' : '700'
                  }}>PUNONG BARANGAY</p>
                  <p style={{
                    fontSize: `${officials.sidebarStyle?.textSize || 13}px`,
                    fontWeight: officials.sidebarStyle?.nameWeight === 'normal' ? '400' : officials.sidebarStyle?.nameWeight === 'medium' ? '500' : officials.sidebarStyle?.nameWeight === 'semibold' ? '600' : officials.sidebarStyle?.nameWeight === 'bold' ? '700' : officials.sidebarStyle?.nameWeight === 'extrabold' ? '800' : '700'
                  }}>{officials.chairman}</p>
                </div>

                <div className="text-center">
                  <p className="mb-1 text-xs" style={{
                    color: officials.sidebarStyle?.labelColor,
                    fontWeight: officials.sidebarStyle?.titleWeight === 'normal' ? '400' : officials.sidebarStyle?.titleWeight === 'medium' ? '500' : officials.sidebarStyle?.titleWeight === 'bold' ? '700' : officials.sidebarStyle?.titleWeight === 'extrabold' ? '800' : '700'
                  }}>SANGGUNIANG BARANGAY MEMBERS</p>
                  <div className="space-y-1">
                    {officials.councilors?.slice(0, 3).map((c, i) => (
                      <p key={i} style={{
                        fontSize: `${(officials.sidebarStyle?.textSize || 11) - 2}px`,
                        fontWeight: officials.sidebarStyle?.nameWeight === 'normal' ? '400' : officials.sidebarStyle?.nameWeight === 'medium' ? '500' : officials.sidebarStyle?.nameWeight === 'semibold' ? '600' : officials.sidebarStyle?.nameWeight === 'bold' ? '700' : officials.sidebarStyle?.nameWeight === 'extrabold' ? '800' : '700'
                      }}>{c}</p>
                    ))}
                    <p className="text-xs opacity-50">...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Body Style Tab */}
        {activeTab === 'body' && (
          <div className="space-y-6">
            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-emerald-600" />Body Colors</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <ColorPicker label="Background" value={officials.bodyStyle?.bgColor || '#ffffff'} onChange={updateStyle} section="bodyStyle" field="bgColor" />
                <ColorPicker label="Text Color" value={officials.bodyStyle?.textColor || '#1f2937'} onChange={updateStyle} section="bodyStyle" field="textColor" />
                <ColorPicker label="Title Color" value={officials.bodyStyle?.titleColor || '#1e3a8a'} onChange={updateStyle} section="bodyStyle" field="titleColor" />
              </div>
            </div>

            <div className="bg-teal-50 rounded-2xl p-6 border border-teal-200">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Type className="w-5 h-5 text-teal-600" />Body Typography</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <SizeSlider label="Title Size" value={officials.bodyStyle?.titleSize || 24} onChange={updateStyle} section="bodyStyle" field="titleSize" min={18} max={36} />
                <SizeSlider label="Text Size" value={officials.bodyStyle?.textSize || 14} onChange={updateStyle} section="bodyStyle" field="textSize" min={10} max={18} />
                <FontSelect label="Font" value={officials.bodyStyle?.fontFamily || 'default'} onChange={updateStyle} section="bodyStyle" field="fontFamily" />
              </div>
            </div>

            {/* Body Preview */}
            <div className="bg-white rounded-2xl p-6 border">
              <h3 className="font-bold text-gray-900 mb-4">Body Preview</h3>
              <div className="rounded-lg p-6 border" style={{ backgroundColor: officials.bodyStyle?.bgColor }}>
                <h2 className="font-bold text-center border-b-2 inline-block pb-1 mb-4" style={{ color: officials.bodyStyle?.titleColor, fontSize: `${officials.bodyStyle?.titleSize}px`, borderColor: officials.bodyStyle?.titleColor }}>BARANGAY CLEARANCE</h2>
                <p style={{ color: officials.bodyStyle?.textColor, fontSize: `${officials.bodyStyle?.textSize}px` }}>
                  <strong>TO WHOM IT MAY CONCERN:</strong>
                </p>
                <p className="mt-2" style={{ color: officials.bodyStyle?.textColor, fontSize: `${officials.bodyStyle?.textSize}px` }}>
                  This is to certify that <strong className="underline">JUAN DELA CRUZ</strong>, 25 years old, Male, Single, is a bonafide resident of Purok 2, Barangay Iba O' Este.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Style Tab */}
        {activeTab === 'footer' && (
          <div className="space-y-6">
            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-amber-600" />Footer Colors</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <ColorPicker label="Background" value={officials.footerStyle?.bgColor || '#f9fafb'} onChange={updateStyle} section="footerStyle" field="bgColor" />
                <ColorPicker label="Text Color" value={officials.footerStyle?.textColor || '#374151'} onChange={updateStyle} section="footerStyle" field="textColor" />
                <ColorPicker label="Border Color" value={officials.footerStyle?.borderColor || '#d1d5db'} onChange={updateStyle} section="footerStyle" field="borderColor" />
              </div>
            </div>

            <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Type className="w-5 h-5 text-orange-600" />Footer Typography</h3>
              <div className="grid grid-cols-2 gap-4">
                <SizeSlider label="Text Size" value={officials.footerStyle?.textSize || 9} onChange={updateStyle} section="footerStyle" field="textSize" min={7} max={12} />
                <FontSelect label="Font" value={officials.footerStyle?.fontFamily || 'default'} onChange={updateStyle} section="footerStyle" field="fontFamily" />
              </div>
            </div>

            {/* Footer Preview */}
            <div className="bg-white rounded-2xl p-6 border">
              <h3 className="font-bold text-gray-900 mb-4">Footer Preview</h3>
              <div className="rounded-lg p-4 border" style={{ backgroundColor: officials.footerStyle?.bgColor, borderColor: officials.footerStyle?.borderColor }}>
                <p className="text-center font-semibold" style={{ color: officials.footerStyle?.textColor, fontSize: `${officials.footerStyle?.textSize}px` }}>
                  {officials.contactInfo?.address}
                </p>
                <p className="text-center mt-1" style={{ color: officials.footerStyle?.textColor, fontSize: `${officials.footerStyle?.textSize}px` }}>
                  <strong>Contact:</strong> {officials.contactInfo?.contactPerson} | <strong>Tel:</strong> {officials.contactInfo?.telephone} | <strong>Email:</strong> {officials.contactInfo?.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
