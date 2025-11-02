import React, { useState } from 'react';
import { User, Phone, Calendar, Globe, Heart, Edit2, Save, X } from 'lucide-react';
import { updateElderlyProfile } from '../../services/dashboardService';

interface ProfileSectionProps {
  elderlyProfile: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    country_code: string;
    date_of_birth: string;
    gender: string;
    language: string;
    marital_status: string;
    created_at: string;
  };
  onUpdate: () => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ elderlyProfile, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: elderlyProfile.first_name,
    last_name: elderlyProfile.last_name,
    date_of_birth: elderlyProfile.date_of_birth,
    gender: elderlyProfile.gender,
    language: elderlyProfile.language,
    marital_status: elderlyProfile.marital_status,
  });

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateElderlyProfile(elderlyProfile.id, formData);
      await onUpdate();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: elderlyProfile.first_name,
      last_name: elderlyProfile.last_name,
      date_of_birth: elderlyProfile.date_of_birth,
      gender: elderlyProfile.gender,
      language: elderlyProfile.language,
      marital_status: elderlyProfile.marital_status,
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <h2 className="text-3xl font-bold text-gray-900">Loved One Profile</h2>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start">
          <div className="h-32 w-32 rounded-full bg-gray-100 shadow-lg flex items-center justify-center">
            <User className="h-16 w-16 text-[#F35E4A]" />
          </div>
          <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left flex-1">
            <h2 className="text-3xl font-bold text-gray-900">
              {elderlyProfile.first_name} {elderlyProfile.last_name}
            </h2>
            <p className="text-lg text-gray-600 mt-1">
              {calculateAge(elderlyProfile.date_of_birth)} years old
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-4 md:mt-0 flex items-center bg-[#F35E4A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e54d37] transition-all"
            >
              <Edit2 className="h-5 w-5 mr-2" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Profile Details */}
      {isEditing ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#F35E4A] focus:outline-none text-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#F35E4A] focus:outline-none text-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#F35E4A] focus:outline-none text-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#F35E4A] focus:outline-none text-lg"
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#F35E4A] focus:outline-none text-lg"
                required
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Marital Status
              </label>
              <select
                value={formData.marital_status}
                onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#F35E4A] focus:outline-none text-lg"
                required
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Divorced">Divorced</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-8">
            <button
              type="submit"
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
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all"
            >
              <X className="h-5 w-5 mr-2" />
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-2xl shadow-md p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4">
              <User className="h-6 w-6 text-[#F35E4A] mt-1" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Full Name</p>
                <p className="text-lg font-semibold text-gray-900">
                  {elderlyProfile.first_name} {elderlyProfile.last_name}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Phone className="h-6 w-6 text-[#F35E4A] mt-1" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                <p className="text-lg font-semibold text-gray-900">
                  {elderlyProfile.country_code} {elderlyProfile.phone_number}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Calendar className="h-6 w-6 text-[#F35E4A] mt-1" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Date of Birth</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(elderlyProfile.date_of_birth).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <User className="h-6 w-6 text-[#F35E4A] mt-1" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Gender</p>
                <p className="text-lg font-semibold text-gray-900">{elderlyProfile.gender}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Globe className="h-6 w-6 text-[#F35E4A] mt-1" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Preferred Language</p>
                <p className="text-lg font-semibold text-gray-900">{elderlyProfile.language}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Heart className="h-6 w-6 text-[#F35E4A] mt-1" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Marital Status</p>
                <p className="text-lg font-semibold text-gray-900">{elderlyProfile.marital_status}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Member since{' '}
              {new Date(elderlyProfile.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSection;
