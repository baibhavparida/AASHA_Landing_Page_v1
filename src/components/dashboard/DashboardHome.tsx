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
  ChevronRight,
  ChevronLeft,
  Heart,
  Book,
  Music,
  Palette,
  Trophy,
  Tv,
  Coffee,
  Camera,
  Utensils,
  Plane,
  Flower2,
  Dog,
  Bird,
  TreePine,
  Dumbbell,
  Gamepad2,
  ShoppingBag,
  Film,
  GraduationCap,
  Theater,
  Sparkles
} from 'lucide-react';
import { getMedications, getCalls, getSpecialEvents, getInterests } from '../../services/dashboardService';
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
  const [interests, setInterests] = useState<any[]>([]);
  const [weeklyLogs, setWeeklyLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initiatingCall, setInitiatingCall] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [callSuccess, setCallSuccess] = useState(false);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const [selectedCall, setSelectedCall] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, [elderlyProfile.id, selectedWeekOffset]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - (selectedWeekOffset * 7));
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);

      const [medsData, callsData, eventsData, interestsData, logsData] = await Promise.all([
        getMedications(elderlyProfile.id),
        getCalls(elderlyProfile.id, 10),
        getSpecialEvents(elderlyProfile.id),
        getInterests(elderlyProfile.id),
        getDailyMedicineLogs(elderlyProfile.id, weekStart, weekEnd),
      ]);

      const upcoming = eventsData.filter(event => {
        const eventDate = new Date(event.event_date);
        return eventDate >= today;
      }).sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

      setMedications(medsData);
      setRecentCalls(callsData.slice(0, 3));
      setUpcomingEvents(upcoming.slice(0, 3));
      setInterests(interestsData);
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
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i - (selectedWeekOffset * 7));
      days.push(date);
    }
    return days;
  };

  const getWeekLabel = () => {
    if (selectedWeekOffset === 0) return 'This Week';
    if (selectedWeekOffset === 1) return 'Last Week';
    return `${selectedWeekOffset} Weeks Ago`;
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
            <p className="text-sm text-gray-500 mt-1">
              Preferred call window: {getCallTimeDisplay()}
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

      {/* Two Column Layout - Medication and Conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. Medication Tracking */}
        <div className="bg-white rounded-2xl shadow-md p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Pill className="h-5 w-5 text-[#F35E4A] mr-2" />
            <h3 className="text-lg font-bold text-gray-900">Medication Tracking</h3>
          </div>
          <button
            onClick={() => onNavigate('medications')}
            className="flex items-center text-[#F35E4A] font-semibold hover:underline"
          >
            View Details
            <ChevronRight className="h-5 w-5 ml-1" />
          </button>
        </div>

        {/* Week Selector */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setSelectedWeekOffset(selectedWeekOffset + 1)}
            className="flex items-center text-gray-600 hover:text-[#F35E4A] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm">Previous</span>
          </button>
          <span className="text-sm font-semibold text-gray-700">{getWeekLabel()}</span>
          <button
            onClick={() => setSelectedWeekOffset(Math.max(0, selectedWeekOffset - 1))}
            disabled={selectedWeekOffset === 0}
            className="flex items-center text-gray-600 hover:text-[#F35E4A] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="text-sm">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Weekly Adherence */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {getLast7Days().map((day, idx) => {
            const dayStr = day.toISOString().split('T')[0];
            const log = weeklyLogs.find(l => l.log_date === dayStr);
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={idx}
                className={`bg-gray-50 rounded-lg p-2 text-center border-2 transition-all ${
                  isToday ? 'border-[#F35E4A] bg-[#F35E4A] bg-opacity-5' : 'border-gray-100'
                }`}
              >
                <div className={`text-xs font-semibold mb-0.5 ${
                  isToday ? 'text-[#F35E4A]' : 'text-gray-600'
                }`}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-sm font-bold mb-1 ${
                  isToday ? 'text-[#F35E4A]' : 'text-gray-900'
                }`}>
                  {day.getDate()}
                </div>
                <div className="flex items-center justify-center">
                  {log ? (
                    log.medicine_taken ? (
                      <div className="bg-green-100 rounded-full p-1">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                    ) : (
                      <div className="bg-red-100 rounded-full p-1">
                        <XIcon className="h-3 w-3 text-red-600" />
                      </div>
                    )
                  ) : (
                    <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats Row - Vertical Stack */}
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600 mb-1">Adherence Rate</p>
            <p className="text-2xl font-bold text-gray-900">{getAdherenceRate()}%</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600 mb-1">Total Medications</p>
            <p className="text-2xl font-bold text-gray-900">{medications.length}</p>
          </div>
        </div>
        </div>

        {/* 2. Call Conversations Tracking */}
        <div className="bg-white rounded-2xl shadow-md p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <MessageCircle className="h-5 w-5 text-[#F35E4A] mr-2" />
            <h3 className="text-lg font-bold text-gray-900">Recent Conversations</h3>
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
          <div className="space-y-3">
            {recentCalls.map((call) => {
              const summary = call.call_analysis?.[0]?.call_summary || call.call_transcripts?.[0]?.llm_call_summary || 'No summary available';
              const formatDuration = (seconds: number) => {
                const minutes = Math.floor(seconds / 60);
                const secs = seconds % 60;
                if (minutes < 60) return `${minutes}:${secs.toString().padStart(2, '0')}`;
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                return `${hours}h ${mins}m`;
              };
              const callDate = new Date(call.created_at);
              const callTitle = callDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              });
              const timeStr = callDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });
              return (
                <div
                  key={call.id}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all cursor-pointer"
                  onClick={() => setSelectedCall(call)}
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-[#FEF2F2] rounded-lg p-2.5 flex-shrink-0">
                      <MessageCircle className="h-5 w-5 text-[#F35E4A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">
                        {callTitle}
                      </h4>
                      <p className="text-sm text-gray-900 mb-2 leading-relaxed line-clamp-1">
                        {summary}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span>{timeStr}</span>
                        <span>Duration: {formatDuration(call.duration_seconds)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
      </div>

      {/* 3. Upcoming Events and Interests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-[#F35E4A] mr-2" />
                <h3 className="text-lg font-bold text-gray-900">Upcoming Events</h3>
              </div>
              <button
                onClick={() => onNavigate('events')}
                className="flex items-center text-[#F35E4A] font-semibold hover:underline"
              >
                View All
                <ChevronRight className="h-5 w-5 ml-1" />
              </button>
            </div>

            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start p-3 bg-gray-50 rounded-lg">
                  <div className="bg-[#F35E4A] bg-opacity-10 rounded-full p-2 mr-3">
                    <Calendar className="h-4 w-4 text-[#F35E4A]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{event.event_name}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {new Date(event.event_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    {event.description && (
                      <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                    )}
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      {event.event_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Interests */}
        <div className="bg-white rounded-2xl shadow-md p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Heart className="h-5 w-5 text-[#F35E4A] mr-2" />
              <h3 className="text-lg font-bold text-gray-900">My Interests</h3>
            </div>
            <button
              onClick={() => onNavigate('interests')}
              className="flex items-center text-[#F35E4A] font-semibold hover:underline"
            >
              Manage
              <ChevronRight className="h-5 w-5 ml-1" />
            </button>
          </div>

          {interests.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {interests.map((interest) => {
                const getInterestIcon = (interestName: string) => {
                  const name = interestName.toLowerCase();
                  if (name.includes('read')) return Book;
                  if (name.includes('music')) return Music;
                  if (name.includes('art') || name.includes('craft') || name.includes('paint') || name.includes('draw')) return Palette;
                  if (name.includes('sport') || name.includes('game')) return Trophy;
                  if (name.includes('tv') || name.includes('show') || name.includes('watch')) return Tv;
                  if (name.includes('cook') || name.includes('bak') || name.includes('food')) return Utensils;
                  if (name.includes('photo')) return Camera;
                  if (name.includes('travel')) return Plane;
                  if (name.includes('garden') || name.includes('plant')) return Flower2;
                  if (name.includes('dog')) return Dog;
                  if (name.includes('bird')) return Bird;
                  if (name.includes('nature') || name.includes('outdoor')) return TreePine;
                  if (name.includes('exercise') || name.includes('fitness') || name.includes('gym')) return Dumbbell;
                  if (name.includes('video game') || name.includes('gaming')) return Gamepad2;
                  if (name.includes('shop')) return ShoppingBag;
                  if (name.includes('movie') || name.includes('film')) return Film;
                  if (name.includes('learn') || name.includes('study') || name.includes('educat')) return GraduationCap;
                  if (name.includes('theater') || name.includes('drama')) return Theater;
                  if (name.includes('coffee') || name.includes('tea')) return Coffee;
                  return Sparkles;
                };
                const Icon = getInterestIcon(interest.interest);
                return (
                  <div
                    key={interest.id}
                    className="bg-white rounded-xl shadow-md p-4 border-2 border-[#F35E4A] hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-[#F35E4A] bg-opacity-10 rounded-full p-3 mb-2">
                        <Icon className="h-6 w-6 text-[#F35E4A]" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 capitalize">
                        {interest.interest}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 text-sm mb-3">No interests added yet</p>
              <button
                onClick={() => onNavigate('interests')}
                className="text-[#F35E4A] font-semibold hover:underline text-sm"
              >
                Add your interests
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Call Detail Modal */}
      {selectedCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {new Date(selectedCall.created_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  <p className="text-gray-600 mt-1 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Duration: {(() => {
                      const seconds = selectedCall.duration_seconds;
                      const minutes = Math.floor(seconds / 60);
                      const secs = seconds % 60;
                      if (minutes < 60) return `${minutes}:${secs.toString().padStart(2, '0')}`;
                      const hours = Math.floor(minutes / 60);
                      const mins = minutes % 60;
                      return `${hours}h ${mins}m`;
                    })()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCall(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Summary */}
                {(selectedCall.call_analysis?.[0]?.call_summary || selectedCall.call_transcripts?.[0]?.llm_call_summary) && (
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3">Call Summary</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 leading-relaxed">
                        {selectedCall.call_analysis?.[0]?.call_summary || selectedCall.call_transcripts?.[0]?.llm_call_summary}
                      </p>
                    </div>
                  </div>
                )}

                {/* Full Transcript */}
                {selectedCall.call_transcripts?.[0]?.transcript_text && (
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3">Full Transcript</h4>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
                        {selectedCall.call_transcripts?.[0]?.transcript_text}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedCall(null)}
                className="w-full bg-[#F35E4A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e54d37] transition-all"
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

export default DashboardHome;
