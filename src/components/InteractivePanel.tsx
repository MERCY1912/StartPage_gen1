import React, { useState } from 'react';
import { Send, Loader2, Copy, Check, HelpCircle, MessageSquare, BookOpen, Smile, Sparkles, User, Feather, Wind, Heart, Brain, ShoppingBag, Coffee, Star } from 'lucide-react';
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
    id: 'daily_boost',
    icon: Star,
    titleKey: 'interactive.services.daily_boost.title',
    descriptionKey: 'interactive.services.daily_boost.description',
    placeholderKey: 'interactive.services.daily_boost.placeholder'
  },
  {
    id: 'ask_anything',
    icon: Brain,
    titleKey: 'interactive.services.ask_anything.title',
    descriptionKey: 'interactive.services.ask_anything.description',
    placeholderKey: 'interactive.services.ask_anything.placeholder'
  },
  {
    id: 'style_guide',
    icon: ShoppingBag,
    titleKey: 'interactive.services.style_guide.title',
    descriptionKey: 'interactive.services.style_guide.description',
    placeholderKey: 'interactive.services.style_guide.placeholder'
  },
  {
    id: 'heart_talk',
    icon: Heart,
    titleKey: 'interactive.services.heart_talk.title',
    descriptionKey: 'interactive.services.heart_talk.description',
    placeholderKey: 'interactive.services.heart_talk.placeholder'
  },
  {
    id: 'glow_up_plan',
    icon: Sparkles,
    titleKey: 'interactive.services.glow_up_plan.title',
    descriptionKey: 'interactive.services.glow_up_plan.description',
    placeholderKey: 'interactive.services.glow_up_plan.placeholder'
  },
  {
    id: 'tea_gossip',
    icon: Coffee,
    titleKey: 'interactive.services.tea_gossip.title',
    descriptionKey: 'interactive.services.tea_gossip.description',
    placeholderKey: 'interactive.services.tea_gossip.placeholder'
  }
];

export const InteractivePanel: React.FC = () => {
  const { t } = useLanguage();
  const [selectedService, setSelectedService] = useState<string>('daily_boost');
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
      daily_boost: meowModeEnabled ? import.meta.env.VITE_N8N_WEBHOOK_DAILY_BOOST_MEOW : import.meta.env.VITE_N8N_WEBHOOK_DAILY_BOOST,
      ask_anything: meowModeEnabled ? import.meta.env.VITE_N8N_WEBHOOK_ASK_ANYTHING_MEOW : import.meta.env.VITE_N8N_WEBHOOK_ASK_ANYTHING,
      style_guide: meowModeEnabled ? import.meta.env.VITE_N8N_WEBHOOK_STYLE_GUIDE_MEOW : import.meta.env.VITE_N8N_WEBHOOK_STYLE_GUIDE,
      heart_talk: meowModeEnabled ? import.meta.env.VITE_N8N_WEBHOOK_HEART_TALK_MEOW : import.meta.env.VITE_N8N_WEBHOOK_HEART_TALK,
      glow_up_plan: meowModeEnabled ? import.meta.env.VITE_N8N_WEBHOOK_GLOW_UP_PLAN_MEOW : import.meta.env.VITE_N8N_WEBHOOK_GLOW_UP_PLAN,
      tea_gossip: meowModeEnabled ? import.meta.env.VITE_N8N_WEBHOOK_TEA_GOSSIP_MEOW : import.meta.env.VITE_N8N_WEBHOOK_TEA_GOSSIP,
    };
    
    return webhookUrls[serviceId as keyof typeof webhookUrls] || webhookUrls.daily_boost;
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
            <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-bubblegum-pink" />
                <span className="text-black">Loading...</span>
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
            <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
              <h3 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-6 text-center">
                {t('interactive.title')}
              </h3>
              
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
                          ? 'bg-bubblegum-pink text-white shadow-lg'
                          : 'bg-white/50 text-black hover:bg-white/70'
                      }`}
                    >
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{t(service.titleKey)}</span>
                    </button>
                  );
                })}
              </div>
              
              <div className="space-y-4">
                <p className="text-black text-center text-xs sm:text-sm mb-4 px-2">
                  {t(currentService.descriptionKey)}
                </p>
                
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t(currentService.placeholderKey)}
                  className="w-full h-24 sm:h-32 px-3 sm:px-4 py-2 sm:py-3 bg-white/50 border border-bubblegum-pink rounded-xl text-black placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-bubblegum-pink focus:border-transparent backdrop-blur-sm text-sm sm:text-base"
                  disabled={isLoading}
                />
                
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || remaining === 0}
                  className="relative w-full py-3 sm:py-4 px-4 sm:px-6 bg-bubblegum-pink text-white rounded-xl font-semibold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bubblegum-pink/90 transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2 shadow-lg"
                >
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
            <div className="mt-6 sm:mt-8 bg-white/50 backdrop-blur-md rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
              <h4 className="text-lg sm:text-xl font-bold text-black mb-4">{t('interactive.results.title')}</h4>
              
              {selectedCards.length > 0 && (
                <div className="mb-6">
                  <h5 className="text-md font-medium text-bubblegum-pink mb-3">{t('interactive.results.selectedCards')}</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {selectedCards.map((card, index) => (
                      <div 
                        key={card.name} 
                        className="text-center"
                      >
                        <div className="relative group">
                          <img
                            src={card.imageUrl}
                            alt={card.displayName}
                            className="w-full max-w-[250px] mx-auto rounded-lg shadow-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://via.placeholder.com/200x350/FFC1CC/000000?text=${encodeURIComponent(card.displayName)}`;
                            }}
                          />
                        </div>
                        <p className="text-xs sm:text-sm text-black mt-2 font-medium">
                          {card.displayName}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-bubblegum-pink/20 rounded animate-pulse"></div>
                  <div className="h-4 bg-lavender/20 rounded animate-pulse"></div>
                  <div className="h-4 bg-bright-peach/20 rounded w-3/4 animate-pulse"></div>
                </div>
              ) : result && (
                <>
                  <div 
                    className="text-black leading-relaxed text-sm sm:text-base prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: result }}
                  />
                  
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={handleCopyText}
                      className="px-4 py-2 bg-white/50 hover:bg-white/70 border border-gray-200 rounded-lg text-black hover:text-black transition-all duration-200 flex items-center space-x-2 text-sm"
                    >
                      {copySuccess ? (
                        <>
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-green-500">{t('interactive.buttons.copied')}</span>
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