import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  icon: Icon,
  title,
  description,
  isSelected,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-2xl backdrop-blur-md border transition-all duration-300 transform hover:scale-105 text-left w-full ${
        isSelected
          ? 'bg-white/10 border-purple-400/50 shadow-lg shadow-purple-500/20'
          : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-purple-400/30'
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
        isSelected 
          ? 'bg-gradient-to-br from-purple-500 to-blue-500' 
          : 'bg-gradient-to-br from-slate-600 to-slate-700'
      }`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-300 text-sm leading-relaxed">{description}</p>
    </button>
  );
};