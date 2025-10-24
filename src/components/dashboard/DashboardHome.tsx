import React, { useState, useEffect } from 'react';
import {
  Pill,
  Calendar,
  MessageCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Loader2
} from 'lucide-react';
import { getMedications, getCalls, getSpecialEvents, getMedicationTracking } from '../../services/dashboardService';

interface DashboardHomeProps {
  elderlyProfile: {
    id: string;
    first_name: string;
    last_name: string;
    call_time_preference: string;
  };
  onNavigate: (section: string) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ elderlyProfile, onNavigate }) => {
  const [stats, setStats] = useState({
    medicationCount: 0,
    upcomingEvents: 0,
    recentConversations: 0,
    medicationAdherence: 0,
  });
  const [todayMedications, setTodayMedications] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initiatingCall, setInitiatingCall] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [callSuccess, setCallSuccess] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [elderlyProfile.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [medications, calls, events] = await Promise.all([
        getMedications(elderlyProfile.id),
        getCalls(elderlyProfile.id, 5),
        getSpecialEvents(elderlyProfile.id),
      ]);

      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const upcoming = events.filter(event => {
        const eventDate = new Date(event.event_date);
        return eventDate >= today && eventDate <= nextWeek;
      });

      setTodayMedications(medications.slice(0, 3));
      setUpcomingEvents(upcoming.slice(0, 3));
      setStats({
        medicationCount: medications.length,
        upcomingEvents: upcoming.length,
        recentConversations: calls.length,
        medicationAdherence: 85,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getCallTimeDisplay = () => {
    const timeMap: { [key: string]: string } = {
      morning: 'Morning (6 AM - 12 PM)',
      afternoon: 'Afternoon (12 PM - 5 PM)',
      evening: 'Evening (5 PM - 9 PM)',
    };
    return timeMap[elderlyProfile.call_time_preference] || elderlyProfile.call_time_preference;
  };

  const handleTalkToAasha = async () => {
    try {
      setInitiatingCall(true);
      setCallError(null);
      setCallSuccess(false);

      const response = await fetch('https://sunitaai.app.n8n.cloud/webhook/Initiate_routine_call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elderly_profile_id: elderlyProfile.id,
          first_name: elderlyProfile.first_name,
          last_name: elderlyProfile.last_name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate call');
      }

      setCallSuccess(true);
      setTimeout(() => setCallSuccess(false), 5000);
    } catch (error) {
      console.error('Error initiating call:', error);
      setCallError('Failed to initiate call. Please try again.');
      setTimeout(() => setCallError(null), 5000);
    } finally {
      setInitiatingCall(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#F35E4A]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {getGreeting()}, {elderlyProfile.first_name}!
            </h2>
            <p className="text-lg text-gray-600">
              Here's your daily overview. Have a wonderful day!
            </p>
          </div>
          <button
            onClick={handleTalkToAasha}
            disabled={initiatingCall}
            className="flex items-center space-x-2 bg-[#F35E4A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e54d37] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {initiatingCall ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Calling...</span>
              </>
            ) : (
              <>
                <Phone className="h-5 w-5" />
                <span>Talk to Aasha</span>
              </>
            )}
          </button>
        </div>
        {callSuccess && (
          <div className="mt-4 bg-green-50 border-l-4 border-green-500 rounded p-4">
            <p className="text-green-800 font-semibold">Call initiated! Aasha will call you shortly.</p>
          </div>
        )}
        {callError && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-500 rounded p-4">
            <p className="text-red-800 font-semibold">{callError}</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#F35E4A]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Medications</p>
              <p className="text-3xl font-bold text-gray-900">{stats.medicationCount}</p>
            </div>
            <Pill className="h-12 w-12 text-[#F35E4A] opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Adherence Rate</p>
              <p className="text-3xl font-bold text-gray-900">{stats.medicationAdherence}%</p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Upcoming Events</p>
              <p className="text-3xl font-bold text-gray-900">{stats.upcomingEvents}</p>
            </div>
            <Calendar className="h-12 w-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Recent Chats</p>
              <p className="text-3xl font-bold text-gray-900">{stats.recentConversations}</p>
            </div>
            <MessageCircle className="h-12 w-12 text-purple-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Next Call Schedule */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="flex items-center mb-4">
          <Clock className="h-6 w-6 text-[#F35E4A] mr-3" />
          <h3 className="text-xl font-bold text-gray-900">Your Next Aasha Call</h3>
        </div>
        <p className="text-base text-gray-700 mb-2">Preferred Time: {getCallTimeDisplay()}</p>
        <p className="text-sm text-gray-600">Aasha will call you during your preferred time window</p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Medications */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Today's Medications</h3>
            <button
              onClick={() => onNavigate('medications')}
              className="text-[#F35E4A] font-semibold hover:underline"
            >
              View All
            </button>
          </div>
          {todayMedications.length > 0 ? (
            <div className="space-y-4">
              {todayMedications.map((med) => (
                <div key={med.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Pill className="h-8 w-8 text-[#F35E4A] mr-3" />
                    <div>
                      <p className="font-semibold text-gray-900">{med.name}</p>
                      <p className="text-sm text-gray-600">{med.dosage} - {med.time}</p>
                    </div>
                  </div>
                  <CheckCircle className="h-6 w-6 text-gray-400" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Pill className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No medications scheduled</p>
              <button
                onClick={() => onNavigate('medications')}
                className="mt-4 text-[#F35E4A] font-semibold hover:underline"
              >
                Add Medication
              </button>
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Upcoming Events</h3>
            <button
              onClick={() => onNavigate('events')}
              className="text-[#F35E4A] font-semibold hover:underline"
            >
              View All
            </button>
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start p-4 bg-gray-50 rounded-lg">
                  <Calendar className="h-8 w-8 text-[#F35E4A] mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">{event.event_name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(event.event_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    {event.description && (
                      <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No upcoming events</p>
              <button
                onClick={() => onNavigate('events')}
                className="mt-4 text-[#F35E4A] font-semibold hover:underline"
              >
                Add Event
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Daily Tip */}
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-6">
        <div className="flex items-start">
          <AlertCircle className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Daily Wellness Tip</h4>
            <p className="text-blue-800">
              Remember to stay hydrated throughout the day. Aim for 6-8 glasses of water to keep your body healthy and energized!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
