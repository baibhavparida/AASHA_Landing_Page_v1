import React, { useState, useEffect } from 'react';
import { Bell, AlertCircle, CheckCircle, X, Filter } from 'lucide-react';
import { getFamilyAlerts, acknowledgeAlert } from '../../services/familyDashboardService';

interface FamilyAlertsSectionProps {
  elderlyProfile: {
    id: string;
    first_name: string;
  };
  setUnreadAlertsCount: (count: number) => void;
}

const FamilyAlertsSection: React.FC<FamilyAlertsSectionProps> = ({ elderlyProfile, setUnreadAlertsCount }) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [elderlyProfile.id, showAcknowledged]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await getFamilyAlerts(elderlyProfile.id, !showAcknowledged);
      setAlerts(data);
      const unreadCount = data.filter((a: any) => !a.is_acknowledged).length;
      setUnreadAlertsCount(unreadCount);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId);
      loadAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50 text-red-900';
      case 'high': return 'border-orange-500 bg-orange-50 text-orange-900';
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-900';
      case 'low': return 'border-blue-500 bg-blue-50 text-blue-900';
      default: return 'border-gray-500 bg-gray-50 text-gray-900';
    }
  };

  const getSeverityIcon = (severity: string) => {
    return <AlertCircle className="h-5 w-5" />;
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: any = {
      medication_missed: 'Medication Missed',
      no_conversation: 'No Conversation',
      mood_change: 'Mood Change',
      health_concern: 'Health Concern',
      system_notification: 'System Notification',
    };
    return labels[type] || type;
  };

  const filteredAlerts = filterSeverity === 'all'
    ? alerts
    : alerts.filter(alert => alert.severity === filterSeverity);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#F35E4A]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filter by severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#F35E4A]"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAcknowledged}
              onChange={(e) => setShowAcknowledged(e.target.checked)}
              className="w-5 h-5 text-[#F35E4A] border-gray-300 rounded focus:ring-[#F35E4A]"
            />
            <span className="text-sm font-medium text-gray-700">Show acknowledged</span>
          </label>
        </div>
      </div>

      {filteredAlerts.length > 0 ? (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 rounded-lg p-6 ${getSeverityColor(alert.severity)} ${
                alert.is_acknowledged ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getSeverityIcon(alert.severity)}
                    <h3 className="text-lg font-semibold">{alert.title}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                      {getAlertTypeLabel(alert.alert_type)}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50 uppercase font-semibold">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="mb-3">{alert.description}</p>
                  <div className="flex items-center gap-4 text-sm opacity-75">
                    <span>Created: {new Date(alert.created_at).toLocaleString()}</span>
                    {alert.is_acknowledged && alert.acknowledged_at && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Acknowledged: {new Date(alert.acknowledged_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                {!alert.is_acknowledged && (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="ml-4 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-semibold flex items-center gap-2"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md p-12 text-center">
          <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No alerts</h3>
          <p className="text-gray-600">
            {showAcknowledged
              ? 'No alerts match your filter criteria'
              : 'All alerts have been acknowledged'}
          </p>
        </div>
      )}

      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-6">
        <div className="flex items-start">
          <AlertCircle className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">About Alerts</h4>
            <p className="text-blue-800 text-sm">
              You'll receive alerts when important events occur, such as missed medications, extended periods without conversation,
              or potential health concerns detected during calls. Critical alerts require immediate attention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyAlertsSection;
