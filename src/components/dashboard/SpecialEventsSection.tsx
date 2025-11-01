import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, Gift, Heart, Stethoscope, Users, Sun, Star, X, Save } from 'lucide-react';
import { getSpecialEvents, addSpecialEvent, updateSpecialEvent, deleteSpecialEvent } from '../../services/dashboardService';

interface SpecialEventsSectionProps {
  elderlyProfile: {
    id: string;
  };
}

const SpecialEventsSection: React.FC<SpecialEventsSectionProps> = ({ elderlyProfile }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    event_name: '',
    event_date: '',
    event_type: 'other' as 'birthday' | 'anniversary' | 'appointment' | 'family_visit' | 'holiday' | 'other',
    description: '',
    is_recurring: false,
  });

  const eventTypeIcons: { [key: string]: any } = {
    birthday: Gift,
    anniversary: Heart,
    appointment: Stethoscope,
    family_visit: Users,
    holiday: Sun,
    other: Star,
  };

  useEffect(() => {
    loadEvents();
  }, [elderlyProfile.id]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getSpecialEvents(elderlyProfile.id);
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addSpecialEvent({
        elderly_profile_id: elderlyProfile.id,
        ...formData,
      });
      await loadEvents();
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Failed to add event');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    try {
      await updateSpecialEvent(selectedEvent.id, formData);
      await loadEvents();
      setShowEditModal(false);
      setSelectedEvent(null);
      resetForm();
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteSpecialEvent(id);
      await loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  const openEditModal = (event: any) => {
    setSelectedEvent(event);
    setFormData({
      event_name: event.event_name,
      event_date: event.event_date,
      event_type: event.event_type,
      description: event.description || '',
      is_recurring: event.is_recurring,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      event_name: '',
      event_date: '',
      event_type: 'other',
      description: '',
      is_recurring: false,
    });
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedEvent(null);
    resetForm();
  };

  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    const eventDate = new Date(dateString);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const upcomingEvents = events.filter((event) => getDaysUntil(event.event_date) >= 0);
  const pastEvents = events.filter((event) => getDaysUntil(event.event_date) < 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#F35E4A]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center bg-[#F35E4A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e54d37] transition-all shadow-md"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Event
        </button>
      </div>

      {/* Upcoming Events */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-6">Upcoming Events</h3>
        {upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => {
              const Icon = eventTypeIcons[event.event_type];
              const daysUntil = getDaysUntil(event.event_date);
              return (
                <div key={event.id} className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-100 hover:border-[#F35E4A] transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start">
                      <div className="bg-[#F35E4A] bg-opacity-10 rounded-lg p-3 mr-3">
                        <Icon className="h-6 w-6 text-[#F35E4A]" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{event.event_name}</h4>
                        <p className="text-sm text-gray-600 capitalize">{event.event_type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(event)}
                        className="text-gray-500 hover:text-[#F35E4A] transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-700">
                      <Calendar className="h-4 w-4 mr-2 text-[#F35E4A]" />
                      <span>
                        {new Date(event.event_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                    )}
                    {event.is_recurring && (
                      <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mt-2">
                        Recurring Annually
                      </span>
                    )}
                  </div>

                  {daysUntil === 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-[#F35E4A] font-bold text-center">Today!</p>
                    </div>
                  )}
                  {daysUntil > 0 && daysUntil <= 7 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-orange-600 font-semibold text-center">In {daysUntil} {daysUntil === 1 ? 'day' : 'days'}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No upcoming events</p>
          </div>
        )}
      </div>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-6">Past Events</h3>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="space-y-3">
              {pastEvents.map((event) => {
                const Icon = eventTypeIcons[event.event_type];
                return (
                  <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Icon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-semibold text-gray-900">{event.event_name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(event.event_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {events.length === 0 && (
        <div className="bg-white rounded-2xl shadow-md p-12 text-center">
          <Calendar className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Events Yet</h3>
          <p className="text-gray-600 mb-6">Start by adding your first special event</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#F35E4A] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#e54d37] transition-all"
          >
            Add Your First Event
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {showAddModal ? 'Add New Event' : 'Edit Event'}
            </h3>
            <form onSubmit={showAddModal ? handleAdd : handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Event Name</label>
                <input
                  type="text"
                  value={formData.event_name}
                  onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#F35E4A] focus:outline-none text-lg"
                  placeholder="e.g., Birthday Celebration"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Event Date</label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#F35E4A] focus:outline-none text-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Event Type</label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value as any })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#F35E4A] focus:outline-none text-lg"
                  required
                >
                  <option value="birthday">Birthday</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="appointment">Appointment</option>
                  <option value="family_visit">Family Visit</option>
                  <option value="holiday">Holiday</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#F35E4A] focus:outline-none text-lg"
                  placeholder="Add any additional details..."
                  rows={3}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  className="h-5 w-5 text-[#F35E4A] rounded border-gray-300 focus:ring-[#F35E4A]"
                />
                <label htmlFor="recurring" className="ml-3 text-sm font-medium text-gray-700">
                  Repeat this event annually
                </label>
              </div>

              <div className="flex items-center gap-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-[#F35E4A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e54d37] transition-all"
                >
                  {showAddModal ? 'Add Event' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialEventsSection;
