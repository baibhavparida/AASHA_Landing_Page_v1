import React from 'react';
import { Heart } from 'lucide-react';
import InterestsSection from '../dashboard/InterestsSection';

interface FamilyInterestsSectionProps {
  elderlyProfile: any;
}

const FamilyInterestsSection: React.FC<FamilyInterestsSectionProps> = ({ elderlyProfile }) => {
  return (
    <InterestsSection elderlyProfile={elderlyProfile} />
  );
};

export default FamilyInterestsSection;
