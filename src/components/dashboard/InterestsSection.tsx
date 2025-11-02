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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [interestToDelete, setInterestToDelete] = useState<{id: string, name: string} | null>(null);
  const [pendingInterests, setPendingInterests] = useState<string[]>([]);
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

  const handleToggleInterest = (interestId: string) => {
    setPendingInterests((prev) => {
      if (prev.includes(interestId)) {
        return prev.filter((id) => id !== interestId);
      } else {
        return [...prev, interestId];
      }
    });
  };

  const handleAddSelectedInterests = async () => {
    if (pendingInterests.length === 0) {
      alert('Please select at least one interest to add');
      return;
    }

    try {
      setLoading(true);
      for (const interestId of pendingInterests) {
        await addInterest(elderlyProfile.id, interestId);
      }
      await loadInterests();
      setPendingInterests([]);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding interests:', error);
      alert('Failed to add interests');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (interestRecordId: string, interestName: string) => {
    setInterestToDelete({ id: interestRecordId, name: interestName });
    setShowDeleteModal(true);
  };

  const handleRemoveInterest = async () => {
    if (!interestToDelete) return;
    try {
      setLoading(true);
      await deleteInterest(interestToDelete.id);
      await loadInterests();
      setShowDeleteModal(false);
      setInterestToDelete(null);
    } catch (error) {
      console.error('Error removing interest:', error);
      alert('Failed to remove interest');
    } finally {
      setLoading(false);
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
                    onClick={() => openDeleteModal(interest.id, info.label)}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && interestToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 rounded-full p-4 mb-4">
                <X className="h-12 w-12 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Remove Interest?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove <span className="font-semibold">{interestToDelete.name}</span> from your interests?
              </p>
              <div className="flex gap-4 w-full">
                <button
                  onClick={handleRemoveInterest}
                  disabled={loading}
                  className="flex-1 bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {loading ? 'Removing...' : 'Remove'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setInterestToDelete(null);
                  }}
                  className="flex-1 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
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
                const isAlreadyAdded = selectedInterests.some((i) => i.interest === interest.id);
                const isChecked = pendingInterests.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    onClick={() => !isAlreadyAdded && handleToggleInterest(interest.id)}
                    disabled={isAlreadyAdded}
                    className={`bg-white rounded-xl shadow-md p-6 border-2 transition-all relative ${
                      isAlreadyAdded
                        ? 'border-gray-300 opacity-50 cursor-not-allowed'
                        : isChecked
                        ? 'border-[#F35E4A] bg-[#F35E4A] bg-opacity-5'
                        : 'border-gray-200 hover:border-[#F35E4A] hover:shadow-lg cursor-pointer'
                    }`}
                  >
                    {!isAlreadyAdded && isChecked && (
                      <div className="absolute top-2 right-2 bg-[#F35E4A] text-white rounded-full h-6 w-6 flex items-center justify-center">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="flex flex-col items-center text-center">
                      <div
                        className={`rounded-full p-4 mb-3 ${
                          isAlreadyAdded ? 'bg-gray-100' : 'bg-[#F35E4A] bg-opacity-10'
                        }`}
                      >
                        <Icon className={`h-8 w-8 ${isAlreadyAdded ? 'text-gray-400' : 'text-[#F35E4A]'}`} />
                      </div>
                      <p className={`font-semibold ${isAlreadyAdded ? 'text-gray-400' : 'text-gray-900'}`}>
                        {interest.label}
                      </p>
                      {isAlreadyAdded && <p className="text-xs text-gray-500 mt-1">Already added</p>}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={handleAddSelectedInterests}
                disabled={pendingInterests.length === 0 || loading}
                className="flex-1 bg-[#F35E4A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e54d37] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : `Done (${pendingInterests.length} selected)`}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setPendingInterests([]);
                }}
                className="flex-1 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterestsSection;
