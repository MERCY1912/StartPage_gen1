import React from 'react';
import { Sparkles, Heart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="relative z-10 px-4 py-8 sm:py-12 sm:px-6 lg:px-8 border-t border-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-black flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-black">
              {t('footer.brandName')}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-gray-500 text-xs sm:text-sm">
            <span>{t('footer.createdWith')}</span>
            <span>{t('footer.forSeekers')}</span>
          </div>
        </div>
        
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200/50 text-center text-gray-400 text-xs sm:text-sm">
          <p>{t('footer.copyright')} | {t('footer.privacy')} | {t('footer.terms')}</p>
        </div>
      </div>
    </footer>
  );
};