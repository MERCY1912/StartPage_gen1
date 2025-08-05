import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ru' | 'en';

interface Translations {
  [key: string]: string | Translations;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ru');
  const [translations, setTranslations] = useState<Translations>({});

  // Load translations
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        let translationData: Translations = {};
        
        if (language === 'ru') {
          const ruTranslations = await import('../locales/ru.json');
          translationData = ruTranslations.default || ruTranslations;
        } else {
          const enTranslations = await import('../locales/en.json');
          translationData = enTranslations.default || enTranslations;
        }
        
        setTranslations(translationData);
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback translations
        setTranslations({});
      }
    };

    loadTranslations();
  }, [language]);

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('mystical-ai-language') as Language;
    if (savedLanguage && (savedLanguage === 'ru' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('mystical-ai-language', lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  const value = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};