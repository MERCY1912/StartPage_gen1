import React from 'react';
import ReactDOM from 'react-dom';
import { Sparkles, Menu, X, Globe, Music, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { AuthModal } from './AuthModal';
import { UsageTracker } from '../utils/usageTracker';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isAtmosphereMode, setIsAtmosphereMode] = React.useState<boolean>(false);
  const [showAtmosphereTooltip, setShowAtmosphereTooltip] = React.useState<boolean>(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handleAuthAction = async () => {
    if (user) {
      await signOut();
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = async () => {
    // Refresh usage data after successful authentication
    try {
      const { data: { user: currentUser } } = await import('../supabaseClient').then(m => m.supabase.auth.getUser());
      if (currentUser) {
        await UsageTracker.migrateAnonymousUsage(currentUser.id);
      }
    } catch (error) {
      console.error('Error during auth success:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Эффект для управления фоновой музыкой
  React.useEffect(() => {
    if (isAtmosphereMode) {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://ygpenhsaqtaoxmjaruad.supabase.co/storage/v1/object/public/audio//background_ambient.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.3; // Тихий фоновый звук
      }
      
      const playAudio = async () => {
        try {
          await audioRef.current?.play();
        } catch (error) {
          console.warn('Не удалось воспроизвести аудио (возможно, заблокировано браузером):', error);
        }
      };
      
      playAudio();
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }

    // Очистка при размонтировании компонента
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [isAtmosphereMode]);

  return (
    <>
      <header className="relative z-10 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <a href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200">
          <div className="w-10 h-10 bg-gradient-to-br from-blush-pink to-peach rounded-full flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-700">
            {t('footer.brandName')}
          </h1>
        </a>
        
        {/* Right side controls */}
        <div className="hidden sm:flex items-center space-x-8">
          {/* Atmosphere Toggle */}
          <div className="flex items-center space-x-2">
            <Music className={`w-4 h-4 transition-colors duration-300 ${isAtmosphereMode ? 'text-peach' : 'text-gray-400'}`} />
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowAtmosphereTooltip(true)}
                onMouseLeave={() => setShowAtmosphereTooltip(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <HelpCircle className="w-3 h-3" />
              </button>
              {showAtmosphereTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-creamy-white border border-gray-200 rounded-lg text-xs text-gray-700 whitespace-nowrap shadow-lg z-50">
                  {t('interactive.atmosphereModeTooltip')}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-creamy-white"></div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsAtmosphereMode(!isAtmosphereMode)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-peach/50 ${
                isAtmosphereMode ? 'bg-blush-pink' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 ${
                  isAtmosphereMode ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {/* Language Toggle */}
          <div className="flex items-center space-x-2 bg-creamy-white/50 backdrop-blur-sm border border-white/10 rounded-full p-1">
          <Globe className="w-4 h-4 text-gray-400 ml-2" />
          <button
            onClick={() => setLanguage('ru')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
              language === 'ru'
                ? 'bg-blush-pink text-white shadow-lg'
                : 'text-gray-700 hover:bg-blush-pink/50'
            }`}
          >
            RU
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
              language === 'en'
                ? 'bg-blush-pink text-white shadow-lg'
                : 'text-gray-700 hover:bg-blush-pink/50'
            }`}
          >
            ENG
          </button>
        </div>
        </div>
        
        <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6">
          <a href="#support" className="relative group font-medium text-gray-700 hover:text-peach transition-colors duration-200">
            {t('nav.support')}
          </a>
          <a href="#about" className="text-gray-700 hover:text-peach transition-colors duration-200">
            {t('nav.about')}
          </a>
          <a href="#articles" className="text-gray-700 hover:text-peach transition-colors duration-200">
            {t('nav.articles')}
          </a>
          <button 
            onClick={handleAuthAction}
            className="px-4 lg:px-6 py-2 text-white rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg text-sm lg:text-base flex items-center space-x-2 bg-gradient-to-r from-blush-pink to-peach hover:from-blush-pink/90 hover:to-peach/90 shadow-blush-pink/25"
          >
            <span>{user ? t('logout') : t('login')}</span>
          </button>
        </nav>

        <button 
          onClick={toggleMobileMenu}
          className="lg:hidden text-gray-700 hover:text-peach transition-colors"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && ReactDOM.createPortal(
          <div className="fixed top-0 left-0 right-0 bottom-0 lg:hidden z-[9999] pt-20">
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="relative bg-creamy-white/95 backdrop-blur-md border-t border-white/10 shadow-lg">
              <nav className="px-4 py-6 space-y-4">
                {/* Mobile Language Toggle */}
                <div className="space-y-6 mb-4">
                  {/* Mobile Atmosphere Toggle */}
                  <div className="flex items-center justify-center space-x-3">
                    <Music className={`w-4 h-4 transition-colors duration-300 ${isAtmosphereMode ? 'text-peach' : 'text-gray-400'}`} />
                    <span className="text-sm text-gray-700">{t('interactive.atmosphereMode')}</span>
                    <button
                      type="button"
                      onClick={() => setIsAtmosphereMode(!isAtmosphereMode)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-peach/50 ${
                        isAtmosphereMode ? 'bg-blush-pink' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 ${
                          isAtmosphereMode ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {/* Mobile Language Toggle */}
                  <div className="flex items-center justify-center space-x-2 bg-creamy-white/50 backdrop-blur-sm border border-white/10 rounded-full p-1">
                  <Globe className="w-4 h-4 text-gray-400 ml-2" />
                  <button
                    onClick={() => {
                      setLanguage('ru');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                      language === 'ru'
                        ? 'bg-blush-pink text-white shadow-lg'
                        : 'text-gray-700 hover:bg-blush-pink/50'
                    }`}
                  >
                    RU
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('en');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                      language === 'en'
                        ? 'bg-blush-pink text-white shadow-lg'
                        : 'text-gray-700 hover:bg-blush-pink/50'
                    }`}
                  >
                    ENG
                  </button>
                </div>
                </div>
                
                <a 
                  href="#support"
                  className="block py-2 font-medium text-gray-700 hover:text-peach transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('nav.support')}
                </a>
                <a 
                  href="#about" 
                  className="block text-gray-700 hover:text-peach transition-colors duration-200 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('nav.about')}
                </a>
                <a 
                  href="#articles" 
                  className="block text-gray-700 hover:text-peach transition-colors duration-200 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('nav.articles')}
                </a>
                <button 
                  onClick={() => {
                    handleAuthAction();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-6 py-3 text-white rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg text-base flex items-center justify-center space-x-2 bg-gradient-to-r from-blush-pink to-peach hover:from-blush-pink/90 hover:to-peach/90 shadow-blush-pink/25 mt-4"
                >
                  <span>{user ? t('logout') : t('login')}</span>
                </button>
              </nav>
            </div>
          </div>
        , document.getElementById('modal-root')!)}
      </div>
      </header>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};