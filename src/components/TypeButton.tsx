import React from 'react';

const typeColors: Record<string, string> = {
  normal: 'bg-gray-400',
  fire: 'bg-red-500',
  water: 'bg-blue-500',
  electric: 'bg-yellow-400',
  grass: 'bg-green-500',
  ice: 'bg-blue-300',
  fighting: 'bg-red-700',
  poison: 'bg-purple-500',
  ground: 'bg-yellow-600',
  flying: 'bg-indigo-300',
  psychic: 'bg-pink-500',
  bug: 'bg-lime-500',
  rock: 'bg-yellow-800',
  ghost: 'bg-purple-700',
  dragon: 'bg-indigo-600',
  dark: 'bg-gray-800',
  steel: 'bg-gray-500',
  fairy: 'bg-pink-300',
};

interface Props {
  type: string;
  onClick?: (type: string) => void;
  disabled?: boolean;
}

export const TypeButton: React.FC<Props> = ({ type, onClick, disabled }) => {
  const color = typeColors[type] || 'bg-gray-500';
  return (
    <button
      onClick={() => onClick?.(type)}
      disabled={disabled}
      className={`${color} text-white font-pokemon text-xs md:text-sm py-3 px-4 rounded shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-[0_0px_0_rgba(0,0,0,0.2)] active:translate-y-1 transition-all uppercase w-full ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'}`}
    >
      {type}
    </button>
  );
};