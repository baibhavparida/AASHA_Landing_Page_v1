import React from 'react';
import { X, Phone, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (userType: 'elderly' | 'family') => void;
}

export default function LoginModal({ onClose, onLoginSuccess }: LoginModalProps) {
  const [step, setStep] = React.useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [countryCode, setCountryCode] = React.useState('+91');
  const [otp, setOtp] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [profileData, setProfileData] = React.useState<{ id: string; registration_type: string } | null>(null);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check if user exists (phone_number is stored WITHOUT country code)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, registration_type')
        .eq('phone_number', phoneNumber)
        .eq('country_code', countryCode)
        .maybeSingle();

      if (!profile) {
        setError('No account found with this phone number. Please sign up first.');
        setLoading(false);
        return;
      }

      // Store profile data and move to OTP step
      setProfileData(profile);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to verify phone number. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!profileData) {
        throw new Error('Profile data not found');
      }

      // Accept any OTP - bypass authentication for now
      // In production, you would verify the OTP here

      // Store profile ID in localStorage for dashboard to use
      localStorage.setItem('aasha_profile_id', profileData.id);
      localStorage.setItem('aasha_phone_number', phoneNumber);
      localStorage.setItem('aasha_country_code', countryCode);

      // Determine user type based on registration_type
      const userType = profileData.registration_type === 'loved-one' ? 'family' : 'elderly';

      onLoginSuccess(userType);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Login to AASHA</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <p className="text-gray-600 mb-6">
                  Enter your phone number to login to your account.
                </p>

                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-24 px-3 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F35E4A] focus:border-transparent transition-all"
                  >
                    <option value="+1">+1</option>
                    <option value="+91">+91</option>
                  </select>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="4086257375"
                    required
                    maxLength={10}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F35E4A] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || phoneNumber.length !== 10}
                className="w-full bg-[#F35E4A] text-white py-4 rounded-lg font-semibold hover:bg-[#e54d37] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <p className="text-gray-600 mb-6">
                  Enter the OTP sent to {countryCode} {phoneNumber}
                </p>

                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F35E4A] focus:border-transparent transition-all text-center text-2xl tracking-widest"
                  autoFocus
                />
                <p className="text-sm text-gray-500 mt-2 text-center">
                  For demo purposes, enter any 6-digit code
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-[#F35E4A] text-white py-4 rounded-lg font-semibold hover:bg-[#e54d37] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      Login
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setError('');
                  }}
                  className="w-full text-gray-600 py-2 text-sm hover:text-gray-900 transition-colors"
                >
                  Change phone number
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
