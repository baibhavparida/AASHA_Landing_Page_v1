import React from 'react';
import { CheckCircle, Phone, MessageCircle } from 'lucide-react';
import { OnboardingData } from '../Onboarding';

interface ThankYouStepProps {
  data: OnboardingData;
  onClose: () => void;
}

const ThankYouStep: React.FC<ThankYouStepProps> = ({ data, onClose }) => {
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

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href="https://t.me/aashabpbot?start=start"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center space-x-3 bg-[#0088cc] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#0077b3] transition-all shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
          <span>Connect on Telegram</span>
        </a>

        <button
          onClick={onClose}
          className="inline-flex items-center justify-center bg-[#F35E4A] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#e54d37] transition-all shadow-lg"
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ThankYouStep;
