import React, { useState, useEffect } from 'react';
import {
  Heart,
  BookOpen,
  Music,
  Coffee,
  Plane,
  Camera,
  Palette,
  Flower2,
  Newspaper,
  HeartPulse,
  Church,
  Film,
  Trophy,
  Plus,
  X,
} from 'lucide-react';
import { getInterests, addInterest, deleteInterest } from '../../services/dashboardService';

interface InterestsSectionProps {
  elderlyProfile: {
    id: string;
  };
}

const InterestsSection: React.FC<InterestsSectionProps> = ({ elderlyProfile }) => {
  const [selectedInterests, setSelectedInterests] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const availableInterests = [
    { id: 'reading', label: 'Reading', icon: BookOpen },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'cooking', label: 'Cooking', icon: Coffee },
    { id: 'travel', label: 'Travel', icon: Plane },
    { id: 'photography', label: 'Photography', icon: Camera },
    { id: 'art-crafts', label: 'Art & Crafts', icon: Palette },
    { id: 'gardening', label: 'Gardening', icon: Flower2 },
    { id: 'news', label: 'News & Current Events', icon: Newspaper },
    { id: 'health', label: 'Health & Wellness', icon: HeartPulse },
    { id: 'devotional', label: 'Devotional & Spiritual', icon: Church },
    { id: 'movies', label: 'Movies & Entertainment', icon: Film },
    { id: 'sports', label: 'Sports', icon: Trophy },
  ];

  useEffect(() => {
    loadInterests();
  }, [elderlyProfile.id]);

  const loadInterests = async () => {
    try {
      setLoading(true);
      const data = await getInterests(elderlyProfile.id);
      setSelectedInterests(data);
    } catch (error) {
      console.error('Error loading interests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInterest = async (interestId: string) => {
    const alreadySelected = selectedInterests.some((i) => i.interest === interestId);
    if (alreadySelected) {
      alert('You have already added this interest');
      return;
    }

    try {
      await addInterest(elderlyProfile.id, interestId);
      await loadInterests();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding interest:', error);
      alert('Failed to add interest');
    }
  };

  const handleRemoveInterest = async (interestRecordId: string) => {
    if (!window.confirm('Are you sure you want to remove this interest?')) return;
    try {
      await deleteInterest(interestRecordId);
      await loadInterests();
    } catch (error) {
      console.error('Error removing interest:', error);
      alert('Failed to remove interest');
    }
  };

  const getInterestInfo = (interestId: string) => {
    return availableInterests.find((i) => i.id === interestId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#F35E4A]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center bg-[#F35E4A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e54d37] transition-all shadow-md"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Interest
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-6">
        <div className="flex items-start">
          <Heart className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">How Interests Help</h4>
            <p className="text-blue-800 text-sm">
              The interests you select help Aasha tailor conversations to topics you enjoy. The more interests you add,
              the more personalized and engaging your chats will be!
            </p>
          </div>
        </div>
      </div>

      {/* Selected Interests */}
      {selectedInterests.length > 0 ? (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-6">Your Selected Interests</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedInterests.map((interest) => {
              const info = getInterestInfo(interest.interest);
              if (!info) return null;
              const Icon = info.icon;
              return (
                <div
                  key={interest.id}
                  className="bg-white rounded-xl shadow-md p-6 border-2 border-[#F35E4A] relative group hover:shadow-lg transition-all"
                >
                  <button
                    onClick={() => handleRemoveInterest(interest.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-[#F35E4A] bg-opacity-10 rounded-full p-4 mb-3">
                      <Icon className="h-8 w-8 text-[#F35E4A]" />
                    </div>
                    <p className="font-semibold text-gray-900">{info.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md p-12 text-center">
          <Heart className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Interests Added Yet</h3>
          <p className="text-gray-600 mb-6">Start by adding your first interest to personalize your Aasha experience</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#F35E4A] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#e54d37] transition-all"
          >
            Add Your First Interest
          </button>
        </div>
      )}

      {/* Add Interest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Add New Interest</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availableInterests.map((interest) => {
                const Icon = interest.icon;
                const isSelected = selectedInterests.some((i) => i.interest === interest.id);
                return (
                  <button
                    key={interest.id}
                    onClick={() => !isSelected && handleAddInterest(interest.id)}
                    disabled={isSelected}
                    className={`bg-white rounded-xl shadow-md p-6 border-2 transition-all ${
                      isSelected
                        ? 'border-gray-300 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-[#F35E4A] hover:shadow-lg cursor-pointer'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div
                        className={`rounded-full p-4 mb-3 ${
                          isSelected ? 'bg-gray-100' : 'bg-[#F35E4A] bg-opacity-10'
                        }`}
                      >
                        <Icon className={`h-8 w-8 ${isSelected ? 'text-gray-400' : 'text-[#F35E4A]'}`} />
                      </div>
                      <p className={`font-semibold ${isSelected ? 'text-gray-400' : 'text-gray-900'}`}>
                        {interest.label}
                      </p>
                      {isSelected && <p className="text-xs text-gray-500 mt-1">Already added</p>}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8">
              <button
                onClick={() => setShowAddModal(false)}
                className="w-full border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterestsSection;
