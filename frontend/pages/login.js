import { useState } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff, AlertCircle, ArrowLeft, Shield, Lock, Mail, User, Sparkles, CheckCircle } from 'lucide-react';
import { login } from '@/lib/auth';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        login(data.data.token, data.data.user);
        router.push('/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* White and Blue Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-blue-100">
        {/* Blue Accent Areas */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-blue-600/15" />
        
        {/* Subtle Geometric Patterns */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-blue-300/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-100/40 to-blue-200/30 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-50/50 to-blue-100/40 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Simple Navigation */}
      <div className="absolute top-0 left-0 right-0 py-4 px-4 z-20">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Layout - Only Back Button */}
          <div className="flex justify-start sm:hidden">
            <button 
              onClick={() => router.push('/')}
              className="group inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-300 shadow-lg hover:shadow-xl text-sm"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Portal</span>
            </button>
          </div>
          
          {/* Desktop Layout - Only Back Button */}
          <div className="hidden sm:flex justify-start">
            <button 
              onClick={() => router.push('/')}
              className="group inline-flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6 pt-24 sm:pt-20">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Side - Enlarged Branding */}
            <div className="text-center lg:text-left space-y-10">
              {/* Enlarged Main Title with BRGY. */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <p className="text-gray-600 text-4xl md:text-5xl lg:text-6xl font-black tracking-wider uppercase">BRGY.</p>
                  <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-tight">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800">
                      IBA O' ESTE PORTAL
                    </span>
                  </h1>
                </div>
                
                <div className="w-40 h-1.5 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full mx-auto lg:mx-0"></div>
                
                {/* Secure Portal Badge - moved here */}
                <div className="flex justify-center lg:justify-start">
                  <div className="inline-flex items-center gap-4 px-8 py-4 bg-blue-600 text-white rounded-full shadow-lg">
                    <Shield className="w-6 h-6" />
                    <span className="text-lg font-bold">SECURE PORTAL</span>
                  </div>
                </div>
                
                <p className="text-gray-700 text-xl md:text-2xl lg:text-3xl leading-relaxed max-w-2xl mx-auto lg:mx-0 font-semibold">
                  Your gateway to efficient barangay management and community services
                </p>
              </div>
            </div>

            {/* Right Side - Login Form with Logo */}
            <div className="flex flex-col items-center justify-center">
              
              {/* Login Card with Logo and Welcome Text */}
              <div className="w-full max-w-md">
                {/* Login Form */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-200 p-8 space-y-6">
                  
                  {/* Logo and Welcome Section inside container */}
                  <div className="text-center mb-8">
                    <div className="mb-6">
                      <img 
                        src="/logo.png" 
                        alt="Iba O' Este Logo" 
                        className="w-20 h-20 md:w-24 md:h-24 object-contain drop-shadow-lg mx-auto"
                      />
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                      Welcome Back
                    </h2>
                    <p className="text-gray-600 text-lg mb-8">
                      Sign in to your management dashboard
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    )}

                    {/* Email Field */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-500 text-base"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full pl-12 pr-12 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-500 text-base"
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="ml-3 text-sm text-gray-600 group-hover:text-gray-800 transition-colors">Remember me</span>
                      </label>
                      <button
                        type="button"
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="group relative w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-2xl disabled:cursor-not-allowed overflow-hidden mt-8"
                    >
                      {/* Button Background Animation */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      
                      <span className="relative flex items-center justify-center gap-3">
                        {isLoading ? (
                          <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Signing in...
                          </>
                        ) : (
                          <>
                            <Shield className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            Sign In to Dashboard
                          </>
                        )}
                      </span>
                    </button>
                  </form>

                  {/* Additional Info */}
                  <div className="pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                      <Shield className="w-4 h-4" />
                      <span>Secured with 256-bit encryption</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 py-6 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              © 2026 Barangay Iba O' Este, Calumpit, Bulacan. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.6); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}