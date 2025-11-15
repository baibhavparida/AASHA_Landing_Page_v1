import React, { useState } from 'react';
import {
  BookOpen,
  Music,
  Utensils,
  Plane,
  Camera,
  Palette,
  Sprout,
  Newspaper,
  Heart,
  Sparkles,
  Film,
  Trophy,
  Loader2,
} from 'lucide-react';
import { OnboardingData } from '../Onboarding';
import { saveOnboardingData } from '../../services/onboardingService';

interface InterestsStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const InterestsStep: React.FC<InterestsStepProps> = ({ data, updateData, onNext, onBack }) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(data.interests || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const interests = [
    { id: 'reading', label: 'Reading', icon: BookOpen },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'cooking', label: 'Cooking', icon: Utensils },
    { id: 'travel', label: 'Travel', icon: Plane },
    { id: 'photography', label: 'Photography', icon: Camera },
    { id: 'art-crafts', label: 'Art & Crafts', icon: Palette },
    { id: 'gardening', label: 'Gardening', icon: Sprout },
    { id: 'news', label: 'News & Current Affairs', icon: Newspaper },
    { id: 'health', label: 'Health & Wellness', icon: Heart },
    { id: 'devotional', label: 'Devotional', icon: Sparkles },
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'sports', label: 'Sports', icon: Trophy },
  ];

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      } else {
        if (prev.length >= 3) {
          alert('You can only select up to 3 interests');
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);
      updateData({ interests: selectedInterests });
      const finalData = { ...data, interests: selectedInterests };
      const result = await saveOnboardingData(finalData);

      if (result && result.profileId) {
        localStorage.setItem('aasha_profile_id', result.profileId);
        localStorage.setItem('aasha_phone_number', data.phoneNumber);
        localStorage.setItem('aasha_country_code', data.countryCode);
      }

      onNext();
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

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        What interests you?
      </h2>
      <p className="text-gray-600 mb-8">
        Select up to 3 topics you enjoy discussing with Aasha.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {interests.map((interest) => {
          const Icon = interest.icon;
          const isSelected = selectedInterests.includes(interest.id);
          return (
            <button
              key={interest.id}
              onClick={() => toggleInterest(interest.id)}
              className={`p-6 rounded-2xl border-2 transition-all ${
                isSelected
                  ? 'border-[#F35E4A] bg-[#F35E4A] text-white shadow-lg'
                  : 'border-gray-200 bg-white text-gray-900 hover:border-[#F35E4A]'
              }`}
            >
              <div className="flex flex-col items-center">
                <Icon className="h-8 w-8 mb-3" />
                <span className="text-center font-semibold">{interest.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          disabled={saving}
          className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              try {
                setSaving(true);
                setError(null);
                updateData({ interests: [] });
                const finalData = { ...data, interests: [] };
                const result = await saveOnboardingData(finalData);

                if (result && result.profileId) {
                  localStorage.setItem('aasha_profile_id', result.profileId);
                  localStorage.setItem('aasha_phone_number', data.phoneNumber);
                  localStorage.setItem('aasha_country_code', data.countryCode);
                }

                onNext();
              } catch (err: any) {
                console.error('Failed to save onboarding data:', err);
                setError('Failed to save your information. Please try again.');
                setSaving(false);
              }
            }}
            disabled={saving}
            className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-8 py-3 bg-[#F35E4A] text-white rounded-lg text-lg font-semibold hover:bg-[#e54d37] transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2"
          >
            {saving && <Loader2 className="h-5 w-5 animate-spin" />}
            <span>{saving ? 'Saving...' : 'Continue'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterestsStep;
