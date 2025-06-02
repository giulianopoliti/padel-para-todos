import React from 'react';

export const CPALogo: React.FC = () => {
  return (
    <div className="flex items-center">
      <div className="relative">
        {/* Padel racket shape */}
        <svg width="48" height="48" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Racket head - rounded shape */}
          <path 
            d="M20 20 C20 10, 80 10, 80 20 C95 35, 95 65, 80 80 C80 90, 20 90, 20 80 C5 65, 5 35, 20 20 Z" 
            fill="#2563eb"
            stroke="#1d4ed8"
            strokeWidth="4"
          />
          
          {/* Racket handle */}
          <rect x="45" y="90" width="10" height="30" fill="#1d4ed8" />

          {/* Racket strings - horizontal */}
          <path d="M25 30 L75 30" stroke="white" strokeWidth="1.5" opacity="0.8" />
          <path d="M25 40 L75 40" stroke="white" strokeWidth="1.5" opacity="0.8" />
          <path d="M25 50 L75 50" stroke="white" strokeWidth="1.5" opacity="0.8" />
          <path d="M25 60 L75 60" stroke="white" strokeWidth="1.5" opacity="0.8" />
          <path d="M25 70 L75 70" stroke="white" strokeWidth="1.5" opacity="0.8" />
          
          {/* Racket strings - vertical */}
          <path d="M30 25 L30 75" stroke="white" strokeWidth="1.5" opacity="0.8" />
          <path d="M40 25 L40 75" stroke="white" strokeWidth="1.5" opacity="0.8" />
          <path d="M50 25 L50 75" stroke="white" strokeWidth="1.5" opacity="0.8" />
          <path d="M60 25 L60 75" stroke="white" strokeWidth="1.5" opacity="0.8" />
          <path d="M70 25 L70 75" stroke="white" strokeWidth="1.5" opacity="0.8" />
        </svg>
        
        {/* CPA text overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold text-sm tracking-tight">CPA</span>
        </div>
      </div>
      
      {/* Text to the right */}
      <div className="ml-3 flex flex-col">
        <span className="text-white text-sm font-medium leading-tight tracking-wide">Circuito de</span>
        <span className="text-white text-sm font-medium leading-tight tracking-wide">Pádel Amateur</span>
      </div>
    </div>
  );
};

export default CPALogo;