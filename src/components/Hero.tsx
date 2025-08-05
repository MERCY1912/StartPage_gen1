import React from 'react';
import { Sparkles, Heart, MessageCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const Hero: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="relative z-10 px-4 py-12 sm:py-16 lg:py-20 sm:px-6 lg:px-8 text-center">
      <div className="max-w-4xl mx-auto relative">
        <Heart className="absolute top-0 left-0 w-12 h-12 text-bubblegum-pink opacity-70 animate-pulse" />
        <Sparkles className="absolute top-0 right-0 w-16 h-16 text-lavender opacity-70 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <MessageCircle className="absolute bottom-0 left-1/4 w-10 h-10 text-bright-peach opacity-70 animate-pulse" style={{ animationDelay: '1s' }} />
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-black mb-4 sm:mb-6 leading-tight">
          {t('hero.title')}
          <span className="block text-bubblegum-pink">
            {t('hero.titleHighlight')}
          </span>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-black mb-8 sm:mb-10 lg:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
          {t('hero.description')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 lg:gap-6">
          <div className="flex items-center space-x-2 text-bubblegum-pink">
            <div className="w-2 h-2 bg-bubblegum-pink rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium">{t('hero.aiPowered')}</span>
          </div>
          <div className="flex items-center space-x-2 text-lavender">
            <div className="w-2 h-2 bg-lavender rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium">{t('hero.trustedUsers')}</span>
          </div>
        </div>
      </div>
    </section>
  );
};