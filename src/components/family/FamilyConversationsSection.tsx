import React from 'react';
import ConversationsSection from '../dashboard/ConversationsSection';

interface FamilyConversationsSectionProps {
  elderlyProfile: any;
  onUpdate: () => void;
}

const FamilyConversationsSection: React.FC<FamilyConversationsSectionProps> = ({ elderlyProfile, onUpdate }) => {
  return (
    <ConversationsSection elderlyProfile={elderlyProfile} onUpdate={onUpdate} />
  );
};

export default FamilyConversationsSection;
