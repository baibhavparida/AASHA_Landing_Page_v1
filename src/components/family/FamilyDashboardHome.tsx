import React, { useState, useEffect } from 'react';
import {
  Bell,
  Calendar,
  MessageCircle,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Pill,
  Activity
} from 'lucide-react';
import { getMedications, getCalls, getSpecialEvents } from '../../services/dashboardService';
import { getFamilyAlerts, getMedicationAdherenceStats } from '../../services/familyDashboardService';

interface FamilyDashboardHomeProps {
  elderlyProfile: {
    id: string;
    first_name: string;
    last_name: string;
    call_time_preference: string;
  };
  onNavigate: (section: string) => void;
  setUnreadAlertsCount: (count: number) => void;
}

const FamilyDashboardHome: React.FC<FamilyDashboardHomeProps> = ({ elderlyProfile, onNavigate, setUnreadAlertsCount }) => {
  const [stats, setStats] = useState({
    medicationCount: 0,
    upcomingEvents: 0,
    recentConversations: 0,
    medicationAdherence: 0,
    unreadAlerts: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [lastConversationDate, setLastConversationDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [elderlyProfile.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [medications, calls, events, alerts, adherenceStats] = await Promise.all([
        getMedications(elderlyProfile.id),
        getCalls(elderlyProfile.id, 5),
        getSpecialEvents(elderlyProfile.id),
        getFamilyAlerts(elderlyProfile.id, true),
        getMedicationAdherenceStats(elderlyProfile.id, 30),
      ]);

      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const upcoming = events.filter(event => {
        const eventDate = new Date(event.event_date);
        return eventDate >= today && eventDate <= nextWeek;
      });

      if (calls && calls.length > 0) {
        setLastConversationDate(calls[0].started_at);
      }

      setRecentAlerts(alerts.slice(0, 3));
      setUnreadAlertsCount(alerts.length);

      setStats({
        medicationCount: medications.length,
        upcomingEvents: upcoming.length,
        recentConversations: calls.length,
        medicationAdherence: adherenceStats.adherenceRate,
        unreadAlerts: alerts.length,
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

  const getDaysSinceLastConversation = () => {
    if (!lastConversationDate) return null;
    const lastDate = new Date(lastConversationDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#F35E4A]"></div>
      </div>
    );
  }

  const daysSinceConversation = getDaysSinceLastConversation();

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {getGreeting()}!
        </h2>
        <p className="text-lg text-gray-600">
          Here's how {elderlyProfile.first_name} is doing today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Medications</p>
              <p className="text-3xl font-bold text-gray-900">{stats.medicationCount}</p>
            </div>
            <Pill className="h-12 w-12 text-[#F35E4A] opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Adherence Rate</p>
              <p className="text-3xl font-bold text-gray-900">{stats.medicationAdherence}%</p>
            </div>
            <TrendingUp className={`h-12 w-12 opacity-20 ${
              stats.medicationAdherence >= 80 ? 'text-green-500' : 'text-orange-500'
            }`} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Upcoming Events</p>
              <p className="text-3xl font-bold text-gray-900">{stats.upcomingEvents}</p>
            </div>
            <Calendar className="h-12 w-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Alerts</p>
              <p className="text-3xl font-bold text-gray-900">{stats.unreadAlerts}</p>
            </div>
            <Bell className={`h-12 w-12 opacity-20 ${
              stats.unreadAlerts > 0 ? 'text-red-500' : 'text-green-500'
            }`} />
          </div>
        </div>
      </div>

      {daysSinceConversation !== null && daysSinceConversation > 2 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 rounded-xl p-6">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-orange-500 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-orange-900 mb-1">Conversation Gap Alert</h4>
              <p className="text-orange-800">
                It's been {daysSinceConversation} days since {elderlyProfile.first_name}'s last conversation with Aasha. Consider checking in.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-md p-8 border-2 border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center mb-4">
              <Clock className="h-6 w-6 text-[#F35E4A] mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Next Aasha Call</h3>
            </div>
            <p className="text-base text-gray-700 mb-2">Preferred Time: {getCallTimeDisplay()}</p>
            <p className="text-sm text-gray-600">Aasha will call {elderlyProfile.first_name} during this time window</p>
          </div>
          <button
            onClick={() => onNavigate('call-schedule')}
            className="bg-[#F35E4A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e54d37] transition-all"
          >
            Manage Schedule
          </button>
        </div>
      </div>

      {recentAlerts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Alerts</h3>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-[#F35E4A] font-semibold hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                    </div>
                    <p className="text-sm text-gray-700">{alert.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
            <Activity className="h-6 w-6 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <MessageCircle className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="font-semibold text-gray-900">Last Conversation</p>
                <p className="text-sm text-gray-600">
                  {lastConversationDate
                    ? new Date(lastConversationDate).toLocaleDateString()
                    : 'No conversations yet'}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('conversations')}
              className="w-full text-[#F35E4A] font-semibold hover:underline text-center py-2"
            >
              View All Conversations
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onNavigate('content')}
              className="p-4 border-2 border-gray-200 text-[#F35E4A] rounded-lg hover:bg-[#F35E4A] hover:text-white transition-all"
            >
              <Activity className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-semibold">Share Content</span>
            </button>
            <button
              onClick={() => onNavigate('medications')}
              className="p-4 border-2 border-gray-200 text-[#F35E4A] rounded-lg hover:bg-[#F35E4A] hover:text-white transition-all"
            >
              <Pill className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-semibold">Manage Meds</span>
            </button>
            <button
              onClick={() => onNavigate('events')}
              className="p-4 border-2 border-gray-200 text-[#F35E4A] rounded-lg hover:bg-[#F35E4A] hover:text-white transition-all"
            >
              <Calendar className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-semibold">Add Event</span>
            </button>
            <button
              onClick={() => onNavigate('profile')}
              className="p-4 border-2 border-gray-200 text-[#F35E4A] rounded-lg hover:bg-[#F35E4A] hover:text-white transition-all"
            >
              <CheckCircle className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-semibold">View Profile</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-6">
        <div className="flex items-start">
          <AlertCircle className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Family Care Tip</h4>
            <p className="text-blue-800">
              Regular engagement helps maintain cognitive health. Consider uploading family photos or news for Aasha to discuss with {elderlyProfile.first_name}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyDashboardHome;
