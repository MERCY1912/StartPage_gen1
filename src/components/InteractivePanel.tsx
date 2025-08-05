import React, { useState } from 'react';
import { Heart, Send, Loader2, Copy, Check, HelpCircle, MessageSquare, BookOpen, Smile, Sparkles, User, Feather, Wind } from 'lucide-react';
import { UsageTracker, UsageData } from '../utils/usageTracker';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { UsageIndicator } from './UsageIndicator';
import { AuthModal } from './AuthModal';
import { getTarotCardsList, selectRandomCards, TarotCard } from '../utils/supabaseStorage';

interface Service {
  id: string;
  icon: any;
  titleKey: string;
  descriptionKey: string;
  placeholderKey: string;
}

const getServices = (): Service[] => [
  {
    id: 'talk',
    icon: MessageSquare,
    titleKey: 'interactive.services.talk.title',
    descriptionKey: 'interactive.services.talk.description',
    placeholderKey: 'interactive.services.talk.placeholder'
  },
  {
    id: 'advice',
    icon: HelpCircle,
    titleKey: 'interactive.services.advice.title',
    descriptionKey: 'interactive.services.advice.description',
    placeholderKey: 'interactive.services.advice.placeholder'
  },
  {
    id: 'journal',
    icon: BookOpen,
    titleKey: 'interactive.services.journal.title',
    descriptionKey: 'interactive.services.journal.description',
    placeholderKey: 'interactive.services.journal.placeholder'
  },
  {
    id: 'compliment',
    icon: Smile,
    titleKey: 'interactive.services.compliment.title',
    descriptionKey: 'interactive.services.compliment.description',
    placeholderKey: 'interactive.services.compliment.placeholder'
  },
  {
    id: 'style',
    icon: User,
    titleKey: 'interactive.services.style.title',
    descriptionKey: 'interactive.services.style.description',
    placeholderKey: 'interactive.services.style.placeholder'
  },
  {
    id: 'soft',
    icon: Feather,
    titleKey: 'interactive.services.soft.title',
    descriptionKey: 'interactive.services.soft.description',
    placeholderKey: 'interactive.services.soft.placeholder'
  },
  {
    id: 'oracle',
    icon: Sparkles,
    titleKey: 'interactive.services.oracle.title',
    descriptionKey: 'interactive.services.oracle.description',
    placeholderKey: 'interactive.services.oracle.placeholder'
  }
];

