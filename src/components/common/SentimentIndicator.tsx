import React from 'react';
import { Smile, Meh, Frown } from 'lucide-react';

type Sentiment = 'Positive' | 'Negative' | 'Neutral' | null | undefined;

interface SentimentIndicatorProps {
  sentiment: Sentiment;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const SentimentIndicator: React.FC<SentimentIndicatorProps> = ({
  sentiment,
  size = 'small',
  showLabel = true
}) => {
  const displaySentiment = sentiment || 'Neutral';

  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-5 w-5',
    large: 'h-6 w-6',
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  const paddingClasses = {
    small: 'px-2 py-1',
    medium: 'px-3 py-1.5',
    large: 'px-4 py-2',
  };

  const getSentimentConfig = () => {
    switch (displaySentiment) {
      case 'Positive':
        return {
          icon: Smile,
          bgColor: 'bg-green-100',
          iconColor: 'text-green-600',
          textColor: 'text-green-700',
          label: 'Positive',
        };
      case 'Neutral':
        return {
          icon: Meh,
          bgColor: 'bg-gray-100',
          iconColor: 'text-gray-600',
          textColor: 'text-gray-700',
          label: 'Neutral',
        };
      case 'Negative':
        return {
          icon: Frown,
          bgColor: 'bg-amber-100',
          iconColor: 'text-amber-700',
          textColor: 'text-amber-800',
          label: 'Negative',
        };
      default:
        return {
          icon: Meh,
          bgColor: 'bg-gray-100',
          iconColor: 'text-gray-600',
          textColor: 'text-gray-700',
          label: 'Neutral',
        };
    }
  };

  const config = getSentimentConfig();

  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full ${config.bgColor} ${paddingClasses[size]}`}
    >
      <Icon className={`${sizeClasses[size]} ${config.iconColor}`} />
      {showLabel && (
        <span className={`font-semibold ${textSizeClasses[size]} ${config.textColor}`}>
          {config.label}
        </span>
      )}
    </div>
  );
};

export default SentimentIndicator;
