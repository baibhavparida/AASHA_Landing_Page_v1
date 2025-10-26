import React, { useState, useEffect } from 'react';
import {
  User,
  Bell,
  Clock,
  MessageCircle,
  Heart,
  Calendar,
  Settings,
  Home,
  Menu,
  X,
  LogOut,
  Upload,
  Activity,
  Pill
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getElderlyProfilesForFamily } from '../services/familyDashboardService';
import FamilyDashboardHome from './family/FamilyDashboardHome';
import ElderlyProfileOverview from './family/ElderlyProfileOverview';
import FamilyMedicationManagement from './family/FamilyMedicationManagement';
import FamilyCallSchedule from './family/FamilyCallSchedule';
import FamilyConversationsSection from './family/FamilyConversationsSection';
import FamilyInterestsSection from './family/FamilyInterestsSection';
import FamilyEventsSection from './family/FamilyEventsSection';
import FamilyContentUpload from './family/FamilyContentUpload';
import FamilyAlertsSection from './family/FamilyAlertsSection';
import FamilySettingsSection from './family/FamilySettingsSection';

type Section = 'home' | 'profile' | 'medications' | 'call-schedule' | 'conversations' | 'interests' | 'events' | 'content' | 'alerts' | 'settings';

interface ElderlyProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  country_code: string;
  date_of_birth: string;
  gender: string;
  language: string;
  marital_status: string;
  call_time_preference: string;
  relationship_to_caregiver: string;
}

const FamilyDashboard: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<Section>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [elderlyProfile, setElderlyProfile] = useState<ElderlyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profiles = await getElderlyProfilesForFamily();
      if (profiles && profiles.length > 0) {
        setElderlyProfile(profiles[0] as ElderlyProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    // Clear localStorage
    localStorage.removeItem('aasha_profile_id');
    localStorage.removeItem('aasha_phone_number');
    localStorage.removeItem('aasha_country_code');

    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'profile', label: 'Loved One Profile', icon: User },
    { id: 'medications', label: 'Medications', icon: Pill },
    { id: 'call-schedule', label: 'Call Schedule', icon: Clock },
    { id: 'conversations', label: 'Conversations', icon: MessageCircle },
    { id: 'interests', label: 'Interests & Topics', icon: Heart },
    { id: 'events', label: 'Special Events', icon: Calendar },
    { id: 'content', label: 'Share Content', icon: Upload },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: unreadAlertsCount },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSectionChange = (section: Section) => {
    setCurrentSection(section);
    setIsSidebarOpen(false);
  };

  const renderSection = () => {
    if (!elderlyProfile) return null;

    switch (currentSection) {
      case 'home':
        return <FamilyDashboardHome elderlyProfile={elderlyProfile} onNavigate={handleSectionChange} setUnreadAlertsCount={setUnreadAlertsCount} />;
      case 'profile':
        return <ElderlyProfileOverview elderlyProfile={elderlyProfile} onUpdate={loadProfile} />;
      case 'medications':
        return <FamilyMedicationManagement elderlyProfile={elderlyProfile} />;
      case 'call-schedule':
        return <FamilyCallSchedule elderlyProfile={elderlyProfile} onUpdate={loadProfile} />;
      case 'conversations':
        return <FamilyConversationsSection elderlyProfile={elderlyProfile} />;
      case 'interests':
        return <FamilyInterestsSection elderlyProfile={elderlyProfile} />;
      case 'events':
        return <FamilyEventsSection elderlyProfile={elderlyProfile} />;
      case 'content':
        return <FamilyContentUpload elderlyProfile={elderlyProfile} />;
      case 'alerts':
        return <FamilyAlertsSection elderlyProfile={elderlyProfile} setUnreadAlertsCount={setUnreadAlertsCount} />;
      case 'settings':
        return <FamilySettingsSection elderlyProfile={elderlyProfile} />;
      default:
        return <FamilyDashboardHome elderlyProfile={elderlyProfile} onNavigate={handleSectionChange} setUnreadAlertsCount={setUnreadAlertsCount} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F2EE] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#F35E4A] mx-auto"></div>
          <p className="mt-4 text-xl text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!elderlyProfile) {
    return (
      <div className="min-h-screen bg-[#F4F2EE] flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-md w-full">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Setup Incomplete</h2>
          <p className="text-gray-600 mb-6">
            Your loved one's profile was not fully set up during registration. Please complete the registration process to access the dashboard.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-700 font-medium mb-2">What happened?</p>
            <p className="text-sm text-gray-600">
              Your account exists, but the loved one's profile information needed to use Aasha is missing. This can happen if registration was interrupted.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#F35E4A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e54d37] transition-all"
            >
              Retry Loading
            </button>
            <button
              onClick={handleLogout}
              className="w-full border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F2EE] flex">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <img src="https://i.postimg.cc/c4k6zN0y/Aasha-Logo.png" alt="Aasha Logo" className="h-10" />
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-[#F35E4A] flex items-center justify-center text-white text-2xl font-bold">
                {elderlyProfile.first_name.charAt(0)}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {elderlyProfile.first_name} {elderlyProfile.last_name}
                </h3>
                <p className="text-sm text-gray-600">Your {elderlyProfile.relationship_to_caregiver || 'Loved One'}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleSectionChange(item.id as Section)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all ${
                        isActive
                          ? 'bg-[#F35E4A] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="h-6 w-6 mr-3" />
                        <span className="text-base font-medium">{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          isActive ? 'bg-white text-[#F35E4A]' : 'bg-[#F35E4A] text-white'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-700 hover:text-[#F35E4A]"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              {menuItems.find((item) => item.id === currentSection)?.label || 'Family Dashboard'}
            </h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all text-sm font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {renderSection()}
        </main>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default FamilyDashboard;
