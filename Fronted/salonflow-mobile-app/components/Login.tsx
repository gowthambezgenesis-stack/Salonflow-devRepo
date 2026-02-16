import React, { useState } from 'react';
import { Scissors, ArrowRight, Smartphone, Briefcase, CheckCircle2, ChevronDown } from 'lucide-react';
import { UserRole } from '../types';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { setAccessToken } from '../services/auth';

interface CountryCode {
  code: string;
  dialCode: string;
  flag: string;
}

const countryCodes: CountryCode[] = [
  { code: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { code: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { code: 'IT', dialCode: '+39', flag: '🇮🇹' },
  { code: 'ES', dialCode: '+34', flag: '🇪🇸' },
  { code: 'BR', dialCode: '+55', flag: '🇧🇷' },
  { code: 'MX', dialCode: '+52', flag: '🇲🇽' },
  { code: 'JP', dialCode: '+81', flag: '🇯🇵' },
  { code: 'CN', dialCode: '+86', flag: '🇨🇳' },
  { code: 'KR', dialCode: '+82', flag: '🇰🇷' },
  { code: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { code: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { code: 'SG', dialCode: '+65', flag: '🇸🇬' },
  { code: 'MY', dialCode: '+60', flag: '🇲🇾' },
  { code: 'PK', dialCode: '+92', flag: '🇵🇰' },
  { code: 'BD', dialCode: '+880', flag: '🇧🇩' },
];

interface LoginProps {
  onLogin: (role: UserRole, name?: string, phone?: string) => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<UserRole>('customer');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode>(countryCodes[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      alert("Please accept the Terms and Conditions to continue.");
      return;
    }
    try{
      // Combine country code with phone number
      const fullPhoneNumber = `${selectedCountryCode.dialCode}${phone}`;
      
      if (activeTab === 'customer') {

        await axios.post("http://localhost:8000/send-otp/", {
          name,
          phone_number: fullPhoneNumber,

        });
      } else {

        await axios.post("http://localhost:8000/owner/login/", {
          phone_number: fullPhoneNumber,

        });
      }
      setStep('otp');
    }catch(error: any){

      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Error sending OTP, please try again.";
      alert(errorMessage);
    }
  };


  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      alert("Please accept the Terms and Conditions to continue.");
      return;
    }
    try {
      // Combine country code with phone number
      const fullPhoneNumber = `${selectedCountryCode.dialCode}${phone}`;
      
      if (activeTab === 'customer') {

        const res = await axios.post("http://localhost:8000/verify-otp/", {
          phone_number: fullPhoneNumber,
          otp,
        }, {
          withCredentials: true,
        });

        const { access_token, role, name: userName, phone_number } = res.data;
        if (access_token) {
          setAccessToken(access_token);
          onLogin(role || 'customer', userName || name, phone_number || fullPhoneNumber);
          navigate("/customer/home");
        }
      } else {
        const res = await axios.post("http://localhost:8000/owner/verify/", {
          phone_number: fullPhoneNumber,
          otp,
        }, {
          withCredentials: true,
        });

        const { access_token, role } = res.data;
        if (access_token) {
          setAccessToken(access_token);
          onLogin(role || 'owner', '');
          navigate("/owner/home");
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Error verifying OTP, please try again.";
      alert(errorMessage);
    }
  };

  const switchTab = (role: UserRole) => {
    setActiveTab(role);
    setStep('details');
    setPhone('');
    setOtp('');
    setName('');
    setShowCountryDropdown(false);
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900 font-sans transition-colors duration-200">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-pink-600 to-purple-700 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
              <Scissors className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight">SalonFlow</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl font-bold leading-tight">
              {activeTab === 'customer'
                ? "Your perfect look, just a tap away."
                : "Manage your salon with precision."}
            </h1>
            <p className="text-pink-100 text-lg max-w-md leading-relaxed opacity-90">
              {activeTab === 'customer'
                ? "Skip the waiting room. Discover top stylists, check real-time availability, and book instantly."
                : "The all-in-one platform to streamline bookings, manage staff, and grow your business effortlessly."}
            </p>
          </div>

          <div className="space-y-4 mt-12">
            {[
              'Real-time slot availability',
              'Instant confirmations & alerts',
              'Secure & seamless payments'
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="bg-white/20 p-1 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium text-white/90">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-pink-200/60 mt-12">
          © 2024 SalonFlow Technologies. All rights reserved.
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-12 bg-gray-50/50 dark:bg-gray-900 min-h-screen relative">

        <div className="w-full max-w-md animate-fade-in pt-12 lg:pt-0">
          {/* Mobile Header */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="bg-pink-600 p-3 rounded-xl shadow-lg shadow-pink-200 dark:shadow-none mb-3">
              <Scissors className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SalonFlow</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Smart Booking. Simple Living.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 md:p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 transition-colors duration-200">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Sign in to access your account</p>
            </div>

            {/* Role Switcher */}
            <div className="grid grid-cols-2 bg-gray-100 dark:bg-gray-700 p-1.5 rounded-xl mb-8">
              <button
                onClick={() => switchTab('customer')}
                className={`flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'customer'
                    ? 'bg-white dark:bg-gray-600 text-pink-600 dark:text-pink-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                Customer
              </button>
              <button
                onClick={() => switchTab('owner')}
                className={`flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'owner'
                    ? 'bg-white dark:bg-gray-600 text-pink-600 dark:text-pink-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Briefcase className="h-4 w-4" />
                Partner
              </button>
            </div>

            {step === 'details' ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                {activeTab === 'customer' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. Priya Sharma"
                        className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none font-medium text-gray-900 dark:text-white"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required={activeTab === 'customer'}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Mobile Number</label>
                  <div className="flex gap-2">
                    {/* Country Code Selector */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="flex items-center gap-2 px-3 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 min-w-[100px]"
                      >
                        <span className="text-lg">{selectedCountryCode.flag}</span>
                        <span className="text-sm">{selectedCountryCode.dialCode}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {showCountryDropdown && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setShowCountryDropdown(false)}
                          ></div>
                          <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto w-64">
                            {countryCodes.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                  setSelectedCountryCode(country);
                                  setShowCountryDropdown(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                  selectedCountryCode.code === country.code ? 'bg-pink-50 dark:bg-pink-900/20' : ''
                                }`}
                              >
                                <span className="text-xl">{country.flag}</span>
                                <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white">
                                  {country.dialCode}
                                </span>
                                {selectedCountryCode.code === country.code && (
                                  <CheckCircle2 className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                                )}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Phone Number Input */}
                    <div className="relative flex-1">
                      <input
                        type="tel"
                        placeholder="98765 43210"
                        className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none font-medium text-gray-900 dark:text-white"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms-checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                  />
                  <label htmlFor="terms-checkbox" className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
                    I agree to the Terms and Conditions
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!termsAccepted}
                  className={`w-full py-4 rounded-xl font-bold text-sm transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-gray-200 dark:shadow-none ${
                    termsAccepted
                      ? 'bg-gray-900 dark:bg-pink-600 text-white hover:bg-gray-800 dark:hover:bg-pink-700 cursor-pointer'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Get OTP <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 text-center">
                    Enter 4-Digit Code
                  </label>
                  <input
                    type="text"
                    placeholder="1234"
                    className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-center text-3xl tracking-[0.5em] font-bold text-gray-900 dark:text-white outline-none transition-all"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={4}
                    autoFocus
                    required
                  />
                  <p className="text-xs text-gray-400 mt-3 text-center">
                    Sent to <span className="font-medium text-gray-700 dark:text-gray-300">{selectedCountryCode.dialCode} {phone}</span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!termsAccepted}
                  className={`w-full py-4 rounded-xl font-bold text-sm transition-all transform active:scale-[0.98] shadow-lg shadow-pink-200 dark:shadow-none ${
                    termsAccepted
                      ? 'bg-pink-600 text-white hover:bg-pink-700 cursor-pointer'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Verify & Login
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('details');
                    setOtp('');
                    setPhone('');
                  }}

                  className="w-full text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white py-2"
                >
                  Change Number
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
