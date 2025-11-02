import React from 'react';
import { Calendar } from 'lucide-react';
import SpecialEventsSection from '../dashboard/SpecialEventsSection';

interface FamilyEventsSectionProps {
  elderlyProfile: any;
}

const FamilyEventsSection: React.FC<FamilyEventsSectionProps> = ({ elderlyProfile }) => {
  return (
    <SpecialEventsSection elderlyProfile={elderlyProfile} />
  );
};

export default FamilyEventsSection;
