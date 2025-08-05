import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const Hero: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="relative z-10 px-4 py-12 sm:py-16 lg:py-20 sm:px-6 lg:px-8 text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-black mb-4 sm:mb-6 leading-tight">
          {t('hero.title')}
          <span className="block">
            {t('hero.titleHighlight')}
          </span>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-500 mb-8 sm:mb-10 lg:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
          {t('hero.description')}
        </p>
      </div>
    </section>
  );
};