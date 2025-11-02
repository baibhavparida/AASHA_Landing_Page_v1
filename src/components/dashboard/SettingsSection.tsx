import React, { useState } from 'react';
import { Settings, Bell, Type, Globe, Shield, HelpCircle, Mail, Phone } from 'lucide-react';

interface SettingsSectionProps {
  elderlyProfile: {
    language: string;
  };
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ elderlyProfile }) => {
  const [fontSize, setFontSize] = useState('medium');
  const [notifications, setNotifications] = useState({
    medications: true,
    calls: true,
    events: true,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <h2 className="text-3xl font-bold text-gray-900">Settings</h2>

      {/* Notifications */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="flex items-center mb-6">
          <Bell className="h-6 w-6 text-[#F35E4A] mr-3" />
          <h3 className="text-xl font-bold text-gray-900">Notifications</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <p className="font-semibold text-gray-900">Medication Reminders</p>
              <p className="text-sm text-gray-600">Get notified when it's time to take your medications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.medications}
                onChange={(e) => setNotifications({ ...notifications, medications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#F35E4A]/20 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#F35E4A]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <p className="font-semibold text-gray-900">Call Reminders</p>
              <p className="text-sm text-gray-600">Get notified before your scheduled Aasha calls</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.calls}
                onChange={(e) => setNotifications({ ...notifications, calls: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#F35E4A]/20 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#F35E4A]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-semibold text-gray-900">Event Reminders</p>
              <p className="text-sm text-gray-600">Get notified about upcoming special events</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.events}
                onChange={(e) => setNotifications({ ...notifications, events: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#F35E4A]/20 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#F35E4A]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="flex items-center mb-6">
          <Type className="h-6 w-6 text-[#F35E4A] mr-3" />
          <h3 className="text-xl font-bold text-gray-900">Display</h3>
        </div>
        <div>
          <label className="block font-semibold text-gray-900 mb-3">Font Size</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['small', 'medium', 'large', 'extra-large'].map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`py-3 px-4 rounded-lg border-2 font-semibold transition-all ${
                  fontSize === size
                    ? 'border-[#F35E4A] bg-[#F35E4A] text-white'
                    : 'border-gray-300 text-gray-700 hover:border-[#F35E4A]'
                }`}
              >
                {size.charAt(0).toUpperCase() + size.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-3">Choose a comfortable font size for reading</p>
        </div>
      </div>

      {/* Language */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="flex items-center mb-6">
          <Globe className="h-6 w-6 text-[#F35E4A] mr-3" />
          <h3 className="text-xl font-bold text-gray-900">Language</h3>
        </div>
        <div>
          <label className="block font-semibold text-gray-900 mb-3">Preferred Language</label>
          <div className="text-lg text-gray-700">
            {elderlyProfile.language}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            To change your language preference, please update your profile settings
          </p>
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="flex items-center mb-6">
          <Shield className="h-6 w-6 text-[#F35E4A] mr-3" />
          <h3 className="text-xl font-bold text-gray-900">Privacy & Security</h3>
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-semibold text-gray-900 mb-1">Data Privacy</p>
            <p className="text-sm text-gray-600">
              Your data is encrypted and securely stored. We never share your personal information with third parties.
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-semibold text-gray-900 mb-1">HIPAA Compliant</p>
            <p className="text-sm text-gray-600">
              All health information is protected under HIPAA regulations and handled with the highest security standards.
            </p>
          </div>
        </div>
      </div>

      {/* Help & Support */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="flex items-center mb-6">
          <HelpCircle className="h-6 w-6 text-[#F35E4A] mr-3" />
          <h3 className="text-xl font-bold text-gray-900">Help & Support</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <Mail className="h-6 w-6 text-[#F35E4A] mr-4" />
            <div>
              <p className="font-semibold text-gray-900">Email Support</p>
              <a href="mailto:hello@aasha.com" className="text-sm text-[#F35E4A] hover:underline">
                hello@aasha.com
              </a>
            </div>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <Phone className="h-6 w-6 text-[#F35E4A] mr-4" />
            <div>
              <p className="font-semibold text-gray-900">Phone Support</p>
              <a href="tel:1-800-AASHA-1" className="text-sm text-[#F35E4A] hover:underline">
                1-800-AASHA-1
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* App Version */}
      <div className="text-center text-sm text-gray-600">
        <p>Aasha Dashboard v1.0.0</p>
        <p className="mt-1">© 2025 AASHA. All rights reserved.</p>
      </div>
    </div>
  );
};

export default SettingsSection;
