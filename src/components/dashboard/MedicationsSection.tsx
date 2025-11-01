import React, { useState, useEffect } from 'react';
import { Pill, Plus, Edit2, Trash2, X, Calendar, Check, X as XIcon, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getMedications,
  addMedication,
  updateMedication,
  deleteMedication,
} from '../../services/dashboardService';
import { getMedicationTracking, updateMedicationStatus } from '../../services/medicationTrackingService';

interface MedicationsSectionProps {
  elderlyProfile: {
    id: string;
  };
}

const MedicationsSection: React.FC<MedicationsSectionProps> = ({ elderlyProfile }) => {
  const [medications, setMedications] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTracking, setShowTracking] = useState(true);
  const [trackingData, setTrackingData] = useState<any[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [formData, setFormData] = useState({
    name: '',
    dosage_quantity: 1,
    times_of_day: [] as string[],
  });

  useEffect(() => {
    loadMedications();
    loadTrackingData();
  }, [elderlyProfile.id, currentWeekStart]);

  function getWeekStart(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  function getWeekDays(startDate: Date) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  }

  const loadTrackingData = async () => {
    try {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const data = await getMedicationTracking(elderlyProfile.id, currentWeekStart, weekEnd);
      setTrackingData(data);
    } catch (error) {
      console.error('Error loading tracking data:', error);
    }
  };

  const loadMedications = async () => {
    try {
      setLoading(true);
      const data = await getMedications(elderlyProfile.id);
      setMedications(data);
    } catch (error) {
      console.error('Error loading medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTimeOfDay = (time: string) => {
    setFormData(prev => ({
      ...prev,
      times_of_day: prev.times_of_day.includes(time)
        ? prev.times_of_day.filter(t => t !== time)
        : [...prev.times_of_day, time]
    }));
  };

  const incrementDosage = () => {
    setFormData(prev => ({ ...prev, dosage_quantity: prev.dosage_quantity + 1 }));
  };

  const decrementDosage = () => {
    setFormData(prev => ({ ...prev, dosage_quantity: Math.max(1, prev.dosage_quantity - 1) }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.times_of_day.length === 0) {
      alert('Please select at least one time of day');
      return;
    }
    try {
      await addMedication({
        elderly_profile_id: elderlyProfile.id,
        ...formData,
      });
      await loadMedications();
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding medication:', error);
      alert('Failed to add medication');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed) return;
    if (formData.times_of_day.length === 0) {
      alert('Please select at least one time of day');
      return;
    }
    try {
      await updateMedication(selectedMed.id, formData);
      await loadMedications();
      setShowEditModal(false);
      setSelectedMed(null);
      resetForm();
    } catch (error) {
      console.error('Error updating medication:', error);
      alert('Failed to update medication');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this medication?')) return;
    try {
      await deleteMedication(id);
      await loadMedications();
    } catch (error) {
      console.error('Error deleting medication:', error);
      alert('Failed to delete medication');
    }
  };

  const openEditModal = (med: any) => {
    setSelectedMed(med);
    setFormData({
      name: med.name,
      dosage_quantity: med.dosage_quantity,
      times_of_day: med.times_of_day || [],
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      dosage_quantity: 1,
      times_of_day: [],
    });
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedMed(null);
    resetForm();
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Medications</h2>
          <p className="text-gray-600 mt-2">Manage your daily medications</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center bg-[#F35E4A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e54d37] transition-all shadow-md"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Medication
        </button>
      </div>

      {/* Tracking Toggle */}
      {medications.length > 0 && (
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => setShowTracking(false)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              !showTracking
                ? 'bg-[#F35E4A] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Medications List
          </button>
          <button
            onClick={() => setShowTracking(true)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center ${
              showTracking
                ? 'bg-[#F35E4A] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calendar className="h-5 w-5 mr-2" />
            Weekly Tracking
          </button>
        </div>
      )}

      {/* Weekly Tracking Calendar */}
      {showTracking && medications.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                const newDate = new Date(currentWeekStart);
                newDate.setDate(newDate.getDate() - 7);
                setCurrentWeekStart(newDate);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            </button>
            <h3 className="text-xl font-bold text-gray-900">
              {currentWeekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - {' '}
              {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
            <button
              onClick={() => {
                const newDate = new Date(currentWeekStart);
                newDate.setDate(newDate.getDate() + 7);
                setCurrentWeekStart(newDate);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <ChevronRight className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-4 border-b-2 border-gray-200 font-semibold text-gray-700">Medication</th>
                  {getWeekDays(currentWeekStart).map((day, idx) => (
                    <th key={idx} className="text-center p-4 border-b-2 border-gray-200 min-w-[100px]">
                      <div className="text-sm font-semibold text-gray-700">
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trackingData.map((medData) => (
                  <React.Fragment key={medData.id}>
                    {(medData.times_of_day || []).map((time: string, timeIdx: number) => (
                      <tr key={`${medData.id}-${time}`} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className="bg-[#F35E4A] bg-opacity-10 rounded-lg p-2 mr-3">
                              <Pill className="h-4 w-4 text-[#F35E4A]" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{medData.name}</div>
                              <div className="text-xs text-gray-600">{time}</div>
                            </div>
                          </div>
                        </td>
                        {getWeekDays(currentWeekStart).map((day, dayIdx) => {
                          const tracking = medData.trackings?.find((t: any) => {
                            const trackingDate = new Date(t.scheduled_datetime);
                            return (
                              trackingDate.toDateString() === day.toDateString() &&
                              t.scheduled_datetime.includes(getTimeOfDayHour(time))
                            );
                          });

                          return (
                            <td key={dayIdx} className="p-4 text-center">
                              {tracking ? (
                                <div className="flex items-center justify-center">
                                  {tracking.status === 'taken' && (
                                    <div className="bg-green-100 rounded-full p-2" title="Taken">
                                      <Check className="h-5 w-5 text-green-600" />
                                    </div>
                                  )}
                                  {tracking.status === 'missed' && (
                                    <div className="bg-red-100 rounded-full p-2" title="Missed">
                                      <XIcon className="h-5 w-5 text-red-600" />
                                    </div>
                                  )}
                                  {tracking.status === 'skipped' && (
                                    <div className="bg-yellow-100 rounded-full p-2" title={tracking.notes || 'Skipped'}>
                                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-gray-300">
                                  <div className="w-8 h-8 mx-auto bg-gray-100 rounded-full"></div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="bg-green-100 rounded-full p-2">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-gray-700">Taken</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-red-100 rounded-full p-2">
                <XIcon className="h-4 w-4 text-red-600" />
              </div>
              <span className="text-gray-700">Missed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-yellow-100 rounded-full p-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </div>
              <span className="text-gray-700">Skipped</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
              <span className="text-gray-700">No Data</span>
            </div>
          </div>
        </div>
      )}

      {/* Medications List */}
      {!showTracking && medications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medications.map((med) => (
            <div key={med.id} className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-100 hover:border-[#F35E4A] transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start">
                  <div className="bg-[#F35E4A] bg-opacity-10 rounded-lg p-3 mr-3">
                    <Pill className="h-6 w-6 text-[#F35E4A]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{med.name}</h3>
                    <p className="text-sm text-gray-600">
                      {med.dosage_quantity} {med.dosage_quantity === 1 ? 'tablet' : 'tablets'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(med)}
                    className="text-gray-500 hover:text-[#F35E4A] transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(med.id)}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mb-2">
                <p className="text-sm text-gray-600 mb-2">Times of Day:</p>
                <div className="flex flex-wrap gap-2">
                  {(med.times_of_day || []).map((time: string) => (
                    <span key={time} className="bg-[#F35E4A] bg-opacity-10 text-[#F35E4A] px-3 py-1 rounded-full text-sm font-medium">
                      {time}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md p-12 text-center">
          <Pill className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Medications Yet</h3>
          <p className="text-gray-600 mb-6">Start by adding your first medication</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#F35E4A] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#e54d37] transition-all"
          >
            Add Your First Medication
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {showAddModal ? 'Add New Medication' : 'Edit Medication'}
              </h3>
              <button
                onClick={closeModals}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleAdd : handleEdit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Medication Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#F35E4A] focus:outline-none text-lg"
                  placeholder="e.g., Aspirin"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Dosage Quantity</label>
                  <div className="flex items-center justify-between bg-gray-50 border-2 border-gray-200 rounded-lg px-6 py-3">
                    <button
                      type="button"
                      onClick={decrementDosage}
                      className="text-gray-600 hover:text-gray-900 text-2xl font-bold w-8 h-8 flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="text-2xl font-semibold text-gray-900">{formData.dosage_quantity}</span>
                    <button
                      type="button"
                      onClick={incrementDosage}
                      className="text-gray-600 hover:text-gray-900 text-2xl font-bold w-8 h-8 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Times of Day</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Morning', 'Afternoon', 'Evening', 'Night'].map((time) => (
                      <label
                        key={time}
                        className="flex items-center space-x-2 cursor-pointer bg-gray-50 border-2 border-gray-200 rounded-lg px-3 py-2 hover:border-[#F35E4A] transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={formData.times_of_day.includes(time)}
                          onChange={() => toggleTimeOfDay(time)}
                          className="w-4 h-4 text-[#F35E4A] border-gray-300 rounded focus:ring-[#F35E4A]"
                        />
                        <span className="text-sm text-gray-700">{time}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#F35E4A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e54d37] transition-all"
                >
                  {showAddModal ? 'Add Medication' : 'Save Changes'}
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

  function getTimeOfDayHour(timeOfDay: string): string {
    const timeMap: { [key: string]: string } = {
      'Morning': '08:',
      'Afternoon': '13:',
      'Evening': '20:',
      'Night': '22:'
    };
    return timeMap[timeOfDay] || '08:';
  }
};

export default MedicationsSection;
