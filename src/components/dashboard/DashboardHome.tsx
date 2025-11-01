import React, { useState, useEffect } from 'react';
import {
  Pill,
  Calendar,
  MessageCircle,
  Clock,
  CheckCircle,
  Phone,
  Loader2,
  Check,
  X as XIcon,
  ChevronRight
} from 'lucide-react';
import { getMedications, getCalls, getSpecialEvents } from '../../services/dashboardService';
import { getDailyMedicineLogs } from '../../services/dailyMedicineLogService';
import { supabase } from '../../lib/supabase';

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
  const [medications, setMedications] = useState<any[]>([]);
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [weeklyLogs, setWeeklyLogs] = useState<any[]>([]);
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
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 6);

      const [medsData, callsData, eventsData, logsData] = await Promise.all([
        getMedications(elderlyProfile.id),
        getCalls(elderlyProfile.id, 10),
        getSpecialEvents(elderlyProfile.id),
        getDailyMedicineLogs(elderlyProfile.id, weekStart, today),
      ]);

      const upcoming = eventsData.filter(event => {
        const eventDate = new Date(event.event_date);
        return eventDate >= today;
      }).sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

      setMedications(medsData);
      setRecentCalls(callsData.slice(0, 5));
      setUpcomingEvents(upcoming.slice(0, 3));
      setWeeklyLogs(logsData);
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

      // Fetch comprehensive user data from the database
      // Call the database function to get all user data
      const { data: fullProfileData, error: dbError } = await supabase
        .rpc('get_elderly_profile_full_details', {
          p_elderly_profile_id: elderlyProfile.id
        });

      if (dbError) {
        console.error('Error fetching profile data:', dbError);
        throw new Error('Failed to fetch user data');
      }

      // Send all available data to the webhook
      const response = await fetch('https://sunitaai.app.n8n.cloud/webhook/Initiate_routine_call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elderly_profile_id: elderlyProfile.id,
          first_name: elderlyProfile.first_name,
          last_name: elderlyProfile.last_name,
          call_time_preference: elderlyProfile.call_time_preference,
          // Include all comprehensive data from database
          profile_data: fullProfileData || {},
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

  const getAdherenceRate = () => {
    if (weeklyLogs.length === 0) return 0;
    const takenDays = weeklyLogs.filter(log => log.medicine_taken).length;
    return Math.round((takenDays / weeklyLogs.length) * 100);
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
            className="flex items-center justify-center space-x-2 bg-[#F35E4A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e54d37] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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

      {/* 1. Medication Tracking - Primary Focus */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Pill className="h-6 w-6 text-[#F35E4A] mr-3" />
            <h3 className="text-2xl font-bold text-gray-900">Medication Tracking</h3>
          </div>
          <button
            onClick={() => onNavigate('medications')}
            className="flex items-center text-[#F35E4A] font-semibold hover:underline"
          >
            View Details
            <ChevronRight className="h-5 w-5 ml-1" />
          </button>
        </div>

        {/* Weekly Adherence */}
        <div className="grid grid-cols-7 gap-3 mb-6">
          {getLast7Days().map((day, idx) => {
            const dayStr = day.toISOString().split('T')[0];
            const log = weeklyLogs.find(l => l.log_date === dayStr);
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={idx}
                className={`bg-gray-50 rounded-xl p-3 text-center border-2 transition-all ${
                  isToday ? 'border-[#F35E4A] bg-[#F35E4A] bg-opacity-5' : 'border-gray-100'
                }`}
              >
                <div className={`text-xs font-semibold mb-1 ${
                  isToday ? 'text-[#F35E4A]' : 'text-gray-600'
                }`}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-sm font-bold mb-2 ${
                  isToday ? 'text-[#F35E4A]' : 'text-gray-900'
                }`}>
                  {day.getDate()}
                </div>
                <div className="flex items-center justify-center">
                  {log ? (
                    log.medicine_taken ? (
                      <div className="bg-green-100 rounded-full p-1.5">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                    ) : (
                      <div className="bg-red-100 rounded-full p-1.5">
                        <XIcon className="h-4 w-4 text-red-600" />
                      </div>
                    )
                  ) : (
                    <div className="w-7 h-7 bg-gray-200 rounded-full"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Adherence Rate</p>
            <p className="text-2xl font-bold text-gray-900">{getAdherenceRate()}%</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Total Medications</p>
            <p className="text-2xl font-bold text-gray-900">{medications.length}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 col-span-2 md:col-span-1">
            <p className="text-sm text-gray-600 mb-1">Next Call</p>
            <p className="text-lg font-bold text-gray-900">{getCallTimeDisplay()}</p>
          </div>
        </div>

        {/* Medications List Preview */}
        {medications.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-3">Your Medications</h4>
            <div className="space-y-2">
              {medications.slice(0, 3).map((med) => (
                <div key={med.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-[#F35E4A] bg-opacity-10 rounded-lg p-2 mr-3">
                      <Pill className="h-4 w-4 text-[#F35E4A]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{med.name}</p>
                      <p className="text-sm text-gray-600">{med.dosage_quantity}x - {med.times_of_day?.join(', ')}</p>
                    </div>
                  </div>
                </div>
              ))}
              {medications.length > 3 && (
                <button
                  onClick={() => onNavigate('medications')}
                  className="text-[#F35E4A] text-sm font-semibold hover:underline w-full text-center pt-2"
                >
                  View {medications.length - 3} more medications
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Call Conversations Tracking */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <MessageCircle className="h-6 w-6 text-[#F35E4A] mr-3" />
            <h3 className="text-2xl font-bold text-gray-900">Recent Conversations</h3>
          </div>
          <button
            onClick={() => onNavigate('conversations')}
            className="flex items-center text-[#F35E4A] font-semibold hover:underline"
          >
            View All
            <ChevronRight className="h-5 w-5 ml-1" />
          </button>
        </div>

        {recentCalls.length > 0 ? (
          <div className="space-y-4">
            {recentCalls.map((call) => (
              <div key={call.id} className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                <div className="bg-[#F35E4A] bg-opacity-10 rounded-full p-3 mr-4">
                  <Phone className="h-5 w-5 text-[#F35E4A]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-gray-900">
                      {call.call_type === 'daily_checkin' ? 'Daily Check-in' : 'Onboarding Call'}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      call.call_status === 'successful'
                        ? 'bg-green-100 text-green-700'
                        : call.call_status === 'voicemail'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {call.call_status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(call.started_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                  {call.duration_seconds && (
                    <p className="text-xs text-gray-500 mt-1">
                      Duration: {Math.floor(call.duration_seconds / 60)}m {call.duration_seconds % 60}s
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No conversations yet</p>
            <button
              onClick={handleTalkToAasha}
              className="mt-4 bg-[#F35E4A] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#e54d37] transition-all"
            >
              Start Your First Chat
            </button>
          </div>
        )}
      </div>

      {/* 3. Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-[#F35E4A] mr-3" />
              <h3 className="text-2xl font-bold text-gray-900">Upcoming Events</h3>
            </div>
            <button
              onClick={() => onNavigate('events')}
              className="flex items-center text-[#F35E4A] font-semibold hover:underline"
            >
              View All
              <ChevronRight className="h-5 w-5 ml-1" />
            </button>
          </div>

          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-start p-4 bg-gray-50 rounded-lg">
                <div className="bg-[#F35E4A] bg-opacity-10 rounded-full p-3 mr-4">
                  <Calendar className="h-5 w-5 text-[#F35E4A]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{event.event_name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(event.event_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  {event.description && (
                    <p className="text-sm text-gray-500 mt-2">{event.description}</p>
                  )}
                  <span className="inline-block mt-2 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {event.event_type.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
