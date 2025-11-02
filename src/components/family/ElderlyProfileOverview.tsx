import React from 'react';
import { User, Phone, Calendar as CalendarIcon, Heart, Globe } from 'lucide-react';
import ProfileSection from '../dashboard/ProfileSection';

interface ElderlyProfileOverviewProps {
  elderlyProfile: any;
  onUpdate: () => void;
}

const ElderlyProfileOverview: React.FC<ElderlyProfileOverviewProps> = ({ elderlyProfile, onUpdate }) => {
  return (
    <div className="space-y-8">
      <ProfileSection elderlyProfile={elderlyProfile} onUpdate={onUpdate} />
    </div>
  );
};

export default ElderlyProfileOverview;
