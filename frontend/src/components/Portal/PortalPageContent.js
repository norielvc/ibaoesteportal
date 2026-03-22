import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Menu, X, ChevronRight, ChevronLeft, Sun, Moon, Cloud,
  Users, FileText, Building2, Heart, Baby,
  AlertTriangle, Shield, Home, Calendar, TrendingUp, CheckCircle, GraduationCap,
  Store, Briefcase, Stethoscope, Fingerprint, UserPlus, Flower2, Search, Star, Leaf,
  Phone, MapPin, Mail, Clock
} from 'lucide-react';

// Modals
import BarangayClearanceModal from '@/components/Forms/BarangayClearanceModal';
import IndigencyCertificateModal from '@/components/Forms/IndigencyCertificateModal';
import ResidencyCertificateModal from '@/components/Forms/ResidencyCertificateModal';
import BusinessPermitModal from '@/components/Forms/BusinessPermitModal';
import EducationalAssistanceModal from '@/components/Forms/EducationalAssistanceModal';
import NaturalDeathCertificateModal from '@/components/Forms/NaturalDeathCertificateModal';
import GuardianshipCertificateModal from '@/components/Forms/GuardianshipCertificateModal';
import CohabitationCertificateModal from '@/components/Forms/CohabitationCertificateModal';
import MedicoLegalModal from '@/components/Forms/MedicoLegalModal';
import SamePersonCertificateModal from '@/components/Forms/SamePersonCertificateModal';