export const InteractivePanel: React.FC = () => {
  const { t } = useLanguage();
  const [selectedService, setSelectedService] = useState<string>('talk');
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string>('');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [meowMode, setMeowMode] = useState<boolean>(false);
  const [selectedCards, setSelectedCards] = useState<TarotCard[]>([]);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [showMeowTooltip, setShowMeowTooltip] = useState<boolean>(false);
  const [currentLoadingMessageIndex, setCurrentLoadingMessageIndex] = useState<number>(0);
  
  const { user, loading: authLoading } = useAuth();
  const services = getServices();

  const currentService = services.find(s => s.id === selectedService) || services[0];

  // Load usage data
  React.useEffect(() => {
    const loadUsage = async () => {
      if (authLoading) return;
      
      try {
        const usageData = await UsageTracker.getTodayUsage(user?.id);
        const remainingRequests = await UsageTracker.getRemainingRequests(user?.id);
        setUsage(usageData);
        setRemaining(remainingRequests);
      } catch (error) {
        console.error('Error loading usage data:', error);
      }
    };

    loadUsage();
  }, [user, authLoading]);

  // Эффект для смены текста загрузки каждые 2 секунды
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLoading) {
      const loadingMessages = t('interactive.buttons.loadingMessages');
      const messages = Array.isArray(loadingMessages) ? loadingMessages : [t('interactive.buttons.loading')];
      
      interval = setInterval(() => {
        setCurrentLoadingMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
      }, 2000);
    } else {
      setCurrentLoadingMessageIndex(0); // Сброс индекса при остановке загрузки
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading, t]);

  const refreshUsage = async () => {
    try {
      const usageData = await UsageTracker.getTodayUsage(user?.id);
      const remainingRequests = await UsageTracker.getRemainingRequests(user?.id);
      setUsage(usageData);
      setRemaining(remainingRequests);
    } catch (error) {
      console.error('Error refreshing usage data:', error);
    }
  };

  const getWebhookUrl = (serviceId: string, meowModeEnabled: boolean = false): string => {
    const webhookUrls = {
      talk: meowModeEnabled ? import.meta.env.VITE_N8N_WEBHOOK_TALK_MEOW : import.meta.env.VITE_N8N_WEBHOOK_TALK,
      advice: meowModeEnabled ? import.meta.env.VITE_N8N_WEBHOOK_ADVICE_MEOW : import.meta.env.VITE_N8N_WEBHOOK_ADVICE,
      journal: meowModeEnabled ? import.meta.env.VITE_N8N_WEBHOOK_JOURNAL_MEOW : import.meta.env.VITE_N8N_WEBHOOK_JOURNAL,
      compliment: meowModeEnabled ? import.meta.env.VITE_N8N_WEBHOOK_COMPLIMENT_MEOW : import.meta.env.VITE_N8N_WEBHOOK_COMPLIMENT,
      style: meowModeEnabled ? import.meta.env.VITE_N8N_WEBHOOK_STYLE_MEOW : import.meta.env.VITE_N8N_WEBHOOK_STYLE,
      soft: meowModeEnabled ? import.meta.env.VITE_N8N_WEBHOOK_SOFT_MEOW : import.meta.env.VITE_N8N_WEBHOOK_SOFT,
      oracle: meowModeEnabled ? import.meta.env.VITE_N8N_WEBHOOK_ORACLE_MEOW : import.meta.env.VITE_N8N_WEBHOOK_ORACLE,
    };
    
    return webhookUrls[serviceId as keyof typeof webhookUrls] || webhookUrls.talk;
  };

  const sendToN8N = async (serviceId: string, userInput: string, tarotCardNames?: string[], meowModeEnabled?: boolean): Promise<string> => {
  const webhookUrl = getWebhookUrl(serviceId, meowModeEnabled);
    
    // Проверяем наличие URL вебхука
    if (!webhookUrl || webhookUrl.includes('your-n8n-instance.com')) {
     const envVarName = meowModeEnabled ? `VITE_N8N_WEBHOOK_${serviceId.toUpperCase()}_MEOW` : `VITE_N8N_WEBHOOK_${serviceId.toUpperCase()}`;
      throw new Error(`Вебхук n8n для сервиса "${serviceId}"${meowModeEnabled ? ' (мяу-режим)' : ''} не настроен. Проверьте переменную окружения ${envVarName}`);
    }

    // Проверяем валидность URL
    try {
      new URL(webhookUrl);
    } catch (urlError) {
      throw new Error(`Некорректный URL вебхука для сервиса "${serviceId}": ${webhookUrl}`);
    }

    const payload: any = {
      service: serviceId,
      input: userInput,
      userId: user?.id || null,
      timestamp: new Date().toISOString(),
      userEmail: user?.email || null,
      meowMode: meowModeEnabled || false,
    };

    // Для таро добавляем выбранные карты
    if (serviceId === 'tarot' && tarotCardNames && tarotCardNames.length > 0) {
      payload.selectedCards = tarotCardNames.join(',');
    }

    console.log('Отправка запроса в n8n:', { webhookUrl, payload });
    
    let response;
    try {
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (fetchError) {
      console.error('Ошибка сети при подключении к n8n:', fetchError);
      
      // Определяем тип ошибки сети
      if (fetchError instanceof TypeError) {
        if (fetchError.message.includes('Failed to fetch')) {
          throw new Error(`Не удается подключиться к n8n по адресу: ${webhookUrl}. Проверьте:\n• Запущен ли n8n сервер\n• Правильность URL в .env файле\n• Настройки CORS в n8n`);
        }
      }
      
      throw new Error(`Ошибка сети: ${fetchError.message}`);
    }

    console.log('Ответ от n8n:', { status: response.status, statusText: response.statusText });
    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorBody = await response.text();
        console.error('Детали ошибки n8n:', errorBody);
        errorDetails = errorBody ? ` - ${errorBody}` : '';
      } catch (e) {
        console.error('Не удалось прочитать тело ошибки:', e);
      }
      throw new Error(`Ошибка n8n: ${response.status} ${response.statusText}${errorDetails}`);
    }

    let result;
    try {
      const responseText = await response.text();
      console.log('Сырой ответ от n8n:', responseText);
      
      // Попробуем распарсить JSON ответ
      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.log('Ответ не является JSON, используем как текст:', responseText);
          // Если это не JSON, используем как обычный текст
          return responseText;
        }
      } else {
        result = {};
      }
    } catch (e) {
      console.error('Ошибка парсинга JSON ответа от n8n:', e);
      throw new Error('Получен некорректный ответ от n8n');
    }

    // Обработка различных форматов ответа от n8n
    // Response hook может возвращать данные в разных форматах
    if (typeof result === 'string') {
      return result;
    }
    
    // Проверяем различные возможные поля ответа
    return result.message || 
           result.response || 
           result.text || 
           result.content ||
           result.output ||
           result.data ||
           (result.body && (result.body.message || result.body.response || result.body.text)) ||
           JSON.stringify(result) ||
           'Ответ получен от n8n';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Check if user can make request
    const canMake = await UsageTracker.canMakeRequest(user?.id);
    if (!canMake) {
      // Show auth modal for anonymous users, or just return for registered users
      if (!user) {
        setShowAuthModal(true);
      }
      return;
    }

    setIsLoading(true);
    setResult('');
    setSelectedCards([]);

    try {
      // Increment usage counter first
      await UsageTracker.incrementUsage(user?.id);
      
      // Refresh usage data
      await refreshUsage();

      let tarotCardNames: string[] | undefined;
      
      // Для таро-расклада выбираем случайные карты
      if (selectedService === 'tarot') {
        try {
          const allCards = await getTarotCardsList();
          if (allCards.length > 0) {
            const randomCards = selectRandomCards(allCards, 3);
            setSelectedCards(randomCards);
            tarotCardNames = randomCards.map(card => card.name);
          } else {
            console.warn('No tarot cards found in database');
          }
        } catch (error) {
          console.error('Error selecting tarot cards from database:', error);
          // Продолжаем без карт, если есть ошибка с получением карт
        }
      }

      // Send request to n8n webhook (with tarot cards if available)
      const response = await sendToN8N(selectedService, input.trim(), tarotCardNames, meowMode);
      setResult(response);
      
    } catch (error) {
      console.error('Error processing request:', error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Произошла ошибка при обработке запроса';
      setResult(`❌ ${errorMessage}`);
      setSelectedCards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    refreshUsage(); // Refresh usage after successful auth
  };

  const handleCopyText = async () => {
    if (!result) return;
    
    try {
      // Remove HTML tags for clean text copy
      const textContent = result.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      await navigator.clipboard.writeText(textContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      const textContent = result.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      textArea.value = textContent;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  if (authLoading || !usage) {
    return (
      <section className="relative z-10 px-4 py-8 sm:py-12 lg:py-16 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-creamy-white/50 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-blush-pink" />
                <span className="text-gray-600">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative z-10 px-4 py-8 sm:py-12 lg:py-16 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Input Panel */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className={`bg-creamy-white/50 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-6 lg:p-8 relative overflow-hidden shadow-lg ${meowMode ? 'soft-mode-active' : ''}`}>
              {/* Soft-mode sparkle */}
              {meowMode && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="soft-mode-light"></div>
                </div>
              )}
              
              <h3 className="text-xl sm:text-2xl font-serif font-semibold text-gray-700 mb-4 sm:mb-6 text-center">
                {t('interactive.title')}
              </h3>
              
              {/* Soft Mode Toggle */}
              <div className="flex items-center justify-center mb-4 sm:mb-6">
                <div className="flex items-center space-x-3">
                  <Feather className={`w-5 h-5 transition-colors duration-300 ${meowMode ? 'text-blush-pink' : 'text-gray-400'}`} />
                  <span className="text-sm text-gray-600">{t('interactive.meowMode')}</span>
                  <div className="relative">
                    <button
                      type="button"
                      onMouseEnter={() => setShowMeowTooltip(true)}
                      onMouseLeave={() => setShowMeowTooltip(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                    {showMeowTooltip && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-creamy-white border border-gray-200 rounded-lg text-xs text-gray-700 whitespace-nowrap shadow-lg z-50">
                        {t('interactive.meowModeTooltip')}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-creamy-white"></div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMeowMode(!meowMode);
                      setInput('');
                      setResult('');
                      setSelectedCards([]);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blush-pink/50 ${
                      meowMode ? 'bg-blush-pink' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                        meowMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              
              {/* Usage Indicator */}
              <div className="mb-4 sm:mb-6">
                <UsageIndicator 
                  usage={usage}
                  remaining={remaining}
                  onAuthClick={() => setShowAuthModal(true)}
                />
              </div>
              
              {/* Service Selection Buttons */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                {services.map((service) => {
                  const Icon = service.icon;
                  const colors = {
                    talk: 'from-blush-pink to-peach',
                    advice: 'from-soft-mint to-peach',
                    journal: 'from-lavender to-blush-pink',
                    compliment: 'from-peach to-blush-pink',
                    style: 'from-blush-pink to-lavender',
                    soft: 'from-peach to-lavender',
                    oracle: 'from-lavender to-soft-mint'
                  };
                  
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        setSelectedService(service.id);
                        setInput('');
                        setResult('');
                        setSelectedCards([]);
                      }}
                      className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 transform hover:scale-105 flex items-center space-x-1 sm:space-x-2 ${
                        selectedService === service.id
                          ? `bg-gradient-to-r ${colors[service.id as keyof typeof colors]} text-white shadow-lg`
                          : 'bg-white/50 text-gray-600 hover:bg-white/70 hover:text-gray-800'
                      }`}
                    >
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{t(service.titleKey)}</span>
                    </button>
                  );
                })}
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600 text-center text-xs sm:text-sm mb-4 px-2">
                  {t(currentService.descriptionKey)}
                </p>
                
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t(currentService.placeholderKey)}
                  className="w-full h-24 sm:h-32 px-3 sm:px-4 py-2 sm:py-3 bg-white/50 border border-white/20 rounded-xl text-gray-700 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blush-pink/50 focus:border-transparent backdrop-blur-sm text-sm sm:text-base"
                  disabled={isLoading}
                />
                
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || remaining === 0}
                  className="relative w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-blush-pink to-peach text-white rounded-xl font-semibold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-blush-pink/90 hover:to-peach/90 transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2 shadow-lg shadow-blush-pink/25 overflow-hidden group"
                >
                  {/* Sparkle effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute top-2 left-4 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                    <div className="absolute top-4 right-6 w-0.5 h-0.5 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute bottom-3 left-8 w-1.5 h-1.5 bg-pink-300 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                  </div>
                  
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span>
                        {(() => {
                          const loadingMessages = t('interactive.buttons.loadingMessages');
                          const messages = Array.isArray(loadingMessages) ? loadingMessages : [t('interactive.buttons.loading')];
                          return messages[currentLoadingMessageIndex] || t('interactive.buttons.loading');
                        })()}
                      </span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>
                        {remaining > 0 ? t('interactive.buttons.submit') : (usage.isAnonymous ? t('interactive.buttons.register') : t('interactive.buttons.limitReached'))}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Results */}
          {(isLoading || result || selectedCards.length > 0) && (
            <div className="mt-6 sm:mt-8 bg-creamy-white/50 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-6 lg:p-8">
              <h4 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4">{t('interactive.results.title')}</h4>
              
              {selectedCards.length > 0 && (
                <div className="mb-6">
                  <h5 className="text-md font-medium text-blush-pink mb-3">{t('interactive.results.selectedCards')}</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {selectedCards.map((card, index) => (
                      <div 
                        key={card.name} 
                        className="text-center animate-card-fade-in-slide-up"
                        style={{ animationDelay: `${index * 0.15}s` }}
                      >
                        <div className="relative group">
                          <img
                            src={card.imageUrl}
                            alt={card.displayName}
                            className="w-full max-w-[250px] mx-auto rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://via.placeholder.com/200x350/F1C4D9/ffffff?text=${encodeURIComponent(card.displayName)}`;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-blush-pink/60 via-transparent to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mt-2 font-medium">
                          {card.displayName}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-blush-pink/20 rounded animate-pulse"></div>
                  <div className="h-4 bg-lavender/20 rounded animate-pulse"></div>
                  <div className="h-4 bg-peach/20 rounded w-3/4 animate-pulse"></div>
                </div>
              ) : result && (
                <>
                  <div 
                    className="text-gray-600 leading-relaxed text-sm sm:text-base prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: result }}
                  />
                  
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={handleCopyText}
                      className="px-4 py-2 bg-white/50 hover:bg-white/70 border border-gray-200 rounded-lg text-gray-600 hover:text-gray-800 transition-all duration-200 flex items-center space-x-2 text-sm"
                    >
                      {copySuccess ? (
                        <>
                          <Check className="w-4 h-4 text-green-400" />
                          <span className="text-green-400">{t('interactive.buttons.copied')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>{t('interactive.buttons.copy')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Модальное окно аутентификации */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </section>
  );
};