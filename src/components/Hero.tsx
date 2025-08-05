import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const Hero: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="relative z-10 px-4 py-12 sm:py-16 lg:py-20 sm:px-6 lg:px-8 text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold text-white mb-4 sm:mb-6 leading-tight">
          {t('hero.title')}
          <span className="block bg-gradient-to-r from-purple-400 via-rose-400 to-amber-400 bg-clip-text text-transparent">
            {t('hero.titleHighlight')}
          </span>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-rose-100 mb-8 sm:mb-10 lg:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
          {t('hero.description')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 lg:gap-6">
          <div className="flex items-center space-x-2 text-pink-300">
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium">{t('hero.aiPowered')}</span>
          </div>
          <div className="flex items-center space-x-2 text-amber-300">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium">{t('hero.trustedUsers')}</span>
          </div>
        </div>
      </div>
    </section>
  );
};