export default function PortalPageContent({ initialTenantId }) {
  const router = useRouter();
  const [tenantId, setTenantId] = useState(initialTenantId || 'ibaoeste');
  
  const [tenantConfig, setTenantConfig] = useState({
    name: "BARANGAY PORTAL",
    shortName: "Barangay",
    subtitle: "Public Information and Service Center",
    logo: "/logo.png",
    colorStyle: { background: 'linear-gradient(to right, #004700, #001a00)' }
  });

  // Resilient API URL Discovery
  const getApiUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== 'undefined' && window.location.hostname.includes('railway.app')) {
       return `https://brgyportal-production.up.railway.app/api`;
    }
    return 'http://localhost:5005/api';
  };

  const API_URL = getApiUrl().replace(/\/$/, '');

  useEffect(() => {
    if (tenantId === 'demo') {
      setTenantConfig({
        name: "DEMO BARANGAY PORTAL",
        shortName: "Demo Barangay",
        subtitle: "Sample Municipality, Philippines",
        logo: "/calumpit.png",
        colorStyle: { background: 'linear-gradient(to right, #1a1a1a, #2d2d2d)' },
        isDemo: true
      });
    } else {
      setTenantConfig({
        name: "IBA O' ESTE PORTAL",
        shortName: "Iba O' Este",
        subtitle: "Calumpit, Bulacan",
        logo: "/logo.png",
        colorStyle: { background: 'linear-gradient(to right, #004700, #001a00)' },
        isDemo: false
      });
    }
  }, [tenantId]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTime, setCurrentTime] = useState('');
  const [weatherInfo, setWeatherInfo] = useState({ icon: Sun, text: 'Loading...', color: 'text-yellow-400' });
  const [showClearanceModal, setShowClearanceModal] = useState(false);
  const [showIndigencyModal, setShowIndigencyModal] = useState(false);
  const [showResidencyModal, setShowResidencyModal] = useState(false);
  const [showBusinessPermitModal, setShowBusinessPermitModal] = useState(false);
  const [showEducationalAssistanceModal, setShowEducationalAssistanceModal] = useState(false);
  const [showNaturalDeathModal, setShowNaturalDeathModal] = useState(false);
  const [showGuardianshipModal, setShowGuardianshipModal] = useState(false);
  const [showCohabitationModal, setShowCohabitationModal] = useState(false);
  const [showMedicoLegalModal, setShowMedicoLegalModal] = useState(false);
  const [showSamePersonModal, setShowSamePersonModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [newsItems, setNewsItems] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [officials, setOfficials] = useState([]);
  const [visibilitySettings, setVisibilitySettings] = useState(null);
  const [missionGoals, setMissionGoals] = useState({
    barangayVision: 'A model community that is progressive, peaceful, and disaster-resilient, where empowered citizens live in harmony with nature and participate in transparent local governance.',
    barangayMission: '',
    barangayGoal: 'To deliver dedicated public service through innovative social programs, sustainable infrastructure, and community-driven initiatives that uplift the dignity and prosperity of every resident.',
    skVision: 'An inspired youth community that is actively involved in community building, advocating for education, sports, and social responsibility while maintaining the highest level of integrity.',
    skMission: '',
    skGoal: "To empower the youth through comprehensive development programs in leadership, environment, and wellness, ensuring every young resident has the opportunity to contribute to our barangay's future.",
  });
  const [siteContact, setSiteContact] = useState({
    address: 'Calumpit, Bulacan',
    phone: '(044) 123-4567',
    email: 'ibaoeste@calumpit.gov.ph',
    officeHours: 'Monday - Friday: 8:00 AM - 5:00 PM\nSaturday: 8:00 AM - 12:00 PM\nSunday: Closed',
    hotlines: [
      { name: 'Barangay Emergency', number: '(044) 123-4567' },
      { name: 'Police Station', number: '911' },
      { name: 'Fire Department', number: '(044) 765-4321' },
      { name: 'Medical Emergency', number: '(044) 987-6543' },
    ],
  });
  const [achievements, setAchievements] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [heroSettings, setHeroSettings] = useState({
    title: 'BARANGAY OFFICIALS',
    subtitle: 'Meet our dedicated team serving our community',
    image: ''
  });

  const getIconComponent = (iconName) => {
    const iconMap = { 'Heart': Heart, 'Building2': Building2, 'Baby': Baby, 'Home': Home, 'Award': Award };
    return iconMap[iconName] || Building2;
  };

  const fetchedSections = useRef({ aboveFold: false, facilities: false, achievements: false, officials: false });

  useEffect(() => {
    if (!tenantId || fetchedSections.current.aboveFold) return;
    fetchedSections.current.aboveFold = true;
    const headers = { 'x-tenant-id': tenantId };
    Promise.all([
      fetch(`${API_URL}/events`, { headers }).then(r => r.json()).catch(() => ({ success: false })),
      fetch(`${API_URL}/officials/config`, { headers }).then(r => r.json()).catch(() => ({ success: false })),
    ]).then(([evData, cfgData]) => {
      if (evData.success && evData.data?.length > 0) setNewsItems(evData.data);
      if (cfgData.success && cfgData.data) {
        if (cfgData.data.heroSection) setHeroSettings(cfgData.data.heroSection);
        if (cfgData.data.visibility) setVisibilitySettings(cfgData.data.visibility);
        if (cfgData.data.missionGoals) setMissionGoals(prev => ({ ...prev, ...cfgData.data.missionGoals }));
        if (cfgData.data.siteContact) setSiteContact(prev => ({ ...prev, ...cfgData.data.siteContact, hotlines: cfgData.data.siteContact.hotlines || prev.hotlines }));
        if (cfgData.data.portalBranding && tenantId !== 'demo' && tenantId !== 'ibaoeste') {
          const b = cfgData.data.portalBranding;
          setTenantConfig(prev => ({
            ...prev,
            name: b.portalName || prev.name,
            shortName: b.shortName || prev.shortName,
            subtitle: b.subtitle || prev.subtitle,
            logo: b.logoUrl || prev.logo,
            colorStyle: { background: `linear-gradient(to right, ${b.primaryColor || '#004700'}, ${b.secondaryColor || '#001a00'})` },
          }));
        }
      }
    });
  }, [tenantId]);

  // Dynamic Weather & Time
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Manila' }));
      const hour = now.getHours();
      let w = { icon: Sun, text: 'Morning, 28°C', color: 'text-yellow-400' };
      if (hour >= 12 && hour < 18) w = { icon: Sun, text: 'Afternoon, 31°C', color: 'text-orange-400' };
      else if (hour >= 18 && hour < 21) w = { icon: Cloud, text: 'Evening, 26°C', color: 'text-blue-300' };
      else if (hour >= 21 || hour < 6) w = { icon: Moon, text: 'Night, 24°C', color: 'text-blue-200' };
      setWeatherInfo(w);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const forms = useMemo(() => [
    { title: 'Barangay Clearance', icon: Shield, onClick: () => setShowClearanceModal(true) },
    { title: 'Certificate of Indigency', icon: FileText, onClick: () => setShowIndigencyModal(true) },
    { title: 'Barangay Residency', icon: Home, onClick: () => setShowResidencyModal(true) },
    { title: 'Business Permit', icon: Building2, onClick: () => setShowBusinessPermitModal(true) },
    { title: 'Co-habitation', icon: Heart, onClick: () => setShowCohabitationModal(true) },
    { title: 'Medico-legal', icon: Stethoscope, onClick: () => setShowMedicoLegalModal(true) },
    { title: 'Same Person', icon: Fingerprint, onClick: () => setShowSamePersonModal(true) },
    { title: 'Guardianship', icon: UserPlus, onClick: () => setShowGuardianshipModal(true) },
    { title: 'Natural Death', icon: Flower2, onClick: () => setShowNaturalDeathModal(true) },
    { title: 'Educational Assistance', icon: GraduationCap, onClick: () => setShowEducationalAssistanceModal(true) }
  ], []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <style>{`
        .portal-nav-btn { transition: all 0.2s ease; }
        .portal-nav-btn:hover { background: rgba(255,255,255,0.1); }
      `}</style>
      
      {/* Header */}
      <header className="p-4 md:p-6 text-white shadow-xl" style={tenantConfig.colorStyle}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <img src={tenantConfig.logo} alt="Logo" className="w-16 h-16 md:w-24 md:h-24 object-contain rounded-full bg-white p-1" />
             <div>
               <h1 className="text-xl md:text-3xl font-black tracking-tight">{tenantConfig.name}</h1>
               <p className="opacity-80 font-medium">{tenantConfig.subtitle}</p>
             </div>
          </div>
          <div className="text-right flex flex-col items-end gap-1 opacity-90 text-sm">
            <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {currentTime}</div>
            <div className="flex items-center gap-2">{React.createElement(weatherInfo.icon, { className: `w-4 h-4 ${weatherInfo.color}` })} Weather: {weatherInfo.text}</div>
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-3 shadow-md flex justify-between items-center">
         <div className="flex gap-8 overflow-x-auto no-scrollbar">
           {['forms', 'directory', 'officials', 'contact'].map(n => (
             <a key={n} href={`#${n}`} className="text-gray-600 hover:text-green-700 font-bold uppercase text-xs tracking-widest">{n}</a>
           ))}
         </div>
         <button onClick={() => router.push(`/login?tenant=${tenantId}`)} className="bg-green-700 text-white px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-green-800 transition-colors">Login</button>
      </nav>

      {/* Main Content (Simplied for brevity, expanding only relevant parts for tenant identification) */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-20">
        
        {/* Forms Section */}
        <section id="forms" className="space-y-8">
           <div className="text-center">
             <h2 className="text-3xl font-black text-gray-900 border-b-4 border-green-700 inline-block pb-2">ONLINE SERVICES</h2>
             <p className="text-gray-500 mt-2 font-medium uppercase tracking-widest text-xs">Fast and easy document processing</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {forms.map(f => (
               <button key={f.title} onClick={f.onClick} className="flex flex-col items-center p-8 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform" />
                  <f.icon className="w-12 h-12 text-green-700 mb-4 relative z-10" />
                  <h3 className="font-black text-gray-800 relative z-10 uppercase tracking-tight">{f.title}</h3>
               </button>
             ))}
           </div>
        </section>

        {/* Informative placeholder for other sections */}
        <div className="py-20 text-center bg-gray-100 rounded-[2rem] border-2 border-dashed border-gray-200">
           <p className="text-gray-400 font-bold italic">Visit our portal at Calumpit, Bulacan to see our latest news and facilities.</p>
        </div>

      </main>

      <footer className="bg-gray-900 text-white p-12 mt-20">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-4">
               <img src={tenantConfig.logo} alt="Logo" className="w-12 h-12 rounded-full" />
               <p className="font-bold tracking-tight">{tenantConfig.name}</p>
            </div>
            <p className="text-gray-500 text-sm">© 2026 {tenantConfig.shortName}. Dedicated to public service.</p>
         </div>
      </footer>

      {/* Modals */}
      {showClearanceModal && <BarangayClearanceModal isOpen={showClearanceModal} onClose={() => setShowClearanceModal(false)} tenantConfig={tenantConfig} />}
      {showIndigencyModal && <IndigencyCertificateModal isOpen={showIndigencyModal} onClose={() => setShowIndigencyModal(false)} tenantConfig={tenantConfig} />}
      {showResidencyModal && <ResidencyCertificateModal isOpen={showResidencyModal} onClose={() => setShowResidencyModal(false)} tenantConfig={tenantConfig} />}
      {showBusinessPermitModal && <BusinessPermitModal isOpen={showBusinessPermitModal} onClose={() => setShowBusinessPermitModal(false)} tenantConfig={tenantConfig} />}
      {showEducationalAssistanceModal && <EducationalAssistanceModal isOpen={showEducationalAssistanceModal} onClose={() => setShowEducationalAssistanceModal(false)} tenantConfig={tenantConfig} />}
      {showNaturalDeathModal && <NaturalDeathCertificateModal isOpen={showNaturalDeathModal} onClose={() => setShowNaturalDeathModal(false)} tenantConfig={tenantConfig} />}
      {showGuardianshipModal && <GuardianshipCertificateModal isOpen={showGuardianshipModal} onClose={() => setShowGuardianshipModal(false)} tenantConfig={tenantConfig} />}
      {showCohabitationModal && <CohabitationCertificateModal isOpen={showCohabitationModal} onClose={() => setShowCohabitationModal(false)} tenantConfig={tenantConfig} />}
      {showMedicoLegalModal && <MedicoLegalModal isOpen={showMedicoLegalModal} onClose={() => setShowMedicoLegalModal(false)} tenantConfig={tenantConfig} />}
      {showSamePersonModal && <SamePersonCertificateModal isOpen={showSamePersonModal} onClose={() => setShowSamePersonModal(false)} tenantConfig={tenantConfig} />}

    </div>
  );
}
