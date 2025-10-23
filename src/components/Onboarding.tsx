import React, { useState } from 'react';
import { X, User, Users } from 'lucide-react';
import PhoneStep from './onboarding/PhoneStep';
import OTPStep from './onboarding/OTPStep';
import ProfileStep from './onboarding/ProfileStep';
import FamilyProfileStep from './onboarding/FamilyProfileStep';
import LovedOneProfileStep from './onboarding/LovedOneProfileStep';
import LovedOnePhoneStep from './onboarding/LovedOnePhoneStep';
import LovedOneOTPStep from './onboarding/LovedOneOTPStep';
import CallTimeStep from './onboarding/CallTimeStep';
import MedicationStep from './onboarding/MedicationStep';
import InterestsStep from './onboarding/InterestsStep';
import ThankYouStep from './onboarding/ThankYouStep';

interface OnboardingProps {
  onClose: () => void;
  onOpenLogin?: () => void;
}

export interface OnboardingData {
  registrationType: 'myself' | 'loved-one' | null;
  phoneNumber: string;
  countryCode: string;
  otp: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  language?: string;
  maritalStatus?: string;
  relationship?: string;
  lovedOneFirstName?: string;
  lovedOneLastName?: string;
  lovedOneDateOfBirth?: string;
  lovedOneGender?: string;
  lovedOneLanguage?: string;
  lovedOneMaritalStatus?: string;
  lovedOneTelegramUsername?: string;
  lovedOnePhoneNumber?: string;
  lovedOneCountryCode?: string;
  lovedOneOtp?: string;
  lovedOnePhoneVerified?: boolean;
  callTime: string;
  customTimeRange?: { start: string; end: string };
  medications: Array<{
    name: string;
    dosage_quantity: number;
    times_of_day: string[];
  }>;
  interests: string[];
}

const Onboarding: React.FC<OnboardingProps> = ({ onClose, onOpenLogin }) => {
  const handleOpenLogin = () => {
    onClose();
    setTimeout(() => {
      if (onOpenLogin) {
        onOpenLogin();
      }
    }, 100);
  };
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [data, setData] = useState<OnboardingData>({
    registrationType: null,
    phoneNumber: '',
    countryCode: '+1',
    otp: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    language: 'English',
    maritalStatus: '',
    relationship: '',
    lovedOneFirstName: '',
    lovedOneLastName: '',
    lovedOneDateOfBirth: '',
    lovedOneGender: '',
    lovedOneLanguage: 'English',
    lovedOneMaritalStatus: '',
    lovedOnePhoneNumber: '',
    lovedOneCountryCode: '+1',
    lovedOneOtp: '',
    callTime: '',
    medications: [],
    interests: [],
  });

  const updateData = (newData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const getTotalSteps = () => {
    if (data.registrationType === 'loved-one') {
      return data.lovedOnePhoneVerified ? 8 : 9;
    }
    return 8;
  };

  const totalSteps = getTotalSteps();
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const renderStep = () => {
    const isLovedOne = data.registrationType === 'loved-one';

    switch (currentStep) {
      case 0:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
              Who are you registering for?
            </h2>
            <p className="text-gray-600 mb-12 text-center max-w-md">
              Help us personalize your experience
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
              <button
                onClick={() => {
                  updateData({ registrationType: 'myself' });
                  nextStep();
                }}
                className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-[#F35E4A] hover:shadow-lg transition-all group"
              >
                <div className="flex flex-col items-center">
                  <div className="bg-[#F35E4A] rounded-full p-6 mb-4 group-hover:scale-110 transition-transform">
                    <User className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Myself</h3>
                  <p className="text-gray-600 text-center">
                    I want to use Aasha for myself
                  </p>
                </div>
              </button>
              <button
                onClick={() => {
                  updateData({ registrationType: 'loved-one' });
                  nextStep();
                }}
                className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-[#F35E4A] hover:shadow-lg transition-all group"
              >
                <div className="flex flex-col items-center">
                  <div className="bg-[#F35E4A] rounded-full p-6 mb-4 group-hover:scale-110 transition-transform">
                    <Users className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">A Loved One</h3>
                  <p className="text-gray-600 text-center">
                    I want to register for a family member
                  </p>
                </div>
              </button>
            </div>
          </div>
        );
      case 1:
        return <PhoneStep data={data} updateData={updateData} onNext={nextStep} onOpenLogin={handleOpenLogin} />;
      case 2:
        return <OTPStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
      case 3:
        if (isLovedOne) {
          return <FamilyProfileStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
        }
        return <ProfileStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
      case 4:
        if (isLovedOne) {
          return <LovedOneProfileStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
        }
        return <CallTimeStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
      case 5:
        if (isLovedOne) {
          return <LovedOnePhoneStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} onOpenLogin={handleOpenLogin} />;
        }
        return <MedicationStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
      case 6:
        if (isLovedOne) {
          if (data.lovedOnePhoneVerified) {
            return <CallTimeStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
          } else {
            return <LovedOneOTPStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
          }
        }
        return <InterestsStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
      case 7:
        if (isLovedOne) {
          if (data.lovedOnePhoneVerified) {
            return <MedicationStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
          } else {
            return <CallTimeStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
          }
        }
        return <ThankYouStep data={data} onClose={onClose} />;
      case 8:
        if (isLovedOne) {
          if (data.lovedOnePhoneVerified) {
            return <InterestsStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
          } else {
            return <MedicationStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
          }
        }
        return null;
      case 9:
        if (isLovedOne) {
          if (data.lovedOnePhoneVerified) {
            return <ThankYouStep data={data} onClose={onClose} />;
          } else {
            return <InterestsStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
          }
        }
        return null;
      case 10:
        if (isLovedOne) {
          return <ThankYouStep data={data} onClose={onClose} />;
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#F4F2EE] rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative">
        {currentStep > 0 && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-20 bg-white rounded-full p-2 shadow-md"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {currentStep === 0 && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
          >
            <X className="h-6 w-6" />
          </button>
        )}

        {currentStep > 0 && (
          <div className="sticky top-0 bg-[#F4F2EE] pt-8 pb-4 px-8 z-10">
            <div className="flex gap-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className="h-2 flex-1 rounded-full overflow-hidden bg-gray-300"
                >
                  <div
                    className={`h-full transition-all duration-300 ${
                      index < currentStep ? 'bg-[#F35E4A]' : 'bg-gray-300'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-8">{renderStep()}</div>
      </div>
    </div>
  );
};

export default Onboarding;
