import { useEffect } from 'react';

export const CursorTracker: React.FC = () => {
  useEffect(() => {
    const updateCursor = (e: MouseEvent) => {
      const cursor = document.body;
      cursor.style.setProperty('--cursor-x', `${e.clientX}px`);
      cursor.style.setProperty('--cursor-y', `${e.clientY}px`);
    };

    document.addEventListener('mousemove', updateCursor);
    
    return () => {
      document.removeEventListener('mousemove', updateCursor);
    };
  }, []);

  return null;
};