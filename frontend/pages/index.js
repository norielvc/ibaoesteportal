import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Menu, X, ChevronRight, ChevronLeft, Plus, Send, Phone, MapPin, Mail,
  Clock, Sun, Users, FileText, Award, Building2, Heart, Baby,
  AlertTriangle, Shield, Home, Calendar, TrendingUp, CheckCircle, GraduationCap, User
} from 'lucide-react';
import BarangayClearanceModal from '@/components/Forms/BarangayClearanceModal';
import IndigencyCertificateModal from '@/components/Forms/IndigencyCertificateModal';
import ResidencyCertificateModal from '@/components/Forms/ResidencyCertificateModal';
import BusinessPermitModal from '@/components/Forms/BusinessPermitModal';
import EducationalAssistanceModal from '@/components/Forms/EducationalAssistanceModal';

export default function BarangayPortal() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showHotlines, setShowHotlines] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [showClearanceModal, setShowClearanceModal] = useState(false);
  const [showIndigencyModal, setShowIndigencyModal] = useState(false);
  const [showResidencyModal, setShowResidencyModal] = useState(false);
  const [showBusinessPermitModal, setShowBusinessPermitModal] = useState(false);
  const [showEducationalAssistanceModal, setShowEducationalAssistanceModal] = useState(false);
  const [currentFormSlide, setCurrentFormSlide] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', message: ''
  });

  // Animation states
  const [animatedElements, setAnimatedElements] = useState(new Set());

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
  const [officials, setOfficials] = useState([]);

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

  // Load officials from API
  useEffect(() => {
    const fetchOfficials = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';
        console.log('🔍 Fetching officials from:', `${API_URL}/api/officials`);
        const response = await fetch(`${API_URL}/api/officials`);
        console.log('📊 Officials API response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📋 Officials API data received:', data);
        console.log('📋 Number of officials:', data.data?.length || 0);
        
        if (data.success && data.data && data.data.length > 0) {
          console.log('✅ Setting officials from API:', data.data);
          setOfficials(data.data);
          console.log('✅ Officials state updated, count:', data.data.length);
        } else {
          console.log('⚠️ No officials from API, using empty array');
          console.log('⚠️ API response structure:', JSON.stringify(data, null, 2));
        }
      } catch (error) {
        console.error('❌ Error fetching officials:', error);
        console.log('❌ Using empty officials array due to error');
        // Keep empty array on error
      }
    };
    
    fetchOfficials();
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

  // Auto-slide for forms carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFormSlide((prev) => (prev + 1) % 4); // 4 forms total
    }, 6000); // 6 seconds per form
    return () => clearInterval(interval);
  }, []);

  // Auto-slide for facility images with facility transition
  useEffect(() => {
    const interval = setInterval(() => {
      setFacilityImageSlides(prev => {
        const updated = { ...prev };
        const currentFacilityIndex = updated['main'] || 0;
        const currentFacility = facilities[currentFacilityIndex];
        const currentImageIndex = updated[currentFacilityIndex] || 0;
        
        // Check if current facility has multiple images
        if (currentFacility.images && currentFacility.images.length > 1) {
          // If not at last image of current facility, go to next image
          if (currentImageIndex < currentFacility.images.length - 1) {
            updated[currentFacilityIndex] = currentImageIndex + 1;
          } else {
            // At last image of current facility, move to next facility
            const nextFacilityIndex = (currentFacilityIndex + 1) % facilities.length;
            updated['main'] = nextFacilityIndex;
            updated[nextFacilityIndex] = 0; // Start from first image of next facility
          }
        } else {
          // Current facility has only one image, move to next facility
          const nextFacilityIndex = (currentFacilityIndex + 1) % facilities.length;
          updated['main'] = nextFacilityIndex;
          updated[nextFacilityIndex] = 0; // Start from first image of next facility
        }
        
        return updated;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [facilities]);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          setAnimatedElements(prev => new Set([...prev, entry.target.id]));
        }
      });
    }, observerOptions);

    // Observe all animatable elements
    const animatableElements = document.querySelectorAll('.animate-on-scroll');
    animatableElements.forEach((el) => observer.observe(el));

    return () => {
      animatableElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

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
              <a href="#officials" className="text-gray-700 hover:text-blue-600 font-semibold transition-colors py-3 border-b-2 border-transparent hover:border-blue-600">
                Barangay Officials
              </a>
              <a href="#educational-assistance" className="text-gray-700 hover:text-blue-600 font-semibold transition-colors py-3 border-b-2 border-transparent hover:border-blue-600">
                Educational Assistance
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
            <a href="#forms" className="block py-2 text-gray-700 hover:text-blue-600 font-medium">
              Barangay Forms
            </a>
            <a href="#directory" className="block py-2 text-gray-700 hover:text-blue-600 font-medium">
              Facilities
            </a>
            <a href="#officials" className="block py-2 text-gray-700 hover:text-blue-600 font-medium">
              Barangay Officials
            </a>
            <a href="#educational-assistance" className="block py-2 text-gray-700 hover:text-blue-600 font-medium">
              Educational Assistance
            </a>
            <a href="#contact" className="block py-2 text-gray-700 hover:text-blue-600 font-medium">
              Contact Us
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
      <section id="news" className="relative h-[500px] md:h-[600px] overflow-hidden animate-on-scroll">
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

      {/* Available Forms Section - Modern Design with Background */}
      <section id="forms" className="py-20 relative overflow-hidden animate-on-scroll">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/barangay-captain.jpg)' }}
        />
        
        {/* Light Overlay for Text Readability (Optional) */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 via-transparent to-blue-900/40"></div>
        
        {/* Additional Decorative Overlays */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full opacity-50 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full opacity-50 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            {/* Enhanced Online Services Badge */}
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600/90 backdrop-blur-sm border border-blue-500/50 text-white rounded-full text-sm font-semibold mb-6 shadow-lg">
              <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="tracking-wide">ONLINE SERVICES</span>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-xs text-green-300 font-bold">LIVE</span>
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 drop-shadow-2xl mb-4">
              Available Barangay <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 drop-shadow-lg">Forms</span>
            </h2>
            <p className="text-gray-700 drop-shadow-lg max-w-2xl mx-auto text-lg font-medium">
              Request official documents and certificates online. Fast, easy, and convenient.
            </p>
          </div>

          {/* Forms Carousel */}
          <div className="relative mb-16">
            {(() => {
              const forms = [
                {
                  id: 1,
                  title: 'Barangay Clearance',
                  description: 'Official clearance for employment, business permits, and other legal purposes.',
                  icon: Shield,
                  color: 'blue',
                  features: ['Employment', 'Business', 'Legal'],
                  onClick: () => setShowClearanceModal(true)
                },
                {
                  id: 2,
                  title: 'Certificate of Indigency',
                  description: 'Proof of financial status for medical, educational, and social assistance programs.',
                  icon: FileText,
                  color: 'green',
                  features: ['Medical', 'Education', 'Assistance'],
                  onClick: () => setShowIndigencyModal(true)
                },
                {
                  id: 3,
                  title: 'Barangay Residency',
                  description: 'Certificate confirming your residence in Iba O\' Este for various requirements.',
                  icon: Home,
                  color: 'orange',
                  features: ['Proof', 'Enrollment', 'ID'],
                  onClick: () => setShowResidencyModal(true)
                },
                {
                  id: 4,
                  title: 'Business Permit',
                  description: 'Official permit to operate a business within Iba O\' Este barangay jurisdiction.',
                  icon: Building2,
                  color: 'purple',
                  features: ['New Business', 'Renewal', 'Transfer'],
                  onClick: () => setShowBusinessPermitModal(true)
                }
              ];

              const colorClasses = {
                blue: {
                  gradient: 'from-blue-500 to-blue-600',
                  shadow: 'shadow-blue-500/30',
                  bg: 'bg-blue-100',
                  text: 'text-blue-600',
                  button: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
                  buttonShadow: 'shadow-blue-500/25 group-hover:shadow-blue-500/40',
                  overlay: 'from-blue-600/5 to-blue-600/10',
                  feature: 'bg-blue-50 text-blue-600'
                },
                green: {
                  gradient: 'from-green-500 to-green-600',
                  shadow: 'shadow-green-500/30',
                  bg: 'bg-green-100',
                  text: 'text-green-600',
                  button: 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800',
                  buttonShadow: 'shadow-green-500/25 group-hover:shadow-green-500/40',
                  overlay: 'from-green-600/5 to-green-600/10',
                  feature: 'bg-green-50 text-green-600'
                },
                orange: {
                  gradient: 'from-orange-500 to-orange-600',
                  shadow: 'shadow-orange-500/30',
                  bg: 'bg-orange-100',
                  text: 'text-orange-600',
                  button: 'from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800',
                  buttonShadow: 'shadow-orange-500/25 group-hover:shadow-orange-500/40',
                  overlay: 'from-orange-600/5 to-orange-600/10',
                  feature: 'bg-orange-50 text-orange-600'
                },
                purple: {
                  gradient: 'from-purple-500 to-purple-600',
                  shadow: 'shadow-purple-500/30',
                  bg: 'bg-purple-100',
                  text: 'text-purple-600',
                  button: 'from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800',
                  buttonShadow: 'shadow-purple-500/25 group-hover:shadow-purple-500/40',
                  overlay: 'from-purple-600/5 to-purple-600/10',
                  feature: 'bg-purple-50 text-purple-600'
                }
              };

              return (
                <div className="relative overflow-hidden">
                  {/* Container with Background - Added height and better proportions */}
                  <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 relative max-w-lg mx-auto overflow-hidden h-[500px] flex items-center">
                    <div 
                      className="flex transition-transform duration-500 ease-in-out w-full"
                      style={{ transform: `translateX(-${currentFormSlide * 100}%)` }}
                    >
                      {forms.map((form) => {
                        const Icon = form.icon;
                        const colors = colorClasses[form.color];
                        
                        return (
                          <div key={form.id} className="w-full flex-shrink-0 flex items-center justify-center">
                            <div className="group relative bg-transparent rounded-3xl p-10 transition-all duration-500 overflow-hidden w-full max-w-md">
                              {/* Gradient Overlay on Hover */}
                              <div className={`absolute inset-0 bg-gradient-to-br ${colors.overlay} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl`}></div>
                              
                              {/* Icon Container */}
                              <div className="relative mb-8">
                                <div className={`w-20 h-20 bg-gradient-to-br ${colors.gradient} rounded-2xl flex items-center justify-center shadow-lg ${colors.shadow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mx-auto`}>
                                  <Icon className="w-10 h-10 text-white" />
                                </div>
                                <div className={`absolute -top-1 -right-1 w-7 h-7 ${colors.bg} rounded-full flex items-center justify-center`}>
                                  <span className={`${colors.text} text-sm font-bold`}>{form.id}</span>
                                </div>
                              </div>

                              {/* Content */}
                              <div className="text-center">
                                <h3 className={`text-2xl font-bold text-gray-900 mb-4 group-hover:${colors.text} transition-colors relative`}>
                                  {form.title}
                                </h3>
                                <p className="text-gray-500 mb-8 leading-relaxed relative text-base">
                                  {form.description}
                                </p>

                                {/* Features */}
                                <div className="flex flex-wrap gap-3 mb-8 relative justify-center">
                                  {form.features.map((feature, idx) => (
                                    <span key={idx} className={`px-4 py-2 ${colors.feature} text-sm font-medium rounded-full`}>
                                      {feature}
                                    </span>
                                  ))}
                                </div>

                                {/* Button */}
                                <button 
                                  onClick={form.onClick}
                                  className={`relative z-10 w-full bg-gradient-to-r ${colors.button} text-white py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg ${colors.buttonShadow} text-lg`}
                                >
                                  <Plus className="w-6 h-6" />
                                  Request Now
                                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Navigation Arrows - Fixed positioning closer to container */}
                    <button
                      onClick={() => setCurrentFormSlide((prev) => (prev - 1 + forms.length) % forms.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600/90 hover:bg-blue-700 backdrop-blur-sm shadow-xl rounded-full flex items-center justify-center transition-all z-20 border border-blue-500/50"
                    >
                      <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <button
                      onClick={() => setCurrentFormSlide((prev) => (prev + 1) % forms.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600/90 hover:bg-blue-700 backdrop-blur-sm shadow-xl rounded-full flex items-center justify-center transition-all z-20 border border-blue-500/50"
                    >
                      <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                  </div>

                  {/* Dots Navigation */}
                  <div className="flex justify-center gap-2 mt-8">
                    {forms.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentFormSlide(index)}
                        className={`w-3 h-3 rounded-full transition-all ${
                          currentFormSlide === index ? 'bg-blue-600 w-8 shadow-lg' : 'bg-gray-400 hover:bg-gray-500'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })()}
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
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 animate-on-scroll">
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

      {/* Educational Assistance Program Section - SK Project - Trimmed for single screen */}
      <section id="educational-assistance" className="py-12 bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 relative overflow-hidden min-h-screen flex items-center animate-on-scroll">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>

        {/* SK Chairman Background Image - Left Side - Moved Higher */}
        <div className="absolute left-0 top-0 bottom-0 w-1/2 opacity-30 pointer-events-none">
          <div 
            className="w-full h-full bg-cover bg-no-repeat bg-left-top"
            style={{ 
              backgroundImage: 'url(/images/sk-chairman.png)',
              filter: 'brightness(0.9) contrast(1.1)',
              backgroundPosition: 'left 20%'
            }}
          />
        </div>

        <div className="relative z-10 w-full">
          {/* All Educational Assistance content moved to align with Contact Us nav */}
          <div className="flex justify-end">
            <div style={{ width: '1000px', paddingRight: '60px' }}>
              
              {/* Section Header - Bigger */}
              <div className="text-right mb-6">
                <div className="flex justify-end mb-3">
                  <div className="inline-flex items-center gap-4 px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
                    <GraduationCap className="w-8 h-8 text-white" />
                    <span className="text-white font-bold text-xl md:text-2xl tracking-wide">SANGUNIANG KABATAAN PROJECT</span>
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 leading-tight text-right">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400">
                    𝐄𝐃𝐔𝐂𝐀𝐓𝐈𝐎𝐍𝐀𝐋 𝐀𝐒𝐒𝐈𝐒𝐓𝐀𝐍𝐂𝐄 𝐏𝐑𝐎𝐆𝐑𝐀𝐌
                  </span>
                </h2>
                
                <div className="flex justify-end mb-3">
                  <div className="w-28 h-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-full"></div>
                </div>
                
                <p className="text-lg md:text-xl text-blue-100 font-light leading-relaxed text-right">
                  Empowering the youth of Iba O' Este through quality education
                </p>
                <p className="text-base text-cyan-200 font-medium text-right">
                  A Sanguniang Kabataan Initiative for Educational Excellence
                </p>
              </div>



              {/* Compact Requirements Info - Horizontal Layout */}
              <div className="mb-4">
                <div className="flex flex-wrap justify-center gap-4 text-center">
                  {/* Eligibility - Compact */}
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                    <Users className="w-4 h-4 text-blue-300" />
                    <span className="text-white text-xs font-medium">📚 ELIGIBILITY: GRADE 7 TO 4TH/5TH YEAR COLLEGE</span>
                  </div>
                  
                  {/* Selection - Compact */}
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                    <Clock className="w-4 h-4 text-green-300" />
                    <span className="text-white text-xs font-medium">⏰ SELECTION: FIRST COME, FIRST SERVE!</span>
                  </div>
                  
                  {/* Notification - Compact */}
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                    <Phone className="w-4 h-4 text-purple-300" />
                    <span className="text-white text-xs font-medium">📞 NOTIFICATION: MAKIKIPAG-UGNAYAN KUNG KUWALIPIKADO</span>
                  </div>
                </div>
              </div>

              {/* Application Form Section - Simplified */}
              <div className="mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 shadow-xl">
                  <div className="text-center mb-6">
                    <h3 className="text-3xl font-bold text-white mb-4 text-center">Ready to Apply?</h3>
                    <p className="text-blue-200 text-base mb-6 text-center leading-relaxed max-w-3xl mx-auto">
                      Take the first step towards your educational goals. Fill out our comprehensive application form and join hundreds of students who have benefited from this program.
                    </p>
                    
                    <div className="flex justify-center mb-6">
                      <button
                        onClick={() => setShowEducationalAssistanceModal(true)}
                        className="group bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white px-16 py-4 rounded-xl font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-orange-500/25 flex items-center gap-4"
                      >
                        <GraduationCap className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                        APPLY NOW
                        <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>

                    {/* Requirements Preview - Bigger */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white/15 rounded-lg p-4 text-center flex flex-col items-center justify-center min-h-[80px]">
                        <User className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                        <p className="text-white text-sm font-medium">Personal Info</p>
                      </div>
                      <div className="bg-white/15 rounded-lg p-4 text-center flex flex-col items-center justify-center min-h-[80px]">
                        <MapPin className="w-8 h-8 text-green-300 mx-auto mb-2" />
                        <p className="text-white text-sm font-medium">Address</p>
                      </div>
                      <div className="bg-white/15 rounded-lg p-4 text-center flex flex-col items-center justify-center min-h-[80px]">
                        <GraduationCap className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                        <p className="text-white text-sm font-medium">Academic</p>
                      </div>
                      <div className="bg-white/15 rounded-lg p-4 text-center flex flex-col items-center justify-center min-h-[80px]">
                        <Award className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
                        <p className="text-white text-sm font-medium">Awards</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics Section - Bigger */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="text-3xl font-bold text-white mb-2">500+</div>
                    <div className="text-blue-200 text-sm font-medium">Students Helped</div>
                  </div>
                  <div className="text-center bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="text-3xl font-bold text-white mb-2">₱2M+</div>
                    <div className="text-blue-200 text-sm font-medium">Total Assistance</div>
                  </div>
                  <div className="text-center bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="text-3xl font-bold text-white mb-2">95%</div>
                    <div className="text-blue-200 text-sm font-medium">Success Rate</div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </section>

      {/* Facilities Section - Full Width Carousel */}
      <section id="directory" className="py-20 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden animate-on-scroll">
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

      {/* Business Permit Modal */}
      <BusinessPermitModal 
        isOpen={showBusinessPermitModal} 
        onClose={() => setShowBusinessPermitModal(false)} 
      />

      {/* Educational Assistance Modal */}
      <EducationalAssistanceModal 
        isOpen={showEducationalAssistanceModal} 
        onClose={() => setShowEducationalAssistanceModal(false)} 
      />

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-900 animate-on-scroll">
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

      {/* Barangay Officials Section - New Layout */}
      <section id="officials" className="bg-gray-900 animate-on-scroll">
        <div className="text-center py-8">
          <h3 className="text-2xl font-bold text-white mb-2">Barangay Officials</h3>
          <p className="text-blue-300">Meet our dedicated team serving Iba O' Este</p>
        </div>
        
        {/* Photo - Full visibility without overlay */}
        <div className="relative">
          <img 
            src="/images/barangay-officials.jpg" 
            alt="Barangay Iba O' Este Officials" 
            className="w-full h-auto object-contain bg-gray-800"
            onError={(e) => {
              e.target.src = '/background.jpg';
            }}
          />
        </div>
        
        {/* Text Section - Professional Leadership Introduction */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-16 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Leadership Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-6">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-blue-200 font-semibold text-sm tracking-wide uppercase">Leadership Team</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              
              <h4 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Barangay Iba O' Este
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400">
                  Leadership Team
                </span>
              </h4>
              
              <div className="w-32 h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 mx-auto mb-6 rounded-full"></div>
              
              <p className="text-xl md:text-2xl text-blue-100 font-light leading-relaxed max-w-3xl mx-auto">
                Working together for our community's progress and development
              </p>
            </div>
          </div>
        </div>
        
        {/* Officials Details Section */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 py-16 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-12">
              <h5 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Officials</span>
              </h5>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Dedicated leaders committed to serving the community of Iba O' Este with integrity and excellence
              </p>
            </div>
            
            {/* Officials Segregated by Position */}
            {officials.length > 0 ? (
              <div className="space-y-16">
                {(() => {
                  // Group officials by position type
                  const groupedOfficials = {
                    captain: officials.filter(o => o.position_type === 'captain'),
                    kagawad: officials.filter(o => o.position_type === 'kagawad'),
                    sk_chairman: officials.filter(o => o.position_type === 'sk_chairman'),
                    staff: officials.filter(o => ['secretary', 'treasurer', 'staff'].includes(o.position_type))
                  };

                  const sections = [
                    {
                      key: 'captain',
                      title: 'Barangay Captain',
                      subtitle: 'Chief Executive Officer',
                      officials: groupedOfficials.captain,
                      bgColor: 'from-blue-600 to-indigo-700',
                      icon: '👑'
                    },
                    {
                      key: 'kagawad',
                      title: 'Barangay Kagawad',
                      subtitle: 'Council Members',
                      officials: groupedOfficials.kagawad,
                      bgColor: 'from-green-600 to-emerald-700',
                      icon: '🏛️'
                    },
                    {
                      key: 'sk_chairman',
                      title: 'SK Chairman',
                      subtitle: 'Youth Representative',
                      officials: groupedOfficials.sk_chairman,
                      bgColor: 'from-orange-600 to-amber-700',
                      icon: '🌟'
                    },
                    {
                      key: 'staff',
                      title: 'Barangay Staff',
                      subtitle: 'Administrative Team',
                      officials: groupedOfficials.staff,
                      bgColor: 'from-purple-600 to-violet-700',
                      icon: '👥'
                    }
                  ];

                  return sections.map((section) => {
                    if (section.officials.length === 0) return null;

                    return (
                      <div key={section.key} className="mb-16">
                        {/* Section Header */}
                        <div className="text-center mb-8">
                          <div className={`inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r ${section.bgColor} text-white rounded-full mb-4 shadow-lg`}>
                            <span className="text-2xl">{section.icon}</span>
                            <span className="font-bold text-lg tracking-wide">{section.title.toUpperCase()}</span>
                          </div>
                          <p className="text-gray-600 text-lg font-medium">{section.subtitle}</p>
                        </div>

                        {/* Officials Grid for this section */}
                        <div className={`grid gap-6 ${
                          section.key === 'captain' ? 'grid-cols-1 max-w-md mx-auto' :
                          section.key === 'sk_chairman' ? 'grid-cols-1 max-w-md mx-auto' :
                          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                        }`}>
                          {section.officials.map((official, index) => {
                            const colors = [
                              'from-blue-600 to-indigo-700',
                              'from-teal-600 to-green-700', 
                              'from-emerald-600 to-green-700',
                              'from-cyan-600 to-blue-700',
                              'from-green-600 to-emerald-700',
                              'from-purple-600 to-violet-700',
                              'from-orange-600 to-red-700',
                              'from-pink-600 to-rose-700',
                              'from-indigo-600 to-purple-700',
                              'from-yellow-600 to-orange-700',
                              'from-red-600 to-pink-700',
                              'from-gray-600 to-slate-700',
                              'from-violet-600 to-purple-700',
                              'from-rose-600 to-pink-700',
                              'from-amber-600 to-orange-700',
                              'from-lime-600 to-green-700'
                            ];
                            
                            // Use section-specific colors for consistency
                            let colorClass;
                            if (section.key === 'captain') {
                              colorClass = 'from-blue-600 to-indigo-700';
                            } else if (section.key === 'kagawad') {
                              colorClass = colors[index % colors.length];
                            } else if (section.key === 'sk_chairman') {
                              colorClass = 'from-orange-600 to-amber-700';
                            } else {
                              colorClass = colors[(index + 8) % colors.length];
                            }
                            
                            const initials = official.name.split(' ').slice(0, 2).map(n => n[0]).join('');

                            return (
                              <div key={official.id || index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                                <div className={`bg-gradient-to-br ${colorClass} p-6 text-center`}>
                                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-bold text-white">{initials}</span>
                                  </div>
                                  <h3 className="text-xl font-bold text-white mb-1">
                                    {official.position.includes('Kagawad') ? 'Kagawad' : official.position}
                                  </h3>
                                  {official.committee && (
                                    <p className="text-white/80 text-sm">{official.committee}</p>
                                  )}
                                </div>
                                <div className="p-6">
                                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{official.name}</h4>
                                  <p className="text-gray-600 text-sm leading-relaxed">
                                    {official.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Loading officials...</p>
              </div>
            )}
            
            {/* Contact Information */}
            <div className="mt-16 text-center">
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 max-w-2xl mx-auto">
                <h6 className="text-2xl font-bold text-gray-900 mb-4">Get in Touch</h6>
                <p className="text-gray-600 mb-6">
                  Have questions or need assistance? Our officials are here to serve you.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <div className="flex items-center gap-2 text-gray-700">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Phone className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium">(044) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Mail className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="font-medium">ibaoeste@calumpit.gov.ph</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Hotlines - Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {showHotlines && (
          <div className="mb-4 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-80 animate-fade-in">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Emergency Hotlines
            </h4>
            <div className="space-y-3">
              {hotlines.map((hotline, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{hotline.name}</span>
                  <a 
                    href={`tel:${hotline.number}`}
                    className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                  >
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
        
        @keyframes slide-up {
          from { 
            opacity: 0; 
            transform: translateY(50px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes slide-left {
          from { 
            opacity: 0; 
            transform: translateX(50px); 
          }
          to { 
            opacity: 1; 
            transform: translateX(0); 
          }
        }
        
        @keyframes slide-right {
          from { 
            opacity: 0; 
            transform: translateX(-50px); 
          }
          to { 
            opacity: 1; 
            transform: translateX(0); 
          }
        }
        
        @keyframes scale-in {
          from { 
            opacity: 0; 
            transform: scale(0.8); 
          }
          to { 
            opacity: 1; 
            transform: scale(1); 
          }
        }
        
        @keyframes rotate-in {
          from { 
            opacity: 0; 
            transform: rotate(-10deg) scale(0.8); 
          }
          to { 
            opacity: 1; 
            transform: rotate(0deg) scale(1); 
          }
        }
        
        /* Base state for animated elements */
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(50px);
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Animated states */
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        
        .animate-slide-up {
          animation: slide-up 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .animate-slide-left {
          animation: slide-left 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .animate-slide-right {
          animation: slide-right 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .animate-scale-in {
          animation: scale-in 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .animate-rotate-in {
          animation: rotate-in 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        /* Staggered animations */
        .animate-on-scroll:nth-child(1) { transition-delay: 0.1s; }
        .animate-on-scroll:nth-child(2) { transition-delay: 0.2s; }
        .animate-on-scroll:nth-child(3) { transition-delay: 0.3s; }
        .animate-on-scroll:nth-child(4) { transition-delay: 0.4s; }
        .animate-on-scroll:nth-child(5) { transition-delay: 0.5s; }
        .animate-on-scroll:nth-child(6) { transition-delay: 0.6s; }
        .animate-on-scroll:nth-child(7) { transition-delay: 0.7s; }
        .animate-on-scroll:nth-child(8) { transition-delay: 0.8s; }
        
        /* Smooth scrolling for navigation */
        html {
          scroll-behavior: smooth;
        }
        
        /* Enhanced hover effects */
        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
