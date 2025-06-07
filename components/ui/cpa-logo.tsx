import React from 'react';
import Image from 'next/image';
import { LOGOS } from '@/lib/supabase-storage';

export const CPALogo: React.FC = () => {
  return (
    <div className="flex items-center">
      <Image
        src={LOGOS.navbar}
        alt="Circuito de Pádel Amateur"
        width={240}
        height={64}
        className="h-16 w-auto"
        priority
      />
    </div>
  );
};

export default CPALogo;