import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface WaitlistModalProps {
  onClose: () => void;
}

const COUNTRY_PHONE_LIMITS: Record<string, { maxDigits: number; name: string }> = {
  '+1': { maxDigits: 10, name: 'US/Canada' },
  '+44': { maxDigits: 10, name: 'UK' },
  '+91': { maxDigits: 10, name: 'India' },
  '+86': { maxDigits: 11, name: 'China' },
  '+81': { maxDigits: 10, name: 'Japan' },
  '+49': { maxDigits: 11, name: 'Germany' },
  '+33': { maxDigits: 9, name: 'France' },
  '+39': { maxDigits: 10, name: 'Italy' },
  '+34': { maxDigits: 9, name: 'Spain' },
  '+61': { maxDigits: 9, name: 'Australia' },
  '+971': { maxDigits: 9, name: 'UAE' },
  '+65': { maxDigits: 8, name: 'Singapore' },
  '+52': { maxDigits: 10, name: 'Mexico' },
  '+55': { maxDigits: 11, name: 'Brazil' },
  '+7': { maxDigits: 10, name: 'Russia' },
};

export default function WaitlistModal({ onClose }: WaitlistModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    countryCode: '+1',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const requiredDigits = COUNTRY_PHONE_LIMITS[formData.countryCode]?.maxDigits || 15;
    if (formData.phone.length !== requiredDigits) {
      setError(`Please enter a valid ${requiredDigits}-digit phone number for ${COUNTRY_PHONE_LIMITS[formData.countryCode]?.name || 'this country'}.`);
      return;
    }

    setLoading(true);

    try {
      const fullPhone = `${formData.countryCode}${formData.phone}`;

      const { data: existingEntries, error: checkError } = await supabase
        .from('waitlist')
        .select('*')
        .or(`phone.eq.${fullPhone},email.eq.${formData.email}`);

      if (checkError) {
        console.error('Check error:', checkError);
        throw checkError;
      }

      if (existingEntries && existingEntries.length > 0) {
        setError('You are already registered for the waitlist!');
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('waitlist')
        .insert([
          {
            full_name: formData.fullName,
            phone: fullPhone,
            email: formData.email
          }
        ]);

      if (insertError) {
        console.error('Insert error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        throw insertError;
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error joining waitlist:', err);
      setError('Failed to join waitlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      const maxDigits = COUNTRY_PHONE_LIMITS[formData.countryCode]?.maxDigits || 15;

      if (digitsOnly.length <= maxDigits) {
        setFormData(prev => ({
          ...prev,
          [name]: digitsOnly
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You're on the list!</h2>
            <p className="text-gray-600">We'll be in touch soon.</p>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Join the Waitlist</h2>
            <p className="text-gray-600 mb-6">Be among the first to experience Aasha.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#F35E4A] focus:border-transparent outline-none transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Phone *
                </label>
                <div className="flex gap-2">
                  <select
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleChange}
                    className="w-24 px-2 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#F35E4A] focus:border-transparent outline-none transition-all bg-white"
                  >
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                    <option value="+91">+91</option>
                    <option value="+86">+86</option>
                    <option value="+81">+81</option>
                    <option value="+49">+49</option>
                    <option value="+33">+33</option>
                    <option value="+39">+39</option>
                    <option value="+34">+34</option>
                    <option value="+61">+61</option>
                    <option value="+971">+971</option>
                    <option value="+65">+65</option>
                    <option value="+52">+52</option>
                    <option value="+55">+55</option>
                    <option value="+7">+7</option>
                  </select>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    maxLength={COUNTRY_PHONE_LIMITS[formData.countryCode]?.maxDigits || 15}
                    className={`flex-1 px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#F35E4A] focus:border-transparent outline-none transition-all ${
                      formData.phone.length > 0 && formData.phone.length !== COUNTRY_PHONE_LIMITS[formData.countryCode]?.maxDigits
                        ? 'border-red-300'
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter your phone number"
                  />
                </div>
                <p className={`text-xs mt-1 ${
                  formData.phone.length === 0
                    ? 'text-gray-500'
                    : formData.phone.length === COUNTRY_PHONE_LIMITS[formData.countryCode]?.maxDigits
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {formData.phone.length}/{COUNTRY_PHONE_LIMITS[formData.countryCode]?.maxDigits || 15} digits
                  {formData.phone.length > 0 && formData.phone.length !== COUNTRY_PHONE_LIMITS[formData.countryCode]?.maxDigits &&
                    ' (required)'}
                </p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#F35E4A] focus:border-transparent outline-none transition-all"
                  placeholder="Enter your email"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#F35E4A] text-white py-3 rounded-lg font-semibold hover:bg-[#e54d37] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? 'Joining...' : 'Join Waitlist'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
