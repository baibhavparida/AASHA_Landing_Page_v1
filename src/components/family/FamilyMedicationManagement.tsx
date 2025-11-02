import React from 'react';
import { Pill } from 'lucide-react';
import MedicationsSection from '../dashboard/MedicationsSection';

interface FamilyMedicationManagementProps {
  elderlyProfile: any;
}

const FamilyMedicationManagement: React.FC<FamilyMedicationManagementProps> = ({ elderlyProfile }) => {
  return (
    <MedicationsSection elderlyProfile={elderlyProfile} />
  );
};

export default FamilyMedicationManagement;
