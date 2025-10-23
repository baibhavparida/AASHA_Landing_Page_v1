import React, { useState } from 'react';
import { OnboardingData } from '../Onboarding';
import { validateDate, isValidDateInPast } from '../../utils/validation';

interface LovedOneProfileStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const LovedOneProfileStep: React.FC<LovedOneProfileStepProps> = ({ data, updateData, onNext, onBack }) => {
  const [formData, setFormData] = useState({
    lovedOneFirstName: data.lovedOneFirstName || '',
    lovedOneLastName: data.lovedOneLastName || '',
    lovedOneDateOfBirth: data.lovedOneDateOfBirth || '',
    lovedOneGender: data.lovedOneGender || '',
    lovedOneLanguage: data.lovedOneLanguage || 'English',
    lovedOneMaritalStatus: data.lovedOneMaritalStatus || '',
    lovedOneTelegramUsername: data.lovedOneTelegramUsername || '',
  });

  const [dateError, setDateError] = useState<string>('');
  const [dateParts, setDateParts] = useState(() => {
    if (data.lovedOneDateOfBirth) {
      const [year, month, day] = data.lovedOneDateOfBirth.split('-');
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
        setFormData(prev => ({ ...prev, lovedOneDateOfBirth: '' }));
      } else if (!isValidDateInPast(dateString)) {
        setDateError('Date of birth must be in the past');
        setFormData(prev => ({ ...prev, lovedOneDateOfBirth: '' }));
      } else {
        setFormData(prev => ({ ...prev, lovedOneDateOfBirth: dateString }));
      }
    } else {
      setFormData(prev => ({ ...prev, lovedOneDateOfBirth: '' }));
    }
  };

  const handleSubmit = () => {
    if (!formData.lovedOneDateOfBirth || !validateDate(formData.lovedOneDateOfBirth)) {
      setDateError('Please enter a valid date');
      return;
    }

    if (!isValidDateInPast(formData.lovedOneDateOfBirth)) {
      setDateError('Date of birth must be in the past');
      return;
    }

    if (
      formData.lovedOneFirstName &&
      formData.lovedOneLastName &&
      formData.lovedOneDateOfBirth &&
      formData.lovedOneGender &&
      formData.lovedOneLanguage &&
      formData.lovedOneMaritalStatus &&
      formData.lovedOneTelegramUsername
    ) {
      updateData(formData);
      onNext();
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
        Tell us about your loved one
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">First name</label>
          <input
            type="text"
            value={formData.lovedOneFirstName}
            onChange={(e) => handleChange('lovedOneFirstName', e.target.value)}
            placeholder="First name"
            className="w-full px-6 py-4 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-[#F35E4A]"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Last name</label>
          <input
            type="text"
            value={formData.lovedOneLastName}
            onChange={(e) => handleChange('lovedOneLastName', e.target.value)}
            placeholder="Last name"
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
            value={formData.lovedOneGender}
            onChange={(e) => handleChange('lovedOneGender', e.target.value)}
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
            value={formData.lovedOneLanguage}
            onChange={(e) => handleChange('lovedOneLanguage', e.target.value)}
            className="w-full px-6 py-4 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-[#F35E4A] bg-white"
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Marital status</label>
          <select
            value={formData.lovedOneMaritalStatus}
            onChange={(e) => handleChange('lovedOneMaritalStatus', e.target.value)}
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
            value={formData.lovedOneTelegramUsername}
            onChange={(e) => handleChange('lovedOneTelegramUsername', e.target.value)}
            placeholder="@username"
            className="w-full px-6 py-4 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-[#F35E4A]"
          />
        </div>
      </div>

      <div className="flex justify-between mt-12">
        <button
          onClick={onBack}
          className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-all"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={
            !formData.lovedOneFirstName ||
            !formData.lovedOneLastName ||
            !formData.lovedOneDateOfBirth ||
            !formData.lovedOneGender ||
            !formData.lovedOneMaritalStatus ||
            !formData.lovedOneTelegramUsername
          }
          className="px-8 py-3 bg-[#F35E4A] text-white rounded-lg text-lg font-semibold hover:bg-[#e54d37] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default LovedOneProfileStep;
