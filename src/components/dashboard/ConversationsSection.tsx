import React, { useState, useEffect } from 'react';
import { MessageCircle, Clock, Search, ChevronRight, X, FileText } from 'lucide-react';
import { getCalls, getCall } from '../../services/dashboardService';

interface ConversationsSectionProps {
  elderlyProfile: {
    id: string;
  };
}

const ConversationsSection: React.FC<ConversationsSectionProps> = ({ elderlyProfile }) => {
  const [calls, setCalls] = useState<any[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<any[]>([]);
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalls();
  }, [elderlyProfile.id]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCalls(calls);
    } else {
      const filtered = calls.filter(
        (call) => {
          const summary = call.call_analysis?.[0]?.call_summary || call.call_transcripts?.[0]?.llm_call_summary || '';
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
      setCalls(data);
      setFilteredCalls(data);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#F35E4A]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">My Calls</h2>
        <p className="text-gray-600">Review your call history with Aasha</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-4">
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
            const summary = analysis?.call_summary || call.call_transcripts?.[0]?.llm_call_summary || 'No summary available';
            return (
              <div
                key={call.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleViewDetails(call)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1">
                    <div className="bg-[#F35E4A] bg-opacity-10 rounded-lg p-3 mr-4">
                      <MessageCircle className="h-6 w-6 text-[#F35E4A]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {new Date(call.created_at).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </h3>
                        <span className="ml-3 flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDuration(call.duration_seconds)}
                        </span>
                      </div>
                      <p className="text-gray-600 line-clamp-2">{summary}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-gray-400 ml-4 flex-shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md p-12 text-center">
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
                    Duration: {formatDuration(selectedCall.duration_seconds)}
                  </p>
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
