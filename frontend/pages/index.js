import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Menu, X, ChevronRight, ChevronLeft, Plus, Send, Phone, MapPin, Mail,
  Clock, Sun, Users, FileText, Award, Building2, Heart, Baby,
  AlertTriangle, Shield, Home, Calendar, TrendingUp, CheckCircle
} from 'lucide-react';
import BarangayClearanceModal from '@/components/Forms/BarangayClearanceModal';
import IndigencyCertificateModal from '@/components/Forms/IndigencyCertificateModal';
import ResidencyCertificateModal from '@/components/Forms/ResidencyCertificateModal';

export default function BarangayPortal() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showHotlines, setShowHotlines] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [showClearanceModal, setShowClearanceModal] = useState(false);
  const [showIndigencyModal, setShowIndigencyModal] = useState(false);
  const [showResidencyModal, setShowResidencyModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', message: ''
  });

  // Default events (fallback)
  const defaultNewsItems = [
    {
      title: 'Barangay Clean-Up Drive 2026',
      description: 'Join us this Saturday for our monthly community clean-up initiative. Together, we can keep Iba O\' Este beautiful!',
      image: '/background.jpg',
      date: 'January 5, 2026'
    },
    {
      title: 'Free Medical Mission',
      description: 'Free check-ups, medicines, and health consultations for all residents. Bring your Barangay ID.',
      image: '/background.jpg',
      date: 'January 10, 2026'
    },
    {
      title: 'Livelihood Training Program',
      description: 'Register now for free skills training in food processing, handicrafts, and more!',
      image: '/background.jpg',
      date: 'January 15, 2026'
    }
  ];

  const [newsItems, setNewsItems] = useState(defaultNewsItems);

  // Default facilities (fallback)
  const defaultFacilities = [
    { 
      name: 'Health Center', 
      icon: Heart, 
      description: 'Primary healthcare services for residents', 
      color: 'bg-red-500',
      images: ['/background.jpg', '/background.jpg', '/background.jpg'],
      features: ['Free Checkups', 'Vaccination', 'First Aid']
    },
    { 
      name: 'Multi-purpose Hall', 
      icon: Building2, 
      description: 'Events, meetings, and community gatherings', 
      color: 'bg-blue-500',
      images: ['/background.jpg', '/background.jpg', '/background.jpg'],
      features: ['500 Capacity', 'AC Equipped', 'Stage']
    },
    { 
      name: 'Daycare Center', 
      icon: Baby, 
      description: 'Early childhood education and care', 
      color: 'bg-pink-500',
      images: ['/background.jpg', '/background.jpg', '/background.jpg'],
      features: ['Ages 3-5', 'Free Education', 'Meals']
    },
    { 
      name: 'Barangay Hall', 
      icon: Home, 
      description: 'Administrative services and assistance', 
      color: 'bg-green-500',
      images: ['/background.jpg', '/background.jpg', '/background.jpg'],
      features: ['Documents', 'Assistance', 'Info Desk']
    },
    { 
      name: 'Sports Complex', 
      icon: Award, 
      description: 'Basketball court and fitness area', 
      color: 'bg-orange-500',
      images: ['/background.jpg', '/background.jpg', '/background.jpg'],
      features: ['Basketball', 'Volleyball', 'Gym']
    }
  ];

  const [facilities, setFacilities] = useState(defaultFacilities);

  // Helper function to map icon names to components
  const getIconComponent = (iconName) => {
    const iconMap = {
      'Heart': Heart,
      'Building2': Building2,
      'Baby': Baby,
      'Home': Home,
      'Award': Award
    };
    return iconMap[iconName] || Building2;
  };

  // Touch/swipe handling for mobile
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    const currentFacilityIndex = facilityImageSlides['main'] || 0;
    const facility = facilities[currentFacilityIndex];
    const currentImageIndex = facilityImageSlides[currentFacilityIndex] || 0;

    console.log('Swipe detected:', { distance, isLeftSwipe, isRightSwipe, currentImageIndex, totalImages: facility.images.length });

    if (isLeftSwipe && facility.images.length > 1) {
      // Swipe left - next image in current facility
      const nextIndex = (currentImageIndex + 1) % facility.images.length;
      console.log('Swiping to next image:', nextIndex);
      setFacilityImageSlides(prev => ({ 
        ...prev, 
        [currentFacilityIndex]: nextIndex 
      }));
    }
    if (isRightSwipe && facility.images.length > 1) {
      // Swipe right - previous image in current facility
      const prevIndex = (currentImageIndex - 1 + facility.images.length) % facility.images.length;
      console.log('Swiping to previous image:', prevIndex);
      setFacilityImageSlides(prev => ({ 
        ...prev, 
        [currentFacilityIndex]: prevIndex 
      }));
    }
    
    // Reset touch values
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Load events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';
        console.log('Fetching events from:', `${API_URL}/api/events`);
        const response = await fetch(`${API_URL}/api/events`);
        console.log('Events API response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Events API data:', data);
        
        if (data.success && data.data && data.data.length > 0) {
          console.log('Setting events from API:', data.data);
          setNewsItems(data.data);
        } else {
          console.log('No events from API, using defaults');
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        console.log('Using default events due to error');
        // Keep default events on error
      }
    };
    
    fetchEvents();
  }, []);

  // Load facilities from API
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';
        console.log('Fetching facilities from:', `${API_URL}/api/facilities`);
        const response = await fetch(`${API_URL}/api/facilities`);
        console.log('Facilities API response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Facilities API data:', data);
        
        if (data.success && data.data && data.data.length > 0) {
          // Map icon names to actual components
          const facilitiesWithIcons = data.data.map(facility => ({
            ...facility,
            icon: getIconComponent(facility.icon)
          }));
          console.log('Setting facilities from API:', facilitiesWithIcons);
          setFacilities(facilitiesWithIcons);
        } else {
          console.log('No facilities from API, using defaults');
        }
      } catch (error) {
        console.error('Error fetching facilities:', error);
        console.log('Using default facilities due to error');
        // Keep default facilities on error
      }
    };
    
    fetchFacilities();
  }, []);

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
        timeZone: 'Asia/Manila'
      };
      setCurrentTime(now.toLocaleDateString('en-PH', options));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-slide for news carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % newsItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [newsItems.length]);

  // State for facility image slides
  const [facilityImageSlides, setFacilityImageSlides] = useState({});

  // Initialize facility slides
  useEffect(() => {
    const initial = {};
    facilities.forEach((_, index) => {
      initial[index] = 0;
    });
    setFacilityImageSlides(initial);
  }, [facilities]);

  // Auto-slide for facility images
  useEffect(() => {
    const interval = setInterval(() => {
      setFacilityImageSlides(prev => {
        const updated = { ...prev };
        facilities.forEach((facility, index) => {
          if (facility.images && facility.images.length > 1) {
            updated[index] = ((updated[index] || 0) + 1) % facility.images.length;
          }
        });
        return updated;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [facilities]);

  const stats = [
    { label: 'Total Population', value: '12,847', icon: Users },
    { label: 'Active Programs', value: '24', icon: TrendingUp },
    { label: 'Forms Processed This Month', value: '1,256', icon: FileText }
  ];

  const hotlines = [
    { name: 'Barangay Emergency', number: '(044) 123-4567' },
    { name: 'Police Station', number: '911' },
    { name: 'Fire Department', number: '(044) 765-4321' },
    { name: 'Medical Emergency', number: '(044) 987-6543' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Message sent successfully! We will get back to you soon.');
    setFormData({ firstName: '', lastName: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Large Portal Header with Date/Time and Weather */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-green-700 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-8">
          {/* Left Side - Logo and Title */}
          <div className="flex items-center gap-4 md:gap-6">
            <img src="/logo.png" alt="Iba O' Este Logo" className="h-20 w-20 md:h-24 md:w-24 object-contain drop-shadow-2xl" />
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">
                IBA O' ESTE PORTAL
              </h1>
              <p className="text-lg md:text-xl text-blue-100 font-medium mt-1">
                Calumpit, Bulacan
              </p>
            </div>
          </div>
          
          {/* Right Side - Date/Time and Weather */}
          <div className="flex flex-col items-end gap-1 mt-4 md:mt-0 text-white text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{currentTime || 'Loading...'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-yellow-400" />
              <span>Weather: Sunny, 31°C</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end items-center h-12 gap-8">
            {/* Desktop Navigation - Right Side */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#news" className="text-gray-700 hover:text-blue-600 font-semibold transition-colors py-3 border-b-2 border-transparent hover:border-blue-600">
                News & Updates
              </a>
              <a href="#forms" className="text-gray-700 hover:text-blue-600 font-semibold transition-colors py-3 border-b-2 border-transparent hover:border-blue-600">
                Barangay Forms
              </a>
              <a href="#directory" className="text-gray-700 hover:text-blue-600 font-semibold transition-colors py-3 border-b-2 border-transparent hover:border-blue-600">
                Facilities
              </a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 font-semibold transition-colors py-3 border-b-2 border-transparent hover:border-blue-600">
                Contact Us
              </a>
              <button
                onClick={() => router.push('/login')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold transition-all shadow-md"
              >
                Login
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 py-4 px-4 space-y-3">
            <a href="#news" className="block py-2 text-gray-700 hover:text-blue-600 font-medium">
              News & Updates
            </a>
            <a href="#directory" className="block py-2 text-gray-700 hover:text-blue-600 font-medium">
              Barangay Directory
            </a>
            <a href="#forms" className="block py-2 text-gray-700 hover:text-blue-600 font-medium">
              Downloadable Forms
            </a>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Login
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section with News Carousel */}
      <section id="news" className="relative h-[500px] md:h-[600px] overflow-hidden">
        {newsItems.map((item, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              currentSlide === index ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${item.image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-800/70" />
            <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
              <div className="max-w-2xl text-white">
                <span className="inline-block bg-yellow-500 text-blue-900 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {item.date}
                </span>
                <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{item.title}</h2>
                <p className="text-lg md:text-xl text-gray-200 mb-6">{item.description}</p>
                <button className="bg-white text-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg">
                  Read More <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Navigation */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
          {newsItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                currentSlide === index ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>

        {/* Arrow Navigation */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + newsItems.length) % newsItems.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-3 rounded-full transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % newsItems.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-3 rounded-full transition-all"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </section>

      {/* Available Forms Section - Modern Design */}
      <section id="forms" className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-50 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-100 rounded-full opacity-50 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            {/* Enhanced Online Services Badge */}
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm font-semibold mb-6 shadow-lg shadow-blue-500/30">
              <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full">
                <FileText className="w-4 h-4" />
              </div>
              <span className="tracking-wide">ONLINE SERVICES</span>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-xs text-green-300">LIVE</span>
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Available Barangay <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">Forms</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Request official documents and certificates online. Fast, easy, and convenient.
            </p>
          </div>

          {/* Forms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Barangay Clearance Card */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden">
              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              {/* Icon Container */}
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">1</span>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors relative">
                Barangay Clearance
              </h3>
              <p className="text-gray-500 mb-6 leading-relaxed relative">
                Official clearance for employment, business permits, and other legal purposes.
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-2 mb-6 relative">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">Employment</span>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">Business</span>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">Legal</span>
              </div>

              {/* Button */}
              <button 
                onClick={() => setShowClearanceModal(true)}
                className="relative z-10 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40"
              >
                <Plus className="w-5 h-5" />
                Request Now
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Certificate of Indigency Card */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden">
              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              {/* Icon Container */}
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xs font-bold">2</span>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors relative">
                Certificate of Indigency
              </h3>
              <p className="text-gray-500 mb-6 leading-relaxed relative">
                Proof of financial status for medical, educational, and social assistance programs.
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-2 mb-6 relative">
                <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">Medical</span>
                <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">Education</span>
                <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">Assistance</span>
              </div>

              {/* Button */}
              <button 
                onClick={() => setShowIndigencyModal(true)}
                className="relative z-10 w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 group-hover:shadow-green-500/40"
              >
                <Plus className="w-5 h-5" />
                Request Now
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Barangay Residency Card */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden">
              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              {/* Icon Container */}
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Home className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-xs font-bold">3</span>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors relative">
                Barangay Residency
              </h3>
              <p className="text-gray-500 mb-6 leading-relaxed relative">
                Certificate confirming your residence in Iba O' Este for various requirements.
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-2 mb-6 relative">
                <span className="px-3 py-1 bg-orange-50 text-orange-600 text-xs font-medium rounded-full">Proof</span>
                <span className="px-3 py-1 bg-orange-50 text-orange-600 text-xs font-medium rounded-full">Enrollment</span>
                <span className="px-3 py-1 bg-orange-50 text-orange-600 text-xs font-medium rounded-full">ID</span>
              </div>

              {/* Button */}
              <button 
                onClick={() => setShowResidencyModal(true)}
                className="relative z-10 w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40"
              >
                <Plus className="w-5 h-5" />
                Request Now
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Enhanced Bottom Info */}
          <div className="mt-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {/* Processing Time */}
              <div className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                    <Clock className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">1-3 Days</p>
                    <p className="text-sm text-blue-600 font-medium">Processing Time</p>
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">FAST</span>
                </div>
              </div>

              {/* 100% Online */}
              <div className="group relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">100%</p>
                    <p className="text-sm text-green-600 font-medium">Fully Online</p>
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">NO LINES</span>
                </div>
              </div>

              {/* SMS Notification */}
              <div className="group relative bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                    <Phone className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">SMS</p>
                    <p className="text-sm text-orange-600 font-medium">Instant Updates</p>
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">REAL-TIME</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transparency Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Barangay at a Glance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center transform hover:scale-105 transition-all border border-white/20"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-4xl font-bold text-white mb-2">{stat.value}</p>
                  <p className="text-blue-200">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Facilities Section - Full Width Carousel */}
      <section id="directory" className="py-20 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-100 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold mb-4 border border-blue-100">
              <Building2 className="w-4 h-4" />
              Community Services
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Barangay <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">Facilities</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Explore our modern community facilities designed to serve the residents of Iba O' Este
            </p>
          </div>

          {/* Full Width Facility Carousel - Updated without arrows */}
          <div className="relative mb-12">
            {(() => {
              const currentFacilityIndex = facilityImageSlides['main'] || 0;
              const facility = facilities[currentFacilityIndex];
              const Icon = facility.icon;
              const currentImageIndex = facilityImageSlides[currentFacilityIndex] || 0;
              const colors = {
                'bg-red-500': { bg: 'from-red-500 to-rose-600', light: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', shadow: 'shadow-red-500/20', dot: 'bg-red-500' },
                'bg-blue-500': { bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', shadow: 'shadow-blue-500/20', dot: 'bg-blue-500' },
                'bg-pink-500': { bg: 'from-pink-500 to-rose-600', light: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100', shadow: 'shadow-pink-500/20', dot: 'bg-pink-500' },
                'bg-green-500': { bg: 'from-green-500 to-emerald-600', light: 'bg-green-50', text: 'text-green-600', border: 'border-green-100', shadow: 'shadow-green-500/20', dot: 'bg-green-500' },
                'bg-orange-500': { bg: 'from-orange-500 to-amber-600', light: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', shadow: 'shadow-orange-500/20', dot: 'bg-orange-500' }
              };
              const colorSet = colors[facility.color] || colors['bg-blue-500'];

              return (
                <div 
                  className="group relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
                >
                  {/* Large Image Carousel */}
                  <div 
                    className="relative h-[400px] md:h-[500px] lg:h-[550px] overflow-hidden"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    {facility.images.map((image, imgIndex) => (
                      <div
                        key={imgIndex}
                        className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                          currentImageIndex === imgIndex 
                            ? 'opacity-100 scale-100' 
                            : 'opacity-0 scale-105'
                        }`}
                      >
                        <img 
                          src={image} 
                          alt={`${facility.name} ${imgIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    
                    {/* Icon Badge */}
                    <div className={`absolute top-6 left-6 w-16 h-16 bg-gradient-to-br ${colorSet.bg} rounded-2xl flex items-center justify-center shadow-xl ${colorSet.shadow} backdrop-blur-sm`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Simple image indicator dots */}
                    {facility.images.length > 1 && (
                      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2">
                        {facility.images.map((_, dotIndex) => (
                          <div
                            key={dotIndex}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              currentImageIndex === dotIndex 
                                ? 'bg-white' 
                                : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                      <div className="max-w-3xl">
                        <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">
                          {facility.name}
                        </h3>
                        <p className="text-white/90 text-lg md:text-xl mb-6 leading-relaxed">
                          {facility.description}
                        </p>

                        {/* Features */}
                        <div className="flex flex-wrap gap-3">
                          {facility.features.map((feature, fIndex) => (
                            <span 
                              key={fIndex}
                              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full border border-white/30"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Image Thumbnails Navigation */}
          {(() => {
            const currentFacilityIndex = facilityImageSlides['main'] || 0;
            const facility = facilities[currentFacilityIndex];
            const currentImageIndex = facilityImageSlides[currentFacilityIndex] || 0;
            
            // Only show thumbnails if facility has multiple images
            if (facility.images.length <= 1) return null;
            
            return (
              <div className="mb-8 px-4">
                <div className="flex justify-center gap-3 overflow-x-auto pb-4 pt-2">
                  {facility.images.map((image, imgIndex) => (
                    <button
                      key={imgIndex}
                      onClick={() => {
                        console.log('Thumbnail clicked:', imgIndex);
                        setFacilityImageSlides(prev => ({ ...prev, [currentFacilityIndex]: imgIndex }));
                      }}
                      className={`flex-shrink-0 w-20 h-16 md:w-24 md:h-18 rounded-lg overflow-hidden transition-all duration-300 touch-manipulation ${
                        currentImageIndex === imgIndex
                          ? 'ring-4 ring-blue-500 ring-offset-2 shadow-lg scale-105'
                          : 'ring-2 ring-gray-200 hover:ring-gray-300 active:ring-blue-400 hover:scale-102'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${facility.name} thumbnail ${imgIndex + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/background.jpg';
                        }}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">
                  Tap thumbnails to view different images
                </p>
              </div>
            );
          })()}

          {/* Facility Navigation Dots - Enhanced for Touch */}
          <div className="flex justify-center gap-3 mb-12">
            {facilities.map((facility, index) => {
              const Icon = facility.icon;
              const isActive = (facilityImageSlides['main'] || 0) === index;
              const colors = {
                'bg-red-500': 'from-red-500 to-rose-600',
                'bg-blue-500': 'from-blue-500 to-indigo-600',
                'bg-pink-500': 'from-pink-500 to-rose-600',
                'bg-green-500': 'from-green-500 to-emerald-600',
                'bg-orange-500': 'from-orange-500 to-amber-600'
              };
              
              return (
                <button
                  key={index}
                  onClick={() => setFacilityImageSlides(prev => ({ ...prev, main: index }))}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all touch-manipulation min-w-[80px] ${
                    isActive 
                      ? 'bg-white shadow-lg scale-110 border-2 border-blue-500' 
                      : 'bg-white/50 hover:bg-white hover:shadow-md border-2 border-transparent active:bg-white active:shadow-lg'
                  }`}
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${colors[facility.color]} rounded-xl flex items-center justify-center shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-xs font-medium text-center leading-tight ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                    {facility.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">5+</p>
              <p className="text-gray-500 text-sm">Facilities</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">24/7</p>
              <p className="text-gray-500 text-sm">Emergency</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">12K+</p>
              <p className="text-gray-500 text-sm">Residents</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">100%</p>
              <p className="text-gray-500 text-sm">Coverage</p>
            </div>
          </div>
        </div>
      </section>

      {/* Barangay Clearance Modal */}
      <BarangayClearanceModal 
        isOpen={showClearanceModal} 
        onClose={() => setShowClearanceModal(false)} 
      />

      {/* Certificate of Indigency Modal */}
      <IndigencyCertificateModal 
        isOpen={showIndigencyModal} 
        onClose={() => setShowIndigencyModal(false)} 
      />

      {/* Barangay Residency Modal */}
      <ResidencyCertificateModal 
        isOpen={showResidencyModal} 
        onClose={() => setShowResidencyModal(false)} 
      />

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-2">Feel free to contact us</h2>
            <p className="text-xl text-blue-400 italic">Wag mahiya at kami ay inyong tanungin</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Juan"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Dela Cruz"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="juan@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone / Numero ng Telepono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="09XX XXX XXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                    placeholder="Your message here..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 transform hover:scale-105 shadow-lg"
                >
                  <Send className="w-5 h-5" />
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-blue-800/50 backdrop-blur-sm rounded-2xl p-8 border border-blue-700/50">
                <h3 className="text-xl font-bold text-white mb-6">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-600 p-3 rounded-lg">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Address</p>
                      <p className="text-blue-200">Brgy. Iba O' Este, Calumpit, Bulacan</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-600 p-3 rounded-lg">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Phone</p>
                      <p className="text-blue-200">(044) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-600 p-3 rounded-lg">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Email</p>
                      <p className="text-blue-200">ibaoeste@calumpit.gov.ph</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-800/50 backdrop-blur-sm rounded-2xl p-8 border border-blue-700/50">
                <h3 className="text-xl font-bold text-white mb-4">Office Hours</h3>
                <div className="space-y-2 text-blue-200">
                  <p>Monday - Friday: 8:00 AM - 5:00 PM</p>
                  <p>Saturday: 8:00 AM - 12:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-12 w-12 object-contain" />
              <div>
                <p className="text-white font-bold">Iba O' Este Portal</p>
                <p className="text-sm">Calumpit, Bulacan</p>
              </div>
            </div>
            <p className="text-sm">© 2026 Barangay Iba O' Este. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating Emergency Hotlines Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {showHotlines && (
          <div className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-2xl p-6 w-72 mb-4 animate-fade-in">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Emergency Hotlines
            </h3>
            <div className="space-y-3">
              {hotlines.map((hotline, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600">{hotline.name}</span>
                  <a href={`tel:${hotline.number}`} className="text-blue-600 font-semibold hover:underline">
                    {hotline.number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={() => setShowHotlines(!showHotlines)}
          className={`${
            showHotlines ? 'bg-gray-600' : 'bg-red-600 hover:bg-red-700 animate-pulse'
          } text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110`}
        >
          {showHotlines ? <X className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
