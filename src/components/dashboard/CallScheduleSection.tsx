import React, { useState } from 'react';
import { Clock, Sun, Sunset, Moon, Save } from 'lucide-react';
import { updateElderlyProfile } from '../../services/dashboardService';

interface CallScheduleSectionProps {
  elderlyProfile: {
    id: string;
    call_time_preference: string;
  };
  onUpdate: () => void;
}

const CallScheduleSection: React.FC<CallScheduleSectionProps> = ({ elderlyProfile, onUpdate }) => {
  const [selectedTime, setSelectedTime] = useState(elderlyProfile.call_time_preference);
  const [loading, setLoading] = useState(false);

  const timeOptions = [
    {
      id: 'morning',
      label: 'Morning',
      time: '6:00 AM - 12:00 PM',
      icon: Sun,
      description: 'Perfect for starting your day with a friendly chat',
      gradient: 'from-yellow-400 to-orange-400',
    },
    {
      id: 'afternoon',
      label: 'Afternoon',
      time: '12:00 PM - 5:00 PM',
      icon: Sun,
      description: 'Great for a midday conversation break',
      gradient: 'from-orange-400 to-red-400',
    },
    {
      id: 'evening',
      label: 'Evening',
      time: '5:00 PM - 9:00 PM',
      icon: Moon,
      description: 'Wind down your day with a relaxing talk',
      gradient: 'from-indigo-400 to-purple-400',
    },
  ];

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateElderlyProfile(elderlyProfile.id, {
        call_time_preference: selectedTime,
      });
      await onUpdate();
      alert('Call schedule updated successfully!');
    } catch (error) {
      console.error('Error updating call schedule:', error);
      alert('Failed to update call schedule');
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = selectedTime !== elderlyProfile.call_time_preference;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <h2 className="text-3xl font-bold text-gray-900">Call Schedule</h2>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Call Schedule Preferences</h3>
        <p className="text-gray-600">
          Choose when you'd like Aasha to call you. You can change this anytime.
        </p>
      </div>

      {/* Current Schedule */}
      <div className="bg-gradient-to-r from-[#F35E4A] to-[#e54d37] rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-center mb-4">
          <Clock className="h-8 w-8 mr-3" />
          <h3 className="text-2xl font-bold">Current Preference</h3>
        </div>
        <p className="text-xl opacity-90">
          {timeOptions.find((opt) => opt.id === elderlyProfile.call_time_preference)?.label || 'Not set'}
        </p>
        <p className="text-lg opacity-75 mt-1">
          {timeOptions.find((opt) => opt.id === elderlyProfile.call_time_preference)?.time || ''}
        </p>
      </div>

      {/* Time Options */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-6">Select Your Preferred Time</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {timeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedTime === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setSelectedTime(option.id)}
                className={`relative bg-white rounded-2xl shadow-md p-6 text-left transition-all ${
                  isSelected
                    ? 'ring-4 ring-[#F35E4A] border-2 border-[#F35E4A]'
                    : 'border-2 border-gray-200 hover:border-[#F35E4A]'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 bg-[#F35E4A] rounded-full p-1">
                    <svg
                      className="h-4 w-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                <div className={`bg-gradient-to-r ${option.gradient} rounded-xl p-4 mb-4 inline-block`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{option.label}</h4>
                <p className="text-sm text-[#F35E4A] font-semibold mb-2">{option.time}</p>
                <p className="text-sm text-gray-600">{option.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">You have unsaved changes</p>
            <p className="text-sm text-gray-600">Click save to update your call schedule</p>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center bg-[#F35E4A] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#e54d37] transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-6">
        <h4 className="font-semibold text-blue-900 mb-2">How It Works</h4>
        <ul className="text-blue-800 space-y-2 text-sm">
          <li>• Aasha will call you during your preferred time window</li>
          <li>• Calls are scheduled automatically based on your preference</li>
          <li>• You can update your preference anytime</li>
          <li>• All calls are friendly, supportive conversations</li>
        </ul>
      </div>
    </div>
  );
};

export default CallScheduleSection;
