import React, { useState, useEffect } from 'react';
import { Pill, Plus, Edit2, Trash2, X } from 'lucide-react';
import {
  getMedications,
  addMedication,
  updateMedication,
  deleteMedication,
} from '../../services/dashboardService';

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
  const [formData, setFormData] = useState({
    name: '',
    dosage_quantity: 1,
    times_of_day: [] as string[],
  });

  useEffect(() => {
    loadMedications();
  }, [elderlyProfile.id]);

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

      {/* Medications List */}
      {medications.length > 0 ? (
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
};

export default MedicationsSection;
