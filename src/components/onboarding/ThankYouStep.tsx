import React, { useEffect, useState } from 'react';
import { CheckCircle, Phone, Mail, Loader2, Bell, MessageCircle } from 'lucide-react';
import { OnboardingData } from '../Onboarding';
import { saveOnboardingData } from '../../services/onboardingService';

interface ThankYouStepProps {
  data: OnboardingData;
  onClose: () => void;
}

const ThankYouStep: React.FC<ThankYouStepProps> = ({ data, onClose }) => {
  const [saving, setSaving] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saveData = async () => {
      try {
        setSaving(true);
        setError(null);
        await saveOnboardingData(data);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSaving(false);
      } catch (err: any) {
        console.error('Failed to save onboarding data:', err);
        let errorMessage = 'Failed to save your information. Please try again.';

        if (err?.message) {
          if (err.message.includes('date')) {
            errorMessage = 'There was an issue with the date of birth information. Please go back and ensure all dates are entered correctly.';
          } else if (err.message.includes('validation')) {
            errorMessage = 'Some required information is missing or invalid. Please review your entries and try again.';
          } else if (err.message.includes('already registered')) {
            errorMessage = 'This phone number is already registered. Please use a different number or contact support.';
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        setSaving(false);
      }
    };

    saveData();
  }, []);

  if (saving) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <div className="mb-8 flex justify-center">
          <Loader2 className="h-20 w-20 text-[#F35E4A] animate-spin" />
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Saving Your Information...
        </h2>
        <p className="text-xl text-gray-600">
          Please wait while we set up your account.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <div className="mb-8 flex justify-center">
          <div className="bg-red-500 rounded-full p-6">
            <CheckCircle className="h-20 w-20 text-white" />
          </div>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Something Went Wrong
        </h2>
        <p className="text-xl text-red-600 mb-8">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#F35E4A] text-white px-12 py-4 rounded-lg text-lg font-semibold hover:bg-[#e54d37] transition-all shadow-lg"
        >
          Try Again
        </button>
      </div>
    );
  }
  const isElderlyUser = data.registrationType === 'myself';
  const lovedOneName = data.lovedOneFirstName || 'your loved one';

  return (
    <div className="max-w-3xl mx-auto text-center py-12">
      <div className="mb-8 flex justify-center">
        <div className="bg-[#F35E4A] rounded-full p-6">
          <CheckCircle className="h-20 w-20 text-white" />
        </div>
      </div>

      <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        Thank you for registering!
      </h2>
      <p className="text-xl text-gray-600 mb-8">
        {isElderlyUser
          ? `We're excited to be your companion, ${data.firstName}!`
          : `You've successfully set up Aasha for ${lovedOneName}.`
        }
      </p>

      <div className="bg-gradient-to-br from-[#F35E4A] to-[#e54d37] rounded-2xl p-8 mb-8 text-white">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Phone className="h-8 w-8" />
          <h3 className="text-2xl font-bold">
            {isElderlyUser ? 'You will receive a call from Aasha within the next 2 mins!' : `${lovedOneName} will receive a call from Aasha within the next 2 mins!`}
          </h3>
        </div>
        <p className="text-lg text-white/90">
          Please keep your phone nearby and answer when Aasha calls.
        </p>
      </div>

      <a
        href="https://t.me/aashabpbot?start=start"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center space-x-3 bg-[#0088cc] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#0077b3] transition-all shadow-lg mb-8"
      >
        <MessageCircle className="h-6 w-6" />
        <span>Connect with Aasha on Telegram</span>
      </a>

      {!isElderlyUser && (
        <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 mb-8 text-left">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">What happens next?</h3>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-[#F35E4A] rounded-full p-2 mt-1">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Access your family dashboard
                </h4>
                <p className="text-gray-600">
                  Monitor conversations, manage medications, share content, and stay connected with {lovedOneName}.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-[#F35E4A] rounded-full p-2 mt-1">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Receive alerts and updates
                </h4>
                <p className="text-gray-600">
                  Get notified about important moments and insights from conversations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#F35E4A]/10 rounded-2xl p-6 mb-8">
        <p className="text-gray-700">
          <strong>Need help getting started?</strong> Our support team is available 24/7 at{' '}
          <a href="mailto:hello@aasha.com" className="text-[#F35E4A] hover:underline">
            hello@aasha.com
          </a>{' '}
          or call{' '}
          <a href="tel:1-800-AASHA-1" className="text-[#F35E4A] hover:underline">
            1-800-AASHA-1
          </a>
        </p>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="bg-[#F35E4A] text-white px-12 py-4 rounded-lg text-lg font-semibold hover:bg-[#e54d37] transition-all shadow-lg"
      >
        Go to Your Dashboard
      </button>
    </div>
  );
};

export default ThankYouStep;
