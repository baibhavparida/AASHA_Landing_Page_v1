import React, { useState } from 'react';
import { OnboardingData } from '../Onboarding';
import { validateDate, isValidDateInPast } from '../../utils/validation';

interface ProfileStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const ProfileStep: React.FC<ProfileStepProps> = ({ data, updateData, onNext, onBack }) => {
  const [formData, setFormData] = useState({
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    language: data.language,
    maritalStatus: data.maritalStatus,
    telegramUsername: data.telegramUsername || '',
  });

  const [dateError, setDateError] = useState<string>('');
  const [dateParts, setDateParts] = useState(() => {
    if (data.dateOfBirth) {
      const [year, month, day] = data.dateOfBirth.split('-');
      return { month, day, year };
    }
    return { month: '', day: '', year: '' };
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDatePartChange = (part: 'month' | 'day' | 'year', value: string) => {
    const numericValue = value.replace(/\D/g, '');

    let limitedValue = numericValue;
    if (part === 'month') {
      limitedValue = numericValue.slice(0, 2);
      const monthNum = parseInt(limitedValue);
      if (monthNum > 12) limitedValue = '12';
      if (monthNum < 1 && limitedValue.length === 2) limitedValue = '01';
    } else if (part === 'day') {
      limitedValue = numericValue.slice(0, 2);
      const dayNum = parseInt(limitedValue);
      if (dayNum > 31) limitedValue = '31';
      if (dayNum < 1 && limitedValue.length === 2) limitedValue = '01';
    } else if (part === 'year') {
      limitedValue = numericValue.slice(0, 4);
      const currentYear = new Date().getFullYear();
      if (limitedValue.length === 4 && parseInt(limitedValue) > currentYear) {
        limitedValue = currentYear.toString();
      }
    }

    const newDateParts = { ...dateParts, [part]: limitedValue };
    setDateParts(newDateParts);
    setDateError('');

    if (newDateParts.month && newDateParts.day && newDateParts.year.length === 4) {
      const dateString = `${newDateParts.year}-${newDateParts.month.padStart(2, '0')}-${newDateParts.day.padStart(2, '0')}`;

      if (!validateDate(dateString)) {
        setDateError('Please enter a valid date');
        setFormData(prev => ({ ...prev, dateOfBirth: '' }));
      } else if (!isValidDateInPast(dateString)) {
        setDateError('Date of birth must be in the past');
        setFormData(prev => ({ ...prev, dateOfBirth: '' }));
      } else {
        setFormData(prev => ({ ...prev, dateOfBirth: dateString }));
      }
    } else {
      setFormData(prev => ({ ...prev, dateOfBirth: '' }));
    }
  };

  const handleSubmit = () => {
    if (!formData.dateOfBirth || !validateDate(formData.dateOfBirth)) {
      setDateError('Please enter a valid date');
      return;
    }

    if (!isValidDateInPast(formData.dateOfBirth)) {
      setDateError('Date of birth must be in the past');
      return;
    }

    if (
      formData.firstName &&
      formData.lastName &&
      formData.dateOfBirth &&
      formData.gender &&
      formData.language &&
      formData.maritalStatus &&
      formData.telegramUsername
    ) {
      updateData(formData);
      onNext();
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
        Tell us about yourself
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">First name</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            placeholder="Baibhav"
            className="w-full px-6 py-4 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-[#F35E4A]"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Last name</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            placeholder="Test"
            className="w-full px-6 py-4 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-[#F35E4A]"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Date of birth</label>
          <div className="flex gap-3">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="MM"
              value={dateParts.month}
              onChange={(e) => handleDatePartChange('month', e.target.value)}
              onPaste={(e) => e.preventDefault()}
              maxLength={2}
              className={`w-20 px-4 py-4 border-2 rounded-lg text-lg text-center focus:outline-none ${
                dateError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#F35E4A]'
              }`}
            />
            <span className="text-2xl text-gray-400 self-center">/</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="DD"
              value={dateParts.day}
              onChange={(e) => handleDatePartChange('day', e.target.value)}
              onPaste={(e) => e.preventDefault()}
              maxLength={2}
              className={`w-20 px-4 py-4 border-2 rounded-lg text-lg text-center focus:outline-none ${
                dateError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#F35E4A]'
              }`}
            />
            <span className="text-2xl text-gray-400 self-center">/</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="YYYY"
              value={dateParts.year}
              onChange={(e) => handleDatePartChange('year', e.target.value)}
              onPaste={(e) => e.preventDefault()}
              maxLength={4}
              className={`w-28 px-4 py-4 border-2 rounded-lg text-lg text-center focus:outline-none ${
                dateError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#F35E4A]'
              }`}
            />
          </div>
          {dateError && (
            <p className="text-red-500 text-sm mt-1">{dateError}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Gender</label>
          <select
            value={formData.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
            className="w-full px-6 py-4 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-[#F35E4A] bg-white"
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Language</label>
          <select
            value={formData.language}
            onChange={(e) => handleChange('language', e.target.value)}
            className="w-full px-6 py-4 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-[#F35E4A] bg-white"
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Marital status</label>
          <select
            value={formData.maritalStatus}
            onChange={(e) => handleChange('maritalStatus', e.target.value)}
            className="w-full px-6 py-4 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-[#F35E4A] bg-white"
          >
            <option value="">Select</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Widowed">Widowed</option>
            <option value="Divorced">Divorced</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Telegram Username</label>
          <input
            type="text"
            value={formData.telegramUsername}
            onChange={(e) => handleChange('telegramUsername', e.target.value)}
            placeholder="@username"
            className="w-full px-6 py-4 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-[#F35E4A]"
          />
        </div>
      </div>

      <div className="flex justify-between mt-12">
        <button
          onClick={onBack}
          className="px-8 py-3 border-2 border-[#F35E4A] text-[#F35E4A] rounded-lg text-lg font-semibold hover:bg-[#F35E4A] hover:text-white transition-all"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={
            !formData.firstName ||
            !formData.lastName ||
            !formData.dateOfBirth ||
            !formData.gender ||
            !formData.maritalStatus ||
            !formData.telegramUsername
          }
          className="px-8 py-3 bg-[#F35E4A] text-white rounded-lg text-lg font-semibold hover:bg-[#e54d37] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default ProfileStep;
