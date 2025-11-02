import React from 'react';
import { Settings } from 'lucide-react';
import SettingsSection from '../dashboard/SettingsSection';

interface FamilySettingsSectionProps {
  elderlyProfile: any;
}

const FamilySettingsSection: React.FC<FamilySettingsSectionProps> = ({ elderlyProfile }) => {
  return (
    <SettingsSection elderlyProfile={elderlyProfile} />
  );
};

export default FamilySettingsSection;
