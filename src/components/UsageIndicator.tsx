import React from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface UsageIndicatorProps {
  usage: {
    count: number;
    isAnonymous: boolean;
  };
  remaining: number;
  onAuthClick: () => void;
}

export const UsageIndicator: React.FC<UsageIndicatorProps> = ({ 
  usage, 
  remaining, 
  onAuthClick 
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-center space-x-3 text-sm">
      <div className="flex items-center space-x-2">
        <div className="text-slate-400">
          {usage.isAnonymous ? (
            <>{t('usage.anonymous')} <span className="text-white font-medium">{remaining}/5</span></>
          ) : (
            <>{t('usage.remaining')} <span className="text-white font-medium">{remaining}/10</span></>
          )}
        </div>
        {remaining <= 2 && (
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
        )}
      </div>
      
      {remaining === 0 && usage.isAnonymous && (
        <button
          onClick={onAuthClick}
          className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 flex items-center space-x-1 text-xs"
        >
          <User className="w-3 h-3" />
          <span>{t('usage.register')}</span>
        </button>
      )}
    </div>
  );
};