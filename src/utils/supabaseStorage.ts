import { supabase } from '../supabaseClient';

export interface TarotCard {
  name: string;
  displayName: string;
  imageUrl: string;
}

/**
 * Получает список всех карт таро из таблицы Cards
 */
export const getTarotCardsList = async (): Promise<TarotCard[]> => {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('name, image_url')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching tarot cards from database:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('No cards found in database');
      return [];
    }

    // Преобразуем данные из базы в объекты TarotCard
    const cards: TarotCard[] = data.map(card => ({
      name: card.name,
      displayName: formatCardName(card.name),
      imageUrl: card.image_url
    }));

    return cards;
  } catch (error) {
    console.error('Error in getTarotCardsList from database:', error);
    return [];
  }
};

/**
 * Случайно выбирает указанное количество уникальных карт
 * Предотвращает выбор карт с одинаковыми базовыми названиями (например, the_devil и the_devil_reversed)
 */
export const selectRandomCards = (cards: TarotCard[], count: number = 3): TarotCard[] => {
  if (cards.length === 0) return [];
  
  const selectedCards: TarotCard[] = [];
  const usedBaseNames = new Set<string>();
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  
  for (const card of shuffled) {
    if (selectedCards.length >= count) break;
    
    const baseName = getBaseName(card.name);
    if (!usedBaseNames.has(baseName)) {
      selectedCards.push(card);
      usedBaseNames.add(baseName);
    }
  }
  
  return selectedCards;
};

/**
 * Извлекает базовое название карты, удаляя суффикс _reversed
 */
const getBaseName = (cardName: string): string => {
  return cardName.replace(/_reversed$/, '');
};

/**
 * Форматирует название карты для отображения
 */
export const formatCardName = (cardName: string): string => {
  return cardName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};