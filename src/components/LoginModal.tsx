import React from 'react';
import { X, Phone, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (userType: 'elderly' | 'family') => void;
}

function generatePassword(phoneNumber: string): string {
  const hash = phoneNumber.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  return `aasha_${Math.abs(hash)}_${phoneNumber.slice(-4)}_temp_pw_2025`;
}

export default function LoginModal({ onClose, onLoginSuccess }: LoginModalProps) {
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [countryCode, setCountryCode] = React.useState('+91');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const fullPhone = `${countryCode}${phoneNumber}`;

      // Check if user exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, registration_type')
        .eq('phone_number', fullPhone)
        .maybeSingle();

      if (!profile) {
        setError('No account found with this phone number. Please sign up first.');
        setLoading(false);
        return;
      }

      // Generate password and sign in
      const password = generatePassword(phoneNumber);
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: `${fullPhone}@aasha-temp.com`,
        password: password,
      });

      if (signInError) throw signInError;

      if (!authData.user) {
        throw new Error('Login failed');
      }

      // Determine user type based on registration_type
      const userType = profile.registration_type === 'loved-one' ? 'family' : 'elderly';

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
          <form onSubmit={handleLogin} className="space-y-6">
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
                  Login
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
