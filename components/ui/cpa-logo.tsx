import React from 'react';
import Image from 'next/image';

export const CPALogo: React.FC = () => {
  return (
    <div className="flex items-center">
      <Image
        src="/Logo Navbar.svg"
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