import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout/Layout';
import { Save, Users, UserCog, Shield, Award, Edit2, Check, X, AlertCircle, CheckCircle, MapPin, Phone, Mail, Building, Crop } from 'lucide-react';
import { getAuthToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

// Default officials data
const defaultOfficials = {
  chairman: 'ALEXANDER C. MANIO',
  secretary: 'ROYCE ANN C. GALVEZ',
  treasurer: 'MA. LUZ S. REYES',
  skChairman: 'JOHN RUZZEL C. SANTOS',
  skSecretary: '',
  skTreasurer: '',
  skKagawads: ['', '', '', '', '', '', '', ''],
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
  officialImages: {
    chairman: '', secretary: '', treasurer: '', skChairman: '',
    skSecretary: '', skTreasurer: '',
    skKagawads: Array(8).fill(''),
    councilors: Array(7).fill(''),
    administrator: '', assistantSecretary: '', assistantAdministrator: '',
    recordKeeper: '', clerk: ''
  },
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
  const [croppingImg, setCroppingImg] = useState(null);
  const [targetField, setTargetField] = useState(null);

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
    } else if (field.startsWith('skKagawad_')) {
      const index = parseInt(field.split('_')[1]);
      const newSkKagawads = [...officials.skKagawads];
      newSkKagawads[index] = value.toUpperCase();
      setOfficials({ ...officials, skKagawads: newSkKagawads });
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

  const handleOfficialImageUpload = (field, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCroppingImg(reader.result);
        setTargetField(field);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyCrop = (croppedBase64) => {
    const field = targetField;
    const base64 = croppedBase64;
    const newOfficials = { ...officials };

    if (field.startsWith('councilor_')) {
      const index = parseInt(field.split('_')[1]);
      const newImgs = [...officials.officialImages.councilors];
      newImgs[index] = base64;
      newOfficials.officialImages = { ...officials.officialImages, councilors: newImgs };
    } else if (field.startsWith('skKagawad_')) {
      const index = parseInt(field.split('_')[1]);
      const newImgs = [...officials.officialImages.skKagawads];
      newImgs[index] = base64;
      newOfficials.officialImages = { ...officials.officialImages, skKagawads: newImgs };
    } else {
      newOfficials.officialImages = { ...officials.officialImages, [field]: base64 };
    }

    setOfficials(newOfficials);
    setHasChanges(true);
    setCroppingImg(null);
    setTargetField(null);
    setNotification({ type: 'success', message: 'Official photo optimized and applied. Click Save All to finalize.' });
  };

  const updateStyle = (section, field, value) => {
    setOfficials({ ...officials, [section]: { ...officials[section], [field]: value } });
    setHasChanges(true);
  };

  const ImageCropperModal = ({ src, onApply, onCancel }) => {
    const canvasRef = useRef(null);
    const [zoom, setZoom] = useState(1.2);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const imageRef = useRef(null);

    useEffect(() => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        imageRef.current = img;
        draw();
      };
    }, [src]);

    useEffect(() => {
      if (imageRef.current) draw();
    }, [zoom, offset]);

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas || !imageRef.current) return;
      const ctx = canvas.getContext('2d');
      const img = imageRef.current;

      canvas.width = 600;
      canvas.height = 600;
      ctx.clearRect(0, 0, 600, 600);

      const baseDimension = Math.min(img.width, img.height);
      const scale = (600 / baseDimension) * zoom;

      const w = img.width * scale;
      const h = img.height * scale;

      const x = (600 - w) / 2 + offset.x;
      const y = (600 - h) / 2 + offset.y;

      ctx.drawImage(img, x, y, w, h);
    };

    const handleMouseDown = (e) => {
      setIsDragging(true);
      setStartPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setOffset({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
    };

    const handleMouseUp = () => setIsDragging(false);

    return (
      <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="p-6 border-b flex justify-between items-center bg-gray-50">
            <div>
              <h3 className="font-black text-xl text-gray-900 tracking-tight flex items-center gap-2">
                <Crop className="w-6 h-6 text-blue-600" /> CROP PROFILE PHOTO
              </h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">2x2 Official Resolution</p>
            </div>
            <button onClick={onCancel} className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-8">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-inner border-4 border-gray-100 cursor-move bg-white"
              style={{ backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
              <canvas ref={canvasRef} className="w-full h-full relative z-10" />

              {/* Crop Frame Overlay */}
              <div className="absolute inset-0 pointer-events-none ring-[60px] ring-black/40">
                <div className="w-full h-full border-2 border-white/60 border-dashed rounded-sm shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" />
              </div>

              <div className="absolute top-4 left-4 bg-black/60 text-white text-[10px] px-3 py-1.5 rounded-full backdrop-blur-md font-bold uppercase tracking-tighter">
                Drag to Position Card
              </div>
            </div>

            <div className="mt-10 space-y-8">
              <div className="px-2">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Adjust Magnification</span>
                  <span className="text-2xl font-black text-blue-600 tabular-nums">{(zoom * 100).toFixed(0)}%</span>
                </div>
                <input type="range" min="0.5" max="4" step="0.01" value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-blue-600 border border-gray-200" />
              </div>

              <div className="flex gap-4">
                <button onClick={onCancel}
                  className="flex-1 py-4 px-6 border-2 border-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-sm">
                  Discard
                </button>
                <button onClick={() => onApply(canvasRef.current.toDataURL('image/png'))}
                  className="flex-[2] py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black rounded-2xl hover:shadow-xl hover:shadow-blue-200 transition-all active:scale-95 uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" /> Apply Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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

    // Get image for this field
    let imageUrl = '';
    if (field.startsWith('councilor_')) {
      imageUrl = officials.officialImages.councilors[parseInt(field.split('_')[1])];
    } else if (field.startsWith('skKagawad_')) {
      imageUrl = officials.officialImages.skKagawads[parseInt(field.split('_')[1])];
    } else {
      imageUrl = officials.officialImages[field];
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all group">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-1.5 rounded-lg"><Icon className="w-4 h-4 text-blue-600" /></div>
            <span className="text-sm font-medium text-gray-600">{label}</span>
          </div>

          {/* Photo Preview & Upload */}
          <div className="relative group">
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center text-gray-400">
              {imageUrl ? (
                <img src={imageUrl} alt="Official Photo" className="w-full h-full object-cover" />
              ) : (
                <Users className="w-8 h-8 opacity-20" />
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleOfficialImageUpload(field, e)} />
              <Edit2 className="w-3 h-3" />
            </label>
            <div className="absolute -top-7 right-0 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Res: 2x2 (Square)
            </div>
          </div>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2 mt-2">
            <input type="text" value={tempValue} onChange={(e) => setTempValue(field.startsWith('contact_') || field.startsWith('header_') ? e.target.value : e.target.value.toUpperCase())}
              className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold text-sm" autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') saveField(field); if (e.key === 'Escape') cancelEditing(); }} />
            <button onClick={() => saveField(field)} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"><Check className="w-4 h-4" /></button>
            <button onClick={cancelEditing} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="flex items-center justify-between mt-2">
            <span className={`text-base font-bold truncate pr-2 ${value ? 'text-gray-900' : 'text-gray-400 italic'}`}>{value || placeholder || '(Not set)'}</span>
            <button onClick={() => startEditing(field, value)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 className="w-4 h-4" /></button>
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

  return (
    <Layout title="Barangay Officials" subtitle="Manage officials information">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Barangay Officials</h1>
            <p className="text-gray-600 mt-1">Manage the list of current barangay officials</p>
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

        {/* Officials List */}
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

          <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-orange-600" />SK Council</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <EditableField label="SK Chairman" field="skChairman" value={officials.skChairman} icon={Shield} />
                <EditableField label="SK Secretary" field="skSecretary" value={officials.skSecretary} icon={UserCog} />
                <EditableField label="SK Treasurer" field="skTreasurer" value={officials.skTreasurer} icon={Award} />
              </div>

              <div className="border-t border-orange-100 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">SK Kagawad</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {officials.skKagawads.map((c, i) => (
                    <EditableField key={i} label={`SK Kagawad ${i + 1}`} field={`skKagawad_${i}`} value={c} icon={Users} />
                  ))}
                </div>
              </div>
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
        </div>

        {croppingImg && (
          <ImageCropperModal
            src={croppingImg}
            onApply={handleApplyCrop}
            onCancel={() => { setCroppingImg(null); setTargetField(null); }}
          />
        )}
      </div>
    </Layout>
  );
}
