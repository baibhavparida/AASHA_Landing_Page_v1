import React, { useState, useEffect } from 'react';
import { MessageCircle, Clock, Search, ChevronRight, X, FileText, Sun, Moon, Save } from 'lucide-react';
import { getCalls, getCall, updateElderlyProfile } from '../../services/dashboardService';
import SentimentIndicator from '../common/SentimentIndicator';

interface ConversationsSectionProps {
  elderlyProfile: {
    id: string;
    call_time_preference: string;
  };
  onUpdate: () => void;
}

const ConversationsSection: React.FC<ConversationsSectionProps> = ({ elderlyProfile, onUpdate }) => {
  const [calls, setCalls] = useState<any[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<any[]>([]);
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState(elderlyProfile.call_time_preference);
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    loadCalls();
  }, [elderlyProfile.id]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCalls(calls);
    } else {
      const filtered = calls.filter(
        (call) => {
          const summary = call.call_analysis?.[0]?.call_summary || call.llm_call_summary || '';
          const dateStr = call.created_at ? new Date(call.created_at).toLocaleDateString() : '';
          return summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dateStr.includes(searchQuery);
        }
      );
      setFilteredCalls(filtered);
    }
  }, [searchQuery, calls]);

  const loadCalls = async () => {
    try {
      setLoading(true);
      const data = await getCalls(elderlyProfile.id);

      // Process calls to get the best transcript and summary for each
      const processedCalls = data.map(call => {
        // Find transcript with actual content (prefer ones with llm_call_summary)
        const bestTranscript = call.call_transcripts?.find(t => t.llm_call_summary && t.transcript_text) ||
                               call.call_transcripts?.find(t => t.transcript_text) ||
                               call.call_transcripts?.[0];

        // Find analysis with actual content
        const bestAnalysis = call.call_analysis?.find(a => a.call_summary && a.call_summary.length > 0) ||
                            call.call_analysis?.[0];

        return {
          ...call,
          call_transcripts: bestTranscript ? [bestTranscript] : [],
          call_analysis: bestAnalysis ? [bestAnalysis] : []
        };
      });

      setCalls(processedCalls);
      setFilteredCalls(processedCalls);
    } catch (error) {
      console.error('Error loading calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (call: any) => {
    setSelectedCall(call);
  };

  const handleCloseDetails = () => {
    setSelectedCall(null);
    setShowTranscript(false);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes < 60) return `${minutes}:${secs.toString().padStart(2, '0')}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const timeOptions = [
    {
      id: 'morning',
      label: 'Morning',
      time: '6:00 AM - 12:00 PM',
      icon: Sun,
      gradient: 'from-yellow-400 to-orange-400',
    },
    {
      id: 'afternoon',
      label: 'Afternoon',
      time: '12:00 PM - 5:00 PM',
      icon: Sun,
      gradient: 'from-orange-400 to-red-400',
    },
    {
      id: 'evening',
      label: 'Evening',
      time: '5:00 PM - 9:00 PM',
      icon: Moon,
      gradient: 'from-blue-400 to-indigo-400',
    },
  ];

  const handleSaveSchedule = async () => {
    try {
      setSavingSchedule(true);
      await updateElderlyProfile(elderlyProfile.id, {
        call_time_preference: selectedTime,
      });
      await onUpdate();
      alert('Call schedule updated successfully!');
    } catch (error) {
      console.error('Error updating call schedule:', error);
      alert('Failed to update call schedule');
    } finally {
      setSavingSchedule(false);
    }
  };

  const hasScheduleChanges = selectedTime !== elderlyProfile.call_time_preference;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#F35E4A]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <h2 className="text-3xl font-bold text-gray-900">My Calls</h2>

      {/* Call Schedule Section - Compact */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#F35E4A]" />
            <h3 className="text-base font-bold text-gray-900">Call Preference:</h3>
            <span className="text-sm text-gray-600">
              {timeOptions.find((opt) => opt.id === elderlyProfile.call_time_preference)?.label || 'Not set'}
            </span>
          </div>
        </div>

        {/* Time Options - Compact Pills */}
        <div className="flex flex-wrap gap-3">
          {timeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedTime === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setSelectedTime(option.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-[#F35E4A] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{option.label}</span>
                <span className="text-xs opacity-75">({option.time})</span>
              </button>
            );
          })}
          {hasScheduleChanges && (
            <button
              onClick={handleSaveSchedule}
              disabled={savingSchedule}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-all disabled:opacity-50"
            >
              {savingSchedule ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3" />
                  Save
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search calls by date or topic..."
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#F35E4A] focus:outline-none text-lg"
          />
        </div>
      </div>

      {/* Calls List */}
      {filteredCalls.length > 0 ? (
        <div className="space-y-4">
          {filteredCalls.map((call) => {
            const analysis = call.call_analysis?.[0];
            const summary = (analysis?.call_summary && analysis.call_summary.trim().length > 0 ? analysis.call_summary : null) ||
                          (call.llm_call_summary && call.llm_call_summary.trim().length > 0 ? call.llm_call_summary : null) ||
                          'No summary available';
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

            const sentiment = call.call_analysis?.[0]?.user_sentiment;

            return (
              <div
                key={call.id}
                className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleViewDetails(call)}
              >
                <div className="flex items-start gap-4">
                  <div className="bg-[#FEF2F2] rounded-xl p-4 flex-shrink-0">
                    <MessageCircle className="h-7 w-7 text-[#F35E4A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {callTitle}
                      </h3>
                      <SentimentIndicator sentiment={sentiment} size="small" />
                    </div>
                    <p className="text-base text-gray-900 mb-3 leading-relaxed">
                      {summary}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
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
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <MessageCircle className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {searchQuery ? 'No Calls Found' : 'No Calls Yet'}
          </h3>
          <p className="text-gray-600">
            {searchQuery
              ? 'Try a different search term'
              : 'Your call history will appear here after your first call with Aasha'}
          </p>
        </div>
      )}

      {/* Call Detail Modal */}
      {selectedCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {new Date(selectedCall.created_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-gray-600 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Duration: {formatDuration(selectedCall.duration_seconds)}
                    </p>
                    <SentimentIndicator
                      sentiment={selectedCall.call_analysis?.[0]?.user_sentiment}
                      size="medium"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCloseDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Summary */}
                {(() => {
                  const summaryText = (selectedCall.call_analysis?.[0]?.call_summary && selectedCall.call_analysis[0].call_summary.trim().length > 0 ? selectedCall.call_analysis[0].call_summary : null) ||
                                    (selectedCall.llm_call_summary && selectedCall.llm_call_summary.trim().length > 0 ? selectedCall.llm_call_summary : null);
                  return summaryText ? (
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-3">Call Summary</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 leading-relaxed">
                          {summaryText}
                        </p>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Full Transcript */}
                {(() => {
                  const transcriptText = selectedCall.call_transcripts?.[0]?.transcript_text && selectedCall.call_transcripts[0].transcript_text.trim().length > 0 ? selectedCall.call_transcripts[0].transcript_text : null;
                  return transcriptText ? (
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-3">Full Transcript</h4>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <pre className="text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
                          {transcriptText}
                        </pre>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={handleCloseDetails}
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

export default ConversationsSection;
